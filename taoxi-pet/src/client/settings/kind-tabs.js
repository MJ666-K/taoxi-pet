/**
 * 造种类标签条。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 种类标签条组件。
 */
export function makeKindTabs(rt) {
    const { h, t } = rt;
    return function KindTabs(props) {
        return h('div', {
            className: 'taoxi-pet-cfg__kinds',
            children: [
                h('span', { key: 'label', className: 'taoxi-pet-cfg__tabsLabel', children: t('kindLabel') }),
                ...props.kinds.map((item) => h('button', {
                    key: item.entry,
                    type: 'button',
                    disabled: props.busy,
                    onClick: () => props.onSelect(item.entry),
                    className: 'taoxi-pet-cfg__tab' + (item.entry === props.kind ? ' is-active' : ''),
                    // 主条目固定显示「内置」；文件宠物直接显示目录前缀（与素材根一致）。
                    children: (item.kind === 'main' ? t('kindMain') : item.entry) + ' (' + item.count + ')',
                })),
            ],
        });
    };
}
