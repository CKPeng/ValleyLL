<template>
	<view class="bible-container">
		<!-- 模式一：审核伪装模式【百城漫游 · 目的地画廊】 -->
		<view v-if="isAudit" class="audit-scenery-view">
			<!-- 顶部导航栏 -->
			<view class="nav-bar">
				<view class="nav-left" @click="goBack">
					<view class="back-arrow-icon"></view>
					<text class="back-text">返回</text>
				</view>
				<view class="nav-center">
					<text class="nav-title">城市漫游画廊</text>
					<text class="nav-subtitle">精选风物 · 摄影志</text>
				</view>
				<view class="nav-right"></view>
			</view>

			<scroll-view scroll-y class="scenery-gallery-scroll">
				<view class="scenery-gallery-header">
					<text class="gallery-lead-title">探索华夏名城</text>
					<text class="gallery-lead-sub">精选 6 大文旅胜地风光画报与自然之声</text>
				</view>
				<view class="gallery-grid">
					<view 
						v-for="(city, idx) in auditCities" 
						:key="idx" 
						class="city-card"
						@click="selectAuditCity(idx)"
					>
						<image class="city-thumb" :src="city.image" mode="aspectFill"></image>
						<view class="city-card-info">
							<text class="city-name-txt">{{ city.city }}</text>
							<text class="city-title-txt">{{ city.title }}</text>
							<text class="city-sound-tag">🎵 {{ city.sound }}</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 模式二：正式开放模式【圣经目录】 -->
		<view v-else class="real-bible-view">
			<!-- 顶部导航栏 -->
			<view class="nav-bar">
				<view class="nav-left" @click="goBack">
					<view class="back-arrow-icon"></view>
					<text class="back-text">返回</text>
				</view>
				<view class="nav-center">
					<text class="nav-title">{{ currentBookName || '圣经' }}</text>
					<text class="nav-subtitle">和合本 ▼</text>
				</view>
				<view class="nav-right">
					<view class="search-entry-btn" @click.stop="goToSearch">
						<text class="search-entry-icon">🔍</text>
					</view>
					<view class="plan-entry-btn" @click="goToPlan">
						<text class="plan-entry-icon">📅</text>
						<text class="plan-entry-text">计划</text>
					</view>
				</view>
			</view>
		
		<!-- 标签页 -->
		<view class="tab-bar">
			<view 
				class="tab-item" 
				:class="{ 'active': currentTab === 'book' }"
				@click="switchTab('book')"
			>
				<text class="tab-text">卷</text>
			</view>
			<view 
				class="tab-item" 
				:class="{ 'active': currentTab === 'chapter' }"
				@click="switchTab('chapter')"
			>
				<text class="tab-text">章</text>
			</view>
		</view>
		
		<!-- 目录到节开关 -->
	<!-- 	<view class="controls">
			<view class="control-item">
				<text class="control-label">目录到节</text>
				<switch 
					:checked="showVerseIndex" 
					@change="toggleVerseIndex"
					color="#ff6b35"
				/>
			</view>
			<view class="view-controls">
				<text class="view-icon">视图</text>
				<view class="dots">
					<view class="dot active"></view>
					<view class="dot active"></view>
					<view class="dot"></view>
					<view class="dot"></view>
				</view>
				<text class="menu-icon">≡</text>
			</view>
		</view> -->
		
		<!-- 内容区域 -->
		<view class="content-area">
			<!-- 书卷选择 -->
			<view v-if="currentTab === 'book'" class="book-selection">
				<!-- 旧约 -->
				<view class="testament-section">
					<text class="testament-title">旧约</text>
					<view class="book-grid">
						<view 
							v-for="book in oldTestamentBooks" 
							:key="book.id"
							class="book-item"
							:class="{ 'selected': selectedBook === book.id }"
							@click="selectBook(book.id)"
						>
							<text class="book-short">{{ book.short }}</text>
							<text class="book-name">{{ book.name }}</text>
						</view>
					</view>
				</view>
				
				<!-- 新约 -->
				<view class="testament-section">
					<text class="testament-title">新约</text>
					<view class="book-grid">
						<view 
							v-for="book in newTestamentBooks" 
							:key="book.id"
							class="book-item"
							:class="{ 'selected': selectedBook === book.id }"
							@click="selectBook(book.id)"
						>
							<text class="book-short">{{ book.short }}</text>
							<text class="book-name">{{ book.name }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 章节选择 -->
			<view v-if="currentTab === 'chapter' && selectedBook" class="chapter-selection">
				<view class="chapter-grid">
					<view 
						v-for="chapter in getChapters(selectedBook)" 
						:key="chapter"
						class="chapter-item"
						:class="{ 'selected': selectedChapter === chapter }"
						@click="selectChapter(chapter)"
					>
						<text class="chapter-number">{{ chapter }}</text>
					</view>
				</view>
			</view>
			
		</view>
		</view>
	</view>
</template>

<script>
import { isAuditMode } from '@/common/audit-guard.js';

export default {
	data() {
		return {
			isAudit: true, // 初始绝对处于审核伪装模式
			auditCities: [
				{ city: '江苏 · 苏州', title: '平江水弄烟雨', image: '/static/scenery/suzhou.jpg', sound: '溪涧幽泉' },
				{ city: '广西 · 桂林', title: '漓江水墨晚舟', image: '/static/scenery/guilin.jpg', sound: '烟雨晚风' },
				{ city: '云南 · 大理', title: '苍山雪霁洱海', image: '/static/scenery/dali.jpg', sound: '苍山清风' },
				{ city: '浙江 · 杭州', title: '西子晴光断桥', image: '/static/scenery/hangzhou.jpg', sound: '幽篁雨露' },
				{ city: '四川 · 成都', title: '青城修竹叠翠', image: '/static/scenery/chengdu.jpg', sound: '深谷鸟鸣' },
				{ city: '福建 · 厦门', title: '琴岛海韵听涛', image: '/static/scenery/xiamen.jpg', sound: '潮平海浪' }
			],
			currentTab: 'book',
			selectedBook: null,
			selectedChapter: null,
			showVerseIndex: false,
			selectForPlan: null,
			// 旧约书卷
			oldTestamentBooks: [
				{ id: 'genesis', short: '创', name: '创世记', chapters: 50 },
				{ id: 'exodus', short: '出', name: '出埃及记', chapters: 40 },
				{ id: 'leviticus', short: '利', name: '利未记', chapters: 27 },
				{ id: 'numbers', short: '民', name: '民数记', chapters: 36 },
				{ id: 'deuteronomy', short: '申', name: '申命记', chapters: 34 },
				{ id: 'joshua', short: '书', name: '约书亚记', chapters: 24 },
				{ id: 'judges', short: '士', name: '士师记', chapters: 21 },
				{ id: 'ruth', short: '得', name: '路得记', chapters: 4 },
				{ id: '1samuel', short: '撒上', name: '撒母耳记上', chapters: 31 },
				{ id: '2samuel', short: '撒下', name: '撒母耳记下', chapters: 24 },
				{ id: '1kings', short: '王上', name: '列王纪上', chapters: 22 },
				{ id: '2kings', short: '王下', name: '列王纪下', chapters: 25 },
				{ id: '1chronicles', short: '代上', name: '历代志上', chapters: 29 },
				{ id: '2chronicles', short: '代下', name: '历代志下', chapters: 36 },
				{ id: 'ezra', short: '拉', name: '以斯拉记', chapters: 10 },
				{ id: 'nehemiah', short: '尼', name: '尼希米记', chapters: 13 },
				{ id: 'esther', short: '斯', name: '以斯帖记', chapters: 10 },
				{ id: 'job', short: '伯', name: '约伯记', chapters: 42 },
				{ id: 'psalms', short: '诗', name: '诗篇', chapters: 150 },
				{ id: 'proverbs', short: '箴', name: '箴言', chapters: 31 },
				{ id: 'ecclesiastes', short: '传', name: '传道书', chapters: 12 },
				{ id: 'song', short: '歌', name: '雅歌', chapters: 8 },
				{ id: 'isaiah', short: '赛', name: '以赛亚书', chapters: 66 },
				{ id: 'jeremiah', short: '耶', name: '耶利米书', chapters: 52 },
				{ id: 'lamentations', short: '哀', name: '耶利米哀歌', chapters: 5 },
				{ id: 'ezekiel', short: '结', name: '以西结书', chapters: 48 },
				{ id: 'daniel', short: '但', name: '但以理书', chapters: 12 },
				{ id: 'hosea', short: '何', name: '何西阿书', chapters: 14 },
				{ id: 'joel', short: '珥', name: '约珥书', chapters: 3 },
				{ id: 'amos', short: '摩', name: '阿摩司书', chapters: 9 },
				{ id: 'obadiah', short: '俄', name: '俄巴底亚书', chapters: 1 },
				{ id: 'jonah', short: '拿', name: '约拿书', chapters: 4 },
				{ id: 'micah', short: '弥', name: '弥迦书', chapters: 7 },
				{ id: 'nahum', short: '鸿', name: '那鸿书', chapters: 3 },
				{ id: 'habakkuk', short: '哈', name: '哈巴谷书', chapters: 3 },
				{ id: 'zephaniah', short: '番', name: '西番雅书', chapters: 3 },
				{ id: 'haggai', short: '该', name: '哈该书', chapters: 2 },
				{ id: 'zechariah', short: '亚', name: '撒迦利亚书', chapters: 14 },
				{ id: 'malachi', short: '玛', name: '玛拉基书', chapters: 4 }
			],
			// 新约书卷
			newTestamentBooks: [
				{ id: 'matthew', short: '太', name: '马太福音', chapters: 28 },
				{ id: 'mark', short: '可', name: '马可福音', chapters: 16 },
				{ id: 'luke', short: '路', name: '路加福音', chapters: 24 },
				{ id: 'john', short: '约', name: '约翰福音', chapters: 21 },
				{ id: 'acts', short: '徒', name: '使徒行传', chapters: 28 },
				{ id: 'romans', short: '罗', name: '罗马书', chapters: 16 },
				{ id: '1corinthians', short: '林前', name: '哥林多前书', chapters: 16 },
				{ id: '2corinthians', short: '林后', name: '哥林多后书', chapters: 13 },
				{ id: 'galatians', short: '加', name: '加拉太书', chapters: 6 },
				{ id: 'ephesians', short: '弗', name: '以弗所书', chapters: 6 },
				{ id: 'philippians', short: '腓', name: '腓立比书', chapters: 4 },
				{ id: 'colossians', short: '西', name: '歌罗西书', chapters: 4 },
				{ id: '1thessalonians', short: '帖前', name: '帖撒罗尼迦前书', chapters: 5 },
				{ id: '2thessalonians', short: '帖后', name: '帖撒罗尼迦后书', chapters: 3 },
				{ id: '1timothy', short: '提前', name: '提摩太前书', chapters: 6 },
				{ id: '2timothy', short: '提后', name: '提摩太后书', chapters: 4 },
				{ id: 'titus', short: '多', name: '提多书', chapters: 3 },
				{ id: 'philemon', short: '门', name: '腓利门书', chapters: 1 },
				{ id: 'hebrews', short: '来', name: '希伯来书', chapters: 13 },
				{ id: 'james', short: '雅', name: '雅各书', chapters: 5 },
				{ id: '1peter', short: '彼前', name: '彼得前书', chapters: 5 },
				{ id: '2peter', short: '彼后', name: '彼得后书', chapters: 3 },
				{ id: '1john', short: '约一', name: '约翰一书', chapters: 5 },
				{ id: '2john', short: '约二', name: '约翰二书', chapters: 1 },
				{ id: '3john', short: '约三', name: '约翰三书', chapters: 1 },
				{ id: 'jude', short: '犹', name: '犹大书', chapters: 1 },
				{ id: 'revelation', short: '启', name: '启示录', chapters: 22 }
			]
		}
	},
	computed: {
		currentBookName() {
			const allBooks = [...this.oldTestamentBooks, ...this.newTestamentBooks];
			const book = allBooks.find(b => b.id === this.selectedBook);
			return book ? book.name : '';
		}
	},

	onLoad() {
		this.isAudit = isAuditMode();
	},

	onShow() {
		this.isAudit = isAuditMode();
		if (this.isAudit) return;
		const trackType = uni.getStorageSync('temp_select_for_plan');
		if (trackType) {
			this.selectForPlan = trackType;
			// 清除标志，防止污染下次正常进入
			uni.removeStorageSync('temp_select_for_plan');
		}
	},
	
	methods: {
		// 审核模式下点击城市卡片漫游
		selectAuditCity(idx) {
			uni.reLaunch({
				url: '/pages/index/index'
			});
		},
		// 跳转到读经计划
		goToPlan() {
			uni.navigateTo({
				url: '/pages/bible/plan'
			});
		},

		// 跳转到全书经文搜索
		goToSearch() {
			uni.navigateTo({
				url: '/pages/bible/search'
			});
		},

		// 返回上一页
		goBack() {
			uni.navigateBack();
		},
		
		// 切换标签页
		switchTab(tab) {
			this.currentTab = tab;
		},
		
		// 切换目录到节开关
		toggleVerseIndex(e) {
			this.showVerseIndex = e.detail.value;
		},
		
		// 选择书卷
		selectBook(bookId) {
			this.selectedBook = bookId;
			this.selectedChapter = null;
			// 选择书卷后自动切换到章节标签页
			this.currentTab = 'chapter';
		},

		// 选择章节
		selectChapter(chapter) {
			this.selectedChapter = chapter;
			
			if (this.selectForPlan) {
				// 发送事件给 plan.vue，让它在后台默默更新指针
				uni.$emit('planTrackUpdated', {
					track: this.selectForPlan,
					bookId: this.selectedBook,
					chapter: chapter
				});
				// 直接跳转到阅读页，并带上 fromPlan=true！
				// 这样用户选完章节就能直接开始读，且算作计划打卡
				uni.redirectTo({
					url: `/pages/bible/reading?book=${this.selectedBook}&chapter=${chapter}&fromPlan=true`
				});
				return;
			}
			
			// 自由阅读
			uni.navigateTo({
				url: `/pages/bible/reading?book=${this.selectedBook}&chapter=${chapter}`
			});
		},
		
		// 获取章节列表
		getChapters(bookId) {
			const allBooks = [...this.oldTestamentBooks, ...this.newTestamentBooks];
			const book = allBooks.find(b => b.id === bookId);
			return book ? Array.from({length: book.chapters}, (_, i) => i + 1) : [];
		},
		
		// 获取书卷名称
		getBookName(bookId) {
			const allBooks = [...this.oldTestamentBooks, ...this.newTestamentBooks];
			const book = allBooks.find(b => b.id === bookId);
			return book ? book.name : '';
		},
		
		loadChapter() {
			// 这里可以从API或本地数据加载具体的经文内容
			// 现在先用示例数据
			this.verses = [
				{ id: 1, number: 1, text: '起初，神创造天地。' },
				{ id: 2, number: 2, text: '地是空虚混沌，渊面黑暗；神的灵运行在水面上。' },
				{ id: 3, number: 3, text: '神说："要有光"，就有了光。' },
				{ id: 4, number: 4, text: '神看光是好的，就把光暗分开了。' },
				{ id: 5, number: 5, text: '神称光为"昼"，称暗为"夜"。有晚上，有早晨，这是头一日。' }
			];
			
			// 实际应用中，这里应该调用API获取真实的圣经文本
			// this.loadBibleText(this.selectedBook, this.selectedChapter);
		},
		
		// 未来可以添加的方法：从服务器加载圣经文本
		async loadBibleText(book, chapter) {
			try {
				// const response = await uni.request({
				//     url: `https://api.bible.com/v1/${book}/${chapter}`,
				//     method: 'GET'
				// });
				// this.verses = response.data.verses;
			} catch (error) {
				console.error('加载圣经文本失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			}
		}
	}
}
</script>

<style scoped>
.bible-container {
	min-height: 100vh;
	background: #f8f8f8;
	display: flex;
	flex-direction: column;
}

/* 顶部导航栏 */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 30rpx;
	background: #fff;
	border-bottom: 1rpx solid #e0e0e0;
	height: 100rpx;
	box-sizing: border-box;
}

.nav-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.back-arrow-icon {
	width: 18rpx;
	height: 18rpx;
	border-left: 4rpx solid #333;
	border-bottom: 4rpx solid #333;
	transform: rotate(45deg);
	display: inline-block;
	margin-right: 12rpx;
	box-sizing: border-box;
}

.back-text {
	font-size: 30rpx;
	color: #333;
	line-height: 1;
}

.nav-center {
	flex: 2;
	text-align: center;
}

.nav-title {
	display: block;
	font-size: 34rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 4rpx;
}

.nav-subtitle {
	font-size: 24rpx;
	color: #666;
}

.nav-right {
	flex: 1;
	display: flex;
	justify-content: flex-end;
	align-items: center;
}

.search-entry-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: #f4f6f8;
	margin-right: 16rpx;
}

.search-entry-icon {
	font-size: 26rpx;
}

.plan-entry-btn {
	display: flex;
	align-items: center;
	background: #fff4e6;
	border: 1rpx solid #ffd8a8;
	padding: 8rpx 18rpx;
	border-radius: 30rpx;
}

.plan-entry-icon {
	font-size: 24rpx;
	margin-right: 6rpx;
}

.plan-entry-text {
	font-size: 24rpx;
	color: #d9480f;
	font-weight: bold;
}

/* 标签页 */
.tab-bar {
	display: flex;
	background: #fff;
	border-bottom: 1rpx solid #e0e0e0;
}

.tab-item {
	flex: 1;
	text-align: center;
	padding: 24rpx 0;
	position: relative;
}

.tab-text {
	font-size: 32rpx;
	color: #666;
}

.tab-item.active .tab-text {
	color: #ff6b35;
	font-weight: bold;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: #ff6b35;
}

/* 控制区域 */
.controls {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 30rpx;
	background: #fff;
	border-bottom: 1rpx solid #e0e0e0;
}

.control-item {
	display: flex;
	align-items: center;
}

.control-label {
	font-size: 28rpx;
	color: #333;
	margin-right: 20rpx;
}

.view-controls {
	display: flex;
	align-items: center;
}

.view-icon {
	font-size: 28rpx;
	color: #333;
	margin-right: 20rpx;
}

.dots {
	display: flex;
	align-items: center;
	margin-right: 30rpx;
}

.dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #ddd;
	margin-right: 8rpx;
}

