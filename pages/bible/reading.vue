<template>
	<view class="reading-container">
		<!-- 模式一：审核伪装模式【风物随笔 · 慢生活阅读】 -->
		<view v-if="isAudit" class="audit-article-view">
			<view class="nav-bar" :style="{ paddingTop: navBarTop + 'px', height: (navBarTop + navBarHeight + 8) + 'px', paddingRight: capsuleWidth + 'px' }">
				<view class="nav-left" @click="goBack">
					<view class="back-arrow-icon"></view>
					<text class="back-text">返回</text>
				</view>
				<view class="nav-center">
					<text class="nav-title">风物美文</text>
					<text class="nav-subtitle">自然心境 · 随笔</text>
				</view>
				<view class="nav-right-safe"></view>
			</view>

			<scroll-view scroll-y class="audit-article-scroll">
				<image class="article-banner-img" src="/static/scenery/suzhou.jpg" mode="aspectFill"></image>
				<view class="article-body-card">
					<text class="article-h1">江南水乡与慢生活闲居漫记</text>
					<view class="article-meta-row">
						<text class="article-author">城市漫游志</text>
						<text class="article-time">阅读约需 3 分钟</text>
					</view>
					<view class="article-content-text">
						<text class="p-text">流水如诗，山青如墨。行至水穷处，坐看云起时。江南的水，带着特有的温润，静静穿过青石板街与旧瓦屋檐。</text>
						<text class="p-text">在快节奏的都市喧嚣中，留出二十分钟的静谧时光，听窗外细雨微风，感受自然节律的舒缓从容。不疾不徐，步调匀称，便是最好的生活状态。</text>
						<text class="p-text">万物有其时令，春生夏长，秋收冬藏。愿你在此刻卸下焦虑，伴着轻柔的水声与微风，找回内心的辽阔与安宁。</text>
					</view>
					<button class="return-home-btn" @click="goBack">返回城市漫游首页</button>
				</view>
			</scroll-view>
		</view>

		<!-- 模式二：正式开放模式【圣经沉浸式阅读器】 -->
		<view v-else class="real-reading-view">
			<!-- 悬浮固定头部区域 -->
			<view class="sticky-header">
				<!-- 顶部导航栏 (精准避让微信右上角原生胶囊) -->
				<view class="nav-bar" :style="{ paddingTop: navBarTop + 'px', height: (navBarTop + navBarHeight + 8) + 'px', paddingRight: capsuleWidth + 'px' }">
					<view class="nav-left" @click="goBack">
						<view class="back-arrow-icon"></view>
						<text class="nav-book-name">{{ currentBookFullName }}</text>
						<text class="nav-chap-num">{{ chapter }}</text>
					</view>

					<view class="nav-right-safe">
						<text class="version-label">和合本</text>
					</view>
				</view>

			<!-- 章节辅助控制栏 (微读切换胶囊 + 番茄钟 + 打卡) -->
			<view class="chapter-sub-bar" v-if="verses.length > 0">
				<!-- 左侧：排版切换胶囊 (纸版 vs 分节) -->
				<view class="mode-switch-capsule">
					<view 
						class="mode-switch-item" 
						:class="{ 'is-active': readingMode === 'paper' }"
						@click.stop="setReadingMode('paper')">
						<text class="mode-switch-text">纸版</text>
					</view>
					<view 
						class="mode-switch-item" 
						:class="{ 'is-active': readingMode === 'verse' }"
						@click.stop="setReadingMode('verse')">
						<text class="mode-switch-text">分节</text>
					</view>
				</view>

				<!-- 中间：专注番茄钟 (仅计划模式显示) -->
				<view class="sub-center-group">
					<view v-if="fromPlan" class="timer-pill" :class="{ 'timer-pill-active': timerRunning }" @click.stop="toggleFocusTimer">
						<text class="timer-icon">⏱</text>
						<text class="timer-time">{{ formattedTime }}</text>
					</view>
				</view>

				<!-- 右侧：打卡按钮 (仅计划模式显示) -->
				<view v-if="fromPlan" class="chapter-check-btn" :class="{ 'is-checked': isCurrentChapterFinished }" @click="toggleChapterCheck">
					<text class="check-btn-text">{{ isCurrentChapterFinished ? '已打卡 ✔' : '完成打卡' }}</text>
				</view>
				
				<!-- 右侧：非计划模式下的占位符，保持布局居中对称 -->
				<view v-else style="width: 140rpx;"></view>
			</view>

			<!-- 计划模式专属：实时读经进度数据栏 (本章总字数、本章剩余、今日剩余、今日目标) -->
			<view class="plan-progress-bar" v-if="fromPlan && verses.length > 0">
				<view class="progress-item">
					<text class="progress-label">本章总计</text>
					<text class="progress-value">{{ chapterWordCount }}<text class="progress-unit">字</text></text>
				</view>
				<view class="progress-item">
					<text class="progress-label">本章剩余</text>
					<text class="progress-value highlight">{{ isCurrentChapterFinished ? 0 : chapterRemainingWords }}<text class="progress-unit">字</text></text>
				</view>
				<view class="progress-item">
					<text class="progress-label">今日剩余</text>
					<text class="progress-value highlight-today">{{ Math.max(0, todayTargetWords - todayFinishedWords) }}<text class="progress-unit">字</text></text>
				</view>
				<view class="progress-item">
					<text class="progress-label">今日目标</text>
					<text class="progress-value">{{ todayTargetWords }}<text class="progress-unit">字</text></text>
				</view>
			</view>
			
			<!-- 非计划模式专属：简单字数提示 -->
			<view class="casual-progress-bar" v-else-if="!fromPlan && verses.length > 0">
				<text class="casual-words">本章约 {{ chapterWordCount }} 字 · 剩余约 {{ isCurrentChapterFinished ? 0 : chapterRemainingWords }} 字</text>
			</view>

			<!-- 章节内关键词搜索浮动栏 -->
			<view v-if="searchActive" class="search-floating-bar">
				<view class="search-input-wrap">
					<text class="search-icon">🔍</text>
					<input 
						class="search-input" 
						type="text" 
						v-model="searchKeyword" 
						placeholder="搜索本章关键词..." 
						confirm-type="search"
						@input="onSearchInput"
						@confirm="goToNextMatch"
					/>
					<text v-if="searchKeyword" class="search-clear-btn" @click.stop="clearSearch">✕</text>
				</view>
				<view class="search-actions">
					<text class="search-counter">{{ searchResults.length > 0 ? (currentSearchIndex + 1) + '/' + searchResults.length : (searchKeyword ? '0 处' : '') }}</text>
					<button class="search-nav-btn" :disabled="searchResults.length <= 1" @click.stop="goToPrevMatch">‹</button>
					<button class="search-nav-btn" :disabled="searchResults.length <= 1" @click.stop="goToNextMatch">›</button>
					<text class="search-close-text" @click.stop="closeSearch">完成</text>
				</view>
			</view>
		</view>

		<!-- 加载中提示 -->
		<view v-if="isLoading" class="feedback-container">
			<text class="feedback-text">加载中...</text>
		</view>

		<!-- 加载失败提示 -->
		<view v-else-if="loadingError" class="feedback-container">
			<text class="feedback-text">{{ loadingError }}</text>
		</view>

		<!-- 经文内容主体：独立滚动区域 (仅在此区域内部滚动，顶部完全静止不动) -->
		<scroll-view 
			v-else 
			scroll-y 
			class="reading-scroll-area"
			:scroll-top="scrollTop"
			:scroll-into-view="targetVerseAnchor"
			scroll-with-animation
			@scroll="handleScroll">
			
			<view class="bible-content"
				@click="handleTap"
				@touchstart="handleTouchStart"
				@touchend="handleTouchEnd"
				@touchcancel="handleTouchEnd">

				<!-- 模式一：微读圣经纸版连续排版视图 -->
				<view v-if="readingMode === 'paper'" class="paper-reading-area">
					<view v-for="(block, bIdx) in paperBlocks" :key="bIdx" class="paper-block">
						<!-- 段落小标题 -->
						<view v-if="block.heading" class="paper-section-title">
							<text class="section-title-text">{{ block.heading }}</text>
						</view>

						<!-- 诗歌体缩进段落 -->
						<view v-if="block.isPoetry" class="paper-poetry-box">
							<view 
								v-for="verse in block.verses" 
								:key="verse.number" 
								:id="'v_' + verse.number" 
								class="poetry-line"
								:class="{ 'verse-active-matched': currentMatchVerseNum === verse.number }"
								@longpress="copyVerse(verse)">
								<text class="poetry-verse-num">{{ verse.number }}</text>
								<view class="poetry-text-content">
									<block v-for="(tok, tIdx) in verse.tokens" :key="tIdx">
										<template v-if="searchActive && searchKeyword">
											<text 
												v-for="(part, pIdx) in getHighlightedParts(tok.text)" 
												:key="pIdx" 
												:class="{ 
													'proper-noun': tok.isNoun,
													'search-highlight': part.highlight,
													'search-active-target': part.highlight && currentMatchVerseNum === verse.number
												}">{{ part.text }}</text>
										</template>
										<text v-else :class="{ 'proper-noun': tok.isNoun }">{{ tok.text }}</text>
									</block>
								</view>
							</view>
						</view>

						<!-- 正常散文段落 (流式折行 + Drop Cap 大章号) -->
						<view v-else class="paper-prose-paragraph">
							<!-- 大章号 Drop Cap (首字下沉排版) -->
							<view v-if="block.showDropCap" class="drop-cap-wrap">
								<text class="drop-cap-num">{{ chapter }}</text>
							</view>

							<!-- 流式经文行内排版与嵌入式上标小节号 -->
							<block v-for="verse in block.verses" :key="verse.number">
								<text :id="'v_' + verse.number" class="verse-anchor"></text>
								<text v-if="verse.number > 1" class="sup-verse-num" :class="{ 'sup-active-matched': currentMatchVerseNum === verse.number }">{{ verse.number }}</text>
								<block v-for="(tok, tIdx) in verse.tokens" :key="tIdx">
									<template v-if="searchActive && searchKeyword">
										<text 
											v-for="(part, pIdx) in getHighlightedParts(tok.text)" 
											:key="pIdx" 
											:class="{ 
												'proper-noun': tok.isNoun,
												'search-highlight': part.highlight,
												'search-active-target': part.highlight && currentMatchVerseNum === verse.number
											}"
											class="flow-text-span"
											@longpress="copyVerse(verse)">{{ part.text }}</text>
									</template>
									<text 
										v-else
										:class="{ 'proper-noun': tok.isNoun }" 
										class="flow-text-span"
										@longpress="copyVerse(verse)">{{ tok.text }}</text>
								</block>
							</block>
						</view>
					</view>
				</view>

				<!-- 模式二：按节展示视图 (整齐逐节排版) -->
				<view v-else class="verse-reading-area">
					<view 
						v-for="verse in verses" 
						:key="verse.id" 
						:id="'v_' + verse.number" 
						class="verse-wrapper"
						:class="{ 'verse-active-matched': currentMatchVerseNum === verse.number }"
						@longpress="copyVerse(verse)">
						<!-- 分节模式段落小标题 -->
						<view v-if="verse.heading" class="paper-section-title verse-mode-title">
							<text class="section-title-text">{{ verse.heading }}</text>
						</view>
						<view class="verse-container">
							<text class="verse-number">{{ verse.number }}</text>
							<view class="verse-text-flow">
								<block v-for="(tok, tIdx) in (verse.tokens || [])" :key="tIdx">
									<template v-if="searchActive && searchKeyword">
										<text 
											v-for="(part, pIdx) in getHighlightedParts(tok.text)" 
											:key="pIdx" 
											:class="{ 
												'proper-noun': tok.isNoun,
												'search-highlight': part.highlight,
												'search-active-target': part.highlight && currentMatchVerseNum === verse.number
											}">{{ part.text }}</text>
									</template>
									<text v-else :class="{ 'proper-noun': tok.isNoun }">{{ tok.text }}</text>
								</block>
							</view>
						</view>
					</view>
				</view>

				<!-- 经文末尾读完打卡卡片 -->
				<view class="reading-finish-section" v-if="verses.length > 0">
					<button class="finish-chapter-btn" :class="{ 'btn-is-checked': isCurrentChapterFinished }" @click="toggleChapterCheck">
						{{ isCurrentChapterFinished ? '本章已打卡 ✔' : '✓ 读完打卡本章 (+约 ' + chapterWordCount + ' 字)' }}
					</button>

					<!-- 便捷翻页导航按钮组（支持跨卷切换） -->
					<view class="chapter-nav-row">
						<button class="nav-page-btn prev-btn" @click.stop="goToPreviousChapter">
							<text class="nav-arrow">‹</text> 上一章
						</button>
						<button class="nav-page-btn next-btn" @click.stop="goToNextChapter">
							下一章 <text class="nav-arrow">›</text>
						</button>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 25 分钟专注达成弹窗 -->
		<view v-if="showTimerCompleteModal" class="timer-modal-mask" @click="closeTimerModal">
			<view class="timer-modal-body" @click.stop>
				<text class="timer-modal-icon">🎉</text>
				<text class="timer-modal-title">25 分钟专注达成！</text>
				<text class="timer-modal-desc">您已完成一个专注番茄钟，今日专注与字数总账已同步累计。</text>
				<view class="timer-modal-actions">
					<button class="modal-act-btn outline" @click="backToPlan">查看计划</button>
					<button class="modal-act-btn primary" @click="closeTimerModal">继续阅读</button>
				</view>
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="bottom-toolbar" :class="{ 'toolbar-hidden': !showToolbar }">
			<view class="toolbar-item" @click.stop="togglePlay">
				<text class="toolbar-icon">{{ isPlaying ? '❚❚' : '▷' }}</text>
				<text class="toolbar-text">{{ isPlaying ? '暂停' : '播放' }}</text>
			</view>
			<view class="toolbar-item" :class="{ 'is-active-btn': searchActive }" @click.stop="toggleSearch">
				<text class="toolbar-icon">🔍</text>
				<text class="toolbar-text">搜索</text>
			</view>
			<view class="toolbar-item" @click.stop="showCopyOptions">
				<text class="toolbar-icon">📋</text>
				<text class="toolbar-text">复制</text>
			</view>
			<button class="toolbar-item toolbar-share-btn" open-type="share">
				<text class="toolbar-icon">📤</text>
				<text class="toolbar-text">分享</text>
			</button>
		</view>
		</view>
	</view>
