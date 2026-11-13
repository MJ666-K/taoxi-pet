/**
 * 一次自主走位的规划：选动作、算方向与距离、交给共享层的 `planMove` 判可达性。
 * 距离按宠物尺寸等比缩放（`minDist`/`maxDist` 是基准宽度下的像素），越界就返回 `null` 让调用方退回原地动作。
 * 纯规划：占用判定（rAF 是否在跑）留在调用方，因为那是 ref 状态。
 * @module taoxi-pet/src/client/pet/motion/move-action
 */
import { planMove } from '../../../shared/motion.ts';
import { PET_REF_WIDTH } from '../../../shared/constants.ts';
/**
 * 规划一次自主走位。
 *
 * @param input - 走位池、朝向、尺寸与视口。
 * @returns 动作名与待执行走位；无法移动时返回 `null`。
 */
export function planMoveAction(input) {
    const actions = input.moves.actions;
    if (actions.length === 0)
        return null;
    const random = input.random ?? Math.random;
    const chosen = input.preferredName
        ? (actions.find((action) => action.name === input.preferredName) ?? null)
        : actions[Math.floor(random() * actions.length)];
    if (!chosen)
        return null;
    const params = Object.assign({}, input.moves.default, chosen.params ?? {});
    // 走路方向只看当前 facing；不要用 turn 动画反推方向。
    const dir = input.facing === 'right' ? 1 : -1;
    // 移动距离随宠物缩放：基准尺寸下的 px 按 size / PET_REF_WIDTH 等比放大。
    const distScale = input.size / PET_REF_WIDTH;
    const plan = planMove({
        cx: input.center.x,
        cy: input.center.y,
        W: input.viewport.width,
        H: input.viewport.height,
        dir,
        minDist: params.minDist * distScale,
        maxDist: params.maxDist * distScale,
        margin: params.margin,
        halfW: input.halfW,
        sideAllow: input.sideAllow,
    });
    if (plan === null)
        return null;
    return { anim: chosen.name, pending: { ...plan, dir, leadSec: params.leadSec, tailSec: params.tailSec } };
}
