const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL 连接池 (跨机连接 100.84.187.111 数据库服务器)
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '100.84.187.111',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Pckpl,888',
    database: process.env.MYSQL_DATABASE || 'file_manage_security',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+08:00'
});

// 初始化数据表
(async function initTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bible_user (
              id INT AUTO_INCREMENT PRIMARY KEY,
              openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信唯一标识',
              nickname VARCHAR(100) DEFAULT '' COMMENT '微信昵称',
              avatar VARCHAR(500) DEFAULT '' COMMENT '微信头像URL',
              is_whitelist INT DEFAULT 0 COMMENT '超级白名单',
              last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最近登录时间',
              create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
              INDEX idx_openid (openid)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户主表';
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bible_user_plan (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL COMMENT '关联 bible_user.id',
              plan_json LONGTEXT COMMENT '完整的读经计划 JSON',
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
              UNIQUE KEY uk_user (user_id),
              FOREIGN KEY (user_id) REFERENCES bible_user(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户读经计划云端存储';
        `);
        console.log('[Init] 用户主表与云端计划表就绪');
    } catch (e) {
        console.error('[Init] 表初始化失败:', e);
    }
})();

function parseShowPlay(raw) {
    if (raw === null || raw === undefined) return false;
    if (Buffer.isBuffer(raw)) {
        raw = raw.toString('utf8');
    }
    const str = String(raw).trim();
    return str === '1' || str.toLowerCase() === 'true';
}

// 通用成功响应
const ok = (res, data = null, msg = 'success') => {
    return res.json({ code: 0, msg, data });
};

// 通用错误响应
const fail = (res, msg = 'error', code = 500) => {
    return res.status(200).json({ code, msg });
};

// 经文与音频服务端审核熔断门禁：审核期彻底物理断供！
const bibleAuditCutoff = async (req, res, next) => {
    try {
        // 白名单特权检查：如果传了 openid 并且在数据库里 is_whitelist = 1，直接无视审核模式
        const openid = req.query.openid || req.headers['x-openid'] || req.body?.openid;
        if (openid) {
            const [users] = await pool.query('SELECT is_whitelist FROM bible_user WHERE openid = ? LIMIT 1', [openid]);
            if (users.length > 0 && users[0].is_whitelist === 1) {
                // 白名单用户，直接放行
                return next();
            }
        }

        // 普通用户检查全局状态
        const [rows] = await pool.query('SELECT show_play FROM poems_setting LIMIT 1');
        const showPlay = rows.length > 0 ? parseShowPlay(rows[0].show_play) : false;
        if (!showPlay) {
            console.warn(`[AuditCutoff] 审核期拒绝下发经文数据: ${req.originalUrl}`);
            return res.status(404).json({ code: 404, msg: 'Not Found' });
        }
    } catch (e) {
        return res.status(404).json({ code: 404, msg: 'Not Found' });
    }
    next();
};

// 静态资源与 H5 托管 (对经文和经文音频实施物理熔断)
app.use('/bak/bible-mp3-cn', bibleAuditCutoff);
app.use('/bak', express.static(process.env.STATIC_BAK_PATH || path.join(__dirname, '../bak')));
app.use('/h5', express.static(process.env.STATIC_H5_PATH || path.join(__dirname, '../dist/build/h5')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ==========================================
// 1. 诗歌兼容接口 (兼容旧 renren-api 路径与新 API 路径)
// ==========================================
const poemsRouter = express.Router();

poemsRouter.get('/setting', async (req, res) => {
    try {
        const openid = req.query.openid;
        let isWhitelist = false;
        if (openid) {
            const [users] = await pool.query('SELECT is_whitelist FROM bible_user WHERE openid = ? LIMIT 1', [openid]);
            if (users.length > 0 && users[0].is_whitelist === 1) {
                isWhitelist = true;
                console.log(`[Setting] 命中超级白名单用户: ${openid}，直接放行全量圣经与诗歌内容`);
            }
        }

        const [rows] = await pool.query('SELECT show_play FROM poems_setting LIMIT 1');
        const globalShowPlay = rows.length > 0 ? parseShowPlay(rows[0].show_play) : false;
        const showPlay = isWhitelist ? true : globalShowPlay;
        return ok(res, { showPlay, isWhitelist });
    } catch (e) {
        console.error('getSetting error:', e);
        return ok(res, { showPlay: false });
    }
});

// 更新设置 (兼容后台 PUT/POST /poems/setting)
const updateSettingHandler = async (req, res) => {
    try {
        let showPlayVal = req.body?.showPlay;
        if (showPlayVal === undefined && req.query?.showPlay !== undefined) {
            showPlayVal = req.query.showPlay;
        }
        const isTrue = (showPlayVal === true || showPlayVal === 'true' || showPlayVal === 1 || showPlayVal === '1');
        const showPlayStr = isTrue ? '1' : '0';

        await pool.query('UPDATE poems_setting SET show_play = ? WHERE id = 1', [showPlayStr]);
        console.log(`[Setting] showPlay updated to: ${showPlayStr}`);
        const modeDesc = isTrue ? '诗歌与播放模式 (曲目已开启)' : '百城风景图片模式 (诗歌已隐藏)';
        return ok(res, { showPlay: isTrue, mode: modeDesc }, '设置更新成功');
    } catch (e) {
        console.error('updateSetting error:', e);
        return fail(res, e.message);
    }
};
poemsRouter.put('/setting', updateSettingHandler);
poemsRouter.post('/setting', updateSettingHandler);

// 快捷切换模式 (可在浏览器/快捷指令中直接点击执行)
poemsRouter.get('/setting/switch', async (req, res) => {
    try {
        const isTrue = (req.query.showPlay === '1' || req.query.showPlay === 'true');
        const showPlayStr = isTrue ? '1' : '0';
        await pool.query('UPDATE poems_setting SET show_play = ? WHERE id = 1', [showPlayStr]);
        const modeDesc = isTrue ? '诗歌与播放模式 (曲目已开启)' : '百城风景图片模式 (诗歌已隐藏)';
        return ok(res, { showPlay: isTrue, mode: modeDesc }, `已切换为：${modeDesc}`);
    } catch (e) {
        return fail(res, e.message);
    }
});

// 快捷一键反转模式
poemsRouter.get('/setting/toggle', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT show_play FROM poems_setting LIMIT 1');
        const current = rows.length > 0 ? parseShowPlay(rows[0].show_play) : false;
        const nextVal = current ? '0' : '1';
        const isTrue = nextVal === '1';
        await pool.query('UPDATE poems_setting SET show_play = ? WHERE id = 1', [nextVal]);
        const modeDesc = isTrue ? '诗歌与播放模式 (曲目已开启)' : '百城风景图片模式 (诗歌已隐藏)';
        return ok(res, { showPlay: isTrue, mode: modeDesc }, `已切换为：${modeDesc}`);
    } catch (e) {
        return fail(res, e.message);
    }
});

poemsRouter.get('/poem/:poemNo', async (req, res) => {
    const { poemNo } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM poems WHERE poem_no = ? LIMIT 1', [poemNo]);
        if (rows.length === 0) {
            return fail(res, '诗词未找到', 404);
        }
        const row = rows[0];
        return ok(res, {
            id: row.id,
            poemNo: row.poem_no,
            title: row.title,
            mp3Url: row.mp3_url,
            picList: row.pic_list,
            content: row.content
        });
    } catch (e) {
        console.error('getPoemByNo error:', e);
        return fail(res, e.message);
    }
});

poemsRouter.get('/list', async (req, res) => {
    const poemNo = req.query.poemNo || '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    try {
        let sql = 'SELECT id, poem_no, title, mp3_url, pic_list FROM poems';
        let params = [];
        if (poemNo) {
            sql += ' WHERE poem_no LIKE ?';
            params.push(`%${poemNo}%`);
        }
        sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(sql, params);
        const mapped = rows.map(r => ({
            id: r.id,
            poemNo: r.poem_no,
            title: r.title,
            mp3Url: r.mp3_url,
            picList: r.pic_list
        }));
        return ok(res, mapped);
    } catch (e) {
        console.error('getPoemList error:', e);
        return fail(res, e.message);
    }
});

// 注册诗歌路由 (兼容各种前缀)
app.use('/api/renren-api/api/poems', poemsRouter);
app.use('/renren-api/api/poems', poemsRouter);
app.use('/api/poems', poemsRouter);
app.use('/poems', poemsRouter);

// ==========================================
// 2. 圣经读经小队与打卡接口
// ==========================================
const bibleRouter = express.Router();

function generateTeamCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 创队
bibleRouter.post('/team/create', async (req, res) => {
    const { teamName, openid, nickname, avatar, targetWordsDaily = 5000, notice = '同心同行，每日与神亲近' } = req.body;
    if (!teamName || !openid) {
        return fail(res, '小队名称和用户 openid 必填');
    }

    try {
        let teamCode = generateTeamCode();
        let inserted = false;
        let teamId = 0;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const [result] = await pool.query(
                    'INSERT INTO bible_team (team_name, team_code, creator_openid, target_words_daily, notice) VALUES (?, ?, ?, ?, ?)',
                    [teamName.trim(), teamCode, openid, targetWordsDaily, notice]
                );
                teamId = result.insertId;
                inserted = true;
                break;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    teamCode = generateTeamCode();
                } else {
                    throw err;
                }
            }
        }

        if (!inserted) {
            return fail(res, '队伍创建失败，请重试');
        }

        await pool.query(
            'INSERT INTO bible_team_member (team_id, openid, nickname, avatar, role) VALUES (?, ?, ?, ?, "LEADER")',
            [teamId, openid, nickname || '队长', avatar || '']
        );

        return ok(res, {
            teamId,
            teamName,
            teamCode,
            creatorOpenid: openid,
            targetWordsDaily,
            notice
        }, '小队创建成功');
    } catch (e) {
        console.error('team create error:', e);
        return fail(res, e.message);
    }
});

// 入队
bibleRouter.post('/team/join', async (req, res) => {
    const { teamCode, openid, nickname, avatar } = req.body;
    if (!teamCode || !openid) {
        return fail(res, '邀请码和 openid 必填');
    }

    try {
        const [teams] = await pool.query('SELECT * FROM bible_team WHERE team_code = ? LIMIT 1', [teamCode.toUpperCase().trim()]);
        if (teams.length === 0) {
            return fail(res, '邀请码无效或小队不存在', 404);
        }
        const team = teams[0];

        await pool.query(
            `INSERT INTO bible_team_member (team_id, openid, nickname, avatar, role)
             VALUES (?, ?, ?, ?, 'MEMBER')
             ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), avatar = VALUES(avatar)`,
            [team.id, openid, nickname || '读经同伴', avatar || '']
        );

        return ok(res, {
            teamId: team.id,
            teamName: team.team_name,
            teamCode: team.team_code,
            notice: team.notice
        }, '成功加入小队');
    } catch (e) {
        console.error('team join error:', e);
        return fail(res, e.message);
    }
});

// 获取小队信息、天梯榜、打卡动态流
bibleRouter.get('/team/info', async (req, res) => {
    const { teamId, teamCode, openid } = req.query;

    try {
        let team = null;
        if (teamId) {
            const [t1] = await pool.query('SELECT * FROM bible_team WHERE id = ?', [teamId]);
            if (t1.length > 0) team = t1[0];
        } else if (teamCode) {
            const [t2] = await pool.query('SELECT * FROM bible_team WHERE team_code = ?', [teamCode.toUpperCase().trim()]);
            if (t2.length > 0) team = t2[0];
        } else if (openid) {
            const [m] = await pool.query('SELECT team_id FROM bible_team_member WHERE openid = ? ORDER BY id DESC LIMIT 1', [openid]);
            if (m.length > 0) {
                const [t3] = await pool.query('SELECT * FROM bible_team WHERE id = ?', [m[0].team_id]);
                if (t3.length > 0) team = t3[0];
            }
        }

        if (!team) {
            return fail(res, '未找到小队信息', 404);
        }

        const tId = team.id;

        const [members] = await pool.query(
            `SELECT m.id, m.openid, m.nickname, m.avatar, m.role, m.join_time,
                    COALESCE(today_stat.today_words, 0) AS today_words,
                    COALESCE(week_stat.week_words, 0) AS week_words
             FROM bible_team_member m
             LEFT JOIN (
                 SELECT openid, SUM(words_read) AS today_words
                 FROM bible_checkin_record
                 WHERE team_id = ? AND checkin_date = CURDATE()
                 GROUP BY openid
             ) today_stat ON m.openid = today_stat.openid
             LEFT JOIN (
                 SELECT openid, SUM(words_read) AS week_words
                 FROM bible_checkin_record
                 WHERE team_id = ? AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY openid
             ) week_stat ON m.openid = week_stat.openid
             WHERE m.team_id = ?
             ORDER BY today_words DESC, week_words DESC`,
            [tId, tId, tId]
        );

        const [records] = await pool.query(
            `SELECT r.id, r.openid, m.nickname, m.avatar, r.checkin_date, r.words_read, r.duration_seconds, r.chapters_finished, r.reflection, r.create_time
             FROM bible_checkin_record r
             LEFT JOIN bible_team_member m ON r.openid = m.openid AND m.team_id = r.team_id
             WHERE r.team_id = ?
             ORDER BY r.id DESC LIMIT 25`,
            [tId]
        );

        const totalTodayWords = members.reduce((sum, item) => sum + Number(item.today_words || 0), 0);
        const targetWords = team.target_words_daily || 5000;
        const completionRate = Math.min(100, Math.round((totalTodayWords / targetWords) * 100));

        return ok(res, {
            team: {
                id: team.id,
                teamName: team.team_name,
                teamCode: team.team_code,
                creatorOpenid: team.creator_openid,
                targetWordsDaily: team.target_words_daily,
                notice: team.notice,
                createTime: team.create_time
            },
            stats: {
                memberCount: members.length,
                totalTodayWords,
                targetWords,
                completionRate
            },
            members: members.map(m => ({
                openid: m.openid,
                nickname: m.nickname,
                avatar: m.avatar,
                role: m.role,
                todayWords: Number(m.today_words),
                weekWords: Number(m.week_words),
                isFinishedToday: Number(m.today_words) > 0
            })),
            activityFeed: records.map(r => ({
                id: r.id,
                openid: r.openid,
                nickname: r.nickname || '同路人',
                avatar: r.avatar || '',
                wordsRead: r.words_read,
                durationMinutes: Math.round(r.duration_seconds / 60),
                chaptersFinished: r.chapters_finished || '',
                reflection: r.reflection || '',
                createTime: r.create_time
            }))
        });
    } catch (e) {
        console.error('team info error:', e);
        return fail(res, e.message);
    }
});

// 打卡
bibleRouter.post('/team/checkin', async (req, res) => {
    const {
        teamId,
        openid,
        nickname,
        avatar,
        wordsRead = 0,
        durationSeconds = 0,
        chaptersFinished = '',
        reflection = ''
    } = req.body;

    if (!openid || !wordsRead) {
        return fail(res, 'openid 和打卡字数必填');
    }

    try {
        let actualTeamId = teamId ? parseInt(teamId) : null;
        if (actualTeamId) {
            await pool.query(
                `INSERT INTO bible_team_member (team_id, openid, nickname, avatar, role)
                 VALUES (?, ?, ?, ?, 'MEMBER')
                 ON DUPLICATE KEY UPDATE nickname = COALESCE(VALUES(nickname), nickname), avatar = COALESCE(VALUES(avatar), avatar)`,
                [actualTeamId, openid, nickname || '读经人', avatar || '']
            );
        }

        const [result] = await pool.query(
            `INSERT INTO bible_checkin_record (team_id, openid, checkin_date, words_read, duration_seconds, chapters_finished, reflection)
             VALUES (?, ?, CURDATE(), ?, ?, ?, ?)`,
            [actualTeamId, openid, wordsRead, durationSeconds, chaptersFinished, reflection]
        );

        const [todaySum] = await pool.query(
            'SELECT SUM(words_read) AS today_total FROM bible_checkin_record WHERE openid = ? AND checkin_date = CURDATE()',
            [openid]
        );

        return ok(res, {
            checkinId: result.insertId,
            todayTotalWords: Number(todaySum[0]?.today_total || wordsRead)
        }, '打卡记录已同步至云端');
    } catch (e) {
        console.error('checkin error:', e);
        return fail(res, e.message);
    }
});

// 个人历史打卡
bibleRouter.get('/my-stats', async (req, res) => {
    const { openid } = req.query;
    if (!openid) return fail(res, 'openid 必填');

    try {
        const [totalStats] = await pool.query(
            `SELECT COUNT(DISTINCT checkin_date) AS total_checkin_days,
                    COALESCE(SUM(words_read), 0) AS total_words,
                    COALESCE(SUM(duration_seconds), 0) AS total_duration_seconds
             FROM bible_checkin_record
             WHERE openid = ?`,
            [openid]
        );

        const [recentList] = await pool.query(
            `SELECT id, checkin_date, words_read, duration_seconds, chapters_finished, reflection, create_time
             FROM bible_checkin_record
             WHERE openid = ?
             ORDER BY id DESC LIMIT 14`,
            [openid]
        );

        return ok(res, {
            summary: {
                totalDays: Number(totalStats[0].total_checkin_days),
                totalWords: Number(totalStats[0].total_words),
                totalMinutes: Math.round(Number(totalStats[0].total_duration_seconds) / 60)
            },
            recentRecords: recentList
        });
    } catch (e) {
        console.error('my-stats error:', e);
        return fail(res, e.message);
    }
});

// ==========================================
// 3. 用户数据与云端计划同步 (不受审核期门禁限制)
// ==========================================
const userRouter = express.Router();

userRouter.post('/plan/sync', async (req, res) => {
    const { openid, planJson } = req.body;
    if (!openid || !planJson) return fail(res, '参数缺失');
    
    try {
        const [users] = await pool.query('SELECT id FROM bible_user WHERE openid = ?', [openid]);
        if (users.length === 0) return fail(res, '用户不存在');
        const userId = users[0].id;
        
        await pool.query(
            `INSERT INTO bible_user_plan (user_id, plan_json) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE plan_json = VALUES(plan_json)`,
            [userId, JSON.stringify(planJson)]
        );
        return ok(res, { updatedAt: new Date().toISOString() }, '计划同步成功');
    } catch (e) {
        console.error('plan sync error:', e);
        return fail(res, e.message);
    }
});

userRouter.get('/plan/pull', async (req, res) => {
    const { openid } = req.query;
    if (!openid) return fail(res, '参数缺失');
    
    try {
        const [users] = await pool.query('SELECT id FROM bible_user WHERE openid = ?', [openid]);
        if (users.length === 0) return ok(res, { plan: null });
        const userId = users[0].id;
        
        const [plans] = await pool.query('SELECT plan_json, updated_at FROM bible_user_plan WHERE user_id = ?', [userId]);
        if (plans.length > 0) {
            let planObj = plans[0].plan_json;
            if (typeof planObj === 'string') {
                try { planObj = JSON.parse(planObj); } catch(e){}
            }
            return ok(res, { plan: planObj, updatedAt: plans[0].updated_at });
        }
        return ok(res, { plan: null });
    } catch (e) {
        console.error('plan pull error:', e);
        return fail(res, e.message);
    }
});

userRouter.post('/user/profile', async (req, res) => {
    const { openid, nickname, avatar } = req.body;
    if (!openid) return fail(res, '缺少openid');
    
    try {
        const isTempAvatar = avatar && (avatar.startsWith('wxfile://') || avatar.startsWith('http://tmp/'));
        if (isTempAvatar) {
            console.warn(`[Profile] 拦截到临时沙盒头像协议 ${avatar}，不予持久化入库，仅更新昵称`);
            await pool.query(
                `UPDATE bible_user SET nickname = ? WHERE openid = ?`,
                [nickname || '', openid]
            );
            await pool.query(
                `UPDATE bible_team_member SET nickname = ? WHERE openid = ?`,
                [nickname || '', openid]
            );
        } else {
            await pool.query(
                `UPDATE bible_user SET nickname = ?, avatar = ? WHERE openid = ?`,
                [nickname || '', avatar || '', openid]
            );
            await pool.query(
                `UPDATE bible_team_member SET nickname = ?, avatar = ? WHERE openid = ?`,
                [nickname || '', avatar || '', openid]
            );
        }
        return ok(res, null, '更新资料成功');
    } catch (e) {
        console.error('user profile error:', e);
        return fail(res, e.message);
    }
});

// 头像上传存储配置
const avatarUploadDir = path.join(__dirname, 'public/uploads/avatars');
if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
}
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
    }
});
const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// 头像文件上传接口 (支持自动绑定 openid)
userRouter.post('/upload-avatar', avatarUpload.single('file'), async (req, res) => {
    if (!req.file) return fail(res, '未接收到上传的文件');
    const relUrl = `/uploads/avatars/${req.file.filename}`;
    const openid = req.body?.openid;
    if (openid && !openid.startsWith('mock_') && !openid.startsWith('user_') && !openid.startsWith('wx_user_')) {
        try {
            await pool.query('UPDATE bible_user SET avatar = ? WHERE openid = ?', [relUrl, openid]);
            await pool.query('UPDATE bible_team_member SET avatar = ? WHERE openid = ?', [relUrl, openid]);
            console.log(`[UploadAvatar] 用户 ${openid} 头像已持久化并入库: ${relUrl}`);
        } catch (e) {
            console.error('更新头像数据库失败:', e);
        }
    }
    return ok(res, { url: relUrl }, '头像上传成功');
});

// 挂载用户路由 (不受 bibleAuditCutoff 限制)
app.use('/bible', userRouter);
app.use('/api/bible', userRouter);

// ==========================================
// 4. 微信官方登录换取真实 OpenID 接口
// ==========================================
const wechatRouter = express.Router();
const WX_APP_ID = process.env.WX_APP_ID || 'wx9c0cb9cd7690707e';
const WX_APP_SECRET = process.env.WX_APP_SECRET || '2a853350826b40e0efaa135ed17fe80c';

wechatRouter.post('/login', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return fail(res, '缺少微信登录临时凭证 code', 400);
    }

    try {
        const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APP_ID}&secret=${WX_APP_SECRET}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
        const wxResp = await fetch(wxUrl);
        const data = await wxResp.json();

        if (data.errcode && data.errcode !== 0) {
            console.error('[Wechat Login] 微信官方接口报错:', data);
            return fail(res, data.errmsg || '微信登录失败', data.errcode);
        }

        const openid = data.openid;
        console.log(`[Wechat Login] 成功换取真实 OpenID: ${openid}`);
        
        // 自动 Upsert 用户记录
        await pool.query(
            `INSERT INTO bible_user (openid) VALUES (?)
             ON DUPLICATE KEY UPDATE last_login_at = CURRENT_TIMESTAMP`,
            [openid]
        );
        
        // 查出完整的用户信息 (包含超级白名单状态)
        const [users] = await pool.query('SELECT id, nickname, avatar, is_whitelist FROM bible_user WHERE openid = ?', [openid]);
        const user = users[0];
        const isWhitelist = Boolean(user && user.is_whitelist === 1);
        
        // 查云端计划
        const [plans] = await pool.query('SELECT plan_json FROM bible_user_plan WHERE user_id = ?', [user.id]);
        let plan = null;
        if (plans.length > 0) {
            plan = plans[0].plan_json;
            if (typeof plan === 'string') {
                try { plan = JSON.parse(plan); } catch(e){}
            }
        }
        
        // 查小队信息 (当前用户所在小队)
        const [teamMembers] = await pool.query('SELECT team_id, role FROM bible_team_member WHERE openid = ?', [openid]);
        let team = null;
        if (teamMembers.length > 0) {
            const teamId = teamMembers[0].team_id;
            const [teamInfos] = await pool.query('SELECT * FROM bible_team WHERE id = ?', [teamId]);
            if (teamInfos.length > 0) {
                team = {
                    teamId: teamInfos[0].id,
                    teamName: teamInfos[0].team_name,
                    teamCode: teamInfos[0].team_code,
                    dailyTargetWords: teamInfos[0].target_words_daily,
                    role: teamMembers[0].role
                };
            }
        }

        return ok(res, {
            openid: openid,
            unionid: data.unionid || '',
            userId: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            isWhitelist: isWhitelist,
            plan: plan,
            team: team
        }, '微信授权登录成功');
    } catch (e) {
        console.error('[Wechat Login] 请求微信异常:', e);
        return fail(res, '微信服务器连接异常: ' + e.message, 500);
    }
});

app.use('/wechat', wechatRouter);
app.use('/api/wechat', wechatRouter);
app.use('/api/bible/wechat', wechatRouter);
app.use('/bible/wechat', wechatRouter);

// 挂载圣经路由 (在审核期彻底切断，正常期完美响应)
app.use('/bible', bibleAuditCutoff, bibleRouter);
app.use('/api/bible', bibleAuditCutoff, bibleRouter);

// ==========================================
// 5. Admin 管理后台 (包含邮件验证码登录、白名单管理、伪装开关)
// ==========================================
const adminRouter = express.Router();
const mailTransporter = nodemailer.createTransport({
    host: 'smtp.126.com',
    port: 465,
    secure: true, // 使用 SSL
    auth: {
        user: 'goldwarehouse@126.com',
        pass: 'TDSQNTLWIYNSHXFX'
    }
});

// 内存中存储验证码和 Session Token (简单实现)
const emailCodeStore = new Map(); // email => { code, expireAt }
const adminTokenStore = new Set(); // 简单的 tokens 集合

// 发送验证码
adminRouter.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return fail(res, '缺少邮箱参数');

    try {
        // 去 file_manage_security.sys_user 表里查询是否是超级管理员
        // 兼容一下如果没查到 sys_user，或者数据库名不同的话，至少保证主表是存在的
        let isValidAdmin = false;
        try {
            const [users] = await pool.query('SELECT id FROM sys_user WHERE email = ? LIMIT 1', [email]);
            if (users.length > 0) isValidAdmin = true;
        } catch (e) {
            // 如果表不存在，或者跨库查不到，放个保底的硬编码邮箱，防止被锁死
            if (email === 'pengck@126.com' || email === 'goldwarehouse@126.com') {
                isValidAdmin = true;
            } else {
                throw e; // 继续抛出
            }
        }

        if (!isValidAdmin && email !== 'pengck@126.com') {
            return fail(res, '该邮箱不在管理员白名单中', 403);
        }

        // 生成 6 位数验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        emailCodeStore.set(email, {
            code,
            expireAt: Date.now() + 5 * 60 * 1000 // 5分钟过期
        });

        const mailOptions = {
            from: '"ValleyLL Admin" <goldwarehouse@126.com>',
            to: email,
            subject: '【ValleyLL】管理员登录验证码',
            text: `您的验证码是: ${code}\n该验证码 5 分钟内有效。如果这不是您的操作，请忽略此邮件。`
        };

        await mailTransporter.sendMail(mailOptions);
        return ok(res, null, '验证码已发送');
    } catch (e) {
        console.error('[Admin] 发送邮件失败:', e);
        return fail(res, '邮件发送失败: ' + e.message);
    }
});

// 验证码登录
adminRouter.post('/api/login', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return fail(res, '邮箱和验证码不能为空');

    const record = emailCodeStore.get(email);
    if (!record || record.expireAt < Date.now()) {
        return fail(res, '验证码无效或已过期', 401);
    }
    if (record.code !== code) {
        return fail(res, '验证码错误', 401);
    }

    // 验证成功，清除验证码
    emailCodeStore.delete(email);

    // 发放一个简单的 Token
    const token = crypto.randomBytes(32).toString('hex');
    adminTokenStore.add(token);

    return ok(res, { token }, '登录成功');
});

// Token 鉴权中间件
const adminAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token || !adminTokenStore.has(token)) {
        return res.status(401).json({ code: 401, msg: '未授权的访问' });
    }
    next();
};

// 获取用户列表及白名单状态
adminRouter.get('/api/users', adminAuth, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, openid, nickname, avatar, is_whitelist, last_login_at FROM bible_user ORDER BY last_login_at DESC');
        return ok(res, users);
    } catch (e) {
        return fail(res, e.message);
    }
});

// 切换某个用户的白名单状态
adminRouter.post('/api/users/whitelist', adminAuth, async (req, res) => {
    const { openid, is_whitelist } = req.body;
    try {
        await pool.query('UPDATE bible_user SET is_whitelist = ? WHERE openid = ?', [is_whitelist ? 1 : 0, openid]);
        return ok(res, null, '更新成功');
    } catch (e) {
        return fail(res, e.message);
    }
});

// 管理台直接查询当前的全局审核状态
adminRouter.get('/api/global-audit', adminAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT show_play FROM poems_setting LIMIT 1');
        const showPlay = rows.length > 0 ? parseShowPlay(rows[0].show_play) : false;
        return ok(res, { showPlay });
    } catch (e) {
        return fail(res, e.message);
    }
});

// 管理台直接切换全局审核状态
adminRouter.post('/api/global-audit', adminAuth, async (req, res) => {
    const { showPlay } = req.body;
    try {
        const showPlayStr = showPlay ? '1' : '0';
        await pool.query('UPDATE poems_setting SET show_play = ? WHERE id = 1', [showPlayStr]);
        return ok(res, null, '全局状态更新成功');
    } catch (e) {
        return fail(res, e.message);
    }
});

// 托管静态 Admin 页面
adminRouter.use(express.static(path.join(__dirname, 'public/admin')));

// 挂载 Admin 路由
app.use('/admin', adminRouter);

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'valley-service', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ValleyService] listening on port ${PORT}`);
});
