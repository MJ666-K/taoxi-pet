import { requestMotionPermission } from '../pet/device-tilt.ts';
import { makeUiKit } from './ui.ts';
/**
 * 造移动端效果卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeMobileCard(rt) {
    const { h, t } = rt;
    const { cardHead, toggleCell } = makeUiKit({ h, t });
    return function MobileCard(props) {
        const { busy, physics } = props;
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                cardHead(t('mobileTitle'), t('mobileHint')),
                h('div', {
                    className: 'taoxi-pet-cfg__grid3',
                    children: [
                        toggleCell('physicsHaptic', physics.hapticEnabled !== false, busy, (v) => props.onChange({ hapticEnabled: v })),
                        toggleCell('physicsTilt', physics.tiltGravity === true, busy, (v) => {
                            // iOS 13+ 要求传感器权限必须在用户手势里申请；开关点击正好是那次手势。
                            // 只申请这个开关要用的种类，不顺手把摇一摇的权限也问了。
                            if (v)
                                void requestMotionPermission({ tilt: true, shake: false });
                            props.onChange({ tiltGravity: v });
                        }),
                        toggleCell('physicsShake', physics.shakeThrow === true, busy, (v) => {
                            if (v)
                                void requestMotionPermission({ tilt: false, shake: true });
                            props.onChange({ shakeThrow: v });
                        }),
                    ],
                }),
            ],
        });
    };
}
