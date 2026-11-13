/** 最近一拍的状态；`null` = 本页还没拉到过。 */
let latest = null;
/** 订阅者：每来一拍通知一次。 */
const listeners = new Set();
/**
 * 记下最近一拍的状态（唯一调用点是 pet/multi 的分发入口）。
 *
 * 逐个通知订阅者并各自兜错：某个面板的回调抛了，不能连累这一拍继续分发——
 * 轮询是整页宠物渲染的入口，一个消费方出错不该让所有人都停在旧画面。
 *
 * @param state - 刚拉到的轮询状态；整包替换，不深拷贝——每拍本来就是新对象。
 */
export function setStateSnapshot(state) {
    latest = state;
    for (const listener of listeners) {
        try {
            listener(state);
        }
        catch (error) {
            console.error('[taoxi-pet] 状态订阅回调出错（已忽略，不影响轮询）：', error);
        }
    }
}
/** 读最近一拍的状态；本页 `/state` 还没回来时为 `null`。 */
export function getStateSnapshot() {
    return latest;
}
/**
 * 订阅后续每一拍（不补发当前这拍：调用方自己决定要不要先读一次）。
 *
 * @param listener - 收到新一拍时调用。
 * @returns 退订函数。
 */
export function subscribeStateSnapshot(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
/** 清空快照与订阅；测试用，让每个用例从不含状态的页面开始。
 * @internal 只给测试重置全局单例，不对外承诺。 */
export function resetStateSnapshot() {
    latest = null;
    listeners.clear();
}
