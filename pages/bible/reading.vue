<template>
	<view class="reading-container">
		<!-- 顶部导航栏 -->
		<view class="nav-bar" :style="{ paddingTop: (20 + statusBarHeight) + 'rpx', height: (100 + statusBarHeight) + 'rpx' }">
			<view class="nav-left" @click="goBack">
				<text class="back-icon">‹</text>
				<text class="back-text">返回</text>
			</view>
			<!-- <view class="nav-center">
				<button class="nav-btn catalog-btn" @click="showCatalog">目录</button>
				<button class="nav-btn version-btn">
					和合本
					<view class="red-dot"></view>
				</button>
			</view> -->
			<!-- <view class="nav-right">
				<text class="time-icon"></text>
			</view> -->
		</view>

		<!-- 章节标题 -->
		<view class="chapter-header">
			<!-- 修改：使用动态的 chapterTitle -->
			<text class="chapter-title">{{ chapterTitle }}</text>
		</view>

		<!-- 加载中提示 -->
		<view v-if="isLoading" class="feedback-container">
			<text class="feedback-text">加载中...</text>
		</view>

		<!-- 加载失败提示 -->
		<view v-else-if="loadingError" class="feedback-container">
			<text class="feedback-text">{{ loadingError }}</text>
		</view>

		<!-- 经文内容 -->
		<view v-else class="bible-content"
			@touchstart="handleTouchStart"
			@touchmove="handleTouchMove"
			@touchend="handleTouchEnd"
			@touchcancel="handleTouchEnd">
			<view v-for="verse in verses" :key="verse.id" class="verse-container">
				<text class="verse-number">{{ verse.number }}</text>
				<text class="verse-text">{{ verse.text }}</text>
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="bottom-toolbar" :class="{ 'toolbar-hidden': !showToolbar }">
			<view class="toolbar-item" @click.stop="togglePlay">
				<text class="toolbar-icon">{{ isPlaying ? '❚❚' : '▷' }}</text>
				<text class="toolbar-text">{{ isPlaying ? '暂停' : '播放' }}</text>
			</view>
			<!-- <view class="toolbar-item">
				<text class="toolbar-icon"></text>
				<text class="toolbar-text">搜索</text>
			</view>
			<view class="toolbar-item">
				<text class="toolbar-icon">⚖</text>
				<text class="toolbar-text">对照</text>
			</view>
			<view class="toolbar-item">
				<text class="toolbar-icon"></text>
				<text class="toolbar-text">研读</text>
			</view>
			<view class="toolbar-item">
				<text class="toolbar-icon">⚙</text>
				<text class="toolbar-text">选项</text>
			</view>
			<view class="toolbar-item">
				<text class="toolbar-icon">⋯</text>
				<text class="toolbar-text">更多</text>
			</view> -->
		</view>
	</view>
</template>

<script>
// 导入圣经书卷索引，这是我们的"单一数据源"
import { bibleIndex } from '@/static/bible-data/bible-index.js';

