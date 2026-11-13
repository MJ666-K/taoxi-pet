/**
 * 造素材加载器。
 *
 * @param timeoutMs - 单次请求的超时（ms）；到点即中断，避免请求无限挂着。
 * @returns 加载、批量中断与释放。
 */
export function createAssetLoader(timeoutMs) {
    /** 在途请求：销毁时统一中断，否则卸载后完成的响应会创建无人回收的地址。 */
    const inflight = new Set();
    return {
        load: (url, handlers) => {
            const controller = new AbortController();
            inflight.add(controller);
            const timer = window.setTimeout(() => controller.abort(), timeoutMs);
            const settle = () => {
                window.clearTimeout(timer);
                inflight.delete(controller);
            };
            fetch(url, { cache: 'default', signal: controller.signal })
                .then((response) => {
                if (!response.ok)
                    throw new Error('asset HTTP ' + response.status);
                return response.blob();
            })
                .then((blob) => {
                settle();
                handlers.onObjectUrl(URL.createObjectURL(blob));
            })
                .catch((error) => {
                settle();
                handlers.onError(error);
            });
        },
        abortAll: () => {
            for (const controller of inflight)
                controller.abort();
            inflight.clear();
        },
        release: (objectUrl) => {
            URL.revokeObjectURL(objectUrl);
        },
    };
}
