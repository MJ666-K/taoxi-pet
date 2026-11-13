/**
 * 浏览器半侧 bundle 外壳：由 tsdown 构建为 lib/client.js。
 * 只负责把 makeFactory() 造出的模块交给宿主注入的 window.__ModuleLoader__。
 * 不负责业务逻辑；依赖 app.ts 的工厂与加载前已注入的模块系统。
 * 必须始终成立：整个文件是普通副作用脚本，不能有顶层 ESM import / export（react 由 factory 的 require 取得）。
 * @module taoxi-pet/src/client/index
 */
import { makeFactory } from './app.ts';
window.__ModuleLoader__.load({
    id: 'taoxi-pet',
    factory: makeFactory(),
});
