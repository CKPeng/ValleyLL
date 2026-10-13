<template>
	<view>
		<!-- 1. 创建团队弹窗 -->
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

		<!-- 2. 加入团队弹窗 -->
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

		<!-- 3. 微信官方资料授权弹窗 -->
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
	</view>
</template>

<script>
import { userTeamManager } from '@/common/bible-plan/user-team-manager.js';
import { SERVER_HOST, BIBLE_API_BASE } from '@/common/config.js';

export default {
	name: 'TeamActionModals',
	data() {
		return {
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
			joinCode: ''
		};
	},
	methods: {
		getAvatarDisplayUrl(url) {
			if (!url) return this.defaultAvatar;
			if (url.startsWith('/uploads/')) return SERVER_HOST + url;
			return url;
		},

		// 创建团队
		openCreate() {
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
			this.$emit('refresh');
			uni.showToast({ title: '团队创建成功！', icon: 'success' });
		},

		// 加入团队
		openJoin(code = '') {
			this.joinCode = code || '';
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
				this.$emit('refresh');
				uni.showToast({ title: '成功加入队伍！', icon: 'success' });
			} else {
				uni.showToast({ title: res.msg || '加入失败', icon: 'none' });
			}
		},

		// 微信授权
		openAuth(currentUser = {}) {
			this.authForm.nickname = (currentUser && currentUser.nickname && !currentUser.nickname.startsWith('同伴_')) ? currentUser.nickname : '';
			this.authForm.avatarUrl = (currentUser && currentUser.avatarUrl) ? currentUser.avatarUrl : this.defaultAvatar;
			this.showAuthModal = true;
		},
		closeAuthModal() {
			this.showAuthModal = false;
		},
		onChooseAvatar(e) {
			if (e.detail && e.detail.avatarUrl) {
				const tempPath = e.detail.avatarUrl;
				this.authForm.avatarUrl = tempPath;
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
			}
		},
		fillQuickNickname() {
			this.authForm.nickname = '书卷同行者';
			uni.showToast({ title: '已填入预设昵称', icon: 'none' });
		},
		uploadAvatarFile(filePath) {
			const userInfo = userTeamManager.getUser();
			const openid = (userInfo && userInfo.openid) ? userInfo.openid : '';
			uni.uploadFile({
				url: `${BIBLE_API_BASE}/upload-avatar`,
				filePath: filePath,
				name: 'file',
				formData: { openid: openid },
				success: (uploadRes) => {
					try {
						const res = JSON.parse(uploadRes.data);
						if (res.code === 0 && res.data && res.data.url) {
							this.authForm.avatarUrl = res.data.url;
						}
					} catch (e) {}
				}
			});
		},
		async confirmRealWechatAuth(e) {
			let name = '';
			if (e && e.detail && e.detail.value && e.detail.value.nickname) {
				name = String(e.detail.value.nickname).trim();
			}
			if (!name) name = (this.authForm.nickname || '').trim();
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
				this.$emit('refresh');
				uni.showToast({ title: '微信真实授权成功！', icon: 'success' });
			} else {
				uni.showToast({ title: res.msg || '授权失败，请重试', icon: 'none' });
			}
		}
	}
};
</script>

<style scoped>
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

.field-label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.quick-preset-btn {
	font-size: 22rpx;
	color: #2c6e49;
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

.bg-orange {
	background: linear-gradient(135deg, #c58b43, #a46724);
}

.bg-blue {
	background: linear-gradient(135deg, #339af0, #1c7ed6);
}

.bg-green {
	background: linear-gradient(135deg, #2c6e49, #1e4d33);
}

.avatar-choose-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 30rpx;
}

.avatar-choose-btn {
	position: relative;
	width: 140rpx;
	height: 140rpx;
	border-radius: 70rpx;
	padding: 0;
	background: transparent;
	overflow: visible;
}

.avatar-choose-btn::after {
	border: none;
}

.auth-avatar-img {
	width: 140rpx;
	height: 140rpx;
	border-radius: 70rpx;
	border: 4rpx solid #e8e2d8;
}

.camera-tag {
	position: absolute;
	right: 0;
	bottom: 0;
	width: 44rpx;
	height: 44rpx;
	background: #2c6e49;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #ffffff;
}

.camera-icon {
	font-size: 22rpx;
}

.choose-avatar-tip {
	font-size: 22rpx;
	color: #8c7b6f;
	margin-top: 12rpx;
}
</style>
