/**
 * 拖拽的弹簧跟随：包围盒过阻尼追赶指针目标，抹平指针事件的高频抖动。
 * 不负责指针状态与松手结算：目标由拖拽模块每帧更新，这里只管把盒子追过去。
 * 依赖 shared/physics 的弹簧步进；帧句柄与速度由本模块持有，stop 之后可重新瞄准。
 * 不变量：同一时刻最多一条跟随在跑；瞄准与停走都会让迟到的帧自弃。
 * @module taoxi-pet/src/client/pet/motion/drag-follow
 */
import { springStep } from '../../../shared/physics.ts';
/**
 * 造跟随驱动。
 *
 * @param deps - 读写包围盒与取弹簧刚度。
 * @returns 可反复瞄准的驱动。
 */
export function createDragFollow(deps) {
    /** 在跑的 rAF；`null` = 没在追。 */
    let frame = null;
    /** 世代号：起跑或停下 +1，迟到的帧据此自弃。 */
    let token = 0;
    /** 追赶目标；`null` = 没有目标。 */
    let target = null;
    /** 上一帧的速度（px/s），跨帧累积出过阻尼手感。 */
    let velocity = { vx: 0, vy: 0 };
    /** 上一帧的时刻（ms）。 */
    let last = 0;
    const stop = () => {
        token++;
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
        target = null;
        velocity = { vx: 0, vy: 0 };
    };
    const aim = (next) => {
        target = next;
    };
    const start = (rootEl) => {
        if (frame !== null)
            return;
        const current = deps.card();
        const spring = current.physics.throwPower;
        const own = ++token;
        last = performance.now();
        const step = () => {
            if (token !== own)
                return;
            const goal = target;
            if (!goal) {
                frame = null;
                return;
            }
            const now = performance.now();
            const dt = Math.min((now - last) / 1000, 1 / 30);
            last = now;
            const box = current.box() ?? { x: 0, y: 0 };
            let x = box.x;
            let y = box.y;
            velocity.vx = springStep(velocity.vx, x, goal.x, dt, spring);
            velocity.vy = springStep(velocity.vy, y, goal.y, dt, spring);
            x += velocity.vx * dt;
            y += velocity.vy * dt;
            current.setBox({ x, y });
            rootEl.style.left = x + 'px';
            rootEl.style.top = y + 'px';
            rootEl.style.right = 'auto';
            rootEl.style.bottom = 'auto';
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
    };
    return { aim, start, stop };
}
