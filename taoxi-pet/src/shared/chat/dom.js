/**
 * 对话弹窗的 DOM 装配：输入框、上传/截屏/按住说话三枚按钮、待发送图片缩略图、提示行与错误行。
 * 只建元素并把能力接上，不发送、不定位、不管关闭；录音的状态机在 chat/hear-control。
 * @module taoxi-pet/src/shared/chat/dom
 */
import { encodeImageFile } from './encode.ts';
import { createHearControl } from './hear-control.ts';
import { IMAGE_ACCEPT, firstImageFromClipboard, isImageFile } from './image-pick.ts';
import { cameraIcon, micIcon, pictureIcon } from './icons.ts';
import { CHAT_H_PAD, CHAT_MAX_W, CHAT_MIN_W } from './styles.ts';
/** 提示自动收起的时间（ms）。 */
const HINT_MS = 2200;
/** 造一枚图标按钮（图标 + 无障碍标签）。 */
function iconButton(title, icon) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'taoxi-pet-chat-btn';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.appendChild(icon);
    return btn;
}
/** 输入框宽度随文本自适应：宽度按测量值，封顶后由高度接住折行。 */
function enableAutoResize(input, root) {
    let measureCtx = null;
    const resize = () => {
        const ctx = measureCtx ?? (measureCtx = document.createElement('canvas').getContext('2d'));
        ctx.font = getComputedStyle(input).font; // 每次取当前计算样式（挂载前后都准）
        const textW = ctx.measureText(input.value || ' ').width;
        const w = Math.max(CHAT_MIN_W, Math.min(Math.ceil(textW + CHAT_H_PAD), CHAT_MAX_W));
        root.style.width = w + 'px'; // 根宽度跟随 → 夹回仍按实际宽
        input.style.height = 'auto';
        input.style.height = Math.max(input.scrollHeight, 22) + 'px';
    };
    input.addEventListener('input', resize);
    return resize;
}
/**
 * 建好弹窗的全部元素并挂到 `document.body` 下。
 *
 * @param opts - 可选的截屏实现（不传时按钮只给"当前环境不支持"的提示）与识别地址
 *   （录不了时按住说话的按钮照样在，点它给一句原因）。
 * @returns 元素引用与行为（清理附件、临时提示、自适应、释放计时器）。
 */
export function createChatDom(opts = {}) {
    const root = document.createElement('div');
    root.className = 'taoxi-pet-chat';
    const input = document.createElement('textarea');
    input.className = 'taoxi-pet-chat-input';
    input.placeholder = '说点什么…';
    input.maxLength = 2000;
    input.rows = 1;
    const err = document.createElement('div');
    err.className = 'taoxi-pet-chat-err';
    err.style.display = 'none';
    const hint = document.createElement('div');
    hint.className = 'taoxi-pet-chat-hint';
    let hintTimer = 0;
    /** 常驻提示：录音与识别期间一直显示，由调用点自己收。 */
    const showHint = (text) => {
        window.clearTimeout(hintTimer);
        hint.textContent = text;
        hint.style.display = 'block';
    };
    const hideHint = () => {
        window.clearTimeout(hintTimer);
        hint.style.display = 'none';
    };
    const flash = (text) => {
        showHint(text);
        hintTimer = window.setTimeout(hideHint, HINT_MS);
    };
    const pickBtn = iconButton('上传图片', pictureIcon());
    const shotBtn = iconButton('截取当前屏幕', cameraIcon());
    const hearUrl = typeof opts.hearUrl === 'string' ? opts.hearUrl : '';
    const micBtn = iconButton('按住说话', micIcon());
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = IMAGE_ACCEPT;
    fileInput.style.display = 'none';
    const attach = document.createElement('div');
    attach.className = 'taoxi-pet-chat-attach';
    const thumb = document.createElement('img');
    thumb.className = 'taoxi-pet-chat-thumb';
    thumb.alt = '已选图片';
    const attachX = document.createElement('button');
    attachX.type = 'button';
    attachX.className = 'taoxi-pet-chat-attach-x';
    attachX.textContent = '✕';
    attachX.title = '移除图片';
    attachX.setAttribute('aria-label', '移除图片');
    attach.append(thumb, attachX);
    const actions = document.createElement('div');
    actions.className = 'taoxi-pet-chat-actions';
    actions.append(pickBtn, shotBtn, micBtn, fileInput, attach);
    root.append(input, actions, hint, err);
    document.body.appendChild(root);
    const resizeInput = enableAutoResize(input, root);
    let attachment;
    let encoding = false;
    let capturing = false;
    const clearAttach = () => {
        attachment = undefined;
        attach.dataset.on = '0';
        thumb.removeAttribute('src');
        fileInput.value = '';
    };
    /** 把编码结果挂上去：上传与截屏两条路共用这一处落点。 */
    const applyEncoded = (encoded) => {
        if (!root.isConnected)
            return false; // 编码完成前弹窗已关
        attachment = { mediaType: encoded.mediaType, data: encoded.base64 };
        thumb.src = encoded.previewUrl;
        attach.dataset.on = '1';
        return true;
    };
    const setImageFile = async (file) => {
        if (!isImageFile(file)) {
            flash('只支持 PNG / JPEG / WebP / GIF');
            return false;
        }
        encoding = true;
        pickBtn.disabled = true;
        try {
            return applyEncoded(await encodeImageFile(file));
        }
        catch (e) {
            flash('读图失败：' + (e instanceof Error ? e.message : String(e)));
            return false;
        }
        finally {
            encoding = false;
            pickBtn.disabled = false;
        }
    };
    pickBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (file)
            void setImageFile(file);
    });
    attachX.addEventListener('click', clearAttach);
    // 粘贴图片：截图工具通常先把图放剪贴板，Ctrl+V 比"存盘再选文件"少两步。
    // 挂在根元素上而不是输入框：焦点可能停在 ✕ / 按钮上，事件照样冒泡到这里；纯文本不拦截。
    root.addEventListener('paste', (e) => {
        const file = firstImageFromClipboard(e.clipboardData);
        if (!file)
            return;
        e.preventDefault();
        void setImageFile(file);
    });
    // 截屏：有实现就抓一帧（流在实现里立刻停掉，不留长连接）；没有就说明当前环境不支持
    if (opts.capture) {
        const capture = opts.capture;
        shotBtn.addEventListener('click', () => {
            if (capturing)
                return;
            capturing = true;
            shotBtn.disabled = true;
            void capture()
                .then((encoded) => applyEncoded(encoded))
                .catch((e) => flash('截屏失败：' + (e instanceof Error ? e.message : String(e))))
                .finally(() => {
                capturing = false;
                shotBtn.disabled = false;
            });
        });
    }
    else {
        shotBtn.addEventListener('click', () => flash('当前环境不支持截屏，先用上传试试'));
    }
    // 按住说话：状态机、录音与结果落点都在 chat/hear-control，这里只把元素与提示行交过去。
    const hear = createHearControl({
        micBtn,
        input,
        hint: { show: showHint, hide: hideHint, flash },
        resizeInput,
        hearUrl,
    });
    resizeInput(); // 以占位符为初始宽度
    return {
        root,
        input,
        err,
        shotBtn,
        resizeInput,
        clearAttach,
        setImageFile,
        setEncoded: applyEncoded,
        getAttachment: () => attachment,
        isEncoding: () => encoding || capturing,
        flash,
        startHear: hear.start,
        stopHear: hear.stop,
        isHearing: hear.isHearing,
        dispose: () => {
            window.clearTimeout(hintTimer);
            hear.dispose();
        },
    };
}
