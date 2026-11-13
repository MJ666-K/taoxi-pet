/**
 * 动画素材的地址拼装：点播给了完整 url 就用它，否则按「素材根 + 动画名 + 扩展名」拼宿主路由。
 * 两段都过 `encodeURIComponent`——动画名与素材根都允许中文与空格，不编码会让路由匹配不上。
 * 扩展名由调用方探测后传入（`thumbExt()` 读 UA），本模块不碰浏览器环境。
 * @module taoxi-pet/src/client/pet/animation/assets
 */
import { ROUTE_PATH } from '../../../shared/constants.ts';
/**
 * 拼一次动画的素材地址。
 *
 * @param source - 地址来源与标识。
 * @returns 可直接 fetch 的地址；`cueUrl` 优先。
 */
export function animationAssetUrl(source) {
    if (source.cueUrl)
        return source.cueUrl;
    const root = source.assetRoot === '' ? source.id : source.assetRoot;
    return ROUTE_PATH + '/thumb/' + encodeURIComponent(root) + '/' + encodeURIComponent(source.anim) + source.ext;
}
