import { bibleIndex } from '@/static/bible-data/bible-index.js';
import { BOOK_METAS, DIFFICULTY_LEVEL } from './bible-meta.js';
import { BIBLE_WORD_METAS, getEstimatedChapterWords } from './bible-word-meta.js';
import { BIBLE_API_BASE } from '../config.js';

// 统一封装云端请求
function requestCloud(url, method = 'GET', data = {}) {
  const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
  const openid = (userInfo && userInfo.openid) ? userInfo.openid : '';
  return new Promise((resolve) => {
    uni.request({
      url: `${BIBLE_API_BASE}${url}`,
      method: method,
      data: data,
      timeout: 5000,
      header: {
        'content-type': 'application/json',
        'x-openid': openid
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve({ success: true, data: res.data.data });
        } else {
          resolve({ success: false, msg: res.data?.msg || '网络异常' });
        }
      },
      fail: (err) => resolve({ success: false, msg: '网络异常' })
    });
  });
}

// 严格大写枚举定义：PLANNING (创建定制中), COLD_START (等待开跑/冷启动), SCALING (进行中/全力推进), COMPLETED (已完成)
export const PLAN_STATUS = {
  PLANNING: 'PLANNING',     // 创建/筹备定制中（尚未正式创建或重新定制向导）
  COLD_START: 'COLD_START', // 等待开跑 / 冷启动准备期（已设定目标，等待开跑或集结队友）
  SCALING: 'SCALING',       // 进行中 / 全力推进期（正式通读打卡，字数驱动周平衡）
  COMPLETED: 'COMPLETED'    // 已完成通读
};

export const WEEK_STATUS = {
  ON_TRACK: 'ON_TRACK',
  BEHIND: 'BEHIND',
  AHEAD: 'AHEAD'
};

export const DAILY_GOAL_STATUS = {
  UNFINISHED: 'UNFINISHED',
  FINISHED: 'FINISHED'
};

export const TIME_SLOT = {
  MORNING: 'MORNING',   // 晨更 (06:00 - 08:30)
  NOON: 'NOON',         // 午休 (12:00 - 13:30)
  NIGHT: 'NIGHT',       // 睡前 (21:30 - 23:30)
  FLEXIBLE: 'FLEXIBLE'  // 弹性碎片
};

const STORAGE_KEY = 'VALLEY_BIBLE_DYNAMIC_WORD_PLAN_V2';

// 获取当前日期字符串 YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取本周一零点的日期对象
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

class BiblePlanManager {
  constructor() {
    this.plan = null;
    this.lastSyncTime = null;
    this.init();
  }

  // 初始化或从缓存恢复
  init() {
    try {
      const cached = uni.getStorageSync(STORAGE_KEY);
      if (cached) {
        this.plan = typeof cached === 'string' ? JSON.parse(cached) : cached;
        // 兼容处理旧数据中的状态值大写统一
        if (this.plan && this.plan.status) {
          if (this.plan.status === 'IN_PROGRESS' || this.plan.status === 'RUNNING') {
            this.plan.status = PLAN_STATUS.SCALING;
          } else if (this.plan.status === 'NOT_STARTED' || this.plan.status === 'WAITING') {
            this.plan.status = PLAN_STATUS.COLD_START;
          }
        }
      }
    } catch (e) {
      console.error('加载读经计划缓存失败', e);
    }

    if (!this.plan) {
      this.plan = this.createEmptyPlanningData();
    }
    
    // 异步拉取云端计划同步（不阻塞本地主流程）
    setTimeout(() => {
        this.pullAndMerge();
    }, 1000);
  }

  // 创建未正式启动的筹备期空计划对象
  createEmptyPlanningData() {
    const today = getTodayString();
    return {
      status: PLAN_STATUS.PLANNING,
      planName: '半年通读计划（字数动态结合法）',
      startDate: today,
      targetWeeks: 26,
      dailyTargetWords: 5000,
      weeklyTargetWords: 35000,
      totalBibleWords: 930000,
      timeSlot: TIME_SLOT.NIGHT,
      focusMinutesTotal: 0,
      todayFocusMinutes: 0,
      dailyFocusMinutes: {},
      lastFocusDate: today,
      streakDays: 0,
      lastReadDate: '',
      finishedChapters: {},
      mainTrack: { sn: 1, bookId: 'genesis', chapter: 1 },
      subTrack: { sn: 40, bookId: 'matthew', chapter: 1 }
    };
  }

