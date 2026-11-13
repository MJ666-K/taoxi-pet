/**
 * 由锁叶子算出冻结截止时间。
 *
 * 刷新后可能拿到陈旧叶子：expiresAt 已过去就当没有锁，不能只看 locked。
 *
 * @param lock - 锁叶子。
 * @param nowMs - 当前时间（ms），由调用方注入以便测试。
 * @returns 截止的绝对时间（ms）；0 表示当前没有锁。
 */
export function freezeDeadline(lock, nowMs) {
    const expiresAt = lock?.locked === true ? lock.expiresAt : 0;
    return expiresAt > nowMs ? expiresAt : 0;
}
/** 执行一次翻转；cue 为 null 表示状态本来就是这个值。 */
function dispatchCue(cue, handlers) {
    if (cue === null)
        return;
    if (cue.kind === 'frozen')
        handlers.onFrozen();
    else
        handlers.onResumed();
}
/**
 * 制造冻结驱动的 hook，每个 PetCard 调一次。
 *
 * @param rt - 注入的 react 能力。
 * @returns 接收锁叶子的 hook；解冻定时器随卡片卸载一并清理。
 */
export function createLockFreeze(rt) {
    const { useEffect, useRef } = rt;
    return function useLockFreeze(input) {
        /** 解冻定时器；重算与本地解冻前都必须清掉，否则旧定时器会提前解冻。 */
        const timerRef = useRef(null);
        /** 清掉解冻定时器；重复调用安全。 */
        const clearTimer = () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
        useEffect(() => {
            clearTimer();
            const now = Date.now();
            const expiresAt = freezeDeadline(input.lock, now);
            dispatchCue(input.setFrozen(expiresAt > now), input);
            if (expiresAt <= now)
                return clearTimer;
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null;
                dispatchCue(input.setFrozen(false), input);
            }, expiresAt - now);
            return clearTimer;
            // 回调每渲染重建，但只读 ref 与稳定 setter；进依赖会让每次渲染都清掉并重设解冻定时器，锁会永不到期。
            // eslint-disable-next-line react-hooks/exhaustive-deps -- 变化原因只有叶子与 tick
        }, [input.lockTick, input.lock]);
        return {
            release: () => {
                clearTimer();
                dispatchCue(input.setFrozen(false), input);
            },
        };
    };
}
