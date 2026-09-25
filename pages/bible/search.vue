<template>
	<view class="search-page-container">
		<!-- 顶部安全区域与搜索栏 -->
		<view class="search-header-fixed" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="search-input-row">
				<view class="search-box-wrap">
					<text class="search-prefix-icon">🔍</text>
					<input 
						class="search-main-input" 
						type="text" 
						v-model="keyword" 
						placeholder="请输入要搜索的文字" 
						confirm-type="search"
						:focus="autoFocus"
						@input="onInput"
						@confirm="onConfirmSearch"
					/>
					<text v-if="keyword" class="search-clear-icon" @click="clearKeyword">✕</text>
				</view>
				<view class="cancel-btn" @click="goBack">
					<text class="cancel-btn-text">取消</text>
				</view>
			</view>

			<!-- 范围分类横向滚动标签栏 -->
			<view class="scope-tabs-bar">
				<view class="version-select-tag">
					<text class="version-text">和合本 ▼</text>
				</view>
				<scroll-view scroll-x class="scope-scroll" :show-scrollbar="false">
					<view class="scope-tabs-track">
						<view 
							v-for="tab in scopeList" 
							:key="tab.id"
							class="scope-tab-item"
							:class="{ 'is-active': currentScope === tab.id }"
							@click="switchScope(tab.id)">
							<text class="tab-label">{{ tab.name }}</text>
							<view v-if="currentScope === tab.id" class="active-indicator"></view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 占位填充，防止内容被顶部固定栏遮挡 -->
		<view :style="{ height: headerTotalHeight + 'px' }"></view>

		<!-- 状态一：展示搜索历史（搜索框无输入或未确认搜索） -->
		<view v-if="!hasSearched" class="search-history-container">
			<view class="history-title-row" v-if="historyList.length > 0">
				<text class="history-title">搜索历史</text>
				<view class="history-clear-btn" @click="confirmClearHistory">
					<text class="trash-icon">🗑</text>
				</view>
			</view>

			<view class="history-list" v-if="historyList.length > 0">
				<view 
					v-for="(item, index) in historyList" 
					:key="index"
					class="history-item"
					@click="clickHistoryItem(item)">
					<view class="history-left">
						<text class="history-clock-icon">🕒</text>
						<text class="history-keyword">{{ item }}</text>
					</view>
					<text class="history-version-tag">和合本</text>
				</view>
			</view>

			<!-- 无搜索历史时的空白引导 -->
			<view v-else class="empty-history-tip">
				<text class="empty-tip-text">输入关键词，即可全书跨卷检索经文</text>
			</view>
		</view>

		<!-- 状态二：搜索结果展示 -->
		<view v-else class="search-results-container">
			<!-- 加载中动画 -->
			<view v-if="isLoading" class="search-loading-box">
				<text class="loading-spin-text">正在检索全本经文...</text>
			</view>

			<!-- 搜索无结果 -->
			<view v-else-if="results.length === 0" class="no-results-box">
				<text class="no-result-icon">📖</text>
				<text class="no-result-text">在当前分类下未找到关于“{{ keyword }}”的经文</text>
				<text class="no-result-sub">建议切换到【整本圣经】范围或更换同义词搜索</text>
			</view>

			<!-- 结果列表 -->
			<view v-else class="results-content-box">
				<!-- 结果总数小字条 -->
				<view class="result-count-banner">
					<text class="count-text">共找到 {{ totalCount }} 处经文</text>
				</view>

				<scroll-view scroll-y class="results-scroll-list">
					<view 
						v-for="(item, idx) in results" 
						:key="idx" 
						class="result-item-card"
						@click="navigateToVerse(item)">
						<!-- 经卷与章节 -->
						<view class="card-meta-row">
							<text class="verse-reference">{{ item.bookName }} 第 {{ item.chapter }} 章 {{ item.verse }} 节</text>
							<text class="verse-tag">和合本</text>
						</view>

						<!-- 经文内容高亮 -->
						<view class="verse-content-flow">
							<text 
								v-for="(part, pIdx) in getHighlightedParts(item.text, keyword)" 
								:key="pIdx"
								:class="{ 'keyword-matched': part.highlight }">{{ part.text }}</text>
						</view>
					</view>

					<view class="list-bottom-padding"></view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import { bibleIndex } from '@/static/bible-data/bible-index.js';
