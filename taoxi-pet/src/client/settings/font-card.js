import { FONT_PRESETS, FONT_SIZE_MAX, FONT_SIZE_MIN } from '../../shared/fonts.ts';
import { makeUiKit, numberInputProps } from './ui.ts';
import { makeSelect } from './panel/select.ts';
/**
 * 造外观与字体卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeFontCard(rt) {
    const { h, t } = rt;
    const { cardHead, field, toggleCell } = makeUiKit({ h, t });
    const Select = makeSelect(rt);
    return function FontCard(props) {
        const { busy, font } = props;
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('fontTitle'), t('fontHint')),
                h('div', {
                    className: 'taoxi-pet-cfg__grid2',
                    children: [
                        field(t('fontFamilyLabel'), h(Select, {
                            label: t('fontFamilyLabel'),
                            value: font.family,
                            options: FONT_PRESETS.map((preset) => ({ id: preset.id, label: t('font.' + preset.id) })),
                            disabled: busy,
                            onChange: (id) => props.onChange({ family: id }),
                        }), t('fontFamilyHint')),
                        field(t('fontSizeLabel'), h('input', numberInputProps(font.size, (v) => props.onChange({ size: v }), {
                            step: '1',
                            min: String(FONT_SIZE_MIN),
                            max: String(FONT_SIZE_MAX),
                            disabled: busy,
                        })), t('fontSizeHint')),
                    ],
                }),
                h('div', {
                    className: 'taoxi-pet-cfg__grid2',
                    children: [toggleCell('fontFollowToggle', font.followPet, busy, (v) => props.onChange({ followPet: v }))],
                }),
            ],
        });
    };
}
