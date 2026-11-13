import { methodNotAllowed, okResult } from './result.ts';
/** 余额领域：未命中返回 undefined，命中返回应答。 */
export async function handleBalanceRoutes(deps, input) {
    const { refreshBalance } = deps;
    const { method, rest } = input;
    // 余额：POST /balance 立即刷新一次并写入 S，返回 {ok}——不返回余额数据，数据只有 /state 一个出口。
    // 前端已不再各自定时查余额，也没有计数轮询中转端点。
    if (rest === 'balance') {
        if (method !== 'POST')
            return methodNotAllowed();
        await refreshBalance(true); // manual：用户主动要的，余额不可用时前端必弹文字说明
        // ok 只表示「这次刷新动作完成了」；余额本身是否可用在 S 的 data 里（ok:false 会弹文字说明气泡）
        return okResult({ ok: true });
    }
    return undefined;
}
