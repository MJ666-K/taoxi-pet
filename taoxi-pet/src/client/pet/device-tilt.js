/** 倾斜死区（度）：小于它视为没倾斜，免得手机本来就歪着时宠物一直滑。 */
export const TILT_DEAD_ZONE_DEG = 2;
/** 摇一摇触发阈值（m/s²，不含重力）：低于它不算摇。 */
export const SHAKE_THRESHOLD = 18;
/** 摇一摇去重窗口（ms）：一次甩动只给一个冲量。 */
export const SHAKE_COOLDOWN_MS = 300;
/** 摇一摇基准：3600 px/s 起，随加速度线性加码，封顶 4800。 */
const SHAKE_BASE_SPEED = 3600;
const SHAKE_GAIN = 160;
const SHAKE_MAX_BONUS = 4800;
/** 屏幕方向角（0/90/180/270）：横屏时倾斜轴要换过来。 */
const screenAngleDeg = () => {
    if (typeof screen === 'undefined' || !screen.orientation)
        return 0;
    return screen.orientation.angle || 0;
};
/** 把角度差折到最近的等价角，避免从 179° 跳到 -179° 时方向反转。 */
const nearestDelta = (delta, period) => {
    const half = period / 2;
    return ((((delta + half) % period) + period) % period) - half;
};
/**
 * 倾斜 → 重力向量：按三角函数投影，倾角 θ 的分量是 `gravity × sin(θ)`。
 *
 * @param sample - 当前姿态。
 * @param baseline - 开启体感时记下的中性姿态。
 * @param gravity - 配置里的重力，作为倾斜到竖直时的满值（px/s²）。
 * @param screenAngle - 屏幕方向角（度）；横屏时把设备轴旋到屏幕轴。
 * @returns 屏幕坐标系里的重力分量；处于死区内时为 0。
 */
export function tiltGravity(sample, baseline, gravity, screenAngle = screenAngleDeg()) {
    const dBeta = nearestDelta(sample.beta - baseline.beta, 360);
    const dGamma = nearestDelta(sample.gamma - baseline.gamma, 180);
    if (Math.abs(dBeta) < TILT_DEAD_ZONE_DEG && Math.abs(dGamma) < TILT_DEAD_ZONE_DEG)
        return { gx: 0, gy: 0 };
    if (!Number.isFinite(gravity) || gravity <= 0)
        return { gx: 0, gy: 0 };
    const rad = Math.PI / 180;
    const ax = gravity * Math.sin(dGamma * rad);
    const ay = gravity * Math.sin(dBeta * rad);
    switch (((screenAngle % 360) + 360) % 360) {
        case 90:
            return { gx: ay, gy: -ax };
        case 180:
            return { gx: -ax, gy: -ay };
        case 270:
            return { gx: -ay, gy: ax };
        default:
            return { gx: ax, gy: ay };
    }
}
/**
 * 摇一摇 → 初速度：方向取甩动方向（屏幕坐标的横向/纵向加速度），力度按基准 × `throwPower`。
 *
 * @param ax - 横向加速度（m/s²）；可能含重力，那正是 {@link SHAKE_THRESHOLD} 的判定口径。
 * @param ay - 纵向加速度（m/s²）。
 * @param az - 垂直加速度（m/s²）：参与阈值判定——只有它能让"纯前后抖"也够得上一次甩动。
 * @param throwPower - 配置里的总力度倍率；`1` 即基准力度。
 * @returns 初速度；加速度不足阈值或横向/纵向都为 0（方向不可用）时返回 `null`。
 */
export function shakeImpulse(ax, ay, az, throwPower) {
    const mag = Math.hypot(ax, ay, az);
    if (!Number.isFinite(mag) || mag < SHAKE_THRESHOLD)
        return null;
    const lateral = Math.hypot(ax, ay);
    if (lateral < 1e-6)
        return null;
    const speed = (SHAKE_BASE_SPEED + Math.min(SHAKE_MAX_BONUS, mag * SHAKE_GAIN)) * Math.max(0, throwPower);
    return { vx: (ax / lateral) * speed, vy: (ay / lateral) * speed };
}
/** 环境是否具备传感器 API：HTTP 下这两个全局类型不存在，不能靠事件是否到达来判断。 */
export function canReadMotionSensors() {
    return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceMotionEvent !== 'undefined';
}
/**
 * 请求传感器权限（iOS 13+ 必需，且必须在用户手势里调用）；只申请本次要用的种类。
 *
 * @param kinds - 需要授权的种类；两个都关时什么都不问，直接 resolve `true`。
 * @returns 全部申请成功（或环境本来就不需要授权）时为 `true`；任一种被拒、或该事件类型在此上下文里不存在
 *  （非安全上下文，HTTP 下两个全局类型都没有）时为 `false`。
 */
export async function requestMotionPermission(kinds) {
    const ask = async (ctor) => {
        if (ctor === undefined)
            return false;
        const fn = ctor.requestPermission;
        if (typeof fn !== 'function')
            return true; // 安卓 / 桌面没有这个 API，视为已授权
        try {
            return (await fn.call(ctor)) === 'granted';
        }
        catch {
            return false;
        }
    };
    const granted = [];
    if (kinds.tilt)
        granted.push(await ask(globalThis.DeviceOrientationEvent));
    if (kinds.shake)
        granted.push(await ask(globalThis.DeviceMotionEvent));
    return granted.every(Boolean);
}
/**
 * 订阅姿态采样。
 *
 * @param onSample - 每帧回调；事件里缺 beta/gamma（部分设备）时跳过。
 * @returns 取消订阅。
 */
export function subscribeTilt(onSample) {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined')
        return () => { };
    const handler = (e) => {
        if (e.beta === null || e.gamma === null)
            return;
        onSample({ beta: e.beta, gamma: e.gamma });
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
}
/**
 * 订阅摇一摇：只在这个模块做阈值与去重，调用方拿到的是"真正算一次甩动"的加速度。
 *
 * 部分机型不给 `acceleration`（只有含重力的那份），所以按 `accelerationIncludingGravity` 兜底；
 * 两种来源共用同一个阈值，含重力时静止约 9.8 m/s²，仍低于阈值。
 *
 * @param onShake - 触发时回调三轴加速度（m/s²）。
 * @param now - 时钟；测试注入。
 * @returns 取消订阅。
 */
export function subscribeShake(onShake, now = () => performance.now()) {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined')
        return () => { };
    let lastAt = 0;
    const handler = (e) => {
        const a = e.acceleration;
        const raw = a && (a.x !== null || a.y !== null || a.z !== null) ? a : e.accelerationIncludingGravity;
        if (!raw)
            return;
        const ax = raw.x ?? 0;
        const ay = raw.y ?? 0;
        const az = raw.z ?? 0;
        if (Math.hypot(ax, ay, az) < SHAKE_THRESHOLD)
            return;
        const at = now();
        if (at - lastAt < SHAKE_COOLDOWN_MS)
            return;
        lastAt = at;
        onShake(ax, ay, az);
    };
    window.addEventListener('devicemotion', handler, true);
    return () => window.removeEventListener('devicemotion', handler, true);
}