import { BIBLE_API_BASE, BIBLE_ASSETS_BASE } from '@/common/config.js';

export default {
	data() {
		return {
			statusBarHeight: 20,
			headerTotalHeight: 110,
			keyword: '',
			autoFocus: true,
			hasSearched: false,
			isLoading: false,
			currentScope: 'all',
			scopeList: [
				{ id: 'all', name: '整本圣经' },
				{ id: 'old', name: '旧约' },
				{ id: 'new', name: '新约' },
				{ id: 'law', name: '律法书' },
				{ id: 'history', name: '历史书' },
				{ id: 'poetry', name: '诗歌书' },
				{ id: 'prophets', name: '先知书' },
				{ id: 'gospels', name: '福音书' },
				{ id: 'epistles', name: '书信' }
			],
			historyList: [],
			results: [],
			totalCount: 0
		};
	},

	onLoad(options) {
		const sysInfo = uni.getSystemInfoSync();
		this.statusBarHeight = sysInfo.statusBarHeight || 20;
		// 动态计算顶部总固定高度
		this.headerTotalHeight = this.statusBarHeight + 50 + 44;

		// 加载本地搜索历史
		this.loadSearchHistory();

		// 如果带有预设关键词参数
		if (options && options.keyword) {
			this.keyword = decodeURIComponent(options.keyword);
			this.onConfirmSearch();
		}
	},

	methods: {
		goBack() {
			uni.navigateBack();
		},

		clearKeyword() {
			this.keyword = '';
			this.hasSearched = false;
			this.results = [];
			this.totalCount = 0;
		},

		onInput(e) {
			if (!this.keyword || !this.keyword.trim()) {
				this.hasSearched = false;
				this.results = [];
				this.totalCount = 0;
			}
		},

		switchScope(scopeId) {
			if (this.currentScope === scopeId) return;
			this.currentScope = scopeId;
			if (this.hasSearched && this.keyword.trim()) {
				this.performSearch();
			}
		},

		loadSearchHistory() {
			try {
				const history = uni.getStorageSync('bible_search_history');
				if (Array.isArray(history)) {
					this.historyList = history;
				}
			} catch (e) {
				this.historyList = [];
			}
		},

		saveSearchHistory(kw) {
			const text = (kw || '').trim();
			if (!text) return;
			let list = [...this.historyList];
			list = list.filter(item => item !== text);
			list.unshift(text);
			if (list.length > 30) list = list.slice(0, 30);
			this.historyList = list;
			uni.setStorageSync('bible_search_history', list);
		},

		confirmClearHistory() {
			uni.showModal({
				title: '清空历史',
				content: '确定清空所有搜索历史吗？',
				confirmColor: '#d32f2f',
				success: (res) => {
					if (res.confirm) {
						this.historyList = [];
						uni.removeStorageSync('bible_search_history');
						uni.showToast({ title: '已清空', icon: 'none' });
					}
				}
			});
		},

		clickHistoryItem(item) {
			this.keyword = item;
			this.onConfirmSearch();
		},

		onConfirmSearch() {
			const kw = (this.keyword || '').trim();
			if (!kw) {
				uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
				return;
			}
			this.saveSearchHistory(kw);
			this.performSearch();
		},

		// 执行全书检索
		async performSearch() {
			const kw = (this.keyword || '').trim();
			if (!kw) return;

			this.isLoading = true;
			this.hasSearched = true;

			try {
				// 优先请求服务端全文检索接口
				const searchUrl = `${BIBLE_API_BASE}/search?keyword=${encodeURIComponent(kw)}&scope=${this.currentScope}&limit=100`;
				const resp = await new Promise((resolve, reject) => {
					uni.request({
						url: searchUrl,
						method: 'GET',
						dataType: 'json',
						timeout: 8000,
						success: resolve,
						fail: reject
					});
				});

				if (resp.statusCode === 200 && resp.data && (resp.data.code === 0 || resp.data.code === 200)) {
					const data = resp.data.data;
					this.results = data.list || [];
					this.totalCount = data.total || this.results.length;
				} else {
					// 服务端不可用或无接口时，自动降级为本地全书抽样检索
					await this.fallbackClientSearch(kw);
				}
			} catch (err) {
				console.warn('[Search] 服务端搜索接口异常，执行本地降级检索:', err);
				await this.fallbackClientSearch(kw);
			} finally {
				this.isLoading = false;
			}
		},

		// 客户端本地平滑降级全书检索策略
		async fallbackClientSearch(kw) {
			const matched = [];
			const filteredBooks = this.getBooksByScope(this.currentScope);

			// 优先并行检查关键经卷
			for (let i = 0; i < filteredBooks.length && matched.length < 50; i++) {
				const book = filteredBooks[i];
				// 采样该卷前 3 章
				const maxSample = Math.min(3, book.chapters || 1);
				for (let ch = 1; ch <= maxSample && matched.length < 50; ch++) {
					try {
						const url = `${BIBLE_ASSETS_BASE}/bible-data/volume-${book.sn}-chapter-${ch}.json`;
						const res = await new Promise((resolve, reject) => {
							uni.request({ url, dataType: 'json', success: resolve, fail: reject });
						});
						if (res.statusCode === 200 && Array.isArray(res.data)) {
							res.data.forEach((v, vIdx) => {
								if (v.text && v.text.includes(kw)) {
									matched.push({
										sn: book.sn,
										bookId: book.bookId,
										bookName: book.fullName,
										chapter: ch,
										verse: Number(v.verse) || (vIdx + 1),
										text: v.text
									});
								}
							});
						}
					} catch (e) {}
				}
			}

			this.results = matched;
			this.totalCount = matched.length;
		},

		getBooksByScope(scope) {
			if (scope === 'old') return bibleIndex.filter(b => b.newOrOld === 0);
			if (scope === 'new') return bibleIndex.filter(b => b.newOrOld === 1);
			if (scope === 'law') return bibleIndex.filter(b => b.kindSN === 1);
			if (scope === 'history') return bibleIndex.filter(b => b.kindSN === 2);
			if (scope === 'poetry') return bibleIndex.filter(b => b.kindSN === 3);
			if (scope === 'prophets') return bibleIndex.filter(b => b.kindSN === 4 || b.kindSN === 5);
			if (scope === 'gospels') return bibleIndex.filter(b => b.sn >= 40 && b.sn <= 43);
			if (scope === 'epistles') return bibleIndex.filter(b => b.sn >= 45 && b.sn <= 65);
			return bibleIndex;
		},

		// 文本高亮拆分
		getHighlightedParts(text, kw) {
			const keyword = (kw || '').trim();
			if (!keyword || !text) return [{ text, highlight: false }];
			const parts = [];
			const lowerText = text.toLowerCase();
			const lowerKw = keyword.toLowerCase();
			let start = 0;
			let pos = lowerText.indexOf(lowerKw, start);
			while (pos !== -1) {
				if (pos > start) {
					parts.push({ text: text.substring(start, pos), highlight: false });
				}
				parts.push({ text: text.substring(pos, pos + keyword.length), highlight: true });
				start = pos + keyword.length;
				pos = lowerText.indexOf(lowerKw, start);
			}
			if (start < text.length) {
				parts.push({ text: text.substring(start), highlight: false });
			}
			return parts;
		},

		// 点击单条结果跳转至阅读页并聚焦定位
		navigateToVerse(item) {
			const url = `/pages/bible/reading?book=${item.bookId}&chapter=${item.chapter}&targetVerse=${item.verse}&keyword=${encodeURIComponent(this.keyword)}`;
			uni.navigateTo({
				url,
				fail: () => {
					uni.redirectTo({ url });
				}
			});
		}
	}
};
</script>

