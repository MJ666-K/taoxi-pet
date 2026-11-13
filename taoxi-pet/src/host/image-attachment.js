/**
 * 对话图片入参的解析：把线上 JSON 的 `attachment` 变成附件服务可直接接收的字节。
 * 不做 IO、不碰附件服务——落盘与权威校验（解码真实性、像素上限）在路由层，本模块只负责
 * 形状、媒体类型白名单与 base64 规范化。
 * @module taoxi-pet/src/host/image-attachment
 */
/** 允许的媒体类型；顺序用于错误文案，与宿主附件服务的白名单保持一份事实。 */
const MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
/** base64 字符上限：请求体上限 1 MiB 下留出 text 与 JSON 结构的余量。 */
const MAX_BASE64_CHARS = 900000;
/**
 * 解析请求体里的 `attachment`。
 *
 * @param raw - 未经校验的原始值。
 * @returns 规范 base64 解出的字节与媒体类型；失败时给出可直接下发的文案。
 */
export function parseImageAttachment(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { ok: false, message: 'attachment 必须是对象' };
    }
    const { mediaType, data } = raw;
    if (typeof mediaType !== 'string' || !MEDIA_TYPES.includes(mediaType)) {
        return { ok: false, message: `attachment.mediaType 必须是 ${MEDIA_TYPES.join(' / ')} 之一` };
    }
    if (typeof data !== 'string' || data === '') {
        return { ok: false, message: 'attachment.data 必须是非空 base64 字符串' };
    }
    if (data.length > MAX_BASE64_CHARS) {
        return { ok: false, message: 'attachment.data 过长（请压缩或降低分辨率）' };
    }
    // Buffer 解码会静默丢弃非法字符，所以用「重新编码必须与原文一致」确认它确实是规范 base64；
    // 否则 `"abc!!!"` 会被悄悄解成别的字节，调用方以为发了 A、模型看到的却是 B。
    const decoded = Buffer.from(data, 'base64');
    if (decoded.length === 0 || decoded.toString('base64') !== data) {
        return { ok: false, message: 'attachment.data 不是合法的 base64' };
    }
    return { ok: true, mediaType: mediaType, bytes: new Uint8Array(decoded) };
}
