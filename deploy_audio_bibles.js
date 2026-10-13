const fs = require('fs');
const path = require('path');
const https = require('https');

const TARGET_ROOT = process.env.TARGET_ROOT || '/mnt/nas_data/service/assets/bible-mp3-cn';

// 66 卷书元数据
const BIBLE_BOOKS = [
    { sn: 1, name: '创世记', en: 'Genesis', chapters: 50 },
    { sn: 2, name: '出埃及记', en: 'Exodus', chapters: 40 },
    { sn: 3, name: '利未记', en: 'Leviticus', chapters: 27 },
    { sn: 4, name: '民数记', en: 'Numbers', chapters: 36 },
    { sn: 5, name: '申命记', en: 'Deuteronomy', chapters: 34 },
    { sn: 6, name: '约书亚记', en: 'Joshua', chapters: 24 },
    { sn: 7, name: '士师记', en: 'Judges', chapters: 21 },
    { sn: 8, name: '路得记', en: 'Ruth', chapters: 4 },
    { sn: 9, name: '撒母耳记上', en: '1Samuel', chapters: 31 },
    { sn: 10, name: '撒母耳记下', en: '2Samuel', chapters: 24 },
    { sn: 11, name: '列王纪上', en: '1Kings', chapters: 22 },
    { sn: 12, name: '列王纪下', en: '2Kings', chapters: 25 },
    { sn: 13, name: '历代志上', en: '1Chronicles', chapters: 29 },
    { sn: 14, name: '历代志下', en: '2Chronicles', chapters: 36 },
    { sn: 15, name: '以斯拉记', en: 'Ezra', chapters: 10 },
    { sn: 16, name: '尼希米记', en: 'Nehemiah', chapters: 13 },
    { sn: 17, name: '以斯帖记', en: 'Esther', chapters: 10 },
    { sn: 18, name: '约伯记', en: 'Job', chapters: 42 },
    { sn: 19, name: '诗篇', en: 'Psalms', chapters: 150 },
    { sn: 20, name: '箴言', en: 'Proverbs', chapters: 31 },
    { sn: 21, name: '传道书', en: 'Ecclesiastes', chapters: 12 },
    { sn: 22, name: '雅歌', en: 'SongOfSolomon', chapters: 8 },
    { sn: 23, name: '以赛亚书', en: 'Isaiah', chapters: 66 },
    { sn: 24, name: '耶利米书', en: 'Jeremiah', chapters: 52 },
    { sn: 25, name: '耶利米哀歌', en: 'Lamentations', chapters: 5 },
    { sn: 26, name: '以西结书', en: 'Ezekiel', chapters: 48 },
    { sn: 27, name: '但以理书', en: 'Daniel', chapters: 12 },
    { sn: 28, name: '何西阿书', en: 'Hosea', chapters: 14 },
    { sn: 29, name: '约珥书', en: 'Joel', chapters: 3 },
    { sn: 30, name: '阿摩司书', en: 'Amos', chapters: 9 },
    { sn: 31, name: '俄巴底亚书', en: 'Obadiah', chapters: 1 },
    { sn: 32, name: '约拿书', en: 'Jonah', chapters: 4 },
    { sn: 33, name: '弥迦书', en: 'Micah', chapters: 7 },
    { sn: 34, name: '那鸿书', en: 'Nahum', chapters: 3 },
    { sn: 35, name: '哈巴谷书', en: 'Habakkuk', chapters: 3 },
    { sn: 36, name: '西番雅书', en: 'Zephaniah', chapters: 3 },
    { sn: 37, name: '哈该书', en: 'Haggai', chapters: 2 },
    { sn: 38, name: '撒迦利亚书', en: 'Zechariah', chapters: 14 },
    { sn: 39, name: '玛拉基书', en: 'Malachi', chapters: 4 },
    { sn: 40, name: '马太福音', en: 'Matthew', chapters: 28 },
    { sn: 41, name: '马可福音', en: 'Mark', chapters: 16 },
    { sn: 42, name: '路加福音', en: 'Luke', chapters: 24 },
    { sn: 43, name: '约翰福音', en: 'John', chapters: 21 },
    { sn: 44, name: '使徒行传', en: 'Acts', chapters: 28 },
    { sn: 45, name: '罗马书', en: 'Romans', chapters: 16 },
    { sn: 46, name: '哥林多前书', en: '1Corinthians', chapters: 16 },
    { sn: 47, name: '哥林多后书', en: '2Corinthians', chapters: 13 },
    { sn: 48, name: '加拉太书', en: 'Galatians', chapters: 6 },
    { sn: 49, name: '以弗所书', en: 'Ephesians', chapters: 6 },
    { sn: 50, name: '腓立比书', en: 'Philippians', chapters: 4 },
    { sn: 51, name: '歌罗西书', en: 'Colossians', chapters: 4 },
    { sn: 52, name: '帖撒罗尼迦前书', en: '1Thessalonians', chapters: 5 },
    { sn: 53, name: '帖撒罗尼迦后书', en: '2Thessalonians', chapters: 3 },
    { sn: 54, name: '提摩太前书', en: '1Timothy', chapters: 6 },
    { sn: 55, name: '提摩太后书', en: '2Timothy', chapters: 4 },
    { sn: 56, name: '提多书', en: 'Titus', chapters: 3 },
    { sn: 57, name: '腓利门书', en: 'Philemon', chapters: 1 },
    { sn: 58, name: '希伯来书', en: 'Hebrews', chapters: 13 },
    { sn: 59, name: '雅各书', en: 'James', chapters: 5 },
    { sn: 60, name: '彼得前书', en: '1Peter', chapters: 5 },
    { sn: 61, name: '彼得后书', en: '2Peter', chapters: 3 },
    { sn: 62, name: '约翰一书', en: '1John', chapters: 5 },
    { sn: 63, name: '约翰二书', en: '2John', chapters: 1 },
    { sn: 64, name: '约翰三书', en: '3John', chapters: 1 },
    { sn: 65, name: '犹大书', en: 'Jude', chapters: 1 },
    { sn: 66, name: '启示录', en: 'Revelation', chapters: 22 }
];

