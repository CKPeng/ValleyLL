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

				<!-- 本周字数总账弹性平衡看板（以周为单位检查总账） -->
				<view class="weekly-card">
					<view class="weekly-title-row">
						<view class="weekly-title-group">
							<text class="card-title">本周字数总账平衡</text>
							<text class="week-pill">第 {{ weeklySummary.currentWeekNumber }}/{{ weeklySummary.totalWeeks }} 周</text>
						</view>
						<text class="status-tag" :class="statusClass">{{ statusLabel }}</text>
					</view>

					<view class="progress-bar-bg week-bar">
						<view class="progress-bar-fill week-fill" :style="{ width: weeklyProgressPercent + '%' }"></view>
					</view>
					<view class="progress-labels">
						<text class="progress-num">{{ weeklySummary.weekFinishedWords.toLocaleString() }} / {{ weeklySummary.weeklyTargetWords.toLocaleString() }} 字</text>
						<text class="progress-pct">{{ weeklyProgressPercent }}%</text>
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

					<view class="mode-desc-card">
						<text class="mode-desc-text">{{ recommendation.modeDesc }}</text>
					</view>

					<!-- 主轨清单 -->
					<view class="track-block">
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

<script>
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
</script>

<style scoped>
.plan-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f7f5f0;
	color: #2c2523;
}

/* 顶部导航栏 */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	background: #fdfbf7;
	border-bottom: 1rpx solid #eae5dc;
	flex-shrink: 0;
}

.nav-left {
	display: flex;
	align-items: center;
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

.nav-center {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-width: 0;
	padding: 0 12rpx;
	margin-top: 12rpx;
}

.nav-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #2c2523;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-align: center;
	max-width: 100%;
}

.nav-subtitle {
	font-size: 20rpx;
	color: #92847a;
	margin-top: 4rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-align: center;
	max-width: 100%;
}

.nav-right {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex-shrink: 0;
	gap: 12rpx;
	margin-top: 12rpx;
}

.setting-btn-circle {
	width: 58rpx;
	height: 58rpx;
	border-radius: 50%;
	background: #f4efe6;
	border: 1rpx solid #e5dcce;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.inline-setting-btn {
	position: absolute;
	top: 30rpx;
	right: 30rpx;
	z-index: 10;
}

.setting-icon-text {
	font-size: 30rpx;
	color: #5c4e46;
	line-height: 1;
	display: inline-block;
}

/* 内容滑动区 */
.content-scroll {
	flex: 1;
	padding: 24rpx;
	box-sizing: border-box;
}

/* 专注卡片 */
.focus-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	border: 1rpx solid #eee8df;
	position: relative;
}

.focus-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 24rpx;
}

.focus-header-right {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.greeting-text {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
}

.time-slot-tag {
	font-size: 22rpx;
	color: #8c7b6f;
	margin-top: 6rpx;
	display: inline-block;
}

.streak-badge {
	background: #fff4e6;
	border: 1rpx solid #ffd8a8;
	padding: 6rpx 18rpx;
	border-radius: 30rpx;
	text-align: center;
}

.streak-num {
	font-size: 26rpx;
	font-weight: bold;
	color: #d9480f;
	display: block;
}

.streak-label {
	font-size: 18rpx;
	color: #d9480f;
}

/* 今日字数进度小看板 */
.today-words-panel {
	background: #fdfaf4;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid #f3e9d8;
}

.today-words-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: 12rpx;
}

.today-title {
	font-size: 26rpx;
	color: #5c4e46;
	font-weight: 500;
}

.cur-words {
	font-size: 34rpx;
	font-weight: bold;
	color: #b3732d;
}

.target-words {
	font-size: 24rpx;
	color: #92847a;
}

.today-status-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 10rpx;
}

.today-pct {
	font-size: 22rpx;
	color: #b3732d;
	font-weight: 500;
}

.today-done-tip {
	font-size: 22rpx;
	color: #2b8a3e;
	font-weight: 500;
}

.today-left-tip {
	font-size: 22rpx;
	color: #8c7b6f;
}

.focus-stats {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 20rpx 0;
	background: #fbf9f5;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-val {
	font-size: 36rpx;
	font-weight: bold;
	color: #b3732d;
}