</template>

<script>
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

			// 新增：从索引文件派生出的当前书卷信息
			currentBookInfo: null,

			// 新增：用于改善用户体验的状态
			isLoading: false,
			loadingError: null, // null 表示没有错误

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
		}
	},

	// 新增：计算属性，用于动态生成标题
	computed: {
		chapterTitle() {
			if (!this.currentBookInfo) return '';
			// 例如: "创世记 第 1 章"
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
			// 审核伪装模式：直接展示风物美文，绝对不发起任何经文网络请求！
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
					title: `已保持上次专注进度（剩余 ${formatted}），点击可继续计时`,
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
					title: `已保持上次专注进度（剩余 ${formatted}），点击可继续计时`,
					icon: 'none',
					duration: 2500
				});
			}
		}

		// 若 onLoad 时处于审核态（未初始化书卷/未拉取章节），切回正常态后需补初始化，否则白屏无字
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

		// **重构核心：统一的章节加载方法**
		async loadChapter() {
			if (!this.currentBookInfo) return;

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

				// 生成微读圣经纸版排版结构数据 (小标题、Drop Cap、上标小节号、专名线、诗歌体)
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

				// 同时挂载到 verse 本身，按节展示视图亦可享受专名下划线
				verse.tokens = tokens;

				const verseObj = {
					number: verse.number,
					isPoetry: isPoetry,
					tokens: tokens,
					text: verse.text,
					heading: heading
				};

				// 判断是否需要开启新的段落块：
				// 1. 首个块
				// 2. 遇到小标题
				// 3. 诗歌体与非诗歌体切换
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

		// 触摸事件处理 - 优化版
		handleTap() {
			this.toggleToolbar();
		},

		handleTouchStart(e) {
			this.touchStartX = e.touches[0].pageX;
			this.touchStartY = e.touches[0].pageY;
		},



		handleTouchEnd(e) {
			// 使用 changedTouches 获取最终位置（更准确）
			if (e.changedTouches && e.changedTouches.length > 0) {
				this.touchEndX = e.changedTouches[0].pageX;
				this.touchEndY = e.changedTouches[0].pageY;
			}
			
			const deltaX = this.touchEndX - this.touchStartX;
			const deltaY = this.touchEndY - this.touchStartY;
			
			// 降低阈值，提高灵敏度（从 50 降到 30）
			const minSwipeDistance = 30;
			
			// 确保是水平滑动（水平距离 > 垂直距离的 1.5 倍）
			const isHorizontalSwipe = Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
			
			if (isHorizontalSwipe) {
				// 向右滑动 = 上一章
				if (deltaX > 0) {
					this.goToPreviousChapter();
				} 
				// 向左滑动 = 下一章
				else {
					this.goToNextChapter();
				}
			}

			// 重置触摸坐标
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
				// 当前经卷已是第 1 章，尝试跨卷进入上一经卷最后一章
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
			// 从 currentBookInfo 中获取最大章节数
			const maxChapter = this.currentBookInfo.chapters;
			if (this.chapter < maxChapter) {
				this.chapter++;
				this.loadChapter();
			} else {
				// 当前经卷已是最后一章，尝试跨卷进入下一经卷第 1 章
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
			const bookName = this.currentBookInfo.fullName; // 例如：创世记
			const fileName = `${bookName}第${this.chapter}章.mp3`;
			
			const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
			const openid = userInfo ? userInfo.openid : '';
			
			// 构建完整 URL：baseUrl/书卷名/文件名
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
			// 如果还没有创建音频上下文，创建一个
			if (!this.audioContext) {
				this.audioContext = uni.createInnerAudioContext();
				
				// 监听播放结束
				this.audioContext.onEnded(() => {
					this.isPlaying = false;
					console.log('音频播放完成');
				});
				
				// 监听播放错误
				this.audioContext.onError((err) => {
					console.error('音频播放错误:', err);
					this.isPlaying = false;
					uni.showToast({
						title: '播放失败',
						icon: 'none'
					});
				});
			}
			
			// 设置音频源
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
			
			// 如果显示工具栏，10秒后自动隐藏
			if (this.showToolbar) {
				this.autoHideToolbar();
			}
		},

		// 隐藏工具栏
		hideToolbar() {
			this.showToolbar = false;
			// 清除自动隐藏定时器
			if (this.toolbarTimer) {
				clearTimeout(this.toolbarTimer);
				this.toolbarTimer = null;
			}
		},

		// 自动隐藏工具栏（10秒后）
		autoHideToolbar() {
			// 清除之前的定时器
			if (this.toolbarTimer) {
				clearTimeout(this.toolbarTimer);
			}
			
			// 设置新的定时器
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

		startFocusTimer() {
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

			uni.showToast({
				title: '25分钟专注开始',
				icon: 'none'
			});
		},

		pauseFocusTimer(silent = false) {
			this.timerRunning = false;
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
			this.timerSeconds = 1500; // 重置为 25 分钟
			// 记录 25 分钟专注
			planManager.recordFocusSession(25);

			// 震动提示
			uni.vibrateLong();
			this.showTimerCompleteModal = true;
		},

		closeTimerModal() {
			this.showTimerCompleteModal = false;
		},

		backToPlan() {
			this.showTimerCompleteModal = false;
			uni.navigateTo({
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

				// 读完打卡立即累计本次专注时段
				this.persistCurrentFocusProgress();

				// 同步给所在团队动态流并异步落库云端 MySQL（加异常隔离，绝不影响本地核心字数统计）
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
			
			// 立即重新计算并刷新进度数据，向全局广播
			this.updatePlanProgress();
			uni.$emit('planProgressUpdated');
		},

		// ================= 复制相关功能 =================
		// 长按单节经文复制
		copyVerse(verse) {
			if (!verse) return;
			const bookName = this.currentBookFullName || '';
			const copyText = `${verse.text}\n（${bookName} ${this.chapter}:${verse.number} 和合本）`;
			try {
				uni.vibrateShort();
			} catch (e) {}
			uni.setClipboardData({
				data: copyText,
				success: () => {
					uni.showToast({
						title: `已复制第 ${verse.number} 节`,
						icon: 'success'
					});
				}
			});
		},

		// 底部工具栏复制选项弹窗
		showCopyOptions() {
			if (!this.verses || this.verses.length === 0) return;
			const bookName = this.currentBookFullName || '';
			uni.showActionSheet({
				itemList: [
					`复制本章全文（共 ${this.verses.length} 节）`,
					`复制本章前 5 节`
				],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.copyFullChapter();
					} else if (res.tapIndex === 1) {
						this.copyFirstFiveVerses();
					}
				}
			});
		},

		// 复制本章全文
		copyFullChapter() {
			if (!this.verses || this.verses.length === 0) return;
			const bookName = this.currentBookFullName || '';
			const fullText = `《${bookName}》第 ${this.chapter} 章（和合本）\n\n` + 
				this.verses.map(v => `${v.number} ${v.text}`).join('\n');
			uni.setClipboardData({
				data: fullText,
				success: () => {
					uni.showToast({
						title: '本章全文已复制',
						icon: 'success'
					});
				}
			});
		},

		// 复制前 5 节经文
		copyFirstFiveVerses() {
			if (!this.verses || this.verses.length === 0) return;
			const bookName = this.currentBookFullName || '';
			const targetVerses = this.verses.slice(0, 5);
			const text = `《${bookName}》第 ${this.chapter} 章 1-5 节（和合本）\n\n` + 
				targetVerses.map(v => `${v.number} ${v.text}`).join('\n');
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({
						title: '前 5 节已复制',
						icon: 'success'
					});
				}
			});
		},

		// ================= 搜索与定位相关功能 =================
		// 切换搜索浮层
		toggleSearch() {
			this.searchActive = !this.searchActive;
			if (!this.searchActive) {
				this.clearSearch();
			}
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
}
</script>

