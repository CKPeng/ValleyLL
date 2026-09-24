// 用户体系与团队组团管理器
import { planManager } from './plan-manager.js';

// 严格大写枚举定义
export const LOGIN_STATUS = {
  LOGGED_OUT: 'LOGGED_OUT',
  LOGGED_IN: 'LOGGED_IN'
};

export const TEAM_ROLE = {
  LEADER: 'LEADER',
  MEMBER: 'MEMBER'
};

export const MEMBER_DAILY_STATUS = {
  UNFINISHED: 'UNFINISHED',
  FINISHED: 'FINISHED'
};

import { BIBLE_API_BASE, SERVER_HOST } from '../config.js';

export const DEFAULT_WECHAT_AVATAR = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

export function normalizeAvatarUrl(url) {
  if (!url) return DEFAULT_WECHAT_AVATAR;
  if (url.startsWith('/uploads/')) {
    return SERVER_HOST + url;
  }
  return url;
}

const USER_STORAGE_KEY = 'VALLEY_BIBLE_USER_INFO_V1';
const TEAM_STORAGE_KEY = 'VALLEY_BIBLE_TEAM_DATA_V1';

// 云端 API 基础路径 (对接已部署的轻量 Node.js 微服务)
const API_BASE = BIBLE_API_BASE;

// 获取当前时间格式 HH:mm
function getTimeString() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 获取今天日期字符串 YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 统一封装云端请求
function requestCloud(url, method = 'GET', data = {}) {
  return new Promise((resolve) => {
    uni.request({
      url: `${API_BASE}${url}`,
      method: method,
      data: data,
      timeout: 5000,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve({ success: true, data: res.data.data });
        } else {
          resolve({ success: false, msg: res.data?.msg || '网络异常' });
        }
      },
      fail: (err) => {
        console.warn(`Cloud request fail: ${url}`, err);
        resolve({ success: false, msg: '网络连接超时' });
      }
    });
  });
}

class UserTeamManager {
  constructor() {
    this.user = null;
    this.team = null;
    this.init();
  }

  init() {
    try {
      const userCached = uni.getStorageSync(USER_STORAGE_KEY);
      if (userCached) {
        this.user = typeof userCached === 'string' ? JSON.parse(userCached) : userCached;
      }
      const teamCached = uni.getStorageSync(TEAM_STORAGE_KEY);
      if (teamCached) {
        this.team = typeof teamCached === 'string' ? JSON.parse(teamCached) : teamCached;
      }
      if (this.team) {
        if (!Array.isArray(this.team.members)) this.team.members = [];
        if (!Array.isArray(this.team.activities)) this.team.activities = [];
      }
    } catch (e) {
      console.error('初始化用户或团队缓存失败', e);
    }

    // 自动清洗历史模拟账号数据，确保只认真实微信 OpenID
    if (this.user && this.user.openid && (
        this.user.openid.startsWith('mock_') || 
        this.user.openid.startsWith('user_') || 
        this.user.openid.startsWith('wx_user_')
    )) {
        console.log('[Auth] 检测到历史测试假账号，自动清除以触发微信真实官方授权:', this.user.openid);
        this.user.status = LOGIN_STATUS.LOGGED_OUT;
        this.user.openid = '';
        this.saveUser();
    }

    if (this.user && this.user.avatarUrl) {
      this.user.avatarUrl = normalizeAvatarUrl(this.user.avatarUrl);
    }

    // 默认未登录或初始化默认游客身份
    if (!this.user) {
      this.user = {
        status: LOGIN_STATUS.LOGGED_OUT,
        openid: '',
        nickname: '',
        avatarUrl: '',
        teamId: null,
        teamRole: null
      };
    }
  }

  saveUser() {
    try {
      uni.setStorageSync(USER_STORAGE_KEY, this.user);
      // 保持 VALLEY_USER_INFO 同步，确保全项目所有页面 (如 reading.vue, index.vue) 都能取到统一的 openid
      uni.setStorageSync('VALLEY_USER_INFO', this.user);
    } catch (e) {
      console.error('保存用户失败', e);
    }
  }

  saveTeam() {
    try {
      uni.setStorageSync(TEAM_STORAGE_KEY, this.team);
    } catch (e) {
      console.error('保存团队失败', e);
    }
  }

  // 判断是否已完成真实微信官方授权（排除任何 mock/假数据）
  isRealLoggedIn() {
    if (!this.user) this.init();
    if (this.user.status !== LOGIN_STATUS.LOGGED_IN) return false;
    const oid = this.user.openid || '';
    if (!oid || oid.startsWith('mock_') || oid.startsWith('user_') || oid.startsWith('wx_user_')) {
      return false;
    }
    return true;
  }