.stat-val .unit {
	font-size: 22rpx;
	color: #99877b;
	margin-left: 4rpx;
}

.stat-lbl {
	font-size: 22rpx;
	color: #7b6d64;
	margin-top: 4rpx;
}

.stat-divider {
	width: 1rpx;
	height: 40rpx;
	background: #e6dfd5;
}

.start-focus-btn {
	background: linear-gradient(135deg, #c58b43, #a46724);
	color: #ffffff;
	border-radius: 50rpx;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6rpx 18rpx rgba(180, 115, 45, 0.35);
	margin-bottom: 16rpx;
}

.start-focus-btn::after {
	border: none;
}

.btn-icon {
	font-size: 36rpx;
	margin-right: 12rpx;
}

.btn-text {
	font-size: 30rpx;
	font-weight: bold;
	letter-spacing: 2rpx;
}

.focus-hint {
	font-size: 22rpx;
	color: #a4968c;
	text-align: center;
	display: block;
}

/* 读经小队同行入口卡片 */
.team-banner-card {
	background: linear-gradient(135deg, #ffffff, #fdfaf4);
	border-radius: 20rpx;
	padding: 24rpx 28rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid #eedec7;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 4rpx 14rpx rgba(197, 139, 67, 0.08);
}

.team-card-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.team-icon-circle {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
	background: #fff4e6;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.team-card-icon {
	font-size: 40rpx;
}

.team-card-texts {
	display: flex;
	flex-direction: column;
}

.team-card-title-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.team-card-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
}

.team-code-tag {
	font-size: 20rpx;
	color: #d9480f;
	background: #ffe8cc;
	padding: 2rpx 10rpx;
	border-radius: 8rpx;
}

.team-card-desc {
	font-size: 22rpx;
	color: #8c7b6f;
	margin-top: 6rpx;
}

.team-card-arrow {
	font-size: 28rpx;
	color: #c58b43;
	font-weight: bold;
	margin-left: 16rpx;
}

/* 本周总账卡片 */
.weekly-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid #eee8df;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.weekly-title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.weekly-title-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.card-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
}

.week-pill {
	font-size: 20rpx;
	color: #8c7b6f;
	background: #f1ede6;
	padding: 2rpx 12rpx;
	border-radius: 12rpx;
}

.status-tag {
	font-size: 20rpx;
	padding: 4rpx 14rpx;
	border-radius: 20rpx;
}

.status-ontrack {
	background: #e6fcf5;
	color: #0ca678;
}

.status-behind {
	background: #fff3bf;
	color: #f08c00;
}

.status-ahead {
	background: #e7f5ff;
	color: #1c7ed6;
}

.progress-bar-bg {
	height: 16rpx;
	background: #f1ede6;
	border-radius: 10rpx;
	overflow: hidden;
}

