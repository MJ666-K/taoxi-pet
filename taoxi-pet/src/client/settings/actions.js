import { makeUiKit } from './ui.ts';
/**
 * 造操作区。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 操作区组件。
 */
export function makeActions(rt) {
    const { h, t } = rt;
    const { tip, q } = makeUiKit({ h, t });
    return function Actions(props) {
        const { busy, msg, permMsg } = props;
        return h('div', {
            className: 'taoxi-pet-cfg__actions',
            children: [
                h('button', {
                    type: 'button',
                    disabled: busy,
                    onClick: props.onSave,
                    className: 'taoxi-pet-cfg__btn is-primary',
                    // 悬浮按钮即出快捷键气泡。
                    ...tip(t('saveHotkey')),
                    children: t('save'),
                }),
                h('button', {
                    type: 'button',
                    disabled: busy,
                    onClick: props.onSync,
                    className: 'taoxi-pet-cfg__btn',
                    children: t('sync'),
                }),
                h('button', {
                    type: 'button',
                    onClick: props.onTestNotification,
                    className: 'taoxi-pet-cfg__btn',
                    children: t('notifyTest'),
                }),
                q(t('syncHint')),
                // 两个反馈各归各的：msg 是保存 / 同步结果，permMsg 是测试通知结果。
                msg.text
                    ? h('span', {
                        className: 'taoxi-pet-cfg__msg' + (msg.kind === 'err' ? ' is-err' : ''),
                        children: msg.text,
                    })
                    : null,
                permMsg.text
                    ? h('span', {
                        className: 'taoxi-pet-cfg__msg' + (permMsg.kind === 'err' ? ' is-err' : ''),
                        children: permMsg.text,
                    })
                    : null,
            ],
        });
    };
}
