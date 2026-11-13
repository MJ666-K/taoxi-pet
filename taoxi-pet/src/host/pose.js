/**
 * 桌面端「实况」（位置 + 朝向）的内存快照。
 *
 * 负责收窄渲染端上报，并按宠物存一份最近的位置供外部读取：桌面端一窗一只，位置全局只有一份。
 * 上报是变化时推 + 节流，不是轮询；宿主只存内存，不写 /state。
 * 不负责网页端：网页宠物的位置天生每页一份，走页面内的只读服务 petApi7340。
 * 依赖无（纯内存态，宿主重启即空），字段名与坐标口径与网页端一致。
 * 始终成立：快照没有 TTL，updatedAt 是调用方判断这份实况有多新的唯一依据。
 * 契约见 API.md 与 openapi.yaml。
 *
 * @module taoxi-pet/src/host/pose
 */
/**
 * 收窄渲染端上报的 { x, y, facing }。
 *
 * 与 /position 的越界夹取不同，这里不做范围夹取：宠物被拖到屏幕边缘时中心点本来就可能略微出界，
 * 夹取会让读回来的值对不上眼睛；但非有限数字（NaN / Infinity）一律拒，那种值喂回去只会把渲染端
 * 的位置算坏。
 */
export function normalizePoseInput(raw) {
    const o = raw && typeof raw === 'object' ? raw : null;
    if (!o)
        return { ok: false, reason: 'bad-request', message: '请求体必须是对象：{ x, y, facing }' };
    if (typeof o.x !== 'number' || !Number.isFinite(o.x)) {
        return { ok: false, reason: 'bad-request', message: 'x 必须是有限数字（归一化横坐标）' };
    }
    if (typeof o.y !== 'number' || !Number.isFinite(o.y)) {
        return { ok: false, reason: 'bad-request', message: 'y 必须是有限数字（归一化纵坐标）' };
    }
    if (o.facing !== 'left' && o.facing !== 'right') {
        return { ok: false, reason: 'bad-request', message: 'facing 必须是 left / right' };
    }
    return { ok: true, pose: { x: o.x, y: o.y, facing: o.facing } };
}
/** 实况快照表（一个插件实例一个；进程内内存态，宿主重启即空）。 */
export class PoseStore {
    constructor(opts) {
        this.byPet = new Map();
        this.now = opts?.now ?? Date.now;
    }
    /** 覆盖一只宠物的实况，返回落定的快照。 */
    set(petId, pose) {
        const snap = { x: pose.x, y: pose.y, facing: pose.facing, updatedAt: this.now() };
        this.byPet.set(petId, snap);
        return snap;
    }
    /** 读最近一次实况；从没上报过返回 undefined（路由回 pose-unavailable）。 */
    get(petId) {
        return this.byPet.get(petId);
    }
    /** 当前快照数（测试 / 观测用）。 */
    count() {
        return this.byPet.size;
    }
}
