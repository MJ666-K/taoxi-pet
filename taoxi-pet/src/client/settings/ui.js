/** 输入框与下拉框共用的类名。 */
export const INPUT_CLASS = 'taoxi-pet-cfg__inp';
/**
 * 数字输入的统一属性：非受控 + 失焦提交。
 *
 * 受控写法（`value={String(n)}` + `Number(e.target.value)`）在删空时必然把空串变成 0，
 * 用户想「删干净再输」时会被打断；这里让空框是合法中间态，失焦才解析并提交。
 * `key` 跟随值变化：外部改了配置就重挂载刷新，编辑期间 state 不动，所以不会打断输入。
 *
 * @param value - 当前生效值。
 * @param onCommit - 提交新值；只有真的变化时才回调。
 * @param extra - 该输入自己的属性（step / min / max / disabled 等）。
 * @returns 可直接摊给 `<input>` 的属性。
 */
export function numberInputProps(value, onCommit, extra = {}) {
    return {
        ...extra,
        type: 'number',
        className: INPUT_CLASS,
        defaultValue: String(value),
        key: String(value),
        onBlur: (e) => {
            const text = e.target.value.trim();
            const parsed = Number(text);
            // 空串/脏值 = 放弃这次编辑，把显示回退到生效值。
            const next = text !== '' && Number.isFinite(parsed) ? parsed : value;
            e.target.value = String(next);
            if (next !== value)
                onCommit(next);
        },
        onKeyDown: (e) => {
            if (e.key === 'Enter')
                e.currentTarget.blur();
        },
    };
}
/** 等宽字体栈（路径与命令展示用），走系统栈以免多拉一份资源。 */
export const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Courier New", monospace';
/**
 * 造设置页的共用小件。
 *
 * @param rt - 只用到节点工厂 `h` 与翻译 `t`。
 * @returns 各卡片共享的小件集合。
 */
export function makeUiKit(rt) {
    const { h, t } = rt;
    /**
     * 悬浮说明的展开属性。
     *
     * @param text - 说明正文（已翻译）。
     */
    const tip = (text) => ({ 'data-tip': text });
    /** 问号：气泡的圆形触发元素。用 `<i>` 而不是 `<button>`——它只展示说明，点了不该有行为，也不该进 Tab 顺序。 */
    const q = (text) => h('i', { className: 'taoxi-pet-cfg__q', ...tip(text), 'aria-label': text, role: 'img', children: '?' });
    return {
        tip,
        q,
        cardHead: (title, hint) => h('div', {
            className: 'taoxi-pet-cfg__cardHead',
            children: [
                h('span', { key: 't', className: 'taoxi-pet-cfg__cardTitle', children: title }),
                hint ? q(hint) : null,
            ],
        }),
        field: (label, control, hint) => h('div', {
            className: 'taoxi-pet-cfg__field',
            children: [
                h('span', {
                    key: 'l',
                    className: 'taoxi-pet-cfg__flabel',
                    children: hint ? [label, q(hint)] : label,
                }),
                control,
            ],
        }),
        toggleCell: (label, value, disabled, onToggle) => h('div', {
            className: 'taoxi-pet-cfg__toggle',
            children: [
                h('label', {
                    key: 'l',
                    children: [
                        h('input', {
                            key: 'i',
                            type: 'checkbox',
                            checked: value,
                            disabled,
                            onChange: (e) => onToggle(e.target.checked),
                        }),
                        h('span', { key: 't', children: t(label) }),
                    ],
                }),
                q(t(label + 'Hint')),
            ],
        }),
        foldCard: (options) => h('div', {
            className: 'taoxi-pet-cfg__card is-fold' + (options.open ? ' is-open' : ''),
            children: [
                // 整行可点：标题、问号与箭头都在按钮里。问号自己拦掉冒泡，点它只出气泡、不开合。
                h('button', {
                    key: 'head',
                    type: 'button',
                    className: 'taoxi-pet-cfg__foldToggle',
                    'aria-expanded': options.open,
                    'aria-controls': options.id,
                    onClick: options.onToggle,
                    children: [
                        h('span', { key: 't', className: 'taoxi-pet-cfg__cardTitle', children: options.title }),
                        h('span', {
                            key: 'q',
                            className: 'taoxi-pet-cfg__qWrap',
                            onClick: (e) => e.stopPropagation(),
                            children: q(options.hint),
                        }),
                        // 箭头：展开时转 180°，与模型选择器的展开指示一致。
                        h('i', {
                            key: 'c',
                            className: 'taoxi-pet-cfg__chevron' + (options.open ? ' is-open' : ''),
                            'aria-hidden': 'true',
                        }),
                    ],
                }),
                // 裁剪层承担 overflow，正文内层出高度：收起时 0fr 把 padding 一起裁掉，卡片底不留空缝。
                h('div', {
                    key: 'body',
                    id: options.id,
                    className: 'taoxi-pet-cfg__fold',
                    'aria-hidden': options.open ? undefined : 'true',
                    children: h('div', {
                        className: 'taoxi-pet-cfg__foldClip',
                        children: h('div', { className: 'taoxi-pet-cfg__foldBody', children: options.body }),
                    }),
                }),
            ],
        }),
    };
}