<style scoped>
.reading-container {
	height: 100vh;
	background: #f2f6f9; /* 微读圣经经典清透纸张底色 */
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.sticky-header {
	flex-shrink: 0;
	background: #f2f6f9;
	z-index: 100;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 正式阅读模式外层：必须是纵向 flex 容器，否则内部 scroll-view 的 flex:1 失效 */
.real-reading-view {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
}

.reading-scroll-area {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
}


/* 顶部导航栏 (微读圣经样式，高度与位置严格与微信胶囊水平居中并避让) */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-left: 28rpx;
	background: #f2f6f9;
	border-bottom: 1rpx solid #e5edf2;
	box-sizing: border-box;
}

.nav-left {
	display: flex;
	align-items: center;
}

.back-arrow-icon {
	width: 18rpx;
	height: 18rpx;
	border-left: 4rpx solid #66757f;
	border-bottom: 4rpx solid #66757f;
	transform: rotate(45deg);
	display: inline-block;
	margin-right: 14rpx;
	box-sizing: border-box;
}

.nav-book-name {
	font-size: 34rpx;
	color: #d96363; /* 珊瑚红书卷名 */
	font-weight: 600;
}

.nav-chap-num {
	font-size: 32rpx;
	color: #e57373;
	margin-left: 12rpx;
	font-weight: 500;
}

.nav-right-safe {
	display: flex;
	align-items: center;
	padding-right: 12rpx;
}

.version-label {
	font-size: 26rpx;
	color: #d96363;
	font-weight: 500;
}

/* 章节辅助控制栏 (微读切换胶囊 + 番茄钟 + 打卡，严格居中对齐) */
.chapter-sub-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14rpx 28rpx;
	background: #f2f6f9;
	border-bottom: 1rpx solid #e5edf2;
	gap: 16rpx;
}