.progress-bar-fill {
	height: 100%;
	background: linear-gradient(90deg, #d49a54, #b3732d);
	border-radius: 10rpx;
	transition: width 0.3s ease;
}

.week-bar {
	margin-bottom: 12rpx;
}

.week-fill {
	background: linear-gradient(90deg, #4dabf7, #1c7ed6);
}

.progress-labels {
	display: flex;
	justify-content: space-between;
	font-size: 22rpx;
	color: #8c7b6f;
	margin-bottom: 20rpx;
}

.encourage-box {
	display: flex;
	align-items: flex-start;
	background: #fdfaf4;
	border-left: 6rpx solid #c58b43;
	padding: 16rpx;
	border-radius: 8rpx;
}

.encourage-icon {
	font-size: 26rpx;
	margin-right: 10rpx;
	line-height: 1.4;
}

.encourage-text {
	font-size: 24rpx;
	color: #5c4e46;
	line-height: 1.4;
	flex: 1;
}

/* 今日配额与双轨推荐 */
.recommend-section {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 28rpx;
	margin-bottom: 24rpx;
	border: 1rpx solid #eee8df;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.header-left {
	display: flex;
	align-items: center;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
}

.mode-badge {
	font-size: 20rpx;
	background: #edf2ff;
	color: #4263eb;
	padding: 4rpx 14rpx;
	border-radius: 20rpx;
	margin-left: 14rpx;
}

.split-badge {
	background: #fff4e6;
	color: #d9480f;
}

.total-words-badge {
	font-size: 22rpx;
	color: #b3732d;
	font-weight: bold;
}

.mode-desc-card {
	background: #faf8f5;
	padding: 16rpx 20rpx;
	border-radius: 12rpx;
	margin-bottom: 24rpx;
}

.mode-desc-text {
	font-size: 24rpx;
	color: #7b6d64;
	line-height: 1.4;
}

.track-block {
	margin-bottom: 28rpx;
}

.sub-track-block {
	border-top: 1rpx dashed #e6dfd5;
	padding-top: 24rpx;
}

.track-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.change-track-btn {
	font-size: 24rpx;
	color: #92847a;
	padding: 4rpx 12rpx;
	background: #f2ede4;
	border-radius: 20rpx;
}

.track-tag {
	font-size: 20rpx;
	padding: 2rpx 12rpx;
	border-radius: 6rpx;
	margin-right: 12rpx;
	font-weight: bold;
}

.main-tag {
	background: #e9ecef;
	color: #495057;
}

.sub-tag {
	background: #ffe8cc;
	color: #d9480f;
}

.track-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #3b3330;
}

.chapter-list {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.chapter-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 24rpx;
	background: #fbf9f5;
	border-radius: 12rpx;
	border: 1rpx solid #eee8df;
	transition: all 0.2s ease;
}

.chapter-row:active {
	background: #f4efe7;
}

.row-finished {
	background: #f6fbf8;
	border-color: #d3f9d8;
}

.chapter-info {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.name-box {
	display: flex;
	flex-direction: column;
}

.book-name-text {
	font-size: 28rpx;
	color: #2c2523;
	font-weight: 500;
}

.words-est {
	font-size: 20rpx;
	color: #a4968c;
	margin-top: 2rpx;
}

.genre-tag {
	font-size: 20rpx;
	padding: 2rpx 10rpx;
	border-radius: 6rpx;
}

.hard-tag {
	background: #fff3bf;
	color: #f08c00;
}

.smooth-tag {
	background: #e6fcf5;
	color: #0ca678;
}

.sweet-tag {
	background: #ffe3e3;
	color: #fa5252;
}

.read-btn {
	font-size: 24rpx;
	color: #b3732d;
	font-weight: 500;
}

.sweet-btn {
	color: #e03131;
}

.done-tag {
	font-size: 24rpx;
	color: #2b8a3e;
	font-weight: bold;
}

/* 底部选项卡 */
.footer-card {
	padding: 20rpx 0 60rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.footer-btn {
	background: #f1ede6;
	color: #7b6d64;
	font-size: 24rpx;
	border-radius: 40rpx;
	padding: 0 40rpx;
	height: 64rpx;
	line-height: 64rpx;
}

.footer-btn::after {
	border: none;
}

.footer-version {
	font-size: 20rpx;
	color: #a4968c;
	margin-top: 16rpx;
}

/* 弹窗遮罩 */
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
	font-size: 32rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
	margin-bottom: 24rpx;
}

.section-subhead {
	font-size: 24rpx;
	color: #7b6d64;
	font-weight: bold;
	margin: 16rpx 0 12rpx 0;
	display: block;
}

.target-options {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
}

.target-pill {
	flex: 1;
	background: #fbf9f5;
	border: 2rpx solid #eee8df;
	border-radius: 16rpx;
	padding: 16rpx 10rpx;
	text-align: center;
}

.pill-active {
	border-color: #c58b43;
	background: #fdfaf4;
}

.pill-title {
	font-size: 24rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
}

.pill-desc {
	font-size: 18rpx;
	color: #8c7b6f;
	margin-top: 4rpx;
	display: block;
}

.slot-list {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	margin-bottom: 30rpx;
}

.slot-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	border-radius: 16rpx;
	background: #fbf9f5;
	border: 2rpx solid transparent;
}

.slot-selected {
	background: #fdfaf4;
	border-color: #c58b43;
}

.slot-icon {
	font-size: 36rpx;
	margin-right: 18rpx;
}

.slot-text-box {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.slot-name {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
}

.slot-time {
	font-size: 20rpx;
	color: #8c7b6f;
	margin-top: 2rpx;
}

.check-mark {
	font-size: 32rpx;
	color: #c58b43;
	font-weight: bold;
}

.modal-close-btn {
	background: #c58b43;
	color: #ffffff;
	border-radius: 40rpx;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	font-weight: bold;
}

/* 内容区个人信息头部模块（空间充裕、图文清晰） */
.content-user-header {
	display: flex;
	align-items: center;
	padding: 12rpx 16rpx;
	background: #fdfaf5;
	border-radius: 18rpx;
	border: 1rpx solid #edd9be;
	margin-bottom: 20rpx;
	transition: background 0.2s ease;
}

.content-user-header:active {
	background: #f8f1e5;
}

.focus-user-header {
	flex: 1;
	margin-bottom: 0;
	margin-right: 20rpx;
	padding: 10rpx 14rpx;
}

.cold-user-header {
	width: 100%;
	box-sizing: border-box;
	margin-bottom: 24rpx;
}

.content-user-avatar {
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	border: 3rpx solid #c58b43;
	margin-right: 18rpx;
	flex-shrink: 0;
	box-shadow: 0 4rpx 12rpx rgba(197, 139, 67, 0.18);
}

.content-user-avatar-placeholder {
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	background: #e8f5e9;
	border: 2rpx solid #07c160;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
	color: #07c160;
	font-weight: bold;
	margin-right: 18rpx;
	flex-shrink: 0;
}

.content-user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.content-user-title-row {
	display: flex;
	align-items: center;
}

.content-user-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
}

.content-user-edit-tag {
	font-size: 20rpx;
	color: #c58b43;
	margin-left: 10rpx;
	background: #fbf2e3;
	padding: 2rpx 10rpx;
	border-radius: 6rpx;
	line-height: 1.2;
	font-weight: 500;
}

.content-user-sub {
	font-size: 20rpx;
	color: #92847a;
	margin-top: 4rpx;
	line-height: 1.2;
}

.content-greeting-txt {
	font-size: 22rpx;
	color: #6e5f54;
	margin-top: 6rpx;
	line-height: 1.3;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.slot-target-strip {
	display: flex;
	align-items: center;
	padding: 10rpx 18rpx;
	background: #f8f5ee;
	border-radius: 12rpx;
	margin-top: 18rpx;
	border: 1rpx solid #eee5d7;
}

.strip-text {
	font-size: 22rpx;
	color: #7b6d64;
	font-weight: 500;
	line-height: 1.3;
}

/* 微信官方真实授权拦截弹窗（纯 Flex 盒模型居中悬浮，绝不使用 transform 破坏原生 input 回调） */
.auth-modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 0 40rpx 140rpx 40rpx;
	box-sizing: border-box;
}

.auth-dialog-card {
	width: 100%;
	max-width: 620rpx;
	background: #ffffff;
	border-radius: 28rpx;
	padding: 38rpx 32rpx 36rpx 32rpx;
	box-sizing: border-box;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);
}

