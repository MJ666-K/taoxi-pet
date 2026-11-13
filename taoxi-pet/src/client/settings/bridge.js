/** 桥的唯一实例；字段是可变的，写入方各自固定（容器写 current / reload，设置页只读）。 */
export const petBridge = {
    current: [],
    reload: () => { },
    template: undefined,
};