  // 正式创建计划：转入 COLD_START（等待开跑）或 SCALING（立即开跑）
  createPlan({ targetWeeks = 26, dailyTargetWords = 5000, timeSlot = TIME_SLOT.NIGHT, startDate = null, startImmediately = false }) {
    const today = getTodayString();
    const start = startDate || today;
    const isFuture = start > today;
    
    // 如果起跑日期在未来，或用户未选择立即开跑 -> 状态进入 COLD_START（等待开跑）；否则直接进入 SCALING（进行中）
    const status = (isFuture || !startImmediately) ? PLAN_STATUS.COLD_START : PLAN_STATUS.SCALING;

    this.plan = {
      status: status,
      planName: `${targetWeeks === 52 ? '一年' : targetWeeks === 14 ? '百日' : '半年'}通读计划（字数动态结合法）`,
      startDate: start,
      targetWeeks: targetWeeks,
      dailyTargetWords: dailyTargetWords,
      weeklyTargetWords: dailyTargetWords * 7,
      totalBibleWords: 930000,
      timeSlot: timeSlot,
      focusMinutesTotal: 0,
      todayFocusMinutes: 0,
      dailyFocusMinutes: {},
      lastFocusDate: today,
      streakDays: status === PLAN_STATUS.SCALING ? 1 : 0,
      lastReadDate: status === PLAN_STATUS.SCALING ? today : '',
      finishedChapters: {},
      mainTrack: { sn: 1, bookId: 'genesis', chapter: 1 },
      subTrack: { sn: 40, bookId: 'matthew', chapter: 1 }
    };

    this.save();
    return this.plan;
  }

  // 用户点击“正式开启开跑”仪式按钮，推进至 SCALING
  startPlan() {
    if (!this.plan) return null;
    this.plan.status = PLAN_STATUS.SCALING;
    this.plan.streakDays = Math.max(1, this.plan.streakDays || 1);
    if (!this.plan.lastReadDate) this.plan.lastReadDate = getTodayString();
    this.save();
    return this.plan;
  }

  // 重置回 PLANNING 重新定制向导
  resetToPlanning() {
    this.plan = this.createEmptyPlanningData();
    this.save();
    return this.plan;
  }

  save() {
    try {
      uni.setStorageSync(STORAGE_KEY, this.plan);
    } catch (e) {
      console.error('保存读经计划失败', e);
    }
    this.debounceSyncToCloud();
  }

  debounceSyncToCloud() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this.syncToCloud();
    }, 2000); // 2秒防抖
  }

// 挑选进度更靠前的书卷/章节指针（防止空白新设备重置老设备阅读进度）
function pickFurtherTrack(localTrack, cloudTrack) {
  if (!localTrack && !cloudTrack) return { sn: 1, bookId: 'genesis', chapter: 1 };
  if (!localTrack) return cloudTrack;
  if (!cloudTrack) return localTrack;

  const isLocalInitial = (Number(localTrack.sn) === 1 || !localTrack.sn) && (Number(localTrack.chapter) === 1 || !localTrack.chapter);
  const isCloudInitial = (Number(cloudTrack.sn) === 1 || !cloudTrack.sn) && (Number(cloudTrack.chapter) === 1 || !cloudTrack.chapter);

  if (isLocalInitial && !isCloudInitial) return cloudTrack;
  if (isCloudInitial && !isLocalInitial) return localTrack;

  const localSn = Number(localTrack.sn) || 1;
  const cloudSn = Number(cloudTrack.sn) || 1;
  if (localSn > cloudSn) return localTrack;
  if (cloudSn > localSn) return cloudTrack;

  const localChap = Number(localTrack.chapter) || 1;
  const cloudChap = Number(cloudTrack.chapter) || 1;
  if (localChap > cloudChap) return localTrack;
  return cloudTrack;
}

