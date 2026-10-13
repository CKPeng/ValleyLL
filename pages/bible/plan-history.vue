<template>
	<view class="history-container">
		<!-- 自定义顶部导航栏 -->
		<view class="custom-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-content">
				<view class="back-btn" @click="goBack">
					<text class="back-icon">❮</text>
					<text class="back-text">返回</text>
				</view>
				<text class="nav-title">通读周进度与每日明细</text>
				<view class="nav-placeholder"></view>
			</view>
		</view>

		<scroll-view scroll-y class="scroll-content" :style="{ paddingTop: (statusBarHeight + 48) + 'px' }">
			<!-- 顶部总体概览卡片 -->
			<view class="overview-card">
				<view class="overview-header">
					<view class="plan-badge">
						<text class="badge-icon">📅</text>
						<text class="badge-title">自然周总账体系</text>
					</view>
					<text class="rule-hint">以礼拜天（主日）为每周起点</text>
				</view>
				<text class="overview-title">{{ planData.planName || '通读总账' }}</text>
				<view class="overview-stats-grid">
					<view class="stat-cell">
						<text class="stat-num">{{ weekList.length }}</text>
						<text class="stat-lbl">已记录周数</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-cell">
						<text class="stat-num">{{ completedWeeksCount }} / {{ planData.targetWeeks || 26 }}</text>
						<text class="stat-lbl">达标周数</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-cell">
						<text class="stat-num">{{ (planData.weeklyTargetWords || 35000).toLocaleString() }}</text>
						<text class="stat-lbl">周目标字数</text>
					</view>
				</view>
			</view>

			<!-- 列表标题 -->
			<view class="list-section-header">
				<text class="list-title">各周完成度列表</text>
				<text class="list-sub">点击某一周可展开/折叠该周每日明细</text>
			</view>

			<!-- 各周卡片列表 -->
			<view class="week-list">
				<view 
					v-for="week in weekList" 
					:key="'week-' + week.weekNumber" 
					class="week-card"
					:class="{ 'current-week-card': week.isCurrentWeek, 'card-expanded': expandedWeeks.includes(week.weekNumber) }"
				>
					<!-- 卡片头部（点击展开/折叠） -->
					<view class="week-card-header" @click="toggleWeekExpand(week.weekNumber)">
						<view class="header-left">
							<view class="week-num-row">
								<text class="week-name">第 {{ week.weekNumber }} 周</text>
								<text v-if="week.isCurrentWeek" class="current-tag">本周进行中</text>
							</view>
							<text class="week-range">{{ week.rangeLabel }} (主日~周六)</text>
						</view>
						<view class="header-right">
							<text class="status-badge" :class="'badge-' + week.statusType">
								{{ week.statusTag }}
							</text>
							<text class="arrow-indicator" :class="{ 'arrow-up': expandedWeeks.includes(week.weekNumber) }">▼</text>
						</view>
					</view>

					<!-- 周进度条与字数汇总 -->
					<view class="week-progress-area" @click="toggleWeekExpand(week.weekNumber)">
						<view class="progress-bar-bg">
							<view 
								class="progress-bar-fill" 
								:class="'fill-' + week.statusType"
								:style="{ width: week.percent + '%' }"
							></view>
						</view>
						<view class="progress-info-row">
							<text class="words-detail">
								<text class="finished-strong">{{ week.finishedWords.toLocaleString() }}</text>
								<text class="target-sub"> / {{ week.targetWords.toLocaleString() }} 字</text>
							</text>
							<text class="percent-text">{{ week.percent }}% (已读 {{ week.finishedChapters }} 章)</text>
						</view>
					</view>

					<!-- 展开区域：周日到周六（共7天）每日明细下钻 -->
					<view v-if="expandedWeeks.includes(week.weekNumber)" class="daily-detail-panel">
						<view class="daily-panel-title">
							<text class="panel-title-text">📋 该周每日阅读清单 (从周日开始)</text>
						</view>

						<view class="day-rows-container">
							<view 
								v-for="day in week.days" 
								:key="day.dateStr" 
								class="day-row-card"
								:class="{ 'day-today': day.isToday, 'day-empty': day.words === 0, 'day-future': day.isFuture }"
							>
								<!-- 日期与星期标签 -->
								<view class="day-left-meta">
									<view class="day-title-row">
										<text class="day-name-txt" :class="{ 'sunday-txt': day.dayIndex === 0 }">{{ day.dayName }}</text>
										<text v-if="day.isToday" class="today-bubble">今天</text>
									</view>
									<text class="day-date-txt">{{ day.dateStr.slice(5) }}</text>
								</view>

								<!-- 中间字数与章节 -->
								<view class="day-center-info">
									<view class="day-words-row">
										<text class="day-words-val" :class="{ 'words-zero': day.words === 0 }">
											{{ day.words > 0 ? day.words.toLocaleString() + ' 字' : (day.isFuture ? '待开启' : '未读') }}
										</text>
										<text v-if="day.focusMinutes > 0" class="day-focus-pill">
											⏱ {{ day.focusMinutes }} 分钟
										</text>
									</view>

									<!-- 阅读的章节名列表 -->
									<view v-if="day.chapters && day.chapters.length > 0" class="day-chapter-chips">
										<text 
											v-for="c in day.chapters" 
											:key="c.sn + '-' + c.chapter" 
											class="chapter-chip"
										>
											{{ c.shortName }} {{ c.chapter }}章
										</text>
									</view>
									<text v-else-if="!day.isFuture && day.words === 0" class="day-empty-hint">
										该日暂无打卡记录
									</text>
								</view>

								<!-- 右侧达标状态 -->
								<view class="day-right-status">
									<text v-if="day.words > 0" class="check-icon-circle">✔</text>
									<text v-else-if="day.isFuture" class="future-dot">···</text>
									<text v-else class="miss-dot">—</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部留白 -->
			<view style="height: 60rpx;"></view>
		</scroll-view>
	</view>
