/**
 * 气泡单槽：余额、说话、工作状态三种气泡的显隐、停留计时与优先级选择。
 * 不负责何时点亮与动画联动：tick 判定、抽动画、打日志都在 PetCard；也不负责外观，哑组件在 client/bubble.ts。
 * 依赖注入的 react 与两个气泡组件；三个停留计时器都归本模块清理。
 * 不变量：同一时刻只渲染一个气泡，优先级依次为终态任务、说话、余额、非终态任务。
 * @module taoxi-pet/src/client/pet/card/bubble-slots
 */
import { balancePageCount as balancePageCountOf } from '../../../shared/balance/index.ts';
import { BUBBLE_HOLD_IDLE, reduceBubbleHold, utteranceToHold, } from '../../../shared/bubble-hold.ts';
import { subscribeVoiceState, subscribeVoiceUtterance } from '../../../shared/voice.ts';
import { BUBBLE_DURATION_MS } from '../timings.ts';
/**
 * 决定当前挂哪个气泡。
 *
 * 终态任务只活 10s，所以不让位；非终态常驻，让位 10s 没有损失。
 *
 * @param input - 三种气泡的显隐与开关。
 * @returns 命中的槽位；都不成立时为 `none`。
 */
export function decideBubbleSlot(input) {
    // 面板是用户主动打开的窗口：它占槽时其余气泡一律让位，关掉后按原规则恢复。
    if (input.todoOn)
        return 'todo';
    if (input.workTerminal && input.workOn && input.workText && input.workStatusEnabled)
        return 'work-terminal';
    if (input.whisperOn && input.whisperText)
        return 'whisper';
    if (input.balanceOn && input.balanceAvailable && (input.balanceEnabled || input.balanceManual))
        return 'balance';
    if (input.workOn && input.workText && input.workStatusEnabled)
        return 'work';
    return 'none';
}
/**
 * 余额气泡的可翻页数。
 *
 * 页数规则归 shared（与每页内容同源），这里只补一个「还没有结果」的兜底。
 *
 * @param balance - 最近一次余额结果；`null` 表示这一拍还没有数据。
 * @returns 页数，至少 1。
 */
export function balancePageCount(balance) {
    return balance ? balancePageCountOf(balance) : 1;
}
/**
 * 制造气泡单槽的 hook，每个 PetCard 调一次。
 *
 * @param rt - 注入的 react 能力。
 * @param components - 余额与说话气泡组件。
 * @returns 接收视图输入的 hook；钩子内部的状态与计时器随卡片卸载一并清理。
 */