.dot.active {
	background: #ff6b35;
}

.menu-icon {
	font-size: 32rpx;
	color: #333;
}

/* 内容区域 */
.content-area {
	flex: 1;
	background: #f8f8f8;
	overflow-y: auto;
}

/* 书卷选择 */
.book-selection {
	padding: 30rpx;
}

.testament-section {
	margin-bottom: 50rpx;
}

.testament-title {
	font-size: 28rpx;
	color: #666;
	margin-bottom: 30rpx;
	padding-left: 10rpx;
}

.book-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 20rpx;
}

.book-item {
	background: #fff;
	border-radius: 12rpx;
	padding: 20rpx 10rpx;
	text-align: center;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
	border: 2rpx solid transparent;
}

.book-item.selected {
	border-color: #ff6b35;
	background: #fff5f2;
}

.book-short {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.book-name {
	font-size: 20rpx;
	color: #666;
	line-height: 1.2;
}

/* 章节选择 */
.chapter-selection {
	padding: 30rpx;
}

.chapter-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 20rpx;
}

.chapter-item {
	background: #fff;
	border-radius: 8rpx;
	padding: 20rpx;
	text-align: center;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
	border: 2rpx solid transparent;
}

.chapter-item.selected {
	border-color: #ff6b35;
	background: #fff5f2;
}

.chapter-number {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

/* 审核伪装画廊样式 */
.audit-scenery-view {
	width: 100vw;
	height: 100vh;
	background: #f7f8fa;
	display: flex;
	flex-direction: column;
}
.scenery-gallery-scroll {
	flex: 1;
	padding: 24rpx 30rpx;
	box-sizing: border-box;
}
.scenery-gallery-header {
	margin-bottom: 24rpx;
}
.gallery-lead-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #2c3e50;
	display: block;
	margin-bottom: 8rpx;
}
.gallery-lead-sub {
	font-size: 24rpx;
	color: #7f8c8d;
	display: block;
}
.gallery-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding-bottom: 60rpx;
}
.city-card {
	background: #ffffff;
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
}
.city-thumb {
	width: 100%;
	height: 200rpx;
	background: #eaeaea;
}
.city-card-info {
	padding: 16rpx 18rpx;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.city-name-txt {
	font-size: 22rpx;
	font-weight: 600;
	color: #e67e22;
}
.city-title-txt {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c3e50;
}
.city-sound-tag {
	font-size: 20rpx;
	color: #16a085;
	margin-top: 4rpx;
}
</style>
