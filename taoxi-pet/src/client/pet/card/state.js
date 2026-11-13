/**
 * 制造卡状态容器的 hook。
 *
 * @param rt - 注入的 react 能力。
 * @returns 接收初始值的 hook；状态与 ref 在卡内跨渲染保留。
 */
export function createCardState(rt) {
    const { useState, useRef } = rt;
    return function useCardState(init) {
        const [anim, setAnim] = useState(init.anim);
        const [once, setOnce] = useState(true);
        const [seq, setSeq] = useState(0);
        const [cuePlayback, setCuePlayback] = useState(null);
        const [facing, setFacing] = useState('left');
        const [tipOn, setTipOn] = useState(false);
        const [customPos, setCustomPos] = useState(null);
        const [size, setSize] = useState(init.size);
        const [corner, setCorner] = useState(init.corner);
        const [margin, setMargin] = useState(init.margin);
        // ref 是状态的镜像：驱动与事件回调在闭包外读它们，不能等到下一帧。
        const animRef = useRef(anim);
        animRef.current = anim;
        const facingRef = useRef(facing);
        facingRef.current = facing;
        const customPosRef = useRef(customPos);
        customPosRef.current = customPos;
        const bumpSeq = () => setSeq((s) => s + 1);
        const play = (next, opts) => {
            setAnim(next);
            setOnce(opts?.once ?? true);
            if (opts?.replay)
                bumpSeq();
            if (opts?.cue !== undefined)
                setCuePlayback(opts.cue);
        };
        return {
            actions: {
                bumpSeq,
                play,
                setAnim,
                setCorner,
                setCuePlayback,
                setCustomPos,
                setFacing,
                setMargin,
                setOnce,
                setSize,
                setTipOn,
            },
            animRef,
            customPosRef,
            facingRef,
            state: { anim, corner, cuePlayback, customPos, facing, margin, once, seq, size, tipOn },
        };
    };
}
