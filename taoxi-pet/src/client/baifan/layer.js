/**
 * 造插槽组件。
 *
 * @param rt - 注入的 react 能力。
 * @param mount - 把覆盖层挂到给定容器上，返回卸载钩子。
 * @returns 可注册进 `shell.overlay` 的组件。
 */
export function makeBaifanLayer(rt, mount) {
    return function BaifanLayer() {
        const ref = rt.useRef(null);
        rt.useEffect(() => {
            const host = ref.current;
            if (host === null)
                return undefined;
            return mount(host);
            // 空依赖是有意的：容器只在挂载时出现一次，覆盖层自己管内部状态，
            // 不跟着父组件重渲染重挂——重挂会重建米饭与分数的整条状态。
        }, []);
        return rt.h('div', { ref });
    };
}
