/** 注册卸载清理；返回的清理函数由 ctx.effect 收集。 */
export function registerLifecycle(deps) {
    const { ctx, lock, markDisposed, playback, state, stopDownloadSlotTimer, stopHelper, stopWorkStatusFlush } = deps;
    // 随插件生命周期清理：桌面 Helper 回收（异步下载完成后不再拉起）+ 结束所有挂起的等待
    // （回执与 /state 长轮询不结束的话，插件重载会留下一批悬挂响应，各自要等到超时才收尾）。
    ctx.effect(() => () => {
        markDisposed();
        // 工作状态的补写定时器：卸载后它到点已经没有意义（叶子连同长轮询一起收尾），清掉免得挂着
        stopWorkStatusFlush();
        // 下载日志的「清槽」定时器：同上，卸载后它到点已经没有意义
        stopDownloadSlotTimer();
        // 占用锁：卸载时把锁全撤掉并写一次叶子——不写的话渲染端要等 TTL 到点才解除静止
        // （写叶子必须在 state.cancelAll() 之前：那之后挂起的等待者已经收尾了）。
        lock.releaseAll();
        playback.cancelAll();
        state.cancelAll();
        stopHelper('dsh-host-stop');
    });
}
