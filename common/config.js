// ==============================================================================
// 全局配置中心 (支持 Cloudflare 隐藏真实 IP、标准 443 端口与动静分离架构)
// ==============================================================================

// 主服务域名 (通过 Cloudflare 边缘代理，隐藏真实源站 IP，使用标准 443 HTTPS 端口)
export const SERVER_HOST = 'https://valleynode.dpdns.org';

// API 根路径
export const API_BASE = `${SERVER_HOST}/api`;

// 圣经业务 API
export const BIBLE_API_BASE = `${API_BASE}/bible`;

// 诗歌与设置 API (兼容 renren-api 路径)
export const POEMS_API_BASE = `${API_BASE}/renren-api/api/poems`;

// 静态资源基础路径 (经文 JSON、音频 MP3、诗歌图片)
export const STATIC_BAK_BASE = `${SERVER_HOST}/bak`;
export const BIBLE_ASSETS_BASE = `${STATIC_BAK_BASE}/bible-mp3-cn`;

// 免审核 H5 容器页面地址 (读经小队与社区)
export const H5_TEAM_URL = `${SERVER_HOST}/h5/#/pages/bible/team`;