<style scoped>
.search-page-container {
	min-height: 100vh;
	background-color: #ffffff;
	display: flex;
	flex-direction: column;
}

/* 顶部固定吸顶搜索栏 */
.search-header-fixed {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: #ffffff;
	z-index: 999;
	border-bottom: 1rpx solid #f0f0f0;
}

.search-input-row {
	display: flex;
	align-items: center;
	padding: 12rpx 28rpx;
	gap: 20rpx;
}

.search-box-wrap {
	flex: 1;
	height: 72rpx;
	background: #f2f2f2;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	padding: 0 24rpx;
	box-sizing: border-box;
}

.search-prefix-icon {
	font-size: 30rpx;
	opacity: 0.5;
	margin-right: 14rpx;
}

.search-main-input {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: #333333;
}

.search-clear-icon {
	font-size: 28rpx;
	color: #999999;
	padding: 8rpx;
	line-height: 1;
}

.cancel-btn {
	padding: 10rpx 8rpx;
}

.cancel-btn-text {
	font-size: 30rpx;
	color: #d32f2f;
	font-weight: 500;
}

/* 范围分类标签栏 */
.scope-tabs-bar {
	display: flex;
	align-items: center;
	height: 80rpx;
	padding: 0 20rpx;
	border-top: 1rpx solid #fafafa;
}

