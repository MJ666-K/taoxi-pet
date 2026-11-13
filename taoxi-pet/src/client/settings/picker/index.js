/**
 * 模型选择器的出口：行模型、浮层定位、浮层面板与选择器组件本身。
 * 外部只经这里取用，不深路径引用组内文件——搜索语义或定位规则改动时不必摸到调用方。
 * @module taoxi-pet/src/client/settings/picker
 */
export { buildModelRows, matchModelQuery, selectableIndexes, } from './model-rows.ts';
export { computePanelPlacement } from '../panel/placement.ts';
export { buildModelPanel } from './model-picker-panel.ts';
export { makeModelPicker } from './model-picker.ts';
