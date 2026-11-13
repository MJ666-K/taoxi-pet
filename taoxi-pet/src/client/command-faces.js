/**
 * 给宿主命令的「/」菜单行补上标题与图标。
 * @param commandUi - commandUi 服务实例。
 * @param faces - 命令名（不带前导斜杠）到补充面孔的映射。
 * @returns 还原原方法的清理函数。
 */
export function installCommandFaces(commandUi, faces) {
    const original = commandUi.candidates;
    if (typeof original !== 'function') {
        console.warn('[taoxi-pet] 命令图标不可用：commandUi.candidates 缺失（命令本身仍可用，只是没有图标）');
        return () => { };
    }
    const patched = async (session, req) => {
        const rows = await original.call(commandUi, session, req);
        try {
            if (!Array.isArray(rows))
                return rows;
            return rows.map((raw) => {
                if (raw === null || typeof raw !== 'object')
                    return raw;
                const row = raw;
                const face = faces.get(typeof row.name === 'string' ? row.name : '');
                // DSH 自己已经给了图标时原样放行，不覆盖。
                if (face === undefined || row.icon !== undefined)
                    return row;
                return { ...row, label: face.label(), icon: face.icon };
            });
        }
        catch (error) {
            console.warn('[taoxi-pet] 命令图标补丁异常，本次退回原始菜单行：' + (error instanceof Error ? error.message : String(error)));
            return rows;
        }
    };
    commandUi.candidates = patched;
    return () => {
        // 只还原自己装的那一份：后来者若又包了一层，别把它的包装抹掉。
        if (commandUi.candidates === patched)
            commandUi.candidates = original;
    };
}