function pickFurtherSubTrack(localTrack, cloudTrack) {
  if (!localTrack && !cloudTrack) return { sn: 40, bookId: 'matthew', chapter: 1 };
  if (!localTrack) return cloudTrack;
  if (!cloudTrack) return localTrack;

  const isLocalInitial = (Number(localTrack.sn) === 40 || !localTrack.sn) && (Number(localTrack.chapter) === 1 || !localTrack.chapter);
  const isCloudInitial = (Number(cloudTrack.sn) === 40 || !cloudTrack.sn) && (Number(cloudTrack.chapter) === 1 || !cloudTrack.chapter);

  if (isLocalInitial && !isCloudInitial) return cloudTrack;
  if (isCloudInitial && !isLocalInitial) return localTrack;

  const localSn = Number(localTrack.sn) || 40;
  const cloudSn = Number(cloudTrack.sn) || 40;
  if (localSn > cloudSn) return localTrack;
  if (cloudSn > localSn) return cloudTrack;

  const localChap = Number(localTrack.chapter) || 1;
  const cloudChap = Number(cloudTrack.chapter) || 1;
  if (localChap > cloudChap) return localTrack;
  return cloudTrack;
}

  // 智能并集合并两个读经计划，保证老用户数据“只增不减、绝对不丢失”
  mergePlans(localPlan, cloudPlan) {
    if (!localPlan) return cloudPlan;
    if (!cloudPlan) return localPlan;

    // 1. 合并打卡章节 (并集，任何一端打过勾的章节都必须保留)
    const localFinished = localPlan.finishedChapters || {};
    const cloudFinished = cloudPlan.finishedChapters || {};
    const mergedFinished = { ...cloudFinished, ...localFinished };

    // 2. 总字数、今日专注时长取最大值（防止任何进度被截断）
    const mergedTotalWords = Math.max(
      Number(localPlan.totalFinishedWords) || 0,
      Number(cloudPlan.totalFinishedWords) || 0
    );
    const mergedFocusMinutes = Math.max(
      Number(localPlan.todayFocusMinutes) || 0,
      Number(cloudPlan.todayFocusMinutes) || 0
    );
    const mergedFocusTotal = Math.max(
      Number(localPlan.focusMinutesTotal) || 0,
      Number(cloudPlan.focusMinutesTotal) || 0
    );
    const mergedStreakDays = Math.max(
      Number(localPlan.streakDays) || 0,
      Number(cloudPlan.streakDays) || 0
    );

    // 3. 智能合并主轨与辅轨卷章进度 (核心修复：永远取进度更靠前的书卷指针，防止新设备空白创世记1章覆盖已有成果)
    const mergedMainTrack = pickFurtherTrack(localPlan.mainTrack, cloudPlan.mainTrack);
    const mergedSubTrack = pickFurtherSubTrack(localPlan.subTrack, cloudPlan.subTrack);

    // 3.5 合并 dailyFocusMinutes 每日时长历史字典 (按天取较大值，绝不遗漏)
    const mergedDailyFocus = { ...(cloudPlan.dailyFocusMinutes || {}) };
    const localDailyFocus = localPlan.dailyFocusMinutes || {};
    for (const d in localDailyFocus) {
      mergedDailyFocus[d] = Math.max(mergedDailyFocus[d] || 0, localDailyFocus[d] || 0);
    }

    // 4. 状态合并 (大写枚举统一)
    let mergedStatus = localPlan.status || cloudPlan.status || PLAN_STATUS.PLANNING;
    if (cloudPlan.status === PLAN_STATUS.SCALING || localPlan.status === PLAN_STATUS.SCALING) {
      mergedStatus = PLAN_STATUS.SCALING;
    } else if (cloudPlan.status === PLAN_STATUS.COLD_START || localPlan.status === PLAN_STATUS.COLD_START) {
      mergedStatus = PLAN_STATUS.COLD_START;
    }

    const mergedDailyTarget = cloudPlan.dailyTargetWords || localPlan.dailyTargetWords || 5000;

    return {
      ...cloudPlan,
      ...localPlan,
      status: mergedStatus,
      mainTrack: mergedMainTrack,
      subTrack: mergedSubTrack,
      finishedChapters: mergedFinished,
      totalFinishedWords: mergedTotalWords,
      todayFocusMinutes: mergedFocusMinutes,
      focusMinutesTotal: mergedFocusTotal,
      streakDays: mergedStreakDays,
      dailyFocusMinutes: mergedDailyFocus,
      targetWeeks: cloudPlan.targetWeeks || localPlan.targetWeeks || 26,
      dailyTargetWords: mergedDailyTarget,
      weeklyTargetWords: mergedDailyTarget * 7,
      startDate: cloudPlan.startDate || localPlan.startDate || getTodayString(),
      timeSlot: cloudPlan.timeSlot || localPlan.timeSlot || TIME_SLOT.NIGHT,
      lastReadDate: localPlan.lastReadDate || cloudPlan.lastReadDate || getTodayString()
    };
  }

  async syncToCloud(showToast = false) {
    const userInfo = uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1') || uni.getStorageSync('VALLEY_USER_INFO');
    const openid = userInfo ? userInfo.openid : null;
    if (!openid || openid.startsWith('mock_') || openid.startsWith('user_') || openid.startsWith('wx_user_')) {
      if (showToast) {
        uni.showToast({ title: '请先绑定微信再同步', icon: 'none' });
      }
      return { success: false, msg: '未绑定微信' };
    }
    
    try {
      const res = await requestCloud('/plan/sync', 'POST', {
        openid: openid,
        planJson: this.plan
      });
      if (res && res.success) {
        this.lastSyncTime = Date.now();
        try {
          uni.setStorageSync('VALLEY_PLAN_LAST_SYNC_TIME', this.lastSyncTime);
        } catch (e) {}
        if (showToast) {
          uni.showToast({ title: '已同步至云端', icon: 'success' });
        }
        return { success: true };
      } else {
        if (showToast) {
          uni.showToast({ title: res?.msg || '同步失败', icon: 'none' });
        }
        return { success: false, msg: res?.msg };
      }
    } catch (e) {
      console.warn('[PlanSync] 云端同步失败', e);
      if (showToast) {
        uni.showToast({ title: '网络异常，同步失败', icon: 'none' });
      }
      return { success: false, msg: e.message };
    }
  }

  restoreFromCloud(cloudPlan) {
    if (!cloudPlan) return;
    // 智能并集合并，杜绝直接覆盖造成老用户数据丢失
    this.plan = this.mergePlans(this.plan, cloudPlan);
    try {
      uni.setStorageSync(STORAGE_KEY, this.plan);
    } catch (e) {}
    this.lastSyncTime = Date.now();
    try {
      uni.setStorageSync('VALLEY_PLAN_LAST_SYNC_TIME', this.lastSyncTime);
    } catch (e) {}
    console.log('[PlanSync] 已完成云端计划智能并集合并还原');
  }

  async pullAndMerge(showToast = false) {
    const userInfo = uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1') || uni.getStorageSync('VALLEY_USER_INFO');
    const openid = userInfo ? userInfo.openid : null;
    if (!openid || openid.startsWith('mock_') || openid.startsWith('user_') || openid.startsWith('wx_user_')) {
      if (showToast) {
        uni.showToast({ title: '请先绑定微信', icon: 'none' });
      }
      return { success: false, msg: '未绑定微信' };
    }

    try {
      const res = await requestCloud('/plan/pull?openid=' + encodeURIComponent(openid), 'GET');
      if (res.success && res.data && res.data.plan) {
        this.restoreFromCloud(res.data.plan);
        // 合并后，将最全的合集再推回云端，保证云端与本地同步达到最全
        this.syncToCloud(false);
        if (showToast) {
          uni.showToast({ title: '云端数据已恢复', icon: 'success' });
        }
        return { success: true };
      } else {
        // 云端没备份，但本地有，主动推到云端备一份
        if (this.plan && Object.keys(this.plan.finishedChapters || {}).length > 0) {
          this.syncToCloud(false);
        }
        if (showToast) {
          uni.showToast({ title: '云端暂无历史记录', icon: 'none' });
        }
        return { success: false, msg: '云端暂无历史记录' };
      }
    } catch (e) {
      console.warn('[PlanSync] 云端拉取合并失败', e);
      if (showToast) {
        uni.showToast({ title: '拉取失败，请检查网络', icon: 'none' });
      }
      return { success: false, msg: e.message };
    }
  }

  getLastSyncTime() {
    if (!this.lastSyncTime) {
      try {
        this.lastSyncTime = uni.getStorageSync('VALLEY_PLAN_LAST_SYNC_TIME') || null;
      } catch (e) {}
    }
    return this.lastSyncTime;
  }

  getFinishedChaptersCount() {
    if (!this.plan || !this.plan.finishedChapters) return 0;
    return Object.keys(this.plan.finishedChapters).filter(k => this.plan.finishedChapters[k]).length;
  }

  getPlanData() {
    if (!this.plan) this.init();
    if (!this.plan.dailyFocusMinutes) {
      this.plan.dailyFocusMinutes = {};
    }
    const today = getTodayString();
    if (this.plan.lastFocusDate && this.plan.lastFocusDate !== today) {
      // 将旧日的专注时长固化留存在历史档案字典中，杜绝跨天被直接覆盖清零
      if (this.plan.todayFocusMinutes > 0) {
        this.plan.dailyFocusMinutes[this.plan.lastFocusDate] = Math.max(
          this.plan.dailyFocusMinutes[this.plan.lastFocusDate] || 0,
          this.plan.todayFocusMinutes
        );
      }
      this.plan.todayFocusMinutes = 0;
      this.plan.lastFocusDate = today;
      this.save();
    }
    return this.plan;
  }

  // 设置每日字数目标档位（如 3000 / 5000 / 8000）
  setDailyTargetWords(words) {
    if (words > 0) {
      this.plan.dailyTargetWords = words;
      this.plan.weeklyTargetWords = words * 7;
      this.save();
    }
  }

  // 判断某一章是否已读
  isChapterFinished(sn, chapter) {
    const key = `volume-${sn}-chapter-${chapter}`;
    return !!this.plan.finishedChapters[key];
  }

  // 统计累计已读字数总计
  getTotalFinishedWords() {
    let sum = 0;
    const records = this.plan.finishedChapters || {};
    for (const key in records) {
      sum += (records[key].words || 0);
    }
    return sum;
  }

  // 统计今日已读字数
  getTodayFinishedWords() {
    const today = getTodayString();
    let sum = 0;
    const records = this.plan.finishedChapters || {};
    for (const key in records) {
      if (records[key].date === today) {
        sum += (records[key].words || 0);
      }
    }
    return sum;
  }

  // 统计已读章节总数
  getFinishedChaptersCount() {
    return Object.keys(this.plan.finishedChapters || {}).length;
  }

  // 标记某一章已读，同时传入精确字数（若未传则用预估字数）
  markChapterFinished(sn, chapter, exactWords = null) {
    if (!this.plan) this.init();
    if (!this.plan.finishedChapters) this.plan.finishedChapters = {};

    const book = bibleIndex.find(b => b.sn === sn);
    if (!book) return false;

    const key = `volume-${sn}-chapter-${chapter}`;
    const today = getTodayString();
    const words = exactWords || getEstimatedChapterWords(book.bookId, chapter);

    this.plan.finishedChapters[key] = {
      date: today,
      words: words
    };

    // 连续天数计算
    if (this.plan.lastReadDate !== today) {
      const lastDate = this.plan.lastReadDate ? new Date(this.plan.lastReadDate) : null;
      const curDate = new Date(today);
      if (lastDate) {
        const dayDiff = Math.round((curDate - lastDate) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          this.plan.streakDays = (this.plan.streakDays || 0) + 1;
        } else if (dayDiff > 1) {
          this.plan.streakDays = 1;
        }
      } else {
        this.plan.streakDays = 1;
      }
      this.plan.lastReadDate = today;
    }

    // 推进主轨或辅轨指针
    this.advancePointer(sn, chapter);

    if (this.getTotalFinishedWords() >= this.plan.totalBibleWords) {
      this.plan.status = PLAN_STATUS.COMPLETED;
    }

    this.save();
    return true;
  }

  // 取消某一章已读打卡
  unmarkChapterFinished(sn, chapter, exactWords = null) {
    if (!this.plan) this.init();
    if (!this.plan.finishedChapters) this.plan.finishedChapters = {};

    const key = `volume-${sn}-chapter-${chapter}`;
    if (this.plan.finishedChapters[key]) {
      delete this.plan.finishedChapters[key];
      this.save();
      return true;
    }
    return false;
  }

  advancePointer(sn, chapter) {
    const book = bibleIndex.find(b => b.sn === sn);
    if (!book) return;

    const isOld = book.newOrOld === 0;
    const targetTrack = isOld ? this.plan.mainTrack : this.plan.subTrack;

    if (targetTrack.sn === sn && targetTrack.chapter === chapter) {
      if (chapter < book.chapters) {
        targetTrack.chapter = chapter + 1;
      } else {
        let nextSn = sn + 1;
        if (isOld && nextSn > 39) {
          nextSn = 1;
        } else if (!isOld && nextSn > 66) {
          nextSn = 40;
        }
        const nextBook = bibleIndex.find(b => b.sn === nextSn);
        if (nextBook) {
          targetTrack.sn = nextBook.sn;
          targetTrack.bookId = nextBook.bookId;
          targetTrack.chapter = 1;
        }
      }
    }
  }

  // 真实秒数平滑累加（离开页面、暂停、打卡或定时器结算时调用，读多久记多久）
  accumulateFocusSeconds(seconds) {
    if (!seconds || seconds <= 0) return 0;
    if (!this.plan) this.init();
    if (!this.plan.dailyFocusMinutes) this.plan.dailyFocusMinutes = {};

    const today = getTodayString();
    if (this.plan.lastFocusDate && this.plan.lastFocusDate !== today) {
      if (this.plan.todayFocusMinutes > 0) {
        this.plan.dailyFocusMinutes[this.plan.lastFocusDate] = Math.max(
          this.plan.dailyFocusMinutes[this.plan.lastFocusDate] || 0,
          this.plan.todayFocusMinutes
        );
      }
      this.plan.todayFocusMinutes = 0;
      this.plan.lastFocusDate = today;
    }

    // 至少30秒折算为1分钟，其他按四舍五入或进位计算，保证短时阅读不丢失
    const addedMinutes = Math.max(1, Math.round(seconds / 60));
    this.plan.todayFocusMinutes = (this.plan.todayFocusMinutes || 0) + addedMinutes;
    this.plan.focusMinutesTotal = (this.plan.focusMinutesTotal || 0) + addedMinutes;
    this.plan.dailyFocusMinutes[today] = (this.plan.dailyFocusMinutes[today] || 0) + addedMinutes;

    this.save();
    return addedMinutes;
  }

  // 记录番茄专注分钟数 (兼容原有 25 分钟整番茄钟达成)
  recordFocusSession(minutes = 25) {
    if (!this.plan) this.init();
    if (!this.plan.dailyFocusMinutes) this.plan.dailyFocusMinutes = {};
    const today = getTodayString();
    if (this.plan.lastFocusDate && this.plan.lastFocusDate !== today) {
      if (this.plan.todayFocusMinutes > 0) {
        this.plan.dailyFocusMinutes[this.plan.lastFocusDate] = Math.max(
          this.plan.dailyFocusMinutes[this.plan.lastFocusDate] || 0,
          this.plan.todayFocusMinutes
        );
      }
      this.plan.todayFocusMinutes = 0;
      this.plan.lastFocusDate = today;
    }
    this.plan.todayFocusMinutes = (this.plan.todayFocusMinutes || 0) + minutes;
    this.plan.focusMinutesTotal = (this.plan.focusMinutesTotal || 0) + minutes;
    this.plan.dailyFocusMinutes[today] = (this.plan.dailyFocusMinutes[today] || 0) + minutes;
    this.save();
  }

  // 获取特定日期的专注时长历史记录
  getFocusMinutesByDate(dateStr) {
    if (!this.plan) this.init();
    const today = getTodayString();
    if (dateStr === today) {
      return this.plan.todayFocusMinutes || 0;
    }
    return (this.plan.dailyFocusMinutes && this.plan.dailyFocusMinutes[dateStr]) || 0;
  }

  // 全局番茄钟持久会话管理（解决换经卷、离开页面被重置问题）
  getFocusTimerSession() {
    try {
      const session = uni.getStorageSync('VALLEY_FOCUS_TIMER_SESSION');
      if (session) {
        return typeof session === 'string' ? JSON.parse(session) : session;
      }
    } catch (e) {}
    return null;
  }

  saveFocusTimerSession(session) {
    try {
      if (session) {
        uni.setStorageSync('VALLEY_FOCUS_TIMER_SESSION', session);
      } else {
        uni.removeStorageSync('VALLEY_FOCUS_TIMER_SESSION');
      }
    } catch (e) {}
  }

  clearFocusTimerSession() {
    try {
      uni.removeStorageSync('VALLEY_FOCUS_TIMER_SESSION');
    } catch (e) {}
  }

  setTimeSlot(slot) {
    if (Object.values(TIME_SLOT).includes(slot)) {
      this.plan.timeSlot = slot;
      this.save();
    }
  }

  updateTrack(trackType, bookId, chapter) {
    const book = bibleIndex.find(b => b.bookId === bookId);
    if (!book) return;
    
    if (trackType === 'main' && this.plan.mainTrack) {
      this.plan.mainTrack.sn = book.sn;
      this.plan.mainTrack.bookId = book.bookId;
      this.plan.mainTrack.chapter = chapter;
    } else if (trackType === 'sub' && this.plan.subTrack) {
      this.plan.subTrack.sn = book.sn;
      this.plan.subTrack.bookId = book.bookId;
      this.plan.subTrack.chapter = chapter;
    }
    this.save();
  }

  // 周账总账计算（以 3.5 万字为平衡单位）
  getWeeklySummary() {
    const start = new Date(this.plan.startDate);
    const now = new Date();
    const msDiff = now - start;
    const daysSinceStart = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    const currentWeekNumber = Math.min(this.plan.targetWeeks, Math.floor(daysSinceStart / 7) + 1);

    // 本周一
    const thisMonday = getMonday(now);
    const thisMondayStr = thisMonday.toISOString().split('T')[0];

    // 统计本周完成字数
    let weekFinishedWords = 0;
    let weekReadChapters = 0;
    const records = this.plan.finishedChapters || {};
    for (const key in records) {
      const item = records[key];
      if (item.date >= thisMondayStr) {
        weekFinishedWords += (item.words || 0);
        weekReadChapters++;
      }
    }

    const weeklyTargetWords = this.plan.weeklyTargetWords || 35000;
    let status = WEEK_STATUS.ON_TRACK;
    const wordBalance = weekFinishedWords - weeklyTargetWords; // 负数为落后，正数为超额

    if (wordBalance < -4000) {
      status = WEEK_STATUS.BEHIND;
    } else if (wordBalance > 1500) {
      status = WEEK_STATUS.AHEAD;
    }

    return {
      currentWeekNumber,
      totalWeeks: this.plan.targetWeeks,
      weeklyTargetWords,
      weekFinishedWords,
      weekReadChapters,
      wordBalance,
      status,
      tips: this.getWeeklyEncourageTip(status, wordBalance)
    };
  }

  getWeeklyEncourageTip(status, wordBalance) {
    if (status === WEEK_STATUS.BEHIND) {
      const abs = Math.abs(wordBalance);
      return `本周落后约 ${abs.toLocaleString()} 字（仅相当于多读约 15~20 分钟），下周小先知书或叙事段稍作提速即可填平，莫慌张！`;
    }
    if (status === WEEK_STATUS.AHEAD) {
      return `本周已超额完成约 ${wordBalance.toLocaleString()} 字！节奏极其优异，今天可以轻松漫步或专注反刍。`;
    }
    return '本周字数步调非常匀称健康，继续保持每天一个 25 分钟番茄钟，从容吸纳。';
  }

  // 核心：基于【字数驱动】的今日推荐打包算法
  getTodayRecommendation() {
    const mainSn = this.plan.mainTrack.sn;
    const mainBook = bibleIndex.find(b => b.sn === mainSn) || bibleIndex[0];
    const mainMeta = BOOK_METAS[mainBook.bookId] || { difficulty: DIFFICULTY_LEVEL.SMOOTH };

    const isHard = mainMeta.difficulty === DIFFICULTY_LEVEL.HARD;
    const dailyTarget = this.plan.dailyTargetWords || 5000;

    // 分流目标：硬篇分流时，主轨约 65% (3200字)，辅轨约 35% (1800字)；单轨则主轨 100% (5000字)
    const mainTargetWords = isHard ? Math.round(dailyTarget * 0.64) : dailyTarget;
    const subTargetWords = isHard ? Math.round(dailyTarget * 0.36) : 0;

    // 1. 打包主轨章节（直到累计字数满足 mainTargetWords）
    const mainList = [];
    let mainAccumWords = 0;
    let curChap = this.plan.mainTrack.chapter;
    let tempSn = mainSn;
    let tempBook = mainBook;

    while (mainAccumWords < mainTargetWords && tempSn <= 39) {
      const estWords = getEstimatedChapterWords(tempBook.bookId, curChap);
      const isFinished = this.isChapterFinished(tempSn, curChap);

      mainList.push({
        sn: tempSn,
        bookId: tempBook.bookId,
        bookName: tempBook.fullName,
        shortName: tempBook.shortName,
        chapter: curChap,
        words: estWords,
        isFinished: isFinished,
        difficulty: (BOOK_METAS[tempBook.bookId] || {}).difficulty || DIFFICULTY_LEVEL.SMOOTH,
        tag: (BOOK_METAS[tempBook.bookId] || {}).tag || '旧约篇章'
      });

      mainAccumWords += estWords;
      curChap++;
      if (curChap > tempBook.chapters) {
        tempSn++;
        tempBook = bibleIndex.find(b => b.sn === tempSn);
        curChap = 1;
        if (!tempBook) break;
      }
    }

    // 2. 打包辅轨章节（新约/诗歌，直到满足 subTargetWords）
    const subList = [];
    let subAccumWords = 0;
    if (isHard && subTargetWords > 0) {
      let subChap = this.plan.subTrack.chapter;
      let subSn = this.plan.subTrack.sn;
      let subBook = bibleIndex.find(b => b.sn === subSn) || bibleIndex[39];

      while (subAccumWords < subTargetWords && subSn <= 66) {
        const estWords = getEstimatedChapterWords(subBook.bookId, subChap);
        const isFinished = this.isChapterFinished(subSn, subChap);

        subList.push({
          sn: subSn,
          bookId: subBook.bookId,
          bookName: subBook.fullName,
          shortName: subBook.shortName,
          chapter: subChap,
          words: estWords,
          isFinished: isFinished,
          difficulty: DIFFICULTY_LEVEL.SWEET,
          tag: (BOOK_METAS[subBook.bookId] || {}).tag || '新约/诗歌'
        });

        subAccumWords += estWords;
        subChap++;
        if (subChap > subBook.chapters) {
          subSn++;
          subBook = bibleIndex.find(b => b.sn === subSn);
          subChap = 1;
          if (!subBook) break;
        }
      }
    }

    return {
      isSplitMode: isHard,
      targetWords: dailyTarget,
      mainAccumWords,
      subAccumWords,
      totalRecommendedWords: mainAccumWords + subAccumWords,
      modeTitle: isHard ? '双轨分流模式（硬篇减量 + 新约诗篇滋润）' : '单轨顺畅模式（叙事连贯畅读）',
      modeDesc: isHard
        ? `当前处于【${mainBook.fullName}】等深奥篇目。系统按字数科学拆解：主轨约 ${mainAccumWords.toLocaleString()} 字 + 辅轨约 ${subAccumWords.toLocaleString()} 字，绝不连吃硬菜！`
        : `当前处于【${mainBook.fullName}】等叙事通畅篇目。今日打包约 ${mainAccumWords.toLocaleString()} 字，对应 25 分钟番茄钟，一气呵成！`,
      mainTrackTitle: isHard ? `主轨·先知/律法（约 ${mainAccumWords} 字）` : `主线·通畅畅读（约 ${mainAccumWords} 字）`,
      mainList,
      subTrackTitle: `辅轨·新约/诗篇（约 ${subAccumWords} 字）`,
      subList
    };
  }

  resetPlan() {
    return this.resetToPlanning();
  }
}

export const planManager = new BiblePlanManager();