.plan-progress-bar {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 10rpx 16rpx;
	background: #fbf8f2;
	border-bottom: 1rpx solid #e7ded0;
}

.progress-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.progress-label {
	font-size: 20rpx;
	color: #92847a;
	margin-bottom: 2rpx;
}

.progress-value {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
}

.progress-unit {
	font-size: 20rpx;
	font-weight: normal;
	color: #92847a;
	margin-left: 2rpx;
}

.progress-value.highlight {
	color: #c58b43;
}

.progress-value.highlight-today {
	color: #2e7d32;
}

.casual-progress-bar {
	padding: 10rpx 28rpx;
	background: #fbf8f2;
	border-bottom: 1rpx solid #e7ded0;
	text-align: center;
}

.casual-words {
	font-size: 22rpx;
	color: #92847a;
}

/* 排版切换胶囊 (纸版 vs 分节) */
.mode-switch-capsule {
	display: inline-flex;
	align-items: center;
	background: #e2ebf2;
	border-radius: 36rpx;
	padding: 4rpx;
	flex-shrink: 0;
	height: 56rpx;
	box-sizing: border-box;
}

.mode-switch-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 48rpx;
	padding: 0 22rpx;
	border-radius: 24rpx;
	transition: all 0.2s ease;
	box-sizing: border-box;
}

