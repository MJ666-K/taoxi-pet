/**
 * 对话发送：把一句输入交给宿主 `POST /chat`，只回执成败。
 * 正文展示不走这里——回复统一从 `/state` 的 `pets.<id>.say` 读。
 * @module taoxi-pet/src/shared/chat/send
 */
/** 对话要等 LLM 生成回复，比碎碎念（30s）放宽一倍 */
const SEND_TIMEOUT_MS = 60000;
/**
 * 发送一句对话（携带记忆去宿主生成回复并写入记忆）。
 * 网络或解析失败显式抛错，调用方决定报错方式，绝不静默伪造回复。
 *
 * @param baseUrl - 已含 `?pet=&surface=` 的完整对话地址。
 * @param text - 用户输入正文（宿主会 trim 并校验 2000 字上限）。
 * @param attachment - 可选的一张图片；不传时请求体只有 `text`，与旧版逐字一致。
 * @returns 成功，或归一化后的失败原因与文案。
 * @throws 响应不是 JSON 对象时。
 */
export async function sendChat(baseUrl, text, attachment) {
    const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(attachment ? { text, attachment } : { text }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const raw = await res.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
        throw new Error('taoxi-pet: 对话响应非法');
    }
    const o = raw;
    if (o.ok !== true) {
        return {
            ok: false,
            reason: o.reason === 'provider-missing' || o.reason === 'generate-error' || o.reason === 'config-error'
                ? o.reason
                : 'bad-request',
            message: typeof o.message === 'string' ? o.message : undefined,
        };
    }
    return { ok: true };
}