.version-select-tag {
	padding-right: 24rpx;
	border-right: 1rpx solid #ececec;
	flex-shrink: 0;
}

.version-text {
	font-size: 26rpx;
	color: #333333;
	font-weight: 500;
}

.scope-scroll {
	flex: 1;
	white-space: nowrap;
	margin-left: 20rpx;
}

.scope-tabs-track {
	display: inline-flex;
	align-items: center;
	gap: 36rpx;
}

.scope-tab-item {
	position: relative;
	height: 76rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 4rpx;
}

.tab-label {
	font-size: 26rpx;
	color: #666666;
	transition: all 0.2s;
}

.scope-tab-item.is-active .tab-label {
	color: #d32f2f;
	font-weight: bold;
}

.active-indicator {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 4rpx;
	background: #d32f2f;
	border-radius: 2rpx;
}

/* 搜索历史模块 */
.search-history-container {
	padding: 24rpx 32rpx;
}

.history-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.history-title {
	font-size: 26rpx;
	color: #888888;
}

.history-clear-btn {
	padding: 8rpx 12rpx;
}

.trash-icon {
	font-size: 28rpx;
	color: #999999;
}

.history-list {
	display: flex;
	flex-direction: column;
}

.history-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 26rpx 0;
	border-bottom: 1rpx solid #f6f6f6;
}

.history-item:active {
	background-color: #fafafa;
}

.history-left {
	display: flex;
	align-items: center;
	flex: 1;
	gap: 16rpx;
}

.history-clock-icon {
	font-size: 28rpx;
	color: #999999;
}

.history-keyword {
	font-size: 30rpx;
	color: #333333;
}

.history-version-tag {
	font-size: 24rpx;
	color: #bbbbbb;
}

.empty-history-tip {
	margin-top: 140rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

.empty-tip-text {
	font-size: 26rpx;
	color: #b0b0b0;
}

/* 搜索结果模块 */
.search-results-container {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.search-loading-box {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 100rpx 0;
}

.loading-spin-text {
	font-size: 28rpx;
	color: #888888;
}

.no-results-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 40rpx;
	text-align: center;
}

.no-result-icon {
	font-size: 80rpx;
	margin-bottom: 24rpx;
	opacity: 0.6;
}

.no-result-text {
	font-size: 30rpx;
	color: #444444;
	font-weight: 500;
	margin-bottom: 12rpx;
}

.no-result-sub {
	font-size: 24rpx;
	color: #999999;
}

.results-content-box {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.result-count-banner {
	background: #fbfbfb;
	padding: 14rpx 32rpx;
	border-bottom: 1rpx solid #f2f2f2;
}

.count-text {
	font-size: 24rpx;
	color: #888888;
}

.results-scroll-list {
	flex: 1;
	height: calc(100vh - 260rpx);
}

.result-item-card {
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.result-item-card:active {
	background-color: #fafafa;
}

.card-meta-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.verse-reference {
	font-size: 28rpx;
	color: #a46724;
	font-weight: bold;
}

.verse-tag {
	font-size: 22rpx;
	color: #999999;
}

.verse-content-flow {
	font-size: 30rpx;
	color: #333333;
	line-height: 1.6;
}

.keyword-matched {
	color: #d32f2f;
	font-weight: bold;
	background-color: rgba(211, 47, 47, 0.08);
	padding: 0 4rpx;
	border-radius: 4rpx;
}

.list-bottom-padding {
	height: 60rpx;
}
</style>
