import { failResult, invalidJson, methodNotAllowed, okResult } from './result.ts';
/** 会话 id 上限：DSH 的 id 形如 `session-<uuid>`（44 字符），128 已足够，更长的视为伪造输入。 */
const MAX_SESSION_ID_CHARS = 128;
/** 宿主在「还没有会话」时写进快照的哨兵值，不能当作跳转目标。 */
const UNKNOWN_SESSION_ID = 'unknown';
/**
 * 会话领域：未命中返回 undefined，命中返回应答。
 *
 * @param deps - 路由依赖；本领域只读 `state`。
 * @param input - 本次请求。
 * @returns 命中则应答，否则 undefined 交给下一个处理器。
 */
export async function handleSessionRoutes(deps, input) {
    // 必须写成正向比较：check:openapi 只扫描正向分支，反向守卫它看不见（注释里也不要写那种形式的字面量）。
    const isFocusSession = input.rest === 'focus-session';
    if (!isFocusSession)
        return undefined;
    if (input.method !== 'POST')
        return methodNotAllowed();
    let payload;
    try {
        payload = JSON.parse(input.body ?? '');
    }
    catch {
        return invalidJson();
    }
    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : '';
    if (sessionId === '' || sessionId === UNKNOWN_SESSION_ID)
        return failResult('bad-request', 'sessionId 必填');
    if (sessionId.length > MAX_SESSION_ID_CHARS) {
        return failResult('bad-request', `sessionId 超过 ${MAX_SESSION_ID_CHARS} 字符`);
    }
    const ts = Date.now();
    deps.state.writeSection('focusSession', { sessionId, ts });
    return okResult({ ok: true, sessionId, ts });
}