  // 强制清除授权，拉起重新授权
  forceReAuth() {
    this.user = {
      status: LOGIN_STATUS.LOGGED_OUT,
      openid: '',
      nickname: '',
      avatarUrl: '',
      teamId: null,
      teamRole: null
    };
    this.saveUser();
  }

  // 获取当前用户信息
  getUser() {
    if (!this.user) this.init();
    if (this.user && this.user.avatarUrl) {
      this.user.avatarUrl = normalizeAvatarUrl(this.user.avatarUrl);
    }
    return this.user;
  }

  // 微信授权登录（直连微信官方服务器换取真实 OpenID）
  async loginWithWechat(customNickname = '', customAvatar = '') {
    return new Promise((resolve) => {
      // #ifdef MP-WEIXIN
      uni.login({
        provider: 'weixin',
        success: async (res) => {
          if (res.code) {
            console.log('[Wechat Auth] 获取到微信临时凭证 code, 发送后端向微信官方换取真 OpenID...');
            const cloudAuth = await requestCloud('/wechat/login', 'POST', { code: res.code });
            
            if (cloudAuth.success && cloudAuth.data && cloudAuth.data.openid) {
              const { openid, userId, nickname, avatar, plan, team, isWhitelist } = cloudAuth.data;
              console.log('[Wechat Auth] 微信登录成功, 拿到全量数据:', openid, '超级白名单状态:', isWhitelist);

              // 老用户资料防丢失：优先新值，次选云端有效值，再次保留本地老有效值，绝不用默认占位符洗掉老数据
              const existingNickname = this.user && this.user.nickname && !this.user.nickname.includes('同路人') ? this.user.nickname : '';
              const resolvedNickname = customNickname || nickname || existingNickname || '微信书卷同路人';
              const rawAvatar = customAvatar || avatar || (this.user && this.user.avatarUrl ? this.user.avatarUrl : '');
              const resolvedAvatar = normalizeAvatarUrl(rawAvatar) || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

              this.user = {
                status: LOGIN_STATUS.LOGGED_IN,
                openid: openid,
                userId: userId || null,
                nickname: resolvedNickname,
                avatarUrl: resolvedAvatar,
                isWhitelist: typeof isWhitelist !== 'undefined' ? Boolean(isWhitelist) : Boolean(this.user && this.user.isWhitelist),
                teamId: team ? team.teamId : (this.user ? this.user.teamId : null),
                teamRole: team ? team.role : (this.user ? this.user.teamRole : null)
              };
              this.saveUser();
              
              // 异步同步资料到云端
              if (customNickname || customAvatar || (!nickname && resolvedNickname)) {
                  this.updateProfile(this.user.nickname, this.user.avatarUrl);
              }

              // 恢复云端读经计划（restoreFromCloud 内部已采用智能并集合并，自动保护老用户本地读经记录）
              if (plan) {
                  planManager.restoreFromCloud(plan);
                  // 合并后，将最全合集推回云端备一份
                  planManager.syncToCloud(false);
              } else {
                  // 老用户数据迁移：云端没计划，本地有计划，则强制上传一次
                  if (planManager.getPlanData()) {
                      planManager.syncToCloud(false);
                  }
              }

              // 恢复云端小队数据
              if (team) {
                  const prevMembers = (this.team && Array.isArray(this.team.members)) ? this.team.members : [];
                  const prevActivities = (this.team && Array.isArray(this.team.activities)) ? this.team.activities : [];
                  this.team = {
                      ...team,
                      members: Array.isArray(team.members) ? team.members : prevMembers,
                      activities: Array.isArray(team.activities) ? team.activities : prevActivities
                  };
                  this.saveTeam();
                  this.fetchCloudTeamInfo(team.teamCode);
              }

              const isRegistered = Boolean(nickname || (this.user && this.user.nickname && !this.user.nickname.includes('同路人')));
              resolve({ success: true, user: this.user, isRegistered });
            } else {
              console.error('[Wechat Auth] 微信官方换取 openid 失败:', cloudAuth.msg);
              resolve({ success: false, msg: cloudAuth.msg || '微信官方授权失败，请检查网络或AppSecret' });
            }
          } else {
            resolve({ success: false, msg: '获取微信 code 失败' });
          }
        },
        fail: (err) => {
          console.error('uni.login fail', err);
          resolve({ success: false, msg: '调用微信登录失败' });
        }
      });
      // #endif

      // #ifndef MP-WEIXIN
      // 非小程序环境提供快速体验
      this.doMockLogin(customNickname, customAvatar);
      resolve({ success: true, user: this.user });
      // #endif
    });
  }

