<template>
	<view class="chajing-container">
		<!-- 1. 首页独有的原版深蓝夜空渐变 Hero 头部 -->
		<view class="hero-topbar" v-if="pageType === 'index' && !loading && !errorMessage">
			<view class="hero-header-row">
				<text class="hero-title">查经资料大全</text>
				<view class="hero-badge">
					<text class="hero-badge-dot"></text>
					<text class="hero-badge-text">22,687 篇 · 完整离线</text>
				</view>
			</view>
			
			<!-- 原版即时搜索过滤框 -->
			<view class="hero-search-box">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					v-model="searchKeyword" 
					placeholder="搜索书卷名称或拼音..." 
					placeholder-class="search-placeholder"
					confirm-type="search"
				/>
				<text class="clear-icon" v-if="searchKeyword" @tap="searchKeyword = ''">×</text>
			</view>
		</view>

		<!-- 2. 非首页层级：原版深蓝质感吸顶导航栏 + 面包屑 + 字体控制 -->
		<view class="reader-topbar" v-if="pageType !== 'index' && !loading && !errorMessage">
			<view class="breadcrumb">
				<view class="breadcrumb-item home-btn" @tap="navHome">
					<text class="home-icon">🏠</text>
					<text class="nav-text">首页</text>
				</view>
				<block v-for="(crumb, idx) in breadcrumbs" :key="idx">
					<text class="divider">/</text>
					<text 
						class="breadcrumb-item" 
						:class="{ active: idx === breadcrumbs.length - 1 }"
						@tap="navCrumb(crumb, idx)"
					>{{ crumb.title }}</text>
				</block>
			</view>

			<!-- 仅在正文阅读模式提供优雅 A- / A+ 字体调节 -->
			<view class="font-controls" v-if="pageType === 'article'">
				<view class="font-btn" @tap="changeFontSize(-2)">
					<text class="font-btn-text">A-</text>
				</view>
				<view class="font-btn" @tap="changeFontSize(2)">
					<text class="font-btn-text">A+</text>
				</view>
			</view>
		</view>

		<!-- 3. 加载中骨架动画 -->
		<view class="loading-state" v-if="loading">
			<view class="spinner"></view>
			<text class="loading-text">正在为您加载查经内容...</text>
		</view>

		<!-- 4. 异常提示与重试 -->
		<view class="error-state" v-else-if="errorMessage">
			<icon type="warn" size="44" color="#ef4444" />
			<text class="error-text">{{ errorMessage }}</text>
			<button class="retry-btn" @tap="reloadCurrent">重新加载</button>
		</view>

		<!-- 5. 核心内容滚动区域 -->
		<scroll-view scroll-y class="content-scroll" v-else :scroll-top="scrollTop">
			<!-- A. 首页模式：原版经典三大分区（旧约39卷、新约27卷、主题查经34类） -->
			<view class="index-content-wrap" v-if="pageType === 'index'">
				<block v-for="(sec, sIdx) in filteredSections" :key="sIdx">
					<view class="section-container" v-if="sec.items.length > 0">
						<view class="section-header" @tap="toggleSection(sec)">
							<view class="section-title-wrap">
								<view class="section-indicator"></view>
								<text class="section-title">{{ sec.title }}</text>
							</view>
							<view class="section-toggle-badge">
								<text class="badge-txt">{{ sec.collapsed ? '展开' : '收起' }}</text>
								<text class="badge-arrow">{{ sec.collapsed ? '▼' : '▲' }}</text>
							</view>
						</view>

						<view class="grid" v-if="!sec.collapsed">
							<view 
								class="card" 
								v-for="(item, iIdx) in sec.items" 
								:key="iIdx"
								@tap="onItemClick(item)"
							>
								<text class="card-b">{{ item.title }}</text>
								<view class="card-meta">
									<text class="card-span">{{ item.desc }}</text>
								</view>
								<view class="card-bar">
									<view class="bar-fill"></view>
								</view>
							</view>
						</view>
					</view>
				</block>
			</view>

			<!-- B. 书卷注释书列表模式（双列现代网格） -->
			<view class="book-sub-wrap" v-else-if="pageType === 'book-list'">
				<view class="page-header-card">
					<text class="page-lead-title">{{ pageTitle }}</text>
					<text class="page-lead-sub" v-if="pageSubtitle">{{ pageSubtitle }}</text>
				</view>

				<view class="grid">
					<view 
						class="card" 
						v-for="(item, index) in listItems" 
						:key="index"
						@tap="onItemClick(item)"
					>
						<text class="card-b">{{ item.title }}</text>
						<view class="card-meta">
							<text class="card-span" v-if="item.desc">{{ item.desc }}</text>
						</view>
						<view class="card-bar">
							<view class="bar-fill"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- C. 章节选择列表模式（原版清爽卡片网格） -->
			<view class="chapter-sub-wrap" v-else-if="pageType === 'chapter-list'">
				<view class="page-header-card">
					<text class="page-lead-title">{{ pageTitle }}</text>
					<text class="page-lead-sub">请选择需要查阅的章节</text>
				</view>

				<view class="chapter-grid">
					<view 
						class="chapter-card" 
						v-for="(item, index) in listItems" 
						:key="index"
						@tap="onItemClick(item)"
					>
						<text class="c-title">{{ item.title }}</text>
					</view>
				</view>
			</view>

			<!-- D. 正文阅读器模式（原版优雅白底沉浸式卡片） -->
			<view class="article-reader-wrap" v-else-if="pageType === 'article'">
				<view class="reader-card-box">
					<view class="article-title-row" v-if="pageTitle">
						<text class="article-heading">{{ pageTitle }}</text>
					</view>

					<view class="article-body-flow" :style="{ fontSize: fontSize + 'px' }">
						<rich-text :nodes="cleanedHtml"></rich-text>
					</view>
				</view>
			</view>

			<!-- 底部版税标识 -->
			<view class="footer-note">查经资料大全 · 完整离线精选</view>
		</scroll-view>
	</view>
