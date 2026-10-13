<template>
	<view>
		<!-- 读经提醒与分享海报弹窗 -->
		<view v-if="visible" class="modal-mask poster-modal-mask" @click="close">
			<view class="poster-modal-body" @click.stop>
				<view class="poster-modal-header">
					<view class="poster-header-left">
						<text class="poster-modal-title">提醒队友读经 · 分享海报</text>
						<text class="poster-modal-sub" v-if="targetMember">特别提醒：@{{ targetMember.nickname }}</text>
						<text class="poster-modal-sub" v-else>全队齐心 · 彼此提醒激励</text>
					</view>
					<view class="poster-modal-close" @click="close">
						<text class="close-icon">✕</text>
					</view>
				</view>

				<!-- 海报预览容器 -->
				<view class="poster-preview-box">
					<image 
						v-if="posterImageUrl" 
						class="poster-preview-img" 
						:src="posterImageUrl" 
						mode="widthFix" 
						@click="previewPosterImage"
					></image>
					<view v-else class="poster-loading-box">
						<view class="poster-spinner"></view>
						<text class="loading-tip">正在绘制精美读经提醒海报...</text>
					</view>
				</view>

				<text class="poster-hint-text">💡 点击图片全屏预览长按可转发，也可一键保存相册发群</text>

				<!-- 底部操作按钮 -->
				<view class="poster-actions-row">
					<button class="poster-btn btn-secondary" @click="copyRemindMessage">
						<text class="p-btn-icon">📋</text>
						<text class="p-btn-txt">复制提醒口令</text>
					</button>
					<button class="poster-btn btn-primary" :loading="isSavingPoster" @click="savePosterToAlbum">
						<text class="p-btn-icon">📥</text>
						<text class="p-btn-txt">保存海报到相册</text>
					</button>
				</view>
			</view>
		</view>

		<!-- 离屏 Canvas (用于生成高清读经海报) -->
		<canvas 
			canvas-id="shareCanvas" 
			id="shareCanvas" 
			class="share-offscreen-canvas" 
			:style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
		></canvas>
	</view>
</template>

