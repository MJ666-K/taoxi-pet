/** 矩形右缘（不含）。 */
export const rectRight = (r) => r.x + r.width;
/** 矩形下缘（不含）。 */
export const rectBottom = (r) => r.y + r.height;
/** 外接矩形：视口原点与比例换算仍取它，但边界判定一律走并集；空列表返回 0×0。 */
export const boundingRect = (rects) => {
    if (rects.length === 0)
        return { x: 0, y: 0, width: 0, height: 0 };
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const r of rects) {
        x0 = Math.min(x0, r.x);
        y0 = Math.min(y0, r.y);
        x1 = Math.max(x1, rectRight(r));
        y1 = Math.max(y1, rectBottom(r));
    }
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};
/** 点是否落在矩形内（右/下缘不含）：相邻两屏缝隙为 0 时，点归左/上那块。 */
export const pointInRect = (r, x, y) => x >= r.x && x < rectRight(r) && y >= r.y && y < rectBottom(r);
/** 点被哪块屏覆盖；无则 null。重叠时取列表中第一块（与 Chromium「先发现者优先」一致）。 */
export const rectAtPoint = (rects, x, y) => {
    for (const r of rects)
        if (pointInRect(r, x, y))
            return r;
    return null;
};
/** 同 rectAtPoint，返回下标（−1 = 无覆盖）；抛掷要用下标记住当前所在屏。 */
export const indexAtPoint = (rects, x, y) => {
    for (let i = 0; i < rects.length; i++)
        if (pointInRect(rects[i], x, y))
            return i;
    return -1;
};
/** 点到矩形的最短距离平方（点在矩形内为 0）。 */
export const distToRectSq = (r, x, y) => {
    const dx = Math.max(r.x - x, 0, x - rectRight(r));
    const dy = Math.max(r.y - y, 0, y - rectBottom(r));
    return dx * dx + dy * dy;
};
/** 离点最近的屏下标；空列表返回 −1。用于宠物落在空洞或屏幕被拔掉后归位。 */
export const nearestIndex = (rects, x, y) => {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < rects.length; i++) {
        const d = distToRectSq(rects[i], x, y);
        if (d < bestD) {
            bestD = d;
            best = i;
        }
    }
    return best;
};
/** 点所在屏；不在任何屏上时取最近的那块（列表为空才返回 null）。 */
export const resolveRect = (rects, x, y) => {
    const hit = rectAtPoint(rects, x, y);
    if (hit)
        return hit;
    const i = nearestIndex(rects, x, y);
    return i < 0 ? null : rects[i];
};
/** 把点夹进指定矩形（右/下缘留 1px，保证结果仍满足 pointInRect）。 */
export const clampPointInRect = (r, x, y) => ({
    x: Math.min(Math.max(x, r.x), rectRight(r) - 1),
    y: Math.min(Math.max(y, r.y), rectBottom(r) - 1),
});
/** 把点夹进并集：已在并集内原样返回，否则夹进最近的那块屏。用于显示器拔插后把落在空洞里的宠物拉回可见区。 */
export const clampPointToRegion = (rects, x, y) => {
    if (rectAtPoint(rects, x, y))
        return { x, y };
    const i = nearestIndex(rects, x, y);
    return i < 0 ? { x, y } : clampPointInRect(rects[i], x, y);
};
/**
 * 显示器拓扑变化后重定位宠物中心：世界坐标守恒，只有点不落在任何屏上才夹到最近屏。
 * 参数与返回值都是新视口的相对坐标；视口原点随拓扑平移，直接拿旧坐标去夹会让宠物每次开合都漂一次。
 */
export const rebaseCenter = (center, fromView, toView, areas) => clampPointToRegion(areas, center.x + fromView.x - toView.x, center.y + fromView.y - toView.y);
/** 并集面积（各屏不重叠时等于面积和；重叠会重复计，仅作诊断）。 */
export const regionArea = (rects) => rects.reduce((s, r) => s + r.width * r.height, 0);
/** 外接矩形中不属于任何屏的面积占比 0~1（诊断用；矩形不重叠时精确）。 */
export const regionHoleRatio = (rects) => {
    const hull = boundingRect(rects);
    const hullArea = hull.width * hull.height;
    if (hullArea <= 0)
        return 0;
    return Math.max(0, 1 - regionArea(rects) / hullArea);
};
/** 整体平移一组矩形（屏幕坐标 → 视口相对坐标：减去视口原点）。 */
export const translateRects = (rects, dx, dy) => rects.map((r) => ({ x: r.x + dx, y: r.y + dy, width: r.width, height: r.height }));
