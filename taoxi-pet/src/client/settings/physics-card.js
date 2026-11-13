import { makeUiKit, numberInputProps } from './ui.ts';
/**
 * 造物理卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makePhysicsCard(rt) {
    const { h, t } = rt;
    const { cardHead, field, toggleCell } = makeUiKit({ h, t });
    return function PhysicsCard(props) {
        const { busy, physics } = props;
        /** 物理参数的一格：标签与问号在上、数字输入在下。 */
        const physField = (key, step, min) => field(t('physics.' + key), h('input', numberInputProps(physics[key], (v) => props.onChange({ [key]: v }), { step, min, disabled: busy })), t('physics.' + key + 'Hint'));
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('physicsTitle'), t('physicsHint')),
                h('div', {
                    className: 'taoxi-pet-cfg__grid4',
                    children: [
                        physField('gravity', '50', '0'),
                        physField('restitution', '0.01', '0'),
                        physField('groundFriction', '0.1', '0'),
                        physField('throwPower', '0.05', '0.05'),
                    ],
                }),
                h('div', {
                    className: 'taoxi-pet-cfg__grid2',
                    children: [
                        toggleCell('physicsCeilingBounce', physics.ceilingBounce, busy, (v) => props.onChange({ ceilingBounce: v })),
                        toggleCell('physicsPetCollision', physics.petCollision, busy, (v) => props.onChange({ petCollision: v })),
                    ],
                }),
            ],
        });
    };
}
