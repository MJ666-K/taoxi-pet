/**
 * 造睡觉状态机。
 *
 * @param hub - 卡片共享运行时（取动画写入口与气泡槽）。
 * @param pickNext - 醒来后回到随机链的动作（由动画流提供，避免本模块反向 import）。
 * @param log - 一行日志出口（格式与动画流一致）。
 */
export function createSleepMachine(hub, pickNext, log) {
    let current = null;
    /** 换一段：`once` 决定播完是否触发 ended（循环段必须 false）。 */
    const play = (name, once) => {
        hub.card.actions.setOnce(once);
        hub.card.actions.setAnim(name);
        hub.card.actions.bumpSeq();
    };
    const apply = (state) => {
        const petId = hub.cfg().id;
        if (state.sleeping) {
            if (current !== null)
                return; // 已在睡（含过渡）：叶子重写一次不该从头再播
            hub.stopMotion();
            // 与占用锁同一口径：进入睡觉就收掉任务状态气泡（醒来不补亮，等下一次状态变化再对齐）
            hub.bubbles.hideWork();
            current = { set: { start: state.start, loop: state.loop, end: state.end }, phase: 'start' };
            log(petId, '睡觉 -> [' + state.start + ']');
            play(state.start, true);
            return;
        }
        // 醒来：只有真的在睡才播「起来」；本来醒着 = 幂等空操作
        if (current === null || current.phase === 'end')
            return;
        // 入睡过渡里被叫醒：取消这次入睡，不播「起来」——它不是真的睡着过。
        // 这里什么都不播：点击路径已自己播了点击回应；菜单叫醒时当前「开始」播完会自然回随机链。
        if (current.phase === 'start') {
            current = null;
            log(petId, '入睡被打断：不播起来');
            return;
        }
        current.phase = 'end';
        log(petId, '醒来 -> [' + current.set.end + ']');
        play(current.set.end, true);
    };
    return {
        apply,
        consumeEnded: () => {
            if (current === null)
                return false;
            if (current.phase === 'start') {
                current.phase = 'loop';
                play(current.set.loop, false); // 循环段：不触发 ended
                return true;
            }
            if (current.phase === 'loop') {
                // 睡着期间前台可能被外来动画顶掉（显式点播、hostInstruction）：ended 落到这里说明现在
                // 播的不是循环段。只重播前台会把顶进来的那段一次性动画续成死循环，必须重新点名循环段。
                play(current.set.loop, false);
                return true;
            }
            // phase === 'end'：醒来过渡播完，交回随机链
            current = null;
            pickNext();
            return true;
        },
        sleeping: () => current !== null,
        phase: () => current?.phase ?? null,
    };
}
