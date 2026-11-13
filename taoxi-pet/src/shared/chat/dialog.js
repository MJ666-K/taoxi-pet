/**
 * 对话输入弹窗的挂载与生命周期：定位、关闭、发送。
 * 两端共用同一份实现；它只经注入的 baseUrl/surface 说话，不读配置、不读写记忆。
 * 回复不经响应回传展示：POST 的响应里也有正文，但本组件不用它——回复统一从 /state 的
 * pets.<id>.say 走气泡展示，onSent 只用来催促调用方取一拍。
 * @module taoxi-pet/src/shared/chat/dialog
 */
import { ROUTE_PATH } from '../constants.ts';
import { createChatDom } from './dom.ts';
import { createCompositionWatch, decideEnter } from './enter.ts';
import { sendChat } from './send.ts';
import { injectChatCss } from './styles.ts';
/** 点弹窗外或按 Esc 关闭；返回解绑函数。 */
function bindDismiss(root, isClosed, onDismiss) {
    const onPointerDown = (e) => {
        if (isClosed() || root.contains(e.target))
            return;
        onDismiss();
    };
    const onKeyDown = (e) => {
        if (e.key === 'Escape')
            onDismiss();
    };
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
        document.removeEventListener('mousedown', onPointerDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
    };
}
/** 回车发送：成功后回调、失败把原因写进 err 行，不伪造回复。 */
function bindSend(binding) {
    let sending = false;
    const doSend = () => {
        if (binding.isClosed() || sending)
            return;
        if (binding.isEncoding()) {
            binding.notify('图片还在处理，稍等一下');
            return;
        }
        const text = binding.input.value.trim();
        if (!text)
            return;
        sending = true;
        binding.input.disabled = true;
        sendChat(binding.url, text, binding.attachment())
            .then((state) => {
            if (state.ok)
                binding.onOk();
            else {
                binding.err.textContent = '对话失败：' + (state.message ?? state.reason);
                binding.err.style.display = 'block';
            }
        })
            .catch((e) => {
            binding.err.textContent = '对话异常：' + String(e && e.message ? e.message : e);
            binding.err.style.display = 'block';
        })
            .finally(() => {
            sending = false;
            binding.input.disabled = false;
            if (!binding.isClosed())
                binding.input.focus();
        });
    };
    // 回车要让开输入法：组合中的回车是上屏键，长按重复的回车只该被吞掉、不该插换行
    const ime = createCompositionWatch();
    binding.input.addEventListener('compositionstart', ime.start);
    binding.input.addEventListener('compositionend', () => ime.end(performance.now()));
    binding.input.addEventListener('keydown', (e) => {
        const action = decideEnter(e, ime, performance.now());
        if (action === 'ignore')
            return;
        e.preventDefault();
        if (action === 'send')
            doSend();
    });
}
/**
 * 由对话地址推导识别地址：两端传进来的都是 `.../chat`，去掉尾段换成 `/voice/hear`。
 *
 * @param baseUrl - 已含挂载前缀的对话地址。
 * @returns 同前缀下的识别地址。
 */
function hearUrlOf(baseUrl) {
    return baseUrl.replace(/\/chat$/, '') + '/voice/hear';
}
/** 挂载一个对话输入弹窗（两端共用；位置为视口坐标，超出 clamp 矩形自动夹回）。
 *  输入框 + 上传/截屏两枚图标按钮 + 图片预览（本轮只有界面与本地预览，编码与发送待接入）。
 *  回车即发送：发送成功后弹窗关闭并调 onSent。Esc 或点弹窗外关闭；生成失败留在弹窗内显式提示。
 *  clamp 由调用方给：桌面传「窗口 ∩ 工作区」，宠物贴边时弹窗照样完整显示、窗口零移动。 */
export function mountChatDialog(opts) {
    injectChatCss();
    const { petId, surface, x, y, onSent, onClose, clamp } = opts;
    const baseUrl = opts.baseUrl ?? ROUTE_PATH + '/chat';
    // `surface` 必填（宿主校验）；这个 URL 只用于 POST 发送——GET 读记忆那条路不需要它
    const withPet = baseUrl + '?pet=' + encodeURIComponent(petId) + '&surface=' + surface;
    const c = clamp && Number.isFinite(clamp.x + clamp.y + clamp.w + clamp.h)
        ? clamp
        : { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
    const dom = createChatDom({ capture: opts.capture, hearUrl: opts.hearUrl ?? hearUrlOf(baseUrl) });
    const { root, input, err } = dom;
    /** 以 (x,y) 落点，超出 clamp 矩形夹回。 */
    const place = () => {
        const r = root.getBoundingClientRect();
        root.style.left = Math.max(c.x + 4, Math.min(x, c.x + c.w - r.width - 4)) + 'px';
        root.style.top = Math.max(c.y + 4, Math.min(y, c.y + c.h - r.height - 4)) + 'px';
    };
    let closed = false;
    let unbindDismiss = () => { };
    const close = () => {
        if (closed)
            return;
        closed = true;
        unbindDismiss();
        dom.dispose();
        dom.clearAttach();
        root.remove();
        if (onClose)
            onClose();
    };
    unbindDismiss = bindDismiss(root, () => closed, close);
    bindSend({
        input,
        err,
        url: withPet,
        isClosed: () => closed,
        onOk: () => {
            close();
            if (onSent)
                onSent();
        },
        attachment: () => dom.getAttachment(),
        isEncoding: () => dom.isEncoding(),
        notify: (text) => dom.flash(text),
    });
    // 截屏按钮的接线在 dom 里（依赖注入的 capture），这里只负责发送与关闭
    dom.resizeInput(); // append 后再量一次（此时样式已生效）
    place();
    if (opts.initialImage)
        void dom.setImageFile(opts.initialImage);
    if (opts.initialEncoded)
        dom.setEncoded(opts.initialEncoded);
    input.focus();
    return {
        el: root,
        close,
        startHear: dom.startHear,
        stopHear: dom.stopHear,
        isHearing: dom.isHearing,
        setEncoded: dom.setEncoded,
        setImageFile: dom.setImageFile,
        flash: dom.flash,
    };
}
