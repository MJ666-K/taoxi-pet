/**
 * 创建DesktopSync。
 */
export function createDesktopSync(deps) {
    const { log, logDesktopDecision, desktopPetList, startHelper, stopHelperAndWait } = deps;
    /** 同进程内跑 helper（打包应用）：没有子进程可重启，只能让 helper 自己重建窗口。 */
    const inProcessHost = process.env.DSH_PET_IN_PROCESS === '1';
    let desktopSyncQueue = Promise.resolve();
    const restartDesktop = () => {
        desktopSyncQueue = desktopSyncQueue
            .then(async () => {
            // 判定是现读的（pets 不持有状态），这里只补一行诊断日志。
            logDesktopDecision();
            if (inProcessHost) {
                // 先把新列表喂给渲染侧，再让它关窗重建：只动窗口、不动宿主进程，
                // 位置与运行状态都留着（整应用重启会把它们一起清掉）。
                process.env.DSH_PET_PETS = JSON.stringify(desktopPetList());
                await globalThis.__dshPetRebuildUi?.();
                return;
            }
            await stopHelperAndWait('desktop-config-change');
            startHelper();
        })
            .catch((e) => {
            log.warn(`[taoxi-pet] 重启桌面 Helper 失败：${e instanceof Error ? e.message : String(e)}`);
        });
        return desktopSyncQueue;
    };
    return { requestRestart: restartDesktop };
}
