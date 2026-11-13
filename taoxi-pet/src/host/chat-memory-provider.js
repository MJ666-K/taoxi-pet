/**
 * 对话记忆的第三方实现注册表：单槽，后注册覆盖先注册。
 *
 * 一个槽而不是 Map：记忆后端是二选一（原生 / 第三方），两个 recall 同时改内容会互相冲突，
 * 两个 capture 同时上传会重复写。模块单例：注册返回 disposer，测试用 resetChatMemoryProviders 复位。
 * 只登记与查找，不调用、不校验补丁、不落盘。
 * @module taoxi-pet/src/host/chat-memory-provider
 */
/** 原生实现的标识；第三方不能占用它（槽为空即原生路径）。 */
export const NATIVE_MEMORY_ID = 'native';
/** 当前生效的第三方实现；null = 没注册，走原生路径。 */
let current = null;
/**
 * 注册一个第三方记忆实现，覆盖当前生效的那个。
 *
 * @param def - 实现定义；`recall` 与 `capture` 至少要有一个是函数。
 * @returns 注销函数；只在「当前仍是这一份」时才清空，迟到的注销不会顶掉后来者。
 * @throws {TypeError} 定义非法、id 为空、id 占用原生标识或两个方法都缺失时。
 */
export function registerChatMemoryProvider(def) {
    if (!def || typeof def !== 'object')
        throw new TypeError('memory provider 定义必须是对象');
    if (typeof def.id !== 'string' || def.id.length === 0)
        throw new TypeError('id 必须是非空字符串');
    if (def.id === NATIVE_MEMORY_ID)
        throw new TypeError('不能占用原生实现标识: ' + NATIVE_MEMORY_ID);
    if (typeof def.recall !== 'function' && typeof def.capture !== 'function') {
        throw new TypeError('recall 与 capture 至少要有一个是函数');
    }
    current = def;
    return () => {
        if (current === def)
            current = null;
    };
}
/** 当前该用哪个第三方实现；没注册时返回 null，调用方据此走原生路径。 */
export function activeChatMemoryProvider() {
    return current;
}
/**
 * 列出可用实现，用于排障「为什么没走我注册的那个」。
 *
 * @returns `builtin` 恒为原生标识；`external` 是当前生效的第三方 id（没有则为空数组）。
 */
export function listChatMemoryProviders() {
    return { builtin: [NATIVE_MEMORY_ID], external: current ? [current.id] : [] };
}
/**
 * 清空注册，供测试隔离用例。
 * @internal
 */
export function resetChatMemoryProviders() {
    current = null;
}
