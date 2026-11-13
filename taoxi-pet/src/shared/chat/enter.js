/**
 * 对话输入框「回车发送」的判据：只有真按回车、且输入法没在管这个键时才发。
 * 桌面端与浏览器端共用；组合态由 compositionstart / compositionend 转进来，本模块不碰 DOM、不读时钟。
 * @module taoxi-pet/src/shared/chat/enter
 */
/** 组合结束后仍算「上屏那一下」的静默窗（ms）：Safari 会先 compositionend 再派发 keydown。 */
export const COMPOSITION_SETTLE_MS = 80;
/**
 * 造一个空组合态。
 *
 * @returns 供 `compositionstart` / `compositionend` 与 {@link decideEnter} 共用的句柄。
 */
export function createCompositionWatch() {
    let composing = false;
    // 用 -Infinity 当「从未结束过」：任何时刻的静默窗判定都为假，不必额外分支
    let endedAt = Number.NEGATIVE_INFINITY;
    return {
        start: () => {
            composing = true;
        },
        end: (at) => {
            composing = false;
            endedAt = at;
        },
        isComposing: () => composing,
        endedWithin: (now) => now - endedAt < COMPOSITION_SETTLE_MS,
    };
}
/**
 * 这一次回车归谁。
 *
 * @param event - 键盘事件里与输入法相关的字段。
 * @param watch - 这个输入框的组合态。
 * @param now - 当前时刻（ms），必须与 {@link CompositionWatch.end} 用同一时钟。
 * @returns `send` 发送；`swallow` 拦下默认行为但不发；`ignore` 不干预（输入法或换行自己处理）。
 */
export function decideEnter(event, watch, now) {
    if (event.key !== 'Enter' || event.shiftKey)
        return 'ignore';
    // 组合中的回车归输入法：此时 preventDefault 可能打断上屏，连拦都不拦
    if (event.isComposing === true || event.keyCode === 229 || watch.isComposing())
        return 'ignore';
    // 长按产生的重复回车：既不该发送，也不该每一下插一个换行
    if (event.repeat === true)
        return 'swallow';
    // 刚上屏那一下：组合已经提交，拦下默认行为只是别留下一个空行
    if (watch.endedWithin(now))
        return 'swallow';
    return 'send';
}
