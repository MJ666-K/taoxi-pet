/**
 * 宠物卡的 DOM 结构：根节点、舞台与两路视频、命中区、气泡槽、悬浮提示。
 * 不持有状态、不做判定：尺寸变量、定位样式与事件回调都由 PetCard 当帧传入，这里只按顺序拼装。
 * 依赖注入的 h、pet/motion/geometry 的命中区样式与 shared/tooltip 的类名。
 * 不变量：命中区在 stage 内，气泡与提示是根节点的直接子节点——三者的定位都相对根节点。
 * @module taoxi-pet/src/client/pet/card/view
 */
import { PET_HIT_STYLE } from '../motion/geometry.ts';
import { TOOLTIP_CLASS } from '../../../shared/tooltip.ts';
/** 两路视频的共同属性：静音、内联播放并自动播放。 */
const VIDEO_PROPS = { muted: true, playsInline: true, autoPlay: true };
/**
 * 制造宠物卡视图。
 *
 * @param rt - 注入的 react 能力。
 * @returns 只做拼装的纯展示组件。
 */
export function makeCardView(rt) {
    const { h } = rt;
    return function CardView(props) {
        return h('div', {
            ref: props.rootRef,
            className: 'taoxi-pet-root',
            'data-corner': props.corner,
            'data-facing': props.facing,
            style: Object.assign({
                '--taoxi-pet-size': props.size + 'px',
                '--taoxi-pet-mx': props.marginX + 'px',
                '--taoxi-pet-my': props.marginY + 'px',
                // 字号注入最终 px；CSS 侧带原值回退，漏注入也不会坏。
                '--taoxi-pet-font-bubble': props.fontBubblePx + 'px',
                '--taoxi-pet-font-tip': props.fontTipPx + 'px',
            }, props.rootStyle),
            children: [
                // 气泡单槽；余额不可用说明也走这里，手动请求与命令气泡不受 whisperEnabled 限制。
                props.bubble,
                h('div', {
                    ref: props.stageRef,
                    className: 'taoxi-pet-stage',
                    style: props.stageStyle,
                    children: [
                        h('video', Object.assign({}, VIDEO_PROPS, { ref: props.videoARef, className: 'taoxi-pet-video is-front' })),
                        h('video', Object.assign({}, VIDEO_PROPS, { ref: props.videoBRef, className: 'taoxi-pet-video' })),
                        h('div', {
                            className: 'taoxi-pet-hit',
                            style: PET_HIT_STYLE,
                            onClick: props.onClick,
                            onPointerDown: props.onPointerDown,
                            onPointerMove: props.onPointerMove,
                            onPointerUp: props.onPointerUp,
                            onPointerCancel: props.onPointerUp,
                            onPointerEnter: props.onPointerEnter,
                            onPointerLeave: props.onPointerLeave,
                            onContextMenu: props.onContextMenu,
                            // 原生 title 换成自绘浮层后，无障碍名称仍要保留。
                            'aria-label': props.name,
                        }),
                    ],
                }),
                // 悬浮提示常驻只切 class，挂卸节点吃不到淡入过渡；坐标由 placeTip 直接写 style。
                // pointer-events:none 见 TOOLTIP_CSS，否则会挡住命中区导致 enter/leave 闪烁。
                h('div', {
                    ref: props.tipRef,
                    className: TOOLTIP_CLASS + (props.tipOn ? ' is-on' : ''),
                    'aria-hidden': 'true',
                    children: props.name,
                }),
            ],
        });
    };
}
