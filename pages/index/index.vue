<template>
	<view class="imagecontent">
		<movable-area scale-area class="movable-area">
			<movable-view class="movable-view" direction="all" @scale="onScale" scale="true" scale-min="0.5" scale-max="4"
				:scale-value="scale" @dblclick="dblclick">
				<swiper class="swiper" :style="{height: swiperItemHeight}" @change="swiperChange" 
					:indicator-dots="list.length > 1" 
					:autoplay="false" 
					:circular="true" 
					:indicator-color="'rgba(255,255,255,0.4)'" 
					:indicator-active-color="'#fff'" 
					v-if="list.length > 0">
					<swiper-item v-for="(item,index) in list" :key="index" class="swiper-item">
						<view class="image-container">
							<!-- 加载动画 -->
							<view v-if="imageLoadingStates[index]" class="loading-overlay">
								<view class="loading-spinner"></view>
								<text class="loading-text">加载中...</text>
							</view>
							<image class="lookimg" :src="getImageUrl(item)" mode="aspectFit" :lazy-load="true" 
								@error="imageError(index)" @load="imageLoad(index)">
							</image>
						</view>
					</swiper-item>
				</swiper>
				<view v-else class="no-image">
					<text>暂无图片</text>
				</view>
			</movable-view>
		</movable-area>
		<!-- 播放控制按钮 -->
		<view v-if="showNextDragFab && mp3Url" class="play-button" @click="togglePlay">
			<image v-if="!isPlaying" src="/static/played.png" class="play-icon"></image>
			<image v-else src="/static/stop.png" class="play-icon"></image>
			<text class="play-text">{{ isPlaying ? '暂停' : '播放' }}</text>
		</view>
		<!-- 播放进度条 -->
		<view class="progress-container">
			<view class="progress" active='true' :style="progress"></view>
			<view v-if="isPlaying" class="progress-glow" :style="progressGlow"></view>
		</view>
		<button v-if="!isRandomMode" type="warn" size="mini" class="choice-left" :style="{ top: buttonTop + 'rpx' }" @click="goToBible">阅读圣经</button>
		<button type="warn" size="mini" class="choice" :style="{ top: buttonTop + 'rpx' }" @click="openCalculatorPopup">{{choiceText}}</button>
		<calculator-popup ref="calculator" :isRandomMode="isRandomMode" @appendixClicked="handleAppendixClicked" @confirmClicked="handleConfirmClicked"></calculator-popup>
	</view>
</template>

