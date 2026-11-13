import { z } from 'zod';
/** 接口地址的校验：只允许干净的 HTTP 或 HTTPS 地址，凭据不放进 URL。 */
const endpoint = z
    .string()
    .max(2048)
    .refine((value) => {
    if (value === '')
        return true;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
    }
    catch {
        return false;
    }
}, '接口地址必须是 HTTP(S) 地址，且不能含账号、查询参数或片段');
/** 设置补丁的契约：未知字段一律拒绝。 */
const settingsSchema = z
    .object({
    protocol: z.enum(['openai-compatible', 'anthropic']).optional(),
    baseUrl: endpoint.optional(),
    model: z.string().max(200).optional(),
    /** 只限长度；取值枚举由 ai-config.ts 的持久化校验把关，避免两处各写一份名单。 */
    balanceProvider: z.string().max(40).optional(),
    apiKey: z.string().max(8192).optional(),
    clearApiKey: z.boolean().optional(),
    automaticWhispers: z.boolean().optional(),
    whisperIntervalSec: z.number().int().min(60).max(86400).optional(),
    maxTokens: z.number().int().min(128).max(4096).optional(),
    timeoutMs: z.number().int().min(1000).max(60000).optional(),
})
    .strict();
/** 校验设置补丁。 */
export function validateSettings(input) {
    const result = settingsSchema.safeParse(input);
    if (!result.success)
        throw new Error('设置无效：请检查协议、接口地址、间隔（至少 60 秒）和输出上限（128–4096）');
    return result.data;
}
/** 可出现在响应里的字段白名单。 */
const publicNames = [
    'protocol',
    'baseUrl',
    'model',
    'balanceProvider',
    'automaticWhispers',
    'whisperIntervalSec',
    'maxTokens',
    'timeoutMs',
    'hasKey',
];
/** 过滤出可公开的设置字段。 */
export function publicSettings(input) {
    if (input === null || typeof input !== 'object')
        return {};
    const record = input;
    return Object.fromEntries(publicNames
        .filter((name) => Object.prototype.hasOwnProperty.call(record, name))
        .map((name) => [name, record[name]]));
}
