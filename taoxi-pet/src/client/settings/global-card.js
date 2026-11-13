import { makeUiKit } from './ui.ts';
/** 开关的展示顺序与文案键。 */
const TOGGLES = [
    { key: 'notificationsEnabled', label: 'notifyToggle' },
    { key: 'clickSoundEnabled', label: 'clickSoundToggle' },
    { key: 'confineToScreen', label: 'confineToggle' },
    { key: 'trayEnabled', label: 'trayToggle' },
];
/**
 * 造全局开关卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeGlobalCard(rt) {
    const { h, t } = rt;
    const { cardHead, toggleCell } = makeUiKit({ h, t });
    return function GlobalCard(props) {
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('globalTitle'), t('globalHint')),
                h('div', {
                    className: 'taoxi-pet-cfg__grid4',
                    children: TOGGLES.map((toggle) => toggleCell(toggle.label, props.values[toggle.key], props.busy, (value) => props.onChange(toggle.key, value))),
                }),
            ],
        });
    };
}
