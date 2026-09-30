<template>
	<view class="reading-container">
		<!-- 模式一：审核伪装模式【风物随笔 · 慢生活阅读】 -->
		<view v-if="isAudit" class="audit-article-view">
			<view class="nav-bar" :style="{ paddingTop: navBarTop + 'px', height: (navBarTop + navBarHeight + 8) + 'px', paddingRight: capsuleWidth + 'px' }">
				<view class="nav-left" @click="goBack">
					<view class="back-arrow-icon"></view>
					<text class="back-text">返回</text>
				</view>
				<view class="nav-center">
					<text class="nav-title">风物美文</text>
					<text class="nav-subtitle">自然心境 · 随笔</text>
				</view>
				<view class="nav-right-safe"></view>
			</view>

			<scroll-view scroll-y class="audit-article-scroll">
				<image class="article-banner-img" src="/static/scenery/suzhou.jpg" mode="aspectFill"></image>
				<view class="article-body-card">
					<text class="article-h1">江南水乡与慢生活闲居漫记</text>
					<view class="article-meta-row">
						<text class="article-author">城市漫游志</text>
						<text class="article-time">阅读约需 3 分钟</text>
					</view>
					<view class="article-content-text">
						<text class="p-text">流水如诗，山青如墨。行至水穷处，坐看云起时。江南的水，带着特有的温润，静静穿过青石板街与旧瓦屋檐。</text>
						<text class="p-text">在快节奏的都市喧嚣中，留出二十分钟的静谧时光，听窗外细雨微风，感受自然节律的舒缓从容。不疾不徐，步调匀称，便是最好的生活状态。</text>
						<text class="p-text">万物有其时令，春生夏长，秋收冬藏。愿你在此刻卸下焦虑，伴着轻柔的水声与微风，找回内心的辽阔与安宁。</text>
					</view>
					<button class="return-home-btn" @click="goBack">返回城市漫游首页</button>
				</view>
			</scroll-view>
		</view>

		<!-- 模式二：正式开放模式【圣经沉浸式阅读器】 -->
		<view v-else class="real-reading-view">
			<!-- 悬浮固定头部区域 -->
			<view class="sticky-header">
				<!-- 顶部导航栏 (精准避让微信右上角原生胶囊) -->
				<view class="nav-bar" :style="{ paddingTop: navBarTop + 'px', height: (navBarTop + navBarHeight + 8) + 'px', paddingRight: capsuleWidth + 'px' }">
					<view class="nav-left" @click="goBack">
						<view class="back-arrow-icon"></view>
						<text class="nav-book-name">{{ currentBookFullName }}</text>
						<text class="nav-chap-num">{{ chapter }}</text>
					</view>

					<view class="nav-right-safe">
						<text class="version-label">和合本</text>
					</view>
				</view>

			<!-- 章节辅助控制栏 (微读切换胶囊 + 番茄钟 + 打卡) -->
			<view class="chapter-sub-bar" v-if="verses.length > 0">
				<!-- 左侧：排版切换胶囊 (纸版 vs 分节) -->
				<view class="mode-switch-capsule">
					<view 
						class="mode-switch-item" 
						:class="{ 'is-active': readingMode === 'paper' }"
						@click.stop="setReadingMode('paper')">
						<text class="mode-switch-text">纸版</text>
					</view>
					<view 
						class="mode-switch-item" 
						:class="{ 'is-active': readingMode === 'verse' }"
						@click.stop="setReadingMode('verse')">
						<text class="mode-switch-text">分节</text>
					</view>
				</view>

				<!-- 中间：专注番茄钟 (仅计划模式显示) -->
				<view class="sub-center-group">
					<view v-if="fromPlan" class="timer-pill" :class="{ 'timer-pill-active': timerRunning }" @click.stop="toggleFocusTimer">
						<text class="timer-icon">⏱</text>
						<text class="timer-time">{{ formattedTime }}</text>
					</view>
				</view>

				<!-- 右侧：打卡按钮 (仅计划模式显示) -->
				<view v-if="fromPlan" class="chapter-check-btn" :class="{ 'is-checked': isCurrentChapterFinished }" @click="toggleChapterCheck">
					<text class="check-btn-text">{{ isCurrentChapterFinished ? '已打卡 ✔' : '完成打卡' }}</text>
				</view>
				
				<!-- 右侧：非计划模式下的占位符，保持布局居中对称 -->
				<view v-else style="width: 140rpx;"></view>
			</view>

			<!-- 计划模式专属：实时读经进度数据栏 (本章总字数、本章剩余、今日剩余、今日目标) -->
			<view class="plan-progress-bar" v-if="fromPlan && verses.length > 0">
				<view class="progress-item">
					<text class="progress-label">本章总计</text>
					<text class="progress-value">{{ chapterWordCount }}<text class="progress-unit">字</text></text>
				</view>
				<view class="progress-item">
					<text class="progress-label">本章剩余</text>
					<text class="progress-value highlight">{{ isCurrentChapterFinished ? 0 : chapterRemainingWords }}<text class="progress-unit">字</text></text>
				</view>
				<view class="progress-item">
					<text class="progress-label">今日剩余</text>
					<text class="progress-value highlight-today">{{ Math.max(0, todayTargetWords - todayFinishedWords) }}<text class="progress-unit">字</text></text>
				</view>
				<view class="progress-item">
					<text class="progress-label">今日目标</text>
					<text class="progress-value">{{ todayTargetWords }}<text class="progress-unit">字</text></text>
				</view>
			</view>
			
			<!-- 非计划模式专属：简单字数提示 -->
			<view class="casual-progress-bar" v-else-if="!fromPlan && verses.length > 0">
				<text class="casual-words">本章约 {{ chapterWordCount }} 字 · 剩余约 {{ isCurrentChapterFinished ? 0 : chapterRemainingWords }} 字</text>
			</view>

			<!-- 章节内关键词搜索浮动栏 -->
			<view v-if="searchActive" class="search-floating-bar">
				<view class="search-input-wrap">
					<text class="search-icon">🔍</text>
					<input 
						class="search-input" 
						type="text" 
						v-model="searchKeyword" 
						placeholder="搜索本章关键词..." 
						confirm-type="search"
						@input="onSearchInput"
						@confirm="goToNextMatch"
					/>
					<text v-if="searchKeyword" class="search-clear-btn" @click.stop="clearSearch">✕</text>
				</view>
				<view class="search-actions">
					<text class="search-counter">{{ searchResults.length > 0 ? (currentSearchIndex + 1) + '/' + searchResults.length : (searchKeyword ? '0 处' : '') }}</text>
					<button class="search-nav-btn" :disabled="searchResults.length <= 1" @click.stop="goToPrevMatch">‹</button>
					<button class="search-nav-btn" :disabled="searchResults.length <= 1" @click.stop="goToNextMatch">›</button>
					<text class="search-close-text" @click.stop="closeSearch">完成</text>
				</view>
			</view>
		</view>

		<!-- 加载中提示 -->
		<view v-if="isLoading" class="feedback-container">
			<text class="feedback-text">加载中...</text>
		</view>

		<!-- 加载失败提示 -->
		<view v-else-if="loadingError" class="feedback-container">
			<text class="feedback-text">{{ loadingError }}</text>
		</view>

		<!-- 经文内容主体：独立滚动区域 (仅在此区域内部滚动，顶部完全静止不动) -->
		<scroll-view 
			v-else 
			scroll-y 
			class="reading-scroll-area"
			:scroll-top="scrollTop"
			:scroll-into-view="targetVerseAnchor"
			scroll-with-animation
			@scroll="handleScroll">
			
			<view class="bible-content"
				@click="handleTap"
				@touchstart="handleTouchStart"
				@touchend="handleTouchEnd"
				@touchcancel="handleTouchEnd">

				<!-- 模式一：微读圣经纸版连续排版视图 -->
				<view v-if="readingMode === 'paper'" class="paper-reading-area">
					<view v-for="(block, bIdx) in paperBlocks" :key="bIdx" class="paper-block">
						<!-- 段落小标题 -->
						<view v-if="block.heading" class="paper-section-title">
							<text class="section-title-text">{{ block.heading }}</text>
						</view>

						<!-- 诗歌体缩进段落 -->
						<view v-if="block.isPoetry" class="paper-poetry-box">
							<view v-for="verse in block.verses" :key="verse.number" class="poetry-line">
								<text :id="'v_' + verse.number" class="verse-anchor"></text>
								<text class="poetry-verse-num" :class="{ 'sup-active-matched': currentMatchVerseNum === verse.number }">{{ verse.number }}</text>
								<text class="poetry-text-content verse-selectable" selectable>
									<block v-for="(tok, tIdx) in verse.tokens" :key="tIdx">
										<template v-if="searchActive && searchKeyword">
											<text 
												v-for="(part, pIdx) in getHighlightedParts(tok.text)" 
												:key="pIdx" 
												:class="{ 
													'proper-noun': tok.isNoun,
													'search-highlight': part.highlight,
													'search-active-target': part.highlight && currentMatchVerseNum === verse.number
												}">{{ part.text }}</text>
										</template>
										<text v-else :class="{ 'proper-noun': tok.isNoun }">{{ tok.text }}</text>
									</block>
								</text>
							</view>
						</view>

						<!-- 正常散文段落 (流式折行 + Drop Cap 大章号) -->
						<view v-else class="paper-prose-paragraph">
							<!-- 大章号 Drop Cap (首字下沉排版) -->
							<view v-if="block.showDropCap" class="drop-cap-wrap">
								<text class="drop-cap-num">{{ chapter }}</text>
							</view>

							<!-- 流式经文行内排版与嵌入式上标小节号 -->
							<block v-for="verse in block.verses" :key="verse.number">
								<text :id="'v_' + verse.number" class="verse-anchor"></text>
								<text v-if="verse.number > 1" class="sup-verse-num" :class="{ 'sup-active-matched': currentMatchVerseNum === verse.number }">{{ verse.number }}</text>
								<text class="verse-selectable" selectable>
									<block v-for="(tok, tIdx) in verse.tokens" :key="tIdx">
										<template v-if="searchActive && searchKeyword">
											<text 
												v-for="(part, pIdx) in getHighlightedParts(tok.text)" 
												:key="pIdx" 
												:class="{ 
													'proper-noun': tok.isNoun,
													'search-highlight': part.highlight,
													'search-active-target': part.highlight && currentMatchVerseNum === verse.number
												}"
												class="flow-text-span">{{ part.text }}</text>
										</template>
										<text 
											v-else
											:class="{ 'proper-noun': tok.isNoun }" 
											class="flow-text-span">{{ tok.text }}</text>
									</block>
								</text>
							</block>
						</view>
					</view>
				</view>

				<!-- 模式二：按节展示视图 (整齐逐节排版) -->
				<view v-else class="verse-reading-area">
					<view 
						v-for="verse in verses" 
						:key="verse.id" 
						:id="'v_' + verse.number" 
						class="verse-wrapper"
						:class="{ 'verse-active-matched': currentMatchVerseNum === verse.number }">
						<!-- 分节模式段落小标题 -->
						<view v-if="verse.heading" class="paper-section-title verse-mode-title">
							<text class="section-title-text">{{ verse.heading }}</text>
						</view>
						<view class="verse-container">
							<text class="verse-number">{{ verse.number }}</text>
							<text class="verse-text-flow verse-selectable" selectable>
								<block v-for="(tok, tIdx) in (verse.tokens || [])" :key="tIdx">
									<template v-if="searchActive && searchKeyword">
										<text 
											v-for="(part, pIdx) in getHighlightedParts(tok.text)" 
											:key="pIdx" 
											:class="{ 
												'proper-noun': tok.isNoun,
												'search-highlight': part.highlight,
												'search-active-target': part.highlight && currentMatchVerseNum === verse.number
											}">{{ part.text }}</text>
									</template>
									<text v-else :class="{ 'proper-noun': tok.isNoun }">{{ tok.text }}</text>
								</block>
							</text>
						</view>
					</view>
				</view>

				<!-- 经文末尾读完打卡卡片 -->
				<view class="reading-finish-section" v-if="verses.length > 0">
					<button class="finish-chapter-btn" :class="{ 'btn-is-checked': isCurrentChapterFinished }" @click="toggleChapterCheck">
						{{ isCurrentChapterFinished ? '本章已打卡 ✔' : '✓ 读完打卡本章 (+约 ' + chapterWordCount + ' 字)' }}
					</button>

					<!-- 便捷翻页导航按钮组（支持跨卷切换） -->
					<view class="chapter-nav-row">
						<button class="nav-page-btn prev-btn" @click.stop="goToPreviousChapter">
							<text class="nav-arrow">‹</text> 上一章
						</button>
						<button class="nav-page-btn next-btn" @click.stop="goToNextChapter">
							下一章 <text class="nav-arrow">›</text>
						</button>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 方案B：正中行隙下沉指读 (Finger Guide Line) -->
		<view 
			v-if="guideLineVisible" 
			class="pure-guide-line-wrap"
			:class="{ 'is-dragging': guideLineDragging }"
			:style="{ top: guideLineTop + 'px' }">
			<!-- 贯穿细光线 (横卧在行与行的空隙中) -->
			<view class="pure-guide-beam"></view>

			<!-- 正中下沉手指抓手 (严格位于横线正下方，向上指 👆，无白底，绝不遮挡当前阅读行) -->
			<view 
				class="pure-guide-finger-handle"
				@touchstart.stop="onGuideTouchStart"
				@touchmove.stop="onGuideTouchMove"
				@touchend.stop="onGuideTouchEnd"
				@touchcancel.stop="onGuideTouchEnd">
				<text class="finger-symbol">👆</text>
			</view>
		</view>

		<!-- 25 分钟专注达成弹窗 -->
		<view v-if="showTimerCompleteModal" class="timer-modal-mask" @click="closeTimerModal">
			<view class="timer-modal-body" @click.stop>
				<text class="timer-modal-icon">🎉</text>
				<text class="timer-modal-title">25 分钟专注达成！</text>
				<text class="timer-modal-desc">您已完成一个专注番茄钟，今日专注与字数总账已同步累计。</text>
				<view class="timer-modal-actions">
					<button class="modal-act-btn outline" @click="backToPlan">查看计划</button>
					<button class="modal-act-btn primary" @click="closeTimerModal">继续阅读</button>
				</view>
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="bottom-toolbar" :class="{ 'toolbar-hidden': !showToolbar }">
			<view class="toolbar-item" @click.stop="togglePlay">
				<text class="toolbar-icon">{{ isPlaying ? '❚❚' : '▷' }}</text>
				<text class="toolbar-text">{{ isPlaying ? '暂停' : '播放' }}</text>
			</view>
			<view class="toolbar-item" :class="{ 'is-active-btn': searchActive }" @click.stop="toggleSearch">
				<text class="toolbar-icon">🔍</text>
				<text class="toolbar-text">搜索</text>
			</view>
			<view class="toolbar-item" @click.stop="copyFullChapter" @longpress="showCopyActions">
				<text class="toolbar-icon">📋</text>
				<text class="toolbar-text">复制</text>
			</view>
			<button class="toolbar-item toolbar-share-btn" open-type="share">
				<text class="toolbar-icon">📤</text>
				<text class="toolbar-text">分享</text>
			</button>
		</view>
	</view>
</view>
</template>

<script src="./reading.js"></script>

<style scoped lang="scss" src="./reading.scss"></style>