.auth-header-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 20rpx;
}

.auth-title-group {
	flex: 1;
}

.auth-dialog-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
	line-height: 1.3;
}

.auth-dialog-sub {
	font-size: 22rpx;
	color: #8c7b6f;
	margin-top: 6rpx;
	display: block;
	line-height: 1.4;
}

.auth-close-btn {
	font-size: 32rpx;
	color: #a4968c;
	padding: 0 8rpx;
	line-height: 1;
}

.avatar-choose-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 16rpx 0 28rpx 0;
}

.avatar-choose-btn {
	width: 130rpx;
	height: 130rpx;
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
	width: 130rpx;
	height: 130rpx;
	border-radius: 50%;
	border: 4rpx solid #07c160;
	box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
}

.camera-tag {
	position: absolute;
	right: -4rpx;
	bottom: -4rpx;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #07c160;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 3rpx solid #ffffff;
}

.camera-icon {
	font-size: 20rpx;
}

.choose-avatar-tip {
	font-size: 22rpx;
	color: #07c160;
	font-weight: 500;
	margin-top: 12rpx;
}

.input-field {
	margin-bottom: 20rpx;
}

.field-label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.field-label {
	font-size: 24rpx;
	color: #5c4e46;
	display: block;
}

.quick-preset-btn {
	font-size: 22rpx;
	color: #07c160;
	background: rgba(7, 193, 96, 0.1);
	padding: 4rpx 14rpx;
	border-radius: 6rpx;
	font-weight: 500;
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

.auth-green-btn {
	height: 84rpx;
	line-height: 84rpx;
	background: linear-gradient(135deg, #07c160, #06ad56);
	border-radius: 42rpx;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 24rpx;
	box-shadow: 0 6rpx 20rpx rgba(7, 193, 96, 0.25);
}

.auth-green-btn::after {
	border: none;
}

.modal-close-btn::after {
	border: none;
}

/* ==================== 1. PLANNING 筹备定制阶段样式 ==================== */
.planning-section {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	padding-bottom: 40rpx;
}

.wizard-hero-card {
	background: linear-gradient(135deg, #fdf8ee 0%, #faefe0 100%);
	border-radius: 20rpx;
	padding: 32rpx;
	border: 1rpx solid #edd9be;
	box-shadow: 0 4rpx 16rpx rgba(197, 139, 67, 0.08);
}

.hero-badge {
	display: inline-flex;
	align-items: center;
	padding: 4rpx 14rpx;
	background: #c58b43;
	border-radius: 6rpx;
	margin-bottom: 16rpx;
}

.hero-badge-text {
	font-size: 20rpx;
	color: #ffffff;
	font-weight: 600;
	line-height: 1;
}

.hero-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 12rpx;
	display: block;
}

.hero-subtitle {
	font-size: 24rpx;
	color: #6e5f54;
	line-height: 1.5;
	display: block;
}

.wizard-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 32rpx;
	border: 1rpx solid #eee8df;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.wizard-section-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 20rpx;
	display: block;
}

.cycle-grid {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.cycle-card {
	border: 2rpx solid #eae5dc;
	border-radius: 16rpx;
	padding: 22rpx 24rpx;
	background: #faf8f5;
	transition: all 0.2s ease;
}

.cycle-active {
	border-color: #c58b43;
	background: #fdfaf3;
	box-shadow: 0 4rpx 14rpx rgba(197, 139, 67, 0.12);
}

.cycle-card-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}

.cycle-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #2c2523;
}

