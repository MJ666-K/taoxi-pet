/**
 * 触屏长按：按住到一定时长把这次按压当右键，计时期间手指移动超过容差就取消。
 * 不负责右键菜单本身，也不碰拖拽与点击判定——到点只回调，派发交给调用方。
 * 鼠标与笔不走这条分支，起表前先按指针类型挡掉。
 * 不变量：同一时刻只有一个计时器；到点时按压若已结束，回调自弃。
 * @module taoxi-pet/src/client/pet/motion/touch-press
 */
/** 触屏长按多久算右键（ms）。 */
const LONG_PRESS_MS = 500;
/** 计时期间手指移动超过这个距离就取消（px）。 */
const SLOP_PX = 8;
/**
 * 造长按驱动。
 *
 * @param deps - 到点时的有效性与回调。
 * @returns 可反复起表的驱动；计时器由本模块清理。
 */
export function createTouchPress(deps) {
    /** 待触发的计时器；`null` = 没有在等。 */
    let timer = null;
    /** 本次按下的现场，到点时交给回调。 */
    let pending = null;
    const cancel = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        pending = null;
    };
    const arm = (target) => {
        cancel();
        if (target.pointerType === 'mouse' || target.pointerType === 'pen')
            return;
        pending = target;
        timer = setTimeout(() => {
            timer = null;
            const current = pending;
            pending = null;
            if (current === null || !deps.stillHolding())
                return;
            deps.onMenu(current);
        }, LONG_PRESS_MS);
    };
    const move = (distancePx) => {
        if (timer === null)
            return;
        if (distancePx > SLOP_PX)
            cancel();
    };
    return { arm, cancel, isArmed: () => timer !== null, move };
}
