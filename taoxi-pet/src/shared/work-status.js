/**
 * 工作状态联动：档位常量与快照解析。
 * 宿主半侧有自包含的实现（DSH 单文件加载约束，宿主不 import 本目录），负责监听 DSH 会话事件
 * 聚合成快照并写进 /state 的 sections.workStatus；本模块只有档位常量与叶子解析。
 * 气泡文案不在代码里：浏览器半侧直接读配置的 events.workStatusTexts。纯函数无副作用，不依赖 React / DOM。
 * @module taoxi-pet/src/shared/work-status
 */
/** 工作状态档位（对应 animations.events.workStatus 数组索引，顺序即档位，勿在中间插入新档）。 */
export const WORK_STATUS_STATES = ['thinking', 'working', 'result', 'waiting', 'success', 'error'];
/** 档位 → workStatus 数组索引（与 events.workStatus 的顺序严格一致）。 */
export const WORK_STATUS_INDEX = {
    thinking: 0, // turn/start → 思考
    working: 1, // tool/call → 工作
    result: 2, // tool/result → 整理
    waiting: 3, // approval/asked → 等待
    success: 4, // turn/end completed → 完成
    error: 5, // turn/end error/max-tokens → 出错
};
/** 快照解析：档位不认识 → 归一成 null（空闲）；形状非法 → null，消费端跳过这一拍。 */
export function toWorkStatus(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const r = raw;
    const state = r.state === null || (typeof r.state === 'string' && WORK_STATUS_STATES.includes(r.state))
        ? r.state
        : null;
    const sessionId = typeof r.sessionId === 'string' && r.sessionId !== '' && r.sessionId !== 'unknown' ? r.sessionId : null;
    return { state, task: typeof r.task === 'string' ? r.task : null, sessionId };
}
