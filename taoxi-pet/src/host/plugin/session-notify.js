/**
 * 会话事件到系统通知的判定：完成提醒、终止清理与活动去抖。
 *
 * 不订阅事件（订阅在装配层），不渲染气泡；只做纯判定与定时器。
 * 依赖由 apply 显式传入（见输入类型），模块内不读全局、不建单例。
 * @module taoxi-pet/src/host/plugin/session-notify
 */
import { hasBlockingActivity, reduceNotifyFrame, withSessionId } from '../notify-events.ts';
import {} from '../work-status.ts';
/**
 * 创建会话通知。
 */
export function createSessionNotify(deps) {
    const { ctx, publishWorkStatus, state, workStatus } = deps;
    // 系统通知帧：host 监听 DSH 宿主事件生成通知帧（帧契约与 shared/notify.ts 一致），写进 S 的
    // sections.notify，浏览器轮询 /state 后弹 toast。
    // 单槽（后到覆盖先到）：1 秒内连弹多条本身没有意义，所以不带 seq / 增量帧队列。
    const pushNotifyFrame = (frame) => {
        state.writeSection('notify', frame);
    };
    const turnFlags = new Map();
    /** 终态（success/error）展示窗口定时器：约 60s 后清掉该会话条目，陈旧完成态不再浮上来。 */
    const terminalTimers = new Map();
    const TERMINAL_KEEP_MS = 60 * 1000;
    /**
     * 每会话最近一条 todo 文案：工具跑完要把气泡「还」给它。没有这份缓存，`tool/result` 写 null
     * 就只能回落到通用档位文案，用户刚看到的清单进度会被抹掉。
     */
    const lastTodoText = new Map();
    /**
     * 每会话最后一段回复文本：完成通知的正文靠它。排活动门定时器时取用即出队——活动门会把它延后
     * 1.5s，但待确认期间文本不会再变；留到定时器里再删，遇到「判定还有活」提前返回就成了长期残留。
     */
    const lastReplyText = new Map();
    /**
     * 每会话在途调用的详情：键为调用标识（缺标识时用临时 `Symbol`），值为气泡文案。
     * 结果事件只删自己那一条，并行调用因此不会互相顶掉，全部删完才回落 todo 文案。
     */
    const toolsInFlight = new Map();
    /** 取消某会话待执行的终态清理：会话已回到非终态，那次清理到点后既不清理也不重排，留着只会误导 */
    const cancelTerminalCleanup = (sessionId) => {
        const t = terminalTimers.get(sessionId);
        if (t === undefined)
            return;
        clearTimeout(t);
        terminalTimers.delete(sessionId);
    };
    /** 排一个终态清理定时器（每会话一个，已排则跳过） */
    const scheduleTerminalCleanup = (sessionId) => {
        if (terminalTimers.has(sessionId))
            return;
        const t = setTimeout(() => {
            terminalTimers.delete(sessionId);
            const sessionState = workStatus.stateOf(sessionId);
            if (sessionState === 'success' || sessionState === 'error') {
                workStatus.clear(sessionId); // 条目连同它的任务详情文案一起消失，不残留到后续活动
                turnFlags.delete(sessionId);
                lastTodoText.delete(sessionId); // 会话都没了，这两份按会话记的缓存也一起清（防泄漏）
                toolsInFlight.delete(sessionId);
                publishWorkStatus(); // 清完要写 S：否则前端一直挂着那条陈旧完成态
            }
        }, TERMINAL_KEEP_MS);
        terminalTimers.set(sessionId, t);
    };
    // 通知活动门（issue #114）：「对话完成」先挂起，到点确认这条会话确实没活了再弹
    // （在跑的子代理 / 团队成员、后台任务、活跃提醒任一非空 → 丢弃这一帧）。
    // 不能同步查：`workspace/session-activity` 读的是活 Agent 的 status，而 turn/end 是在回合体的
    // finally 里追加的——同步那一刻自己还是 running，照「任一非空就不弹」写会把通知全吞掉。
    // 判据不可用（宿主没组合 workspace、伪 ctx 没有 waterfall、抛错）→ 一律放行，宁可多弹一条。
    const NOTIFY_ACTIVITY_DELAY_MS = 1500;
    /** 每会话一个待查定时器（同会话连续收尾只保留最后一次：后到覆盖先到，与单槽帧同语义） */
    const notifyActivityTimers = new Map();
    /** 这条会话是否还有在跑的活；判据不可用一律 false＝放行 */
    const sessionHasRunningWork = async (sessionId) => {
        const waterfall = ctx.waterfall;
        if (typeof waterfall !== 'function')
            return false;
        try {
            const activity = await waterfall.call(ctx, 'workspace/session-activity', { sessionId }, () => Promise.resolve([]));
            return hasBlockingActivity(activity);
        }
        catch {
            return false; // 查询失败不阻塞通知（与「判据不可用时放行」同一策略）
        }
    };
    /** 排一个活动门定时器：到点确认空闲才推这一帧 */
    const scheduleCompletionNotify = (sessionId, event) => {
        // 取用即出队：同一回合的 assistant/message 已经到齐，文本不会再变。
        const replyText = lastReplyText.get(sessionId);
        lastReplyText.delete(sessionId);
        const prev = notifyActivityTimers.get(sessionId);
        if (prev !== undefined)
            clearTimeout(prev);
        notifyActivityTimers.set(sessionId, setTimeout(() => {
            notifyActivityTimers.delete(sessionId);
            void (async () => {
                if (await sessionHasRunningWork(sessionId))
                    return; // 还有活：等真正的收尾轮再弹
                const frame = reduceNotifyFrame(event, replyText);
                // 这条延迟路径（活动门等 1.5s 确认没活了才推的「对话完成」）最常被点，同样要带会话 id
                if (frame)
                    pushNotifyFrame(withSessionId(frame, sessionId));
            })();
        }, NOTIFY_ACTIVITY_DELAY_MS));
    };
    return {
        pushNotifyFrame,
        turnFlags,
        terminalTimers,
        lastTodoText,
        lastReplyText,
        toolsInFlight,
        cancelTerminalCleanup,
        scheduleTerminalCleanup,
        notifyActivityTimers,
        scheduleCompletionNotify,
    };
}
