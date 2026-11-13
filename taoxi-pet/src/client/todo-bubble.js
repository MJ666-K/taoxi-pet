/**
 * 待办面板的气泡外壳：把共享面板塞进气泡槽，显隐与优先级都由槽位决定。
 * 只做挂载与卸载，不碰数据与定位；面板本体在 shared/todo/panel。
 * @module taoxi-pet/src/client/todo-bubble
 */
import { createTodoPanel } from '../shared/todo/panel.ts';
/**
 * 制造待办面板气泡组件（工厂）。
 *
 * @param rt - 注入的 react 能力。
 * @returns 待办面板的气泡组件。
 */
export function makeTodoBubble(rt) {
    const { h, useRef, useEffect } = rt;
    return function TodoBubble({ on, onClose }) {
        const hostRef = useRef(null);
        // 回调存 ref：面板只在挂载时拿一次 onClose，直接闭包会捕获旧的那份。
        const closeRef = useRef(onClose);
        closeRef.current = onClose;
        useEffect(() => {
            const host = hostRef.current;
            if (host === null)
                return;
            const panel = createTodoPanel({
                onClose: () => closeRef.current(),
                // 点宠物本体不收起：拖它走是常见需求，收起就没法一边看清单一边挪位置。
                keepOpenOn: (target) => target instanceof Element && target.closest('.taoxi-pet-hit') !== null,
            });
            host.appendChild(panel.el);
            return () => panel.dispose();
        }, []);
        return h('div', {
            ref: hostRef,
            className: 'taoxi-pet-bubble taoxi-pet-todo-bubble' + (on ? ' is-on' : ''),
        });
    };
}