.mode-switch-item.is-active {
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.mode-switch-text {
	font-size: 24rpx;
	color: #667885;
	font-weight: 500;
	line-height: 1;
	display: inline-block;
}

.mode-switch-item.is-active .mode-switch-text {
	color: #1a2228;
	font-weight: bold;
}

.sub-center-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex: 1;
	justify-content: center;
}

/* 番茄钟药丸 */
.timer-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 52rpx;
	padding: 0 18rpx;
	background: #fbf5eb;
	border: 1rpx solid #eddcc5;
	border-radius: 26rpx;
	box-sizing: border-box;
}

.timer-pill-active {
	background: #fff0db;
	border-color: #ffd8a8;
}

.timer-icon {
	font-size: 24rpx;
	margin-right: 6rpx;
	line-height: 1;
}

.timer-time {
	font-size: 24rpx;
	font-weight: bold;
	color: #b3732d;
	font-family: monospace;
	line-height: 1;
}

/* 字数标签 */
.chapter-words-tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 52rpx;
	padding: 0 14rpx;
	font-size: 22rpx;
	color: #8c7b6f;
	background: #ece5d8;
	border-radius: 12rpx;
	line-height: 1;
	white-space: nowrap;
	box-sizing: border-box;
}

/* 完成打卡按钮 */
.chapter-check-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 54rpx;
	padding: 0 24rpx;
	background: #c58b43;
	border-radius: 27rpx;
	flex-shrink: 0;
	box-sizing: border-box;
}