<script>
export default {
	name: 'TeamPosterModal',
	props: {
		team: {
			type: Object,
			default: () => ({})
		},
		dashboard: {
			type: Object,
			default: () => ({})
		}
	},
	data() {
		return {
			visible: false,
			targetMember: null,
			posterImageUrl: '',
			isSavingPoster: false,
			canvasWidth: 640,
			canvasHeight: 960
		};
	},
	methods: {
		open(targetMember = null) {
			this.targetMember = targetMember;
			this.posterImageUrl = '';
			this.visible = true;
			this.$nextTick(() => {
				setTimeout(() => {
					this.drawSharePoster();
				}, 120);
			});
		},

		close() {
			this.visible = false;
		},

		previewPosterImage() {
			if (!this.posterImageUrl) return;
			uni.previewImage({
				urls: [this.posterImageUrl],
				current: this.posterImageUrl
			});
		},

		copyRemindMessage() {
			const teamName = this.team?.teamName || '读经小队';
			let msg = '';
			if (this.targetMember) {
				const targetWords = this.team?.dailyTargetWords || 5000;
				const leftWords = Math.max(0, targetWords - (this.targetMember.todayWords || 0));
				msg = `【读经提醒】@${this.targetMember.nickname} 弟兄/姐妹，今天在【${teamName}】还差 ${leftWords.toLocaleString()} 字就完成配额啦！大家都在等你一起达标，快打开小程序读经吧～`;
			} else {
				const finished = this.dashboard?.finishedCount || 0;
				const total = this.dashboard?.totalCount || 0;
				msg = `【读经提醒】亲爱的队友们，今天【${teamName}】已有 ${finished}/${total} 人完成读经！读经时间到啦，快打开小程序跟上节奏吧～`;
			}
			uni.setClipboardData({
				data: msg,
				success: () => {
					uni.showToast({ title: '提醒文案已复制', icon: 'success' });
				}
			});
		},

		savePosterToAlbum() {
			if (!this.posterImageUrl) {
				uni.showToast({ title: '海报正在生成中...', icon: 'none' });
				return;
			}
			this.isSavingPoster = true;
			uni.saveImageToPhotosAlbum({
				filePath: this.posterImageUrl,
				success: () => {
					this.isSavingPoster = false;
					uni.showToast({ title: '海报已保存至相册', icon: 'success' });
				},
				fail: (err) => {
					this.isSavingPoster = false;
					console.warn('[Poster] 直接保存相册受阻，无缝降级调起原生全屏预览:', err);
					// 隐私协议未声明 (errno: 112) 或权限受限时：直接调起全屏原生预览
					uni.showToast({
						title: '长按海报即可保存相册或发送',
						icon: 'none',
						duration: 2500
					});
					setTimeout(() => {
						this.previewPosterImage();
					}, 350);
				}
			});
		},

		drawRoundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
			if (radius * 2 > width) radius = width / 2;
			if (radius * 2 > height) radius = height / 2;
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.arcTo(x + width, y, x + width, y + height, radius);
			ctx.arcTo(x + width, y + height, x, y + height, radius);
			ctx.arcTo(x, y + height, x, y, radius);
			ctx.arcTo(x, y, x + width, y, radius);
			ctx.closePath();
			if (fill) ctx.fill();
			if (stroke) ctx.stroke();
		},

		drawWrapText(ctx, text, x, y, maxWidth, lineHeight) {
			if (!text) return y;
			const chars = String(text).split('');
			let line = '';
			for (let n = 0; n < chars.length; n++) {
				const testLine = line + chars[n];
				const metrics = ctx.measureText(testLine);
				if (metrics.width > maxWidth && n > 0) {
					ctx.fillText(line, x, y);
					line = chars[n];
					y += lineHeight;
				} else {
					line = testLine;
				}
			}
			ctx.fillText(line, x, y);
			return y;
		},

		async getValidQcodeImagePath() {
			const normalize = (p) => {
				if (!p) return p;
				if (/^(https?:|wxfile:|file:|data:|\/|blob:)/i.test(p)) return p;
				return '/' + p.replace(/^(\.\/|(\.\.\/)+)/, '');
			};

			// #ifdef MP-WEIXIN
			try {
				const fs = wx.getFileSystemManager();
				const targetPath = `${wx.env.USER_DATA_PATH}/team_share_qcode.jpg`;
				const data = fs.readFileSync('/static/qcode.jpg');
				fs.writeFileSync(targetPath, data);
				return targetPath;
			} catch (fsErr) {
				console.warn('[Poster] 拷贝太阳码到用户目录失败，回退 getImageInfo:', fsErr);
			}
			// #endif

			const info = await new Promise((resolve) => {
				uni.getImageInfo({
					src: '/static/qcode.jpg',
					success: (res) => resolve(res && res.path ? res.path : null),
					fail: () => resolve(null)
				});
			});
			return normalize(info) || '/static/qcode.jpg';
		},

		async drawSharePoster() {
			const ctx = uni.createCanvasContext('shareCanvas', this);
			const w = this.canvasWidth;
			const h = this.canvasHeight;

			try {
				const qcodePath = await this.getValidQcodeImagePath();

				// 1. 底色：象牙暖白渐变
				const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
				bgGradient.addColorStop(0, '#FDFBF7');
				bgGradient.addColorStop(1, '#F4ECE1');
				ctx.setFillStyle(bgGradient);
				ctx.fillRect(0, 0, w, h);

				// 外层内边框（彻底无毛刺圆角）
				ctx.setStrokeStyle('#E8DCC8');
				ctx.setLineWidth(2);
				this.drawRoundRect(ctx, 16, 16, w - 32, h - 32, 22, false, true);

				// 2. 顶部胶囊徽章
				ctx.setFillStyle('#EFE5D3');
				this.drawRoundRect(ctx, (w - 290) / 2, 40, 290, 42, 21, true, false);

				ctx.setFillStyle('#8A6836');
				ctx.setFontSize(20);
				ctx.setTextAlign('center');
				ctx.setTextBaseline('middle');
				ctx.fillText('📜 每日读经同行 · 彼此勉励', w / 2, 61);

				// 3. 小队大名称
				const teamName = this.team?.teamName || '读经同行小队';
				ctx.setFillStyle('#231F20');
				ctx.setFontSize(36);
				ctx.setTextAlign('center');
				ctx.setTextBaseline('top');
				const displayTeamName = teamName.length > 14 ? teamName.slice(0, 14) + '...' : teamName;
				ctx.fillText(displayTeamName, w / 2, 102);

				// 4. 团队今日齐心进展卡片
				const cardX = 36;
				const cardY = 162;
				const cardW = 568;
				const cardH = 340;

				ctx.setFillStyle('#FFFFFF');
				this.drawRoundRect(ctx, cardX, cardY, cardW, cardH, 18, true, false);
				ctx.setStrokeStyle('#EDE3D5');
				ctx.setLineWidth(1.5);
				this.drawRoundRect(ctx, cardX, cardY, cardW, cardH, 18, false, true);

				// 小标题
				ctx.setFillStyle('#8A7C70');
				ctx.setFontSize(22);
				ctx.setTextAlign('left');
				ctx.setTextBaseline('top');
				ctx.fillText('今日全队齐心进度', cardX + 22, cardY + 20);

				// 进度数据
				const teamTotal = this.dashboard?.teamTodayTotal || 0;
				const targetTotal = this.dashboard?.teamTargetTotal || 5000;
				const percent = Math.min(100, this.dashboard?.teamProgressPercent || 0);

				ctx.setFillStyle('#B45309');
				ctx.setFontSize(28);
				ctx.fillText(`${teamTotal.toLocaleString()} / ${targetTotal.toLocaleString()} 字 (${percent}%)`, cardX + 22, cardY + 52);

				// 进度条槽
				const barX = cardX + 22;
				const barY = cardY + 96;
				const barW = cardW - 44;
				const barH = 16;
				ctx.setFillStyle('#EFEBE4');
				this.drawRoundRect(ctx, barX, barY, barW, barH, 8, true, false);

				// 进度条填充
				if (percent > 0) {
					const fillW = Math.max(16, (barW * percent) / 100);
					ctx.setFillStyle('#D97706');
					this.drawRoundRect(ctx, barX, barY, fillW, barH, 8, true, false);
				}

				// 达标人数
				const totalCount = this.dashboard?.totalCount || 1;
				const finCount = this.dashboard?.finishedCount || 0;
				ctx.setFillStyle('#64748B');
				ctx.setFontSize(21);
				ctx.fillText(`全队 ${totalCount} 人中已有 ${finCount} 人达标今日配额`, cardX + 22, cardY + 126);

				// 提醒气泡
				const bubbleX = cardX + 18;
				const bubbleY = cardY + 164;
				const bubbleW = cardW - 36;
				const bubbleH = 152;

				if (this.targetMember) {
					const dailyTarget = this.team?.dailyTargetWords || 5000;
					const leftW = Math.max(0, dailyTarget - (this.targetMember.todayWords || 0));

					ctx.setFillStyle('#FFF7ED');
					this.drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 14, true, false);
					ctx.setStrokeStyle('#FED7AA');
					ctx.setLineWidth(1);
					this.drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 14, false, true);

					ctx.setFillStyle('#C2410C');
					ctx.setFontSize(24);
					ctx.setTextAlign('left');
					ctx.fillText(`📢 提醒同伴：@${this.targetMember.nickname}`, bubbleX + 20, bubbleY + 22);

					ctx.setFillStyle('#7C2D12');
					ctx.setFontSize(21);
					this.drawWrapText(
						ctx,
						`今日读经还差 ${leftW.toLocaleString()} 字就达成目标啦！快打开小程序完成今日领受吧～`,
						bubbleX + 20,
						bubbleY + 64,
						bubbleW - 40,
						32
					);
				} else {
					ctx.setFillStyle('#F8FAFC');
					this.drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 14, true, false);
					ctx.setStrokeStyle('#E2E8F0');
					ctx.setLineWidth(1);
					this.drawRoundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 14, false, true);

					ctx.setFillStyle('#0F766E');
					ctx.setFontSize(23);
					ctx.setTextAlign('left');
					ctx.fillText('🌿 弟兄姐妹，今天的读经时间到啦！', bubbleX + 20, bubbleY + 22);

					ctx.setFillStyle('#334155');
					ctx.setFontSize(20);
					this.drawWrapText(
						ctx,
						'“两个人总比一个人好，因为二人劳碌同得美好的果效。”—— 传道书 4:9',
						bubbleX + 20,
						bubbleY + 64,
						bubbleW - 40,
						30
					);
				}

				// 5. 典雅经文金句
				ctx.setFillStyle('#857361');
				ctx.setFontSize(20);
				ctx.setTextAlign('center');
				ctx.fillText('“你的话是我脚前的灯，是我路上的光。” —— 诗篇 119:105', w / 2, 532);

				// 6. 底部太阳码大卡片
				const botCardX = 36;
				const botCardY = 566;
				const botCardW = 568;
				const botCardH = 328;

				ctx.setFillStyle('#FFFFFF');
				this.drawRoundRect(ctx, botCardX, botCardY, botCardW, botCardH, 18, true, false);
				ctx.setStrokeStyle('#EDE3D5');
				ctx.setLineWidth(1.5);
				this.drawRoundRect(ctx, botCardX, botCardY, botCardW, botCardH, 18, false, true);

				// 太阳码居中展示
				const qrSize = 206;
				const qrX = (w - qrSize) / 2;
				const qrY = botCardY + 20;
				if (qcodePath) {
					ctx.drawImage(qcodePath, qrX, qrY, qrSize, qrSize);
				}

				// 居中长按指引文案
				ctx.setTextAlign('center');
				ctx.setFillStyle('#1E293B');
				ctx.setFontSize(23);
				ctx.fillText('微信长按识别小程序码 · 即刻读经打卡', w / 2, botCardY + 254);

				// 底部温馨提示
				ctx.setFillStyle('#94A3B8');
				ctx.setFontSize(18);
				ctx.fillText('—— 携手每日同行 · 生命丰盛充实 ——', w / 2, botCardY + 290);

				// 7. 渲染并生成临时图片
				ctx.draw(false, () => {
					setTimeout(() => {
						uni.canvasToTempFilePath({
							canvasId: 'shareCanvas',
							destWidth: w * 2,
							destHeight: h * 2,
							fileType: 'png',
							quality: 1,
							success: (res) => {
								this.posterImageUrl = res.tempFilePath;
							},
							fail: (err) => {
								console.error('Canvas 导出海报失败', err);
								uni.showToast({ title: '生成海报图失败', icon: 'none' });
							}
						}, this);
					}, 200);
				});
			} catch (e) {
				console.error('绘制海报异常', e);
				uni.showToast({ title: '绘制海报异常', icon: 'none' });
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
	z-index: 999;
}

