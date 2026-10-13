<template>
	<view class="team-page">
		<privacy-popup />

		<!-- 模式一：审核伪装模式【漫步健行同伴小队】 -->
		<team-audit-view 
			v-if="isAudit" 
			:nav-bar-style="navBarStyle" 
			:nav-bar-height="navBarHeight" 
			@back="goBack" 
		/>

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
							<view class="banner-remind-btn" @click="openSharePoster()">
								<text class="remind-main-icon">📢</text>
								<text class="remind-main-txt">提醒队友</text>
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
									<view 
										v-if="!member.isFinishedToday && member.openid !== currentUser.openid" 
										class="member-nudge-btn" 
										@click.stop="openSharePoster(member)"
									>
										<text class="nudge-txt">🔔 催催TA</text>
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 实时打卡动态墙（智能聚合模式） -->
					<view class="section-card">
						<view class="section-title-row">
							<text class="sec-title">打卡动态流</text>
							<text class="sec-sub">同日同人自动合并</text>
						</view>

						<view class="activity-feed">
							<view 
								v-for="act in aggregatedActivities" 
								:key="act.openid + '|' + act.dateKey" 
								class="feed-item" 
								:class="{ 'is-expanded': expandedActivities[act.openid + '|' + act.dateKey] }"
							>
								<!-- 顶部用户信息与操作栏 -->
								<view class="feed-card-header">
									<image class="feed-avatar" :src="getAvatarDisplayUrl(act.avatarUrl)" mode="aspectFill"></image>
									<view class="feed-user-meta">
										<view class="user-line">
											<text class="feed-user">{{ act.nickname }}</text>
											<text v-if="act.checkinCount > 1" class="checkin-badge">🔥 {{ act.checkinCount }}次打卡</text>
										</view>
										<view class="sub-line">
											<text class="feed-time">{{ act.displayTime }}</text>
											<text class="feed-dot">·</text>
											<text class="feed-words">+{{ act.totalWords.toLocaleString() }} 字</text>
										</view>
									</view>
									<view class="feed-like-btn" @click.stop="likeAggregatedAct(act)">
										<text class="like-icon">👍</text>
										<text class="like-count" v-if="act.likes > 0">{{ act.likes }}</text>
									</view>
								</view>

								<!-- 中部经文微胶囊展示区 -->
								<view class="feed-card-body">
									<!-- 折叠状态下的胶囊列表 -->
									<view v-if="!expandedActivities[act.openid + '|' + act.dateKey]" class="chapter-chips-row">
										<text 
											v-for="(chap, cIdx) in getPreviewChapters(act.chapters)" 
											:key="cIdx" 
											class="chapter-chip"
										>{{ chap }}</text>
										<text v-if="act.chapters.length > 3" class="more-chip" @click="toggleExpand(act)">
											+{{ act.chapters.length - 3 }}章 ▾
										</text>
									</view>

									<!-- 展开状态下的全量胶囊与明细 -->
									<view v-else class="feed-expanded-content">
										<view class="chapter-chips-row expanded-chips">
											<text 
												v-for="(chap, cIdx) in getUniqueChapters(act.chapters)" 
												:key="cIdx" 
												class="chapter-chip active-chip"
											>{{ chap }}</text>
										</view>

										<!-- 单条打卡时间线 -->
										<view v-if="act.individualCheckins && act.individualCheckins.length > 0" class="checkin-timeline">
											<view v-for="(checkin, idx) in act.individualCheckins" :key="checkin.id || idx" class="timeline-item">
												<view class="timeline-marker"></view>
												<view class="timeline-content">
													<view class="timeline-header">
														<text class="timeline-chapter" v-if="checkin.chapter">{{ checkin.chapter }}</text>
														<text class="timeline-chapter" v-else>读经打卡</text>
														<text class="timeline-words">+{{ checkin.words.toLocaleString() }} 字</text>
													</view>
													<view class="timeline-meta">
														<text class="timeline-time">{{ formatTimelineTime(checkin.time || checkin.createTime) }}</text>
														<view class="timeline-actions" v-if="checkin.reflection || checkin.likes > 0">
															<text class="timeline-reflection-icon" v-if="checkin.reflection">💭</text>
															<text class="timeline-likes" v-if="checkin.likes > 0">👍 {{ checkin.likes }}</text>
														</view>
													</view>
													<view v-if="checkin.reflection" class="timeline-reflection">
														<text class="quote-mark">“</text>
														<text class="reflection-text">{{ checkin.reflection }}</text>
													</view>
												</view>
											</view>
										</view>

										<!-- 随想感悟气泡（汇总） -->
										<view v-if="act.reflections && act.reflections.length > 0" class="reflections-box">
											<view v-for="(reflection, rIdx) in act.reflections" :key="rIdx" class="reflection-bubble">
												<text class="quote-mark">“</text>
												<text class="reflection-text">{{ reflection }}</text>
											</view>
										</view>
									</view>

									<!-- 单条打卡且有心得时的展示 -->
									<view v-if="!expandedActivities[act.openid + '|' + act.dateKey] && act.reflections.length > 0" class="reflections-box">
										<view class="reflection-bubble">
											<text class="quote-mark">“</text>
											<text class="reflection-text">{{ act.reflections[0] }}</text>
										</view>
									</view>
								</view>

								<!-- 底部收起/展开微呼吸条 (仅在多章时呈现) -->
								<view 
									v-if="act.checkinCount > 1 || act.chapters.length > 3 || (act.reflections && act.reflections.length > 1)" 
									class="expand-action-bar" 
									@click="toggleExpand(act)"
								>
									<text class="expand-action-txt">{{ expandedActivities[act.openid + '|' + act.dateKey] ? '收起详情 ▴' : ('展开查看全部 ' + act.chapters.length + ' 卷 ▾') }}</text>
								</view>
							</view>

							<view v-if="aggregatedActivities.length === 0" class="feed-empty">
								<text class="empty-txt">暂无打卡动态，快去读经打卡吧～</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 弹窗一：读经提醒与分享海报组件 -->
			<team-poster-modal 
				ref="posterModal" 
				:team="currentTeam" 
				:dashboard="dashboard" 
			/>

			<!-- 弹窗二：创建/加入小队及微信授权组件 -->
			<team-action-modals 
				ref="actionModals" 
				@refresh="refreshTeamData" 
			/>
		</view>
	</view>
