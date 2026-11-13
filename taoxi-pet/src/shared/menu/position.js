/**
 * 面板落点几何：决定级联子菜单摆在父面板的哪一侧，保证不与任何已展开面板重叠。
 * 纯函数，不碰 DOM；调用方只负责读矩形与写样式。
 * @module taoxi-pet/src/shared/menu/position
 */
/** 面板与边界、面板之间的间距（px）。 */
const PANEL_GAP = 4;
/**
 * 决定子面板的落点：优先不与任何已展开面板重叠，其次贴边。
 *
 * @param input - 面板尺寸、触发项/父面板矩形、其它面板矩形与 clamp 范围。
 * @returns 面板左上角在视口坐标里的落点。
 */
export function pickPanelPosition(input) {
    const { panel, item, parent, others, clamp } = input;
    const minLeft = clamp.x + PANEL_GAP;
    const minTop = clamp.y + PANEL_GAP;
    const maxLeft = clamp.x + clamp.w - PANEL_GAP - panel.w;
    const maxTop = clamp.y + clamp.h - PANEL_GAP - panel.h;
    /** 夹进 clamp；面板比 clamp 还宽/高时贴左上角。 */
    const clampX = (v) => Math.max(minLeft, Math.min(v, Math.max(minLeft, maxLeft)));
    const clampY = (v) => Math.max(minTop, Math.min(v, Math.max(minTop, maxTop)));
    const hitsOther = (left, top) => others.some((b) => left < b.right && left + panel.w > b.left && top < b.bottom && top + panel.h > b.top);
    const fitsClamp = (left, top) => left >= minLeft - 0.5 && left <= maxLeft + 0.5 && top >= minTop - 0.5 && top <= maxTop + 0.5;
    const topAtItem = clampY(item.top);
    const topAtParent = clampY(parent.top);
    // 以父面板（不是触发项）为基准：触发项长在父面板里，按它往左翻必然盖回父面板。
    const cands = [
        { left: parent.right + PANEL_GAP, top: topAtItem },
        { left: parent.left - PANEL_GAP - panel.w, top: topAtItem },
        { left: parent.right + PANEL_GAP, top: topAtParent },
        { left: parent.left - PANEL_GAP - panel.w, top: topAtParent },
    ];
    const ideal = cands.find((cd) => fitsClamp(cd.left, cd.top) && !hitsOther(cd.left, cd.top));
    if (ideal)
        return ideal;
    // 次优：夹进 clamp 后仍要避开其它面板——贴边但不重叠，好过完整落位但压住上层。
    const fitted = cands
        .map((cd) => ({ left: clampX(cd.left), top: clampY(cd.top) }))
        .find((cd) => !hitsOther(cd.left, cd.top));
    if (fitted)
        return fitted;
    // 兜底：窗口太窄，任何落点都会压到——贴父面板右侧夹取，宁可贴边也不叠在一起。
    return { left: clampX(parent.right + PANEL_GAP), top: clampY(topAtItem) };
}
