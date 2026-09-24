// 圣经题材分类与阅读难度标签
export const GENRE_TYPE = {
  LAW: 'LAW',                     // 摩西律法/律法书
  HISTORY: 'HISTORY',             // 历史书
  POETRY: 'POETRY',               // 诗歌智慧书
  MAJOR_PROPHET: 'MAJOR_PROPHET', // 大先知书（内容长、文字厚重）
  MINOR_PROPHET: 'MINOR_PROPHET', // 小先知书（篇幅较短）
  GOSPEL: 'GOSPEL',               // 福音书与使徒行传
  EPISTLE: 'EPISTLE',             // 保罗与使徒书信
  PROPHECY: 'PROPHECY'            // 启示录
};

// 难度/风格标签（用于动态双轨分流算法）
// HARD: 晦涩沉重长篇（如先知书、律法细节）
// SMOOTH: 通畅叙事篇（如历史书）
// SWEET: 灵修滋养篇（如诗篇、箴言、福音书、短篇书信）
export const DIFFICULTY_LEVEL = {
  HARD: 'HARD',
  SMOOTH: 'SMOOTH',
  SWEET: 'SWEET'
};

// 66 卷书分类映射字典 (按 bookId)
export const BOOK_METAS = {
  // 摩西五经
  genesis: { genre: GENRE_TYPE.LAW, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '通畅创世' },
  exodus: { genre: GENRE_TYPE.LAW, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '出埃及史' },
  leviticus: { genre: GENRE_TYPE.LAW, difficulty: DIFFICULTY_LEVEL.HARD, tag: '律法礼仪' },
  numbers: { genre: GENRE_TYPE.LAW, difficulty: DIFFICULTY_LEVEL.HARD, tag: '旷野行军' },
  deuteronomy: { genre: GENRE_TYPE.LAW, difficulty: DIFFICULTY_LEVEL.HARD, tag: '重申诫命' },

  // 旧约历史书
  joshua: { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '征战得地' },
  judges: { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '士师周期' },
  ruth: { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '忠贞恩典' },
  '1samuel': { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '王国初立' },
  '2samuel': { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '大卫王朝' },
  '1kings': { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '所罗门盛衰' },
  '2kings': { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '列王兴亡' },
  '1chronicles': { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.HARD, tag: '历代家谱' },
  '2chronicles': { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '圣殿历代' },
  ezra: { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '归回重建' },
  nehemiah: { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '重修城墙' },
  esther: { genre: GENRE_TYPE.HISTORY, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '隐秘眷顾' },

  // 诗歌智慧书
  job: { genre: GENRE_TYPE.POETRY, difficulty: DIFFICULTY_LEVEL.HARD, tag: '苦难辩论' },
  psalms: { genre: GENRE_TYPE.POETRY, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '赞美与祈祷' },
  proverbs: { genre: GENRE_TYPE.POETRY, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '处世智慧' },
  ecclesiastes: { genre: GENRE_TYPE.POETRY, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '虚空反思' },
  song: { genre: GENRE_TYPE.POETRY, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '良人佳偶' },

  // 大先知书（经典硬菜）
  isaiah: { genre: GENRE_TYPE.MAJOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '救赎预言' },
  jeremiah: { genre: GENRE_TYPE.MAJOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '哀恸先知' },
  lamentations: { genre: GENRE_TYPE.POETRY, difficulty: DIFFICULTY_LEVEL.HARD, tag: '哀歌沉痛' },
  ezekiel: { genre: GENRE_TYPE.MAJOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '异象审判' },
  daniel: { genre: GENRE_TYPE.MAJOR_PROPHET, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '巨像异梦' },

  // 小先知书
  hosea: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '不渝慈爱' },
  joel: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '耶和华日子' },
  amos: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '公义如江河' },
  obadiah: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '以东受罚' },
  jonah: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '逃跑先知' },
  micah: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '行公义好怜悯' },
  nahum: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '尼尼微倾覆' },
  habakkuk: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '因信得生' },
  zephaniah: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '审判与复兴' },
  haggai: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '起而重建' },
  zechariah: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.HARD, tag: '夜视异象' },
  malachi: { genre: GENRE_TYPE.MINOR_PROPHET, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '旧约结语' },

  // 四福音书与使徒行传
  matthew: { genre: GENRE_TYPE.GOSPEL, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '天国君王' },
  mark: { genre: GENRE_TYPE.GOSPEL, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '受苦仆人' },
  luke: { genre: GENRE_TYPE.GOSPEL, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '人子慈爱' },
  john: { genre: GENRE_TYPE.GOSPEL, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '道成肉身' },
  acts: { genre: GENRE_TYPE.GOSPEL, difficulty: DIFFICULTY_LEVEL.SMOOTH, tag: '圣灵降临' },

  // 保罗与使徒书信
  romans: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.HARD, tag: '因信称义' },
  '1corinthians': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '爱与教会' },
  '2corinthians': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '基督馨香' },
  galatians: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '自由释放' },
  ephesians: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '天上福气' },
  philippians: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '喜乐常在' },
  colossians: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '至高元首' },
  '1thessalonians': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '候主再来' },
  '2thessalonians': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '坚守主道' },
  '1timothy': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '敬虔之训' },
  '2timothy': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '打过美好的仗' },
  titus: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '善道规劝' },
  philemon: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '主内接纳' },
  hebrews: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.HARD, tag: '更大中保' },
  james: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '信心与行为' },
  '1peter': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '活泼盼望' },
  '2peter': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '防备异端' },
  '1john': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '神就是爱' },
  '2john': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '爱中行真理' },
  '3john': { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '接待圣徒' },
  jude: { genre: GENRE_TYPE.EPISTLE, difficulty: DIFFICULTY_LEVEL.SWEET, tag: '竭力争辩' },
  revelation: { genre: GENRE_TYPE.PROPHECY, difficulty: DIFFICULTY_LEVEL.HARD, tag: '新天新地' }
};
