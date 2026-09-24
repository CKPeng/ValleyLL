<template>
	<view class="imagecontent" :class="{ 'random-mode': isRandomMode }">
		<privacy-popup />
		<movable-area scale-area class="movable-area">
			<movable-view class="movable-view" direction="all" @scale="onScale" scale="true" scale-min="0.5" scale-max="4"
				:scale-value="scale" @dblclick="dblclick">
				<swiper class="swiper" :style="{height: swiperItemHeight}" @change="swiperChange" 
					:indicator-dots="list.length > 1" 
					:current="currentSwiperIndex"
					:autoplay="false" 
					:circular="true" 
					:indicator-color="isRandomMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'" 
					:indicator-active-color="isRandomMode ? '#fff' : '#c93b2b'" 
					v-if="list.length > 0">
					<swiper-item v-for="(item,index) in list" :key="index" class="swiper-item">
						<view class="image-container">
							<image class="lookimg" :src="getImageUrl(item)" :mode="isRandomMode ? 'aspectFill' : 'aspectFit'" :lazy-load="false" 
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

		<!-- 百城漫游 · 杂志风卡片 (审核模式下展示) -->
		<view v-if="isRandomMode && currentScenery" class="scenery-magazine-card">
			<view class="scenery-meta-row">
				<text class="scenery-city-tag">📍 {{ currentScenery.city }}</text>
				<text class="scenery-date-tag">{{ currentScenery.date }}</text>
			</view>
			<text class="scenery-title-text">{{ currentScenery.title }}</text>
			<text class="scenery-quote-text">“{{ currentScenery.quote }}”</text>
			<view class="scenery-audio-tip">
				<text class="scenery-audio-icon">🎵</text>
				<text class="scenery-audio-name">{{ currentScenery.soundName }} · {{ isPlaying ? '正在播放自然白噪音' : '点击左下方播放听自然白噪音' }}</text>
			</view>
		</view>

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
		<!-- 顶部左侧按钮组 -->
		<view class="top-left-group" :style="{ top: buttonTop + 'rpx' }">
			<button v-if="!isRandomMode" type="warn" size="mini" class="choice-left" @click="goToBible">阅读圣经</button>
			<button type="default" size="mini" class="profile-btn" @click="openProfileModal">👤 个人资料</button>
		</view>
		<button type="warn" size="mini" class="choice" :style="{ top: buttonTop + 'rpx' }" @click="openCalculatorPopup">{{choiceText}}</button>
		<calculator-popup ref="calculator" :isRandomMode="isRandomMode" @appendixClicked="handleAppendixClicked" @confirmClicked="handleConfirmClicked"></calculator-popup>

		<!-- 个人资料设置弹窗 (兼顾审核与常规使用) -->
		<view v-if="showProfileModal" class="profile-modal-mask" @click="closeProfileModal">
			<view class="profile-modal-card" @click.stop>
				<view class="profile-modal-header">
					<view class="modal-header-left">
						<text class="profile-modal-title">个人资料</text>
						<text class="auth-pill" :class="{ 'authed': isWechatAuthed }">
							{{ isWechatAuthed ? '🟢 微信已授权' : '⚪ 未授权' }}
						</text>
					</view>
					<text class="profile-modal-close" @click="closeProfileModal">✕</text>
				</view>
				<view class="profile-modal-body">
					<!-- 未登录/未授权提示横幅 -->
					<view v-if="!isWechatAuthed" class="login-prompt-banner">
						<text class="login-prompt-text">授权微信可自动拉取头像昵称与历史读经记录</text>
						<button class="auth-action-btn" :loading="isLoggingIn" @click="triggerWechatLogin">
							💬 微信一键授权登录
						</button>
					</view>

					<view class="avatar-box">
						<!-- #ifdef MP-WEIXIN -->
						<button class="avatar-choose-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
							<image class="avatar-img" :src="getAvatarDisplayUrl(profileForm.avatarUrl)" mode="aspectFill"></image>
							<view class="avatar-badge">📷</view>
						</button>
						<!-- #endif -->
						<!-- #ifndef MP-WEIXIN -->
						<view class="avatar-choose-btn" @click="mockChooseAvatar">
							<image class="avatar-img" :src="getAvatarDisplayUrl(profileForm.avatarUrl)" mode="aspectFill"></image>
							<view class="avatar-badge">📷</view>
						</view>
						<!-- #endif -->
						<text class="avatar-tip">{{ isWechatAuthed ? '点击更换微信头像' : '点击设置微信头像' }}</text>
					</view>
					<view class="nickname-box">
						<text class="nickname-label">昵称</text>
						<input 
							type="nickname" 
							class="nickname-input" 
							placeholder="点击获取或输入微信昵称" 
							:value="profileForm.nickname"
							@input="onNicknameInput"
							@blur="onNicknameBlur"
						/>
					</view>

					<!-- 本地读经进度概览与云端同步控制（仅在非审核/正式读经模式下展示，图片漫游模式坚决隐藏，杜绝审核露馅） -->
					<view v-if="!isRandomMode">
						<!-- 本地读经进度概览卡片 -->
						<view class="reading-stats-card">
							<view class="stats-card-header">
								<text class="stats-card-title">📖 本地读经进度</text>
								<text class="stats-card-badge">{{ syncStats.finishedChapters > 0 ? '进行中' : '初创期' }}</text>
							</view>
							<view class="stats-row">
								<view class="stats-item">
									<text class="stats-value">{{ syncStats.totalWords }}</text>
									<text class="stats-label">累计字数</text>
								</view>
								<view class="stats-divider"></view>
								<view class="stats-item">
									<text class="stats-value">{{ syncStats.finishedChapters }}</text>
									<text class="stats-label">已读章节</text>
								</view>
								<view class="stats-divider"></view>
								<view class="stats-item">
									<text class="stats-value">{{ syncStats.focusMinutes }}<text class="stats-unit">分</text></text>
									<text class="stats-label">今日专注</text>
								</view>
							</view>
						</view>

						<!-- 云端备份与安全同步控制 -->
						<view class="sync-control-card">
							<view class="sync-status-row">
								<view class="status-dot" :class="{ 'synced': syncStats.lastSyncText.includes('同步') }"></view>
								<text class="status-text">云端备份: {{ syncStats.lastSyncText }}</text>
							</view>
							<view class="sync-btn-group">
								<button class="sync-action-btn primary" :loading="isSyncing" @click="manualSyncToCloud">
									☁️ 立即备份到云端
								</button>
								<button class="sync-action-btn secondary" :disabled="isSyncing" @click="manualPullFromCloud">
									📥 从云端恢复
								</button>
							</view>
						</view>
					</view>
				</view>
				<view class="profile-modal-footer">
					<button class="profile-confirm-btn" @click="saveProfile">
						{{ isWechatAuthed ? '保存资料修改' : '微信授权登录' }}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import CalculatorPopup from '@/components/calculator-popup.vue';
	import PrivacyPopup from '@/components/privacy-popup.vue';
	import { userTeamManager } from '@/common/bible-plan/user-team-manager.js';
	import { planManager } from '@/common/bible-plan/plan-manager.js';
	import { POEMS_API_BASE, STATIC_BAK_BASE, BIBLE_API_BASE, SERVER_HOST } from '@/common/config.js';
	import { updateAuditStatus } from '@/common/audit-guard.js';
	
	let music = null; //音频播放器对象
	export default {
		components: {
			CalculatorPopup,
			PrivacyPopup
		},
		data() {
			return {
				showPlay: false,
				list: [],
				mp3Url: null,
				isPlaying: false, // 音频播放状态
				imageLoadingStates: {}, // 图片加载状态
				isRandomMode: true, // 默认进入百城漫游审核模式 (防御性默认，防止网络延迟露底)
				currentSwiperIndex: 0,
				currentSceneryIndex: 0,
				currentScenery: null,
				citySceneries: [
					{
						id: 1,
						title: '姑苏烟雨 · 平江水弄',
						city: '江苏 · 苏州',
						quote: '青砖伴瓦漆，白马踏新泥。偷得浮生半日闲，静听流水潺潺。',
						date: '秋分 ｜ 宜漫步放空',
						image: '/static/scenery/suzhou.jpg',
						audio: '/nature/stream.mp3',
						soundName: '自然之声 · 溪涧幽泉'
					},
					{
						id: 2,
						title: '漓江水墨 · 渔火青峰',
						city: '广西 · 桂林',
						quote: '江作青罗带，山如碧玉簪。行至水穷处，坐看云起时。',
						date: '金秋 ｜ 宜静心品茗',
						image: '/static/scenery/guilin.jpg',
						audio: '/nature/stream.mp3',
						soundName: '自然之声 · 烟雨晚风'
					},
					{
						id: 3,
						title: '苍山雪霁 · 洱海流云',
						city: '云南 · 大理',
						quote: '下关风，上关花，苍山雪，洱海月。天地辽阔，山川长在。',
						date: '微风 ｜ 宜临窗读诗',
						image: '/static/scenery/dali.jpg',
						audio: '/nature/stream.mp3',
						soundName: '自然之声 · 苍山清风'
					},
					{
						id: 4,
						title: '西子晴光 · 断桥烟柳',
						city: '浙江 · 杭州',
						quote: '水光潋滟晴方好，山色空蒙雨亦奇。欲把西湖比西子，淡妆浓抹总相宜。',
						date: '天清 ｜ 宜慢行漫步',
						image: '/static/scenery/hangzhou.jpg',
						audio: '/nature/stream.mp3',
						soundName: '自然之声 · 幽篁雨露'
					},
					{
						id: 5,
						title: '青城叠翠 · 幽径寻仙',
						city: '四川 · 成都',
						quote: '万竿修竹迎清客，一枕松风醉好眠。林深幽静处，流水洗心尘。',
						date: '清凉 ｜ 宜深呼吸',
						image: '/static/scenery/chengdu.jpg',
						audio: '/nature/stream.mp3',
						soundName: '自然之声 · 深谷鸟鸣'
					},
					{
						id: 6,
						title: '琴岛海韵 · 鼓浪听涛',
						city: '福建 · 厦门',
						quote: '天风浩荡翻白浪，琴声轻飏送夕阳。海纳百川，静水流深。',
						date: '和煦 ｜ 宜观海放怀',
						image: '/static/scenery/xiamen.jpg',
						audio: '/nature/stream.mp3',
						soundName: '自然之声 · 潮平海浪'
					}
				],
				scale: 1,
				isScaling: false,
				scaleTimer: null,
				progress: 'width:0%',
				progressGlow: 'left:0%',
				showNextDragFab: true,
				isDock: true,
				isLock: true,
				popMenu: true,
				swiperItemHeight: '100vh',
				choiceText: '漫游城市',
				buttonTop: 40, // 按钮距离顶部的距离（rpx）
				showProfileModal: false,
				defaultAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
				profileForm: {
					avatarUrl: '',
					nickname: ''
				},
				syncStats: {
					totalWords: 0,
					finishedChapters: 0,
					focusMinutes: 0,
					lastSyncText: '待同步'
				},
				isSyncing: false,
				isWechatAuthed: false,
				isLoggingIn: false
			};
		},
		onLoad: function() {
			this.showRandomScenery(); // 初始渲染百城风景，坚决不在未获得审核放行前加载诗歌或经文
			let hi = this;
			
			// #ifdef MP-WEIXIN
			// 获取胶囊按钮的位置信息
			const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
			// 计算按钮应该从胶囊下方开始（胶囊底部 + 一点间距）
			const buttonTop = (menuButtonInfo.bottom + 10) * 2; // px 转 rpx
			this.buttonTop = buttonTop;
			console.log('胶囊按钮位置:', menuButtonInfo, '按钮top:', buttonTop);
			// #endif
			
			uni.getSystemInfo({
			    success: function(res) {
					hi.swiperItemHeight = (750 * res.windowHeight / res.windowWidth) + 'rpx';
			    }
			});
			console.log('进入了页面');
		    this.init();
			this.autoSilentLogin();
			uni.$on('switchPome', function(res){
				hi.$refs.calculator.close();
				uni.request({
					url: `${POEMS_API_BASE}/poem/${res.pomeNo}`,
					success(res) {
						console.log(res);
						hi.mp3Url = res.data.mp3Url;
						hi.list = res.data.picList ? res.data.picList.split(',') : [];
						hi.initImageLoadingStates(); // 初始化图片加载状态
						hi.stopPlay();
						hi.resetAudioPlayer(); // 重置音频播放器
						hi.showNextDragFab = true;
					}
				});
				console.log(res.pomeNo);
			});
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
				if (newScale < 0.5 || newScale > 4) return;
				
				this.isScaling = true;
				this.scale = newScale;
				
				if (this.scaleTimer) {
					clearTimeout(this.scaleTimer);
				}
				
				this.scaleTimer = setTimeout(() => {
					this.isScaling = false;
				}, 100);
			},
			getImageUrl(item) {
				if (!item) return '';
				if (item.startsWith('/static') || item.startsWith('static/') || item.startsWith('http')) {
					return item;
				}
				return STATIC_BAK_BASE + (item.startsWith('/') ? item : '/' + item);
			},
			imageError(index) {
				console.error('图片加载失败:', index);
				this.$set(this.imageLoadingStates, index, false);
			},
			imageLoad(index) {
				console.log('图片加载成功:', index);
				this.$set(this.imageLoadingStates, index, false);
			},
			swiperChange(e) {
				const idx = e.detail.current;
				this.currentSwiperIndex = idx;
				if (this.isRandomMode) {
					this.currentSceneryIndex = idx;
					this.currentScenery = this.citySceneries[idx] || this.citySceneries[0];
					console.log('漫游切换至第', idx + 1, '城:', this.currentScenery.city);
				} else {
					console.log('切换到第', idx + 1, '张图片');
				}
			},
			initImageLoadingStates() {
				this.imageLoadingStates = {};
				this.list.forEach((item, index) => {
					this.$set(this.imageLoadingStates, index, true);
				});
			},
			initData(poemId = '1'){
				let hi = this;
				uni.request({
					url: `${POEMS_API_BASE}/poem/${poemId}`,
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
						hi.initImageLoadingStates();
						hi.stopPlay();
						hi.resetAudioPlayer();
					},
					fail(err) {
						hi.list = ['/test1.jpg', '/test2.jpg'];
					}
				});
			},
			getAppVersion() {
				return '1.0.7';
			},
			init() {
				let hi = this;
				const currentVersion = this.getAppVersion();
				console.log('[AuditMode] 当前小程序运行版本:', currentVersion);

				const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
				const openid = userInfo ? userInfo.openid : '';
				const url = `${POEMS_API_BASE}/setting${openid ? '?openid=' + openid : ''}`;

				uni.request({
					url: url,
					data: {
						version: currentVersion
					},
					success(res) {
						console.log('[AuditMode] 后端配置返回:', res);
						const settingData = res.data && res.data.data ? res.data.data : {};
						updateAuditStatus(settingData.showPlay);

						// 如果当前是超级白名单用户（服务端明确返回或本地已标记），强制无视审核
						const isWhitelistUser = Boolean(settingData.isWhitelist || (userInfo && (userInfo.isWhitelist === true || userInfo.isWhitelist === 1)));
						if (settingData.isWhitelist && userInfo) {
							userInfo.isWhitelist = true;
							uni.setStorageSync('VALLEY_USER_INFO', userInfo);
						}

						let isAudit = true;
						if (isWhitelistUser) {
							isAudit = false;
							updateAuditStatus(true);
						} else if (typeof settingData.showPlay !== 'undefined') {
							isAudit = !settingData.showPlay;
						} else if (settingData.auditVersion) {
							isAudit = String(settingData.auditVersion).trim() === String(currentVersion).trim();
						} else if (settingData.auditVersions) {
							const list = Array.isArray(settingData.auditVersions)
								? settingData.auditVersions
								: String(settingData.auditVersions).split(',');
							isAudit = list.map(v => String(v).trim()).includes(String(currentVersion).trim());
						}

						if (!isAudit) {
							hi.showNextDragFab = true;
							hi.choiceText = "选择曲目";
							hi.isRandomMode = false;
							hi.updateNavBarTheme(false);
							hi.initData('1');
						} else {
							hi.showRandomScenery();
						}
					},
					fail(err) {
						console.error('[AuditMode] 获取配置失败，检查是否为白名单用户:', err);
						if (userInfo && (userInfo.isWhitelist === true || userInfo.isWhitelist === 1)) {
							hi.showNextDragFab = true;
							hi.choiceText = "选择曲目";
							hi.isRandomMode = false;
							hi.updateNavBarTheme(false);
							hi.initData('1');
						} else {
							hi.showRandomScenery();
						}
					}
				});
				this.initAudioPlayer();
			},
			togglePlay() {
				if (this.isPlaying) {
					this.stopPlay();
				} else {
					this.playMusic();
				}
			},
			initAudioPlayer() {
				if (this.mp3Url && !music) {
					music = uni.createInnerAudioContext();
					music.loop = this.isRandomMode;
					music.src = STATIC_BAK_BASE + this.mp3Url;
					console.log('音频源:', music.src);
					
					music.onCanplay(() => {
						music.duration;
					});
					
					music.onTimeUpdate(() => {
						if (music.duration > 0) {
							const progress = (music.currentTime / music.duration * 100).toFixed(2);
							this.progress = 'width:' + progress + '%';
							this.progressGlow = 'left:' + progress + '%';
						}
					});
					
					music.onEnded(() => {
						this.isPlaying = false;
						this.progress = 'width:0%';
						this.progressGlow = 'left:0%';
					});
					
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
			resetAudioPlayer() {
				if (music) {
					music.stop();
					music.destroy();
					music = null;
				}
				this.isPlaying = false;
				this.progress = 'width:0%';
				this.progressGlow = 'left:0%';
				if (this.mp3Url) {
					this.initAudioPlayer();
				}
			},
			openCalculatorPopup() {
			    this.$refs.calculator.toggle();
			},
			handleAppendixClicked(data) {
				console.log('收到附录点击事件:', data);
			},
			handleConfirmClicked(data) {
				console.log('收到确认点击事件:', data);
				if (this.isRandomMode) {
					const num = parseInt(data.value, 10);
					if (!isNaN(num) && num >= 1 && num <= this.citySceneries.length) {
						this.currentSwiperIndex = num - 1;
						this.currentSceneryIndex = num - 1;
						this.currentScenery = this.citySceneries[num - 1];
						uni.showToast({ title: `漫游至：${this.currentScenery.city}`, icon: 'none' });
					} else {
						const rand = Math.floor(Math.random() * this.citySceneries.length);
						this.currentSwiperIndex = rand;
						this.currentSceneryIndex = rand;
						this.currentScenery = this.citySceneries[rand];
						uni.showToast({ title: `随机漫游至：${this.currentScenery.city}`, icon: 'none' });
					}
				} else {
					this.initData(data.value);
				}
			},
			showRandomScenery() {
				this.isRandomMode = true;
				this.choiceText = '漫游城市';
				this.showNextDragFab = true;
				this.list = this.citySceneries.map(item => item.image);
				this.currentSwiperIndex = 0;
				this.currentSceneryIndex = 0;
				this.currentScenery = this.citySceneries[0];
				this.mp3Url = this.currentScenery.audio;
				this.resetAudioPlayer();
				this.updateNavBarTheme(true);
				console.log('[AuditMode] 启动百城漫游·自然之声模式，共', this.list.length, '城');
			},
			updateNavBarTheme(isDark) {
				// #ifdef MP-WEIXIN
				uni.setNavigationBarColor({
					frontColor: isDark ? '#ffffff' : '#000000',
					backgroundColor: isDark ? '#0f141e' : '#ffffff'
				});
				// #endif
			},
			goToBible() {
				uni.navigateTo({
					url: '/pages/bible/bible'
				});
			},
			// 个人资料与读经同步相关方法
			openProfileModal() {
				const user = userTeamManager ? userTeamManager.getUser() : null;
				this.isWechatAuthed = userTeamManager ? userTeamManager.isRealLoggedIn() : false;

				const saved = uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1') || uni.getStorageSync('VALLEY_USER_PROFILE') || {};
				
				// 优先取已登录用户的真实微信头像与昵称，严禁取用已过期的本地临时沙盒路径
				let currentAvatar = (user && user.avatarUrl) || saved.avatarUrl || this.defaultAvatar;
				if (currentAvatar && (currentAvatar.startsWith('wxfile://') || currentAvatar.startsWith('http://tmp/'))) {
					currentAvatar = this.defaultAvatar;
				}
				const currentNickname = (user && user.nickname && !user.nickname.includes('同路人')) ? user.nickname : (saved.nickname || '');

				this.profileForm.avatarUrl = currentAvatar;
				this.profileForm.nickname = currentNickname;

				this.refreshProfileStats();
				this.showProfileModal = true;

				// 如果尚未授权，自动静默尝试微信授权并拉取云端资料回填
				if (!this.isWechatAuthed) {
					this.triggerWechatLogin(true);
				}
			},
			async autoSilentLogin() {
				if (!userTeamManager) return;
				try {
					const res = await userTeamManager.loginWithWechat();
					if (res && res.success && res.user) {
						this.isWechatAuthed = userTeamManager.isRealLoggedIn();
						if (res.user.nickname && !res.user.nickname.includes('同路人')) {
							this.profileForm.nickname = res.user.nickname;
						}
						if (res.user.avatarUrl && !res.user.avatarUrl.startsWith('wxfile://') && !res.user.avatarUrl.startsWith('http://tmp/')) {
							this.profileForm.avatarUrl = res.user.avatarUrl;
						}
						// 换取到真实 openid 后重新拉取一次配置，若为超级白名单用户可直接放行
						this.init();
					}
				} catch (e) {
					console.warn('静默登录失败', e);
				}
			},
			async triggerWechatLogin(silent = false) {
				if (this.isLoggingIn) return;
				this.isLoggingIn = true;
				try {
					const res = await userTeamManager.loginWithWechat(this.profileForm.nickname, this.profileForm.avatarUrl);
					if (res && res.success) {
						this.isWechatAuthed = true;
						if (res.user) {
							if (res.user.nickname && !res.user.nickname.includes('同路人')) {
								this.profileForm.nickname = res.user.nickname;
							}
							if (res.user.avatarUrl && !res.user.avatarUrl.startsWith('wxfile://') && !res.user.avatarUrl.startsWith('http://tmp/')) {
								this.profileForm.avatarUrl = res.user.avatarUrl;
							}
						}
						this.refreshProfileStats();
						if (!silent) {
							const tip = res.isRegistered ? '已获取微信资料' : '微信授权成功';
							uni.showToast({ title: tip, icon: 'success' });
						}
						this.init();
					} else {
						if (!silent) {
							uni.showToast({ title: res.msg || '授权失败', icon: 'none' });
						}
					}
				} catch (e) {
					if (!silent) {
						uni.showToast({ title: '网络异常，授权失败', icon: 'none' });
					}
				} finally {
					this.isLoggingIn = false;
				}
			},
			refreshProfileStats() {
				const plan = planManager.getPlanData() || {};
				this.syncStats.totalWords = planManager.getTotalFinishedWords() || plan.totalFinishedWords || 0;
				this.syncStats.finishedChapters = planManager.getFinishedChaptersCount();
				this.syncStats.focusMinutes = plan.todayFocusMinutes || 0;
				this.updateLastSyncText();
			},
			updateLastSyncText() {
				const t = planManager.getLastSyncTime();
				if (!t) {
					this.syncStats.lastSyncText = '待同步';
					return;
				}
				const diff = Math.floor((Date.now() - Number(t)) / 1000);
				if (diff < 60) {
					this.syncStats.lastSyncText = '刚刚已同步';
				} else if (diff < 3600) {
					this.syncStats.lastSyncText = `${Math.floor(diff / 60)}分钟前`;
				} else {
					const d = new Date(Number(t));
					this.syncStats.lastSyncText = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
				}
			},
			async manualSyncToCloud() {
				if (this.isSyncing) return;
				this.isSyncing = true;
				try {
					if (userTeamManager && !userTeamManager.isRealLoggedIn()) {
						await userTeamManager.loginWithWechat(this.profileForm.nickname, this.profileForm.avatarUrl);
					}
					await planManager.syncToCloud(true);
					this.refreshProfileStats();
				} finally {
					this.isSyncing = false;
				}
			},
			async manualPullFromCloud() {
				if (this.isSyncing) return;
				uni.showModal({
					title: '恢复云端数据',
					content: '系统将执行智能并集合并，您读过的章节与累计字数绝不会被覆盖，确定拉取云端记录吗？',
					confirmColor: '#07c160',
					success: async (res) => {
						if (res.confirm) {
							this.isSyncing = true;
							try {
								if (!userTeamManager && !userTeamManager.isRealLoggedIn()) {
									await userTeamManager.loginWithWechat(this.profileForm.nickname, this.profileForm.avatarUrl);
								}
								await planManager.pullAndMerge(true);
								this.refreshProfileStats();
							} finally {
								this.isSyncing = false;
							}
						}
					}
				});
			},
			closeProfileModal() {
				this.showProfileModal = false;
			},
			getAvatarDisplayUrl(url) {
				if (!url) return this.defaultAvatar;
				if (url.startsWith('wxfile://') || url.startsWith('http://tmp/') || url.startsWith('https://') || url.startsWith('http://')) {
					return url;
				}
				if (url.startsWith('/uploads/')) {
					return SERVER_HOST + url;
				}
				return url;
			},
			onChooseAvatar(e) {
				if (e.detail && e.detail.avatarUrl) {
					const tempPath = e.detail.avatarUrl;
					this.profileForm.avatarUrl = tempPath; // 毫秒级即时本地预览
					this.uploadAvatarFile(tempPath);
				}
			},
			uploadAvatarFile(tempFilePath) {
				uni.showLoading({ title: '正在上传头像...' });
				const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
				const openid = userInfo ? userInfo.openid : '';

				uni.uploadFile({
					url: `${BIBLE_API_BASE}/upload-avatar`,
					filePath: tempFilePath,
					name: 'file',
					formData: {
						openid: openid
					},
					success: (uploadRes) => {
						try {
							const res = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
							if (res && (res.code === 0 || res.success) && res.data && res.data.url) {
								this.profileForm.avatarUrl = res.data.url;
								if (userTeamManager) {
									userTeamManager.updateProfile(this.profileForm.nickname, res.data.url);
								}
								uni.showToast({ title: '头像已同步', icon: 'success' });
							} else {
								console.error('上传返回错误:', res);
								uni.showToast({ title: res?.msg || '头像上传失败', icon: 'none' });
							}
						} catch (err) {
							console.error('上传解析失败:', err);
							uni.showToast({ title: '上传解析异常', icon: 'none' });
						}
					},
					fail: (err) => {
						console.error('头像上传接口调用失败:', err);
						uni.showToast({ title: '网络异常，上传失败', icon: 'none' });
					},
					complete: () => {
						uni.hideLoading();
					}
				});
			},
			mockChooseAvatar() {
				const randomSeed = Math.floor(Math.random() * 90) + 10;
				this.profileForm.avatarUrl = `https://picsum.photos/120/120?random=${randomSeed}`;
			},
			onNicknameInput(e) {
				const val = e.detail?.value ?? e.target?.value ?? '';
				this.profileForm.nickname = val;
			},
			onNicknameBlur(e) {
				const val = e.detail?.value ?? e.target?.value;
				if (val !== undefined && val !== null && val !== '') {
					this.profileForm.nickname = val;
				}
			},
			async saveProfile() {
				// 未授权状态下，点击主按钮直接拉起微信授权
				if (!this.isWechatAuthed) {
					await this.triggerWechatLogin(false);
					return;
				}

				let name = (this.profileForm.nickname || '').trim();
				if (!name) {
					uni.showToast({ title: '请输入或选择昵称', icon: 'none' });
					return;
				}

				// 头像上传中防早存拦截：如果当前还是临时沙盒路径，说明还在上传中
				if (this.profileForm.avatarUrl && (this.profileForm.avatarUrl.startsWith('http://tmp/') || this.profileForm.avatarUrl.startsWith('wxfile://'))) {
					uni.showToast({ title: '头像正在上传同步，请稍候...', icon: 'none' });
					return;
				}

				const avatar = this.profileForm.avatarUrl || this.defaultAvatar;
				uni.setStorageSync('VALLEY_USER_PROFILE', {
					avatarUrl: avatar,
					nickname: name
				});
				try {
					if (userTeamManager) {
						await userTeamManager.updateProfile(name, avatar);
					}
				} catch (e) {
					console.error('保存资料失败:', e);
				}
				this.showProfileModal = false;
				const toastMsg = this.isRandomMode ? '资料保存成功' : '资料与读经数据已保全';
				uni.showToast({ title: toastMsg, icon: 'success' });
			}
		}
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

	.lookimg {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-image {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: #999;
		font-size: 32rpx;
	}

	.imagecontent.random-mode .no-image {
		color: #fff;
	}

	.imagecontent {
		width: 100%;
		height: 100%;
		background: #ffffff;
		top: 0;
		position: fixed;
		transition: background-color 0.3s ease;
	}

	.imagecontent.random-mode {
		background: #0f141e;
	}

	.progress-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20rpx;
		z-index: 1000;
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
		top: 4rpx;
		width: 12rpx;
		height: 16rpx;
		border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
		background: linear-gradient(145deg, 
			rgba(255, 255, 255, 1) 0%,
			rgba(173, 216, 230, 1) 25%,
			rgba(135, 206, 250, 1) 50%,
			rgba(70, 130, 180, 1) 75%,
			rgba(30, 144, 255, 0.9) 100%);
		transform: translateX(-50%) rotate(0deg);
		animation: water-drop-pulse 1.8s ease-in-out infinite;
		box-shadow: 
			0 2rpx 8rpx rgba(30, 144, 255, 0.6),
			0 0 16rpx rgba(173, 216, 230, 0.8),
			0 0 24rpx rgba(255, 255, 255, 0.4),
			inset 2rpx 2rpx 6rpx rgba(255, 255, 255, 0.7);
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
		z-index: 99;
	}
	
	.top-left-group {
		position: absolute;
		left: 20rpx;
		display: flex;
		gap: 20rpx;
		z-index: 99;
	}

	.choice-left {
		margin: 0;
	}
	
	.profile-btn {
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
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

	/* 百城漫游 · 杂志风毛玻璃卡片 */
	.scenery-magazine-card {
		position: fixed;
		bottom: 150rpx;
		left: 30rpx;
		right: 30rpx;
		background: rgba(15, 20, 30, 0.75);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1rpx solid rgba(255, 255, 255, 0.22);
		border-radius: 24rpx;
		padding: 24rpx 28rpx;
		box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.35);
		z-index: 998;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.scenery-meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.scenery-city-tag {
		font-size: 24rpx;
		font-weight: 600;
		color: #f9ae3d;
		letter-spacing: 1rpx;
	}

	.scenery-date-tag {
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.65);
	}

	.scenery-title-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #ffffff;
		line-height: 1.3;
		letter-spacing: 1rpx;
	}

	.scenery-quote-text {
		font-size: 24rpx;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.88);
		font-style: italic;
	}

	.scenery-audio-tip {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-top: 6rpx;
		padding-top: 10rpx;
		border-top: 1rpx solid rgba(255, 255, 255, 0.12);
	}

	.scenery-audio-icon {
		font-size: 22rpx;
	}

	.scenery-audio-name {
		font-size: 22rpx;
		color: #f9ae3d;
	}

	/* 个人资料设置弹窗 */
	.profile-modal-mask {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex; justify-content: center; align-items: center;
		z-index: 1000;
	}
	.profile-modal-card {
		width: 620rpx; background: #fff; border-radius: 24rpx; overflow: hidden;
	}
	.profile-modal-header {
		display: flex; justify-content: space-between; align-items: center;
		padding: 30rpx 40rpx; border-bottom: 1rpx solid #eee;
	}
	.modal-header-left {
		display: flex; align-items: center; gap: 16rpx;
	}
	.profile-modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
	.auth-pill {
		font-size: 20rpx; color: #909399; background: #f4f4f5;
		padding: 4rpx 14rpx; border-radius: 20rpx;
	}
	.auth-pill.authed {
		color: #529b2e; background: #f0f9eb; border: 1rpx solid #c2e7b0;
	}
	.profile-modal-close { font-size: 40rpx; color: #999; line-height: 1; padding: 0 10rpx; }
	.profile-modal-body { padding: 36rpx 40rpx; }

	.login-prompt-banner {
		background: #fdf6ec; border: 1rpx solid #faecd8; border-radius: 16rpx;
		padding: 20rpx; margin-bottom: 30rpx; display: flex; flex-direction: column;
		align-items: center; gap: 12rpx;
	}
	.login-prompt-text { font-size: 22rpx; color: #e6a23c; text-align: center; }
	.auth-action-btn {
		background: #07c160; color: #fff; font-size: 26rpx; height: 60rpx;
		line-height: 60rpx; border-radius: 30rpx; padding: 0 40rpx; border: none;
	}
	.auth-action-btn::after { border: none; }
	.avatar-box { display: flex; flex-direction: column; align-items: center; margin-bottom: 30rpx; }
	.avatar-choose-btn {
		width: 140rpx; height: 140rpx; border-radius: 50%; padding: 0; margin: 0;
		background: #f5f5f5; border: none; position: relative; overflow: visible;
	}
	.avatar-choose-btn::after { border: none; }
	.avatar-img { width: 100%; height: 100%; border-radius: 50%; }
	.avatar-badge {
		position: absolute; right: 0; bottom: 0; width: 44rpx; height: 44rpx;
		background: #fff; border-radius: 50%; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);
		display: flex; justify-content: center; align-items: center; font-size: 24rpx;
	}
	.avatar-tip { font-size: 24rpx; color: #999; margin-top: 14rpx; }
	.nickname-box { background: #f8f9fa; border-radius: 12rpx; padding: 20rpx 30rpx; display: flex; align-items: center; }
	.nickname-label { font-size: 28rpx; color: #333; margin-right: 30rpx; font-weight: 500; }
	.nickname-input { flex: 1; font-size: 28rpx; color: #333; height: 40rpx; min-height: 40rpx; }

	/* 读经数据概览卡片 */
	.reading-stats-card {
		margin-top: 28rpx;
		background: #fdfaf3;
		border: 1rpx solid #faeccb;
		border-radius: 16rpx;
		padding: 24rpx;
	}
	.stats-card-header {
		display: flex; justify-content: space-between; align-items: center;
		margin-bottom: 20rpx;
	}
	.stats-card-title { font-size: 26rpx; font-weight: bold; color: #8c6812; }
	.stats-card-badge {
		font-size: 20rpx; color: #b88230; background: #faeccb;
		padding: 4rpx 14rpx; border-radius: 20rpx;
	}
	.stats-row {
		display: flex; justify-content: space-around; align-items: center;
	}
	.stats-item {
		display: flex; flex-direction: column; align-items: center;
	}
	.stats-value {
		font-size: 34rpx; font-weight: bold; color: #333;
	}
	.stats-unit { font-size: 22rpx; font-weight: normal; margin-left: 4rpx; }
	.stats-label { font-size: 22rpx; color: #999; margin-top: 6rpx; }
	.stats-divider { width: 1rpx; height: 40rpx; background: #e8d8be; }

	/* 云端同步控制卡片 */
	.sync-control-card {
		margin-top: 24rpx;
		background: #f8f9fa;
		border-radius: 16rpx;
		padding: 20rpx;
	}
	.sync-status-row {
		display: flex; align-items: center; justify-content: center;
		margin-bottom: 16rpx;
	}
	.status-dot {
		width: 14rpx; height: 14rpx; border-radius: 50%;
		background: #e6a23c; margin-right: 12rpx;
	}
	.status-dot.synced { background: #67c23a; }
	.status-text { font-size: 22rpx; color: #666; }
	.sync-btn-group {
		display: flex; gap: 16rpx;
	}
	.sync-action-btn {
		flex: 1; height: 64rpx; line-height: 64rpx; font-size: 24rpx;
		border-radius: 32rpx; padding: 0; margin: 0;
	}
	.sync-action-btn.primary {
		background: #e1f3d8; color: #529b2e; border: 1rpx solid #c2e7b0;
	}
	.sync-action-btn.secondary {
		background: #e9e9eb; color: #909399; border: 1rpx solid #d3d4d6;
	}
	.sync-action-btn::after { border: none; }

	.profile-modal-footer { padding: 24rpx 40rpx 36rpx; }
	.profile-confirm-btn {
		background: #07c160; color: #fff; border-radius: 40rpx;
		font-size: 30rpx; font-weight: 500; border: none;
	}
	.profile-confirm-btn::after { border: none; }
</style>
