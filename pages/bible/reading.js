// 导入圣经书卷索引，这是我们的"单一数据源"
import { bibleIndex } from '@/static/bible-data/bible-index.js';
import { planManager } from '@/common/bible-plan/plan-manager.js';
import { userTeamManager } from '@/common/bible-plan/user-team-manager.js';
import { getSectionHeading, isPoetryVerse, parseProperNouns } from '@/common/bible-plan/bible-headings.js';
import { BIBLE_ASSETS_BASE } from '@/common/config.js';
import { isAuditMode } from '@/common/audit-guard.js';

export default {
	data() {
		return {
			isAudit: true, // 初始绝对处于审核伪装态
			bookId: '',    // e.g., 'genesis'
			chapter: 1,    // e.g., 1
			verses: [],    // 经文数组
			paperBlocks: [], // 纸版分段结构化数据块 (小标题、Drop Cap、上标节号、诗歌体)
			readingMode: 'paper', // 'paper': 微读圣经纸版连续排版; 'verse': 按节列表展示

			// 从索引文件派生出的当前书卷信息
			currentBookInfo: null,

			// 状态管理
			isLoading: false,
			loadingError: null,

			// 字数统计与计划打卡
			chapterWordCount: 0,
			chapterRemainingWords: 0,
			isCurrentChapterFinished: false,
			fromPlan: false,
			todayTargetWords: 5000,
			todayFinishedWords: 0,

			// 滚动视口控制
			scrollTop: 0,
			oldScrollTop: 0,
			scrollAreaHeight: 600,

			// 25 分钟番茄钟
			timerSeconds: 1500, // 25 分钟 = 1500 秒
			timerRunning: false,
			timerInterval: null,
			showTimerCompleteModal: false,
			elapsedSecondsSinceLastSync: 0,
			lastPauseTimestamp: 0, // 手动暂停时间戳，用于惯性滚动防误唤醒冷却
			pauseScrollTop: 0,      // 暂停时的滚动位置，用于位移判定

			// 随心拖动 · 指尖助读线 (Finger Guide Line)
			guideLineVisible: uni.getStorageSync('bible_guide_line_visible') !== false, // 默认开启
			guideLineTop: uni.getStorageSync('bible_guide_line_top') || 280, // 默认距顶像素
			guideLineDragging: false,
			guideLineStartY: 0,
			guideLineStartTop: 0,
			guideLineMinTop: 120,
			guideLineMaxTop: 700,

			// 触摸滑动相关
			touchStartX: 0,
			touchStartY: 0,
			touchEndX: 0,
			touchEndY: 0,

			// 音频播放相关
			audioContext: null,
			isPlaying: false,

			// 状态栏与胶囊避让尺寸
			statusBarHeight: 0,
			navBarTop: 20,
			navBarHeight: 32,
			capsuleWidth: 95,

			// 工具栏显示控制
			showToolbar: true,
			toolbarTimer: null,

			// 搜索相关状态
			searchActive: false,
			searchKeyword: '',
			searchResults: [],
			currentSearchIndex: -1,
			targetVerseAnchor: '',
			currentMatchVerseNum: null,
		};
	},

	// 计算属性
	computed: {
		chapterTitle() {
			if (!this.currentBookInfo) return '';
			return `${this.currentBookInfo.fullName} 第 ${this.chapter} 章`;
		},

		currentBookFullName() {
			return this.currentBookInfo ? this.currentBookInfo.fullName : '';
		},

		formattedTime() {
			const m = Math.floor(this.timerSeconds / 60);
			const s = this.timerSeconds % 60;
			return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		}
	},

	onLoad(options) {
		this.isAudit = isAuditMode();
		this._lastOptions = options || {};

		// 精确获取系统信息与微信右上角原生胶囊的安全避让尺寸
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = (systemInfo.statusBarHeight || 0) * 2;
		let navTop = systemInfo.statusBarHeight || 20;
		let navH = 32;
		let capW = 95;

		// #ifdef MP-WEIXIN
		if (uni.getMenuButtonBoundingClientRect) {
			const menuButton = uni.getMenuButtonBoundingClientRect();
			if (menuButton && menuButton.top && menuButton.height) {
				navTop = menuButton.top;
				navH = menuButton.height;
				capW = (systemInfo.windowWidth - menuButton.left) + 8;
			}
		}
		// #endif

		this.navBarTop = navTop;
		this.navBarHeight = navH;
		this.capsuleWidth = capW;

		if (this.isAudit) {
			return;
		}
		
		this.bookId = (options && options.book) || 'genesis';
		this.chapter = parseInt(options && options.chapter) || 1;
		this.fromPlan = (options && (options.fromPlan === 'true' || options.fromPlan === true)) || false;
		if (!this.fromPlan) {
			const existingPlan = planManager.getPlanData();
			if (existingPlan && existingPlan.status && existingPlan.status !== 'PLANNING') {
				this.fromPlan = true;
			}
		}

		// 读取用户阅读排版偏好，默认极佳沉浸感的纸版模式
		this.readingMode = uni.getStorageSync('bible_reading_mode') || 'paper';

		// 检查是否有未完成的专注计时会话（换经卷/重新进入恢复）
		const savedSession = planManager.getFocusTimerSession();
		if (savedSession && savedSession.remainingSeconds > 0 && savedSession.remainingSeconds < 1500) {
			this.timerSeconds = savedSession.remainingSeconds;
			this.timerRunning = false;
			setTimeout(() => {
				const m = Math.floor(this.timerSeconds / 60);
				const s = this.timerSeconds % 60;
				const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
				uni.showToast({
					title: `已保持上次专注进度（剩余 ${formatted}），下滑屏幕继续计时`,
					icon: 'none',
					duration: 2500
				});
			}, 800);
		} else if ((options && options.autoTimer) || this.fromPlan) {
			if (options && options.autoTimer) {
				this.startFocusTimer();
			}
		}

		// 从导入的 bibleIndex 中查找当前书卷的信息
		this.currentBookInfo = bibleIndex.find(book => book.bookId === this.bookId);

		if (!this.currentBookInfo) {
			console.error(`无法在索引中找到 bookId: ${this.bookId}`);
			this.loadingError = '书卷信息加载失败';
			return;
		}

		// 加载章节内容
		this.loadChapter();

		// 检查是否从全书搜索页面穿透跳转进来
		if (options && options.targetVerse) {
			const tv = Number(options.targetVerse);
			setTimeout(() => {
				this.currentMatchVerseNum = tv;
				this.targetVerseAnchor = '';
				this.$nextTick(() => {
					this.targetVerseAnchor = 'v_' + tv;
				});
				if (options.keyword) {
					this.searchActive = true;
					this.searchKeyword = decodeURIComponent(options.keyword);
					this.computeSearchResults();
				}
			}, 600);
		}
	},

	onShow() {
		this.isAudit = isAuditMode();
		if (this.isAudit) return;

		// 校验是否有已保存的番茄钟会话（例如从后台恢复或重新切回）
		const savedSession = planManager.getFocusTimerSession();
		if (savedSession && savedSession.remainingSeconds > 0 && savedSession.remainingSeconds < 1500) {
			if (!this.timerRunning && this.timerSeconds === 1500) {
				this.timerSeconds = savedSession.remainingSeconds;
				const m = Math.floor(this.timerSeconds / 60);
				const s = this.timerSeconds % 60;
				const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
				uni.showToast({
					title: `已保持上次专注进度（剩余 ${formatted}），下滑屏幕继续计时`,
					icon: 'none',
					duration: 2500
				});
			}
		}

		// 若 onLoad 时处于审核态，切回正常态后需补初始化
		if (!this.currentBookInfo || this.verses.length === 0) {
			const options = this._lastOptions || {};
			this.bookId = options.book || this.bookId || 'genesis';
			this.chapter = parseInt(options.chapter) || this.chapter || 1;
			this.fromPlan = options.fromPlan === 'true' || options.fromPlan === true || this.fromPlan;
			if (!this.fromPlan) {
				const existingPlan = planManager.getPlanData();
				if (existingPlan && existingPlan.status && existingPlan.status !== 'PLANNING') {
					this.fromPlan = true;
				}
			}
			this.readingMode = uni.getStorageSync('bible_reading_mode') || this.readingMode || 'paper';
			this.currentBookInfo = bibleIndex.find(book => book.bookId === this.bookId);
			if (!this.currentBookInfo) {
				this.loadingError = '书卷信息加载失败';
				return;
			}
			if (!this.isLoading) {
				this.loadChapter();
			}
		} else {
			this.updatePlanProgress();
		}
	},

	onHide() {
		if (this.timerRunning) {
			this.pauseFocusTimer(true);
		} else if (this.timerSeconds < 1500 && this.timerSeconds > 0) {
			this.persistCurrentFocusProgress();
		}
	},

	mounted() {
		this.$nextTick(() => {
			const query = uni.createSelectorQuery().in(this);
			query.select('.reading-scroll-area').boundingClientRect(data => {
				if (data && data.height) {
					this.scrollAreaHeight = data.height;
				}
			}).exec();

			// 测量屏幕高度并确定指尖助读线安全滑动区间
			const sys = uni.getSystemInfoSync();
			const winH = sys.windowHeight || 800;
			this.guideLineMinTop = (this.navBarTop || 44) + (this.navBarHeight || 44) + 40;
			this.guideLineMaxTop = winH - 90;
			if (!uni.getStorageSync('bible_guide_line_top')) {
				this.guideLineTop = Math.round(this.guideLineMinTop + (this.guideLineMaxTop - this.guideLineMinTop) * 0.35);
			}
		});
	},

	// 微信小程序原生分享配置 (转发好友/群聊)
	onShareAppMessage(res) {
		const bookName = this.currentBookInfo ? this.currentBookInfo.fullName : '圣经';
		return {
			title: `和我一起读《${bookName}》第 ${this.chapter} 章 · 和合本`,
			path: `/pages/bible/reading?book=${this.bookId}&chapter=${this.chapter}`
		};
	},

	// 微信小程序原生分享配置 (朋友圈)
	onShareTimeline() {
		const bookName = this.currentBookInfo ? this.currentBookInfo.fullName : '圣经';
		return {
			title: `圣经 · 《${bookName}》第 ${this.chapter} 章 (和合本)`,
			query: `book=${this.bookId}&chapter=${this.chapter}`
		};
	},

	methods: {
		// 监听经文内容滚动
		handleScroll(e) {
			if (!e || !e.detail) return;
			const { scrollTop, scrollHeight } = e.detail;
			this.oldScrollTop = scrollTop;

			// 滚动时隐藏底部浮动工具栏
			if (this.showToolbar) {
				this.hideToolbar();
			}

			// 方案 A 增强：通过计划进入时，无论初次阅读还是暂停后，滚动屏幕均自动恢复专注计时
			if (this.fromPlan && !this.timerRunning && this.timerSeconds > 0) {
				const now = Date.now();
				// 防惯性误唤醒保护：距离手动暂停必须超过 800ms，且产生了新的滚动位移 (> 20px)
				const isCooledDown = !this.lastPauseTimestamp || (now - this.lastPauseTimestamp > 800);
				const hasMoved = Math.abs(scrollTop - (this.pauseScrollTop || 0)) > 20 || scrollTop > 30;

				if (isCooledDown && hasMoved) {
					const remaining = this.timerSeconds;
					this.startFocusTimer(true); // 静默启动底层计时器，由定制提示反馈
					const m = Math.floor(remaining / 60);
					const s = remaining % 60;
					const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
					uni.showToast({
						title: remaining === 1500 ? '⏱ 已开启 25 分钟专注计时' : `⏱ 已继续专注计时（剩余 ${formatted}）`,
						icon: 'none',
						duration: 2000
					});
				}
			}

			// 动态计算本章剩余字数（根据阅读滚动进度从总字数递减）
			if (!this.isCurrentChapterFinished && this.chapterWordCount > 0 && scrollHeight > 0) {
				const sysWindowHeight = (uni.getSystemInfoSync && uni.getSystemInfoSync().windowHeight) || 800;
				const viewHeight = this.scrollAreaHeight || (sysWindowHeight - (this.navBarTop + this.navBarHeight + 90));
				const maxScroll = Math.max(1, scrollHeight - viewHeight);
				
				// 判定接近文末（距底60px或滚过90%）：直接将本章剩余字数归零
				if (scrollTop >= maxScroll - 60 || (scrollTop / maxScroll) >= 0.90) {
					this.chapterRemainingWords = 0;
				} else {
					const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
					this.chapterRemainingWords = Math.max(0, Math.round(this.chapterWordCount * (1 - ratio)));
				}
			}
		},

		// 返回上一页
		goBack() {
			uni.navigateBack();
		},

		// 显示目录
		showCatalog() {
			uni.navigateBack();
		},

		// 统一的章节加载方法
		async loadChapter() {
			if (!this.currentBookInfo) return;

			// 每次新加载章节，重置自动触发锁与暂停位置、取消聚光灯锁定
			this.lastPauseTimestamp = 0;
			this.pauseScrollTop = 0;
			this.focusedVerseNum = null;

			// 停止当前播放的音频
			if (this.audioContext && this.isPlaying) {
				this.audioContext.stop();
				this.isPlaying = false;
			}

			this.isLoading = true;
			this.loadingError = null;

			const bookId = this.currentBookInfo.bookId;
			const volumeSN = this.currentBookInfo.sn;

			try {
				const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
				const openid = userInfo ? userInfo.openid : '';
				const dataUrl = `${BIBLE_ASSETS_BASE}/bible-data/volume-${volumeSN}-chapter-${this.chapter}.json${openid ? '?openid=' + openid : ''}`;
				console.log('Loading chapter from:', dataUrl);
				
				const data = await new Promise((resolve, reject) => {
					uni.request({
						url: dataUrl,
						method: 'GET',
						dataType: 'json',
						success: (res) => {
							if (res.statusCode === 200) {
								resolve(res.data);
							} else {
								reject(new Error(`HTTP ${res.statusCode}`));
							}
						},
						fail: reject
					});
				});

				if (!data || !Array.isArray(data)) {
					throw new Error(`Invalid chapter data: ${bookId} chapter ${this.chapter}`);
				}

				// data 就是 JSON 数组，解析小标题与经文
				this.verses = data.map((item, index) => {
					const verseNum = Number(item.verse) || (index + 1);
					const rawHeading = item.title || item.heading || item.section || '';
					const dictHeading = getSectionHeading(volumeSN, this.chapter, verseNum);
					return {
						id: index + 1,
						number: verseNum,
						text: item.text,
						heading: rawHeading || dictHeading || null
					};
				});

				// 生成微读圣经纸版排版结构数据
				this.formatPaperBlocks();

				// 精确统计本章中文字数（过滤掉符号，纯文本字数）
				this.chapterWordCount = this.verses.reduce((sum, v) => {
					const clean = (v.text || '').replace(/[^\u4e00-\u9fa50-9a-zA-Z]/g, '');
					return sum + clean.length;
				}, 0);

				// 检查本章是否已经在读经计划中打卡
				this.isCurrentChapterFinished = planManager.isChapterFinished(volumeSN, this.chapter);
				this.chapterRemainingWords = this.isCurrentChapterFinished ? 0 : this.chapterWordCount;
				this.updatePlanProgress();

				// 重置滚动位置到顶部并精准测量可滚动区域视口高度
				this.scrollTop = this.oldScrollTop;
				this.$nextTick(() => {
					this.scrollTop = 0;
					const query = uni.createSelectorQuery().in(this);
					query.select('.reading-scroll-area').boundingClientRect(data => {
						if (data && data.height) {
							this.scrollAreaHeight = data.height;
						}
					}).exec();

					// 跨章切换时如处于搜索状态，自动重新在该章执行搜索
					if (this.searchActive && this.searchKeyword) {
						this.computeSearchResults();
					}
				});

			} catch (error) {
				console.error(`加载章节数据失败: volume-${volumeSN}-chapter-${this.chapter}`, error);
				this.loadingError = '本章内容加载失败，请检查网络连接。';
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			} finally {
				this.isLoading = false;
			}
		},

		// 切换阅读排版模式：纸版 vs 按节
		setReadingMode(mode) {
			if (this.readingMode === mode) return;
			this.readingMode = mode;
			uni.setStorageSync('bible_reading_mode', mode);
			uni.showToast({
				title: mode === 'paper' ? '已切换至纸版显示' : '已切换至按节展示',
				icon: 'none'
			});
		},

		// 结构化解析章节经文为微读圣经纸版排版数据块
		formatPaperBlocks() {
			if (!this.verses || this.verses.length === 0) {
				this.paperBlocks = [];
				return;
			}

			const volumeSN = this.currentBookInfo ? this.currentBookInfo.sn : 1;
			const blocks = [];
			let currentBlock = null;

			this.verses.forEach((verse) => {
				const heading = verse.heading || getSectionHeading(volumeSN, this.chapter, verse.number);
				verse.heading = heading;
				const isPoetry = isPoetryVerse(volumeSN, this.chapter, verse.number);
				const tokens = parseProperNouns(verse.text);

				verse.tokens = tokens;

				const verseObj = {
					number: verse.number,
					isPoetry: isPoetry,
					tokens: tokens,
					text: verse.text,
					heading: heading
				};

				const shouldNewBlock = 
					!currentBlock || 
					heading !== null || 
					currentBlock.isPoetry !== isPoetry;

				if (shouldNewBlock) {
					currentBlock = {
						heading: heading,
						isPoetry: isPoetry,
						showDropCap: blocks.length === 0 && !isPoetry && verse.number === 1,
						verses: [verseObj]
					};
					blocks.push(currentBlock);
				} else {
					currentBlock.verses.push(verseObj);
				}
			});

			this.paperBlocks = blocks;
		},

		// 触摸事件处理
		handleTap() {
			this.toggleToolbar();
		},

		handleTouchStart(e) {
			this.touchStartX = e.touches[0].pageX;
			this.touchStartY = e.touches[0].pageY;
		},

		handleTouchEnd(e) {
			if (e.changedTouches && e.changedTouches.length > 0) {
				this.touchEndX = e.changedTouches[0].pageX;
				this.touchEndY = e.changedTouches[0].pageY;
			}
			
			const deltaX = this.touchEndX - this.touchStartX;
			const deltaY = this.touchEndY - this.touchStartY;
			
			const minSwipeDistance = 30;
			const isHorizontalSwipe = Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
			
			if (isHorizontalSwipe) {
				if (deltaX > 0) {
					this.goToPreviousChapter();
				} else {
					this.goToNextChapter();
				}
			}

			this.touchStartX = 0;
			this.touchStartY = 0;
			this.touchEndX = 0;
			this.touchEndY = 0;
		},

		// 上一章
		goToPreviousChapter() {
			if (!this.currentBookInfo) return;
			if (this.chapter > 1) {
				this.chapter--;
				this.loadChapter();
			} else {
				const currentSn = Number(this.currentBookInfo.sn);
				const prevBook = bibleIndex.find(b => b.sn === currentSn - 1);
				if (prevBook) {
					this.currentBookInfo = prevBook;
					this.bookId = prevBook.bookId;
					this.chapter = prevBook.chapters;
					this.loadChapter();
					uni.showToast({
						title: `已进入《${prevBook.fullName}》第 ${prevBook.chapters} 章`,
						icon: 'none',
						duration: 2000
					});
				} else {
					uni.showToast({ title: '已经是全书第一章了（创世记第1章）', icon: 'none' });
				}
			}
		},

		// 下一章
		goToNextChapter() {
			if (!this.currentBookInfo) return;
			const maxChapter = this.currentBookInfo.chapters;
			if (this.chapter < maxChapter) {
				this.chapter++;
				this.loadChapter();
			} else {
				const currentSn = Number(this.currentBookInfo.sn);
				const nextBook = bibleIndex.find(b => b.sn === currentSn + 1);
				if (nextBook) {
					this.currentBookInfo = nextBook;
					this.bookId = nextBook.bookId;
					this.chapter = 1;
					this.loadChapter();
					uni.showToast({
						title: `已进入《${nextBook.fullName}》第 1 章`,
						icon: 'none',
						duration: 2000
					});
				} else {
					uni.showToast({ title: '已经是全书最后一章了（启示录第22章）', icon: 'none' });
				}
			}
		},

		// 生成音频 URL
		getAudioUrl() {
			if (!this.currentBookInfo) return '';
			
			const baseUrl = `${BIBLE_ASSETS_BASE}/汉语和合本-磐石版`;
			const bookName = this.currentBookInfo.fullName;
			const fileName = `${bookName}第${this.chapter}章.mp3`;
			
			const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
			const openid = userInfo ? userInfo.openid : '';
			
			return `${baseUrl}/${bookName}/${fileName}${openid ? '?openid=' + openid : ''}`;
		},

		// 切换播放/暂停
		togglePlay() {
			if (this.isPlaying) {
				this.pauseAudio();
			} else {
				this.playAudio();
			}
		},

		// 播放音频
		playAudio() {
			if (!this.audioContext) {
				this.audioContext = uni.createInnerAudioContext();
				
				this.audioContext.onEnded(() => {
					this.isPlaying = false;
					console.log('音频播放完成');
				});
				
				this.audioContext.onError((err) => {
					console.error('音频播放错误:', err);
					this.isPlaying = false;
					uni.showToast({
						title: '播放失败',
						icon: 'none'
					});
				});
			}
			
			const audioUrl = this.getAudioUrl();
			console.log('播放音频:', audioUrl);
			
			this.audioContext.src = audioUrl;
			this.audioContext.play();
			this.isPlaying = true;
			
			uni.showToast({
				title: '开始播放',
				icon: 'none'
			});
		},

		// 暂停音频
		pauseAudio() {
			if (this.audioContext) {
				this.audioContext.pause();
				this.isPlaying = false;
				uni.showToast({
					title: '已暂停',
					icon: 'none'
				});
			}
		},

		// 切换工具栏显示
		toggleToolbar() {
			this.showToolbar = !this.showToolbar;
			if (this.showToolbar) {
				this.autoHideToolbar();
			}
		},

		// 隐藏工具栏
		hideToolbar() {
			this.showToolbar = false;
			if (this.toolbarTimer) {
				clearTimeout(this.toolbarTimer);
				this.toolbarTimer = null;
			}
		},

		// 自动隐藏工具栏（10秒后）
		autoHideToolbar() {
			if (this.toolbarTimer) {
				clearTimeout(this.toolbarTimer);
			}
			this.toolbarTimer = setTimeout(() => {
				this.showToolbar = false;
			}, 10000);
		},

		// 番茄钟控制
		toggleFocusTimer() {
			if (this.timerRunning) {
				this.pauseFocusTimer(false);
			} else {
				this.startFocusTimer();
			}
		},

		startFocusTimer(silent = false) {
			if (this.timerRunning) return;
			this.timerRunning = true;
			if (this.timerInterval) clearInterval(this.timerInterval);

			this.timerInterval = setInterval(() => {
				if (this.timerSeconds > 0) {
					this.timerSeconds--;
					this.elapsedSecondsSinceLastSync = (this.elapsedSecondsSinceLastSync || 0) + 1;
					// 每满 60 秒平滑同步到每日读经时长，保证即使中断也不丢失进度
					if (this.elapsedSecondsSinceLastSync >= 60) {
						planManager.accumulateFocusSeconds(60);
						this.elapsedSecondsSinceLastSync = 0;
						planManager.saveFocusTimerSession({
							remainingSeconds: this.timerSeconds,
							isRunning: false,
							lastActiveTime: Date.now()
						});
					}
				} else {
					this.onTimerFinish();
				}
			}, 1000);

			if (!silent) {
				uni.showToast({
					title: '25分钟专注开始',
					icon: 'none'
				});
			}
		},

		pauseFocusTimer(silent = false) {
			this.timerRunning = false;
			this.lastPauseTimestamp = Date.now();
			this.pauseScrollTop = this.oldScrollTop || 0;
			if (this.timerInterval) {
				clearInterval(this.timerInterval);
				this.timerInterval = null;
			}
			this.persistCurrentFocusProgress();
			if (!silent) {
				uni.showToast({
					title: '番茄钟已暂停',
					icon: 'none'
				});
			}
		},

		persistCurrentFocusProgress() {
			if (this.elapsedSecondsSinceLastSync > 0) {
				planManager.accumulateFocusSeconds(this.elapsedSecondsSinceLastSync);
				this.elapsedSecondsSinceLastSync = 0;
			}
			planManager.saveFocusTimerSession({
				remainingSeconds: this.timerSeconds,
				isRunning: false,
				lastActiveTime: Date.now()
			});
		},

		onTimerFinish() {
			this.pauseFocusTimer(true);
			planManager.clearFocusTimerSession();
			this.timerSeconds = 1500;
			planManager.recordFocusSession(25);

			uni.vibrateLong();
			this.showTimerCompleteModal = true;
		},

		closeTimerModal() {
			this.showTimerCompleteModal = false;
		},

		backToPlan() {
			this.showTimerCompleteModal = false;
			const pages = getCurrentPages();
			if (pages && pages.length > 1) {
				uni.navigateBack();
				return;
			}
			uni.redirectTo({
				url: '/pages/bible/plan'
			});
		},

		// 打卡本章刷新进度数据
		updatePlanProgress() {
			const plan = planManager.getPlanData();
			if (plan) {
				if (plan.status && plan.status !== 'PLANNING') {
					this.fromPlan = true;
				}
				this.todayTargetWords = plan.dailyTargetWords || 5000;
				this.todayFinishedWords = planManager.getTodayFinishedWords();
			}
		},

		toggleChapterCheck() {
			if (!this.currentBookInfo) return;
			const volumeSN = this.currentBookInfo.sn;

			if (!this.isCurrentChapterFinished) {
				planManager.markChapterFinished(volumeSN, this.chapter, this.chapterWordCount);
				this.isCurrentChapterFinished = true;
				this.chapterRemainingWords = 0;

				this.persistCurrentFocusProgress();

				try {
					const actDesc = `${this.currentBookFullName} 第 ${this.chapter} 章`;
					if (userTeamManager && typeof userTeamManager.addActivity === 'function') {
						userTeamManager.addActivity(actDesc, this.chapterWordCount);
					}
				} catch (teamErr) {
					console.error('[Checkin] 团队动态同步异常:', teamErr);
				}
				
				uni.showToast({ title: '已记录阅读进度 ✔', icon: 'success' });
			} else {
				planManager.unmarkChapterFinished(volumeSN, this.chapter, this.chapterWordCount);
				this.isCurrentChapterFinished = false;
				this.chapterRemainingWords = this.chapterWordCount;
				uni.showToast({ title: '已取消打卡', icon: 'none' });
			}
			
			this.updatePlanProgress();
			uni.$emit('planProgressUpdated');
		},

		// 复制本章全文
		copyFullChapter() {
			console.log('[copy] click fired, verses=', this.verses ? this.verses.length : 'none');
			if (!this.verses || this.verses.length === 0) {
				uni.showToast({ title: '本章暂无经文', icon: 'none' });
				return;
			}
			const bookName = this.currentBookFullName || '';
			const fullText = `《${bookName}》第 ${this.chapter} 章（和合本）\n\n` + 
				this.verses.map(v => `${v.number} ${v.text}`).join('\n');
			uni.setClipboardData({
				data: fullText,
				showToast: false,
				success: () => {
					uni.showToast({
						title: '本章全文已复制',
						icon: 'success'
					});
				},
				fail: (err) => {
					console.error('[copy] setClipboardData failed', err);
					uni.showToast({ title: '复制失败，请重试', icon: 'none' });
				}
			});
		},

		// 长按弹出整章/本节菜单
		showCopyActions() {
			console.log('[copy] longpress fired');
			if (!this.verses || this.verses.length === 0) {
				uni.showToast({ title: '本章暂无经文', icon: 'none' });
				return;
			}
			uni.showActionSheet({
				itemList: [
					`复制本章全文（共 ${this.verses.length} 节）`,
					'复制本节经文'
				],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.copyFullChapter();
					} else if (res.tapIndex === 1) {
						this.copyCurrentVerse();
					}
				},
				fail: () => {}
			});
		},

		// 复制当前阅读位置所在的一节
		copyCurrentVerse() {
			this.resolveCurrentVerseNum(num => {
				const verse = (this.verses || []).find(v => v.number === num);
				if (!verse || !verse.text) {
					uni.showToast({ title: '本节暂无经文', icon: 'none' });
					return;
				}
				const bookName = this.currentBookFullName || '';
				uni.setClipboardData({
					data: `${verse.text}\n（${bookName} ${this.chapter}:${verse.number} 和合本）`,
					showToast: false,
					success: () => {
						uni.showToast({ title: `已复制第 ${verse.number} 节`, icon: 'none' });
					},
					fail: () => {
						uni.showToast({ title: '复制失败，请重试', icon: 'none' });
					}
				});
			});
		},

		// 定位当前节
		resolveCurrentVerseNum(callback) {
			if (!this.verses || this.verses.length === 0) {
				callback(null);
				return;
			}
			const query = uni.createSelectorQuery().in(this);
			query.select('.reading-scroll-area').boundingClientRect(area => {
				query.selectAll('.verse-selectable').boundingClientRect(rects => {
					const list = (rects || []).filter(r => r && typeof r.top === 'number');
					if (list.length === 0) {
						callback(null);
						return;
					}
					const lineTop = (area && typeof area.top === 'number' ? area.top : 0) + 60;
					let index = list.length - 1;
					for (let i = 0; i < list.length; i++) {
						if (list[i].bottom > lineTop) {
							index = i;
							break;
						}
					}
					const safeIndex = Math.min(index, this.verses.length - 1);
					callback(this.verses[safeIndex].number);
				});
			}).exec();
		},

		// 点击底部工具栏【搜索】
		toggleSearch() {
			uni.navigateTo({
				url: '/pages/bible/search'
			});
		},

		// 搜索输入变化
		onSearchInput(e) {
			this.searchKeyword = (e && e.detail && e.detail.value) || '';
			this.computeSearchResults();
		},

		// 清空当前搜索
		clearSearch() {
			this.searchKeyword = '';
			this.searchResults = [];
			this.currentSearchIndex = -1;
			this.currentMatchVerseNum = null;
			this.targetVerseAnchor = '';
		},

		// 关闭搜索
		closeSearch() {
			this.searchActive = false;
			this.clearSearch();
		},

		// 计算搜索匹配项
		computeSearchResults() {
			const kw = (this.searchKeyword || '').trim().toLowerCase();
			if (!kw) {
				this.searchResults = [];
				this.currentSearchIndex = -1;
				this.currentMatchVerseNum = null;
				this.targetVerseAnchor = '';
				return;
			}
			const results = [];
			this.verses.forEach((v, idx) => {
				if (v.text && v.text.toLowerCase().includes(kw)) {
					results.push({
						verseNumber: v.number,
						text: v.text,
						index: idx
					});
				}
			});
			this.searchResults = results;
			if (results.length > 0) {
				this.currentSearchIndex = 0;
				this.jumpToSearchResult(0);
			} else {
				this.currentSearchIndex = -1;
				this.currentMatchVerseNum = null;
			}
		},

		// 跳转到上一处匹配
		goToPrevMatch() {
			if (this.searchResults.length === 0) return;
			if (this.currentSearchIndex > 0) {
				this.currentSearchIndex--;
			} else {
				this.currentSearchIndex = this.searchResults.length - 1;
			}
			this.jumpToSearchResult(this.currentSearchIndex);
		},

		// 跳转到下一处匹配
		goToNextMatch() {
			if (this.searchResults.length === 0) return;
			if (this.currentSearchIndex < this.searchResults.length - 1) {
				this.currentSearchIndex++;
			} else {
				this.currentSearchIndex = 0;
			}
			this.jumpToSearchResult(this.currentSearchIndex);
		},

		// 定位到指定匹配项并平滑滚动
		jumpToSearchResult(index) {
			const target = this.searchResults[index];
			if (!target) return;
			this.currentMatchVerseNum = target.verseNumber;
			this.targetVerseAnchor = '';
			this.$nextTick(() => {
				this.targetVerseAnchor = 'v_' + target.verseNumber;
			});
		},

		// 文本高亮切分辅助函数
		getHighlightedParts(text) {
			const kw = (this.searchKeyword || '').trim();
			if (!kw || !text) return [{ text, highlight: false }];
			const parts = [];
			const lowerText = text.toLowerCase();
			const lowerKw = kw.toLowerCase();
			let start = 0;
			let pos = lowerText.indexOf(lowerKw, start);
			while (pos !== -1) {
				if (pos > start) {
					parts.push({ text: text.substring(start, pos), highlight: false });
				}
				parts.push({ text: text.substring(pos, pos + kw.length), highlight: true });
				start = pos + kw.length;
				pos = lowerText.indexOf(lowerKw, start);
			}
			if (start < text.length) {
				parts.push({ text: text.substring(start), highlight: false });
			}
			return parts;
		},

		// ================= 随心拖动 · 指尖助读线 =================
		onGuideTouchStart(e) {
			if (!e || !e.touches || !e.touches[0]) return;
			this.guideLineDragging = true;
			this.guideLineStartY = e.touches[0].clientY;
			this.guideLineStartTop = this.guideLineTop;
		},

		onGuideTouchMove(e) {
			if (!this.guideLineDragging || !e || !e.touches || !e.touches[0]) return;
			const currentY = e.touches[0].clientY;
			const deltaY = currentY - this.guideLineStartY;
			let targetTop = this.guideLineStartTop + deltaY;
			if (targetTop < this.guideLineMinTop) {
				targetTop = this.guideLineMinTop;
			} else if (targetTop > this.guideLineMaxTop) {
				targetTop = this.guideLineMaxTop;
			}
			this.guideLineTop = targetTop;
		},

		onGuideTouchEnd() {
			this.guideLineDragging = false;
			uni.setStorageSync('bible_guide_line_top', this.guideLineTop);
		},

		toggleGuideLine() {
			this.guideLineVisible = !this.guideLineVisible;
			uni.setStorageSync('bible_guide_line_visible', this.guideLineVisible);
			uni.showToast({
				title: this.guideLineVisible ? '👉 指尖助读线已显示' : '助读线已收起',
				icon: 'none',
				duration: 1500
			});
		}
	},

	// 页面卸载时销毁音频和计时器
	onUnload() {
		if (this.audioContext) {
			this.audioContext.stop();
			this.audioContext.destroy();
		}
		if (this.timerRunning) {
			this.pauseFocusTimer(true);
		} else if (this.timerSeconds < 1500 && this.timerSeconds > 0) {
			this.persistCurrentFocusProgress();
		}
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}
};
