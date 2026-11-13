/**
 * 造宠物标签条。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 标签条组件。
 */
export function makePetTabs(rt) {
    const { h, t } = rt;
    return function PetTabs(props) {
        return h('div', {
            className: 'taoxi-pet-cfg__tabs',
            children: [
                h('span', { key: 'label', className: 'taoxi-pet-cfg__tabsLabel', children: t('petsLabel') }),
                ...props.pets.map((pet) => h('button', {
                    key: pet.id,
                    type: 'button',
                    onClick: () => props.onSelect(pet.id),
                    className: 'taoxi-pet-cfg__tab' + (pet.id === props.selId ? ' is-active' : ''),
                    children: (pet.name || pet.id) +
                        ' (' +
                        pet.size +
                        'px' +
                        (pet.sizePercent === undefined || pet.sizePercent >= 100 ? '' : ' / ' + pet.sizePercent + '%') +
                        ')',
                })),
                h('button', {
                    key: 'add',
                    type: 'button',
                    onClick: props.onAdd,
                    disabled: props.busy,
                    className: 'taoxi-pet-cfg__tab is-ghost',
                    children: '+ ' + t('add'),
                }),
            ],
        });
    };
}
