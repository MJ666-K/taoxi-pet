/**
 * 「下一个自播动画」的决策：把掷骰结果与移动尝试折成「切哪个动画、日志里算什么类别」。
 * 只决定该做什么，不碰 ref、不 setState——调用方负责真正切动画并推进世代号。
 * 移动那一档由调用方先试一次走位：占用中就别重播、无法移动才退回原地动作。
 * @module taoxi-pet/src/client/pet/animation/next-animation
 */
import { pick, pickCategoryAction } from '../../../shared/pickers.ts';
/**
 * 决定下一个自播动画。
 *
 * @param input - 掷骰类别、动画池与走位结果。
 * @returns 类别、要切的动画名，以及「这次是否需要切」。
 */
export function decideNextAnimation(input) {
    const { kind, animations, facing, current, move } = input;
    if (kind === 'idle')
        return { kind: 'IDLE', anim: pick(animations.idle, current), play: true };
    if (kind === 'turn')
        return { kind: 'TURN', anim: pick(animations.turn, current), play: true };
    if (kind === 'move' && move !== false && move !== undefined) {
        // 占用中（true）不重播；成功则是那次走位已经切好的动作名，只用于日志。
        return { kind: 'MOVES', anim: typeof move === 'string' ? move : null, play: false };
    }
    const action = pickCategoryAction(animations.categories, animations.idle, facing, current);
    return { kind: action.id, anim: action.name, play: true };
}