.chapter-check-btn.is-checked {
	background: #e6fcf5;
	border: 1rpx solid #b2f2bb;
}

.check-btn-text {
	font-size: 24rpx;
	color: #ffffff;
	font-weight: bold;
	line-height: 1;
	display: inline-block;
	white-space: nowrap;
}

.chapter-check-btn.is-checked .check-btn-text {
	color: #2b8a3e;
}

/* 经文内容主体 */
.bible-content {
	padding: 24rpx 36rpx;
	padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
	background: #f2f6f9;
}

/* ==================== 1. 微读圣经纸版排版系统 ==================== */
.paper-reading-area {
	padding-top: 10rpx;
}

.paper-block {
	margin-bottom: 24rpx;
}

/* 段落小标题 (微读加粗小标题) */
.paper-section-title {
	margin-top: 40rpx;
	margin-bottom: 24rpx;
}

.section-title-text {
	font-size: 34rpx;
	font-weight: bold;
	color: #111111;
	letter-spacing: 1rpx;
}

/* 正常散文段落 (流式折行 + Drop Cap 大章号) */
.paper-prose-paragraph {
	font-size: 33rpx;
	line-height: 1.95;
	color: #262626;
	text-align: justify;
	text-justify: inter-ideograph;
	letter-spacing: 0.8rpx;
	margin-bottom: 26rpx;
}

/* 超大章号下沉 (Drop Cap 占据首两行) */
.drop-cap-wrap {
	float: left;
	line-height: 0.82;
	margin-right: 16rpx;
	margin-top: 6rpx;
	margin-bottom: 0;
}

.drop-cap-num {
	font-size: 82rpx;
	font-weight: 500;
	color: #111111;
	font-family: -apple-system, "SimSun", "Songti SC", serif;
}