</template>

<script>
	import { planManager } from '@/common/bible-plan/plan-manager.js';

	export default {
		data() {
			return {
				statusBarHeight: 20,
				planData: {},
				weekList: [],
				expandedWeeks: [] // 记录哪些周被展开了
			};
		},
		computed: {
			completedWeeksCount() {
				if (!this.weekList) return 0;
				return this.weekList.filter(w => w.statusType === 'completed').length;
			}
		},
		onLoad() {
			const sys = uni.getSystemInfoSync();
			if (sys && sys.statusBarHeight) {
				this.statusBarHeight = sys.statusBarHeight;
			}
			this.loadData();
		},
		onShow() {
			this.loadData();
		},
		methods: {
			goBack() {
				uni.navigateBack({
					fail: () => {
						uni.redirectTo({
							url: '/pages/bible/plan'
						});
					}
				});
			},
			loadData() {
				this.planData = planManager.getPlanData() || {};
				this.weekList = planManager.getWeeklyHistoryDetailedList() || [];

				// 默认自动展开当前周
				const currentWeek = this.weekList.find(w => w.isCurrentWeek);
				if (currentWeek && !this.expandedWeeks.includes(currentWeek.weekNumber)) {
					this.expandedWeeks = [currentWeek.weekNumber];
				} else if (this.weekList.length > 0 && this.expandedWeeks.length === 0) {
					this.expandedWeeks = [this.weekList[0].weekNumber];
				}
			},
			toggleWeekExpand(weekNumber) {
				const idx = this.expandedWeeks.indexOf(weekNumber);
				if (idx >= 0) {
					this.expandedWeeks.splice(idx, 1);
				} else {
					this.expandedWeeks.push(weekNumber);
				}
			}
		}
	};
</script>

