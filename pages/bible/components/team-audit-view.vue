<template>
	<view class="audit-team-page">
		<!-- 顶部导航栏 -->
		<view class="audit-nav-bar" :style="navBarStyle">
			<view class="nav-content" :style="{ height: navBarHeight + 'px' }">
				<view class="nav-left" @click="$emit('back')">
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

			<button class="audit-home-btn" @click="$emit('back')">返回城市漫游首页</button>
		</scroll-view>
	</view>
</template>

<script>
export default {
	name: 'TeamAuditView',
	props: {
		navBarStyle: {
			type: String,
			default: ''
		},
		navBarHeight: {
			type: Number,
			default: 32
		}
	}
};
</script>

<style scoped>
.audit-team-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #f7f9f6;
}

.audit-nav-bar {
	display: flex;
	align-items: center;
	background: #fdfbf7;
	border-bottom: 1rpx solid #f0ece1;
	z-index: 100;
}

.nav-content {
	display: flex;
	align-items: center;
	width: 100%;
}

.nav-left {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.back-arrow-icon {
	width: 18rpx;
	height: 18rpx;
	border-left: 4rpx solid #2c2523;
	border-bottom: 4rpx solid #2c2523;
	transform: rotate(45deg);
}

.back-text {
	font-size: 28rpx;
	color: #2c2523;
	font-weight: 500;
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
