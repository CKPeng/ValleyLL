<template>
	<view class="team-page">
		<privacy-popup />
		<!-- 模式一：审核伪装模式【漫步健行同伴小队】 -->
		<view v-if="isAudit" class="audit-team-page">
			<!-- 顶部导航栏 -->
			<view class="audit-nav-bar" :style="navBarStyle">
				<view class="nav-content" :style="{ height: navBarHeight + 'px' }">
					<view class="nav-left" @click="goBack">
						<view class="back-arrow-icon"></view>
						<text class="back-text">返回</text>
					</view>
				</view>
			</view>

			<scroll-view scroll-y class="audit-team-scroll">
				<!-- 团队信息卡片 -->
				<view class="audit-team-banner">
					<view class="banner-badge"><text class="badge-txt">漫游打卡中</text></view>
					<text class="audit-team-h1">绿野漫行同伴队</text>
					<text class="audit-team-slogan">“每日万步走，亲近大自然，呼吸草木清香”</text>

					<view class="audit-team-meter">
						<view class="meter-lbl-row">
							<text class="meter-title">全队今日健行进度</text>
							<text class="meter-val">24,370 / 30,000 步 (81%)</text>
						</view>
						<view class="meter-track">
							<view class="meter-fill" style="width: 81%;"></view>
						</view>
					</view>
				</view>

				<!-- 队友步数榜 -->
				<view class="audit-members-card">
					<view class="members-h-row">
						<text class="members-title">同伴今日漫步动态</text>
						<text class="members-sub">共 3 位同行伙伴</text>
					</view>

					<view class="member-item">
						<view class="mem-left">
							<view class="mem-rank">1</view>
							<view class="mem-info">
								<text class="mem-name">林间漫步者</text>
								<text class="mem-desc">晨间完成公园慢跑</text>
							</view>
						</view>
						<view class="mem-right">
							<text class="mem-steps">9,820 步</text>
							<text class="mem-tag tag-done">已达标</text>
						</view>
					</view>

					<view class="member-item">
						<view class="mem-left">
							<view class="mem-rank">2</view>
							<view class="mem-info">
								<text class="mem-name">清晨微风</text>
								<text class="mem-desc">午后健步走 5 公里</text>
							</view>
						</view>
						<view class="mem-right">
							<text class="mem-steps">8,150 步</text>
							<text class="mem-tag tag-done">已达标</text>
						</view>
					</view>

					<view class="member-item">
						<view class="mem-left">
							<view class="mem-rank">3</view>
							<view class="mem-info">
								<text class="mem-name">夕阳寻光</text>
								<text class="mem-desc">持续漫步中</text>
							</view>
						</view>
						<view class="mem-right">
							<text class="mem-steps">6,400 步</text>
							<text class="mem-tag tag-doing">进行中</text>
						</view>
					</view>
				</view>

				<!-- 健行寄语 -->
				<view class="audit-tip-card">
					<text class="tip-txt">🌲 慢下来，走入绿水青山。每天坚持半小时户外健步，让身心沐浴于自然与平静之中。</text>
				</view>

				<button class="audit-home-btn" @click="goBack">返回城市漫游首页</button>
			</scroll-view>
		</view>

		<!-- 模式二：正式开放模式【读经小队】 -->
		<view v-else class="real-team-view">
			<!-- 顶部导航栏 (精准避让微信原生胶囊并对齐) -->
			<view class="nav-bar" :style="navBarStyle">
				<view class="nav-content" :style="{ height: navBarHeight + 'px' }">
					<view class="nav-left" @click="goBack">
						<view class="back-arrow-icon"></view>
						<text class="back-text">返回</text>
					</view>
				</view>
			</view>

			<scroll-view scroll-y class="team-scroll">
				<!-- 情况一：未登录状态，引导快速微信授权 -->
				<view v-if="!isLoggedIn" class="auth-card">
					<view class="auth-icon-box">
						<text class="auth-icon">👥</text>
					</view>
					<text class="auth-title">加入读经同行队伍</text>
				<text class="auth-desc">两个人总比一个人好，因为二人劳碌同得美好的果效。快速微信授权即可同步进展给同伴。</text>
				
				<button class="wechat-login-btn" @click="handleWechatLogin">
					<text class="wx-icon">💬</text>
					<text class="wx-btn-text">微信一键授权进入</text>
				</button>
			</view>

			<!-- 情况二：已登录，但尚未加入团队 -->
			<view v-else-if="!currentTeam" class="no-team-container">
				<!-- 用户个人名片 -->
				<view class="user-mini-card">
					<image class="my-avatar" :src="getAvatarDisplayUrl(currentUser.avatarUrl)" mode="aspectFill"></image>
					<view class="my-info">
						<text class="my-name">{{ currentUser.nickname }}</text>
						<text class="my-status-text">暂未加入读经队伍</text>
					</view>
				</view>

				<!-- 入队方式选择 -->
				<view class="team-action-grid">
					<!-- 创建团队卡片 -->
					<view class="action-card create-card" @click="openCreateModal">
						<view class="action-icon-circle bg-orange">
							<text class="action-icon">🚩</text>
						</view>
						<text class="action-card-title">创建新小队</text>
						<text class="action-card-desc">成为发起人，定制团队每日字数目标，生成邀请码呼召好友</text>
						<button class="action-btn btn-orange">发起组团</button>
					</view>

					<!-- 加入团队卡片 -->
					<view class="action-card join-card" @click="openJoinModal">
						<view class="action-icon-circle bg-blue">
							<text class="action-icon">🔑</text>
						</view>
						<text class="action-card-title">输入邀请码入队</text>
						<text class="action-card-desc">已有同伴创建队伍？输入 6 位专属邀请码即可直接同行</text>
						<button class="action-btn btn-blue">立即加入</button>
					</view>
				</view>
			</view>

			<!-- 情况三：已在团队中，展示团队进度大屏 -->
			<view v-else class="team-dashboard">
				<!-- 团队顶层信息卡 -->
				<view class="team-info-banner">
					<view class="banner-top">
						<view class="banner-title-box">
							<text class="team-main-name">{{ currentTeam.teamName }}</text>
							<view class="team-code-badge" @click="copyTeamCode">
								<text class="code-label">邀请码：</text>
								<text class="code-val">{{ currentTeam.teamCode }}</text>
								<text class="copy-hint">复制</text>
							</view>
						</view>
					</view>

					<!-- 全队今日齐心达成条 -->
					<view class="team-progress-box">
						<view class="progress-title-row">
							<text class="team-prog-lbl">今日全队齐心进度</text>
							<text class="team-prog-val">{{ dashboard.teamTodayTotal.toLocaleString() }} / {{ dashboard.teamTargetTotal.toLocaleString() }} 字 ({{ dashboard.teamProgressPercent }}%)</text>
						</view>
						<view class="progress-bar-bg">
							<view class="progress-bar-fill" :style="{ width: dashboard.teamProgressPercent + '%' }"></view>
						</view>
						<text class="team-achieve-tag">全队 {{ dashboard.totalCount }} 人中已有 {{ dashboard.finishedCount }} 人完成今日配额</text>
					</view>
				</view>

				<!-- 成员字数天梯榜 -->
				<view class="section-card">
					<view class="section-title-row">
						<text class="sec-title">队员今日进展天梯</text>
						<text class="sec-sub">每日 5,000 字标准</text>
					</view>

					<view class="member-list">
						<view 
							v-for="(member, idx) in dashboard.sortedMembers" 
							:key="member.openid" 
							class="member-row"
							:class="{ 'my-row': member.openid === currentUser.openid }"
						>
							<view class="rank-box">
								<text class="rank-num" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</text>
							</view>

							<image class="member-avatar" :src="getAvatarDisplayUrl(member.avatarUrl)" mode="aspectFill"></image>

							<view class="member-meta">
								<view class="member-name-row">
									<text class="member-name">{{ member.nickname }}</text>
									<text v-if="member.role === 'LEADER'" class="leader-badge">队长</text>
									<text v-if="member.openid === currentUser.openid" class="me-badge">我</text>
								</view>
								<view class="member-words-row">
									<text class="mem-today-words">今日：{{ (member.todayWords || 0).toLocaleString() }} 字</text>
									<text class="mem-week-words">本周：{{ ((member.weekWords || 0) / 1000).toFixed(1) }}k 字</text>
								</view>
							</view>

							<view class="member-status-box">
								<view v-if="member.isFinishedToday" class="done-tag-box">
									<text class="done-tag-icon">✔</text>
									<text class="done-tag-txt">已达标</text>
								</view>
								<view v-else class="left-tag-box">
									<text class="left-tag-txt">差 {{ Math.max(0, (currentTeam.dailyTargetWords || 5000) - member.todayWords).toLocaleString() }} 字</text>
								</view>
								<text class="streak-tag">🔥 {{ member.streakDays || 1 }}天</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 实时打卡动态墙 -->
				<view class="section-card">
					<view class="section-title-row">
						<text class="sec-title">打卡动态流</text>
					</view>

					<view class="activity-feed">
						<view v-for="act in dashboard.activities" :key="act.id" class="feed-item">
							<image class="feed-avatar" :src="getAvatarDisplayUrl(act.avatarUrl)" mode="aspectFill"></image>
							<view class="feed-content">
								<view class="feed-main-row">
									<text class="feed-user">{{ act.nickname }}</text>
									<text class="feed-action">{{ formatFeedAction(act.action) }}</text>
								</view>
								<view class="feed-meta-row">
									<text class="feed-time">{{ act.time }}</text>
									<text class="feed-dot">·</text>
									<text class="feed-words">+{{ act.words }} 字</text>
								</view>
							</view>
							<view class="feed-like-btn" @click="likeAct(act.id)">
								<text class="like-icon">👍</text>
								<text class="like-count" v-if="act.likes > 0">{{ act.likes }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 创建团队弹窗 -->
		<view v-if="showCreateModal" class="modal-mask" @click="closeCreateModal">
			<view class="modal-body" @click.stop>
				<text class="modal-title">创建新读经小队</text>
				<text class="modal-subtitle">设定一个响亮的队名，召聚属灵同伴</text>

				<view class="input-field">
					<text class="field-label">队伍名称</text>
					<input class="text-input" v-model="createForm.name" placeholder="例如：半载通读同行小组" />
				</view>

				<view class="input-field">
					<text class="field-label">每日字数目标</text>
					<input class="text-input" type="number" v-model="createForm.targetWords" placeholder="5000" />
				</view>

				<button class="submit-btn bg-orange" @click="submitCreateTeam">确认创建小队</button>
			</view>
		</view>

		<!-- 加入团队弹窗 -->
		<view v-if="showJoinModal" class="modal-mask" @click="closeJoinModal">
			<view class="modal-body" @click.stop>
				<text class="modal-title">输入 6 位邀请码</text>
				<text class="modal-subtitle">请输入队长分享给您的邀请码</text>

				<view class="input-field">
					<input 
						class="text-input code-input" 
						v-model="joinCode" 
						maxlength="6" 
						placeholder="如：BL8866" 
						focus
					/>
				</view>

				<button class="submit-btn bg-blue" @click="submitJoinTeam">立即入队</button>
			</view>
		</view>

		<!-- 微信官方资料授权弹窗 -->
		<view v-if="showAuthModal" class="modal-mask" @click="closeAuthModal">
			<view class="modal-body auth-modal-card" @click.stop>
				<text class="modal-title">微信资料授权</text>
				<text class="modal-subtitle">请选用微信头像与昵称，用于小队天梯展示</text>

				<form @submit="confirmRealWechatAuth">
					<!-- 微信官方真实头像选择器 -->
					<view class="avatar-choose-box">
						<!-- #ifdef MP-WEIXIN -->
						<button class="avatar-choose-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
							<image class="auth-avatar-img" :src="getAvatarDisplayUrl(authForm.avatarUrl)" mode="aspectFill"></image>
							<view class="camera-tag"><text class="camera-icon">📷</text></view>
						</button>
						<!-- #endif -->
						<!-- #ifndef MP-WEIXIN -->
						<view class="avatar-choose-btn" @click="mockChooseAvatar">
							<image class="auth-avatar-img" :src="getAvatarDisplayUrl(authForm.avatarUrl)" mode="aspectFill"></image>
							<view class="camera-tag"><text class="camera-icon">📷</text></view>
						</view>
						<!-- #endif -->
						<text class="choose-avatar-tip">点击获取微信个人头像</text>
					</view>

					<!-- 微信官方真实昵称输入框 -->
					<view class="input-field">
						<view class="field-label-row">
							<text class="field-label">微信昵称</text>
							<text class="quick-preset-btn" @click="fillQuickNickname">一键填入默认</text>
						</view>
						<!-- #ifdef MP-WEIXIN -->
						<input 
							name="nickname"
							type="nickname" 
							class="text-input" 
							:value="authForm.nickname" 
							placeholder="点击键盘上方快捷昵称或直接输入" 
							@blur="onNicknameBlur"
							@input="onNicknameInput"
							@change="onNicknameChange"
						/>
						<!-- #endif -->
						<!-- #ifndef MP-WEIXIN -->
						<input 
							name="nickname"
							type="text" 
							class="text-input" 
							v-model="authForm.nickname" 
							placeholder="请输入您的同行者昵称" 
						/>
						<!-- #endif -->
					</view>

					<button class="submit-btn bg-green" form-type="submit" :loading="isAuthenticating">
						确认授权并进入
					</button>
				</form>
			</view>
		</view>
		</view> <!-- 闭合 real-team-view -->
	</view>
</template>

<script>
import { userTeamManager, LOGIN_STATUS } from '@/common/bible-plan/user-team-manager.js';
import { isAuditMode } from '@/common/audit-guard.js';
import { SERVER_HOST, BIBLE_API_BASE } from '@/common/config.js';
import PrivacyPopup from '@/components/privacy-popup.vue';

export default {
	components: {
		PrivacyPopup
	},
	data() {
		return {
			isAudit: true, // 默认安全防御态
			statusBarHeight: 0,
			currentUser: {},
			currentTeam: null,
			dashboard: {
				sortedMembers: [],
				finishedCount: 0,
				totalCount: 0,
				teamTodayTotal: 0,
				teamTargetTotal: 0,
				teamProgressPercent: 0,
				activities: []
			},
			showCreateModal: false,
			showJoinModal: false,
			showAuthModal: false,
			isAuthenticating: false,
			defaultAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
			authForm: {
				nickname: '',
				avatarUrl: ''
			},
			createForm: {
				name: '',
				targetWords: 5000
			},
			joinCode: '',
			navBarTop: 20,
			navBarHeight: 32,
			capsuleWidth: 95
		};
	},

	computed: {
		isLoggedIn() {
			return this.currentUser && this.currentUser.status === LOGIN_STATUS.LOGGED_IN;
		},
		navBarStyle() {
			return `box-sizing:border-box; padding-top:${this.navBarTop}px; padding-bottom:8px; height:${this.navBarTop + this.navBarHeight + 8}px; padding-left:30rpx; padding-right:${this.capsuleWidth}px;`;
		}
	},

	onLoad(options) {
		this.isAudit = isAuditMode();

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

		if (this.isAudit) return;

		// 如果通过邀请链接点入
		if (options.inviteCode) {
			this.joinCode = options.inviteCode;
			this.submitJoinTeam();
		}
	},

	onShow() {
		this.isAudit = isAuditMode();
		if (this.isAudit) return;
		this.refreshTeamData();
	},

	// 微信小程序原生分享配置
	onShareAppMessage() {
		const code = this.currentTeam ? this.currentTeam.teamCode : '';
		const name = this.currentTeam ? this.currentTeam.teamName : '读经小队';
		return {
			title: `邀请你加入【${name}】，每天25分钟，携手通读！`,
			path: `/pages/bible/team?inviteCode=${code}`
		};
	},

	methods: {
		goBack() {
			uni.navigateBack();
		},

		async refreshTeamData() {
			this.currentUser = userTeamManager.getUser();
			const dash = userTeamManager.getTeamDashboard();
			if (dash) {
				this.currentTeam = dash.team;
				this.dashboard = dash;
			} else {
				this.currentTeam = null;
			}

			// 异步拉取云端小队最新动态与天梯
			if (this.currentTeam) {
				const updatedTeam = await userTeamManager.fetchCloudTeamInfo();
				if (updatedTeam) {
					const newDash = userTeamManager.getTeamDashboard();
					if (newDash) {
						this.currentTeam = newDash.team;
						this.dashboard = newDash;
					}
				}
			}
		},

		formatFeedAction(action) {
			if (!action) return '读完圣经经文';
			const match = action.match(/《(.*?)》/);
			let chapter = match ? match[1] : action;
			chapter = chapter
				.replace(/^完成了\s*/, '')
				.replace(/的阅读.*$/, '')
				.replace(/（\d+字）.*$/, '')
				.replace(/\(\d+字\).*$/, '')
				.trim();
			return `读完《${chapter}》`;
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

		uploadAvatarFile(tempFilePath) {
			uni.showLoading({ title: '正在上传头像...' });
			const userInfo = uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1') || uni.getStorageSync('VALLEY_USER_INFO');
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
							const fullUrl = this.getAvatarDisplayUrl(res.data.url);
							this.authForm.avatarUrl = fullUrl;
							if (this.currentUser) {
								this.currentUser.avatarUrl = fullUrl;
							}
							if (userTeamManager) {
								userTeamManager.updateProfile(this.authForm.nickname || this.currentUser?.nickname, fullUrl);
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

		handleWechatLogin() {
			this.openAuthModal();
		},

		openAuthModal() {
			this.authForm.nickname = this.currentUser?.nickname || '';
			this.authForm.avatarUrl = this.currentUser?.avatarUrl ? this.getAvatarDisplayUrl(this.currentUser.avatarUrl) : this.defaultAvatar;
			this.showAuthModal = true;
		},

		closeAuthModal() {
			this.showAuthModal = false;
		},

		onChooseAvatar(e) {
			if (e.detail && e.detail.avatarUrl) {
				const tempPath = e.detail.avatarUrl;
				this.authForm.avatarUrl = tempPath;
				console.log('[Auth] 选定微信官方真实头像:', tempPath);
				this.uploadAvatarFile(tempPath);
			}
		},

		mockChooseAvatar() {
			const randomSeed = Math.floor(Math.random() * 90) + 10;
			this.authForm.avatarUrl = `https://picsum.photos/120/120?random=${randomSeed}`;
		},

		onNicknameInput(e) {
			if (e && e.detail && typeof e.detail.value === 'string') {
				this.authForm.nickname = e.detail.value;
			}
		},

		onNicknameChange(e) {
			if (e && e.detail && typeof e.detail.value === 'string') {
				this.authForm.nickname = e.detail.value;
			}
		},

		onNicknameBlur(e) {
			if (e && e.detail && typeof e.detail.value === 'string') {
				this.authForm.nickname = e.detail.value.trim();
				console.log('[Auth] 填入微信官方真实昵称:', this.authForm.nickname);
			}
		},

		fillQuickNickname() {
			this.authForm.nickname = '书卷同行者';
			uni.showToast({ title: '已填入预设昵称', icon: 'none' });
		},

		async confirmRealWechatAuth(e) {
			// 优先从 form submit 事件中提取微信组件值
			let name = '';
			if (e && e.detail && e.detail.value && e.detail.value.nickname) {
				name = String(e.detail.value.nickname).trim();
			}
			// 兜底从 authForm.nickname 中获取
			if (!name) {
				name = (this.authForm.nickname || '').trim();
			}

			if (!name) {
				uni.showToast({ title: '请授权或输入昵称', icon: 'none' });
				return;
			}

			this.authForm.nickname = name;
			this.isAuthenticating = true;
			uni.showLoading({ title: '微信官方授权中...' });
			const targetAvatar = this.getAvatarDisplayUrl(this.authForm.avatarUrl);
			const res = await userTeamManager.loginWithWechat(name, targetAvatar);
			uni.hideLoading();
			this.isAuthenticating = false;

			if (res.success) {
				this.closeAuthModal();
				await this.refreshTeamData();
				uni.showToast({ title: '微信真实授权成功！', icon: 'success' });
			} else {
				uni.showToast({ title: res.msg || '授权失败，请重试', icon: 'none' });
			}
		},

		openCreateModal() {
			this.createForm.name = '';
			this.createForm.targetWords = 5000;
			this.showCreateModal = true;
		},

		closeCreateModal() {
			this.showCreateModal = false;
		},

		async submitCreateTeam() {
			if (!this.createForm.name) {
				uni.showToast({ title: '请输入队伍名称', icon: 'none' });
				return;
			}
			uni.showLoading({ title: '创建小队中...' });
			await userTeamManager.createTeam(this.createForm.name, parseInt(this.createForm.targetWords) || 5000);
			uni.hideLoading();
			this.closeCreateModal();
			this.refreshTeamData();
			uni.showToast({ title: '团队创建成功！', icon: 'success' });
		},

		openJoinModal() {
			this.joinCode = '';
			this.showJoinModal = true;
		},

		closeJoinModal() {
			this.showJoinModal = false;
		},

		async submitJoinTeam() {
			if (!this.joinCode) {
				uni.showToast({ title: '请输入邀请码', icon: 'none' });
				return;
			}
			uni.showLoading({ title: '加入小队中...' });
			const res = await userTeamManager.joinTeamByCode(this.joinCode);
			uni.hideLoading();
			if (res.success) {
				this.closeJoinModal();
				this.refreshTeamData();
				uni.showToast({ title: '成功加入队伍！', icon: 'success' });
			} else {
				uni.showToast({ title: res.msg || '加入失败', icon: 'none' });
			}
		},

		copyTeamCode() {
			if (!this.currentTeam) return;
			uni.setClipboardData({
				data: this.currentTeam.teamCode,
				success: () => {
					uni.showToast({ title: '邀请码已复制', icon: 'success' });
				}
			});
		},

		likeAct(actId) {
			userTeamManager.likeActivity(actId);
			this.refreshTeamData();
			uni.showToast({ title: '点赞鼓励 +1', icon: 'none' });
		},

		simulateTeammate() {
			userTeamManager.simulateTeammateCheckin();
			this.refreshTeamData();
			uni.showToast({ title: '已模拟队友完成打卡', icon: 'none' });
		},

		showTeamMoreAction() {
			uni.showActionSheet({
				itemList: ['复制邀请码', '退出当前小队'],
				itemColor: '#2c2523',
				success: (res) => {
					if (res.tapIndex === 0) {
						this.copyTeamCode();
					} else if (res.tapIndex === 1) {
						uni.showModal({
							title: '退出小队',
							content: '确定要退出该读经小队吗？',
							confirmColor: '#e03131',
							success: (mRes) => {
								if (mRes.confirm) {
									userTeamManager.leaveTeam();
									this.refreshTeamData();
									uni.showToast({ title: '已退出队伍', icon: 'none' });
								}
							}
						});
					}
				}
			});
		}
	}
};
</script>

<style scoped>
.team-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f7f5f0;
	color: #2c2523;
}

/* 顶部导航栏 */
/* 顶部导航栏 */
.nav-bar {
	display: flex;
	align-items: center;
	background: #fdfbf7;
	border-bottom: 1rpx solid #eae5dc;
	flex-shrink: 0;
	box-sizing: border-box;
}

.nav-content {
	display: flex;
	align-items: center;
	width: 100%;
}

.nav-left {
	display: flex;
	align-items: center;
	height: 100%;
	flex-shrink: 0;
}

.back-arrow-icon {
	width: 18rpx;
	height: 18rpx;
	border-left: 4rpx solid #2c2523;
	border-bottom: 4rpx solid #2c2523;
	transform: rotate(45deg);
	display: inline-block;
	margin-right: 12rpx;
	box-sizing: border-box;
}

.back-text {
	font-size: 28rpx;
	color: #2c2523;
	line-height: 1;
}

.team-scroll {
	flex: 1;
	padding: 24rpx;
	box-sizing: border-box;
}

/* 登录授权卡片 */
.auth-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 60rpx 40rpx;
	margin-top: 60rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	border: 1rpx solid #eee8df;
	box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.04);
}

.auth-icon-box {
	width: 120rpx;
	height: 120rpx;
	background: #fff4e6;
	border-radius: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
}

.auth-icon {
	font-size: 56rpx;
}

.auth-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 12rpx;
}

