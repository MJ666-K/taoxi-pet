import { INPUT_CLASS, makeUiKit, numberInputProps } from './ui.ts';
import { actionPercent, WEIGHT_KEYS, withWeight } from '../../shared/weights.ts';
/**
 * 造动作频率卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeMotionCard(rt) {
    const { h, t } = rt;
    const { cardHead, field } = makeUiKit({ h, t });
    return function MotionCard(props) {
        const { busy, weights } = props;
        // 三个可编辑权重：改一项时另两项不动，夹取规则在 weights.withWeight。
        const weightFields = WEIGHT_KEYS.map((key) => field(t('motion.' + key), h('input', numberInputProps(weights[key], (value) => props.onChange(withWeight(weights, key, value)), {
            step: '1',
            min: '0',
            max: '100',
            disabled: busy,
        }))));
        // 随机动作只读：由 100 − 三项之和算出，不给输入入口。
        const actionField = field(t('motion.action'), h('input', {
            className: INPUT_CLASS,
            type: 'number',
            value: actionPercent(weights),
            readOnly: true,
            tabIndex: -1,
            'aria-label': t('motion.action'),
        }));
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('motionTitle'), t('motionHint')),
                h('div', { className: 'taoxi-pet-cfg__grid4', children: [...weightFields, actionField] }),
            ],
        });
    };
}
