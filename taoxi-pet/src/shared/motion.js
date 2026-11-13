/**
 * 移动几何、角落定位与窗口落位：纯计算，无 DOM / ref，可独立单测。
 * 移动规划归一化为视口比例，px 换算由调用方完成；角落定位返回宠物根节点左上角的像素坐标。
 * 不负责 rAF 驱动与样式写入，那些在各端的薄壳里。
 * 依赖共享层的选择函数与显示器几何，保证两端算出同一条路线。
 * @module taoxi-pet/src/shared/motion
 */
import { randomBetween } from './pickers.ts';
import { rectAtPoint, rectBottom, rectRight } from './displays.ts';
/** 计算一次移动的起点/终点比例坐标；目标越出边界（含边距）时返回 null。
 *  sideAllow = 左右透明边余量：边界按身体贴边而不是按整个视频盒贴边，宠物能走到屏幕边缘、身体不越界。
 *  areas 传入时（桌面多显示器）改判工作区并集：缝隙两侧都有屏即可骑缝走过，外接矩形的空洞走不进去；
 *  不传时按 W/H 单矩形判定，浏览器半侧行为不变。 */
export const planMove = (o) => {
    const side = o.sideAllow ?? 0;
    const distance = randomBetween(o.minDist, o.maxDist);
    const target = o.cx + o.dir * distance;
    if (o.areas && o.areas.length > 0) {
        // 身体左右缘各外扩 margin 后都得落在某块屏上（可以分属不同屏 = 允许骑缝行走）
        const bodyHalf = o.halfW - side;
        if (!rectAtPoint(o.areas, target - bodyHalf - o.margin, o.cy))
            return null;
        if (!rectAtPoint(o.areas, target + bodyHalf + o.margin, o.cy))
            return null;
    }
    else {
        // margin 语义 =「身体到屏幕边缘的安全距」：盒中心可到 margin + halfW - side（身体左缘 = margin）
        const leftBound = o.margin + o.halfW - side;
        const rightBound = o.W - o.margin - o.halfW + side;
        if (target < leftBound || target > rightBound)
            return null;
    }
    return {
        startRatio: o.cx / o.W,
        startYRatio: o.cy / o.H,
        targetRatio: target / o.W,
        totalRatio: Math.abs(target - o.cx) / o.W,
    };
};
/**
 * 角落 + 边距 → 宠物根节点左上角像素坐标，与浏览器半侧 overlay 的 CSS 角落语义一致。
 * area 传入时角落取那块屏而不是视口外接矩形：不规则布局下外接矩形的角落可能不属于任何屏，
 * 配了该角落的宠物会开机即隐身，所以桌面端必须传主屏工作区。不传时按 W/H，overlay 行为不变。
 */
export const anchorPixel = (o) => {
    const height = (o.size * 9) / 16;
    const a = o.area ?? { x: 0, y: 0, width: o.W, height: o.H };
    const left = a.x + o.marginX;
    const top = a.y + o.marginY;
    const right = a.x + a.width - o.size - o.marginX;
    const bottom = a.y + a.height - height - o.marginY;
    switch (o.corner) {
        case 'top-left':
            return { x: left, y: top };
        case 'top-right':
            return { x: right, y: top };
        case 'bottom-left':
            return { x: left, y: bottom };
        case 'bottom-right':
            return { x: right, y: bottom };
    }
};
/** 单轴钳制：窗口比工作区还大（max < min）时贴住起点，与窗口管理器的行为一致。 */
const clampAxis = (want, min, max) => Math.min(Math.max(want, min), Math.max(min, max));
/**
 * 本体位置 → 窗口落位：窗口尺寸固定，本体在窗口内的偏移随之变化。
 *
 * @remarks
 * 钳窗口的平台允许的窗口位置不含工作区外，探不出去的那一截转成本体在窗口内的偏移，本体落脚点因此
 * 不受钳制影响；`area` 缺省表示该平台不钳窗口，此时偏移恒等于余量。越界那截由窗口裁掉，与网页端
 * 的可见下限同一条规则：宠物能挂出去，但命中区永远留一角可点。
 * @param o - 几何输入：本体位置、窗口与本体尺寸、期望余量、越界允许量、所在屏工作区。
 * @returns 窗口落位与本体偏移；调用方按 { x, y, width, height } 摆窗口，按偏移摆本体。
 */
export const fitWindowInArea = (o) => {
    const wantX = o.bodyX - o.insetX;
    const wantY = o.bodyY - o.insetY;
    if (!o.area)
        return { x: wantX, y: wantY, offsetX: o.insetX, offsetY: o.insetY };
    const area = o.area;
    const reach = o.reach ?? { left: 0, right: 0, top: 0, bottom: 0 };
    // 本体能摆到哪：工作区再外扩 reach。越界那截由窗口裁掉，命中区仍留一角可点
    const bodyX = clampAxis(o.bodyX, area.x - reach.left, rectRight(area) - o.bodyWidth + reach.right);
    const bodyY = clampAxis(o.bodyY, area.y - reach.top, rectBottom(area) - o.bodyHeight + reach.bottom);
    // 窗口只跟着本体走，但被系统钳在工作区内；差出来的那截就是本体在窗口内的偏移
    const x = clampAxis(bodyX - o.insetX, area.x, rectRight(area) - o.width);
    const y = clampAxis(bodyY - o.insetY, area.y, rectBottom(area) - o.height);
    return { x, y, offsetX: bodyX - x, offsetY: bodyY - y };
};
