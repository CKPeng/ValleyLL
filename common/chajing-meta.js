// 圣经 66 卷书与查经资料大全 (chajing-new) 书卷文件名映射表
import { CHAJING_BASE_URL } from './config.js';
export { CHAJING_BASE_URL };
export const CHAJING_BOOK_MAP = {
	// 旧约 39 卷
	genesis: '01Gen',
	exodus: '02Exo',
	leviticus: '03Lev',
	numbers: '04Num',
	deuteronomy: '05Deut',
	joshua: '06Josh',
	judges: '07Judg',
	ruth: '08Ruth',
	'1samuel': '091Sam',
	'2samuel': '102Sam',
	'1kings': '111King',
	'2kings': '122King',
	'1chronicles': '131Chro',
	'2chronicles': '142Chro',
	ezra: '15Ezra',
	nehemiah: '16Neh',
	esther: '17Esth',
	job: '18Job',
	psalms: '19Psa',
	proverbs: '20Prov',
	ecclesiastes: '21Eccl',
	song: '22Song',
	isaiah: '23Isa',
	jeremiah: '24Jer',
	lamentations: '25Lam',
	ezekiel: '26Ezek',
	daniel: '27Dan',
	hosea: '28Hosea',
	joel: '29Joel',
	amos: '30Amos',
	obadiah: '31Obad',
	jonah: '32Jonah',
	micah: '33Micah',
	nahum: '34Nah',
	habakkuk: '35Habak',
	zephaniah: '36Zeph',
	haggai: '37Hagg',
	zechariah: '38Zech',
	malachi: '39Mal',

	// 新约 27 卷
	matthew: '40Matt',
	mark: '41Mark',
	luke: '42Luke',
	john: '43John',
	acts: '44Acts',
	romans: '45Rom',
	'1corinthians': '461Cor',
	'2corinthians': '472Cor',
	galatians: '48Gal',
	ephesians: '49Eph',
	philippians: '50Phil',
	colossians: '51Col',
	'1thessalonians': '521Thes',
	'2thessalonians': '532Thes',
	'1timothy': '541Tim',
	'2timothy': '552Tim',
	titus: '56Titus',
	philemon: '57Philem',
	hebrews: '58Heb',
	james: '59James',
	'1peter': '601Pet',
	'2peter': '612Pet',
	'1john': '621John',
	'2john': '632John',
	'3john': '643John',
	jude: '65Jude',
	revelation: '66Rev'
};

/**
 * 根据书卷 ID 或书名生成对应的查经 H5 URL
 * @param {string} bookIdOrName - 英文标识 (如 genesis) 或中文名 (如 创世记)
 * @returns {string} 完整的 HTTPS URL
 */
export function getChajingUrl(bookIdOrName) {
	if (!bookIdOrName) {
		return CHAJING_BASE_URL + '/';
	}

	const normalized = String(bookIdOrName).trim().toLowerCase();
	
	// 直接匹配 key
	if (CHAJING_BOOK_MAP[normalized]) {
		return CHAJING_BASE_URL + '/books/' + CHAJING_BOOK_MAP[normalized] + '.html';
	}

	// 按中文或简称模糊匹配
	const nameMap = {
		'创世记': '01Gen', '创': '01Gen',
		'出埃及记': '02Exo', '出': '02Exo',
		'利未记': '03Lev', '利': '03Lev',
		'民数记': '04Num', '民': '04Num',
		'申命记': '05Deut', '申': '05Deut',
		'约书亚记': '06Josh', '书': '06Josh',
		'士师记': '07Judg', '士': '07Judg',
		'路得记': '08Ruth', '得': '08Ruth',
		'撒母耳记上': '091Sam', '撒上': '091Sam',
		'撒母耳记下': '102Sam', '撒下': '102Sam',
		'列王纪上': '111King', '王上': '111King',
		'列王纪下': '122King', '王下': '122King',
		'历代志上': '131Chro', '代上': '131Chro',
		'历代志下': '142Chro', '代下': '142Chro',
		'以斯拉记': '15Ezra', '拉': '15Ezra',
		'尼希米记': '16Neh', '尼': '16Neh',
		'以斯帖记': '17Esth', '斯': '17Esth',
		'约伯记': '18Job', '伯': '18Job',
		'诗篇': '19Psa', '诗': '19Psa',
		'箴言': '20Prov', '箴': '20Prov',
		'传道书': '21Eccl', '传': '21Eccl',
		'雅歌': '22Song', '歌': '22Song',
		'以赛亚书': '23Isa', '赛': '23Isa',
		'耶利米书': '24Jer', '耶': '24Jer',
		'耶利米哀歌': '25Lam', '哀': '25Lam',
		'以西结书': '26Ezek', '结': '26Ezek',
		'但以理书': '27Dan', '但': '27Dan',
		'何西阿书': '28Hosea', '何': '28Hosea',
		'约珥书': '29Joel', '珥': '29Joel',
		'阿摩司书': '30Amos', '摩': '30Amos',
		'俄巴底亚书': '31Obad', '俄': '31Obad',
		'约拿书': '32Jonah', '拿': '32Jonah',
		'弥迦书': '33Micah', '弥': '33Micah',
		'那鸿书': '34Nah', '鸿': '34Nah',
		'哈巴谷书': '35Habak', '哈': '35Habak',
		'西番雅书': '36Zeph', '番': '36Zeph',
		'哈该书': '37Hagg', '该': '37Hagg',
		'撒迦利亚书': '38Zech', '亚': '38Zech',
		'玛拉基书': '39Mal', '玛': '39Mal',
		'马太福音': '40Matt', '太': '40Matt',
		'马可福音': '41Mark', '可': '41Mark',
		'路加福音': '42Luke', '路': '42Luke',
		'约翰福音': '43John', '约': '43John',
		'使徒行传': '44Acts', '徒': '44Acts',
		'罗马书': '45Rom', '罗': '45Rom',
		'哥林多前书': '461Cor', '林前': '461Cor',
		'哥林多后书': '472Cor', '林后': '472Cor',
		'加拉太书': '48Gal', '加': '48Gal',
		'以弗所书': '49Eph', '弗': '49Eph',
		'腓立比书': '50Phil', '腓': '50Phil',
		'歌罗西书': '51Col', '西': '51Col',
		'帖撒罗尼迦前书': '521Thes', '帖前': '521Thes',
		'帖撒罗尼迦后书': '532Thes', '帖后': '532Thes',
		'提摩太前书': '541Tim', '提前': '541Tim',
		'提摩太后书': '552Tim', '提后': '552Tim',
		'提多书': '56Titus', '多': '56Titus',
		'腓利门书': '57Philem', '门': '57Philem',
		'希伯来书': '58Heb', '来': '58Heb',
		'雅各书': '59James', '雅': '59James',
		'彼得前书': '601Pet', '彼前': '601Pet',
		'彼得后书': '612Pet', '彼后': '612Pet',
		'约翰一书': '621John', '约一': '621John',
		'约翰二书': '632John', '约二': '632John',
		'约翰三书': '643John', '约三': '643John', '约翰叁书': '643John',
		'犹大书': '65Jude', '犹': '65Jude',
		'启示录': '66Rev', '启': '66Rev'
	};

	if (nameMap[bookIdOrName]) {
		return CHAJING_BASE_URL + '/books/' + nameMap[bookIdOrName] + '.html';
	}

	return CHAJING_BASE_URL + '/';
}
