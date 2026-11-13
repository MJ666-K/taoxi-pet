/**
 * 一种展示形态需要提供的展示规则，由 handlers/index.ts 装配成 `Record<BalanceShape, ShapeHandler>`。
 *
 * 拆成 percent、rows、detail 与 views，是为了让一个形态的全部展示知识待在一个文件里：
 * 加形态只需写一个新 handler，不必在主流程里插分支。
 *
 * @module taoxi-pet/src/shared/balance/handlers/shape
 */
export {};