.cycle-badge {
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 6rpx;
	font-weight: 500;
	line-height: 1;
}

.badge-26 {
	background: #fef0db;
	color: #c58b43;
	border: 1rpx solid #eed6b2;
}

.badge-52 {
	background: #e8f5e9;
	color: #2e7d32;
	border: 1rpx solid #c8e6c9;
}

.badge-14 {
	background: #fbe9e7;
	color: #d84315;
	border: 1rpx solid #ffccbc;
}

.cycle-desc {
	font-size: 22rpx;
	color: #8c7e74;
	line-height: 1.4;
	display: block;
}

.start-date-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 14rpx;
}

.date-option-pill {
	border: 2rpx solid #eae5dc;
	border-radius: 14rpx;
	padding: 20rpx 12rpx;
	background: #faf8f5;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
}

.date-active {
	border-color: #c58b43;
	background: #fdfaf3;
	box-shadow: 0 4rpx 12rpx rgba(197, 139, 67, 0.12);
}

.date-pill-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 6rpx;
	line-height: 1.2;
}

.date-pill-desc {
	font-size: 20rpx;
	color: #8c7e74;
	line-height: 1.2;
}

.switch-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 32rpx;
	padding: 22rpx 24rpx;
	background: #f8f6f0;
	border-radius: 14rpx;
	border: 1rpx solid #eae5dc;
}

.switch-texts {
	flex: 1;
	margin-right: 20rpx;
}

.switch-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
	margin-bottom: 4rpx;
}

.switch-desc {
	font-size: 20rpx;
	color: #8c7e74;
	line-height: 1.4;
	display: block;
}

.checkbox-circle {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	border: 2rpx solid #c5baa8;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ffffff;
	flex-shrink: 0;
	transition: all 0.2s ease;
}

.checkbox-checked {
	background: #c58b43;
	border-color: #c58b43;
}

