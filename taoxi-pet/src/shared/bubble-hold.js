/** 播完（或失败）后再留这么久，让人看完最后一个字（ms）。 */
export const BUBBLE_HOLD_TAIL_MS = 1500;
/**
 * 一句播报最多把气泡挂多久（ms）。
 *
 * 口径是「合成超时 + 截断后可念的最长语音 + 尾巴」再留余量：超过它说明语音那条线
 * 已经断了，气泡不能跟着一起挂死。
 */
export const BUBBLE_HOLD_MAX_MS = 50000;
/**
 * 把一句播报的开始/结束翻成气泡的挂起/收尾。
 *
 * 两端同用这一份：订阅者拿到的是 voice 的 `start`/`end`，而状态机只认 `hold`/`release`。
 * 少翻一次就会静默落空——事件走不到 `hold`，气泡按 `show` 自己的时长收起；桌面端是纯 JS，
 * 传错形状不会有任何类型报错，所以这条链路只能靠共用同一份实现来保证两端不漂移。
 *
 * @param event - 播报的开始或结束事件。
 * @returns 对应的收起计划事件。
 */
export function utteranceToHold(event) {
    return { kind: event.kind === 'start' ? 'hold' : 'release', seq: event.seq };
}
/** 收起状态的初值；两端都从这里开始。 */
export const BUBBLE_HOLD_IDLE = { on: false, delayMs: null, holdSeq: null };
/**
 * 推进一步。
 *
 * 气泡没点亮时 `hold` 与 `release` 一律忽略：那说明这一句没有气泡可挂
 * （`duration: 0` 或已经被清空），让它们点亮气泡会凭空多出一个泡。
 *
 * @param state - 当前状态。
 * @param event - 这一次发生了什么。
 * @returns 新状态；无事发生时返回同一引用，调用方据此跳过重排计时器。
 */
export function reduceBubbleHold(state, event) {
    if (event.kind === 'show')
        return { delayMs: Math.max(0, event.durationMs), holdSeq: null, on: true };
    if (event.kind === 'clear')
        return BUBBLE_HOLD_IDLE;
    if (event.kind === 'hide')
        return state.on ? BUBBLE_HOLD_IDLE : state;
    if (!state.on)
        return state;
    if (event.kind === 'hold') {
        if (state.holdSeq === event.seq)
            return state; // 同一句重复通知：不重置上限
        return { delayMs: BUBBLE_HOLD_MAX_MS, holdSeq: event.seq, on: true };
    }
    // release 只认当前这句：上一句迟到的收尾不能把这一句的等待提前结束。
    if (state.holdSeq !== event.seq)
        return state;
    return { delayMs: BUBBLE_HOLD_TAIL_MS, holdSeq: null, on: true };
}
