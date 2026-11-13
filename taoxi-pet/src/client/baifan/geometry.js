/**
 * 「吃白饭」的几何换算：把实况中心点换成脚底、嘴与地面线（全部视口像素）。
 *
 * 纯函数 + 一个量距缓存；不碰接口、不写 DOM，调用方给什么位置就按什么算。
 * @module taoxi-pet/src/client/baifan/geometry
 */
import { CFG } from './constants.ts';
/** 归一化坐标夹到 0–1（窗口极小时算出来的值会越界）。 */
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
/**
 * 量精灵盒子。
 *
 * 优先找**正压在实况中心点上的那段 `<video>`**（渲染端把宠物画成 video），它的 rect
 * 就是角色真实占位——这样不必猜 size 是宽还是高。找不到就退回上次量到的值，再不行按 16:9 兜底。
 *
 * @param cx - 中心点视口 x。
 * @param cy - 中心点视口 y。
 * @param last - 上一次量到的盒子（可能还没量过）。
 * @returns 本次量到的盒子。
 */
export function spriteBox(cx, cy, last) {
    let best = null;
    let bestDistance = Infinity;
    for (const video of document.querySelectorAll('video')) {
        const rect = video.getBoundingClientRect();
        if (rect.width < 60 || rect.height < 30)
            continue;
        const distance = Math.hypot(rect.left + rect.width / 2 - cx, rect.top + rect.height / 2 - cy);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = rect;
        }
    }
    if (best !== null && bestDistance < 90)
        return { w: best.width, h: best.height };
    if (last.w > 0)
        return last;
    return { w: CFG.refWidth, h: (CFG.refWidth * 9) / 16 };
}
/**
 * 由实况算出这一帧的几何量。
 *
 * 素材是 16:9，但渲染端容器不一定也是 16:9（可能正方形、也可能带内边距），那时角色在容器里
 * 是**带黑边的**。所以先按 16:9 裁出真正画出来的那块，再算脚底和嘴——否则脚底会算低，角色被下沿切掉半截。
 *
 * @param pose - 实况。
 * @param box - 精灵盒子。
 * @returns 这一帧的几何量。
 */
export function geometry(pose, box) {
    const cx = pose.x * window.innerWidth;
    const cy = pose.y * window.innerHeight;
    const contentH = Math.min(box.h, (box.w * 9) / 16);
    const padTop = (box.h - contentH) / 2;
    const top = cy - box.h / 2 + padTop;
    return {
        cx,
        cy,
        w: box.w,
        h: contentH,
        top,
        feet: top + contentH * CFG.footRatio,
        mouthY: top + contentH * CFG.mouthRatio,
        scale: box.w / CFG.refWidth,
    };
}
/** 地面线（视口像素，米饭底边落在这儿）。 */
export const groundLine = () => window.innerHeight - CFG.groundOffset;
/**
 * 让脚底落在地面线时，中心点该在哪个归一化 y。
 *
 * @param geom - 当前几何量。
 * @returns 归一化 y。
 */
export function bottomNormY(geom) {
    return clamp01((groundLine() - (geom.feet - geom.cy)) / window.innerHeight);
}
