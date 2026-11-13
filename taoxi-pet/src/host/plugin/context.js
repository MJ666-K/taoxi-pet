/**
 * 宿主上下文的类型入口：DSH 注入的 ctx 没有可静态合并的完整服务类型。
 *
 * 各工厂拿到的 ctx 都经过这里，而不是每个模块各写一份 `any`——这样"哪里依赖宿主服务"
 * 只需 grep 一个类型名，将来 DSH 提供完整 Context 合并时也只改这一处。
 * 不扩大依赖面：模块仍要通过 HostPlugin 输入声明自己真正用到的东西。
 * @module taoxi-pet/src/host/plugin/context
 */
export {};
/* eslint-enable @typescript-eslint/no-explicit-any */
