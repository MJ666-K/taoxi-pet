/**
 * 抛掷飞行：重力积分、边缘反弹、落地摩擦与宠物互撞，飞行中只改 DOM 位置，落定后才提交归一化中心。
 * 不负责起点与初速（拖拽松手、抛掷指令、被撞起飞各自决定），也不负责落地挤压的动画本身。
 * 依赖注入的取值函数；rAF 句柄与运动状态由本模块持有，跨渲染存活。
 * 不变量：每帧先积分、再结算互撞、最后写 DOM；互撞只写结算后的绝对速度，落定那一帧才调 commitFinal。
 * @module taoxi-pet/src/client/pet/motion/flight
 */
import { throwBounds } from '../../../shared/physics.ts';
import { integrateFlight } from './flight-integrate.ts';
import { createPetCollision } from './pet-collision.ts';
/** 常驻模式的速度上限（px/s）：传感器重力会持续加速，留一个硬天花板兜底。 */
const MAX_HELD_SPEED = 6000;
/**
 * 造飞行驱动。
 *
 * @param deps - 取几何、写位置与落地回调。
 * @returns 可反复调用的驱动。
 */
export function createFlight(deps) {
    /** 在跑的 rAF；`null` = 没在跑。 */
    let frame = null;
    /** 世代号：起飞或停飞 +1，迟到的帧据此自弃。 */
    let token = 0;
    /** 最近一帧的状态；`null` = 没在跑。帧间它与帧内的 `current` 是同一个对象，改速度就是改下一刻的输入。 */
    let state = null;
    /** 是否体感常驻模式：重力逐帧由 {@link FlightDeps.gravity} 提供，落定改用静默计时。 */
    let held = false;
    /** 常驻模式的静默时长（ms）：重力为零且速度低时累计，到点停帧。 */
    let quietMs = 0;
    /** 互撞结算：规则在 pet-collision，这里只把撞击转成触觉回调。 */
    const resolveCollisions = createPetCollision({
        arena: deps.arena,
        petId: deps.petId,
        onPetImpact: (speed) => deps.onImpact?.({ kind: 'pet', speed }),
    });
    const stop = () => {
        token++;
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
        state = null;
        held = false;
        quietMs = 0;
    };
    const start = (px, py, vx, vy) => {
        held = false;
        run(px, py, vx, vy);
    };
    /** 体感常驻模式：没有初速，重力逐帧由 {@link FlightDeps.gravity} 提供；已在常驻时无副作用。 */
    const startHeld = () => {
        if (frame !== null && held)
            return;
        const el = deps.root();
        const box = deps.box() ?? (el ? { x: el.getBoundingClientRect().left, y: el.getBoundingClientRect().top } : null);
        if (box === null)
            return;
        held = true;
        run(box.x, box.y, 0, 0);
    };
    /**
     * 改写当前速度：碰撞结算给的是绝对速度，不是增量。
     *
     * @param vx - 水平速度（px/s）。
     * @param vy - 竖直速度（px/s）。
     */
    const setVelocity = (vx, vy) => {
        if (state === null)
            return;
        state.vx = vx;
        state.vy = vy;
    };
    /**
     * 叠加一个冲量（摇一摇）：只在已经在跑时有效——没在跑时由调用方按抛掷起飞。
     *
     * @param dvx - 横向冲量（px/s）。
     * @param dvy - 纵向冲量（px/s）。
     */
    const impulse = (dvx, dvy) => {
        if (state === null)
            return;
        state.vx += dvx;
        state.vy += dvy;
    };
    const run = (px, py, vx, vy) => {
        const metrics = deps.metrics();
        const viewport = deps.viewport();
        const physics = deps.physics();
        const bounds = throwBounds({
            W: viewport.width,
            H: viewport.height,
            size: metrics.size,
            sideAllow: metrics.sideAllow,
        });
        const own = ++token;
        quietMs = 0;
        let current = { x: px, y: py, vx, vy };
        let last = performance.now();
        let prevGrounded = false; // 落地挤压只在空中到地面的转换帧触发一次。
        const rootEl = deps.root();
        /** 写回本帧位置：DOM、包围盒与归一化中心（后者供重渲染时按它重排）。 */
        const commitPose = (at) => {
            if (rootEl) {
                rootEl.style.left = at.x + 'px';
                rootEl.style.top = at.y + 'px';
                rootEl.style.right = 'auto';
                rootEl.style.bottom = 'auto';
            }
            deps.setBox({ x: at.x, y: at.y });
            const center = { rx: (at.x + metrics.halfW) / viewport.width, ry: (at.y + metrics.halfH) / viewport.height };
            deps.commitLive(center);
            return center;
        };
        const step = () => {
            if (token !== own)
                return;
            const now = performance.now();
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
            last = now;
            const fallingVy = current.vy; // 本帧积分前的竖直速度，即落地冲击速度。
            const gravity = held ? deps.gravity?.() : undefined;
            const res = integrateFlight(current, dt, bounds, physics, gravity);
            if (res.hit !== null)
                deps.onImpact?.({ kind: res.hit.edge, speed: res.hit.speed });
            const integrated = { x: res.x, y: res.y, vx: res.vx, vy: res.vy };
            current = integrated;
            if (physics.petCollision)
                current = resolveCollisions(current, metrics);
            // 被撞过就不在当帧判落定：积分结果已经代表不了当前位置了。
            const disturbed = current !== integrated;
            if (held) {
                const speed = Math.hypot(current.vx, current.vy);
                if (speed > MAX_HELD_SPEED) {
                    const k = MAX_HELD_SPEED / speed;
                    current = { ...current, vx: current.vx * k, vy: current.vy * k };
                }
            }
            state = current;
            const center = commitPose(current);
            // 落地挤压：只在空中到地面的转换帧触发，力度随冲击速度。
            const grounded = current.y >= bounds.maxY - 1;
            if (res.bounced && grounded && !prevGrounded)
                deps.onLanding(fallingVy);
            prevGrounded = grounded;
            if (held) {
                // 常驻模式没有固定地面：重力为零且速度低就累计静默，到点停帧。
                const g = gravity ?? { gx: 0, gy: physics.gravity };
                const isStill = Math.hypot(g.gx, g.gy) < 1 && Math.hypot(current.vx, current.vy) < 20;
                quietMs = isStill ? quietMs + dt * 1000 : 0;
                if (quietMs >= 300) {
                    deps.commitFinal(center);
                    stop();
                    return;
                }
            }
            else if (res.atRest && !disturbed) {
                deps.commitFinal(center);
                stop();
                return;
            }
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
    };
    return {
        impulse,
        isFlying: () => frame !== null,
        isHeld: () => held,
        setVelocity,
        start,
        startHeld,
        stop,
        velocity: () => (frame !== null && state !== null ? { vx: state.vx, vy: state.vy } : { vx: 0, vy: 0 }),
    };
}
