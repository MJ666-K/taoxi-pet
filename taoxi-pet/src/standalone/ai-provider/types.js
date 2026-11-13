/**
 * 独立 AI 服务的对外形状：服务能力与创建时的依赖。
 *
 * 纯类型，不含实现。
 * 必须始终成立：字段全部 readonly，调用方不得改写服务内部状态。
 * @module taoxi-pet/src/standalone/ai-provider/types
 */
import {} from '../ai-config.ts';
import {} from '../ai-transport.ts';
import {} from '../context.ts';
import {} from '../../host/balance/index.ts';
