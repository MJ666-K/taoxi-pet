/** 正文文案：每个场景一句，参数就地代入。 */
function bodyText(dialog, t, selId) {
    if (dialog.kind === 'remove')
        return t('confirmRemove').replace('{id}', selId);
    if (dialog.kind === 'lastOne')
        return t('atLeastOne');
    if (dialog.kind === 'lastOfKind')
        return t('lastOfKind').replace('{entry}', dialog.entry);
    if (dialog.kind === 'corrupt')
        return t('corruptBody').replace('{path}', dialog.path);
    return t('confirmSync');
}
/** 确认按钮文案：三个可确认场景各一句。 */
function confirmLabel(kind, t) {
    if (kind === 'remove')
        return t('remove');
    if (kind === 'corrupt')
        return t('corruptConfirm');
    return t('sync');
}
/**
 * 造确认弹窗。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 弹窗组件。
 */
export function makeDialog(rt) {
    const { h, t } = rt;
    return function SettingsDialog(props) {
        const { dialog } = props;
        // 只剩一只（main 或某个种类）没有可确认的动作：直接收窄成 null，下面的分支就不用再看 kind。
        const confirmable = dialog.kind === 'lastOne' || dialog.kind === 'lastOfKind' ? null : dialog;
        return h('div', {
            style: {
                position: 'fixed',
                inset: 0,
                zIndex: 2147483647,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.45)',
            },
            onClick: props.onDismiss,
            children: h('div', {
                style: {
                    width: '340px',
                    maxWidth: 'calc(100vw - 40px)',
                    background: 'var(--dsw-alias-bg-layer-1)',
                    border: '1px solid var(--dsw-alias-border-l2)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                },
                onClick: (e) => e.stopPropagation(),
                children: [
                    h('div', {
                        style: { fontSize: '14px', fontWeight: 500, color: 'var(--dsw-alias-label-primary)' },
                        children: t(dialog.kind === 'corrupt' ? 'corruptTitle' : 'confirmTitle'),
                    }),
                    h('div', {
                        style: { fontSize: '13px', lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' },
                        children: bodyText(dialog, t, props.selId),
                    }),
                    h('div', {
                        style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
                        // 只剩一只没有可确认的动作，只给「知道了」；其余都是取消 + 确认双按钮。
                        children: confirmable === null
                            ? [
                                h('button', {
                                    key: 'ok',
                                    type: 'button',
                                    onClick: props.onDismiss,
                                    className: 'taoxi-pet-cfg__btn is-primary',
                                    children: t('ok'),
                                }),
                            ]
                            : [
                                h('button', {
                                    key: 'cancel',
                                    type: 'button',
                                    onClick: props.onDismiss,
                                    className: 'taoxi-pet-cfg__btn',
                                    children: t('cancel'),
                                }),
                                h('button', {
                                    key: 'confirm',
                                    type: 'button',
                                    onClick: props.onConfirm,
                                    className: 'taoxi-pet-cfg__btn ' + (confirmable.kind === 'sync' ? 'is-primary' : 'is-danger'),
                                    children: confirmLabel(confirmable.kind, t),
                                }),
                            ],
                    }),
                ],
            }),
        });
    };
}