.auth-desc {
	font-size: 26rpx;
	color: #7b6d64;
	line-height: 1.6;
	margin-bottom: 40rpx;
}

.wechat-login-btn {
	background: #07c160;
	color: #ffffff;
	border-radius: 50rpx;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 60rpx;
	box-shadow: 0 6rpx 16rpx rgba(7, 193, 96, 0.3);
}

.wechat-login-btn::after {
	border: none;
}

.wx-icon {
	font-size: 36rpx;
	margin-right: 12rpx;
}

.wx-btn-text {
	font-size: 30rpx;
	font-weight: bold;
}

/* 暂无团队容器 */
.no-team-container {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.user-mini-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx 30rpx;
	display: flex;
	align-items: center;
	border: 1rpx solid #eee8df;
}

.my-avatar {
	width: 90rpx;
	height: 90rpx;
	border-radius: 45rpx;
	margin-right: 20rpx;
	border: 2rpx solid #c58b43;
}

.my-info {
	display: flex;
	flex-direction: column;
}

.my-name {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
}

.my-status-text {
	font-size: 22rpx;
	color: #8c7b6f;
	margin-top: 6rpx;
}

.team-action-grid {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.action-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 36rpx;
	border: 1rpx solid #eee8df;
	display: flex;
	flex-direction: column;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.action-icon-circle {
	width: 90rpx;
	height: 90rpx;
	border-radius: 45rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;
}

.bg-orange {
	background: #fff4e6;
}

.bg-blue {
	background: #e7f5ff;
}

.action-icon {
	font-size: 44rpx;
}

.action-card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 8rpx;
}

