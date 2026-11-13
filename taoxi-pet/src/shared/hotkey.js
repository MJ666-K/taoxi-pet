/**
 * 悬停快捷键的通用判据：哪一次按键该被宠物截走。
 *
 * 纯函数，两端共用；各功能只声明自己那一个键（见 chat/hotkey 与 todo/hotkey）。
 * 桌面端只在窗口已聚焦时收得到按键——透明穿透窗默认不抢焦点。
 * @module taoxi-pet/src/shared/hotkey
 */
/** 这些地方按键属于打字，不能抢：输入框、文本域、下拉、contenteditable。 */
export function isTypingTarget(target) {
    const el = target;
    if (!el || typeof el.tagName !== 'string')
        return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select')
        return true;
    return el.isContentEditable === true;
}
/**
 * 是不是一次「裸按某键」。
 *
 * @param e - 键盘事件（只读 key 与修饰键、target）。
 * @param key - 目标键的小写形式，如 `'t'`。
 * @returns 键名匹配（大小写不敏感）、不带 Ctrl/Meta/Alt，且焦点不在可编辑元素上时为 true。
 */
export function isBareKey(e, key) {
    if (e.ctrlKey || e.metaKey || e.altKey)
        return false;
    if (String(e.key).toLowerCase() !== key)
        return false;
    return !isTypingTarget(e.target);
}
