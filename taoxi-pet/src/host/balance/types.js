/**
 * 余额查询的契约层（host 半侧）：服务商定义、取数上下文、路由结果与展示形态。
 *
 * 只有形状，不含具体服务商知识：接口地址、额度与解析各在 ./providers/<名>.ts。
 * 不 import 展示层（DSH 单文件加载约束），因此与 src/shared 各声明一份同构类型。
 * 始终成立：失败必须显式，0 余额只能来自接口。契约见 openapi.yaml。
 *
 * @module taoxi-pet/src/host/balance/types
 */
export {};
