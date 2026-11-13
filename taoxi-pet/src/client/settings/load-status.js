/**
 * 造加载态条。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 状态条组件。
 */
export function makeLoadStatus(rt) {
    const { h, t } = rt;
    return function LoadStatus(props) {
        if (props.loadState === 'ready')
            return null;
        const failed = props.loadState === 'error';
        return h('div', {
            role: failed ? 'alert' : 'status',
            className: 'taoxi-pet-cfg__actions',
            children: [
                h('span', { children: t(failed ? 'loadError' : 'loading') }),
                failed
                    ? h('button', {
                        type: 'button',
                        className: 'taoxi-pet-cfg__btn',
                        onClick: props.onRetry,
                        children: t('retry'),
                    })
                    : null,
            ],
        });
    };
}