</template>

<script>
import { userTeamManager, LOGIN_STATUS } from '@/common/bible-plan/user-team-manager.js';
import { isAuditMode } from '@/common/audit-guard.js';
import { SERVER_HOST } from '@/common/config.js';
import PrivacyPopup from '@/components/privacy-popup.vue';
import TeamAuditView from './components/team-audit-view.vue';
import TeamPosterModal from './components/team-poster-modal.vue';
import TeamActionModals from './components/team-action-modals.vue';

export default {
	components: {
		PrivacyPopup,
		TeamAuditView,
		TeamPosterModal,
		TeamActionModals
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
			navBarTop: 20,
			navBarHeight: 32,
			capsuleWidth: 95,
			expandedActivities: {}
		};
	},

	computed: {
		isLoggedIn() {
			return this.currentUser && this.currentUser.status === LOGIN_STATUS.LOGGED_IN;
		},
		navBarStyle() {
			return `box-sizing:border-box; padding-top:${this.navBarTop}px; padding-bottom:8px; height:${this.navBarTop + this.navBarHeight + 8}px; padding-left:30rpx; padding-right:${this.capsuleWidth}px;`;
		},
		aggregatedActivities() {
			if (!this.dashboard.activities || this.dashboard.activities.length === 0) {
				return [];
			}
			
			const groups = new Map();
			const getActTs = (ct) => {
				if (!ct) return Date.now();
				let d = new Date(ct);
				if (isNaN(d.getTime())) return Date.now();
				return (typeof ct === 'string' && ct.endsWith('Z')) ? d.getTime() + 8 * 3600 * 1000 : d.getTime();
			};
			
			this.dashboard.activities.forEach(act => {
				const dateKey = act.time.split(' ')[0];
				const key = `${act.openid}|${dateKey}`;
				
				if (!groups.has(key)) {
					groups.set(key, {
						openid: act.openid,
						nickname: act.nickname,
						avatarUrl: act.avatarUrl,
						dateKey,
						displayTime: act.time,
						totalWords: 0,
						chapters: [],
						checkinCount: 0,
						reflections: [],
						likes: 0,
						latestTimestamp: getActTs(act.createTime),
						individualCheckins: []
					});
				}
				
				const group = groups.get(key);
				group.totalWords += act.words || 0;
				group.checkinCount += 1;
				
				const checkin = {
					id: act.id,
					time: act.time,
					createTime: act.createTime,
					words: act.words || 0,
					action: act.action,
					reflection: act.reflection,
					likes: act.likes || 0,
					chapter: null
				};
				
				if (act.action) {
					const chapterMatch = act.action.match(/《(.*?)》/);
					if (chapterMatch) {
						checkin.chapter = chapterMatch[1];
						group.chapters.push(chapterMatch[1]);
					}
				}
				if (act.reflection) {
					group.reflections.push(act.reflection);
				}
				group.likes += act.likes || 0;
				if (act.createTime) {
					const ts = getActTs(act.createTime);
					if (ts > group.latestTimestamp) {
						group.latestTimestamp = ts;
					}
				}
				
				group.individualCheckins.push(checkin);
			});
			
			return Array.from(groups.values())
				.sort((a, b) => b.latestTimestamp - a.latestTimestamp)
				.slice(0, 15);
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
			this.$nextTick(() => {
				if (this.$refs.actionModals) {
					this.$refs.actionModals.openJoin(options.inviteCode);
				}
			});
		} else if (options.scene) {
			// 扫描太阳码进入，微信将参数放于 scene 中
			try {
				const scene = decodeURIComponent(options.scene);
				const match = scene.match(/(?:code|inviteCode)=([a-zA-Z0-9]+)/);
				const extractedCode = match ? match[1] : scene;
				if (extractedCode && extractedCode.length <= 10) {
					this.$nextTick(() => {
						if (this.$refs.actionModals) {
							this.$refs.actionModals.openJoin(extractedCode);
						}
					});
				}
			} catch (e) {
				console.warn('解析太阳码 scene 参数失败:', e);
			}
		}
	},

	onShow() {
		this.isAudit = isAuditMode();
		if (this.isAudit) return;
		this.refreshTeamData();
	},

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

		getAvatarDisplayUrl(url) {
			const defaultAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
			if (!url) return defaultAvatar;
			if (url.startsWith('/uploads/')) return SERVER_HOST + url;
			return url;
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

		handleWechatLogin() {
			if (this.$refs.actionModals) {
				this.$refs.actionModals.openAuth(this.currentUser);
			}
		},

		openCreateModal() {
			if (this.$refs.actionModals) {
				this.$refs.actionModals.openCreate();
			}
		},

		openJoinModal() {
			if (this.$refs.actionModals) {
				this.$refs.actionModals.openJoin();
			}
		},

		openSharePoster(targetMember = null) {
			if (this.$refs.posterModal) {
				this.$refs.posterModal.open(targetMember);
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

		toggleExpand(act) {
			const key = `${act.openid}|${act.dateKey}`;
			this.$set(this.expandedActivities, key, !this.expandedActivities[key]);
		},

		getPreviewChapters(chapters) {
			if (!chapters || chapters.length === 0) return [];
			const unique = [...new Set(chapters)];
			return unique.slice(0, 3);
		},

		getUniqueChapters(chapters) {
			if (!chapters) return [];
			return [...new Set(chapters)];
		},

		formatTimelineTime(timeStr) {
			if (!timeStr) return '';
			const parts = timeStr.split(' ');
			if (parts.length > 1) {
				const timePart = parts[1];
				const hm = timePart.split(':');
				if (hm.length >= 2) return `${hm[0]}:${hm[1]}`;
			}
			return timeStr;
		},

		likeAggregatedAct(act) {
			const actIds = (act.individualCheckins && act.individualCheckins.length > 0)
				? act.individualCheckins.map(c => c.id).filter(id => id > 0)
				: [act.id];

			if (actIds.length > 0) {
				userTeamManager.likeActivity(actIds[0]);
				act.likes = (act.likes || 0) + 1;
				uni.showToast({ title: '点赞鼓励 +1', icon: 'none' });
			}
		},

		showTeamMoreAction() {
			uni.showActionSheet({
				itemList: ['📢 提醒队友 / 分享海报', '复制邀请码', '退出当前小队'],
				itemColor: '#2c2523',
				success: (res) => {
					if (res.tapIndex === 0) {
						this.openSharePoster();
					} else if (res.tapIndex === 1) {
						this.copyTeamCode();
					} else if (res.tapIndex === 2) {
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

<style scoped src="./team.css"></style>
