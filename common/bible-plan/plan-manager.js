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

// 获取指定日期所属周的礼拜天（周日，第一天）零点日期对象
function getSunday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 是周日, 1-6 是周一到周六
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// 格式化日期对象为 YYYY-MM-DD
function formatDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// 全书总章数（用于循环保护上限）
const TOTAL_CHAPTERS = bibleIndex.reduce((sum, b) => sum + (Number(b.chapters) || 0), 0) || 1189;

// 获取下一章位置（读到第 66 卷末尾时回到创世记 1 章）
function getNextChapterPos(sn, chapter) {
  const book = bibleIndex.find(b => b.sn === sn);
  if (book && chapter < book.chapters) {
    return { sn, chapter: chapter + 1 };
  }
  const nextSn = sn + 1 > 66 ? 1 : sn + 1;
  return { sn: nextSn, chapter: 1 };
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
        // 数据自愈：修复历史异常数据（如番茄钟失控记录的 260 分钟校正为合理的 25 分钟，今日未读经清零）
        if (this.plan) {
          if (!this.plan.dailyFocusMinutes) this.plan.dailyFocusMinutes = {};
          if (this.plan.dailyFocusMinutes['2026-10-12'] === 260) {
            this.plan.dailyFocusMinutes['2026-10-12'] = 25;
          }
          for (const d in this.plan.dailyFocusMinutes) {
            if (this.plan.dailyFocusMinutes[d] > 180) {
              this.plan.dailyFocusMinutes[d] = 25;
            }
          }
          const todayStr = getTodayString();
          if (this.plan.lastFocusDate !== todayStr) {
            this.plan.todayFocusMinutes = 0;
            this.plan.lastFocusDate = todayStr;
          } else if (this.plan.todayFocusMinutes >= 180) {
            this.plan.todayFocusMinutes = 0;
          }
          // 轨道指针自愈：跳过已读章节（修复历史版本指针卡在已读章节的问题）
          this.normalizeAllTrackPointers();
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

  // 智能并集合并两个读经计划，保证老用户数据“只增不减、绝对不丢失”
  mergePlans(localPlan, cloudPlan) {
    if (!localPlan) return cloudPlan;
    if (!cloudPlan) return localPlan;

    // 1. 合并打卡章节 (并集，任何一端打过勾的章节都必须保留)
    const localFinished = localPlan.finishedChapters || {};
    const cloudFinished = cloudPlan.finishedChapters || {};
    const mergedFinished = { ...cloudFinished, ...localFinished };

    // 2. 总字数、专注总时长取最大值（防止任何进度被截断）
    const mergedTotalWords = Math.max(
      Number(localPlan.totalFinishedWords) || 0,
      Number(cloudPlan.totalFinishedWords) || 0
    );
    const mergedFocusTotal = Math.max(
      Number(localPlan.focusMinutesTotal) || 0,
      Number(cloudPlan.focusMinutesTotal) || 0
    );
    // 智能合并连续天数：优先以 lastReadDate 较新的一端为准，防止断卡重置后被旧设备历史最大值“复活”
    let mergedStreakDays = 0;
    const localDate = localPlan.lastReadDate || '';
    const cloudDate = cloudPlan.lastReadDate || '';
    if (localDate && cloudDate) {
      if (localDate > cloudDate) {
        mergedStreakDays = Number(localPlan.streakDays) || 0;
      } else if (cloudDate > localDate) {
        mergedStreakDays = Number(cloudPlan.streakDays) || 0;
      } else {
        mergedStreakDays = Math.max(Number(localPlan.streakDays) || 0, Number(cloudPlan.streakDays) || 0);
      }
    } else {
      mergedStreakDays = Number(localPlan.streakDays) || Number(cloudPlan.streakDays) || 0;
    }

    // 3. 智能合并主轨与辅轨卷章进度 (核心修复：永远取进度更靠前的书卷指针，防止新设备空白创世记1章覆盖已有成果)
    const mergedMainTrack = pickFurtherTrack(localPlan.mainTrack, cloudPlan.mainTrack);
    const mergedSubTrack = pickFurtherSubTrack(localPlan.subTrack, cloudPlan.subTrack);

    // 3.5 合并 dailyFocusMinutes 每日时长历史字典 (按天取较大值，绝不遗漏)
    const mergedDailyFocus = { ...(cloudPlan.dailyFocusMinutes || {}) };
    const localDailyFocus = localPlan.dailyFocusMinutes || {};
    for (const d in localDailyFocus) {
      mergedDailyFocus[d] = Math.max(mergedDailyFocus[d] || 0, localDailyFocus[d] || 0);
    }
    // 过滤/清洗历史异常值（如 10-12 的 260 分钟校正为 25 分钟）
    if (mergedDailyFocus['2026-10-12'] === 260) {
      mergedDailyFocus['2026-10-12'] = 25;
    }
    for (const d in mergedDailyFocus) {
      if (mergedDailyFocus[d] > 180) {
        mergedDailyFocus[d] = 25;
      }
    }

    // 智能合并今日专注时长：严格校验 lastFocusDate，防止昨日甚至更早的历史数据跨天复活污染今天
    const today = getTodayString();
    let cloudTodayFocus = 0;
    if (cloudPlan.lastFocusDate === today) {
      cloudTodayFocus = Math.min(180, Number(cloudPlan.todayFocusMinutes) || 0);
    } else if (cloudPlan.lastFocusDate && Number(cloudPlan.todayFocusMinutes) > 0) {
      // 云端今日时长属于旧日期，归入对应旧日期的历史字典
      const oldMins = Math.min(180, Number(cloudPlan.todayFocusMinutes));
      mergedDailyFocus[cloudPlan.lastFocusDate] = Math.max(
        mergedDailyFocus[cloudPlan.lastFocusDate] || 0,
        oldMins
      );
    }

    let localTodayFocus = 0;
    if (localPlan.lastFocusDate === today) {
      localTodayFocus = Math.min(180, Number(localPlan.todayFocusMinutes) || 0);
    } else if (localPlan.lastFocusDate && Number(localPlan.todayFocusMinutes) > 0) {
      // 本地今日时长属于旧日期，归入对应旧日期的历史字典
      const oldMins = Math.min(180, Number(localPlan.todayFocusMinutes));
      mergedDailyFocus[localPlan.lastFocusDate] = Math.max(
        mergedDailyFocus[localPlan.lastFocusDate] || 0,
        oldMins
      );
    }

    const mergedFocusMinutes = Math.max(localTodayFocus, cloudTodayFocus);

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
      startDate: cloudPlan.startDate || localPlan.startDate || today,
      timeSlot: cloudPlan.timeSlot || localPlan.timeSlot || TIME_SLOT.NIGHT,
      lastReadDate: localPlan.lastReadDate || cloudPlan.lastReadDate || today,
      lastFocusDate: today
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
    // 合并后以已读记录为准校正指针（修复：读完启示录绕回创世记后被云端旧指针覆盖回退的问题）
    this.normalizeAllTrackPointers();
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
    // 跨天检测：断卡重置判定
    if (this.plan.lastReadDate && this.plan.lastReadDate !== today) {
      const lastDate = new Date(this.plan.lastReadDate.replace(/-/g, '/'));
      const curDate = new Date(today.replace(/-/g, '/'));
      const dayDiff = Math.round((curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      // 若间隔超过1天未打卡，说明断卡了，连续天数重置为0（今日打卡后会变成1）
      if (dayDiff > 1 && (this.plan.streakDays || 0) > 0) {
        this.plan.streakDays = 0;
        this.save();
      }
    }

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

  // 获取根据本周完成节奏自适应平摊后的今日目标字数
  getDynamicDailyTargetWords() {
    try {
      const summary = this.getWeeklySummary();
      if (summary && summary.dynamicDailyTarget) {
        return summary.dynamicDailyTarget;
      }
    } catch (e) {}
    return (this.plan && this.plan.dailyTargetWords) || 5000;
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
      const lastDate = this.plan.lastReadDate ? new Date(this.plan.lastReadDate.replace(/-/g, '/')) : null;
      const curDate = new Date(today.replace(/-/g, '/'));
      if (lastDate && !isNaN(lastDate.getTime())) {
        const dayDiff = Math.round((curDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
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

    // 判断打卡章节匹配哪个轨道（按指针位置匹配，不按旧约/新约区分）
    let targetTrack = null;
    if (this.plan.mainTrack && this.plan.mainTrack.sn === sn && this.plan.mainTrack.chapter === chapter) {
      targetTrack = this.plan.mainTrack;
    } else if (this.plan.subTrack && this.plan.subTrack.sn === sn && this.plan.subTrack.chapter === chapter) {
      targetTrack = this.plan.subTrack;
    }
    if (!targetTrack) return;

    const next = getNextChapterPos(sn, chapter);
    const nextBook = bibleIndex.find(b => b.sn === next.sn);
    if (nextBook) {
      targetTrack.sn = nextBook.sn;
      targetTrack.bookId = nextBook.bookId;
      targetTrack.chapter = next.chapter;
    }
    // 推进后继续跳过已读章节，确保指针永远停在「第一章未读」
    this.normalizeTrackPointer(targetTrack);
  }

  // 获取某章的打卡日期（未读返回 null）
  getChapterFinishedDate(sn, chapter) {
    const records = (this.plan && this.plan.finishedChapters) || {};
    const item = records[`volume-${sn}-chapter-${chapter}`];
    return item ? (item.date || '1970-01-01') : null;
  }

  // 轨道指针自愈：从当前位置向后跳过所有已读章节，停在第一章未读处
  // 最多遍历全书一轮；若全书都已读则保持原样。返回是否发生了变化
  normalizeTrackPointer(track) {
    if (!track || !track.sn) return false;
    let pos = { sn: Number(track.sn), chapter: Number(track.chapter) || 1 };
    let moved = false;
    for (let i = 0; i < TOTAL_CHAPTERS; i++) {
      if (!this.getChapterFinishedDate(pos.sn, pos.chapter)) {
        if (moved) {
          const book = bibleIndex.find(b => b.sn === pos.sn);
          if (!book) return false;
          track.sn = book.sn;
          track.bookId = book.bookId;
          track.chapter = pos.chapter;
        }
        return moved;
      }
      pos = getNextChapterPos(pos.sn, pos.chapter);
      moved = true;
    }
    return false; // 全书均已读，不做调整
  }

  normalizeAllTrackPointers() {
    if (!this.plan) return false;
    const a = this.normalizeTrackPointer(this.plan.mainTrack);
    const b = this.normalizeTrackPointer(this.plan.subTrack);
    return a || b;
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

    // 至少30秒折算为1分钟（不足30秒不计入，避免切章/暂停频繁虚增）
    if (seconds < 30) return 0;
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
      this.normalizeTrackPointer(this.plan.mainTrack);
    } else if (trackType === 'sub' && this.plan.subTrack) {
      this.plan.subTrack.sn = book.sn;
      this.plan.subTrack.bookId = book.bookId;
      this.plan.subTrack.chapter = chapter;
      this.normalizeTrackPointer(this.plan.subTrack);
    }
    this.save();
  }

  // 周账总账计算（以礼拜天为一周起点，以周为平衡单位）
  getWeeklySummary() {
    const start = new Date(this.plan.startDate);
    const now = new Date();
    const msDiff = now - start;
    const daysSinceStart = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    const currentWeekNumber = Math.min(this.plan.targetWeeks, Math.floor(daysSinceStart / 7) + 1);

    // 本周礼拜天（周日 00:00:00 为第一天）
    const thisSunday = getSunday(now);
    const thisSundayStr = formatDateString(thisSunday);

    // 统计本周（从周日至今）完成字数
    let weekFinishedWords = 0;
    let weekReadChapters = 0;
    const records = this.plan.finishedChapters || {};
    for (const key in records) {
      const item = records[key];
      if (item.date >= thisSundayStr) {
        weekFinishedWords += (item.words || 0);
        weekReadChapters++;
      }
    }

    const weeklyTargetWords = this.plan.weeklyTargetWords || 35000;
    const baseDailyTarget = this.plan.dailyTargetWords || 5000;
    const todayStr = getTodayString();

    // 计算本周已过去的天数和本周剩余天数
    // 周日为第 1 天（index 0，过去1天），周一为第 2 天（index 1，过去2天）... 周六为第 7 天（index 6，过去7天）
    const dayOfWeek = now.getDay(); // 0(周日) ~ 6(周六)
    const elapsedDaysThisWeek = dayOfWeek + 1; // 1 ~ 7
    const remainingDaysThisWeek = 7 - dayOfWeek; // 包含今天在内本周还剩几天（7 到 1）

    // 今日已读字数
    let todayFinishedWords = 0;
    // 今日之前本周已读字数
    let wordsReadBeforeTodayThisWeek = 0;

    for (const key in records) {
      const item = records[key];
      if (item.date === todayStr) {
        todayFinishedWords += (item.words || 0);
      }
      if (item.date >= thisSundayStr && item.date < todayStr) {
        wordsReadBeforeTodayThisWeek += (item.words || 0);
      }
    }

    // 动态摊销计算：将本周截止今天还差的字数平均分配到包含今天在内的剩余天数
    const remainingWordsNeededFromToday = Math.max(0, weeklyTargetWords - wordsReadBeforeTodayThisWeek);
    let dynamicDailyTarget = Math.round(remainingWordsNeededFromToday / remainingDaysThisWeek);
    if (remainingWordsNeededFromToday === 0) {
      dynamicDailyTarget = 2000;
    } else {
      dynamicDailyTarget = Math.max(2000, Math.min(dynamicDailyTarget, 9000));
    }

    // 判断今天是否已经达成目标（达到动态目标或基础日目标其一，即视为今日达标）
    const isTodayFinished = todayFinishedWords >= Math.min(dynamicDailyTarget, baseDailyTarget);

    // 计算往后几天（从明天开始到周末）平均每天需要阅读的字数
    const remainingDaysAfterToday = 6 - dayOfWeek; // 明天到周六剩余天数（0 ~ 6）
    const remainingWordsAfterToday = Math.max(0, weeklyTargetWords - weekFinishedWords);
    let futureDailyAverageWords = 0;
    if (remainingDaysAfterToday > 0) {
      futureDailyAverageWords = Math.round(remainingWordsAfterToday / remainingDaysAfterToday);
    } else {
      // 若今天是周六，已是本周最后一天
      futureDailyAverageWords = remainingWordsAfterToday;
    }

    // 节奏判定：对比「定制每日目标」与「往后几天日均所需字数」
    // 后续日均明显低于定制目标 => 偏快；明显高于 => 偏慢；容差内 => 正常
    const expectedWordsToDate = Math.round((weeklyTargetWords / 7) * elapsedDaysThisWeek);
    const paceDiff = weekFinishedWords - expectedWordsToDate; // 仅作参考展示
    const paceTolerance = Math.max(500, Math.round(baseDailyTarget * 0.15));
    const futureVsBase = futureDailyAverageWords - baseDailyTarget; // 负数=后续压力更小

    let paceRate = '正常'; // '偏快' | '正常' | '偏慢'
    if (weekFinishedWords >= weeklyTargetWords || futureVsBase <= -paceTolerance) {
      paceRate = '偏快';
    } else if (futureVsBase >= paceTolerance) {
      paceRate = '偏慢';
    }

    // 综合判定 WEEK_STATUS 枚举状态（用于标签色彩和统合）
    let status = WEEK_STATUS.ON_TRACK;
    if (weekFinishedWords >= weeklyTargetWords) {
      status = WEEK_STATUS.AHEAD;
    } else if (paceRate === '偏快') {
      status = WEEK_STATUS.AHEAD;
    } else if (paceRate === '偏慢' && !isTodayFinished) {
      // 只有在节奏偏慢且今日尚未完成的情况下，才标记为 BEHIND
      status = WEEK_STATUS.BEHIND;
    } else {
      status = WEEK_STATUS.ON_TRACK;
    }

    const tips = this.getWeeklyEncourageTip({
      status,
      paceRate,
      isTodayFinished,
      todayFinishedWords,
      dynamicDailyTarget,
      weekFinishedWords,
      weeklyTargetWords,
      remainingDaysAfterToday,
      futureDailyAverageWords,
      paceDiff
    });

    return {
      currentWeekNumber,
      totalWeeks: this.plan.targetWeeks,
      weeklyTargetWords,
      weekFinishedWords,
      weekReadChapters,
      wordBalance: paceDiff, // 进度相对当前天数的差额（更科学直观）
      status,
      paceRate,
      isTodayFinished,
      todayFinishedWords,
      remainingDaysThisWeek,
      remainingDaysAfterToday,
      futureDailyAverageWords,
      dynamicDailyTarget,
      baseDailyTarget,
      tips
    };
  }

  getWeeklyEncourageTip(context) {
    if (typeof context !== 'object') {
      return '本周字数步调匀称健康，继续保持节奏，从容吸纳神的话语。';
    }

    const {
      status,
      paceRate,
      isTodayFinished,
      remainingDaysAfterToday,
      futureDailyAverageWords,
      weekFinishedWords,
      weeklyTargetWords
    } = context;

    // 1. 本周整周已经全部读完
    if (weekFinishedWords >= weeklyTargetWords) {
      return `🎉 本周目标已提前圆满达成！读经节奏超前，往后几天可自由静心默想或轻松重温。`;
    }

    // 2. 如果今天已经完成任务
    if (isTodayFinished) {
      if (remainingDaysAfterToday > 0) {
        return `今日任务已圆满完成！当前读经节奏【${paceRate}】，后续 ${remainingDaysAfterToday} 天日均只需阅读约 ${futureDailyAverageWords.toLocaleString()} 字，从容保持即可。`;
      } else {
        return `今日任务已圆满完成！今天是本周最后一天，当前读经节奏【${paceRate}】，做得非常棒！`;
      }
    }

    // 3. 今天尚未完成任务
    if (paceRate === '偏快') {
      if (remainingDaysAfterToday > 0) {
        return `当前读经节奏【偏快】，进度领先！后续几天日均仅需约 ${futureDailyAverageWords.toLocaleString()} 字，今日按计划跟进即可。`;
      } else {
        return `当前读经节奏【偏快】，冲刺完成今日份额即可圆满收官本周目标！`;
      }
    }

    if (paceRate === '偏慢') {
      if (remainingDaysAfterToday > 0) {
        return `当前读经节奏【偏慢】，完成今日阅读后，后续 ${remainingDaysAfterToday} 天日均约需 ${futureDailyAverageWords.toLocaleString()} 字，稳扎稳打从容跟进！`;
      } else {
        return `本周已到冲刺阶段，当前节奏【偏慢】，今日还需阅读约 ${futureDailyAverageWords.toLocaleString()} 字即可填平本周总账，加油！`;
      }
    }

    // 4. 正常节奏
    if (remainingDaysAfterToday > 0) {
      return `当前读经节奏【正常】，步调匀称健康！后续几天日均约需阅读 ${futureDailyAverageWords.toLocaleString()} 字，继续保持专注。`;
    } else {
      return `当前读经节奏【正常】，完成今日阅读即可达成全周目标，享受与主亲近的时光！`;
    }
  }

  // 获取各周完成情况及各周每日7天明细列表（用于周进度独立历史页面）
  getWeeklyHistoryDetailedList() {
    if (!this.plan) this.init();
    const startDate = new Date(this.plan.startDate || getTodayString());
    const now = new Date();
    const todayStr = getTodayString();
    const records = this.plan.finishedChapters || {};
    const weeklyTargetWords = this.plan.weeklyTargetWords || 35000;
    const baseDailyTarget = this.plan.dailyTargetWords || 5000;

    // 起始周的礼拜天
    const firstSunday = getSunday(startDate);
    const currentSunday = getSunday(now);

    // 计算至今已经历的周数，最多不超过计划设定的 targetWeeks
    const msSinceFirstSunday = Math.max(0, now.getTime() - firstSunday.getTime());
    const weeksPassed = Math.floor(msSinceFirstSunday / (7 * 24 * 3600 * 1000)) + 1;
    const totalDisplayWeeks = Math.max(weeksPassed, 1);

    const weekList = [];
    const dayNames = ['周日(主日)', '周一', '周二', '周三', '周四', '周五', '周六'];

    for (let w = 1; w <= totalDisplayWeeks; w++) {
      // 该周的礼拜天
      const weekSun = new Date(firstSunday.getTime() + (w - 1) * 7 * 24 * 3600 * 1000);
      const weekSat = new Date(weekSun.getTime() + 6 * 24 * 3600 * 1000);
      const weekSunStr = formatDateString(weekSun);
      const weekSatStr = formatDateString(weekSat);

      const isCurrentWeek = weekSunStr === formatDateString(currentSunday);
      const isFutureWeek = weekSun > now;

      // 统计该周7天的每日明细
      const days = [];
      let weekTotalWords = 0;
      let weekTotalChapters = 0;

      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekSun.getTime() + d * 24 * 3600 * 1000);
        const dayDateStr = formatDateString(dayDate);
        const isToday = dayDateStr === todayStr;
        const isDayFuture = dayDateStr > todayStr;

        // 检索该日打卡的章节
        const dayChapters = [];
        let dayWords = 0;

        for (const key in records) {
          const item = records[key];
          if (item.date === dayDateStr) {
            dayWords += (item.words || 0);
            // 解析 key: volume-{sn}-chapter-{chapter}
            const match = key.match(/volume-(\d+)-chapter-(\d+)/);
            if (match) {
              const sn = Number(match[1]);
              const chapter = Number(match[2]);
              const book = bibleIndex.find(b => b.sn === sn);
              dayChapters.push({
                sn,
                chapter,
                bookName: book ? book.fullName : `卷${sn}`,
                shortName: book ? book.shortName : `卷${sn}`,
                words: item.words || 0
              });
            }
          }
        }

        let focusMins = (this.plan.dailyFocusMinutes && this.plan.dailyFocusMinutes[dayDateStr]) || 
                        (isToday ? (this.plan.todayFocusMinutes || 0) : 0);
        if (focusMins > 180) focusMins = 25;

        days.push({
          dateStr: dayDateStr,
          dayName: dayNames[d],
          dayIndex: d,
          isToday,
          isFuture: isDayFuture,
          words: dayWords,
          chaptersCount: dayChapters.length,
          chapters: dayChapters,
          focusMinutes: focusMins,
          isFinishedDailyTarget: dayWords >= baseDailyTarget
        });

        weekTotalWords += dayWords;
        weekTotalChapters += dayChapters.length;
      }

      const percent = Math.min(100, Math.round((weekTotalWords / weeklyTargetWords) * 100));
      let weekStatusTag = '进行中';
      let weekStatusType = 'active'; // active, completed, behind, future

      if (isFutureWeek) {
        weekStatusTag = '未开始';
        weekStatusType = 'future';
      } else if (weekTotalWords >= weeklyTargetWords) {
        weekStatusTag = weekTotalWords > weeklyTargetWords + 1000 ? '超额完成' : '已达标';
        weekStatusType = 'completed';
      } else if (!isCurrentWeek) {
        weekStatusTag = '未达标';
        weekStatusType = 'behind';
      } else {
        weekStatusTag = '进行中';
        weekStatusType = 'active';
      }

      weekList.push({
        weekNumber: w,
        startDateStr: weekSunStr,
        endDateStr: weekSatStr,
        rangeLabel: `${weekSunStr.slice(5).replace('-', '.')} ~ ${weekSatStr.slice(5).replace('-', '.')}`,
        targetWords: weeklyTargetWords,
        finishedWords: weekTotalWords,
        finishedChapters: weekTotalChapters,
        percent,
        isCurrentWeek,
        statusTag: weekStatusTag,
        statusType: weekStatusType,
        days
      });
    }

    // 默认倒序展示（让最新的一周排在最前面，便于查看）
    return weekList.reverse();
  }

  // 核心：基于【动态字数驱动】的今日推荐打包算法（方案B：仅推荐当前未读篇章，已读章节不重复出现在推荐列表中）
  getTodayRecommendation() {
    // 先自愈校正轨道指针（跳过已读章节，确保指针永远停在第一章未读处）
    if (this.normalizeAllTrackPointers()) {
      this.save();
    }

    const mainSn = Number(this.plan.mainTrack.sn);
    const mainBook = bibleIndex.find(b => b.sn === mainSn) || bibleIndex[0];
    const mainMeta = BOOK_METAS[mainBook.bookId] || { difficulty: DIFFICULTY_LEVEL.SMOOTH };

    const isHard = mainMeta.difficulty === DIFFICULTY_LEVEL.HARD;

    // 动态字数配额：取每周平摊自适应建议值
    const summary = this.getWeeklySummary();
    const dailyTarget = summary.dynamicDailyTarget || this.plan.dailyTargetWords || 5000;
    const baseDailyTarget = summary.baseDailyTarget || 5000;

    // 分流目标：硬篇分流时，主轨约 65%，辅轨约 35%；单轨则主轨 100%
    const mainTargetWords = isHard ? Math.round(dailyTarget * 0.64) : dailyTarget;
    const subTargetWords = isHard ? Math.round(dailyTarget * 0.36) : 0;

    // 通用打包函数：从当前指针向后逐章累加未读章节，直到满足目标字数
    const packTrack = (startPos, targetWords, fixedDifficulty, defaultTag) => {
      const list = [];
      let accum = 0;
      let pos = startPos ? { sn: Number(startPos.sn), chapter: Number(startPos.chapter) } : null;
      let guard = 0;
      while (pos && accum < targetWords && guard < TOTAL_CHAPTERS) {
        guard++;
        const book = bibleIndex.find(b => b.sn === pos.sn);
        if (!book) break;

        // 若已读（无论是历史已读还是今日已读），直接跳过（方案B：推荐列表只展示待读任务）
        if (this.isChapterFinished(pos.sn, pos.chapter)) {
          pos = getNextChapterPos(pos.sn, pos.chapter);
          continue;
        }

        const estWords = getEstimatedChapterWords(book.bookId, pos.chapter);
        const meta = BOOK_METAS[book.bookId] || {};
        list.push({
          sn: pos.sn,
          bookId: book.bookId,
          bookName: book.fullName,
          shortName: book.shortName,
          chapter: pos.chapter,
          words: estWords,
          isFinished: false,
          difficulty: fixedDifficulty || meta.difficulty || DIFFICULTY_LEVEL.SMOOTH,
          tag: meta.tag || defaultTag
        });
        accum += estWords;
        pos = getNextChapterPos(pos.sn, pos.chapter);
      }
      return { list, accum };
    };

    // 1. 打包主轨待读章节（直到累计字数满足 mainTargetWords）
    const mainPacked = packTrack(this.plan.mainTrack, mainTargetWords, null, '旧约篇章');
    const mainList = mainPacked.list;
    const mainAccumWords = mainPacked.accum;

    // 2. 打包辅轨待读章节（新约/诗歌，直到满足 subTargetWords）
    let subList = [];
    let subAccumWords = 0;
    if (isHard && subTargetWords > 0) {
      const subPacked = packTrack(this.plan.subTrack, subTargetWords, DIFFICULTY_LEVEL.SWEET, '新约/诗歌');
      subList = subPacked.list;
      subAccumWords = subPacked.accum;
    }

    // 生成动态提示文案
    let dynamicPillTip = `今日自适应建议: ${dailyTarget.toLocaleString()} 字`;
    if (dailyTarget > baseDailyTarget) {
      dynamicPillTip = `动态增量平摊: ${dailyTarget.toLocaleString()} 字/天 (填补前序差额)`;
    } else if (dailyTarget < baseDailyTarget && summary.weekFinishedWords >= summary.weeklyTargetWords) {
      dynamicPillTip = `本周已超额达标! 轻松保底: ${dailyTarget.toLocaleString()} 字`;
    } else if (dailyTarget < baseDailyTarget) {
      dynamicPillTip = `前期超额减负: ${dailyTarget.toLocaleString()} 字/天 (从容漫步)`;
    }

    return {
      isSplitMode: isHard,
      targetWords: dailyTarget,
      baseDailyTarget,
      dynamicPillTip,
      mainAccumWords,
      subAccumWords,
      totalRecommendedWords: mainAccumWords + subAccumWords,
      modeTitle: isHard ? '双轨分流模式（硬篇减量 + 新约诗篇滋润）' : '单轨顺畅模式（叙事连贯畅读）',
      modeDesc: isHard
        ? `当前处于【${mainBook.fullName}】等深奥篇目。系统按动态字数拆解：主轨约 ${mainAccumWords.toLocaleString()} 字 + 辅轨约 ${subAccumWords.toLocaleString()} 字，绝不连吃硬菜！`
        : `当前处于【${mainBook.fullName}】等叙事通畅篇目。今日打包约 ${mainAccumWords.toLocaleString()} 字，对应专注读经，一气呵成！`,
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
