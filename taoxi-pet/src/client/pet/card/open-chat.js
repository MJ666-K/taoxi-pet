/**
 * 打开对话的隐式入口：拖拽落到宠物上、悬停时按 L、悬停时粘贴一张图。
 * 只在调用方生命周期内注册，卸载时全部摘除；不认为自己是 React 组件，也不碰状态。
 * 菜单项那条入口由调用方直接接线，不在这里。
 * @module taoxi-pet/src/client/pet/card/open-chat
 */
import { isChatHotkey, isTypingTarget } from '../../../shared/chat/hotkey.ts';
import { firstImageFromClipboard } from '../../../shared/chat/image-pick.ts';
import { claimFileDragEnter, claimFileDragOver, claimFileDrop } from '../../file-drop.ts';
/**
 * 注册拖拽、快捷键与粘贴。
 *
 * @param input - 舞台节点、悬停判定与打开动作。
 * @returns 解绑函数，交给调用方的 effect 清理。
 */
export function bindOpenChat(input) {
    const { stage, isHovered, openChat } = input;
    const onKeyDown = (e) => {
        if (!isHovered() || !isChatHotkey(e))
            return;
        e.preventDefault();
        openChat();
    };
    const onPaste = (e) => {
        // 焦点在输入框里就是正常粘贴，抢了会把文字粘丢——那种情况有弹窗自己的处理器
        if (!isHovered() || isTypingTarget(e.target))
            return;
        const file = firstImageFromClipboard(e.clipboardData);
        if (file === undefined)
            return;
        e.preventDefault();
        openChat(file);
    };
    const onDragOver = (e) => {
        if (!claimFileDragOver(e))
            return;
        if (e.dataTransfer)
            e.dataTransfer.dropEffect = 'copy';
    };
    const onDrop = (e) => {
        const file = claimFileDrop(e);
        if (file !== undefined)
            openChat(file);
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('paste', onPaste, true);
    stage?.addEventListener('dragenter', claimFileDragEnter);
    stage?.addEventListener('dragover', onDragOver);
    stage?.addEventListener('drop', onDrop);
    return () => {
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('paste', onPaste, true);
        stage?.removeEventListener('dragenter', claimFileDragEnter);
        stage?.removeEventListener('dragover', onDragOver);
        stage?.removeEventListener('drop', onDrop);
    };
}
