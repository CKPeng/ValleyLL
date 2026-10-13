<template>
	<view class="plan-page">
		<privacy-popup />
		<!-- 模式一：审核伪装模式【慢生活习惯打卡】 -->
		<view v-if="isAudit" class="audit-plan-page">
			<view class="audit-nav-bar" :style="navBarStyle">
				<view class="nav-left" @click="goBack">
					<view class="back-arrow-icon"></view>
					<text class="back-text">返回</text>
				</view>
				<view class="audit-nav-title-box">
					<text class="audit-nav-title">慢生活打卡</text>
					<text class="audit-nav-sub">身心充能 · 每日习惯</text>
				</view>
				<view class="nav-right-placeholder"></view>
			</view>

			<scroll-view scroll-y class="audit-scroll-body">
				<!-- 顶部打卡数据卡片 -->
				<view class="audit-stat-card">
					<view class="audit-stat-header">
						<text class="stat-h-title">今日慢调节奏</text>
						<text class="stat-h-badge">健康生活</text>
					</view>
					<view class="stat-num-row">
						<view class="stat-col">
							<text class="stat-val">35<text class="stat-unit">分</text></text>
							<text class="stat-lbl">静心专注时长</text>
						</view>
						<view class="stat-col-divider"></view>
						<view class="stat-col">
							<text class="stat-val">{{ finishedHabitCount }}<text class="stat-unit">/ 3</text></text>
							<text class="stat-lbl">今日习惯达成</text>
						</view>
						<view class="stat-col-divider"></view>
						<view class="stat-col">
							<text class="stat-val">7<text class="stat-unit">天</text></text>
							<text class="stat-lbl">连续坚持打卡</text>
						</view>
					</view>
				</view>

				<!-- 每日习惯清单卡片 -->
				<view class="audit-habit-card">
					<text class="habit-card-title">今日建议健康小习惯</text>
					<text class="habit-card-sub">点击右侧按钮即可打卡标记</text>

					<view class="habit-list">
						<view 
							v-for="item in auditHabits" 
							:key="item.id" 
							class="habit-row"
							:class="{ 'habit-row-done': item.done }"
							@click="toggleHabit(item.id)"
						>
							<view class="habit-info">
								<text class="habit-tag">{{ item.tag }}</text>
								<view class="habit-name-box">
									<text class="habit-name">{{ item.name }}</text>
									<text class="habit-time">建议时长约 {{ item.time }}</text>
								</view>
							</view>
							<view class="habit-action">
								<text v-if="item.done" class="habit-done-badge">已完成 ✔</text>
								<text v-else class="habit-check-btn">打卡 ➔</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 慢调生活随想寄语 -->
				<view class="audit-quote-card">
					<text class="quote-text">“慢品人间烟火色，闲观万物生辉光。步调匀称，自得安宁。”</text>
					<text class="quote-author">—— 生活随笔 · 漫游心笺</text>
				</view>

				<button class="audit-return-home-btn" @click="goBack">返回漫游首页</button>
			</scroll-view>
		</view>

		<!-- 模式二：正式开放模式【圣经专属通读计划】 -->
		<view v-else class="real-plan-view">
			<!-- 顶部导航栏 (极简设计，大方舒展) -->
			<view class="nav-bar" :style="navBarStyle">
				<view class="nav-left" @click="goBack">
					<view class="back-arrow-icon"></view>
					<text class="back-text">返回</text>
				</view>
			</view>

			<scroll-view scroll-y class="content-scroll">
			<!-- ==================== 1. PLANNING 筹备定制阶段 ==================== -->
			<view v-if="planData.status === PLAN_STATUS.PLANNING" class="planning-section">
				<!-- 顶部欢迎与个人信息卡片 -->
				<view class="wizard-hero-card">
					<view class="content-user-header" @click="handleUserPillClick">
						<image v-if="isLoggedIn" class="content-user-avatar" :src="getAvatarDisplayUrl(currentUser.avatarUrl)" mode="aspectFill"></image>
						<view v-else class="content-user-avatar-placeholder"><text>微信</text></view>
						<view class="content-user-info">
							<view class="content-user-title-row">
								<text class="content-user-name">{{ isLoggedIn ? currentUser.nickname : '微信同行者' }}</text>
								<text class="content-user-edit-tag">更换资料 ✎</text>
							</view>
							<text class="content-user-sub">专属通读账本 · 进度云端同步</text>
						</view>
						<view class="hero-badge"><text class="hero-badge-text">全新规划</text></view>
					</view>
					<text class="hero-title">定制你的专属通读计划</text>
					<text class="hero-subtitle">告别死板章节打卡，以「25分钟番茄钟」与「字数周平衡」从容通读 93 万字圣经全书</text>
				</view>

				<!-- 定制表单卡片 -->
				<view class="wizard-card">
					<!-- 1. 周期选择 -->
					<text class="wizard-section-title">1. 选择通读节奏</text>
					<view class="cycle-grid">
						<view 
							v-for="opt in cycleOptions" 
							:key="opt.weeks"
							class="cycle-card"
							:class="{ 'cycle-active': planForm.targetWeeks === opt.weeks }"
							@click="planForm.targetWeeks = opt.weeks"
						>
							<view class="cycle-card-top">
								<text class="cycle-name">{{ opt.label }}</text>
								<text class="cycle-badge" :class="'badge-' + opt.weeks">{{ opt.badge }}</text>
							</view>
							<text class="cycle-desc">{{ opt.desc }}</text>
						</view>
					</view>

					<!-- 2. 每日阅读目标字数 -->
					<text class="wizard-section-title" style="margin-top: 32rpx;">2. 每日建议阅读字数</text>
					<view class="target-options">
						<view 
							v-for="opt in targetWordOptions" 
							:key="opt.val" 
							class="target-pill"
							:class="{ 'pill-active': planForm.dailyTargetWords === opt.val }"
							@click="planForm.dailyTargetWords = opt.val"
						>
							<text class="pill-title">{{ opt.label }}</text>
							<text class="pill-desc">{{ opt.desc }}</text>
						</view>
					</view>

					<!-- 3. 日常习惯时段 -->
					<text class="wizard-section-title" style="margin-top: 32rpx;">3. 偏好读经时段</text>
					<view class="slot-list">
						<view 
							v-for="slot in slotOptions" 
							:key="slot.key" 
							class="slot-item"
							:class="{ 'slot-selected': planForm.timeSlot === slot.key }"
							@click="planForm.timeSlot = slot.key"
						>
							<text class="slot-icon">{{ slot.icon }}</text>
							<view class="slot-text-box">
								<text class="slot-name">{{ slot.name }}</text>
								<text class="slot-time">{{ slot.time }}</text>
							</view>
							<text v-if="planForm.timeSlot === slot.key" class="check-mark">✓</text>
						</view>
					</view>

					<!-- 4. 起跑日期选择 -->
					<text class="wizard-section-title" style="margin-top: 32rpx;">4. 计划起跑时间</text>
					<view class="start-date-grid">
						<view 
							v-for="dateOpt in startDateOptions" 
							:key="dateOpt.key"
							class="date-option-pill"
							:class="{ 'date-active': planForm.startDateKey === dateOpt.key }"
							@click="planForm.startDateKey = dateOpt.key"
						>
							<text class="date-pill-title">{{ dateOpt.label }}</text>
							<text class="date-pill-desc">{{ dateOpt.desc }}</text>
						</view>
					</view>

					<!-- 立即开跑开关 -->
					<view class="switch-row" @click="planForm.startImmediately = !planForm.startImmediately">
						<view class="switch-texts">
							<text class="switch-title">创建后立即开跑</text>
							<text class="switch-desc">开启后直接进入进行中主看板；不开启则进入等待开跑期，可集结同行队友</text>
						</view>
						<view class="checkbox-circle" :class="{ 'checkbox-checked': planForm.startImmediately }">
							<text v-if="planForm.startImmediately" class="check-icon">✓</text>
						</view>
					</view>

					<!-- 创建计划主按钮 -->
					<button class="create-submit-btn" @click="submitCreatePlan">
						立即生成读经计划
					</button>
				</view>

				<!-- 理念指引卡片 -->
				<view class="wizard-info-card">
					<text class="info-title">💡 为什么采用「字数动态结合法」？</text>
					<view class="info-item">
						<text class="info-dot">·</text>
						<text class="info-text">不以死板章节论断：圣经各章长短不一（如诗篇117篇仅2节，诗篇119篇176节），按字数定量才能平滑每天专注负担。</text>
					</view>
					<view class="info-item">
						<text class="info-dot">·</text>
						<text class="info-text">以周为总账动态调平：单日即使忙碌未读也不必自责，周内任意一天补足即可，节奏有弹性更持久。</text>
					</view>
					<view class="info-item">
						<text class="info-dot">·</text>
						<text class="info-text">硬菜搭配甘泉双轨分流：遇到厚重历史书或律法书时，自动搭配诗篇或新约甜点，避免读得枯燥吃撑。</text>
					</view>
				</view>
			</view>

			<!-- ==================== 2. COLD_START 等待开跑 / 冷启动阶段 ==================== -->
			<view v-else-if="planData.status === PLAN_STATUS.COLD_START" class="cold-start-section">
				<!-- 等待开跑主卡片 -->
				<view class="cold-hero-card">
					<view class="setting-btn-circle inline-setting-btn" @click="openSettingModal" title="设置">
						<text class="setting-icon-text">⚙</text>
					</view>
					<view class="content-user-header cold-user-header" @click="handleUserPillClick">
						<image v-if="isLoggedIn" class="content-user-avatar" :src="getAvatarDisplayUrl(currentUser.avatarUrl)" mode="aspectFill"></image>
						<view v-else class="content-user-avatar-placeholder"><text>微信</text></view>
						<view class="content-user-info">
							<view class="content-user-title-row">
								<text class="content-user-name">{{ isLoggedIn ? currentUser.nickname : '书卷同行者' }}</text>
								<text class="content-user-edit-tag">更换资料 ✎</text>
							</view>
							<text class="content-user-sub">通读计划制定人 · 整装待发</text>
						</view>
					</view>

					<view class="cold-status-badge">
						<text class="cold-badge-icon">⏳</text>
						<text class="cold-badge-text">读经计划已锁定 · 等待开跑</text>
					</view>
					<text class="cold-title">{{ planData.planName }}</text>
					<text class="cold-subtitle">计划将于 <text class="highlight-date">{{ planData.startDate }}</text> 正式开跑</text>

					<!-- 倒计时 / 预备天数展示 -->
					<view class="countdown-panel">
						<view class="countdown-box">
							<text class="countdown-num">{{ daysUntilStart }}</text>
							<text class="countdown-unit">天后开跑</text>
						</view>
						<view class="countdown-desc-box">
							<text class="cd-desc-title">充裕准备，整装待发</text>
							<text class="cd-desc-sub">预备好每天的 25 分钟安静时段，也可以提前开跑！</text>
						</view>
					</view>

					<!-- 核心目标清单 -->
					<view class="cold-meta-grid">
						<view class="cold-meta-item">
							<text class="cold-meta-val">{{ (planData.totalBibleWords / 10000).toFixed(0) }}万字</text>
							<text class="cold-meta-lbl">全书总字数</text>
						</view>
						<view class="cold-meta-divider"></view>
						<view class="cold-meta-item">
							<text class="cold-meta-val">{{ planData.targetWeeks }}周</text>
							<text class="cold-meta-lbl">规划周期</text>
						</view>
						<view class="cold-meta-divider"></view>
						<view class="cold-meta-item">
							<text class="cold-meta-val">{{ planData.dailyTargetWords }}字</text>
							<text class="cold-meta-lbl">每日建议</text>
						</view>
					</view>

					<!-- 提前开跑主按钮 -->
					<button class="start-scaling-btn" @click="startRealPlan">
						<text class="btn-icon">🚀</text>
						<text class="btn-text">正式开启读经计划（提前开跑）</text>
					</button>

					<view class="cold-actions-row">
						<text class="cold-modify-btn" @click="editPlanConfig">修改设定</text>
					</view>
				</view>

				<!-- 组队同行提前集结卡片 -->
				<view class="team-banner-card" @click="goToTeam">
					<view class="team-card-left">
						<view class="team-icon-circle">
							<text class="team-card-icon">👥</text>
						</view>
						<view class="team-card-texts">
							<view class="team-card-title-row">
								<text class="team-card-title">{{ teamDashboard ? teamDashboard.team.teamName : '集结读经小队·同行开跑' }}</text>
								<text v-if="teamDashboard" class="team-code-tag">邀请码 {{ teamDashboard.team.teamCode }}</text>
							</view>
							<text class="team-card-desc" v-if="teamDashboard">
								小队已有 {{ teamDashboard.totalCount }} 位同行者，准备一同启程
							</text>
							<text class="team-card-desc" v-else>
								开跑前先拉上 2-4 位属灵好友，互相守望，成倍提高完读率
							</text>
						</view>
					</view>
					<text class="team-card-arrow">➔</text>
				</view>

				<!-- 预备锦囊 -->
				<view class="tips-card">
					<text class="tips-card-title">📖 开跑前准备锦囊</text>
					<view class="tip-line">
						<text class="tip-num">1</text>
						<text class="tip-content">固定阅读场所：每天在 {{ timeSlotLabel }} 预留 25 分钟，不受手机打扰。</text>
					</view>
					<view class="tip-line">
						<text class="tip-num">2</text>
						<text class="tip-content">从容接受落后：若某天忙碌落下，周日会自动调平总账，不要轻言放弃。</text>
					</view>
					<view class="tip-line">
						<text class="tip-num">3</text>
						<text class="tip-content">随时可以提前开跑：点击上方「提前开跑」按钮，第一天阅读即刻开启！</text>
					</view>
				</view>
			</view>

			<!-- ==================== 3. SCALING 进行中 / COMPLETED 已完成阶段 ==================== -->
			<view v-else class="scaling-section">
				<!-- 今日番茄专注与字数达成卡片 -->
				<view class="focus-card">
					<view class="focus-header">
						<view class="content-user-header focus-user-header" @click="handleUserPillClick">
							<image v-if="isLoggedIn" class="content-user-avatar" :src="getAvatarDisplayUrl(currentUser.avatarUrl)" mode="aspectFill"></image>
							<view v-else class="content-user-avatar-placeholder"><text>微信</text></view>
							<view class="content-user-info">
								<view class="content-user-title-row">
									<text class="content-user-name">{{ isLoggedIn ? currentUser.nickname : '书卷同行者' }}</text>
									<text class="content-user-edit-tag">✎</text>
								</view>
								<text class="content-greeting-txt">{{ greetingText }}</text>
							</view>
						</view>
						<view class="focus-header-right">
							<view class="streak-badge">
								<text class="streak-num">🔥 {{ planData.streakDays || 1 }}</text>
								<text class="streak-label">天连读</text>
							</view>
							<view class="setting-btn-circle" @click="openSettingModal" title="设置">
								<text class="setting-icon-text">⚙</text>
							</view>
						</view>
					</view>

					<view class="slot-target-strip">
						<text class="strip-text">日常习惯：{{ timeSlotLabel }} · 每日配额：{{ planData.dailyTargetWords || 5000 }} 字/天</text>
					</view>

					<!-- 今日字数进度 -->
					<view class="today-words-panel">
						<view class="today-words-row">
							<text class="today-title">今日阅读字数</text>
							<text class="today-val">
								<text class="cur-words">{{ todayFinishedWords.toLocaleString() }}</text>
								<text class="target-words"> / {{ (planData.dailyTargetWords || 5000).toLocaleString() }} 字</text>
							</text>
						</view>
						<view class="progress-bar-bg">
							<view class="progress-bar-fill" :style="{ width: todayWordsPercent + '%' }"></view>
						</view>
						<view class="today-status-row">
							<text class="today-pct">{{ todayWordsPercent }}% 达成</text>
							<text v-if="todayWordsPercent >= 100" class="today-done-tip">🎉 今日配额已圆满达成！</text>
							<text v-else class="today-left-tip">约需 1 个 25 分钟番茄钟搞定</text>
						</view>
					</view>

					<view class="focus-timer-body">
						<view class="focus-stats">
							<view class="stat-item">
								<text class="stat-val">{{ planData.todayFocusMinutes || 0 }}<text class="unit">分</text></text>
								<text class="stat-lbl">今日专注</text>
							</view>
							<view class="stat-divider"></view>
							<view class="stat-item">
								<text class="stat-val">{{ (weeklySummary.weekFinishedWords / 1000).toFixed(1) }}<text class="unit">k</text></text>
								<text class="stat-lbl">本周字数</text>
							</view>
							<view class="stat-divider"></view>
							<view class="stat-item">
								<text class="stat-val">{{ (totalFinishedWords / 10000).toFixed(1) }}<text class="unit">万</text></text>
								<text class="stat-lbl">全书累计/93万</text>
							</view>
						</view>

						<button class="start-focus-btn" @click="startQuickFocus">
							<text class="btn-icon">⏱</text>
							<text class="btn-text">开启 25 分钟专注读经</text>
						</button>
						<text class="focus-hint">按字数定量，时间一到收工，单日有弹性，从容无压力</text>
					</view>
				</view>

				<!-- 读经小队同行入口卡片 -->
				<view class="team-banner-card" @click="goToTeam">
					<view class="team-card-left">
						<view class="team-icon-circle">
							<text class="team-card-icon">👥</text>
						</view>
						<view class="team-card-texts">
							<view class="team-card-title-row">
								<text class="team-card-title">{{ teamDashboard ? teamDashboard.team.teamName : '读经小队·组团同行' }}</text>
								<text v-if="teamDashboard" class="team-code-tag">邀请码 {{ teamDashboard.team.teamCode }}</text>
							</view>
							<text class="team-card-desc" v-if="teamDashboard">
								今日全队齐心率 {{ teamDashboard.teamProgressPercent }}% · {{ teamDashboard.finishedCount }}/{{ teamDashboard.totalCount }} 人已达标
							</text>
							<text class="team-card-desc" v-else>
								两个人总比一个人好，邀请好友组团打卡，互看进展
							</text>
						</view>
					</view>
					<text class="team-card-arrow">➔</text>
				</view>

				<!-- 本周字数总账弹性平衡看板（以周为单位检查总账，点击进入各周明细页面） -->
				<view class="weekly-card clickable-weekly-card" @click="goToPlanHistory">
					<view class="weekly-title-row">
						<view class="weekly-title-group">
							<text class="card-title">本周字数总账平衡</text>
							<text class="week-pill">第 {{ weeklySummary.currentWeekNumber }}/{{ weeklySummary.totalWeeks }} 周</text>
						</view>
						<view class="weekly-status-group">
							<text class="status-tag" :class="statusClass">{{ statusLabel }}</text>
							<text class="detail-link-text">各周明细 ➔</text>
						</view>
					</view>

					<view class="progress-bar-bg week-bar">
						<view class="progress-bar-fill week-fill" :style="{ width: weeklyProgressPercent + '%' }"></view>
					</view>
					<view class="progress-labels">
						<text class="progress-num">{{ weeklySummary.weekFinishedWords.toLocaleString() }} / {{ weeklySummary.weeklyTargetWords.toLocaleString() }} 字</text>
						<text class="progress-pct">{{ weeklyProgressPercent }}% (点击查看各周)</text>
					</view>

					<view class="encourage-box">
						<text class="encourage-icon">💡</text>
						<text class="encourage-text">{{ weeklySummary.tips }}</text>
					</view>
				</view>

				<!-- 今日智能配额推荐（字数切片，避免吃撑硬菜） -->
				<view class="recommend-section">
					<view class="section-header">
						<view class="header-left">
							<text class="section-title">今日推荐篇章</text>
							<text class="mode-badge" :class="{ 'split-badge': recommendation.isSplitMode }">
								{{ recommendation.isSplitMode ? '双轨分流搭配' : '单轨顺畅连读' }}
							</text>
						</view>
						<text class="total-words-badge">共约 {{ recommendation.totalRecommendedWords }} 字</text>
					</view>

					<view v-if="recommendation.dynamicPillTip" class="dynamic-target-pill">
						<text class="pill-dot">⚡</text>
						<text class="pill-msg">{{ recommendation.dynamicPillTip }}</text>
					</view>

					<view class="mode-desc-card">
						<text class="mode-desc-text">{{ recommendation.modeDesc }}</text>
					</view>

					<!-- 主轨清单 -->
					<view class="track-block" v-if="recommendation.mainList && recommendation.mainList.length > 0">
						<view class="track-header" style="justify-content: space-between;">
							<view style="display: flex; align-items: center;">
								<text class="track-tag main-tag">主轨</text>
								<text class="track-name">{{ recommendation.mainTrackTitle }}</text>
							</view>
							<text class="change-track-btn" @click="changeTrack('main')">替换章节 ➔</text>
						</view>

						<view class="chapter-list">
							<view 
								v-for="item in recommendation.mainList" 
								:key="item.sn + '-' + item.chapter" 
								class="chapter-row"
								:class="{ 'row-finished': item.isFinished }"
								@click="openReading(item)"
							>
								<view class="chapter-info">
									<view class="name-box">
										<text class="book-name-text">{{ item.bookName }} 第 {{ item.chapter }} 章</text>
										<text class="words-est">约 {{ item.words }} 字</text>
									</view>
									<text class="genre-tag" :class="getGenreClass(item.difficulty)">{{ item.tag }}</text>
								</view>
								<view class="action-box">
									<text v-if="item.isFinished" class="done-tag">已读 ✔</text>
									<text v-else class="read-btn">读经 ➔</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 辅轨清单（新约/诗篇甜点，分流时展示） -->
					<view v-if="recommendation.isSplitMode && recommendation.subList.length > 0" class="track-block sub-track-block">
						<view class="track-header" style="justify-content: space-between;">
							<view style="display: flex; align-items: center;">
								<text class="track-tag sub-tag">辅轨·甘泉搭配</text>
								<text class="track-name">{{ recommendation.subTrackTitle }}</text>
							</view>
							<text class="change-track-btn" @click="changeTrack('sub')">替换章节 ➔</text>
						</view>

						<view class="chapter-list">
							<view 
								v-for="item in recommendation.subList" 
								:key="item.sn + '-' + item.chapter" 
								class="chapter-row"
								:class="{ 'row-finished': item.isFinished }"
								@click="openReading(item)"
							>
								<view class="chapter-info">
									<view class="name-box">
										<text class="book-name-text">{{ item.bookName }} 第 {{ item.chapter }} 章</text>
										<text class="words-est">约 {{ item.words }} 字</text>
									</view>
									<text class="genre-tag sweet-tag">{{ item.tag }}</text>
								</view>
								<view class="action-box">
									<text v-if="item.isFinished" class="done-tag">已读 ✔</text>
									<text v-else class="read-btn sweet-btn">读经 ➔</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 计划重置 -->
				<view class="footer-card">
					<view class="footer-btn-row">
						<button class="footer-btn" @click="confirmResetPlan">重新设定计划</button>
					</view>
					<text class="footer-version">字数动态结合法引擎 V2.0 · 专注与弹性平衡</text>
				</view>
			</view>
		</scroll-view>

		<!-- 设置弹窗（时段偏好 + 每日字数目标档位） -->
		<view v-if="showSettingModal" class="modal-mask" @click="closeSettingModal">
			<view class="modal-body" @click.stop>
				<text class="modal-title">个性化读经设置</text>

				<!-- 每日字数档位 -->
				<text class="section-subhead">每日阅读字数目标</text>
				<view class="target-options">
					<view 
						v-for="opt in targetWordOptions" 
						:key="opt.val" 
						class="target-pill"
						:class="{ 'pill-active': planData.dailyTargetWords === opt.val }"
						@click="changeDailyWords(opt.val)"
					>
						<text class="pill-title">{{ opt.label }}</text>
						<text class="pill-desc">{{ opt.desc }}</text>
					</view>
				</view>

				<!-- 读经时段 -->
				<text class="section-subhead">日常习惯时段</text>
				<view class="slot-list">
					<view 
						v-for="slot in slotOptions" 
						:key="slot.key" 
						class="slot-item"
						:class="{ 'slot-selected': planData.timeSlot === slot.key }"
						@click="selectSlot(slot.key)"
					>
						<text class="slot-icon">{{ slot.icon }}</text>
						<view class="slot-text-box">
							<text class="slot-name">{{ slot.name }}</text>
							<text class="slot-time">{{ slot.time }}</text>
						</view>
						<text v-if="planData.timeSlot === slot.key" class="check-mark">✓</text>
					</view>
				</view>

				<button class="modal-close-btn" @click="closeSettingModal">保存完成</button>
			</view>
		</view>

		<!-- 微信官方真实授权拦截弹窗（居中悬浮卡片，彻底避免被底部输入法/快捷昵称栏遮挡） -->
		<view v-if="showAuthModal" class="auth-modal-mask" @click="handleAuthMaskClick">
			<view class="auth-dialog-card" @click.stop>
				<view class="auth-header-row">
					<view class="auth-title-group">
						<text class="auth-dialog-title">微信资料授权</text>
						<text class="auth-dialog-sub">开启读经计划前，请授权微信资料绑定专属账本</text>
					</view>
					<text v-if="isLoggedIn" class="auth-close-btn" @click="closeAuthModal">✕</text>
				</view>

				<view class="auth-form-container">
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
						<text class="choose-avatar-tip">点击选用微信真实头像</text>
					</view>

					<!-- 微信官方真实昵称输入框 -->
					<view class="input-field">
						<view class="field-label-row">
							<text class="field-label">微信昵称</text>
						</view>
						<!-- #ifdef MP-WEIXIN -->
						<input 
							name="nickname"
							type="nickname"
							class="text-input"
							:value="authForm.nickname"
							:adjust-position="true"
							:cursor-spacing="30"
							placeholder="点击获取微信昵称，或手动输入"
							@blur="onNicknameBlur"
							@input="onNicknameInput"
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

					<button class="auth-green-btn" @click="confirmRealWechatAuth" :loading="isAuthenticating">
						微信官方授权并开启计划
					</button>
				</view>
			</view>
		</view>
		</view> <!-- 闭合 real-plan-view -->
	</view>
</template>

<script src="./plan.js"></script>

<style scoped src="./plan.css"></style>
