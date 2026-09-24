<template>
	<!-- 微信小程序隐私授权弹窗：用户首次调用 chooseAvatar 等隐私接口时由系统回调触发 -->
	<view v-if="showPrivacyModal" class="privacy-mask">
		<view class="privacy-card">
			<text class="privacy-title">用户隐私保护提示</text>
			<text class="privacy-desc">感谢您使用本小程序。在开启读经计划 / 小队功能前，我们需要收集您的微信昵称与头像，用于身份展示与打卡记录。详情请查阅《用户隐私保护指引》。如您拒绝，将无法使用头像选择功能，但不影响其他浏览。</text>
			<view class="privacy-actions">
				<button class="privacy-btn privacy-disagree" @click="onDisagree">拒绝</button>
				<button id="agree-btn" class="privacy-btn privacy-agree" open-type="agreePrivacyAuthorization" @agreeprivacyauthorization="onAgree">同意</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'PrivacyPopup',
	data() {
		return {
			showPrivacyModal: false,
			_pendingResolve: null
		};
	},
	// #ifdef MP-WEIXIN
	mounted() {
		if (typeof wx !== 'undefined' && wx.onNeedPrivacyAuthorization) {
			wx.onNeedPrivacyAuthorization((resolve) => {
				// 系统在隐私接口调用前回调：先存 resolve，再弹自定义说明窗
				this._pendingResolve = resolve;
				this.showPrivacyModal = true;
			});
		}
	},
	beforeUnmount() {
		this._pendingResolve = null;
	},
	// #endif
	methods: {
		onAgree() {
			this.showPrivacyModal = false;
			if (typeof this._pendingResolve === 'function') {
				this._pendingResolve({ buttonId: 'agree-btn', event: 'agree' });
				this._pendingResolve = null;
			}
		},
		onDisagree() {
			this.showPrivacyModal = false;
			if (typeof this._pendingResolve === 'function') {
				this._pendingResolve({ event: 'disagree' });
				this._pendingResolve = null;
			}
		}
	}
};
</script>

<style scoped>
.privacy-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99999;
}
.privacy-card {
	background: #ffffff;
	width: 80%;
	max-width: 600rpx;
	border-radius: 24rpx;
	padding: 48rpx 36rpx;
	display: flex;
	flex-direction: column;
	align-items: stretch;
}
.privacy-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #2c2523;
	text-align: center;
	margin-bottom: 20rpx;
}
.privacy-desc {
	font-size: 26rpx;
	color: #7b6d64;
	line-height: 1.7;
	margin-bottom: 36rpx;
}
.privacy-actions {
	display: flex;
	gap: 20rpx;
}
.privacy-btn {
	flex: 1;
	height: 76rpx;
	line-height: 76rpx;
	border-radius: 38rpx;
	font-size: 26rpx;
	font-weight: bold;
}
.privacy-btn::after {
	border: none;
}
.privacy-disagree {
	background: #f1ede6;
	color: #7b6d64;
}
.privacy-agree {
	background: #1aad19;
	color: #ffffff;
}
</style>