/* 流式行内上标小节号 */
.sup-verse-num {
	font-size: 20rpx;
	vertical-align: super;
	color: #8c9399;
	margin-left: 6rpx;
	margin-right: 4rpx;
	font-weight: normal;
	line-height: 1;
}

/* 经典和合本专名下划线 (人名/地名专名线) */
.proper-noun {
	border-bottom: 2rpx solid #262626;
	padding-bottom: 2rpx;
}

/* 诗歌体缩进排版 (旧约预言诗引用) */
.paper-poetry-box {
	margin: 28rpx 0;
	padding-left: 48rpx;
	padding-right: 20rpx;
}

.poetry-line {
	display: flex;
	align-items: flex-start;
	margin-bottom: 14rpx;
}

.poetry-verse-num {
	font-size: 20rpx;
	vertical-align: super;
	color: #8c9399;
	margin-right: 8rpx;
	margin-top: 4rpx;
	line-height: 1;
}

.poetry-text-content {
	font-size: 32rpx;
	line-height: 1.85;
	color: #262626;
	letter-spacing: 1rpx;
}

/* ==================== 2. 按节展示逐节排版系统 ==================== */
.verse-reading-area {
	padding-top: 10rpx;
}

.verse-wrapper {
	margin-bottom: 24rpx;
}

.verse-mode-title {
	margin-top: 36rpx;
	margin-bottom: 20rpx;
}

.verse-container {
	margin-bottom: 20rpx;
	display: flex;
	align-items: flex-start;
}

.verse-number {
	min-width: 56rpx;
	font-size: 24rpx;
	color: #8c9399;
	font-weight: bold;
	margin-right: 18rpx;
	margin-top: 8rpx;
	text-align: center;
}

.verse-text-flow {
	flex: 1;
	font-size: 34rpx;
	color: #262626;
	line-height: 1.85;
	text-align: justify;
}

/* 底部工具栏 */
.bottom-toolbar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 20rpx 0;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: #fff;
	border-top: 1rpx solid #e0e0e0;
	height: 160rpx;
	box-sizing: border-box;
	z-index: 100;
	transform: translateY(0);
	transition: transform 0.3s ease;
}

.bottom-toolbar.toolbar-hidden {
	transform: translateY(100%);
}

.toolbar-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.toolbar-icon {
	font-size: 36rpx;
	color: #666;
	margin-bottom: 8rpx;
}

.toolbar-text {
	font-size: 20rpx;
	color: #666;
}

.toolbar-share-btn {
	background: transparent;
	border: none;
	padding: 0;
	margin: 0;
	line-height: normal;
	font-size: inherit;
	color: inherit;
	border-radius: 0;
}

.toolbar-share-btn::after {
	border: none;
}

.toolbar-item.is-active-btn .toolbar-icon {
	color: #2d5a3f;
	font-weight: bold;
}

.toolbar-item.is-active-btn .toolbar-text {
	color: #2d5a3f;
	font-weight: bold;
}

/* 顶部搜索浮动栏 */
.search-floating-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10rpx 24rpx 14rpx 24rpx;
	background: #ffffff;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);
	gap: 16rpx;
	box-sizing: border-box;
}

.search-input-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	background: #f1f4f6;
	border-radius: 32rpx;
	padding: 8rpx 20rpx;
	height: 64rpx;
	box-sizing: border-box;
}

.search-icon {
	font-size: 26rpx;
	margin-right: 12rpx;
	opacity: 0.6;
}

.search-input {
	flex: 1;
	font-size: 26rpx;
	color: #2c3e50;
	height: 100%;
}

.search-clear-btn {
	font-size: 28rpx;
	color: #95a5a6;
	padding: 0 8rpx;
	line-height: 1;
}