export default {
	data() {
		return {
			bookId: '',    // e.g., 'genesis'
			chapter: 1,    // e.g., 1
			verses: [],    // 经文数组

			// 新增：从索引文件派生出的当前书卷信息
			currentBookInfo: null,

			// 新增：用于改善用户体验的状态
			isLoading: false,
			loadingError: null, // null 表示没有错误

			// 触摸滑动相关
			touchStartX: 0,
			touchStartY: 0,
			touchEndX: 0,
			touchEndY: 0,

			// 音频播放相关
			audioContext: null,
			isPlaying: false,

			// 状态栏高度
			statusBarHeight: 0,

			// 工具栏显示控制
			showToolbar: true,
			toolbarTimer: null,
		}
	},

	// 新增：计算属性，用于动态生成标题
	computed: {
		chapterTitle() {
			if (!this.currentBookInfo) return '';
			// 例如: "创世记 第 1 章"
			return `${this.currentBookInfo.fullName} 第 ${this.chapter} 章`;
		}
	},

	onLoad(options) {
		// 获取系统信息，设置状态栏高度（px 转 rpx，乘以 2）
		const systemInfo = uni.getSystemInfoSync();
		this.statusBarHeight = (systemInfo.statusBarHeight || 0) * 2;
		
		this.bookId = options.book || 'genesis';
		this.chapter = parseInt(options.chapter) || 1;

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

	methods: {
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
			this.verses = []; // 先清空旧数据

			// 更新导航栏标题
			uni.setNavigationBarTitle({
				title: `${this.currentBookInfo.fullName} ${this.chapter}`
			});

			const volumeSN = this.currentBookInfo.sn;
			const bookId = this.currentBookInfo.bookId;
			
			try {
				// 从网络服务器加载章节数据（解决小程序包体积限制问题）
				const jsonFileName = `volume-${volumeSN}-chapter-${this.chapter}.json`;
				const dataUrl = `https://ai.ckpeng.site:6688/bak/bible-mp3-cn/bible-data/${jsonFileName}`;
				
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

				// data 就是 JSON 数组
				this.verses = data.map((item, index) => ({
					id: index + 1,
					number: item.verse,
					text: item.text
				}));

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

		// 触摸事件处理 - 优化版
		handleTouchStart(e) {
			this.touchStartX = e.touches[0].pageX;
			this.touchStartY = e.touches[0].pageY;
			this.touchEndX = e.touches[0].pageX; // 初始化结束位置
			this.touchEndY = e.touches[0].pageY;
			
			// 点击屏幕时切换工具栏显示状态
			this.toggleToolbar();
		},

		handleTouchMove(e) {
			// 实时更新触摸位置
			this.touchEndX = e.touches[0].pageX;
			this.touchEndY = e.touches[0].pageY;
			
			// 滚动时隐藏工具栏
			this.hideToolbar();
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
			if (this.chapter > 1) {
				this.chapter--;
				this.loadChapter();
			} else {
				uni.showToast({ title: '已经是第一章了', icon: 'none' });
			}
		},

		// 下一章
		goToNextChapter() {
			// 从 book aInfo 中获取最大章节数
			const maxChapter = this.currentBookInfo.chapters;
			if (this.chapter < maxChapter) {
				this.chapter++;
				this.loadChapter();
			} else {
				uni.showToast({ title: '已经是最后一章了', icon: 'none' });
			}
		},

		// 生成音频 URL
		getAudioUrl() {
			if (!this.currentBookInfo) return '';
			
			const baseUrl = 'https://ai.ckpeng.site:6688/bak/bible-mp3-cn/汉语和合本-磐石版';
			const bookName = this.currentBookInfo.fullName; // 例如：创世记
			const fileName = `${bookName}第${this.chapter}章.mp3`;
			
			// 构建完整 URL：baseUrl/书卷名/文件名
			return `${baseUrl}/${bookName}/${fileName}`;
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
		}
	},

	// 页面卸载时销毁音频
	onUnload() {
		if (this.audioContext) {
			this.audioContext.stop();
			this.audioContext.destroy();
		}
	}
}
</script>

<style scoped>
.reading-container {
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
	/* padding-top 和 height 通过动态样式设置 */
	background: #fff;
	border-bottom: 1rpx solid #e0e0e0;
	box-sizing: border-box;
}

.nav-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.back-icon {
	font-size: 36rpx;
	color: #333;
	margin-right: 10rpx;
}

.back-text {
	font-size: 32rpx;
	color: #333;
}

.nav-center {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 2;
	gap: 20rpx;
}

.nav-btn {
	padding: 12rpx 24rpx;
	border-radius: 40rpx;
	font-size: 28rpx;
	position: relative;
	border: none;
	background: none;
}

.catalog-btn {
	border: 2rpx solid #ddd;
	color: #666;
	background: #fff;
}

.version-btn {
	border: 2rpx solid #ddd;
	color: #666;
	background: #fff;
}

.red-dot {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 12rpx;
	height: 12rpx;
	background: #ff4444;
	border-radius: 50%;
}

.nav-right {
	flex: 1;
	display: flex;
	justify-content: flex-end;
}

.time-icon {
	font-size: 32rpx;
	color: #666;
}

/* 章节标题 */
.chapter-header {
	padding: 40rpx 30rpx 20rpx;
	background: #f8f8f8;
}

.chapter-title {
	font-size: 42rpx;
	font-weight: bold;
	color: #333;
}

/* 经文内容 */
.bible-content {
	flex: 1;
	padding: 20rpx 30rpx;
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
	background: #f8f8f8;
	line-height: 1.8;
}

.verse-container {
	margin-bottom: 30rpx;
	display: flex;
	align-items: flex-start;
}

.verse-number {
	min-width: 60rpx;
	font-size: 24rpx;
	color: #999;
	font-weight: bold;
	margin-right: 20rpx;
	margin-top: 6rpx;
	text-align: center;
}

.verse-text {
	flex: 1;
	font-size: 32rpx;
	color: #333;
	line-height: 1.7;
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
</style>
