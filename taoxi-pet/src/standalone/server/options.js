/**
 * 独立服务的端口与选项形状：默认端口、扫描上限与对外能力。
 *
 * 纯类型与常量，不含实现。
 * 必须始终成立：默认端口变化要同步 CLI 帮助文案与 CONFIG.md。
 * @module taoxi-pet/src/standalone/server/options
 */
import {} from '../context.ts';
import {} from '../request-security.ts';
import {} from '../settings.ts';
/** 默认监听端口。 */
export const DEFAULT_STANDALONE_PORT = 3080;
/** 端口被占用时最多向后顺延的次数。 */
export const PORT_SCAN_LIMIT = 25;
