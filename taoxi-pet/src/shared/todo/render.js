/**
 * 待办面板的 DOM 骨架与清单渲染：只拼元素、绑事件，不取数、不定位、不关弹窗。
 *
 * 删除做成两步（先变成「确认」，2.5 秒后自动复原）：清单没有撤销，误点一次就没了太容易。
 * @module taoxi-pet/src/shared/todo/render
 */
import { createDuePicker } from './due-picker.ts';
import { metaLabel, todoUrgency } from './format.ts';
/** 删除按钮的二次确认窗口（ms）：超时自动复原，避免「确认」态一直挂着。 */
const DELETE_ARM_MS = 2500;
/** 空态文案：加载中会临时替换它，重渲染时再写回来。 */
const EMPTY_TEXT = '还没有待办。记一件要做的事，到点我会提醒你～';
/** 清单最多露出几行，其余靠滚动。 */
const LIST_ROWS = 2;
/** 造一个带 class 的元素，避免每处都写 createElement + className。 */
function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
/** 造一个可折叠区：高度靠 grid-template-rows 在 0fr 与 1fr 之间过渡，内容高度是 auto 也能动画。 */
function fold(className, children) {
    const outer = element('div', 'taoxi-pet-todo-fold ' + className);
    const clip = element('div', 'taoxi-pet-todo-foldClip');
    clip.append(...children);
    outer.appendChild(clip);
    return outer;
}
/**
 * 造面板骨架（尚未挂进文档）。
 *
 * @returns 面板需要的全部元素引用。
 */
export function createTodoPanelParts() {
    const root = element('div', 'taoxi-pet-todo');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '待办事项');
    const head = element('div', 'taoxi-pet-todo-head');
    const title = element('span', 'taoxi-pet-todo-title', '待办事项');
    const count = element('span', 'taoxi-pet-todo-count', '0 项未完成');
    count.setAttribute('aria-live', 'polite');
    const closeButton = element('button', 'taoxi-pet-todo-close', '✕');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', '关闭待办面板');
    head.append(title, count, closeButton);
    const form = element('form', 'taoxi-pet-todo-form');
    const input = element('input', 'taoxi-pet-todo-input');
    input.type = 'text';
    input.maxLength = 200;
    input.placeholder = '记一件要做的事…';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', '待办内容');
    const row = element('div', 'taoxi-pet-todo-row');
    const duePicker = createDuePicker({ onOpenChange: (open) => root.classList.toggle('is-picking', open) });
    const addButton = element('button', 'taoxi-pet-todo-add', '添加');
    addButton.type = 'submit';
    row.append(duePicker.el, addButton);
    form.append(input, row);
    const error = element('div', 'taoxi-pet-todo-err');
    error.hidden = true;
    const empty = element('div', 'taoxi-pet-todo-empty', EMPTY_TEXT);
    empty.hidden = true;
    const list = element('ul', 'taoxi-pet-todo-list');
    const hint = element('div', 'taoxi-pet-todo-hint', '离到期越近，我会提醒得越勤快～');
    // 下半区两块内容轮流出现：清单态与日历态各是一个折叠区，展开收起走同一条过渡。
    // 面板高度因此跟着内容走（不留空白），切换时也是滑过去而不是硬跳。
    const lower = element('div', 'taoxi-pet-todo-lower');
    lower.append(fold('is-cal', [duePicker.calendar]), fold('is-list', [error, empty, list, hint]));
    root.append(head, form, lower);
    return { root, form, input, duePicker, addButton, list, empty, count, closeButton, error };
}
/**
 * 把清单压到「两行」的高度，多出来的部分靠清单自己滚动。
 *
 * 行高随正文折行变化，写不成 CSS 常量，所以量一次首行再乘二；量不到（未挂载）就不设上限，
 * 免得把清单压成 0 高。
 *
 * @param list - 清单容器。
 */
function capListHeight(list) {
    const first = list.firstElementChild;
    if (first === null) {
        list.style.maxHeight = '';
        return;
    }
    const rowHeight = first.getBoundingClientRect().height;
    if (rowHeight <= 0)
        return;
    // 清单自带内边距，算进高度里才不会被截掉最后一行的一半。
    const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
    list.style.maxHeight = rowHeight * LIST_ROWS + pad * 2 + 'px';
}
/**
 * 渲染一整张清单。
 *
 * @param parts - 面板元素。
 * @param todos - 已排序的待办。
 * @param handlers - 勾选与删除的回调。
 * @param now - 当前时刻，用来生成「还剩多久」。
 */
export function renderTodoList(parts, todos, handlers, now) {
    parts.list.textContent = '';
    const pending = todos.filter((todo) => !todo.done).length;
    parts.count.textContent = `${pending} 项未完成`;
    parts.empty.textContent = EMPTY_TEXT;
    parts.empty.hidden = todos.length > 0;
    for (const todo of todos)
        parts.list.appendChild(renderItem(todo, handlers, now));
    capListHeight(parts.list);
}
/** 渲染一条；未完成项带紧迫度，已完成项划线。 */
function renderItem(todo, handlers, now) {
    const item = element('li', 'taoxi-pet-todo-item' + (todo.done ? ' is-done' : ''));
    if (!todo.done)
        item.dataset.urgency = todoUrgency(todo.dueAt, now);
    const check = element('input', 'taoxi-pet-todo-check');
    check.type = 'checkbox';
    check.checked = todo.done;
    check.setAttribute('aria-label', (todo.done ? '标记未完成：' : '标记完成：') + todo.text);
    check.addEventListener('change', () => handlers.onToggle(todo, check.checked));
    const main = element('div', 'taoxi-pet-todo-main');
    const text = element('div', 'taoxi-pet-todo-text', todo.text);
    const meta = element('div', 'taoxi-pet-todo-meta', metaLabel(todo, now));
    main.append(text, meta);
    const remove = element('button', 'taoxi-pet-todo-del', '✕');
    remove.type = 'button';
    remove.setAttribute('aria-label', '删除：' + todo.text);
    remove.addEventListener('click', () => {
        // 第一次点击只进入确认态；再点一次才真的删。
        if (remove.dataset.armed !== '1') {
            remove.dataset.armed = '1';
            remove.classList.add('is-armed');
            remove.textContent = '确认';
            window.setTimeout(() => {
                // 面板已关闭 / 已重渲染时元素不再在文档里：静默复原即可。
                if (!remove.isConnected)
                    return;
                delete remove.dataset.armed;
                remove.classList.remove('is-armed');
                remove.textContent = '✕';
            }, DELETE_ARM_MS);
            return;
        }
        handlers.onDelete(todo);
    });
    item.append(check, main, remove);
    return item;
}
/**
 * 显示 / 清除错误行。
 *
 * @param parts - 面板元素。
 * @param message - 错误文案；null 表示清除。
 */
export function setTodoError(parts, message) {
    parts.error.hidden = message === null;
    parts.error.textContent = message ?? '';
}
/**
 * 切换忙碌态：请求在途时禁掉输入与按钮，避免连点建出两条。
 *
 * @param parts - 面板元素。
 * @param busy - 是否请求在途。
 */
export function setTodoBusy(parts, busy) {
    parts.input.disabled = busy;
    parts.duePicker.el.disabled = busy;
    parts.addButton.disabled = busy;
}