const bookMapBySn = new Map(BIBLE_BOOKS.map(b => [b.sn, b]));

function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const req = https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                fs.unlinkSync(destPath);
                return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destPath);
                return reject(new Error(`HTTP Status ${res.statusCode} for ${url}`));
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve());
            });
        });
        req.on('error', err => {
            file.close();
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
            reject(err);
        });
        req.setTimeout(60000, () => {
            req.destroy(new Error('Timeout'));
        });
    });
}

// 并发控制器
async function pMap(array, mapper, concurrency = 5) {
    const results = [];
    let index = 0;
    const workers = new Array(concurrency).fill(0).map(async () => {
        while (index < array.length) {
            const curIdx = index++;
            results[curIdx] = await mapper(array[curIdx], curIdx);
        }
    });
    await Promise.all(workers);
    return results;
}

// 构建版本任务列表
async function buildTaskList(version) {
    const isWeb = version === 'web';
    const indexUrl = isWeb
        ? 'https://audiotreasure.com/webindex.htm'
        : 'https://audiotreasure.com/indexKJV.htm';

    console.log(`[Parse] 正在获取 ${version.toUpperCase()} 播放列表: ${indexUrl} ...`);
    const html = await fetchText(indexUrl);
    const matches = [...html.matchAll(/data-mp3="([^"]+)"/g)].map(m => m[1]);

    const taskMap = new Map();

    for (const relUrl of matches) {
        // 匹配各种格式如 /01_Genesis_01.mp3, /22_Song_of_Soloman_01.mp3, /25_Lam1.mp3 等
        let sn = null;
        let ch = null;

        const mStandard = relUrl.match(/\/(\d+)_([A-Za-z0-9_]+)_(\d+)\.mp3/i);
        if (mStandard) {
            sn = parseInt(mStandard[1], 10);
            ch = parseInt(mStandard[3], 10);
        } else {
            const mAlt = relUrl.match(/\/(\d+)_([A-Za-z]+)(\d+)\.mp3/i);
            if (mAlt) {
                sn = parseInt(mAlt[1], 10);
                ch = parseInt(mAlt[3], 10);
            }
        }

        if (sn && ch) {
            taskMap.set(`${sn}-${ch}`, `https://audiotreasure.com${relUrl}`);
        }
    }

    // 网页中遗漏的第 38 卷第 14 章自动补全
    if (!taskMap.has('38-14')) {
        const patchUrl = isWeb
            ? 'https://audiotreasure.com/content/WEBD_AT/38_Zechariah_14.mp3'
            : 'https://audiotreasure.com/content/KJV_FF/38_Zechariah_14.mp3';
        taskMap.set('38-14', patchUrl);
    }

    // 组装完整的 1189 个任务
    const tasks = [];
    for (const book of BIBLE_BOOKS) {
        for (let ch = 1; ch <= book.chapters; ch++) {
            const key = `${book.sn}-${ch}`;
            const url = taskMap.get(key);
            if (!url) {
                console.warn(`[Warning] 缺少任务: ${book.name} 第 ${ch} 章 (${key})`);
            } else {
                tasks.push({
                    sn: book.sn,
                    bookName: book.name,
                    enName: book.en,
                    chapter: ch,
                    url: url
                });
            }
        }
    }
    return tasks;
}

