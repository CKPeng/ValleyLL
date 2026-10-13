import { planManager, TIME_SLOT, WEEK_STATUS, PLAN_STATUS } from '@/common/bible-plan/plan-manager.js';
import { DIFFICULTY_LEVEL } from '@/common/bible-plan/bible-meta.js';
import { userTeamManager, LOGIN_STATUS } from '@/common/bible-plan/user-team-manager.js';
import { isAuditMode } from '@/common/audit-guard.js';
import PrivacyPopup from '@/components/privacy-popup.vue';
import { SERVER_HOST, BIBLE_API_BASE } from '@/common/config.js';

export default {
	components: {
		PrivacyPopup
	},
	data() {
		return {
			isAudit: true, // 默认安全防御态
			auditHabits: [
				{ id: 1, name: '晨起静心与深呼吸', time: '15分钟', done: true, tag: '晨间' },
				{ id: 2, name: '午后林间漫步慢行', time: '20分钟', done: false, tag: '午后' },
				{ id: 3, name: '睡前自然白噪音聆听', time: '30分钟', done: false, tag: '夜间' }
			],
			PLAN_STATUS,
			statusBarHeight: 0,
			navBarTop: 20,
			navBarHeight: 32,
			capsuleWidth: 95,
			currentUser: {},
			isLoggedIn: false,
			showAuthModal: false,
			isAuthenticating: false,
			defaultAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
			authForm: {
				nickname: '',
				avatarUrl: ''
			},
			planForm: {
				targetWeeks: 26,
				dailyTargetWords: 5000,
				timeSlot: TIME_SLOT.NIGHT,
				startDateKey: 'today',
				startImmediately: false
			},
			cycleOptions: [
				{ weeks: 26, label: '半年通读 (26周)', desc: '标准节奏 · 约5,000字/天 · 1个番茄钟', badge: '最推荐' },
				{ weeks: 52, label: '一年通读 (52周)', desc: '细嚼慢咽 · 约2,500字/天 · 轻松无压', badge: '轻松' },
				{ weeks: 14, label: '百日通读 (14周)', desc: '沉浸精进 · 约9,500字/天 · 全速冲刺', badge: '挑战' }
			],
			startDateOptions: [
				{ key: 'today', label: '今天开启', desc: '即刻启程' },
				{ key: 'tomorrow', label: '明天早晨', desc: '整装待发' },
				{ key: 'next_monday', label: '下周一正式开跑', desc: '从容集结' }
			],
			planData: {},
			weeklySummary: { weekFinishedWords: 0, weeklyTargetWords: 35000 },
			recommendation: { mainList: [], subList: [] },
			todayFinishedWords: 0,
			totalFinishedWords: 0,
			teamDashboard: null,
			showSettingModal: false,
			slotOptions: [
				{ key: TIME_SLOT.MORNING, name: '晨更灵修', time: '06:00 - 08:30 清晨醒脑', icon: '🌅' },
				{ key: TIME_SLOT.NOON, name: '午休片刻', time: '12:30 - 13:30 午间安歇', icon: '☀️' },
				{ key: TIME_SLOT.NIGHT, name: '睡前默想', time: '21:30 - 23:00 晚间定心', icon: '🌙' },
				{ key: TIME_SLOT.FLEXIBLE, name: '自由碎片', time: '随时打开，只要 25 分钟', icon: '☕' }
			],
			targetWordOptions: [
				{ val: 3000, label: '3,000 字/天', desc: '轻量轻松 · 约15分钟' },
				{ val: 5000, label: '5,000 字/天', desc: '标准半年 · 25分钟番茄钟' },
				{ val: 8000, label: '8,000 字/天', desc: '进阶精读 · 约40分钟' }
			]
		};
	},

	computed: {
		navBarStyle() {
			return `box-sizing:border-box; padding-top:${this.navBarTop}px; padding-bottom:8px; height:${this.navBarTop + this.navBarHeight + 8}px; padding-right:${this.capsuleWidth}px;`;
		},

		pageNavTitle() {
			if (this.planData.status === PLAN_STATUS.PLANNING) return '定制读经计划';
			if (this.planData.status === PLAN_STATUS.COLD_START) return '读经计划 · 等待开跑';
			return '动态读经计划';
		},

		pageNavSubtitle() {
			if (this.planData.status === PLAN_STATUS.PLANNING) return '字数动态结合法 · 科学通读全书';
			if (this.planData.status === PLAN_STATUS.COLD_START) return '目标已锁定 · 等待开跑或招募队友';
			return '25分钟番茄钟 · 字数驱动周平衡';
		},

		daysUntilStart() {
			if (!this.planData.startDate) return 0;
			const now = new Date();
			const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
			const parts = (this.planData.startDate || '').split('-').map(Number);
			if (parts.length < 3 || !parts[0]) return 0;
			const startZero = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
			const diff = Math.ceil((startZero - todayZero) / (1000 * 60 * 60 * 24));
			return Math.max(0, diff);
		},

		todayWordsPercent() {
			const target = this.planData.dailyTargetWords || 5000;
			return Math.min(100, Math.round((this.todayFinishedWords / target) * 100));
		},

		weeklyProgressPercent() {
			const target = this.weeklySummary.weeklyTargetWords || 35000;
			const current = this.weeklySummary.weekFinishedWords || 0;
			return Math.min(100, Math.round((current / target) * 100));
		},

		greetingText() {
			const hour = new Date().getHours();
			if (hour < 9) return '清晨好，以主的话语开启新的一天';
			if (hour < 14) return '午间安，片刻专注滋润心神';
			if (hour < 19) return '午后时光，享受神圣专注';
			return '晚安，在主的话中安然收工';
		},

		timeSlotLabel() {
			const found = this.slotOptions.find(o => o.key === this.planData.timeSlot);
			return found ? found.name : '睡前默想';
		},

		statusLabel() {
			if (this.weeklySummary.paceRate) {
				if (this.weeklySummary.status === WEEK_STATUS.BEHIND) return '节奏偏慢';
				if (this.weeklySummary.status === WEEK_STATUS.AHEAD) return '节奏偏快';
				return '步调正常';
			}
			const status = this.weeklySummary.status;
			if (status === WEEK_STATUS.BEHIND) return '本周待填平';
			if (status === WEEK_STATUS.AHEAD) return '进度超额';
			return '步调匀称';
		},

		statusClass() {
			const status = this.weeklySummary.status;
			if (status === WEEK_STATUS.BEHIND) return 'status-behind';
			if (status === WEEK_STATUS.AHEAD) return 'status-ahead';
			return 'status-ontrack';
		},

		finishedHabitCount() {
			return (this.auditHabits || []).filter(h => h.done).length;
		}
	},

	onLoad() {
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

		// 监听切换计划书卷的事件
		uni.$on('planTrackUpdated', (data) => {
			if (data && data.track && data.bookId && data.chapter) {
				planManager.updateTrack(data.track, data.bookId, data.chapter);
				this.refreshData();
			}
		});

		// 监听阅读打卡进度实时更新事件
		uni.$on('planProgressUpdated', () => {
			this.refreshData();
		});
	},

	onUnload() {
		uni.$off('planTrackUpdated');
		uni.$off('planProgressUpdated');
	},

	async onShow() {
		this.isAudit = isAuditMode();
		if (this.isAudit) return;

		this.currentUser = userTeamManager.getUser();
		this.isLoggedIn = userTeamManager.isRealLoggedIn();

		// 核心前移拦截：未登录前弹出微信官方真实授权弹窗
		if (!this.isLoggedIn) {
			this.openAuthModal();
		}

		// 先用本地缓存即时渲染，保障秒开
		this.refreshData();

		// 异步从云端拉取最新读经计划和团队进展，完成后无感对齐刷新
		if (this.isLoggedIn) {
			try {
				await planManager.pullAndMerge(false);
				if (this.teamDashboard) {
					await userTeamManager.fetchCloudTeamInfo();
				}
				this.refreshData();
			} catch (e) {
				console.warn('[Plan] 云端自动同步跳过:', e);
			}
		}
	},

	methods: {
		toggleHabit(id) {
			const item = this.auditHabits.find(h => h.id === id);
			if (item) {
				item.done = !item.done;
				uni.showToast({
					title: item.done ? '打卡成功！' : '已取消打卡',
					icon: 'none'
				});
			}
		},

		goBack() {
			uni.navigateBack();
		},

		handleUserPillClick() {
			if (!this.isLoggedIn) {
				this.openAuthModal();
				return;
			}
			uni.showActionSheet({
				itemList: ['更换微信头像/昵称', '重新微信授权'],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.openAuthModal();
					} else if (res.tapIndex === 1) {
						userTeamManager.forceReAuth();
						this.currentUser = userTeamManager.getUser();
						this.isLoggedIn = false;
						this.openAuthModal();
					}
				}
			});
		},

		handleAuthMaskClick() {
			if (!this.isLoggedIn) {
				uni.showToast({ title: '开启计划前请先完成微信授权', icon: 'none' });
				return;
			}
			this.closeAuthModal();
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

		openAuthModal() {
			this.authForm.nickname = ''; // 强制置空，避免任何旧值干扰原生微信注入
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

		onNicknameInput(e) {
			const val = e.detail?.value ?? e.target?.value ?? '';
			console.log('onNicknameInput',val)
			this.authForm.nickname = val;
		},

		onNicknameBlur(e) {
			const val = e.detail?.value ?? e.target?.value;
			console.log('onNicknameBlur',val)
			if (val !== undefined && val !== null && val !== '') {
				this.authForm.nickname = val;
			}
		},

		mockChooseAvatar() {
			const randomSeed = Math.floor(Math.random() * 90) + 10;
			this.authForm.avatarUrl = `https://picsum.photos/120/120?random=${randomSeed}`;
		},

		async confirmRealWechatAuth() {
			let name = (this.authForm.nickname || '').trim();

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
				this.currentUser = userTeamManager.getUser();
				this.isLoggedIn = true;
				this.closeAuthModal();
				this.refreshData();
				uni.showToast({ title: '微信官方授权成功！', icon: 'success' });
			} else {
				uni.showToast({ title: res.msg || '授权失败，请重试', icon: 'none' });
			}
		},

		refreshData() {
			this.planData = planManager.getPlanData();
			this.weeklySummary = planManager.getWeeklySummary();
			this.recommendation = planManager.getTodayRecommendation();
			this.todayFinishedWords = planManager.getTodayFinishedWords();
			this.totalFinishedWords = planManager.getTotalFinishedWords();
			this.teamDashboard = userTeamManager.getTeamDashboard();
		},

		goToTeam() {
			uni.navigateTo({
				url: '/pages/bible/team'
			});
		},

		goToPlanHistory() {
			uni.navigateTo({
				url: '/pages/bible/plan-history'
			});
		},

		changeTrack(trackType) {
			// 使用本地存储传递参数，确保绝对可靠
			uni.setStorageSync('temp_select_for_plan', trackType);
			uni.navigateTo({
				url: `/pages/bible/bible`
			});
		},

		getGenreClass(difficulty) {
			if (difficulty === DIFFICULTY_LEVEL.HARD) return 'hard-tag';
			if (difficulty === DIFFICULTY_LEVEL.SWEET) return 'sweet-tag';
			return 'smooth-tag';
		},

		startQuickFocus() {
			const firstUnread = 
				this.recommendation.mainList.find(i => !i.isFinished) ||
				this.recommendation.subList.find(i => !i.isFinished) ||
				this.recommendation.mainList[0];

			if (firstUnread) {
				this.openReading(firstUnread, true);
			}
		},

		openReading(item, startTimer = false) {
			const timerParam = startTimer ? '&autoTimer=25' : '';
			uni.navigateTo({
				url: `/pages/bible/reading?book=${item.bookId}&chapter=${item.chapter}&fromPlan=true${timerParam}`
			});
		},

		computeTargetDate(dateKey) {
			const d = new Date();
			if (dateKey === 'tomorrow') {
				d.setDate(d.getDate() + 1);
			} else if (dateKey === 'next_monday') {
				const day = d.getDay();
				const daysToAdd = day === 0 ? 1 : (8 - day);
				d.setDate(d.getDate() + daysToAdd);
			}
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},

		submitCreatePlan() {
			if (!this.isLoggedIn) {
				this.openAuthModal();
				return;
			}
			const startDate = this.computeTargetDate(this.planForm.startDateKey);
			const startImmediately = Boolean(this.planForm.startImmediately && (this.planForm.startDateKey === 'today'));

			planManager.createPlan({
				targetWeeks: this.planForm.targetWeeks,
				dailyTargetWords: this.planForm.dailyTargetWords,
				timeSlot: this.planForm.timeSlot,
				startDate: startDate,
				startImmediately: startImmediately
			});

			this.refreshData();

			if (this.planData.status === PLAN_STATUS.SCALING) {
				uni.showToast({ title: '计划已创建并开启！', icon: 'success' });
			} else {
				uni.showToast({ title: '计划已创建，等待开跑！', icon: 'success' });
			}
		},

		startRealPlan() {
			planManager.startPlan();
			this.refreshData();
			uni.showToast({ title: '🚀 计划正式开启！主的话一路相随', icon: 'success' });
		},

		editPlanConfig() {
			uni.showModal({
				title: '修改计划设定',
				content: '将返回定制页面重新调整通读周期与目标，是否继续？',
				confirmColor: '#c58b43',
				success: (res) => {
					if (res.confirm) {
						planManager.resetToPlanning();
						this.refreshData();
					}
				}
			});
		},

		openSettingModal() {
			if (this.planData.status === PLAN_STATUS.PLANNING) {
				uni.showToast({ title: '当前正在筹备定制中，可在下方直接选择', icon: 'none' });
				return;
			}
			this.showSettingModal = true;
		},

		closeSettingModal() {
			this.showSettingModal = false;
		},

		selectSlot(slotKey) {
			planManager.setTimeSlot(slotKey);
			this.refreshData();
		},

		changeDailyWords(val) {
			planManager.setDailyTargetWords(val);
			this.refreshData();
			uni.showToast({ title: `每日目标设为 ${val} 字`, icon: 'none' });
		},

		confirmResetPlan() {
			uni.showModal({
				title: '确认重新设定读经计划',
				content: '重置后将返回定制页面，重新规划通读周期与配额，是否确定？',
				confirmColor: '#c58b43',
				success: (res) => {
					if (res.confirm) {
						planManager.resetToPlanning();
						this.refreshData();
						uni.showToast({ title: '已返回定制筹备状态', icon: 'success' });
					}
				}
			});
		}
	}
};