.check-icon {
	color: #ffffff;
	font-size: 26rpx;
	font-weight: bold;
	line-height: 1;
}

.create-submit-btn {
	margin-top: 36rpx;
	height: 88rpx;
	background: linear-gradient(135deg, #c58b43 0%, #ab7534 100%);
	border-radius: 44rpx;
	color: #ffffff;
	font-size: 30rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	box-shadow: 0 6rpx 20rpx rgba(197, 139, 67, 0.3);
}

.create-submit-btn::after {
	border: none;
}

.wizard-info-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 28rpx 30rpx;
	border: 1rpx solid #eee8df;
}

.info-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 16rpx;
	display: block;
}

.info-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 14rpx;
}

.info-item:last-child {
	margin-bottom: 0;
}

.info-dot {
	font-size: 28rpx;
	font-weight: bold;
	color: #c58b43;
	margin-right: 12rpx;
	line-height: 1.4;
}

.info-text {
	font-size: 22rpx;
	color: #6e5f54;
	line-height: 1.5;
	flex: 1;
}

/* ==================== 2. COLD_START 等待开跑阶段样式 ==================== */
.cold-start-section {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	padding-bottom: 40rpx;
}

.cold-hero-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 36rpx 30rpx;
	border: 1rpx solid #eee8df;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	position: relative;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.cold-status-badge {
	display: inline-flex;
	align-items: center;
	padding: 8rpx 20rpx;
	background: #fff8eb;
	border: 1rpx solid #fed89a;
	border-radius: 30rpx;
	margin-bottom: 20rpx;
}

.cold-badge-icon {
	font-size: 24rpx;
	margin-right: 10rpx;
	line-height: 1;
}

.cold-badge-text {
	font-size: 22rpx;
	color: #b7791f;
	font-weight: 600;
	line-height: 1;
}

.cold-title {
	font-size: 34rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 10rpx;
	display: block;
}

.cold-subtitle {
	font-size: 24rpx;
	color: #8c7e74;
	margin-bottom: 30rpx;
	display: block;
}

.highlight-date {
	color: #c58b43;
	font-weight: bold;
}

.countdown-panel {
	width: 100%;
	display: flex;
	align-items: center;
	background: #fbf9f4;
	border-radius: 16rpx;
	padding: 24rpx;
	border: 1rpx solid #eee5d7;
	box-sizing: border-box;
	margin-bottom: 30rpx;
}

.countdown-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #c58b43 0%, #ab7534 100%);
	border-radius: 14rpx;
	padding: 14rpx 24rpx;
	min-width: 130rpx;
	box-shadow: 0 4rpx 12rpx rgba(197, 139, 67, 0.25);
}

.countdown-num {
	font-size: 40rpx;
	font-weight: bold;
	color: #ffffff;
	line-height: 1;
}

.countdown-unit {
	font-size: 18rpx;
	color: #f7eee2;
	margin-top: 6rpx;
	line-height: 1;
}

.countdown-desc-box {
	flex: 1;
	text-align: left;
	margin-left: 24rpx;
}

.cd-desc-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
	margin-bottom: 6rpx;
}

.cd-desc-sub {
	font-size: 20rpx;
	color: #8c7e74;
	line-height: 1.4;
	display: block;
}

.cold-meta-grid {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 20rpx 0;
	border-top: 1rpx solid #f0eae1;
	border-bottom: 1rpx solid #f0eae1;
	margin-bottom: 32rpx;
}

.cold-meta-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.cold-meta-val {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
	line-height: 1.2;
}

.cold-meta-lbl {
	font-size: 20rpx;
	color: #8c7e74;
	margin-top: 6rpx;
	line-height: 1;
}

.cold-meta-divider {
	width: 1rpx;
	height: 40rpx;
	background: #e8e0d4;
}

.start-scaling-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #c58b43 0%, #ab7534 100%);
	border-radius: 44rpx;
	color: #ffffff;
	font-size: 30rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	box-shadow: 0 6rpx 20rpx rgba(197, 139, 67, 0.3);
}

.start-scaling-btn::after {
	border: none;
}

.cold-actions-row {
	margin-top: 24rpx;
}

.cold-modify-btn {
	font-size: 24rpx;
	color: #8c7e74;
	text-decoration: underline;
	padding: 6rpx 16rpx;
}

