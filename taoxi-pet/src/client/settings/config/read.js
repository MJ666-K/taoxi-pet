/**
 * 成品配置的读取：把宿主 `GET /config` 的聚合响应解析成「表单补丁」与「条目实例列表」。
 * 只认成品里合法性说得清的字段：缺字段或类型不对就跳过，让表单保留自己手里的值，不拿坏数据覆盖。
 * 与写方向（`http.ts`）分开：这里纯解析，不发请求、不碰状态。
 * @module taoxi-pet/src/client/settings/config/read
 */
import { DEFAULT_FONT } from '../../../shared/fonts.ts';
import { DEFAULT_PHYSICS } from '../../../shared/physics.ts';
import { parseWeights } from '../../../shared/weights.ts';
/** 非负有限数才算合法；其余（`NaN`、负数、字符串）一律当作没写。 */
const nonNegative = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
};
/** 一对模型选择：两项都是字符串才算写全，只写一半视为没写（宿主会按非法拒绝）。 */
const readModel = (value) => {
    const model = value;
    if (!model || typeof model.provider !== 'string' || typeof model.model !== 'string')
        return undefined;
    return { provider: model.provider, model: model.model };
};
/**
 * 从成品聚合里读出 main 条目的表单补丁。
 *
 * @param merged - `GET /config` 的响应体。
 * @returns 表单补丁；`main.pets` 缺失或不是数组时返回 `null`（响应本身坏了，调用方应报错）。
 */
export function readMainConfig(merged) {
    const main = merged.main;
    if (!main || !Array.isArray(main.pets))
        return null;
    const pets = main.pets;
    const patch = {
        // 位置深拷贝：编辑列表与容器手里的成品列表必须是两份数据。
        pets: pets.map((pet) => ({ ...pet, position: { ...pet.position } })),
    };
    if (typeof main.whisperPrompt === 'string')
        patch.entryPrompt = main.whisperPrompt;
    if (typeof main.notificationsEnabled === 'boolean')
        patch.notificationsEnabled = main.notificationsEnabled;
    if (typeof main.clickSoundEnabled === 'boolean')
        patch.clickSoundEnabled = main.clickSoundEnabled;
    if (typeof main.whisperImageEnabled === 'boolean')
        patch.whisperImageEnabled = main.whisperImageEnabled;
    if (typeof main.chatImageEnabled === 'boolean')
        patch.chatImageEnabled = main.chatImageEnabled;
    if (typeof main.chatAnimationEnabled === 'boolean')
        patch.chatAnimationEnabled = main.chatAnimationEnabled;
    if (typeof main.confineToScreen === 'boolean')
        patch.confineToScreen = main.confineToScreen;
    if (typeof main.trayEnabled === 'boolean')
        patch.trayEnabled = main.trayEnabled;
    if (typeof main.voiceEnabled === 'boolean')
        patch.voiceEnabled = main.voiceEnabled;
    if (typeof main.voiceName === 'string')
        patch.voiceName = main.voiceName;
    if (typeof main.voiceWhisperEnabled === 'boolean')
        patch.voiceWhisperEnabled = main.voiceWhisperEnabled;
    if (typeof main.voiceTodoEnabled === 'boolean')
        patch.voiceTodoEnabled = main.voiceTodoEnabled;
    if (typeof main.voiceNotifyEnabled === 'boolean')
        patch.voiceNotifyEnabled = main.voiceNotifyEnabled;
    if (main.physics && typeof main.physics === 'object') {
        patch.physics = { ...DEFAULT_PHYSICS, ...main.physics };
    }
    if (main.font && typeof main.font === 'object') {
        patch.font = { ...DEFAULT_FONT, ...main.font };
    }
    const weights = parseWeights(main.animationWeights);
    if (weights)
        patch.animationWeights = weights;
    const whisperModel = readModel(main.whisperModel);
    if (whisperModel)
        patch.whisperModel = whisperModel;
    const chatModel = readModel(main.chatModel);
    if (chatModel)
        patch.chatModel = chatModel;
    const rounds = nonNegative(main.chatMemoryRounds);
    if (rounds !== undefined)
        patch.chatMemoryRounds = rounds;
    const limit = nonNegative(main.chatImageLimit);
    if (limit !== undefined)
        patch.chatImageLimit = limit;
    // 上界在宿主侧已经把关，这里补一次跨进程读回的判定：脏值只影响显示，不让它流到播放端
    const volume = nonNegative(main.voiceVolume);
    if (volume !== undefined && volume <= 1)
        patch.voiceVolume = volume;
    return patch;
}
/**
 * 从成品聚合里读出全部条目及其实例（`main` 在前，其余按文件名顺序）。
 *
 * 只带实例字段：条目级的动画池、人设等大对象不挂到每只宠物上——设置页的提交体会被整包
 * 序列化，挂上去等于把动画池复制 N 份。
 *
 * @param merged - `GET /config` 的响应体。
 * @returns 条目列表；`main.pets` 缺失或不是数组时返回 `null`（响应本身坏了，调用方应报错）。
 */
export function readConfigEntries(merged) {
    const main = merged.main;
    if (!main || !Array.isArray(main.pets))
        return null;
    const out = [];
    for (const [key, conf] of Object.entries(merged)) {
        const pets = Array.isArray(conf?.pets) ? conf.pets : [];
        out.push({
            key,
            kind: key === 'main' ? 'main' : 'pack',
            ...(typeof conf?.whisperPrompt === 'string' ? { entryPrompt: conf.whisperPrompt } : {}),
            pets: pets.map((pet) => ({ ...pet, position: { ...pet.position }, assetRoot: key })),
        });
    }
    return out;
}
