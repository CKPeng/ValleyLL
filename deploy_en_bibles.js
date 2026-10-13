const fs = require('fs');
const path = require('path');
const https = require('https');

// 基础配置
const TARGET_ROOT = process.env.TARGET_ROOT || '/mnt/nas_data/service/assets/bible-mp3-cn';
const RAW_DIR = path.join(TARGET_ROOT, 'bible-data-en-raw');

// 需下载与转换的英文译本清单
const TRANSLATIONS = [
    { code: 'kjv', file: 'en_kjv.json', name: 'King James Version', short: 'KJV' },
    { code: 'web', file: 'en_web.json', name: 'World English Bible', short: 'WEB' },
    { code: 'bsb', file: 'en_bsb.json', name: 'Berean Standard Bible', short: 'BSB' },
    { code: 'bbe', file: 'en_bbe.json', name: 'Bible in Basic English', short: 'BBE' },
    { code: 'asv', file: 'en_asv.json', name: 'American Standard Version', short: 'ASV' },
    { code: 'darby', file: 'en_darby.json', name: "Darby's Translation", short: 'Darby' },
    { code: 'esv', file: 'en_esv.json', name: 'English Standard Version', short: 'ESV' },
    { code: 'nasb', file: 'en_nasb.json', name: 'New American Standard Bible', short: 'NASB' },
    { code: 'niv', file: 'en_niv.json', name: 'New International Version', short: 'NIV' },
    { code: 'nkjv', file: 'en_nkjv.json', name: 'New King James Version', short: 'NKJV' },
    { code: 'nlt', file: 'en_nlt.json', name: 'New Living Translation', short: 'NLT' }
];

// 下载封装（带备用镜像与重试）
function fetchUrl(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects < 0) return reject(new Error('Too many redirects'));
        const req = https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location, maxRedirects - 1).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP Status ${res.statusCode} for ${url}`));
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            res.on('error', err => reject(err));
        });
        req.on('error', err => reject(err));
        req.setTimeout(30000, () => {
            req.destroy(new Error('Request timeout'));
        });
    });
}

async function downloadFile(filename) {
    const urls = [
        `https://raw.githubusercontent.com/thiagobodruk/bible/master/json/${filename}`,
        `https://ghfast.top/https://raw.githubusercontent.com/thiagobodruk/bible/master/json/${filename}`,
        `https://cdn.jsdelivr.net/gh/thiagobodruk/bible@master/json/${filename}`
    ];
    let lastError = null;
    for (const u of urls) {
        try {
            console.log(`[Download] 正在尝试下载 ${filename} 从 ${u} ...`);
            const content = await fetchUrl(u);
            if (content && content.length > 10000) {
                console.log(`[Download] 下载成功: ${filename} (大小: ${(content.length / 1024 / 1024).toFixed(2)} MB)`);
                return content;
            }
        } catch (e) {
            console.warn(`[Download] 下载失败: ${u} -> ${e.message}`);
            lastError = e;
        }
    }
    throw new Error(`无法下载 ${filename}: ${lastError ? lastError.message : '未知错误'}`);
}

async function processTranslation(item) {
    const rawFilePath = path.join(RAW_DIR, item.file);
    let rawContent = '';

    if (fs.existsSync(rawFilePath)) {
        console.log(`[Cache] 本地已存在原始文件: ${rawFilePath}，直接使用`);
        rawContent = fs.readFileSync(rawFilePath, 'utf8');
    } else {
        rawContent = await downloadFile(item.file);
        fs.writeFileSync(rawFilePath, rawContent, 'utf8');
        console.log(`[Cache] 原始全本已备份至: ${rawFilePath}`);
    }

    const books = JSON.parse(rawContent.replace(/^\uFEFF/, ''));
    if (!Array.isArray(books) || books.length < 66) {
        throw new Error(`数据格式异常: 书卷数量不符合 66 卷 (${books ? books.length : 0})`);
    }

    // 目标译本目录，例如 /mnt/nas_data/service/assets/bible-mp3-cn/bible-data-en-kjv
    const outDir = path.join(TARGET_ROOT, `bible-data-en-${item.code}`);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    let totalVerses = 0;
    let totalChapters = 0;
    const indexList = [];

    for (let bIndex = 0; bIndex < 66; bIndex++) {
        const bookObj = books[bIndex];
        const sn = bIndex + 1;
        const abbrev = bookObj.abbrev || '';
        const bookName = bookObj.name || '';
        const chapters = bookObj.chapters || [];

        indexList.push({
            sn,
            kindSN: sn <= 39 ? (sn <= 5 ? 1 : sn <= 17 ? 2 : sn <= 22 ? 3 : 4) : (sn <= 44 ? 5 : sn === 45 ? 6 : sn <= 65 ? 7 : 8),
            chapters: chapters.length,
            newOrOld: sn <= 39 ? 0 : 1,
            abbrev: abbrev,
            fullName: bookName,
            version: item.short
        });

        for (let cIndex = 0; cIndex < chapters.length; cIndex++) {
            const chNum = cIndex + 1;
            const versesList = chapters[cIndex] || [];
            
            // 组装成系统标准格式: [{ verse: 1, text: "..." }, ...]
            const formattedVerses = versesList.map((verseText, vIdx) => ({
                verse: vIdx + 1,
                text: typeof verseText === 'string' ? verseText.trim() : String(verseText)
            }));

            const chapterFileName = `volume-${sn}-chapter-${chNum}.json`;
            const chapterFilePath = path.join(outDir, chapterFileName);

            fs.writeFileSync(chapterFilePath, JSON.stringify(formattedVerses), 'utf8');
            totalChapters++;
            totalVerses += formattedVerses.length;
        }
    }

    // 写入该译本专属的 bible-index.json
    fs.writeFileSync(path.join(outDir, 'bible-index.json'), JSON.stringify(indexList, null, 2), 'utf8');

    console.log(`[Success] 译本 【${item.short} - ${item.name}】 处理完成:`);
    console.log(`          - 目录: ${outDir}`);
    console.log(`          - 章节数: ${totalChapters} 章`);
    console.log(`          - 经文数: ${totalVerses} 节\n`);

    return {
        code: item.code,
        short: item.short,
        name: item.name,
        chapters: totalChapters,
        verses: totalVerses,
        dir: outDir
    };
}

async function main() {
    console.log('================================================================');
    console.log(`  圣经英文版本下载与拆分转换工具`);
    console.log(`  目标目录: ${TARGET_ROOT}`);
    console.log('================================================================\n');

    if (!fs.existsSync(RAW_DIR)) {
        fs.mkdirSync(RAW_DIR, { recursive: true });
    }

    const results = [];
    const errors = [];

    for (const item of TRANSLATIONS) {
        try {
            console.log(`>>> 开始处理译本: [${item.short}] ${item.name} ...`);
            const res = await processTranslation(item);
            results.push(res);
        } catch (e) {
            console.error(`!!! 译本 [${item.short}] 处理失败:`, e.message);
            errors.push({ short: item.short, error: e.message });
        }
    }

    // 生成英文版本清单总览 summary.json
    const summaryPath = path.join(TARGET_ROOT, 'bible-data-en-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({
        updatedAt: new Date().toISOString(),
        versions: results,
        errors: errors
    }, null, 2), 'utf8');

    console.log('================================================================');
    console.log(`全部处理结束! 成功: ${results.length} 个, 失败: ${errors.length} 个`);
    console.log(`总览索引已保存至: ${summaryPath}`);
    console.log('================================================================');
}

main().catch(err => {
    console.error('致命错误:', err);
    process.exit(1);
});