</template>

<script>
import { checkAndEnforceAuditGuard, isAuditMode } from '@/common/audit-guard.js';
import { CHAJING_BASE_URL, getChajingUrl } from '@/common/chajing-meta.js';

export default {
	data() {
		return {
			isAudit: true,
			loading: true,
			errorMessage: '',
			scrollTop: 0,
			fontSize: 17, // 原版阅读器默认 17px
			searchKeyword: '',

			// 页面类型: 'index' | 'book-list' | 'chapter-list' | 'article'
			pageType: 'index',
			pageTitle: '',
			pageSubtitle: '',
			currentPath: '',

			// 首页分组数据
			sections: [],
			// 子页面普通列表项
			listItems: [],
			// 纯正文 HTML
			cleanedHtml: '',

			// 面包屑历史
			breadcrumbs: []
		};
	},
	computed: {
		// 首页搜索过滤
		filteredSections() {
			if (!this.searchKeyword || !this.searchKeyword.trim()) {
				return this.sections;
			}
			const kw = this.searchKeyword.trim().toLowerCase();
			return this.sections.map(sec => {
				return {
					...sec,
					collapsed: false, // 搜索时自动展开
					items: sec.items.filter(it => it.title.toLowerCase().indexOf(kw) !== -1 || (it.desc && it.desc.toLowerCase().indexOf(kw) !== -1))
				};
			});
		}
	},
	onLoad(options) {
		if (!checkAndEnforceAuditGuard()) {
			return;
		}
		this.isAudit = isAuditMode();
		if (this.isAudit) {
			return;
		}

		// 默认入口：若指定了书卷则直达该卷
		const book = options.book || options.bookId || options.bookName || '';
		let initialPath = 'index.html';
		if (book) {
			const fullUrl = getChajingUrl(book);
			initialPath = fullUrl.replace(CHAJING_BASE_URL + '/', '');
		}

		this.loadPage(initialPath);
	},
	methods: {
		// 解码 HTML 数字实体编码（如 &#36190; 或 &amp;#36190; -> 赞）
		decodeNumericEntities(str) {
			if (!str) return '';
			return str
				.replace(/&amp;#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
				.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
				.replace(/&amp;#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
				.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
		},

		// 动态请求并解析页面
		loadPage(relPath, fallbackTitle = '') {
			this.loading = true;
			this.errorMessage = '';
			this.currentPath = relPath;
			this.searchKeyword = '';

			// 构建绝对请求 URL（安全编码空格与特殊字符，保证 # 编码为 %23）
			let reqUrl = CHAJING_BASE_URL + '/' + relPath;
			reqUrl = reqUrl.replace(/([^:])\/+/g, '$1/');
			reqUrl = reqUrl.replace(/ /g, '%20').replace(/#/g, '%23');

			uni.request({
				url: reqUrl,
				method: 'GET',
				dataType: 'text',
				responseType: 'text',
				success: (res) => {
					if (res.statusCode === 200 && res.data) {
						this.parseHtmlContent(res.data, relPath, fallbackTitle);
					} else {
						this.errorMessage = '获取资料失败 (HTTP ' + res.statusCode + ')';
					}
				},
				fail: (err) => {
					console.error('[Chajing] 请求失败:', err);
					this.errorMessage = '网络连接不稳定，请稍后重试';
				},
				complete: () => {
					this.loading = false;
					this.scrollTop = 0;
				}
			});
		},

		// 核心解析器：区分首页分组、注释列表、章节列表与正文
		parseHtmlContent(rawHtml, relPath, fallbackTitle = '') {
			const titleMatch = rawHtml.match(/<title>([^<]+)<\/title>/i);
			let title = titleMatch ? titleMatch[1].replace(/·.*$/, '').trim() : '';
			title = this.decodeNumericEntities(title);

			// 避免原站 title 污染（若包含“赞助商”、无意义标识或乱码，优先使用上一级卡片标题或正文实际篇名）
			if (!title || /赞助|资料大全|^01Gen|^40Matt|#\d+|index/i.test(title)) {
				if (fallbackTitle) {
					title = fallbackTitle;
				} else {
					const hMatch = rawHtml.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
					if (hMatch) {
						const hText = this.decodeNumericEntities(hMatch[1].replace(/<[^>]+>/g, '').trim());
						if (hText && !/赞助/i.test(hText)) {
							title = hText;
						}
					}
				}
			}
			if (!title && fallbackTitle) {
				title = fallbackTitle;
			}

			// 1. 判断是否是首页 (带有三大 section: sec-old, sec-new, sec-topics)
			if (relPath === 'index.html' || relPath === '' || rawHtml.indexOf('id="sec-old"') !== -1) {
				this.pageType = 'index';
				this.pageTitle = '查经资料大全';
				this.sections = this.extractIndexSections(rawHtml, relPath);
				this.updateBreadcrumbs('首页', relPath);
				return;
			}

			// 2. 判断是否为旧版表格型章节解经目录页 (如 01index-S.htm, 40ind#ex-S.htm 等)
			const isTableIndex = (
				relPath.toLowerCase().indexOf('index-s.htm') !== -1 ||
				relPath.toLowerCase().indexOf('ind#ex-s.htm') !== -1 ||
				(rawHtml.indexOf('<table') !== -1 && (title.indexOf('目录') !== -1 || title.indexOf('全卷') !== -1))
			);
			if (isTableIndex) {
				const tableItems = this.extractTableIndexList(rawHtml, relPath);
				if (tableItems.length > 0) {
					this.pageType = 'chapter-list';
					this.pageTitle = title || '全卷解经目录';
					this.listItems = tableItems;
					this.updateBreadcrumbs(this.pageTitle, relPath);
					return;
				}
			}

			// 3. 判断是否是章节列表页 (带有 class="chapter-card")
			if (rawHtml.indexOf('chapter-card') !== -1) {
				const chItems = this.extractChapterList(rawHtml, relPath);

				// 针对“全卷”过渡页平滑优化：若只包含 1 个指向 index-S 的跳转卡片，直接穿透加载目标目录
				if (chItems.length === 1 && (chItems[0].title === '全卷' || chItems[0].targetPath.indexOf('index-S') !== -1 || chItems[0].targetPath.indexOf('ind#ex-S') !== -1)) {
					this.loadPage(chItems[0].targetPath, title || '全卷');
					return;
				}

				this.pageType = 'chapter-list';
				this.pageTitle = title;
				this.listItems = chItems;
				this.updateBreadcrumbs(title, relPath);
				return;
			}

			// 4. 判断是否是书卷或注释书列表 (带有 class="card")
			if (rawHtml.indexOf('class="card"') !== -1 || rawHtml.indexOf("class='card'") !== -1) {
				this.pageType = 'book-list';
				this.pageTitle = title;
				
				const subMatch = rawHtml.match(/<div class="sub"[^>]*>([\s\S]*?)<\/div>/i);
				this.pageSubtitle = subMatch ? subMatch[1].replace(/<[^>]+>/g, '').trim() : '';

				this.listItems = this.extractCardList(rawHtml, relPath);
				this.updateBreadcrumbs(title, relPath);
				return;
			}

			// 5. 否则视为阅读正文页
			this.pageType = 'article';
			this.pageTitle = title;
			this.cleanedHtml = this.cleanArticleHtml(rawHtml);
			this.updateBreadcrumbs(title || '正文', relPath);
		},

		// 提取首页三大分组 (旧约圣经 39卷、新约圣经 27卷、主题查经 34类)
		extractIndexSections(html, currentRelPath) {
			const sections = [];

			// 定义首页三大经典分区的已知配置
			const secConfigs = [
				{ id: 'sec-old', fallbackTitle: '旧约圣经 · 39 卷', defaultCollapsed: false },
				{ id: 'sec-new', fallbackTitle: '新约圣经 · 27 卷', defaultCollapsed: false },
				{ id: 'sec-topics', fallbackTitle: '分类及主题式查经 · 34 类', defaultCollapsed: false }
			];

			for (const cfg of secConfigs) {
				const idMarker = 'id="' + cfg.id + '"';
				const startIdx = html.indexOf(idMarker);
				if (startIdx === -1) continue;

				// 找到该 section 起始标签的开头位置
				const secStart = html.lastIndexOf('<div', startIdx);
				if (secStart === -1) continue;

				// 截取到下一个 section 或 footer 前
				let secEnd = html.length;
				const nextSecIdx = html.indexOf('class="section', startIdx + idMarker.length);
				const footerIdx = html.indexOf('class="footer', startIdx + idMarker.length);

				if (nextSecIdx !== -1 && footerIdx !== -1) {
					secEnd = Math.min(nextSecIdx, footerIdx);
				} else if (nextSecIdx !== -1) {
					secEnd = nextSecIdx;
				} else if (footerIdx !== -1) {
					secEnd = footerIdx;
				}

				const secBlock = html.substring(secStart, secEnd);

				// 提取分组标题 (如 "旧约圣经 · 39 卷")
				const h2Match = secBlock.match(/<h2>([\s\S]*?)<\/h2>/i);
				let secTitle = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim() : cfg.fallbackTitle;

				// 提取该分组下的所有卡片
				const items = this.extractCardList(secBlock, currentRelPath);

				if (items.length > 0) {
					sections.push({
						id: cfg.id,
						title: secTitle,
						collapsed: cfg.defaultCollapsed,
						items: items
					});
				}
			}

			// 如果按 section 没提取到（例如非标准页面结构），则直接提取全部卡片作为一整个列表
			if (sections.length === 0) {
				const allItems = this.extractCardList(html, currentRelPath);
				if (allItems.length > 0) {
					sections.push({
						id: 'sec-all',
						title: '全部书卷',
						collapsed: false,
						items: allItems
					});
				}
			}

			return sections;
		},

		// 提取普通卡片 (书卷、注释书)
		extractCardList(html, currentRelPath) {
			const items = [];
			const regex = /<a\s+class="card"\s+href="([^"]+)">([\s\S]*?)<\/a>/gi;
			let match;
			while ((match = regex.exec(html)) !== null) {
				const href = match[1];
				const innerHtml = match[2];

				// 提取 <b> 标题
				const bMatch = innerHtml.match(/<b>([\s\S]*?)<\/b>/i);
				let title = bMatch ? bMatch[1].replace(/<[^>]+>/g, '').trim() : '';

				// 提取第一个非 bar 的 <span> 描述/篇数
				const spanMatch = innerHtml.match(/<span>([\s\S]*?)<\/span>/i);
				let desc = spanMatch ? spanMatch[1].replace(/<[^>]+>/g, '').trim() : '';

				if (title) {
					items.push({
						title: title,
						desc: desc,
						targetPath: this.resolveRelativeUrl(currentRelPath, href)
					});
				}
			}
			return items;
		},

		// 提取章节卡片 (第1章, 第2章...)
		extractChapterList(html, currentRelPath) {
			const items = [];
			const regex = /<a[^>]*class=["']?chapter-card["']?[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>|<a[^>]*href=["']([^"']+)["'][^>]*class=["']?chapter-card["']?[^>]*>([\s\S]*?)<\/a>/gi;
			let match;
			while ((match = regex.exec(html)) !== null) {
				const href = match[1] || match[3];
				const inner = match[2] || match[4];
				const titleMatch = inner.match(/<span[^>]*class=["']?c-title["']?[^>]*>([\s\S]*?)<\/span>/i);
				const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : inner.replace(/<[^>]+>/g, '').trim();
				if (title && href) {
					items.push({
						title: title,
						targetPath: this.resolveRelativeUrl(currentRelPath, href)
					});
				}
			}
			return items;
		},

		// 提取旧版表格型章节解经目录 (文摘解经全卷 拾穗 / 例证 / 纲目 矩阵)
		extractTableIndexList(html, currentRelPath) {
			const items = [];
			const seenPaths = new Set();

			// 匹配所有 <tr> 行
			const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
			let trMatch;
			while ((trMatch = trRegex.exec(html)) !== null) {
				const rowHtml = trMatch[1];
				
				// 提取本行中的章名纯文本（如 "第一章", "概论" 等无超链接的文本）
				let rowChapterText = '';
				const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
				let tdMatch;
				while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
					const tdInner = tdMatch[1];
					if (tdInner.indexOf('<a') === -1) {
						const txt = tdInner.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
						if (txt && (txt.indexOf('章') !== -1 || txt.indexOf('概论') !== -1 || txt.indexOf('提要') !== -1 || txt.indexOf('卷') !== -1)) {
							rowChapterText = txt;
							break;
						}
					}
				}

				// 提取本行中的所有解经链接
				const aRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
				let aMatch;
				while ((aMatch = aRegex.exec(rowHtml)) !== null) {
					const href = aMatch[1];
					const linkInner = aMatch[2];

					if (!href || href.indexOf('index.html') !== -1 || href.indexOf('index-S') !== -1 || href.indexOf('ind#ex-S') !== -1) {
						continue;
					}

					const resolved = this.resolveRelativeUrl(currentRelPath, href);
					if (seenPaths.has(resolved)) continue;

					const title = this.formatIndexItemTitle(linkInner, href, rowChapterText);
					if (title) {
						seenPaths.add(resolved);
						items.push({
							title: title,
							targetPath: resolved
						});
					}
				}
			}

			// 兜底：若按行解析为空，直接提取所有指向 .htm/.html 的解经链接
			if (items.length === 0) {
				const aRegex = /<a[^>]*href=["']([^"']+\.html?)["'][^>]*>([\s\S]*?)<\/a>/gi;
				let aMatch;
				while ((aMatch = aRegex.exec(html)) !== null) {
					const href = aMatch[1];
					const linkInner = aMatch[2];
					if (!href || href.indexOf('index.html') !== -1 || href.indexOf('index-S') !== -1 || href.indexOf('ind#ex-S') !== -1) {
						continue;
					}
					const resolved = this.resolveRelativeUrl(currentRelPath, href);
					if (seenPaths.has(resolved)) continue;

					const title = this.formatIndexItemTitle(linkInner, href, '');
					if (title) {
						seenPaths.add(resolved);
						items.push({
							title: title,
							targetPath: resolved
						});
					}
				}
			}

			return items;
		},

		// 格式化表格解经链接标题 (如 "第一章 · 拾穗", "第二章 · 例证")
		formatIndexItemTitle(linkText, href, rowChapterText) {
			let rawText = linkText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
			// 过滤导航和无关链接
			if (/返回|首页|目录|__全卷/i.test(rawText)) return null;

			// 尝试解析文件名中的 书卷代码+类型代码+章节号，如 01CS01.htm, 40GS05.htm
			const fileNameMatch = href.match(/([0-9]{2})([A-Za-z]{2})([0-9]{2}[A-Za-z]?)\.html?/i);
			if (fileNameMatch) {
				const typeCode = fileNameMatch[2].toUpperCase();
				const chNumStr = fileNameMatch[3];
				const chNum = parseInt(chNumStr, 10);

				let typeName = '解经';
				if (typeCode === 'CS') typeName = '拾穗';
				else if (typeCode === 'GS') typeName = '例证';
				else if (typeCode === 'OS' || typeCode === 'IS') typeName = '纲目';
				else if (typeCode === 'BT') typeName = '背景';
				else if (typeCode === 'CT') typeName = '灵修';

				let chName = chNum === 0 ? '概论' : `第 ${chNum} 章`;
				if (rowChapterText && rowChapterText.trim()) {
					chName = rowChapterText.trim();
				}

				return `${chName} · ${typeName}`;
			}

			if (rawText && !/^\s*$/.test(rawText)) {
				return rowChapterText ? `${rowChapterText} · ${rawText}` : rawText;
			}

			return null;
		},

		// 正文净化：去除顶部网页导航与无关链接，保留核心正文排版
		cleanArticleHtml(html) {
			let content = html;

			// 0. 将乱码数字实体解码为汉字，便于后续精准匹配与正常排版
			content = this.decodeNumericEntities(content);

			// 1. 彻底剥离 <head> 与外层 <html><body> 标签（防止个别旧页面缺少 </body> 导致 head 泄露）
			content = content.replace(/<head[\s\S]*?<\/head>/gi, '');
			content = content.replace(/<body[^>]*>/gi, '');
			content = content.replace(/<\/body>/gi, '');
			content = content.replace(/<\/?html[^>]*>/gi, '');

			// 2. 移除原 HTML 顶部深色导航条（仅删除独立的 header div）
			content = content.replace(/<div\s+style=["']?background:#123a63[^"']*["']?[^>]*>[\s\S]*?<\/div>/gi, '');

			// 3. 移除原站顶部“返回首页 / 返回本书目录”整段导航（严格限定在单个 p 标签内，绝不跨越 </p> 误删正文）
			content = content.replace(/<p[^>]*>(?:(?!<\/p>)[\s\S])*?(?:返回首页|返回本书目录|返回基督教圣经)(?:(?!<\/p>)[\s\S])*?<\/p>/gi, '');

			// 移除独立残留链接与零散文本
			content = content.replace(/<a[^>]*>[^<]*(?:返回首页|返回本书目录|返回基督教圣经)[^<]*<\/a>/gi, '');
			content = content.replace(/https?:\/\/[^\s<]+(?:返回首页|返回本书目录)/gi, '');
			content = content.replace(/(?:返回首页\s*\|\s*返回本书目录|返回首页\s*\|\s*|\|\s*返回本书目录)/gi, '');

			// 4. 安全去除 <center> 与 </center> 标签本身，保留内部所有文字、段落与表格
			content = content.replace(/<\/?center[^>]*>/gi, '');

			// 5. 精准定点移除广告和赞助商标头与段落（严格限定在单个标签内，绝不删除外层大容器）
			content = content.replace(/<h[1-6][^>]*>(?:(?!<\/h[1-6]>)[\s\S])*?赞助商链接(?:(?!<\/h[1-6]>)[\s\S])*?<\/h[1-6]>/gi, '');
			content = content.replace(/<p[^>]*>(?:(?!<\/p>)[\s\S])*?赞助商链接(?:(?!<\/p>)[\s\S])*?<\/p>/gi, '');
			content = content.replace(/<a[^>]*>[^<]*赞助商链接[^<]*<\/a>/gi, '');
			content = content.replace(/<span[^>]*>[^<]*赞助商链接[^<]*<\/span>/gi, '');
			content = content.replace(/赞助商链接/g, '');

			// 6. 移除带有 ad 类名的独立广告小块
			content = content.replace(/<div\s+class=["']?ad[12]?["']?[^>]*>[\s\S]*?<\/div>/gi, '');

			// 7. 移除内联脚本与样式
			content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
			content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

			// 8. 格式化样式与段落行距
			content = content.replace(/<p/gi, '<p style="margin: 14px 0; line-height: 1.85; color: #1e293b; text-align: justify;"');
			content = content.replace(/<span/gi, '<span style="line-height: 1.85;"');

			// 9. 绝不白屏兜底保障：若清洗后为空，回退使用原始正文基础版
			if (!content || !content.trim()) {
				content = html
					.replace(/<head[\s\S]*?<\/head>/gi, '')
					.replace(/<script[\s\S]*?<\/script>/gi, '')
					.replace(/<style[\s\S]*?<\/style>/gi, '');
			}

			return content;
		},

		// 相对路径解析辅助
		resolveRelativeUrl(basePath, relativeHref) {
			if (!relativeHref) return '';
			if (relativeHref.startsWith('http://') || relativeHref.startsWith('https://')) {
				return relativeHref.replace(CHAJING_BASE_URL + '/', '');
			}

			const baseParts = basePath.split('/');
			baseParts.pop(); // 移除当前文件名

			const relParts = relativeHref.split('/');
			for (const part of relParts) {
				if (part === '.' || part === '') continue;
				if (part === '..') {
					if (baseParts.length > 0) baseParts.pop();
				} else {
					baseParts.push(part);
				}
			}
			return baseParts.join('/');
		},

		// 切换首页分组折叠状态
		toggleSection(sec) {
			sec.collapsed = !sec.collapsed;
		},

		// 点击卡片进入下一层
		onItemClick(item) {
			if (!item.targetPath) return;
			this.loadPage(item.targetPath, item.title || '');
		},

		// 面包屑历史管理
		updateBreadcrumbs(title, path) {
			if (path === 'index.html' || path === '' || path === '/') {
				this.breadcrumbs = [];
				return;
			}

			const existIdx = this.breadcrumbs.findIndex(b => b.path === path);
			if (existIdx !== -1) {
				this.breadcrumbs = this.breadcrumbs.slice(0, existIdx + 1);
			} else {
				this.breadcrumbs.push({
					title: title || '上一级',
					path: path
				});
			}
		},

		// 点击面包屑导航回退
		navCrumb(crumb, idx) {
			if (idx === this.breadcrumbs.length - 1) return;
			this.breadcrumbs = this.breadcrumbs.slice(0, idx + 1);
			this.loadPage(crumb.path, crumb.title || '');
		},

		// 回到查经首页
		navHome() {
			this.breadcrumbs = [];
			this.loadPage('index.html');
		},

		// 重新加载
		reloadCurrent() {
			this.loadPage(this.currentPath || 'index.html', this.pageTitle || '');
		},

		// 字体放大缩小
		changeFontSize(delta) {
			const target = this.fontSize + delta;
			if (target >= 14 && target <= 26) {
				this.fontSize = target;
			}
		}
	}
};
</script>

<style scoped>
.chajing-container {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	background-color: #f8fafc;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* ================= 1. 原版深蓝夜空渐变 Hero 头部 ================= */
.hero-topbar {
	background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #172554 100%);
	padding: 24px 18px 20px;
	box-shadow: 0 4px 20px rgba(15, 23, 42, 0.25);
}

.hero-header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.hero-title {
	font-size: 24px;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: -0.02em;
}

.hero-badge {
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.14);
	border: 1px solid rgba(255, 255, 255, 0.22);
	padding: 4px 12px;
	border-radius: 20px;
}

.hero-badge-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background-color: #10b981;
	margin-right: 6px;
}

.hero-badge-text {
	font-size: 12px;
	color: #f8fafc;
	font-weight: 500;
}

/* 搜索框 */
.hero-search-box {
	display: flex;
	align-items: center;
	background: #ffffff;
	margin-top: 16px;
	padding: 8px 14px;
	border-radius: 12px;
	box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
}

.search-icon {
	font-size: 14px;
	margin-right: 8px;
	opacity: 0.7;
}

.search-input {
	flex: 1;
	font-size: 14px;
	color: #0f172a;
}

.search-placeholder {
	color: #94a3b8;
}

.clear-icon {
	font-size: 18px;
	color: #94a3b8;
	padding: 0 4px;
}

/* ================= 2. 非首页深蓝吸顶面包屑导航 ================= */
.reader-topbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
	padding: 12px 16px;
	box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
}

.breadcrumb {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	flex: 1;
}

.breadcrumb-item {
	font-size: 13.5px;
	color: #93c5fd;
	font-weight: 500;
}

.breadcrumb-item.active {
	color: #ffffff;
	font-weight: 600;
}

.home-btn {
	display: flex;
	align-items: center;
}

.home-icon {
	font-size: 12px;
	margin-right: 3px;
}

.divider {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.4);
	margin: 0 6px;
}

.font-controls {
	display: flex;
	align-items: center;
}

.font-btn {
	padding: 3px 9px;
	margin-left: 8px;
	background: rgba(255, 255, 255, 0.16);
	border: 1px solid rgba(255, 255, 255, 0.24);
	border-radius: 6px;
}

.font-btn-text {
	font-size: 12px;
	color: #ffffff;
	font-weight: bold;
}

/* ================= 3. 状态层 ================= */
.loading-state,
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 100px;
}

.spinner {
	width: 32px;
	height: 32px;
	border: 3px solid #cbd5e1;
	border-top-color: #1e3a8a;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.loading-text {
	margin-top: 14px;
	font-size: 14px;
	color: #64748b;
}

.error-text {
	margin: 16px 0;
	font-size: 14px;
	color: #ef4444;
}

.retry-btn {
	padding: 0 24px;
	height: 36px;
	line-height: 36px;
	background: #1e3a8a;
	color: #fff;
	font-size: 14px;
	border-radius: 8px;
}

/* ================= 4. 滚动区域与原版双列网格 ================= */
.content-scroll {
	flex: 1;
	height: 0;
}

.index-content-wrap,
.book-sub-wrap,
.chapter-sub-wrap {
	padding: 16px 14px 30px;
}

/* 分组标题与指示条 */
.section-container {
	margin-bottom: 24px;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 2px 12px;
}

.section-title-wrap {
	display: flex;
	align-items: center;
}

.section-indicator {
	width: 4px;
	height: 18px;
	background: #1e3a8a;
	border-radius: 2px;
	margin-right: 8px;
}

.section-title {
	font-size: 18px;
	font-weight: 700;
	color: #0f172a;
	letter-spacing: -0.01em;
}

.section-toggle-badge {
	display: flex;
	align-items: center;
	padding: 3px 8px;
	background: #e2e8f0;
	border-radius: 12px;
}

.badge-txt {
	font-size: 12px;
	color: #475569;
}

.badge-arrow {
	font-size: 10px;
	color: #475569;
	margin-left: 4px;
}

/* 原版经典双列网格系统 */
.grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
}

/* 原版高质感卡片 */
.card {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 12px 14px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	min-height: 84px;
}

.card:active {
	background-color: #f1f5f9;
	border-color: #93c5fd;
	transform: translateY(1px);
}

.card-b {
	font-size: 15px;
	font-weight: 600;
	color: #0f172a;
	line-height: 1.4;
	margin-bottom: 4px;
}

.card-meta {
	display: flex;
	align-items: center;
}

.card-span {
	font-size: 12px;
	color: #64748b;
}

/* 卡片绿色进度条 (原版标志性特征) */
.card-bar {
	width: 100%;
	height: 4px;
	background: #e2e8f0;
	border-radius: 2px;
	margin-top: 10px;
	overflow: hidden;
}

.bar-fill {
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, #10b981, #059669);
	border-radius: 2px;
}

/* ================= 5. 书卷头部分类卡片 ================= */
.page-header-card {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 16px;
	margin-bottom: 14px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.page-lead-title {
	display: block;
	font-size: 19px;
	font-weight: 700;
	color: #0f172a;
}

.page-lead-sub {
	display: block;
	margin-top: 6px;
	font-size: 13px;
	color: #64748b;
}

/* ================= 6. 章节卡片列表 ================= */
.chapter-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 10px;
}

.chapter-card {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 14px 6px;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.chapter-card:active {
	background-color: #e2e8f0;
	border-color: #93c5fd;
}

.c-title {
	font-size: 14px;
	color: #1e3a8a;
	font-weight: 600;
	text-align: center;
}

/* ================= 7. 原版沉浸式阅读器卡片 ================= */
.article-reader-wrap {
	padding: 16px 14px 40px;
}

.reader-card-box {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 22px 18px 36px;
	box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.06);
}

.article-title-row {
	padding-bottom: 14px;
	margin-bottom: 18px;
	border-bottom: 1px solid #e2e8f0;
}

.article-heading {
	font-size: 22px;
	font-weight: 700;
	color: #0f172a;
	line-height: 1.4;
}

.article-body-flow {
	color: #1e293b;
	line-height: 1.85;
}

/* 底部小字 */
.footer-note {
	padding: 24px 0 36px;
	text-align: center;
	font-size: 12px;
	color: #94a3b8;
}
</style>
