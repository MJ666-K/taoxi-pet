/**
 * 桌面 Helper 的管道协议：渲染端经 main.js 转发的一次请求与应答形状。
 *
 * 管道两端（宿主与 Electron 主进程）各按本文件对齐消息格式。
 * 必须始终成立：URL 已含路由前缀，宿主侧不得再拼一次。
 * @module taoxi-pet/src/host/helper/bridge
 */
/** 协议行前缀：stdout/stdin 里以此开头的整行 JSON 属于 bridge 协议，其余为日志。 */
export const BRIDGE_PREFIX = 'taoxi-pet-bridge:';
