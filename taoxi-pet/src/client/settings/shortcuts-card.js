import { HEAR_HOTKEY_HINT } from '../../shared/chat/hear-hold.ts';
import { CAPTURE_HOTKEY_HINT, CHAT_HOTKEY_HINT } from '../../shared/chat/hotkey.ts';
import { DISPLAY_HOTKEY_HINTS } from '../../shared/display-hotkey.ts';
import { SLEEP_HOTKEY_HINT } from '../../shared/sleep-hotkey.ts';
import { TODO_HOTKEY_HINT } from '../../shared/todo/hotkey.ts';
import { keycapOf, subscribeShortcutKeycaps } from '../app-shortcut.ts';
import { petChatShortcutKeycap } from '../chat/shortcut.ts';
import { petShortcutKeycap } from '../pet/card/shortcut.ts';
import { makeUiKit } from './ui.ts';
/** 折叠正文的 id：与标题按钮的 `aria-controls` 成对。 */
const BODY_ID = 'pet-cfg-shortcuts';
/** 粘贴不是我们注册的命令，键帽按平台推导（macOS 是 ⌘V），不写死字符串。 */
const PASTE_KEYCAP = keycapOf({ code: 'KeyV', modifiers: ['primary'] });
/** 现读一遍三条全局命令的键帽。 */
function readKeycaps(ctx) {
    return {
        open: petShortcutKeycap(ctx, 'chat'),
        hear: petShortcutKeycap(ctx, 'hear'),
        capture: petShortcutKeycap(ctx, 'capture'),
        sidebar: petChatShortcutKeycap(ctx),
    };
}
/**
 * 造快捷键卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @param ctx - 客户端上下文：读改绑后的键位。
 * @returns 卡片组件。
 */
export function makeShortcutsCard(rt, ctx) {
    const { h, t, useState, useEffect } = rt;
    const { foldCard } = makeUiKit({ h, t });
    return function ShortcutsCard() {
        const [open, setOpen] = useState(false);
        // 每次渲染现读一遍：目录只是几十行数组，读它比维护一份缓存更省事。
        const [keycaps, setKeycaps] = useState(readKeycaps(ctx));
        // 改绑发生在「设置 → 快捷键」那一页，切回来时必须重新读一次。
        useEffect(() => subscribeShortcutKeycaps(ctx, () => setKeycaps(readKeycaps(ctx))), []);
        /** 一行：左边动作名，右边键帽。 */
        const row = (label, keys) => h('div', {
            className: 'taoxi-pet-cfg__field',
            children: [
                h('span', { key: 'l', className: 'taoxi-pet-cfg__flabel', children: t(label) }),
                h('span', { key: 'v', className: 'taoxi-pet-cfg__note', children: keys }),
            ],
        });
        return foldCard({
            id: BODY_ID,
            title: t('shortcutCardTitle'),
            hint: t('shortcutCardHint'),
            body: [
                h('p', { key: 'petTitle', className: 'taoxi-pet-cfg__cardTitle', children: t('shortcutGroupPet') }),
                h('p', { key: 'petHint', className: 'taoxi-pet-cfg__note', children: t('shortcutGroupPetHint') }),
                h('div', {
                    key: 'petRows',
                    className: 'taoxi-pet-cfg__grid2',
                    children: [
                        row('shortcutRowChat', CHAT_HOTKEY_HINT),
                        row('shortcutRowHold', HEAR_HOTKEY_HINT),
                        row('shortcutRowCapture', CAPTURE_HOTKEY_HINT),
                        row('shortcutRowPaste', PASTE_KEYCAP),
                        row('shortcutRowTodo', TODO_HOTKEY_HINT),
                        row('shortcutRowSleep', SLEEP_HOTKEY_HINT),
                        row('shortcutRowDisplay', DISPLAY_HOTKEY_HINTS.join(' · ')),
                    ],
                }),
                h('p', { key: 'globalTitle', className: 'taoxi-pet-cfg__cardTitle', children: t('shortcutGroupGlobal') }),
                h('p', { key: 'globalHint', className: 'taoxi-pet-cfg__note', children: t('shortcutGroupGlobalHint') }),
                h('div', {
                    key: 'globalRows',
                    className: 'taoxi-pet-cfg__grid2',
                    children: [
                        row('shortcutRowChat', keycaps.open),
                        row('shortcutRowHear', keycaps.hear),
                        row('shortcutRowCapture', keycaps.capture),
                        row('shortcutRowSidebar', keycaps.sidebar),
                    ],
                }),
            ],
            open,
            onToggle: () => setOpen(!open),
        });
    };
}