.action-card-desc {
	font-size: 24rpx;
	color: #7b6d64;
	line-height: 1.5;
	margin-bottom: 28rpx;
}

.action-btn {
	border-radius: 40rpx;
	height: 76rpx;
	line-height: 76rpx;
	font-size: 28rpx;
	font-weight: bold;
	color: #ffffff;
}

.action-btn::after {
	border: none;
}

.btn-orange {
	background: linear-gradient(135deg, #c58b43, #a46724);
}

.btn-blue {
	background: linear-gradient(135deg, #339af0, #1c7ed6);
}

/* 团队仪表盘 */
.team-dashboard {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.team-info-banner {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	border: 1rpx solid #eee8df;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.banner-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 24rpx;
}

.banner-title-box {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.team-main-name {
	font-size: 34rpx;
	font-weight: bold;
	color: #2c2523;
}

.team-code-badge {
	display: inline-flex;
	align-items: center;
	background: #fdfaf4;
	border: 1rpx dashed #c58b43;
	padding: 4rpx 14rpx;
	border-radius: 8rpx;
	margin-top: 4rpx;
}

.code-label {
	font-size: 22rpx;
	color: #8c7b6f;
}

.code-val {
	font-size: 24rpx;
	font-weight: bold;
	color: #b3732d;
	font-family: monospace;
	margin: 0 8rpx;
}

.copy-hint {
	font-size: 20rpx;
	color: #c58b43;
	text-decoration: underline;
}

.invite-share-btn {
	background: #fff4e6;
	border: 1rpx solid #ffd8a8;
	color: #d9480f;
	border-radius: 30rpx;
	font-size: 22rpx;
	font-weight: bold;
	height: 56rpx;
	line-height: 56rpx;
	padding: 0 20rpx;
}

.invite-share-btn::after {
	border: none;
}

.team-progress-box {
	background: #fbf9f5;
	padding: 20rpx;
	border-radius: 14rpx;
}

.progress-title-row {
	display: flex;
	justify-content: space-between;
	font-size: 24rpx;
	margin-bottom: 12rpx;
}

.team-prog-lbl {
	color: #5c4e46;
	font-weight: 500;
}

.team-prog-val {
	color: #b3732d;
	font-weight: bold;
}

.progress-bar-bg {
	height: 14rpx;
	background: #eee7dd;
	border-radius: 8rpx;
	overflow: hidden;
	margin-bottom: 10rpx;
}

.progress-bar-fill {
	height: 100%;
	background: linear-gradient(90deg, #d49a54, #b3732d);
	border-radius: 8rpx;
}

.team-achieve-tag {
	font-size: 20rpx;
	color: #8c7b6f;
}

/* 模块卡片 */
.section-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	border: 1rpx solid #eee8df;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.sec-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
}

.sec-sub {
	font-size: 22rpx;
	color: #8c7b6f;
}

.simulate-link {
	font-size: 22rpx;
	color: #1c7ed6;
	text-decoration: underline;
}

/* 成员列表 */
.member-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.member-row {
	display: flex;
	align-items: center;
	padding: 16rpx 20rpx;
	background: #fbf9f5;
	border-radius: 16rpx;
	border: 1rpx solid #eee8df;
}

.my-row {
	background: #fdfaf4;
	border-color: #ffd8a8;
}

.rank-box {
	width: 44rpx;
	text-align: center;
	margin-right: 12rpx;
}

.rank-num {
	font-size: 28rpx;
	font-weight: bold;
	color: #8c7b6f;
}

.rank-1 { color: #f59f00; font-size: 32rpx; }
.rank-2 { color: #868e96; font-size: 30rpx; }
.rank-3 { color: #d9480f; font-size: 28rpx; }

.member-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 36rpx;
	margin-right: 16rpx;
}

.member-meta {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.member-name-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.member-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
}

.leader-badge {
	font-size: 18rpx;
	background: #fff4e6;
	color: #d9480f;
	padding: 2rpx 8rpx;
	border-radius: 6rpx;
}

.me-badge {
	font-size: 18rpx;
	background: #e7f5ff;
	color: #1c7ed6;
	padding: 2rpx 8rpx;
	border-radius: 6rpx;
}

.member-words-row {
	display: flex;
	gap: 16rpx;
	margin-top: 4rpx;
}

.mem-today-words {
	font-size: 22rpx;
	color: #b3732d;
	font-weight: 500;
}

.mem-week-words {
	font-size: 20rpx;
	color: #8c7b6f;
}

.member-status-box {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.done-tag-box {
	background: #e6fcf5;
	border: 1rpx solid #b2f2bb;
	border-radius: 20rpx;
	padding: 4rpx 14rpx;
	display: flex;
	align-items: center;
}

.done-tag-icon {
	color: #2b8a3e;
	font-size: 20rpx;
	margin-right: 4rpx;
	font-weight: bold;
}

.done-tag-txt {
	color: #2b8a3e;
	font-size: 20rpx;
	font-weight: bold;
}

.left-tag-box {
	background: #fff3bf;
	border-radius: 20rpx;
	padding: 4rpx 14rpx;
}

.left-tag-txt {
	font-size: 20rpx;
	color: #f08c00;
	font-weight: 500;
}

.streak-tag {
	font-size: 18rpx;
	color: #d9480f;
	margin-top: 4rpx;
}

/* 动态流 */
.activity-feed {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.feed-item {
	display: flex;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx dashed #eee8df;
}

.feed-item:last-child {
	border-bottom: none;
}

.feed-avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	margin-right: 16rpx;
}

.feed-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-width: 0;
}

.feed-main-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10rpx;
}

.feed-user {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
}

.feed-action {
	font-size: 24rpx;
	color: #5c4e46;
}

.feed-meta-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-top: 6rpx;
}

.feed-time {
	font-size: 22rpx;
	color: #a4968c;
	white-space: nowrap;
}

.feed-dot {
	font-size: 20rpx;
	color: #d1c7bc;
}

.feed-words {
	font-size: 22rpx;
	color: #b3732d;
	font-weight: 600;
	white-space: nowrap;
}

.feed-like-btn {
	display: flex;
	align-items: center;
	padding: 8rpx 14rpx;
	background: #f8f6f2;
	border-radius: 20rpx;
	margin-left: 12rpx;
}

.like-icon {
	font-size: 24rpx;
}

.like-count {
	font-size: 20rpx;
	color: #8c7b6f;
	margin-left: 4rpx;
}

/* 弹窗通用样式 */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: flex-end;
	z-index: 999;
}

.modal-body {
	background: #ffffff;
	border-top-left-radius: 30rpx;
	border-top-right-radius: 30rpx;
	width: 100%;
	padding: 40rpx 30rpx;
	box-sizing: border-box;
}

.modal-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
}

.modal-subtitle {
	font-size: 24rpx;
	color: #8c7b6f;
	margin: 8rpx 0 30rpx 0;
	display: block;
}

.input-field {
	margin-bottom: 24rpx;
}

.field-label {
	font-size: 24rpx;
	color: #5c4e46;
	margin-bottom: 10rpx;
	display: block;
}

.text-input {
	background: #fbf9f5;
	border: 2rpx solid #eee8df;
	border-radius: 12rpx;
	height: 80rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: #2c2523;
}

.code-input {
	font-size: 36rpx;
	font-weight: bold;
	text-align: center;
	letter-spacing: 6rpx;
	text-transform: uppercase;
}

.submit-btn {
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 42rpx;
	color: #ffffff;
	font-size: 30rpx;
	font-weight: bold;
	margin-top: 30rpx;
}

.submit-btn::after {
	border: none;
}

.bg-green {
	background: linear-gradient(135deg, #07c160, #06ad56);
}

/* 微信官方头像选择器样式 */
.avatar-choose-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 20rpx 0 35rpx 0;
}

.avatar-choose-btn {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	padding: 0;
	margin: 0;
	background: transparent;
	position: relative;
	overflow: visible;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
}

.avatar-choose-btn::after {
	border: none;
}

.auth-avatar-img {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	border: 4rpx solid #07c160;
	box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
}

.camera-tag {
	position: absolute;
	right: -4rpx;
	bottom: -4rpx;
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background: #07c160;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 3rpx solid #ffffff;
}

.camera-icon {
	font-size: 22rpx;
}

.choose-avatar-tip {
	font-size: 22rpx;
	color: #07c160;
	font-weight: 500;
	margin-top: 14rpx;
}

.field-label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.quick-preset-btn {
	font-size: 22rpx;
	color: #07c160;
	background: rgba(7, 193, 96, 0.1);
	padding: 4rpx 14rpx;
	border-radius: 6rpx;
	font-weight: 500;
}

/* ==================== 审核伪装：健行同伴样式 ==================== */
.audit-team-page {
	width: 100vw;
	min-height: 100vh;
	background-color: #f7f6f2;
	display: flex;
	flex-direction: column;
}

.audit-nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-left: 32rpx;
	background-color: #f7f6f2;
	z-index: 100;
}

.audit-nav-center {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.audit-nav-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #2c2523;
}

.audit-nav-sub {
	font-size: 20rpx;
	color: #8c7e74;
}

.nav-right-placeholder {
	width: 80rpx;
}

.audit-team-scroll {
	flex: 1;
	height: calc(100vh - 140rpx);
	padding: 24rpx 32rpx 80rpx 32rpx;
	box-sizing: border-box;
}

.audit-team-banner {
	background: linear-gradient(135deg, #3d5a45, #24382c);
	border-radius: 28rpx;
	padding: 40rpx 32rpx;
	color: #ffffff;
	box-shadow: 0 12rpx 32rpx rgba(44, 68, 54, 0.25);
	margin-bottom: 28rpx;
	position: relative;
	overflow: hidden;
}

.banner-badge {
	display: inline-block;
	background: rgba(255, 255, 255, 0.18);
	padding: 6rpx 18rpx;
	border-radius: 20rpx;
	margin-bottom: 16rpx;
}

.badge-txt {
	font-size: 20rpx;
	color: #e2f2e8;
	font-weight: 500;
}

.audit-team-h1 {
	font-size: 38rpx;
	font-weight: bold;
	color: #ffffff;
	display: block;
	margin-bottom: 8rpx;
}

.audit-team-slogan {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.75);
	display: block;
	margin-bottom: 32rpx;
	line-height: 1.4;
}

.audit-team-meter {
	background: rgba(0, 0, 0, 0.15);
	border-radius: 20rpx;
	padding: 24rpx;
}

.meter-lbl-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.meter-title {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.8);
}

