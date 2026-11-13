/**
 * 把「桌宠对话」注册成 DSH 右侧栏的一种标签页。
 *
 * 右侧栏在 DSH 里是可选能力：缺 `sidebarRightTabs` 服务时只告警、不注册，
 * 宠物 overlay 与设置页照常工作——一个可选面板失败不该让整个插件加载失败。
 * @module taoxi-pet/src/client/chat/register
 */
import { LOGO_URL } from './api.ts';
import { makePetChatPanel } from './panel.ts';
import { injectPanelCss } from './styles.ts';
import { disposeTip } from './tooltip.ts';
/** 标签实现身份；同时也是正文与标题插槽的 key。 */
const TAB_ID = 'taoxi-pet-chat';
/** 标签类型；`openTab` 按它打开。 */
const TAB_KIND = 'pet-chat';
/**
 * 打开右侧栏的对话标签。
 *
 * 侧栏导航面可能比注册表晚到，取不到就什么都不做。快捷键的触发动作走这里，
 * 这样「标签类型」这个事实仍只在 registerPetChatTab 里出现一次。
 *
 * @param ctx - 客户端上下文（只用到软取）。
 */
export function openPetChatTab(ctx) {
    const controller = ctx.get?.('sidebarRight');
    controller?.openTab?.(TAB_KIND);
}
/**
 * 注册对话标签（标签类型 + 正文插槽 + 样式）。
 *
 * @param ctx - 客户端上下文。
 * @param rt - 注入的 react 能力。
 * @param options.commandId - 快捷键命令 id；只有命令真的登记成功才传，指向不存在的命令会让侧栏抛错。
 * @returns 注销标签类型并释放样式的函数；正文插槽交给 slots.inject 的作用域随插件卸载。
 */
export function registerPetChatTab(ctx, rt, options = {}) {
    const tabs = ctx.get?.('sidebarRightTabs');
    if (tabs === undefined || typeof tabs.register !== 'function') {
        console.warn('[taoxi-pet] 右侧栏不可用：没有 sidebarRightTabs 服务，桌宠对话标签未注册');
        return () => { };
    }
    const disposeCss = injectPanelCss();
    const Panel = makePetChatPanel(rt);
    /** 指南页卡片的图标：插件 logo；框架给的位置只有 16px 左右，靠 CSS 铺满。 */
    const GuideIcon = () => rt.h('img', { className: 'pet-chat-guide-icon', src: LOGO_URL, alt: '', loading: 'lazy' });
    const commandId = options.commandId;
    const disposeType = tabs.register({
        id: TAB_ID,
        kind: TAB_KIND,
        // extension 是外部插件最高优先带：不与内置类型抢地址，但可以覆盖同名 kind
        priority: 'extension',
        title: () => rt.t('tabTitle'),
        guide: [
            {
                id: TAB_KIND,
                order: 400,
                title: () => rt.t('tabTitle'),
                description: () => rt.t('tabGuide'),
                icon: GuideIcon,
                ...(commandId === undefined ? {} : { commandId }),
            },
        ],
    });
    // 右侧栏可能晚于本插件挂载：等插槽声明后再注册，避免「打开标签却空白」
    ctx.slots.inject('sidebar.right.pane.tab', function* () {
        yield ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID, order: 100 }, () => rt.h(Panel, {}));
    });
    return () => {
        disposeType();
        disposeTip();
        disposeCss();
    };
}
