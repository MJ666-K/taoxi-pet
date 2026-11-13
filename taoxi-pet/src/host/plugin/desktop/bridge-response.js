/** 纯文本应答的类型串；`text` 与 `none` 共用。 */
const TEXT_UTF8 = 'text/plain; charset=utf-8';
/** JSON 应答的类型串。 */
const JSON_UTF8 = 'application/json; charset=utf-8';
/**
 * 把路由结果翻译成管道应答。
 *
 * @param id - 本次请求的编号，应答必须原样带回（管道上并存的请求靠它配对）。
 * @param result - 业务处理结果。
 * @returns 应答体；`none` 落成空的 204。
 */
export function toBridgeResponse(id, result) {
    if (result.kind === 'file') {
        // 素材只给绝对路径，主进程自行读盘：几十 MB 的视频不进管道。
        return { id, status: 200, contentType: result.contentType, file: result.file };
    }
    if (result.kind === 'text') {
        return { id, status: result.status, contentType: TEXT_UTF8, body: result.body };
    }
    if (result.kind === 'none') {
        // 无需应答：管道侧不传 abort signal，正常到不了这里；保底给个空 204。
        return { id, status: 204, contentType: TEXT_UTF8, body: '' };
    }
    // 业务失败是 200 + { ok: false, reason }：原样透传，不改状态码。
    return { id, status: result.status, contentType: JSON_UTF8, body: JSON.stringify(result.obj) };
}
