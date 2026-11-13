/**
 * 造浮层：搜索框 + 行清单或三态提示。
 *
 * @param view - 浮层视图数据。
 * @returns 浮层根节点。
 */
export function buildModelPanel(view) {
    const { h, t } = view;
    const emptyHint = view.catalog !== null && view.catalog.length === 0
        ? t('modelNoModels')
        : view.rows.length === 0
            ? t('modelEmpty')
            : '';
    return h('div', {
        ref: view.panelRef,
        className: 'taoxi-pet-mp__panel',
        role: 'menu',
        'aria-label': view.label,
        style: {
            left: view.pos.left + 'px',
            top: view.pos.top === undefined ? undefined : view.pos.top + 'px',
            bottom: view.pos.bottom === undefined ? undefined : view.pos.bottom + 'px',
            width: view.pos.width + 'px',
            maxHeight: view.pos.maxHeight + 'px',
        },
        children: [
            searchNode(view),
            view.catalog === null
                ? statusNode(h, 'loading', view.failed ? t('modelCatalogFailed') : t('modelLoading'), false)
                : emptyHint !== ''
                    ? statusNode(h, 'empty', emptyHint, true)
                    : h('div', {
                        key: 'list',
                        className: 'taoxi-pet-mp__list',
                        role: 'group',
                        children: view.rows.map((row, index) => rowNode(view, row, index)),
                    }),
        ],
    });
}
/** 三态提示行：加载中 / 失败 / 空结果。 */
function statusNode(h, key, text, live) {
    return h('div', {
        key,
        className: 'taoxi-pet-mp__status',
        role: live ? 'status' : undefined,
        children: text,
    });
}
/** 搜索框：↑↓ 走行、Enter 选中，Esc 由浮层级的 document 监听处理。 */
function searchNode(view) {
    const { h, t } = view;
    return h('input', {
        key: 'search',
        type: 'text',
        className: 'taoxi-pet-mp__search',
        role: 'searchbox',
        placeholder: t('modelSearch'),
        'aria-label': t('modelSearch'),
        value: view.query,
        disabled: view.disabled,
        onChange: (event) => view.onQueryChange(event.target.value),
        onKeyDown: view.onKeyDown,
    });
}
/** 一行：分组头、提示行、模型（可选、可高亮）。 */
function rowNode(view, row, index) {
    const { h, t } = view;
    if (row.kind === 'group') {
        return h('div', { key: row.key, className: 'taoxi-pet-mp__group', children: row.name });
    }
    if (row.kind === 'none') {
        return h('div', { key: row.key, className: 'taoxi-pet-mp__status', children: t('modelNone') });
    }
    const checked = row.kind === 'follow'
        ? view.value.provider === ''
        : view.value.provider === row.provider && view.value.model === row.model.id;
    return h('button', {
        key: row.key,
        type: 'button',
        role: 'menuitemradio',
        'aria-checked': checked,
        'data-row': index,
        className: 'taoxi-pet-mp__item' + (index === view.active ? ' is-active' : ''),
        disabled: view.disabled,
        onClick: () => view.onPick(row),
        onMouseMove: () => view.onHover(index),
        children: [
            h('span', {
                key: 'n',
                className: 'taoxi-pet-mp__name',
                children: row.kind === 'follow' ? t('modelFollow') : row.model.name,
            }),
            h('span', { key: 'c', className: 'taoxi-pet-mp__check', children: checked ? '✓' : '' }),
        ],
    });
}