export function createBubbleSlots(rt, components) {
    const { h, useState, useRef, useEffect } = rt;
    const BalanceBubble = components.balanceBubble;
    const TodoBubble = components.todoBubble;
    const WhisperBubble = components.whisperBubble;
    return function useBubbleSlots(input) {
        // 余额气泡：显隐与展开页。
        const [balanceOn, setBalanceOn] = useState(false);
        const [balancePage, setBalancePage] = useState(0);
        const balanceTimerRef = useRef(null);
        // 说话气泡：显隐、文本与配图（池内名与完整地址二选一）。收起时机在 bubbleHoldRef：
        // 语音合成期间挂起计时，播完再留一小段尾巴（见 shared/bubble-hold）。
        const [whisperOn, setWhisperOn] = useState(false);
        const [whisperText, setWhisperText] = useState(null);
        const [whisperImage, setWhisperImage] = useState(undefined);
        const [whisperUrl, setWhisperUrl] = useState(undefined);
        const whisperHoldRef = useRef(BUBBLE_HOLD_IDLE);
        const whisperTextRef = useRef(null);
        const whisperTimerRef = useRef(null);
        // 待办面板：独占槽位，没有停留计时，显隐只由用户开关。
        const [todoOn, setTodoOn] = useState(false);
        // 工作状态气泡：显隐与文本。
        const [workOn, setWorkOn] = useState(false);
        const [workText, setWorkText] = useState(null);
        const workTimerRef = useRef(null);
        // 语音播报状态：只在手动触发的那一句上有值，气泡据此显示转圈 / 喇叭
        const [voiceState, setVoiceState] = useState('idle');
        // 订阅是模块级单例：卸载时必须退订，否则旧卡片会被后续状态推送重渲染
        useEffect(() => subscribeVoiceState(setVoiceState), []);
        // 卸载后不再 setState：三个计时器都在这里清。
        useEffect(() => () => {
            if (balanceTimerRef.current !== null)
                window.clearTimeout(balanceTimerRef.current);
            if (whisperTimerRef.current !== null)
                window.clearTimeout(whisperTimerRef.current);
            if (workTimerRef.current !== null)
                window.clearTimeout(workTimerRef.current);
        }, []);
        /** 重置余额气泡的停留计时；重复触发先清旧定时器，否则旧的会提前收起。 */
        const armBalanceTimeout = () => {
            if (balanceTimerRef.current !== null)
                window.clearTimeout(balanceTimerRef.current);
            balanceTimerRef.current = window.setTimeout(() => setBalanceOn(false), BUBBLE_DURATION_MS);
        };
        const showBalance = () => {
            setBalancePage(0); // 新一轮查询从第一页开始。
            setBalanceOn(true);
            armBalanceTimeout();
        };
        const cycleBalance = () => {
            const pages = balancePageCount(input.balance);
            setBalancePage((page) => (page + 1) % pages);
            // 重新计时：第 8 秒点开才剩 2 秒，看不清下一页。
            armBalanceTimeout();
        };
        /** 推进说话气泡的收起计划，并按新计划重排计时器。 */
        const applyWhisperHold = (event) => {
            const next = reduceBubbleHold(whisperHoldRef.current, event);
            if (next === whisperHoldRef.current)
                return; // 同引用 = 无事发生，别白白重排计时器
            whisperHoldRef.current = next;
            setWhisperOn(next.on);
            if (whisperTimerRef.current !== null)
                window.clearTimeout(whisperTimerRef.current);
            whisperTimerRef.current = null;
            if (next.delayMs === null)
                return;
            whisperTimerRef.current = window.setTimeout(() => {
                whisperTimerRef.current = null;
                applyWhisperHold({ kind: 'hide' });
            }, next.delayMs);
        };
        // 语音报开始/结束时推进收起计划：合成慢的时候气泡得挂住，播完再收。
        // 只认文本相同的那一句——同一页面上的其他宠物共用这份模块单例状态。
        useEffect(() => subscribeVoiceUtterance((event) => {
            if (event.text !== whisperTextRef.current)
                return;
            applyWhisperHold(utteranceToHold(event));
        }), 
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 订阅只建一次：收起计划全部经 ref 现读，重订阅只会漏事件
        []);
        const showWhisper = (text, parts, duration) => {
            if (duration === 0)
                return; // 只联动动画、不改气泡时走这里。
            setWhisperText(text);
            whisperTextRef.current = text;
            setWhisperImage(parts.image);
            setWhisperUrl(parts.url);
            applyWhisperHold({ durationMs: duration ?? BUBBLE_DURATION_MS, kind: 'show' });
        };
        const clearWhisper = () => {
            whisperTextRef.current = null;
            setWhisperText(null);
            setWhisperImage(undefined);
            applyWhisperHold({ kind: 'clear' });
        };
        const lightWork = (terminal) => {
            setWorkOn(true);
            if (workTimerRef.current !== null)
                window.clearTimeout(workTimerRef.current);
            // 非终态常驻，不设自动收起。
            workTimerRef.current = terminal ? window.setTimeout(() => setWorkOn(false), BUBBLE_DURATION_MS) : null;
        };
        const hideWork = () => {
            if (workTimerRef.current !== null)
                window.clearTimeout(workTimerRef.current);
            workTimerRef.current = null;
            setWorkOn(false);
        };
        const resetWork = () => {
            hideWork();
            setWorkText(null);
        };
        const showTodo = () => setTodoOn(true);
        const hideTodo = () => setTodoOn(false);
        const toggleTodo = () => setTodoOn((on) => !on);
        const node = () => {
            const slot = decideBubbleSlot({
                todoOn,
                workTerminal: input.workTerminal,
                workOn,
                workText,
                workStatusEnabled: input.workStatusEnabled,
                whisperOn,
                whisperText,
                balanceOn,
                balanceAvailable: input.balance !== null,
                balanceEnabled: input.balanceEnabled,
                balanceManual: input.balanceManual,
            });
            if (slot === 'todo')
                return h(TodoBubble, { on: todoOn, onClose: hideTodo });
            if (slot === 'balance') {
                return input.balance === null
                    ? null
                    : h(BalanceBubble, { state: input.balance, on: balanceOn, index: balancePage, onCycle: cycleBalance });
            }
            if (slot === 'whisper') {
                return whisperText === null
                    ? null
                    : h(WhisperBubble, {
                        text: whisperText,
                        image: whisperImage,
                        url: whisperUrl,
                        assetRoot: input.assetRoot,
                        on: whisperOn,
                        voiceState,
                    });
            }
            // 终态与非终态共用同一个组件，差别只在停留时长与优先级。
            if (slot === 'work' || slot === 'work-terminal') {
                if (workText === null)
                    return null;
                const sessionId = input.workSessionId ?? '';
                const onFocus = input.onFocusSession;
                // 拿不到会话就别做成可点：点下去没有任何去处，比不可点更糟。
                const onClick = sessionId !== '' && onFocus !== undefined ? () => onFocus(sessionId) : undefined;
                return h(WhisperBubble, {
                    text: workText,
                    on: workOn,
                    ...(onClick === undefined ? {} : { onClick }),
                });
            }
            return null;
        };
        return {
            clearWhisper,
            cycleBalance,
            hideTodo,
            hideWork,
            lightWork,
            node,
            resetWork,
            showBalance,
            showTodo,
            showWhisper,
            toggleTodo,
            updateWorkText: setWorkText,
        };
    };
}
