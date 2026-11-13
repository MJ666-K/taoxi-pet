/**
 * 宠物页面：单只宠物实例 PetCard 与多开容器 PetMulti。
 * 不负责配置解析与几何、物理计算：成品配置由 host 提供，纯逻辑来自 shared。
 * 依赖运行时注入的 react，以及 shared 的 state、pickers、motion、physics 等模块。
 * 必须始终成立：/state 是唯一数据源，动画与气泡都由叶子里的序号变化驱动。
 * @module taoxi-pet/src/client/pet
 */
import { injectPetCss } from './pet/css.ts';
import { createPetCard } from './pet/card/pet-card.ts';
import { createPetMulti } from './pet/multi.ts';
/**
 * 制造宠物页面组件（工厂），返回多开容器 PetMulti。
 *
 * @param rt - 注入的 react 能力。
 * @returns 多开容器组件；容器内部渲染多个 PetCard。
 */
export function makePetUI(rt) {
    injectPetCss();
    const PetCard = createPetCard(rt);
    const PetMulti = createPetMulti(rt, PetCard);
    return PetMulti;
}
