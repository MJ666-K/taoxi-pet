import { handleAssetsRoutes } from './assets.ts';
import { handleAttachmentRoutes } from './attachment.ts';
import { handleAvatarRoutes } from './avatar.ts';
import { handleBalanceRoutes } from './balance.ts';
import { handleCharacterRoutes } from './character.ts';
import { handleChatRoutes } from './chat.ts';
import { handleConfigRoutes } from './config/index.ts';
import { handleDesktopRoutes } from './desktop.ts';
import { handleInteractionRoutes } from './interaction.ts';
import { handleMenuRoutes } from './menu.ts';
import { handleMotionRoutes } from './motion.ts';
import { handlePlaybackRoutes } from './playback.ts';
import { handleSessionRoutes } from './session.ts';
import { handleStateRoutes } from './state.ts';
import { handleSleepRoutes } from './sleep.ts';
import { handleTodoRoutes } from './todos.ts';
import { handleVoiceRoutes } from './voice.ts';
/** 处理器顺序：越靠前越先匹配；素材兜底必须在末尾。 */
const HANDLERS = [
    handleConfigRoutes,
    handleDesktopRoutes,
    handleMenuRoutes,
    handleStateRoutes,
    handleSessionRoutes,
    handleBalanceRoutes,
    handleInteractionRoutes,
    handleMotionRoutes,
    handlePlaybackRoutes,
    handleSleepRoutes,
    handleChatRoutes,
    handleAttachmentRoutes,
    handleTodoRoutes,
    handleVoiceRoutes,
    handleAvatarRoutes,
    handleCharacterRoutes,
    handleAssetsRoutes,
];
/**
 * 睡觉期间要拒绝的端点：只列「打扰类」。
 *
 * 刻意用白名单而不是黑名单——新增端点默认放行，不会因为忘了排除而把维护动作（改显示位置、
 * 重载配置）或拖拽链路（/position、/throw）一起锁死；反过来，漏列一个打扰端点只是它还能用，
 * 不会造成「宠物叫不醒」。
 */
function sleepGated(rest, method) {
    if (rest === 'chat')
        return method === 'POST';
    if (rest === 'todos')
        return method === 'POST' || method === 'DELETE';
    return (rest === 'anim' ||
        rest === 'whisper' ||
        rest === 'balance' ||
        rest === 'broadcast' ||
        rest === 'bubble/clear' ||
        rest === 'menu/click' ||
        rest === 'voice');
}
/**
 * 由依赖表构造路由分发器（`apply` 只调一次）。
 * @param deps - 路由层依赖（store、路径、动作函数）。
 * @returns 接收 URL/rest/方法/请求体/断开信号并给出应答的函数。
 */
export function createPetRouter(deps) {
    return async (url, rest, method, body, signal) => {
        // 睡觉闸门放在分发之前：各领域处理器完全不用知道「睡觉」这回事，也不会漏掉某一处。
        // 只挡带 ?pet= 的请求（/todos 的清单是全局的，没有归属宠物就不拦）。
        if (sleepGated(rest, method)) {
            const petId = String(url.searchParams.get('pet') ?? '').trim();
            if (petId) {
                const blocked = deps.sleepBlocked(petId, url.searchParams);
                if (blocked)
                    return blocked;
            }
        }
        for (const handle of HANDLERS) {
            const result = await handle(deps, { url, rest, method, body, signal });
            if (result !== undefined)
                return result;
        }
        // 素材处理器总会给出应答，这条只在新增领域处理器漏掉兜底时才会走到。
        return { kind: 'text', status: 404, body: 'taoxi-pet: not found' };
    };
}