<script>
	import CalculatorPopup from '@/components/calculator-popup.vue';
	
	let music = null; //音频播放器对象
	export default {
		components: {
			CalculatorPopup
		},
		data() {
			return {
				showPlay: false,
				list: [],
				mp3Url: null,
				isPlaying: false, // 音频播放状态
				imageLoadingStates: {}, // 图片加载状态
				isRandomMode: false, // 是否为随机风景图模式
				sceneryImages: [ // 百城风景图片库
					'https://picsum.photos/800/600?random=1',
					'https://picsum.photos/800/600?random=2',
					'https://picsum.photos/800/600?random=3',
					'https://picsum.photos/800/600?random=4',
					'https://picsum.photos/800/600?random=5',
					'https://picsum.photos/800/600?random=6',
					'https://picsum.photos/800/600?random=7',
					'https://picsum.photos/800/600?random=8',
					'https://picsum.photos/800/600?random=9',
					'https://picsum.photos/800/600?random=10',
					'https://picsum.photos/800/600?random=11',
					'https://picsum.photos/800/600?random=12',
					'https://picsum.photos/800/600?random=13',
					'https://picsum.photos/800/600?random=14',
					'https://picsum.photos/800/600?random=15',
					'https://picsum.photos/800/600?random=16',
					'https://picsum.photos/800/600?random=17',
					'https://picsum.photos/800/600?random=18',
					'https://picsum.photos/800/600?random=19',
					'https://picsum.photos/800/600?random=20'
				],
				scale: 1,
				isScaling: false,
				scaleTimer: null,
				progress: 'width:0%',
				progressGlow: 'left:0%',
				showNextDragFab: false,
				isDock: true,
				isLock: true,
				popMenu: true,
				swiperItemHeight: '100vh',
				choiceText: '查看美图',
				options: {
					effect: 'fade',
					fadeEffect: {
						crossFade: true
					}//,
					// navigation: {
					// 	nextEl: true,
					// 	prevEl: true
					// }
				},
				pattern: {
					color: '#3c3e49',
					backgroundColor: '#fff',
					selectedColor: '#f9ae3d',
					buttonColor: '#f9ae3d',
					iconColor: '#fff'
				},
				content: [{
						text: '播放',
						active: false,
						iconPath: '/static/played.png',
						selectedIconPath: '/static/stop.png'
					}
				],
				horizontal: 'left',
				vertical: 'bottom',
				direction: 'vertical',
				defpositon: 'rb',
				buttonTop: 40 // 按钮距离顶部的距离（rpx）
			};
		},
		onLoad: function() {
			this.initData()
			let hi = this
			
			// #ifdef MP-WEIXIN
			// 获取胶囊按钮的位置信息
			const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
			// 计算按钮应该从胶囊下方开始（胶囊底部 + 一点间距）
			const buttonTop = (menuButtonInfo.bottom + 10) * 2; // px 转 rpx
			this.buttonTop = buttonTop;
			console.log('胶囊按钮位置:', menuButtonInfo, '按钮top:', buttonTop);
			// #endif
			
			uni.getSystemInfo({
			    success:function(res) {
					hi.swiperItemHeight = (750*res.windowHeight/res.windowWidth)+'rpx'
			    }
			})
			console.log('进入了页面')
		    this.init()
			uni.$on('switchPome',function(res){
				hi.$refs.calculator.close();
				uni.request({
					url:'https://ai.ckpeng.site:6688/api/renren-api/api/poems/poem/'+res.pomeNo,
					success(res) {
						console.log(res)
						hi.mp3Url = res.data.mp3Url
						hi.list = res.data.picList ? res.data.picList.split(',') : []
						hi.initImageLoadingStates() // 初始化图片加载状态
						hi.init()
						hi.stopPlay()
						hi.resetAudioPlayer() // 重置音频播放器
						hi.content[0].active = false
						hi.content[0].text = '播放'
					}
				})
				console.log(res.pomeNo)
			})
		  },
		onUnload() {
			// 清理定时器，防止内存泄漏
			if (this.scaleTimer) {
				clearTimeout(this.scaleTimer);
				this.scaleTimer = null;
			}
			// 清理音频资源
			if (music) {
				music.stop();
				music.destroy();
				music = null;
			}
		},
		methods: {
			dblclick() {
				if (this.scale == 10) {
					this.scale = 1;
				} else {
					this.scale = 10;
				}
			},
			onScale(e) {
				// 防止反馈循环，添加防抖逻辑
				if (this.isScaling) return;
				
				const newScale = e.detail.scale;
				// 限制缩放范围
				if (newScale < 0.5 || newScale > 4) return;
				
				this.isScaling = true;
				this.scale = newScale;
				
				// 清除之前的定时器
				if (this.scaleTimer) {
					clearTimeout(this.scaleTimer);
				}
				
				// 设置防抖定时器
				this.scaleTimer = setTimeout(() => {
					this.isScaling = false;
				}, 100);
			},
			getImageUrl(item) {
				// 处理图片URL，确保路径正确
				if (!item) return '';
				// 如果item已经是完整URL，直接返回
				if (item.startsWith('http')) {
					return item;
				}
				// 否则拼接基础URL
				return 'https://ai.ckpeng.site:6688/bak' + (item.startsWith('/') ? item : '/' + item);
			},
			imageError(index) {
				console.error('图片加载失败:', index);
				// 图片加载失败时也要隐藏加载动画
				this.$set(this.imageLoadingStates, index, false);
			},
			imageLoad(index) {
				console.log('图片加载成功:', index);
				// 图片加载成功时隐藏加载动画
				this.$set(this.imageLoadingStates, index, false);
			},
			swiperChange(e) {
				console.log('切换到第', e.detail.current + 1, '张图片');
			},
			// 初始化图片加载状态
			initImageLoadingStates() {
				this.imageLoadingStates = {};
				this.list.forEach((item, index) => {
					this.$set(this.imageLoadingStates, index, true);
				});
			},
			initData(poemId = '1'){
				let hi = this
				uni.request({
					url:'https://ai.ckpeng.site:6688/api/renren-api/api/poems/poem/' + poemId,
					success(res) {
						if (res.data && res.data.data) {
							hi.mp3Url = res.data.data.mp3Url;
							if (res.data.data.picList) {
								hi.list = typeof res.data.data.picList === 'string' 
									? res.data.data.picList.split(',').filter(item => item.trim()) 
									: Array.isArray(res.data.data.picList) 
									? res.data.data.picList 
									: [];
							} else {
								hi.list = [];
							}
						} else {
							hi.list = [];
						}
						hi.initImageLoadingStates(); // 初始化图片加载状态
						hi.init();
						hi.stopPlay();
						hi.resetAudioPlayer(); // 重置音频播放器
						hi.content[0].active = false;
						hi.content[0].text = '播放';
					},
					fail(err) {
						// 添加一些测试数据以便调试
						hi.list = ['/test1.jpg', '/test2.jpg'];
					}
				})
			},
			init() {
				let hi = this
				uni.request({
					// url:'http://192.168.2.250:8086/poems/getSetting',
				  	url:'https://ai.ckpeng.site:6688/api/renren-api/api/poems/setting',
				  	success(res) {
						console.log(res)
						if(res.data.data.showPlay){
							hi.showNextDragFab = res.data.data.showPlay
							hi.choiceText = "选择曲目"
							hi.isRandomMode = false
						}else{
							hi.showNextDragFab = res.data.data.showPlay
							hi.choiceText = "百城风景"
							hi.isRandomMode = true
							// 初始显示一张随机风景图
							hi.showRandomScenery()
						}
						
				  	}
				  })
				// 初始化音频播放器
				this.initAudioPlayer();
			  },
			// 切换播放状态
			togglePlay() {
				if (this.isPlaying) {
					this.stopPlay();
				} else {
					this.playMusic();
				}
			},
			trigger(e) {
				console.log(e.item.active)
				if (e.index == 0 && !e.item.active) {
					console.log("playMusic")
					this.playMusic()
					this.content[0].active = true
					this.content[0].text = '暂停'
				}
				if (e.index == 0 && e.item.active) {
					console.log("stopPlay")
					this.stopPlay()
					this.content[0].active = false
					this.content[0].text = '播放'
				}
			},
			// 初始化音频播放器
			initAudioPlayer() {
				if (this.mp3Url && !music) {
					music = uni.createInnerAudioContext();
					music.src = "https://ai.ckpeng.site:6688/bak" + this.mp3Url;
					console.log('音频源:', music.src);
					
					// 音频可以播放时的回调
					music.onCanplay(() => {
						console.log('音频可以播放了', music);
						music.duration; // 必须写，不然获取不到duration
					});
					
					// 进度条变化
					music.onTimeUpdate(() => {
						if (music.duration > 0) {
							const progress = (music.currentTime / music.duration * 100).toFixed(2);
							this.progress = 'width:' + progress + '%';
							this.progressGlow = 'left:' + progress + '%';
							console.log('播放进度:', progress + '%');
						}
					});
					
					// 播放结束回调
					music.onEnded(() => {
						console.log('音频播放结束');
						this.isPlaying = false;
						this.content[0].active = false;
						this.content[0].text = '播放';
						this.progress = 'width:0%';
						this.progressGlow = 'left:0%';
					});
					
					// 播放错误回调
					music.onError((err) => {
						console.error('音频播放错误:', err);
						uni.showToast({
							title: '音频播放失败',
							icon: 'none'
						});
					});
				}
			},
			playMusic() {
				if (!music && this.mp3Url) {
					this.initAudioPlayer();
				}
				
				if (music) {
					music.play();
					this.isPlaying = true;
					console.log('开始播放音频');
				} else {
					uni.showToast({
						title: '音频未准备好',
						icon: 'none'
					});
				}
			},
			stopPlay() {
				if (music) {
					music.pause();
					this.isPlaying = false;
					this.progress = 'width:0%';
					this.progressGlow = 'left:0%';
				}
			},
			// 重置音频播放器
			resetAudioPlayer() {
				if (music) {
					music.stop();
					music.destroy();
					music = null;
				}
				this.isPlaying = false;
				this.progress = 'width:0%';
				this.progressGlow = 'left:0%';
				// 如果有新的mp3Url，重新初始化
				if (this.mp3Url) {
					this.initAudioPlayer();
				}
			},
			// 切换计算器弹窗显示状态
			openCalculatorPopup() {
			    this.$refs.calculator.toggle();
			},
			// 处理附录按钮点击事件
			handleAppendixClicked(data) {
				console.log('收到附录点击事件:', data);
				// 这里可以添加具体的附录功能
				// 例如切换到某个特定的诗词或执行其他操作
			},
			// 处理确认按钮点击事件
			handleConfirmClicked(data) {
				console.log('收到确认点击事件:', data);
				if (this.isRandomMode) {
					// 随机风景图模式：无论输入什么都显示随机风景图
					this.showRandomScenery();
				} else {
					// 诗歌模式：根据输入数据调用initData方法
					this.initData(data.value);
				}
			},
			// 显示随机风景图
			showRandomScenery() {
				// 随机选择3-5张风景图，让用户可以左右滑动浏览
				const imageCount = Math.floor(Math.random() * 3) + 3; // 3-5张图片
				const shuffledImages = [...this.sceneryImages].sort(() => Math.random() - 0.5);
				
				// 设置图片列表为随机选择的多张图片
				this.list = shuffledImages.slice(0, imageCount);
				this.initImageLoadingStates(); // 初始化图片加载状态
				
				console.log(`显示${imageCount}张随机风景图:`, this.list);
			},
			// 跳转到圣经页面
			goToBible() {
				uni.navigateTo({
					url: '/pages/bible/bible'
				});
			}
		},
	};