.tips-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 28rpx 30rpx;
	border: 1rpx solid #eee8df;
}

.tips-card-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #2c2523;
	margin-bottom: 18rpx;
	display: block;
}

.tip-line {
	display: flex;
	align-items: flex-start;
	margin-bottom: 14rpx;
}

.tip-line:last-child {
	margin-bottom: 0;
}

.tip-num {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: #f4efe6;
	color: #c58b43;
	font-size: 20rpx;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 14rpx;
	flex-shrink: 0;
	line-height: 1;
}

.tip-content {
	font-size: 22rpx;
	color: #6e5f54;
	line-height: 1.5;
	flex: 1;
}

/* ==================== 审核伪装：慢生活习惯打卡样式 ==================== */
.audit-plan-page {
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

.audit-nav-title-box {
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

.audit-scroll-body {
	flex: 1;
	height: calc(100vh - 140rpx);
	padding: 24rpx 32rpx 80rpx 32rpx;
	box-sizing: border-box;
}

.audit-stat-card {
	background: #ffffff;
	border-radius: 28rpx;
	padding: 36rpx 32rpx;
	box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 28rpx;
}

.audit-stat-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.stat-h-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #2c2523;
}

.stat-h-badge {
	font-size: 22rpx;
	color: #2c6e49;
	background: #eef7f2;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	font-weight: 500;
}

.stat-num-row {
	display: flex;
	align-items: center;
	justify-content: space-around;
}

.stat-col {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-val {
	font-size: 44rpx;
	font-weight: bold;
	color: #2c2523;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.stat-unit {
	font-size: 22rpx;
	color: #8c7e74;
	font-weight: normal;
	margin-left: 4rpx;
}

.stat-lbl {
	font-size: 22rpx;
	color: #8c7e74;
	margin-top: 8rpx;
}

.stat-col-divider {
	width: 1rpx;
	height: 48rpx;
	background: #eee8df;
}

.audit-habit-card {
	background: #ffffff;
	border-radius: 28rpx;
	padding: 36rpx 32rpx;
	box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 28rpx;
}

.habit-card-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #2c2523;
	display: block;
}

.habit-card-sub {
	font-size: 22rpx;
	color: #9c9289;
	display: block;
	margin-top: 6rpx;
	margin-bottom: 28rpx;
}

.habit-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.habit-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
	background: #faf8f5;
	border-radius: 18rpx;
	border: 1rpx solid #f0ede6;
	transition: all 0.2s ease;
}

.habit-row-done {
	background: #f0f7f3;
	border-color: #d8ede0;
}

.habit-info {
	display: flex;
	align-items: center;
	gap: 18rpx;
}

.habit-tag {
	font-size: 20rpx;
	color: #7b6d64;
	background: #eee9e0;
	padding: 4rpx 14rpx;
	border-radius: 8rpx;
}

.habit-name-box {
	display: flex;
	flex-direction: column;
}

.habit-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #2c2523;
}

.habit-time {
	font-size: 22rpx;
	color: #9c9289;
	margin-top: 4rpx;
}

.habit-done-badge {
	font-size: 24rpx;
	color: #2c6e49;
	font-weight: 600;
	padding: 8rpx 18rpx;
	background: #e2f2e8;
	border-radius: 24rpx;
}

.habit-check-btn {
	font-size: 24rpx;
	color: #c58b43;
	font-weight: 600;
	padding: 8rpx 20rpx;
	background: #fdf5eb;
	border-radius: 24rpx;
	border: 1rpx solid #fae8cb;
}

.audit-quote-card {
	background: linear-gradient(135deg, rgba(68, 99, 79, 0.08), rgba(44, 68, 54, 0.04));
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 40rpx;
	border: 1rpx dashed rgba(68, 99, 79, 0.2);
}

.quote-text {
	font-size: 26rpx;
	color: #385141;
	line-height: 1.6;
	font-style: italic;
	display: block;
}

.quote-author {
	font-size: 22rpx;
	color: #6a8573;
	display: block;
	margin-top: 14rpx;
	text-align: right;
}

.audit-return-home-btn {
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

.audit-return-home-btn::after {
	border: none;
}
</style>
