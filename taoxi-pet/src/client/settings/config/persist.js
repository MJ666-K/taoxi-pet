/**
 * 设置页的写路径：把表单整包存进用户层，或把内置默认整份同步过去。
 *
 * 保存是两层写入：先 PUT /config（main 实例 + 全局字段），再逐个 POST /pet-config（有改动的
 * 种类层）。写完必须立刻把成品交给容器（`petBridge.reload`）并让通知引擎重读——两条都是
 * 「保存即生效」的实现前提。结果归一成判别联合，弹窗与红字由设置页决定。
 * @module taoxi-pet/src/client/settings/config/persist
 */
import { reloadNotifications } from '../../notify.ts';
import { petBridge } from '../bridge.ts';
import { buildSaveBody, saveConfig, savePetLayer, syncConfig } from './http.ts';
/**
 * 保存表单。
 *
 * @param fields - 要提交的全部字段（main 实例 + 全局字段）。
 * @param packWrites - 本次有改动的种类层；串行写，main 失败时一条都不写。
 * @param force - 用户在损坏弹窗里确认过才为 `true`。
 * @param fallbackUserFile - 宿主没回写入路径时的兜底（meta 里读到的用户配置路径）。
 * @returns 保存结果；成功或部分成功时已完成容器重载与通知重读。
 */
export async function persistSettings(fields, packWrites, force, fallbackUserFile) {
    const outcome = await saveConfig(buildSaveBody(fields), force);
    if (outcome.kind === 'corrupt')
        return { kind: 'corrupt', path: outcome.userFile ?? fallbackUserFile };
    if (outcome.kind !== 'ok')
        return { kind: outcome.kind };
    // main 落盘后再逐个写种类层：每条都是整段替换，串行才不会互相覆盖（宿主侧还有一条全局队列）。
    let merged = outcome.merged;
    const failed = [];
    for (const write of packWrites) {
        const result = await savePetLayer(write.entry, write.pets);
        if (result.kind === 'ok')
            merged = result.merged;
        else
            failed.push(write.entry);
    }
    petBridge.reload(merged);
    void reloadNotifications(); // 保存后即时生效，无需刷新。
    return failed.length > 0 ? { kind: 'partial', failed } : { kind: 'ok' };
}
/**
 * 把内置默认配置整份同步到用户层。
 *
 * @returns 写入后的成品聚合（调用方还要用它刷新表单）；失败返回 `null`。
 */
export async function syncSettings() {
    const merged = await syncConfig();
    if (merged === null)
        return null;
    petBridge.reload(merged);
    void reloadNotifications();
    return merged;
}
