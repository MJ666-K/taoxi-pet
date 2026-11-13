/**
 * 指针拖拽的装配：把当帧能力束成 DragCard，再交给驱动长期持有。
 * 依赖 motion 的运动面与迟绑槽里的动画流、锁与提示——它们创建得更晚，只在回调里读。
 * 只建一次：驱动自带指针状态机与捕获，重建会让按下中的手势丢失。
 * @module taoxi-pet/src/client/pet/card/drag
 */
import { createDrag } from '../motion/drag.ts';
import { boxToRatio, clampReachableBox } from '../motion/geometry.ts';
import { playClickSound } from '../click-sound.ts';
/**
 * 造拖拽装配的 hook。
 *
 * @param rt - 注入的 react 能力。
 * @returns 接收装配输入的 hook，返回本卡的拖拽驱动。
 */
export function createCardDrag(rt) {
    const { useRef, useEffect } = rt;
    return function useCardDrag(input) {
        const { bumpSeq, card, cfgRef, live, motion, pendingSquash, root, setAnim, setCustomPos } = input;
        const { setOnce, setTipOn } = input;
        // 拖拽驱动每次事件取的当帧能力：逐渲染重建，驱动长期持有这个 getter。
        const dragCard = () => {
            const metrics = motion.metrics();
            return {
                petId: cfgRef.current.id,
                size: metrics.size,
                halfW: metrics.halfW,
                halfH: metrics.halfH,
                physics: cfgRef.current.physics,
                // 睡着时不给拖拽动画：可以拖、位置跟手，但保持睡姿（空池 = 驱动退化为只拖不换源）
                dragAnims: (live.current.flow?.sleeping() ?? false) ? [] : cfgRef.current.animations.drag,
                clickAnims: cfgRef.current.animations.clicks,
                // 松手同理：睡着时不给回 idle 的动画，否则拖一下就把睡姿换掉了
                idleAnims: (live.current.flow?.sleeping() ?? false) ? [] : cfgRef.current.animations.idle,
                currentAnim: card.animRef.current,
                setOnce: (on) => setOnce(on),
                playAnim: (name) => setAnim(name),
                bumpSeq: () => bumpSeq(),
                markSquash: () => {
                    pendingSquash.current = true;
                },
                resumeWork: () => live.current.flow?.resumeWorkStatusAnim() ?? false,
                stopAutonomy: () => motion.stopMove(),
                stopFlight: () => motion.flight.stop(),
                startFlight: motion.startThrow,
                isFrozen: () => live.current.ownAnim.isFrozen(),
                releaseLock: () => live.current.releaseLock(),
                grabVelocity: () => (motion.flight.isFlying() ? motion.flight.velocity() : null),
                playClickSound: () => playClickSound(),
                tipOn: () => live.current.tipOn(),
                placeTip: (x, y) => live.current.placeTip(x, y),
                setTipOn,
                root,
                box: () => motion.box(),
                setBox: (box) => motion.setBox(box),
                commitPlace: (box) => {
                    const metrics = motion.metrics();
                    const viewport = { width: window.innerWidth, height: window.innerHeight };
                    const half = { w: metrics.halfW, h: metrics.halfH };
                    const reached = clampReachableBox(box, viewport, metrics);
                    // 拖拽期间 follow 直接改 DOM；夹取后的比例可能与上次渲染相同，React 会跳过 style 写入。
                    const rootEl = root();
                    if (rootEl) {
                        rootEl.style.left = reached.x + 'px';
                        rootEl.style.top = reached.y + 'px';
                        rootEl.style.right = 'auto';
                        rootEl.style.bottom = 'auto';
                    }
                    motion.setBox(reached);
                    setCustomPos(boxToRatio(reached, viewport, half));
                },
            };
        };
        const dragRef = useRef(null);
        dragRef.current ?? (dragRef.current = createDrag(dragCard));
        const drag = dragRef.current;
        // 卸载即摘掉 window 上的鼠标松开兜底：驱动活得比卡片久，不摘会打到已卸掉的节点。
        useEffect(() => () => drag.dispose(), [drag]);
        live.current.drag = drag;
        return drag;
    };
}