.poster-modal-mask {
	align-items: center;
	justify-content: center;
	padding: 30rpx;
	box-sizing: border-box;
}

.poster-modal-body {
	width: 620rpx;
	background: #ffffff;
	border-radius: 32rpx;
	padding: 32rpx 28rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.25);
	animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	box-sizing: border-box;
}

@keyframes popIn {
	from {
		opacity: 0;
		transform: scale(0.92);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

.poster-modal-header {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.poster-header-left {
	display: flex;
	flex-direction: column;
}

.poster-modal-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #2c2523;
}

.poster-modal-sub {
	font-size: 22rpx;
	color: #c2410c;
	margin-top: 4rpx;
	font-weight: 500;
}

.poster-modal-close {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	background: #f3ede2;
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-icon {
	font-size: 26rpx;
	color: #796c62;
}

.poster-preview-box {
	width: 100%;
	max-height: 65vh;
	background: #fbf9f5;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1rpx solid #ede4d6;
}

.poster-preview-img {
	width: 100%;
	display: block;
	border-radius: 24rpx;
}

.poster-loading-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	gap: 20rpx;
}

.poster-spinner {
	width: 48rpx;
	height: 48rpx;
	border: 4rpx solid #f3ede2;
	border-top-color: #d97706;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.loading-tip {
	font-size: 24rpx;
	color: #8c7d73;
}

.poster-hint-text {
	font-size: 22rpx;
	color: #8c7d73;
	margin: 20rpx 0 24rpx 0;
	text-align: center;
}

.poster-actions-row {
	width: 100%;
	display: flex;
	gap: 20rpx;
}

.poster-btn {
	flex: 1;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 42rpx;
	font-size: 26rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	border: none;
}

.poster-btn::after {
	border: none;
}

.btn-secondary {
	background: #f4efe6;
	color: #795548;
}

.btn-secondary:active {
	background: #eadecc;
}

.btn-primary {
	background: linear-gradient(135deg, #d97706, #b45309);
	color: #ffffff;
	box-shadow: 0 6rpx 16rpx rgba(180, 83, 9, 0.3);
}

.btn-primary:active {
	opacity: 0.9;
}

.p-btn-icon {
	font-size: 26rpx;
}

.p-btn-txt {
	font-size: 26rpx;
}

.share-offscreen-canvas {
	position: fixed;
	left: -9999px;
	top: -9999px;
	opacity: 0;
	pointer-events: none;
}
</style>