async function runVersion(versionCode, targetDirName) {
    const versionDir = path.join(TARGET_ROOT, targetDirName);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }

    const tasks = await buildTaskList(versionCode);
    console.log(`\n================================================================`);
    console.log(`开始下载: ${targetDirName} (共 ${tasks.length} 章节音频)`);
    console.log(`存储路径: ${versionDir}`);
    console.log(`================================================================`);

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    await pMap(tasks, async (t, idx) => {
        const bookDir = path.join(versionDir, t.bookName);
        if (!fs.existsSync(bookDir)) {
            try { fs.mkdirSync(bookDir, { recursive: true }); } catch (e) {}
        }

        // 文件名对齐中文规范: {书卷名}第{章}章.mp3
        const fileName = `${t.bookName}第${t.chapter}章.mp3`;
        const destPath = path.join(bookDir, fileName);

        // 断点续传检查: 文件存在且大于 30KB
        if (fs.existsSync(destPath)) {
            const stat = fs.statSync(destPath);
            if (stat.size > 30000) {
                skipped++;
                return;
            }
        }

        let retries = 3;
        let success = false;
        while (retries > 0 && !success) {
            try {
                await downloadFile(t.url, destPath);
                downloaded++;
                success = true;
                if ((downloaded + skipped) % 50 === 0 || downloaded + skipped === tasks.length) {
                    const pct = (((downloaded + skipped) / tasks.length) * 100).toFixed(1);
                    console.log(`[Progress ${pct}%] 已下载: ${downloaded}, 已跳过: ${skipped}, 剩余: ${tasks.length - downloaded - skipped}`);
                }
            } catch (err) {
                retries--;
                if (retries === 0) {
                    console.error(`[Error] 下载失败: ${t.bookName} 第 ${t.chapter} 章 (${t.url}) -> ${err.message}`);
                    failed++;
                } else {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
    }, 6); // 6 并发并发下载

    console.log(`\n>>> ${targetDirName} 完成统计: 新下载 ${downloaded} 个, 跳过已有 ${skipped} 个, 失败 ${failed} 个。\n`);
}

async function main() {
    console.log('>>> [1/2] 开始部署 WEB 现代美音版音频...');
    await runVersion('web', '英语WEB-现代美音版');

    console.log('>>> [2/2] 开始部署 KJV 经典朗读版音频...');
    await runVersion('kjv', '英语KJV-经典朗读版');

    console.log('================================================================');
    console.log('全部两套英文圣经音频部署完成！');
    console.log('================================================================');
}

main().catch(err => {
    console.error('致命错误:', err);
    process.exit(1);
});
