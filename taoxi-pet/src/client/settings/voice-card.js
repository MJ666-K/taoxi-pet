import { makeUiKit, numberInputProps } from './ui.ts';
/**
 * 造语音卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @param picker - 音色选择器组件；与模型卡一样由装配根造一次后注入，保证组件类型跨渲染稳定。
 * @returns 卡片组件。
 */
export function makeVoiceCard(rt, picker) {
    const { h, t } = rt;
    const { cardHead, field, toggleCell } = makeUiKit({ h, t });
    return function VoiceCard(props) {
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('voiceTitle'), t('voiceHint')),
                // 第一行四个开关：四类语音各一个，必须相邻，读得出是「同一类」；第二行两个输入：音色与音量。
                // 音色不挂文字标签也不挂问号：下拉当前值「晓伊（女·活泼）」自己就说明了它是什么。
                h('div', {
                    className: 'taoxi-pet-cfg__grid4',
                    children: [
                        toggleCell('voiceEnabled', props.enabled, props.busy, props.onToggle),
                        toggleCell('voiceWhisperEnabled', props.whisperEnabled, props.busy, props.onWhisperToggle),
                        toggleCell('voiceTodoEnabled', props.todoEnabled, props.busy, props.onTodoToggle),
                        toggleCell('voiceNotifyEnabled', props.notifyEnabled, props.busy, props.onNotifyToggle),
                    ],
                }),
                h('div', {
                    className: 'taoxi-pet-cfg__grid2',
                    children: [
                        h(picker, {
                            label: t('voiceNameLabel'),
                            value: props.voiceName,
                            options: props.voices,
                            disabled: props.busy,
                            onChange: props.onVoiceChange,
                        }),
                        field(t('voiceVolumeLabel'), h('input', numberInputProps(props.volume, props.onVolumeChange, {
                            step: '0.05',
                            min: '0',
                            max: '1',
                            disabled: props.busy,
                        })), t('voiceVolumeHint')),
                    ],
                }),
            ],
        });
    };
}
