// 全局安全门禁中心：防审核爬虫页面直达遍历与非法渗透
import { POEMS_API_BASE } from './config.js';

const AUDIT_STORAGE_KEY = 'VALLEY_SHOW_PLAY_STATE_V1';

/**
 * 获取当前是否处于审核模式
 * @returns {boolean} true 表示处于审核模式 (绝不放行圣经/小说)，false 表示正常开放模式
 */
export function isAuditMode() {
    try {
        const userInfo = uni.getStorageSync('VALLEY_USER_INFO') || uni.getStorageSync('VALLEY_BIBLE_USER_INFO_V1');
        if (userInfo && (userInfo.isWhitelist === true || userInfo.isWhitelist === 1)) {
            return false; // 超级白名单用户无视审核态，直接放行正常圣经与诗歌模式
        }
        const cached = uni.getStorageSync(AUDIT_STORAGE_KEY);
        // 只有明确为 true 时才放行，其余一切状态 (包括未联网、空值、报错) 坚决判定为审核模式
        if (cached === true || cached === 'true' || cached === 1 || cached === '1') {
            return false; // 放行正常模式
        }
    } catch (e) {}
    return true; // 默认防御状态：处于审核中
}

/**
 * 同步更新审核状态
 * @param {boolean|string|number} showPlay 后端返回的 showPlay 字段
 */
export function updateAuditStatus(showPlay) {
    const isOpen = (showPlay === true || showPlay === 'true' || showPlay === 1 || showPlay === '1');
    try {
        uni.setStorageSync(AUDIT_STORAGE_KEY, isOpen);
    } catch (e) {}
    console.log(`[AuditGuard] 审核状态已更新: ${isOpen ? '放行正常模式' : '锁定百城漫游模式'}`);
    return !isOpen;
}

/**
 * 页面级强制驱逐门禁 (Route Guard)
 * 当任何非公开页面被微信爬虫或审核后台直接直达 (Deep Link) 唤起时，立即光速弹射回首页
 * @returns {boolean} true: 允许继续执行页面逻辑; false: 已触发驱逐，应立即 return 阻断后续执行
 */
export function checkAndEnforceAuditGuard() {
    if (isAuditMode()) {
        console.warn('[AuditGuard] 🚨 检测到审核期非法直达探测，立即阻断并光速弹回首页！');
        uni.reLaunch({
            url: '/pages/index/index',
            fail: () => {
                uni.redirectTo({ url: '/pages/index/index' });
            }
        });
        return false;
    }
    return true;
}
