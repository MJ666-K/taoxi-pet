/**
 * 待办接口的浏览器侧封装：取清单、新建、修改、删除。
 *
 * 只做 HTTP 与响应收窄，不碰 DOM；失败统一成 `{ ok: false, message }` 让面板原样展示。
 * 数据只有 `/todos` 一个出口：修改成功后由调用方重新拉一次清单，不靠本地拼装猜结果。
 * @module taoxi-pet/src/shared/todo/api
 */
import { ROUTE_PATH } from '../constants.ts';
import { parseTodoItem, parseTodoList } from './types.ts';
/** 待办接口的基址（与宿主路由同一前缀）。 */
export const TODOS_PATH = ROUTE_PATH + '/todos';
/** 发一次请求并收窄最外层：协议失败、业务失败、非 JSON 都归成失败。 */
async function send(url, method, body) {
    try {
        const response = await fetch(url, {
            method,
            cache: 'no-store',
            ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
        });
        const payload = (await response.json().catch(() => null));
        if (!response.ok)
            return { failed: true, message: `请求失败（HTTP ${response.status}）` };
        if (payload === null)
            return { failed: true, message: '响应不是 JSON' };
        if (payload.ok === false) {
            const reason = typeof payload.message === 'string' ? payload.message : payload.reason;
            return { failed: true, message: typeof reason === 'string' && reason !== '' ? reason : '请求被拒绝' };
        }
        return { failed: false, body: payload };
    }
    catch (error) {
        return { failed: true, message: '连不上桌宠服务：' + (error instanceof Error ? error.message : String(error)) };
    }
}
/** 单条响应 → 待办；形状不对时给出可展示的失败。 */
function readTodo(body) {
    const todo = parseTodoItem(body.todo);
    return todo === null ? { ok: false, message: '响应里没有有效的待办' } : { ok: true, value: todo };
}
/** 读整张清单。 */
export async function loadTodos(baseUrl = TODOS_PATH) {
    const result = await send(baseUrl, 'GET');
    if (result.failed)
        return { ok: false, message: result.message };
    return { ok: true, value: parseTodoList(result.body.todos) };
}
/** 新建一条；`dueAt` 为 null 表示没有期限。 */
export async function addTodo(text, dueAt, baseUrl = TODOS_PATH) {
    const result = await send(baseUrl, 'POST', { text, dueAt });
    if (result.failed)
        return { ok: false, message: result.message };
    return readTodo(result.body);
}
/** 修改一条：只传要改的字段。 */
export async function patchTodo(id, patch, baseUrl = TODOS_PATH) {
    const result = await send(baseUrl + '/' + encodeURIComponent(id), 'PATCH', patch);
    if (result.failed)
        return { ok: false, message: result.message };
    return readTodo(result.body);
}
/** 删除一条；返回删掉的条数（0 = 本来就没有）。 */
export async function removeTodo(id, baseUrl = TODOS_PATH) {
    const result = await send(baseUrl + '/' + encodeURIComponent(id), 'DELETE');
    if (result.failed)
        return { ok: false, message: result.message };
    return { ok: true, value: typeof result.body.removed === 'number' ? result.body.removed : 0 };
}