<style lang="scss">
	.history-container {
		min-height: 100vh;
		background: #f6f7fb;
		display: flex;
		flex-direction: column;
	}

	.custom-nav-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);

		.nav-content {
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 24rpx;

			.back-btn {
				display: flex;
				align-items: center;
				padding: 12rpx 16rpx 12rpx 0;
				cursor: pointer;

				.back-icon {
					font-size: 32rpx;
					color: #2c3e50;
					margin-right: 6rpx;
				}

				.back-text {
					font-size: 28rpx;
					color: #2c3e50;
					font-weight: 500;
				}
			}

			.nav-title {
				font-size: 32rpx;
				font-weight: 700;
				color: #1a252f;
			}

			.nav-placeholder {
				width: 80rpx;
			}
		}
	}

	.scroll-content {
		flex: 1;
		padding: 24rpx;
		box-sizing: border-box;
	}

	.overview-card {
		background: linear-gradient(135deg, #2b3a4a 0%, #1f2937 100%);
		border-radius: 24rpx;
		padding: 32rpx;
		color: #ffffff;
		box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.15);
		margin-bottom: 32rpx;

		.overview-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16rpx;

			.plan-badge {
				display: flex;
				align-items: center;
				background: rgba(255, 255, 255, 0.15);
				padding: 6rpx 18rpx;
				border-radius: 30rpx;

				.badge-icon {
					font-size: 24rpx;
					margin-right: 8rpx;
				}

				.badge-title {
					font-size: 22rpx;
					color: #e2e8f0;
				}
			}

			.rule-hint {
				font-size: 22rpx;
				color: #94a3b8;
			}
		}

		.overview-title {
			font-size: 36rpx;
			font-weight: bold;
			color: #ffffff;
			display: block;
			margin-bottom: 28rpx;
		}

		.overview-stats-grid {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: rgba(255, 255, 255, 0.08);
			border-radius: 16rpx;
			padding: 20rpx 28rpx;

			.stat-cell {
				display: flex;
				flex-direction: column;
				align-items: center;

				.stat-num {
					font-size: 34rpx;
					font-weight: 700;
					color: #f8fafc;
					margin-bottom: 4rpx;
				}

				.stat-lbl {
					font-size: 22rpx;
					color: #94a3b8;
				}
			}

			.stat-divider {
				width: 1px;
				height: 48rpx;
				background: rgba(255, 255, 255, 0.15);
			}
		}
	}

	.list-section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 20rpx;
		padding: 0 8rpx;

		.list-title {
			font-size: 30rpx;
			font-weight: 700;
			color: #1e293b;
		}

		.list-sub {
			font-size: 22rpx;
			color: #64748b;
		}
	}

	.week-list {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}

	.week-card {
		background: #ffffff;
		border-radius: 20rpx;
		border: 1px solid rgba(226, 232, 240, 0.8);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
		overflow: hidden;
		transition: all 0.25s ease;

		&.current-week-card {
			border-color: #3b82f6;
			box-shadow: 0 6rpx 20rpx rgba(59, 130, 246, 0.12);
		}

		.week-card-header {
			padding: 24rpx 28rpx 16rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;

			.header-left {
				display: flex;
				flex-direction: column;

				.week-num-row {
					display: flex;
					align-items: center;
					gap: 12rpx;

					.week-name {
						font-size: 30rpx;
						font-weight: 700;
						color: #1e293b;
					}

					.current-tag {
						background: #eff6ff;
						color: #2563eb;
						font-size: 20rpx;
						font-weight: 600;
						padding: 4rpx 12rpx;
						border-radius: 8rpx;
						border: 1px solid #bfdbfe;
					}
				}

				.week-range {
					font-size: 22rpx;
					color: #64748b;
					margin-top: 6rpx;
				}
			}

			.header-right {
				display: flex;
				align-items: center;
				gap: 16rpx;

				.status-badge {
					font-size: 22rpx;
					padding: 6rpx 16rpx;
					border-radius: 20rpx;
					font-weight: 600;

					&.badge-completed {
						background: #dcfce7;
						color: #15803d;
					}

					&.badge-active {
						background: #dbeafe;
						color: #1d4ed8;
					}

					&.badge-behind {
						background: #fee2e2;
						color: #b91c1c;
					}

					&.badge-future {
						background: #f1f5f9;
						color: #94a3b8;
					}
				}

				.arrow-indicator {
					font-size: 20rpx;
					color: #94a3b8;
					transition: transform 0.2s ease;

					&.arrow-up {
						transform: rotate(180deg);
					}
				}
			}
		}

		.week-progress-area {
			padding: 0 28rpx 24rpx;
			cursor: pointer;

			.progress-bar-bg {
				height: 14rpx;
				background: #f1f5f9;
				border-radius: 7rpx;
				overflow: hidden;
				margin-bottom: 12rpx;

				.progress-bar-fill {
					height: 100%;
					border-radius: 7rpx;
					transition: width 0.3s ease;

					&.fill-completed {
						background: linear-gradient(90deg, #22c55e, #10b981);
					}

					&.fill-active {
						background: linear-gradient(90deg, #3b82f6, #60a5fa);
					}

					&.fill-behind {
						background: linear-gradient(90deg, #f87171, #ef4444);
					}

					&.fill-future {
						background: #cbd5e1;
					}
				}
			}

			.progress-info-row {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.words-detail {
					font-size: 24rpx;

					.finished-strong {
						font-weight: 700;
						color: #0f172a;
					}

					.target-sub {
						color: #64748b;
					}
				}

				.percent-text {
					font-size: 22rpx;
					font-weight: 600;
					color: #475569;
				}
			}
		}

		/* 每日明细面板 */
		.daily-detail-panel {
			border-top: 1px solid #f1f5f9;
			background: #fafbfe;
			padding: 20rpx 24rpx 24rpx;

			.daily-panel-title {
				margin-bottom: 16rpx;

				.panel-title-text {
					font-size: 24rpx;
					font-weight: 600;
					color: #475569;
				}
			}

			.day-rows-container {
				display: flex;
				flex-direction: column;
				gap: 14rpx;
			}

			.day-row-card {
				display: flex;
				align-items: center;
				background: #ffffff;
				border-radius: 14rpx;
				padding: 16rpx 20rpx;
				border: 1px solid #e2e8f0;

				&.day-today {
					border-color: #93c5fd;
					background: #f8faff;
				}

				&.day-empty {
					opacity: 0.75;
				}

				&.day-future {
					opacity: 0.55;
					background: #f8fafc;
				}

				.day-left-meta {
					width: 140rpx;
					flex-shrink: 0;

					.day-title-row {
						display: flex;
						align-items: center;
						gap: 6rpx;

						.day-name-txt {
							font-size: 26rpx;
							font-weight: 700;
							color: #334155;

							&.sunday-txt {
								color: #d97706; /* 周日金色特别标识 */
							}
						}

						.today-bubble {
							background: #ef4444;
							color: #ffffff;
							font-size: 18rpx;
							font-weight: bold;
							padding: 2rpx 8rpx;
							border-radius: 6rpx;
						}
					}

					.day-date-txt {
						font-size: 20rpx;
						color: #94a3b8;
						margin-top: 2rpx;
					}
				}

				.day-center-info {
					flex: 1;
					padding: 0 16rpx;

					.day-words-row {
						display: flex;
						align-items: center;
						gap: 12rpx;

						.day-words-val {
							font-size: 26rpx;
							font-weight: 700;
							color: #0f172a;

							&.words-zero {
								color: #94a3b8;
								font-weight: normal;
							}
						}

						.day-focus-pill {
							font-size: 20rpx;
							background: #f1f5f9;
							color: #475569;
							padding: 2rpx 10rpx;
							border-radius: 8rpx;
						}
					}

					.day-chapter-chips {
						display: flex;
						flex-wrap: wrap;
						gap: 8rpx;
						margin-top: 8rpx;

						.chapter-chip {
							font-size: 20rpx;
							background: #f0fdf4;
							color: #166534;
							border: 1px solid #bbf7d0;
							padding: 2rpx 10rpx;
							border-radius: 6rpx;
						}
					}

					.day-empty-hint {
						font-size: 20rpx;
						color: #cbd5e1;
						margin-top: 4rpx;
						display: block;
					}
				}

				.day-right-status {
					width: 44rpx;
					display: flex;
					align-items: center;
					justify-content: center;

					.check-icon-circle {
						font-size: 26rpx;
						color: #16a34a;
						font-weight: bold;
					}

					.miss-dot {
						font-size: 24rpx;
						color: #cbd5e1;
					}

					.future-dot {
						font-size: 20rpx;
						color: #cbd5e1;
					}
				}
			}
		}
	}
</style>