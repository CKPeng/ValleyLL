// 和合本圣经 66 卷字数基准元数据表（汉字字数，不含标点）
// 全书总字数约为 930,000 字（旧约约 728,000 字，新约约 202,000 字）
export const BIBLE_WORD_METAS = {
  // 摩西五经
  genesis: { totalWords: 38260, chapters: 50, avgWords: 765 },
  exodus: { totalWords: 32680, chapters: 40, avgWords: 817 },
  leviticus: { totalWords: 24540, chapters: 27, avgWords: 908 },
  numbers: { totalWords: 32890, chapters: 36, avgWords: 913 },
  deuteronomy: { totalWords: 28350, chapters: 34, avgWords: 833 },

  // 旧约历史书
  joshua: { totalWords: 18750, chapters: 24, avgWords: 781 },
  judges: { totalWords: 18960, chapters: 21, avgWords: 902 },
  ruth: { totalWords: 2570, chapters: 4, avgWords: 642 },
  '1samuel': { totalWords: 25060, chapters: 31, avgWords: 808 },
  '2samuel': { totalWords: 20600, chapters: 24, avgWords: 858 },
  '1kings': { totalWords: 24510, chapters: 22, avgWords: 1114 },
  '2kings': { totalWords: 23530, chapters: 25, avgWords: 941 },
  '1chronicles': { totalWords: 20360, chapters: 29, avgWords: 702 },
  '2chronicles': { totalWords: 26060, chapters: 36, avgWords: 723 },
  ezra: { totalWords: 7440, chapters: 10, avgWords: 744 },
  nehemiah: { totalWords: 10480, chapters: 13, avgWords: 806 },
  esther: { totalWords: 5630, chapters: 10, avgWords: 563 },

  // 诗歌智慧书
  job: { totalWords: 18980, chapters: 42, avgWords: 451 },
  psalms: { totalWords: 43740, chapters: 150, avgWords: 291 },
  proverbs: { totalWords: 14930, chapters: 31, avgWords: 481 },
  ecclesiastes: { totalWords: 5540, chapters: 12, avgWords: 461 },
  song: { totalWords: 2460, chapters: 8, avgWords: 307 },

  // 大先知书
  isaiah: { totalWords: 37040, chapters: 66, avgWords: 561 },
  jeremiah: { totalWords: 42530, chapters: 52, avgWords: 817 },
  lamentations: { totalWords: 3410, chapters: 5, avgWords: 682 },
  ezekiel: { totalWords: 39400, chapters: 48, avgWords: 820 },
  daniel: { totalWords: 11620, chapters: 12, avgWords: 968 },

  // 小先知书
  hosea: { totalWords: 5240, chapters: 14, avgWords: 374 },
  joel: { totalWords: 2030, chapters: 3, avgWords: 676 },
  amos: { totalWords: 4250, chapters: 9, avgWords: 472 },
  obadiah: { totalWords: 670, chapters: 1, avgWords: 670 },
  jonah: { totalWords: 1320, chapters: 4, avgWords: 330 },
  micah: { totalWords: 3150, chapters: 7, avgWords: 450 },
  nahum: { totalWords: 1280, chapters: 3, avgWords: 426 },
  habakkuk: { totalWords: 1470, chapters: 3, avgWords: 490 },
  zephaniah: { totalWords: 1610, chapters: 3, avgWords: 536 },
  haggai: { totalWords: 1130, chapters: 2, avgWords: 565 },
  zechariah: { totalWords: 6480, chapters: 14, avgWords: 462 },
  malachi: { totalWords: 1780, chapters: 4, avgWords: 445 },

  // 四福音书与使徒行传
  matthew: { totalWords: 23680, chapters: 28, avgWords: 845 },
  mark: { totalWords: 15120, chapters: 16, avgWords: 945 },
  luke: { totalWords: 25940, chapters: 24, avgWords: 1080 },
  john: { totalWords: 19340, chapters: 21, avgWords: 920 },
  acts: { totalWords: 24250, chapters: 28, avgWords: 866 },

  // 保罗与使徒书信
  romans: { totalWords: 9440, chapters: 16, avgWords: 590 },
  '1corinthians': { totalWords: 9460, chapters: 16, avgWords: 591 },
  '2corinthians': { totalWords: 6090, chapters: 13, avgWords: 468 },
  galatians: { totalWords: 3080, chapters: 6, avgWords: 513 },
  ephesians: { totalWords: 3020, chapters: 6, avgWords: 503 },
  philippians: { totalWords: 2180, chapters: 4, avgWords: 545 },
  colossians: { totalWords: 1980, chapters: 4, avgWords: 495 },
  '1thessalonians': { totalWords: 1850, chapters: 5, avgWords: 370 },
  '2thessalonians': { totalWords: 1040, chapters: 3, avgWords: 346 },
  '1timothy': { totalWords: 2260, chapters: 6, avgWords: 376 },
  '2timothy': { totalWords: 1700, chapters: 4, avgWords: 425 },
  titus: { totalWords: 920, chapters: 3, avgWords: 306 },
  philemon: { totalWords: 440, chapters: 1, avgWords: 440 },
  hebrews: { totalWords: 6950, chapters: 13, avgWords: 534 },
  james: { totalWords: 2310, chapters: 5, avgWords: 462 },
  '1peter': { totalWords: 2480, chapters: 5, avgWords: 496 },
  '2peter': { totalWords: 1560, chapters: 3, avgWords: 520 },
  '1john': { totalWords: 2520, chapters: 5, avgWords: 504 },
  '2john': { totalWords: 290, chapters: 1, avgWords: 290 },
  '3john': { totalWords: 290, chapters: 1, avgWords: 290 },
  jude: { totalWords: 610, chapters: 1, avgWords: 610 },
  revelation: { totalWords: 11950, chapters: 22, avgWords: 543 }
};

// 获取某章节预估字数
export function getEstimatedChapterWords(bookId, chapter) {
  const meta = BIBLE_WORD_METAS[bookId];
  if (!meta) return 800;
  // 特殊大章节特殊处理
  if (bookId === 'psalms') {
    if (chapter === 119) return 3960;
    if (chapter === 117) return 46;
  }
  if (bookId === 'numbers' && chapter === 7) return 2720;
  return meta.avgWords || 800;
}