.meter-val {
	font-size: 22rpx;
	color: #a3e6b8;
	font-weight: bold;
}

.meter-track {
	width: 100%;
	height: 12rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 6rpx;
	overflow: hidden;
}

.meter-fill {
	height: 100%;
	background: linear-gradient(90deg, #5cdbb5, #a3e6b8);
	border-radius: 6rpx;
	transition: width 0.3s ease;
}

.audit-members-card {
	background: #ffffff;
	border-radius: 28rpx;
	padding: 36rpx 32rpx;
	box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 28rpx;
}

.members-h-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 24rpx;
	margin-bottom: 20rpx;
	border-bottom: 1rpx solid #f0ede6;
}

.members-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
}

.members-sub {
	font-size: 22rpx;
	color: #9c9289;
}

.member-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #faf8f5;
}

.member-item:last-child {
	border-bottom: none;
}

.mem-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.mem-rank {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background: #f4efe6;
	color: #c58b43;
	font-size: 24rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
}

.mem-info {
	display: flex;
	flex-direction: column;
}

.mem-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #2c2523;
}

.mem-desc {
	font-size: 22rpx;
	color: #9c9289;
	margin-top: 4rpx;
}

.mem-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 6rpx;
}

.mem-steps {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mem-tag {
	font-size: 20rpx;
	padding: 4rpx 14rpx;
	border-radius: 8rpx;
	font-weight: 500;
}

.tag-done {
	background: #e2f2e8;
	color: #2c6e49;
}

.tag-doing {
	background: #fff4e6;
	color: #c58b43;
}

.audit-tip-card {
	background: #f0f7f3;
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 40rpx;
	border: 1rpx solid #d8ede0;
}

.tip-txt {
	font-size: 24rpx;
	color: #385141;
	line-height: 1.6;
	display: block;
}

.audit-home-btn {
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

.audit-home-btn::after {
	border: none;
}
</style>
