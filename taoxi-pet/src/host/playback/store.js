/**
 * 播放记录表：受理、上报、查询与挂起等待。
 *
 * 不解析 URL（归 ./parse），不判状态合法性（归 ./status）。
 * 必须始终成立：迟到的 ended 不得覆盖 cancelled；等待者只被唤醒一次。
 * @module taoxi-pet/src/host/playback/store
 */
import { PLAYBACK_KEEP_MS, isReportableStatus, isTerminalStatus } from './status.ts';
/**
 * 播放记录表（一个插件实例一个；进程内内存态，宿主重启即空）。
 *
 * 单线程事件循环，所有方法同步完成，不存在竞态；唤醒回调在方法返回之后才可能被调用，
 * 所以调用方可以放心在回调里再调本表的方法。
 */
export class PlaybackStore {
    constructor() {
        this.records = new Map();
        this.waiters = new Map();
        this.activeByPet = new Map();
        this.seq = 0;
    }
    /**
     * 受理一次点播：建记录（accepted），并把该宠物上一场（若仍在非终态）标为 cancelled/superseded。
     * @returns 新建的记录（调用方取 playbackId 下发给调用方）。
     */
    create(petId, name) {
        this.sweep();
        const prev = this.activeByPet.get(petId);
        if (prev !== undefined)
            this.finish(prev, 'cancelled', 'superseded');
        const now = Date.now();
        const record = {
            playbackId: 'pb-' + now.toString(36) + '-' + (++this.seq).toString(36),
            petId,
            name,
            status: 'accepted',
            createdAt: now,
            updatedAt: now,
        };
        this.records.set(record.playbackId, record);
        this.activeByPet.set(petId, record.playbackId);
        return record;
    }
    /** 查记录；不存在 / 已过期返回 undefined（路由回 404）。 */
    get(playbackId) {
        this.sweep();
        return this.records.get(playbackId);
    }
    /**
     * 渲染端上报一次状态。
     *
     * 终态之后的上报一律 ignored（迟到的 ended 不许覆盖 cancelled），与当前状态相同的上报同样
     * ignored；两种情况路由都回 200——对上报方来说「已经这样了」就是成功。
     */
    report(playbackId, status, reason) {
        this.sweep();
        const record = this.records.get(playbackId);
        if (!record)
            return 'unknown';
        const next = typeof status === 'string' ? status : '';
        if (!isReportableStatus(next))
            return 'invalid';
        if (isTerminalStatus(record.status) || record.status === next)
            return 'ignored';
        const why = typeof reason === 'string' && reason !== '' ? reason : undefined;
        this.finish(playbackId, next, why);
        return 'ok';
    }
    /**
     * 挂起一个等待者。
     * @returns 取消函数；编号不存在时返回 undefined（路由据此立刻回 404，不挂）。
     */
    wait(args) {
        this.sweep();
        const record = this.records.get(args.playbackId);
        if (!record)
            return undefined;
        const waiter = {
            wait: new Set(args.wait),
            onWake: args.onWake,
            record,
            timer: undefined,
        };
        let set = this.waiters.get(args.playbackId);
        if (!set) {
            set = new Set();
            this.waiters.set(args.playbackId, set);
        }
        set.add(waiter);
        // 用裸 setTimeout（不 import node:timers）：具名导入会把原函数引用固定住，单测的 mock timers 拦不到
        // timeoutMs = 0 → 下一拍立刻唤醒（等价「立刻返回」，路由不需要特判）
        waiter.timer = setTimeout(() => {
            this.dropWaiter(args.playbackId, waiter);
            waiter.onWake(waiter.record, false);
        }, Math.max(0, args.timeoutMs));
        // 不让这个定时器把宿主进程钉住（宿主退出时不该等它）
        waiter.timer.unref?.();
        return () => this.dropWaiter(args.playbackId, waiter);
    }
    /** 结束所有挂起的等待（插件卸载 / 宿主退出路径）；唤醒时 matched=false，调用方据此立刻收尾。 */
    cancelAll() {
        for (const [playbackId, set] of [...this.waiters]) {
            for (const waiter of [...set]) {
                this.dropWaiter(playbackId, waiter);
                waiter.onWake(waiter.record, false);
            }
        }
    }
    /**
     * 清理过期终态记录（惰性调用：create / get / report 各调一次，记录数很少，成本可忽略）。
     *
     * 必须先把还在等它的人叫醒：等待上限（10s）通常远小于保留时长（60s），但调用方完全可以在
     * 一条终态记录的保留窗口末尾注册一个等「别的状态」的等待者——不唤醒就成了永远等不到的悬挂等待者。
     *
     * @param now - 注入时间（单测用；缺省取当前时刻）。
     */
    sweep(now = Date.now()) {
        for (const [playbackId, record] of this.records) {
            if (!isTerminalStatus(record.status))
                continue;
            if (now - record.updatedAt < PLAYBACK_KEEP_MS)
                continue;
            const set = this.waiters.get(playbackId);
            if (set) {
                for (const waiter of [...set]) {
                    this.dropWaiter(playbackId, waiter);
                    waiter.onWake(waiter.record, false);
                }
            }
            this.records.delete(playbackId);
        }
    }
    /** 当前记录数（测试 / 观测用）。 */
    count() {
        return this.records.size;
    }
    /** 当前等待者数（测试 / 观测用：验证不泄漏）。 */
    waiterCount() {
        let n = 0;
        for (const set of this.waiters.values())
            n += set.size;
        return n;
    }
    /**
     * 落到一个终态：写状态、更新时间、摘掉「当前活跃」、唤醒在等这个状态的人。
     * 这是唯一的状态写入点，所以等待者唤醒只在这里发生（不需要 diff、不需要比对）。
     */
    finish(playbackId, status, reason) {
        const record = this.records.get(playbackId);
        if (!record)
            return;
        record.status = status;
        record.updatedAt = Date.now();
        if (status === 'ended')
            record.endedAt = record.updatedAt;
        if (reason !== undefined)
            record.reason = reason;
        if (this.activeByPet.get(record.petId) === playbackId)
            this.activeByPet.delete(record.petId);
        const set = this.waiters.get(playbackId);
        if (!set)
            return;
        for (const waiter of [...set]) {
            if (!waiter.wait.has(status))
                continue; // 没在等这个状态：继续挂着
            this.dropWaiter(playbackId, waiter);
            waiter.onWake(waiter.record, true);
        }
    }
    /** 摘掉一个等待者（清定时器 + 从集合移除 + 空集合回收）。 */
    dropWaiter(playbackId, waiter) {
        if (waiter.timer !== undefined) {
            clearTimeout(waiter.timer);
            waiter.timer = undefined;
        }
        const set = this.waiters.get(playbackId);
        if (!set)
            return;
        set.delete(waiter);
        if (set.size === 0)
            this.waiters.delete(playbackId);
    }
}
