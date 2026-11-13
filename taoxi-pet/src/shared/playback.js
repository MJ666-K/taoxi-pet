/**
 * 播放状态词汇表：宿主受理（`accepted`）、渲染端可上报的四种状态，以及哪些是终态。
 * 两端共用同一份定义：宿主的状态机与浏览器侧的回执都从这取，避免各写一套字面量最后对不上。
 * 不是状态机：转移规则在宿主 `playback` 里，这里只有词汇。
 * @module taoxi-pet/src/shared/playback
 */
/** 终态：到达后不可再变。 */
export const TERMINAL_STATUSES = ['ended', 'failed', 'cancelled'];
/** 渲染端可上报的状态集合。 */
export const REPORTABLE_STATUSES = ['playing', 'ended', 'failed', 'cancelled'];
