import { PET_DISPLAYS } from '../../shared/config.ts';
import { SIZE_PERCENT_DEFAULT, SIZE_PERCENT_MIN } from '../../shared/pet-size.ts';
import { INPUT_CLASS, makeUiKit, numberInputProps } from './ui.ts';
import { makeSelect } from './panel/select.ts';
/** 四个角落的固定顺序；文案走 `corner.<corner>`。 */
const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
/**
 * 造头像格：可换时整块就是按钮（悬浮出遮罩、点它开文件框），内置条目只有图。
 *
 * @param rt - 注入的节点工厂与翻译。
 * @returns 头像格组件。
 */
export function makePetAvatarCell(rt) {
    const { h, t } = rt;
    // 说明走页面自己的气泡层（data-tip），不用原生 title：title 会另起一个不可控的浏览器浮框。
    const { tip } = makeUiKit({ h, t });
    /** 头像图：两条分支共用同一份属性。 */
    const image = (src) => h('img', { className: 'taoxi-pet-cfg__avatarImg', src, alt: t('avatarLabel'), loading: 'lazy' });
    return function PetAvatarCell(props) {
        if (props.onAvatar === undefined) {
            return h('div', { className: 'taoxi-pet-cfg__avatarCol', children: image(props.avatarSrc) });
        }
        return h('div', {
            className: 'taoxi-pet-cfg__avatarCol',
            children: h('div', {
                className: 'taoxi-pet-cfg__avatarPick',
                ...tip(t('avatarHint')),
                children: [
                    image(props.avatarSrc),
                    h('span', {
                        key: 'mask',
                        className: 'taoxi-pet-cfg__avatarMask' + (props.avatarBusy ? ' is-busy' : ''),
                        children: props.avatarBusy ? t('avatarUploading') : t('avatarChange'),
                    }),
                    h('input', {
                        key: 'file',
                        className: 'taoxi-pet-cfg__file',
                        type: 'file',
                        accept: 'image/png,image/jpeg,image/webp,image/gif',
                        disabled: props.avatarBusy || props.busy,
                        'aria-label': t('avatarUpload'),
                        onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file !== undefined)
                                props.onAvatar?.(file);
                            e.target.value = '';
                        },
                    }),
                ],
            }),
        });
    };
}
/**
 * 造「名字 / 大小 / 屏幕宽度上限 / 显示位置」四格（2×2）。
 *
 * @param rt - 注入的 react 能力与翻译。
 * @returns 身份字段组件。
 */
export function makePetIdentityFields(rt) {
    const { h, t } = rt;
    const { field } = makeUiKit({ h, t });
    const Select = makeSelect(rt);
    /** 宠物数值输入（大小）；宽度交给栅格。 */
    const sizeInput = (value, disabled, setter) => h('input', numberInputProps(value, setter, { step: '10', min: '120', disabled }));
    /** 百分比输入：默认 20；不设上限（超过 100 只在 size 也够大时才生效）。 */
    const percentInput = (value, disabled, setter) => h('input', numberInputProps(value, setter, { min: String(SIZE_PERCENT_MIN), step: '1', disabled }));
    /** 四格各自成函数：都只读 props，拼在一起才是组件。 */
    const cells = (props) => {
        const { pet, busy, onChange } = props;
        return [
            field(t('nameLabel'), h('input', {
                type: 'text',
                className: INPUT_CLASS,
                value: String(pet.name ?? ''),
                disabled: busy,
                maxLength: 50,
                onChange: (e) => onChange({ name: e.target.value }),
            }), t('nameHint')),
            field(t('sizeLabel'), sizeInput(pet.size, busy, (v) => onChange({ size: v })), t('sizeHint')),
            field(t('sizePercentLabel'), percentInput(pet.sizePercent ?? SIZE_PERCENT_DEFAULT, busy, (v) => onChange({ sizePercent: v })), t('sizePercentHint')),
            field(t('displayLabel'), h(Select, {
                label: t('displayLabel'),
                value: pet.display,
                options: PET_DISPLAYS.map((d) => ({ id: d, label: t('display.' + d) })),
                disabled: busy,
                onChange: (id) => onChange({ display: id }),
            }), t('displayHint')),
        ];
    };
    return function PetIdentityFields(props) {
        return h('div', { className: 'taoxi-pet-cfg__grid2', children: cells(props) });
    };
}
/**
 * 造「角落 / 水平偏移 / 垂直偏移」三格。
 *
 * @param rt - 注入的 react 能力与翻译。
 * @returns 位置字段组件。
 */
export function makePetPositionFields(rt) {
    const { h, t } = rt;
    const { field } = makeUiKit({ h, t });
    const Select = makeSelect(rt);
    /** 偏移量输入：步长 1，不设上下限（可为任意数字）。 */
    const marginInput = (value, disabled, setter) => h('input', numberInputProps(value, setter, { step: '1', min: '', disabled }));
    return function PetPositionFields(props) {
        const { pet, busy, onChange } = props;
        return h('div', {
            className: 'taoxi-pet-cfg__grid3',
            children: [
                field(t('cornerLabel'), h(Select, {
                    label: t('cornerLabel'),
                    value: pet.position.corner,
                    options: CORNERS.map((c) => ({ id: c, label: t('corner.' + c) })),
                    disabled: busy,
                    onChange: (id) => onChange({ position: { corner: id } }),
                }), t('cornerHint')),
                field(t('marginX'), marginInput(pet.position.marginX, busy, (v) => onChange({ position: { marginX: v } })), t('marginXHint')),
                field(t('marginY'), marginInput(pet.position.marginY, busy, (v) => onChange({ position: { marginY: v } })), t('marginYHint')),
            ],
        });
    };
}
