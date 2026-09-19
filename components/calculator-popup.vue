<template>
	<view class="popup-mask" v-if="isVisible" @click="close">
		<view class="calculator-container" @click.stop>
			<view class="calculator-display">
				<text class="display-text">{{displayText}}</text>
			</view>
			<view class="calculator-buttons">
				<!-- 第一行 - 合并的附录按钮 -->
				<view class="button-row">
					<button class="calc-button orange-button wide-button" @click="appendixAction">附录</button>
					<button class="calc-button orange-button" @click="deleteLast">⌫</button>
				</view>
				<!-- 第二行 -->
				<view class="button-row">
					<button class="calc-button number-button" @click="inputNumber('7')">7</button>
					<button class="calc-button number-button" @click="inputNumber('8')">8</button>
					<button class="calc-button number-button" @click="inputNumber('9')">9</button>
				</view>
				<!-- 第三行 -->
				<view class="button-row">
					<button class="calc-button number-button" @click="inputNumber('4')">4</button>
					<button class="calc-button number-button" @click="inputNumber('5')">5</button>
					<button class="calc-button number-button" @click="inputNumber('6')">6</button>
				</view>
				<!-- 第四行 -->
				<view class="button-row">
					<button class="calc-button number-button" @click="inputNumber('1')">1</button>
					<button class="calc-button number-button" @click="inputNumber('2')">2</button>
					<button class="calc-button number-button" @click="inputNumber('3')">3</button>
				</view>
				<!-- 第五行 -->
				<view class="button-row">
					<button class="calc-button number-button" @click="inputNumber('0')">0</button>
					<button class="calc-button orange-button wide-button" @click="confirmAction">确认</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CalculatorPopup',
	data() {
		return {
			displayValue: '0',
			isVisible: false
		}
	},
	props: {
		isRandomMode: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		displayText() {
			if (this.displayValue === '0') {
				return this.isRandomMode ? '随机风景' : '请选择诗歌';
			}
			return this.displayValue;
		}
	},
	mounted() {
		console.log('Calculator mounted, isVisible:', this.isVisible);
	},
	methods: {
		// 打开弹窗
		open() {
			this.displayValue = '0';
			this.isVisible = true;
		},
		// 关闭弹窗
		close() {
			this.isVisible = false;
		},
		// 切换显示状态
		toggle() {
			console.log('Toggle called, current isVisible:', this.isVisible);
			if (this.isVisible) {
				console.log('Closing calculator');
				this.close();
			} else {
				console.log('Opening calculator');
				this.open();
			}
			console.log('After toggle, isVisible:', this.isVisible);
		},
		// 检查是否显示
		isShowing() {
			return this.isVisible;
		},
		// 输入数字
		inputNumber(num) {
			if (this.displayValue === '0' && num !== '.') {
				this.displayValue = num;
			} else {
				this.displayValue += num;
			}
		},
		// 清除并重置
		clearAll() {
			this.displayValue = '0';
		},
		// 删除最后一位
		deleteLast() {
			if (this.displayValue.length > 1) {
				this.displayValue = this.displayValue.slice(0, -1);
			} else {
				this.displayValue = '0';
			}
		},
		// 附录按钮功能
		appendixAction() {
			console.log('附录按钮被点击，当前输入值:', this.displayValue);
			// 显示"附"字
			this.displayValue = '附';
			// 发射事件给父组件
			this.$emit('appendixClicked', { value: this.displayValue });
			// 不自动关闭弹窗，让用户可以继续操作
		},
		// 确认按钮功能
		confirmAction() {
			console.log('确认按钮被点击，当前输入值:', this.displayValue);
			// 处理附录值，将"附"替换为"附录"
			let valueToSend = this.displayValue;
			if (valueToSend.startsWith('附')) {
				valueToSend = valueToSend.replace('附', '附录');
			}
			// 发射确认事件给父组件
			this.$emit('confirmClicked', { value: valueToSend });
			this.close();
		}
	}
}
</script>

<style scoped>
/* 弹窗遮罩层 */
.popup-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

/* iPhone计算器样式 */
.calculator-container {
	width: 80vw;
	max-width: 450rpx;
	min-width: 400rpx;
	background-color: #000000;
	border-radius: 32rpx;
	padding: 24rpx;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calculator-display {
	height: 120rpx;
	display: flex;
	align-items: flex-end;
	justify-content: flex-end;
	padding: 0 24rpx 16rpx;
	margin-bottom: 24rpx;
}

.display-text {
	color: #ffffff;
	font-size: 64rpx;
	font-weight: 300;
	text-align: right;
	line-height: 1;
}

.calculator-buttons {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.button-row {
	display: flex;
	gap: 16rpx;
	justify-content: center;
}

.calc-button {
	width: 120rpx;
	height: 120rpx;
	min-width: 120rpx;
	min-height: 120rpx;
	border-radius: 60rpx;
	border: none;
	font-size: 48rpx;
	font-weight: 400;
	cursor: pointer;
	transition: all 0.1s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.calc-button:active {
	transform: scale(0.95);
}

/* 数字按钮 - 深灰色 */
.number-button {
	background-color: #333333;
	color: #ffffff;
}

.number-button:hover {
	background-color: #404040;
}

/* 功能按钮 - 浅灰色 */
.function-button {
	background-color: #a6a6a6;
	color: #000000;
	font-weight: 500;
}

.function-button:hover {
background-color: #d4d4d2;
}

/* 橙色按钮 - iPhone计算器橙色 */
.orange-button {
background-color: #ff9500;
color: #ffffff;
font-weight: 500;
}

.orange-button:hover {
background-color: #ffb143;
}

.orange-button:active {
background-color: #cc7700;
}

/* 宽按钮样式 - 附录按钮 */
.wide-button {
	width: 256rpx;
	border-radius: 60rpx;
	justify-content: center;
}

/* 0按钮特殊样式 - 宽度为两个按钮 */
.zero-button {
	width: 256rpx;
	border-radius: 60rpx;
	justify-content: flex-start;
	padding-left: 40rpx;
}
</style>