.search-actions {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.search-counter {
	font-size: 22rpx;
	color: #7f8c8d;
	min-width: 60rpx;
	text-align: right;
}

.search-nav-btn {
	width: 52rpx;
	height: 52rpx;
	line-height: 48rpx;
	padding: 0;
	border-radius: 50%;
	background: #eef2f5;
	color: #2c3e50;
	font-size: 32rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
}

.search-nav-btn::after {
	border: none;
}

.search-nav-btn[disabled] {
	opacity: 0.35;
	background: #f5f5f5;
}

.search-close-text {
	font-size: 26rpx;
	color: #2d5a3f;
	font-weight: 500;
	padding: 6rpx 12rpx;
}

/* 经文搜索高亮与选中聚焦样式 */
.search-highlight {
	background-color: #ffecb3;
	color: #5d4037;
	border-radius: 4rpx;
	padding: 0 2rpx;
	font-weight: 600;
}

.search-active-target {
	background-color: #ff9800 !important;
	color: #ffffff !important;
	border-radius: 4rpx;
	padding: 0 4rpx;
	font-weight: bold;
}

.verse-active-matched {
	background: rgba(255, 152, 0, 0.08) !important;
	border-radius: 8rpx;
	transition: background 0.3s;
}

.sup-active-matched {
	color: #e65100 !important;
	font-weight: bold !important;
}

.verse-anchor {
	display: inline-block;
	width: 0;
	height: 0;
	visibility: hidden;
}

/* 新增：用于加载和错误提示的样式 */
.feedback-container {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 100rpx;
	background: #f8f8f8;
}

.feedback-text {
	font-size: 32rpx;
	color: #999;
}



/* 经文底部读完打卡区域 */
.reading-finish-section {
	margin: 60rpx 0 60rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 28rpx;
}

.finish-chapter-btn {
	background: linear-gradient(135deg, #c58b43, #a46724);
	color: #ffffff;
	border-radius: 40rpx;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	font-weight: bold;
	padding: 0 48rpx;
	box-shadow: 0 4rpx 12rpx rgba(180, 115, 45, 0.3);
}

/* 章节便捷翻页导航行 (上一章 / 下一章) */
.chapter-nav-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 36rpx;
	width: 100%;
}

.nav-page-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 68rpx;
	line-height: 68rpx;
	padding: 0 42rpx;
	border-radius: 34rpx;
	font-size: 26rpx;
	font-weight: 500;
	background: #e6edf2;
	color: #4a5c68;
	border: 1rpx solid #cddce6;
	transition: all 0.2s ease;
	box-sizing: border-box;
}

.nav-page-btn:active {
	background: #d8e4ec;
	transform: scale(0.98);
}

.nav-page-btn::after {
	border: none;
}

.nav-arrow {
	font-size: 32rpx;
	line-height: 1;
	margin: 0 6rpx;
}

.finish-chapter-btn.btn-is-checked {
	background: #f1f3f5;
	color: #868e96;
	box-shadow: none;
}

.finish-chapter-btn::after {
	border: none;
}

/* 25 分钟番茄钟完成弹窗 */
.timer-modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.timer-modal-body {
	background: #ffffff;
	width: 80%;
	max-width: 600rpx;
	border-radius: 24rpx;
	padding: 48rpx 36rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.timer-modal-icon {
	font-size: 72rpx;
	margin-bottom: 16rpx;
}

.timer-modal-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 12rpx;
}

.timer-modal-desc {
	font-size: 26rpx;
	color: #7b6d64;
	line-height: 1.5;
	margin-bottom: 36rpx;
}

.timer-modal-actions {
	display: flex;
	gap: 20rpx;
	width: 100%;
}

.modal-act-btn {
	flex: 1;
	height: 76rpx;
	line-height: 76rpx;
	border-radius: 38rpx;
	font-size: 26rpx;
	font-weight: bold;
}

.modal-act-btn.outline {
	background: #f1ede6;
	color: #7b6d64;
}

.modal-act-btn.primary {
	background: #c58b43;
	color: #ffffff;
}

.modal-act-btn::after {
	border: none;
}

/* 审核伪装：风物美文随笔阅读样式 */
.audit-article-view {
	width: 100vw;
	min-height: 100vh;
	background-color: #f7f6f2;
	display: flex;
	flex-direction: column;
}

.audit-article-scroll {
	flex: 1;
	height: calc(100vh - 120rpx);
	padding-bottom: 80rpx;
}

.article-banner-img {
	width: 100%;
	height: 420rpx;
	display: block;
}

.article-body-card {
	margin: -40rpx 32rpx 40rpx 32rpx;
	position: relative;
	z-index: 2;
	background: #ffffff;
	border-radius: 28rpx;
	padding: 44rpx 36rpx;
	box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
}

.article-h1 {
	font-size: 40rpx;
	font-weight: bold;
	color: #2c2523;
	line-height: 1.4;
	margin-bottom: 20rpx;
}

.article-meta-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding-bottom: 24rpx;
	margin-bottom: 32rpx;
	border-bottom: 1rpx solid #f0ede6;
}

.article-author {
	font-size: 24rpx;
	color: #c58b43;
	font-weight: 600;
	background: rgba(197, 139, 67, 0.1);
	padding: 4rpx 16rpx;
	border-radius: 8rpx;
}

.article-time {
	font-size: 24rpx;
	color: #9c9289;
}

.article-content-text {
	display: flex;
	flex-direction: column;
	gap: 28rpx;
	margin-bottom: 48rpx;
}

.article-content-text .p-text {
	font-size: 32rpx;
	color: #4a4039;
	line-height: 1.85;
	text-align: justify;
	letter-spacing: 1rpx;
}

.return-home-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: linear-gradient(135deg, #44634f, #2c4436);
	color: #ffffff;
	font-size: 30rpx;
	font-weight: 600;
	border-radius: 44rpx;
	text-align: center;
	border: none;
	box-shadow: 0 8rpx 20rpx rgba(44, 68, 54, 0.25);
}

.return-home-btn::after {
	border: none;
}
</style>
