/** 一个不会 resolve 的等待：单纯让出这一拍，用定时器而不是忙等。 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * 启动自调度轮询（调用方不 await：它一直跑到 `isAlive()` 返回 false）。
 *
 * @param deps - 拉取、分发与节奏参数。
 * @returns 无返回值；循环结束后自然收尾。
 */
export async function runStatePoll(deps) {
    /** 宿主是否支持长轮询：首拍带 counter 就是支持。 */
    let longPoll = false;
    /** 上次拿到的 counter，作为长轮询的 since。 */
    let since;
    while (deps.isAlive()) {
        let state = null;
        try {
            state = await deps.fetch(longPoll && since !== undefined ? { since, timeoutMs: deps.waitMs } : undefined);
        }
        catch {
            /* 轻量轮询失败静默，下一拍再试。 */
        }
        if (!deps.isAlive())
            return;
        if (state !== null) {
            longPoll = typeof state.counter === 'number';
            if (longPoll && typeof state.counter === 'number')
                since = state.counter;
            deps.onState(state);
        }
        // 长轮询命中或首拉时立刻再请求；失败或老宿主则退避一个间隔。
        if (state === null || !longPoll)
            await sleep(deps.fallbackMs);
    }
}