</script>

<style>
	.movable-view {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		text-align: center;
	}

	.movable-area {
		height: 100vh;
		width: 100vw;
		position: fixed;
		top: 0;
		left: 0;
		overflow: hidden;
	}

	.swiper {
		width: 100%;
		height: 100%;
	}

	.swiper-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	
	.image-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(245, 245, 220, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}
	
	.loading-spinner {
		width: 60rpx;
		height: 60rpx;
		border: 6rpx solid rgba(46, 37, 218, 0.2);
		border-top: 6rpx solid rgba(46, 37, 218, 1);
		border-radius: 50%;
		animation: loading-spin 1s linear infinite;
		margin-bottom: 20rpx;
	}
	
	.loading-text {
		color: rgba(46, 37, 218, 1);
		font-size: 28rpx;
		font-weight: 500;
	}
	
	@keyframes loading-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.lookimg {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.no-image {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: #fff;
		font-size: 32rpx;
	}

	.imagecontent {
		width: 100%;
		height: 100%;
		background: #f5f5dc;
		top: 0;
		position: fixed;
	}

	.progress-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20rpx; /* 增加高度以容纳闪光点 */
		z-index: 1000; /* 确保在最上层显示 */
	}
	
	.progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 4rpx;
		width: 2rpx;
		background: #2e25da;
		transition: width 0.1s ease;
	}
	
	.progress-glow {
		position: absolute;
		top: 4rpx; /* 往下移动，避免被遮挡 */
		width: 12rpx;
		height: 16rpx;
		/* 水滴形状：圆形底部 + 尖锐顶部 */
		border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
		background: linear-gradient(145deg, 
			rgba(255, 255, 255, 1) 0%,      /* 纯白色高光 */
			rgba(173, 216, 230, 1) 25%,     /* 浅蓝色 */
			rgba(135, 206, 250, 1) 50%,     /* 天蓝色 */
			rgba(70, 130, 180, 1) 75%,      /* 钢蓝色 */
			rgba(30, 144, 255, 0.9) 100%);  /* 道奇蓝边缘 */
		transform: translateX(-50%) rotate(0deg);
		animation: water-drop-pulse 1.8s ease-in-out infinite;
		box-shadow: 
			0 2rpx 8rpx rgba(30, 144, 255, 0.6),      /* 蓝色外阴影 */
			0 0 16rpx rgba(173, 216, 230, 0.8),       /* 浅蓝色光晕 */
			0 0 24rpx rgba(255, 255, 255, 0.4),       /* 白色外发光 */
			inset 2rpx 2rpx 6rpx rgba(255, 255, 255, 0.7); /* 内白色高光 */
		transition: left 0.1s ease;
	}
	
	@keyframes water-drop-pulse {
		0% {
			opacity: 0.9;
			transform: translateX(-50%) scale(1) rotate(0deg);
		}
		25% {
			opacity: 1;
			transform: translateX(-50%) scale(1.1) rotate(-2deg);
		}
		50% {
			opacity: 0.95;
			transform: translateX(-50%) scale(1.15) rotate(0deg);
		}
		75% {
			opacity: 1;
			transform: translateX(-50%) scale(1.1) rotate(2deg);
		}
		100% {
			opacity: 0.9;
			transform: translateX(-50%) scale(1) rotate(0deg);
		}
	}
	.choice {
		position: absolute;
		top: 40rpx;
		right: 20rpx;
	}
	
	.choice-left {
		position: absolute;
		top: 40rpx;
		left: 20rpx;
	}
	
	.play-button {
		position: fixed;
		bottom: 100rpx;
		left: 30rpx;
		width: 120rpx;
		height: 120rpx;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 60rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 999;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
	}
	
	.play-icon {
		width: 40rpx;
		height: 40rpx;
		margin-bottom: 8rpx;
	}
	
	.play-text {
		color: white;
		font-size: 20rpx;
		text-align: center;
	}
</style>