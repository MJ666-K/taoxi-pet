/**
 * 「播放进度」的页面内注册表：PetCard 挂载时注册读法，供 Cordis 只读服务 `petApi7340` 读取。
 * 读进度是每帧都要的事，做成 HTTP 就是每秒几十次回环；页面内直接读 `<video>` 属性，零请求、零序列化。
 * 低频的播放状态（accepted / playing / ended / cancelled / failed）仍在 `GET /playback/{id}`，那是跨进程的事实来源。
 * 只服务浏览器半侧；与 pose 一样按需读取，拿到的是这一刻的状态，不是注册时的快照。
 * @module taoxi-pet/src/client/progress
 */
/** petId → 取当前进度的函数；PetCard 挂载时注册、卸载时摘除。 */
const readers = new Map();
/**
 * 注册一只宠物在这一页的进度读法。
 * @param petId - 宠物 id。
 * @param read - 取当前进度的函数。
 * @returns 摘除函数；重复调用无害。
 */
export function registerProgress(petId, read) {
    readers.set(petId, read);
    return () => {
        // 只摘掉自己那一份：同一 id 重新挂载时，后注册的那份不能被前一个的清理函数误摘。
        if (readers.get(petId) === read)
            readers.delete(petId);
    };
}
/**
 * 读某只宠物在这一页的播放进度；不在这页（未注册 / 未挂载 / `display` 不含 `web`）时为 `null`。
 * 每次调用都取当前值，播放中途读到的就是那一刻的位置。
 */
export function readProgress(petId) {
    if (typeof petId !== 'string' || petId === '')
        return null;
    const read = readers.get(petId);
    return read === undefined ? null : read();
}
/** 当前注册了几只（测试与观测用：验证卸载不泄漏）。 */
export function progressReaderCount() {
    return readers.size;
}
