import { findPetInstance, readAllConfig } from '../config.ts';
/**
 * 造残留历史的查询与清理。
 *
 * @param deps - 配置路径、记忆读写与串行队列。
 * @returns 查询（只读）与清理（锁内读改写）。
 */
export function createMemoryOrphans(deps) {
    const { configPaths, readMemory, writeMemory, withLock } = deps;
    /** 读出配置里已不存在的宠物分桶；只看条数与最后时间，不带正文。 */
    const orphanHistory = async () => {
        const cfg = readAllConfig(configPaths);
        const mem = await readMemory();
        const out = [];
        for (const [entry, byPet] of Object.entries(mem)) {
            if (!byPet || typeof byPet !== 'object')
                continue;
            for (const [petId, leaf] of Object.entries(byPet)) {
                if (findPetInstance(cfg, petId))
                    continue;
                const list = Array.isArray(leaf?.messages) ? leaf.messages : [];
                out.push({ entry, petId, messages: list.length, lastTs: Number(list[list.length - 1]?.ts ?? 0) });
            }
        }
        return out;
    };
    /** 清掉所有残留分桶；空条目一并摘除。 */
    const deleteOrphans = async () => withLock(async () => {
        const cfg = readAllConfig(configPaths);
        const mem = await readMemory();
        let pets = 0;
        let messages = 0;
        for (const [entry, byPet] of Object.entries(mem)) {
            if (!byPet || typeof byPet !== 'object')
                continue;
            for (const [petId, leaf] of Object.entries(byPet)) {
                if (findPetInstance(cfg, petId))
                    continue;
                messages += Array.isArray(leaf?.messages) ? leaf.messages.length : 0;
                pets += 1;
                delete byPet[petId];
            }
            if (Object.keys(byPet).length === 0)
                delete mem[entry];
        }
        if (pets > 0)
            await writeMemory(mem);
        deps.log.info(`[taoxi-pet] 清理已删宠物的历史 pets=${pets}，messages=${messages}`);
        return { ok: true, pets, messages };
    });
    return { orphanHistory, deleteOrphans };
}
