import { makeUiKit, numberInputProps } from './ui.ts';
/** 对话开关的展示顺序与文案键。 */
const CHAT_TOGGLES = [
    { key: 'whisperImageEnabled', label: 'whisperImageToggle' },
    { key: 'chatImageEnabled', label: 'chatImageToggle' },
    { key: 'chatAnimationEnabled', label: 'chatAnimationToggle' },
];
/**
 * 造模型卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @param picker - 模型选择器组件（由外壳用同一份运行时造好，跨渲染稳定）。
 * @returns 卡片组件。
 */
export function makeModelCard(rt, picker) {
    const { h, t } = rt;
    const { cardHead, field, toggleCell } = makeUiKit({ h, t });
    return function ModelCard(props) {
        const { busy, catalog, failed } = props;
        /** 「全局默认」的数字格：标签与问号在上、数字输入在下。 */
        const numField = (label, value, setter) => field(t(label), h('input', numberInputProps(value, setter, { step: '1', min: '0', disabled: busy })), t(label + 'Hint'));
        /** 「AI 模型」的一格：标签与问号在上、单下拉选择器在下。 */
        const modelCell = (key, value) => {
            const label = t(key === 'whisperModel' ? 'whisperModelLabel' : 'chatModelLabel');
            return field(label, h(picker, {
                label,
                value,
                disabled: busy,
                catalog,
                failed,
                onChange: (next) => props.onModelChange(key, next),
            }), t('modelFieldHint'));
        };
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('modelTitle'), t('modelHint')),
                failed
                    ? h('p', {
                        className: 'taoxi-pet-cfg__note',
                        style: { color: 'var(--dsw-alias-state-error-primary)' },
                        children: t('modelCatalogFailed'),
                    })
                    : null,
                h('div', {
                    className: 'taoxi-pet-cfg__grid2',
                    children: [modelCell('whisperModel', props.whisperModel), modelCell('chatModel', props.chatModel)],
                }),
                h('div', {
                    className: 'taoxi-pet-cfg__grid4',
                    children: [
                        numField('chatMemory', props.chatMemory, props.onChatMemoryChange),
                        numField('chatImageLimit', props.chatImageLimit, props.onChatImageLimitChange),
                    ],
                }),
                h('div', {
                    className: 'taoxi-pet-cfg__grid3',
                    children: CHAT_TOGGLES.map((toggle) => toggleCell(toggle.label, props.values[toggle.key], busy, (value) => props.onFlagChange(toggle.key, value))),
                }),
            ],
        });
    };
}
