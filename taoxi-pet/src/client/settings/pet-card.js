import { INPUT_CLASS, makeUiKit } from './ui.ts';
import { makePetAvatarCell, makePetIdentityFields, makePetPositionFields } from './pet-card-parts.ts';
/**
 * 造宠物配置卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makePetCard(rt) {
    const { h, t } = rt;
    const { tip, q, field, toggleCell } = makeUiKit({ h, t });
    // 部件工厂在装配时各调一次：组件类型跨渲染稳定，卡片重渲染不会重建它们。
    const AvatarCell = makePetAvatarCell(rt);
    const IdentityFields = makePetIdentityFields(rt);
    const PositionFields = makePetPositionFields(rt);
    return function PetCard(props) {
        const { pet, busy, msg } = props;
        if (pet === null)
            return h('p', { className: 'taoxi-pet-cfg__note', children: t('emptyPets') });
        return h('div', {
            className: 'taoxi-pet-cfg__card',
            children: [
                h('div', {
                    className: 'taoxi-pet-cfg__cardHead',
                    children: [
                        h('span', { key: 't', className: 'taoxi-pet-cfg__cardTitle', children: t('petCardTitle') }),
                        q(t('petCardHint')),
                        // 右侧动作组：auto margin 挂在这层 wrapper 上，保存结果出现 / 消失时按钮位置不会跳。
                        h('div', {
                            key: 'acts',
                            style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' },
                            children: [
                                // 保存结果就近反馈（与页面底部同一份 msg 状态），否则在卡片上点保存看不到结果。
                                msg.text
                                    ? h('span', {
                                        key: 'msg',
                                        className: 'taoxi-pet-cfg__msg' + (msg.kind === 'err' ? ' is-err' : ''),
                                        children: msg.text,
                                    })
                                    : null,
                                // 就近保存：宠物这一块改完就地存盘，不必滚到底部的「保存」；悬浮按钮即出快捷键气泡。
                                h('button', {
                                    key: 'sv',
                                    type: 'button',
                                    onClick: props.onSave,
                                    disabled: busy,
                                    className: 'taoxi-pet-cfg__btn is-primary is-sm',
                                    ...tip(t('saveHotkey')),
                                    children: t('save'),
                                }),
                                h('button', {
                                    key: 'rm',
                                    type: 'button',
                                    onClick: props.onRemove,
                                    disabled: busy,
                                    className: 'taoxi-pet-cfg__btn is-danger is-sm',
                                    children: t('remove'),
                                }),
                            ],
                        }),
                    ],
                }),
                // 顶部一行：头像作左列，右侧是 2×2 的输入网格。
                h('div', {
                    className: 'taoxi-pet-cfg__topRow',
                    children: [
                        h(AvatarCell, {
                            avatarSrc: props.avatarSrc,
                            avatarBusy: props.avatarBusy,
                            busy,
                            onAvatar: props.onAvatar,
                        }),
                        h(IdentityFields, { pet, busy, onChange: props.onChange }),
                    ],
                }),
                h(PositionFields, { pet, busy, onChange: props.onChange }),
                h('div', {
                    className: 'taoxi-pet-cfg__grid4',
                    children: [
                        toggleCell('balanceEnabled', !!pet.balanceEnabled, busy, (v) => props.onChange({ balanceEnabled: v })),
                        toggleCell('whisperEnabled', !!pet.whisperEnabled, busy, (v) => props.onChange({ whisperEnabled: v })),
                        toggleCell('workStatusEnabled', !!pet.workStatusEnabled, busy, (v) => props.onChange({ workStatusEnabled: v })),
                        toggleCell('fixedEnabled', !!pet.fixedEnabled, busy, (v) => props.onChange({ fixedEnabled: v })),
                    ],
                }),
                // 人设（可选，实例级）：写在这只宠物上的 whisperPrompt，空 = 跟随所属条目的人设。
                // 只存储与回显，不在这里拼 system；拼装（名字声明 + 时间背景）在宿主半侧。
                // 占位符直接用条目人设正文，让「跟随的是什么」可见；人设没有长度上限，右下角只显示字数。
                field(t('personaLabel'), h('div', {
                    className: 'taoxi-pet-cfg__persona',
                    children: [
                        h('textarea', {
                            className: INPUT_CLASS + ' taoxi-pet-cfg__area',
                            rows: 3,
                            value: String(pet.whisperPrompt ?? ''),
                            disabled: busy,
                            placeholder: props.entryPrompt,
                            onChange: (e) => props.onChange({ whisperPrompt: e.target.value }),
                        }),
                        h('span', {
                            className: 'taoxi-pet-cfg__count',
                            children: t('personaCount').replace('{n}', String(String(pet.whisperPrompt ?? '').length)),
                        }),
                    ],
                }), t('personaHint')),
            ],
        });
    };
}