  // 快速模拟登录/开发者调试模式
  doMockLogin(nickname = '', avatarUrl = '') {
    const randomId = Math.random().toString(36).substring(2, 8);
    this.user = {
      status: LOGIN_STATUS.LOGGED_IN,
      openid: 'user_' + randomId,
      nickname: nickname || ('同路人_' + randomId.toUpperCase()),
      avatarUrl: avatarUrl || `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 50)}`,
      teamId: this.user ? this.user.teamId : null,
      teamRole: this.user ? this.user.teamRole : null
    };
    this.saveUser();
  }

  // 退出登录
  logout() {
    this.user = {
      status: LOGIN_STATUS.LOGGED_OUT,
      openid: '',
      nickname: '',
      avatarUrl: '',
      teamId: null,
      teamRole: null
    };
    this.saveUser();
  }

  // 更新个人资料（微信头像、昵称组件回传）
  updateProfile(nickname, avatarUrl) {
    if (nickname) this.user.nickname = nickname;
    const isTemp = avatarUrl && (avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://'));
    if (avatarUrl && !isTemp) {
      this.user.avatarUrl = normalizeAvatarUrl(avatarUrl);
    }
    
    // 如果因没网或者其他原因离线，补一个mock id（极少情况）
    if (this.user.status === LOGIN_STATUS.LOGGED_OUT || !this.user.openid) {
      this.user.status = LOGIN_STATUS.LOGGED_IN;
      if (!this.user.openid) {
        this.user.openid = 'wx_user_' + Math.random().toString(36).substring(2, 10);
      }
    }
    this.saveUser();

    // 如果是真实的微信用户，把昵称头像同步上云（临时沙盒路径绝不上报）
    if (this.user.openid && !this.user.openid.startsWith('mock_') && !this.user.openid.startsWith('wx_user_') && !this.user.openid.startsWith('user_')) {
        requestCloud('/user/profile', 'POST', {
            openid: this.user.openid,
            nickname: this.user.nickname,
            avatar: isTemp ? undefined : this.user.avatarUrl
        });
    }

    if (this.team && this.team.members) {
      const me = this.team.members.find(m => m.openid === this.user.openid);
      if (me) {
        if (nickname) me.nickname = nickname;
        if (avatarUrl && !isTemp) me.avatarUrl = normalizeAvatarUrl(avatarUrl);
        this.saveTeam();
      }
    }
  }

  // 创建团队 (优先同步至云端 MySQL，离线自动降级本地)
  async createTeam(teamName, dailyTargetWords = 5000) {
    if (!this.user || this.user.status !== LOGIN_STATUS.LOGGED_IN) {
      this.doMockLogin('队伍创设者');
    }

    const tName = teamName || '半载通读先锋队';
    let cloudTeam = null;

    // 尝试云端建队
    const res = await requestCloud('/team/create', 'POST', {
      teamName: tName,
      openid: this.user.openid,
      nickname: this.user.nickname || '队长',
      avatar: this.user.avatarUrl || '',
      targetWordsDaily: dailyTargetWords,
      notice: '同心同行，每日与神亲近'
    });

    if (res.success && res.data) {
      cloudTeam = res.data;
    }

    const teamCode = cloudTeam ? cloudTeam.teamCode : Math.random().toString(36).substring(2, 8).toUpperCase();
    const teamId = cloudTeam ? cloudTeam.teamId : ('team_' + Date.now());

    const planData = planManager.getPlanData();
    const todayWords = planManager.getTodayFinishedWords();
    const weeklySummary = planManager.getWeeklySummary();

    const leaderMember = {
      openid: this.user.openid,
      nickname: this.user.nickname || '队长',
      avatarUrl: this.user.avatarUrl,
      role: TEAM_ROLE.LEADER,
      todayWords: todayWords,
      weekWords: weeklySummary.weekFinishedWords,
      streakDays: planData.streakDays || 1,
      isFinishedToday: todayWords >= dailyTargetWords
    };

    this.team = {
      teamId: teamId,
      teamCode: teamCode,
      teamName: tName,
      creatorOpenid: this.user.openid,
      dailyTargetWords: dailyTargetWords,
      createdAt: getTodayString(),
      members: [leaderMember],
      activities: []
    };

    this.user.teamId = teamId;
    this.user.teamRole = TEAM_ROLE.LEADER;
    this.saveUser();
    this.saveTeam();

    // 刷新一次云端数据以合并云端队员
    this.fetchCloudTeamInfo();

    return this.team;
  }

  // 通过 6 位邀请码加入团队 (优先从云端 MySQL 获取)
  async joinTeamByCode(code) {
    if (!code) return { success: false, msg: '请输入邀请码' };
    code = code.trim().toUpperCase();

    if (!this.user || this.user.status !== LOGIN_STATUS.LOGGED_IN) {
      this.doMockLogin('新入队同行者');
    }

    // 尝试云端入队
    const res = await requestCloud('/team/join', 'POST', {
      teamCode: code,
      openid: this.user.openid,
      nickname: this.user.nickname || '新伙伴',
      avatar: this.user.avatarUrl || ''
    });

    if (res.success && res.data) {
      this.user.teamId = res.data.teamId;
      this.user.teamRole = TEAM_ROLE.MEMBER;
      this.saveUser();

      // 从云端拉取完整队伍信息
      await this.fetchCloudTeamInfo(code);
      return { success: true, team: this.team };
    }

    // 若本地已有对应队伍
    if (this.team && this.team.teamCode === code) {
      if (!Array.isArray(this.team.members)) this.team.members = [];
      const exists = this.team.members.some(m => m.openid === this.user.openid);
      if (!exists) {
        this.addCurrentUserToTeam();
      }
      this.user.teamId = this.team.teamId;
      this.user.teamRole = TEAM_ROLE.MEMBER;
      this.saveUser();
      return { success: true, team: this.team };
    }

    return { success: false, msg: res.msg || '未能找到对应的小队，请检查邀请码' };
  }

  // 从云端拉取小队最新数据并同步本地
  async fetchCloudTeamInfo(customCode = '') {
    const code = customCode || (this.team ? this.team.teamCode : '');
    const openid = this.user ? this.user.openid : '';
    if (!code && !openid) return null;

    let query = code ? `?teamCode=${encodeURIComponent(code)}` : `?openid=${encodeURIComponent(openid)}`;
    const res = await requestCloud(`/team/info${query}`, 'GET');

    if (res.success && res.data) {
      const d = res.data;
      const teamInfo = d.team;

      // 组装格式化队员列表
      const members = (d.members || []).map(m => ({
        openid: m.openid,
        nickname: m.nickname,
        avatarUrl: normalizeAvatarUrl(m.avatar),
        role: m.role,
        todayWords: m.todayWords,
        weekWords: m.weekWords,
        streakDays: 1,
        isFinishedToday: m.isFinishedToday
      }));

      // 组装动态流
      const activities = (d.activityFeed || []).map(a => ({
        id: 'act_' + a.id,
        openid: a.openid,
        nickname: a.nickname,
        avatarUrl: normalizeAvatarUrl(a.avatar),
        action: `读完《${a.chaptersFinished || '圣经经文'}》`,
        words: a.wordsRead,
        time: getTimeString(),
        reflection: a.reflection,
        likes: 0
      }));

      this.team = {
        teamId: teamInfo.id,
        teamCode: teamInfo.teamCode,
        teamName: teamInfo.teamName,
        creatorOpenid: teamInfo.creatorOpenid,
        dailyTargetWords: teamInfo.targetWordsDaily,
        createdAt: teamInfo.createTime ? teamInfo.createTime.split('T')[0] : getTodayString(),
        members: members,
        activities: activities
      };

      this.saveTeam();
      return this.team;
    }

    return null;
  }

  addCurrentUserToTeam() {
    if (!this.team) return;
    if (!Array.isArray(this.team.members)) this.team.members = [];
    if (!Array.isArray(this.team.activities)) this.team.activities = [];
    const planData = planManager.getPlanData();
    const todayWords = planManager.getTodayFinishedWords();
    const weeklySummary = planManager.getWeeklySummary();

    const myMember = {
      openid: this.user.openid,
      nickname: this.user.nickname || '新伙伴',
      avatarUrl: normalizeAvatarUrl(this.user.avatarUrl),
      role: TEAM_ROLE.MEMBER,
      todayWords: todayWords,
      weekWords: weeklySummary.weekFinishedWords,
      streakDays: planData.streakDays || 1,
      isFinishedToday: todayWords >= (this.team.dailyTargetWords || 5000)
    };

    this.team.members = (this.team.members || []).filter(m => m.openid !== this.user.openid);
    this.team.members.push(myMember);
    this.saveTeam();
  }

  // 退出当前团队
  leaveTeam() {
    if (this.team && this.user) {
      if (Array.isArray(this.team.members)) {
        this.team.members = this.team.members.filter(m => m.openid !== this.user.openid);
      }
      this.saveTeam();
    }
    if (this.user) {
      this.user.teamId = null;
      this.user.teamRole = null;
      this.saveUser();
    }
    this.team = null;
    uni.removeStorageSync(TEAM_STORAGE_KEY);
  }

  // 获取团队完整信息与仪表盘数据
  getTeamDashboard() {
    if (!this.team) return null;
    if (!Array.isArray(this.team.members)) this.team.members = [];
    if (!Array.isArray(this.team.activities)) this.team.activities = [];

    if (this.user && this.user.openid) {
      const myMember = (this.team.members || []).find(m => m.openid === this.user.openid);
      if (myMember) {
        const todayWords = planManager.getTodayFinishedWords();
        const weeklySummary = planManager.getWeeklySummary();
        const planData = planManager.getPlanData();

        myMember.todayWords = todayWords;
        myMember.weekWords = weeklySummary.weekFinishedWords;
        myMember.streakDays = planData.streakDays || 1;
        myMember.isFinishedToday = todayWords >= (this.team.dailyTargetWords || 5000);
      }
    }

    const sortedMembers = [...(this.team.members || [])].sort((a, b) => (b.todayWords || 0) - (a.todayWords || 0));

    const targetPerPerson = this.team.dailyTargetWords || 5000;
    const teamTargetTotal = targetPerPerson * (sortedMembers.length || 1);
    const teamTodayTotal = sortedMembers.reduce((sum, m) => sum + (m.todayWords || 0), 0);
    const finishedCount = sortedMembers.filter(m => m.isFinishedToday).length;

    return {
      team: this.team,
      sortedMembers,
      finishedCount,
      totalCount: sortedMembers.length,
      teamTargetTotal,
      teamTodayTotal,
      teamProgressPercent: teamTargetTotal > 0 ? Math.min(100, Math.round((teamTodayTotal / teamTargetTotal) * 100)) : 0,
      activities: this.team.activities || []
    };
  }

  // 读经打卡后，本地即时反馈 + 云端 MySQL 异步落库
  syncMemberProgress(chapterName, chapterWords, durationSeconds = 1500, reflection = '') {
    if (!this.user || !this.user.openid) return;

    // 1. 本地小队动态即时更新
    if (this.team) {
      if (!Array.isArray(this.team.members)) this.team.members = [];
      const myMember = (this.team.members || []).find(m => m.openid === this.user.openid);
      if (myMember) {
        myMember.todayWords = planManager.getTodayFinishedWords();
        myMember.weekWords = planManager.getWeeklySummary().weekFinishedWords;
        myMember.isFinishedToday = myMember.todayWords >= (this.team.dailyTargetWords || 5000);
      }

      const newAct = {
        id: 'act_' + Date.now(),
        openid: this.user.openid,
        nickname: this.user.nickname || '同路人',
        avatarUrl: normalizeAvatarUrl(this.user.avatarUrl),
        action: `读完《${chapterName}》`,
        words: chapterWords,
        time: getTimeString(),
        reflection: reflection,
        likes: 0
      };

      if (!this.team.activities) this.team.activities = [];
      this.team.activities.unshift(newAct);
      if (this.team.activities.length > 25) {
        this.team.activities.pop();
      }
      this.saveTeam();
    }

    // 2. 异步向云端 MySQL 提交打卡记录
    requestCloud('/team/checkin', 'POST', {
      teamId: this.team ? this.team.teamId : null,
      openid: this.user.openid,
      nickname: this.user.nickname || '读经同伴',
      avatar: this.user.avatarUrl || '',
      wordsRead: chapterWords,
      durationSeconds: durationSeconds,
      chaptersFinished: chapterName,
      reflection: reflection
    }).then(res => {
      if (res.success) {
        console.log('[Checkin] 打卡成功同步至云端数据库', res.data);
      }
    });
  }

  // 为队友打卡动态点赞
  likeActivity(actId) {
    if (!this.team || !this.team.activities) return;
    const item = this.team.activities.find(a => a.id === actId);
    if (item) {
      item.likes = (item.likes || 0) + 1;
      this.saveTeam();
    }
  }

  // 记录并发布打卡动态（打通本地动态流与云端 MySQL 落库）
  addActivity(actionDesc, words = 0) {
    this.syncMemberProgress(actionDesc, words);
  }
}

export const userTeamManager = new UserTeamManager();
