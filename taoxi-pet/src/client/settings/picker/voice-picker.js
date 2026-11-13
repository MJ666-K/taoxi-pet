import { makeSelect } from '../panel/select.ts';
/**
 * 造音色选择器。
 * 依赖只在调用时注入一次：组件类型必须跨渲染稳定，否则浮层状态（打开 / 高亮）每次渲染都会丢。
 *
 * @param rt - 注入的 react 能力；文案由调用方在 options 里给全，不需要翻译。
 * @returns 选择器组件。
 */
export function makeVoicePicker(rt) {
    const { h } = rt;
    const Select = makeSelect(rt);
    return function VoicePicker(props) {
        return h(Select, {
            label: props.label,
            value: props.value,
            options: props.options.map((option) => ({ id: option.id, label: `${option.name}（${option.tag}）` })),
            disabled: props.disabled,
            onChange: props.onChange,
        });
    };
}
