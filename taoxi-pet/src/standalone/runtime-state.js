/**
 * 独立模式运行状态的落盘：把端口、令牌与设置页地址写给本机启动器。
 *
 * 只服务本机启动器，不进入 /health 响应，也不参与路由。
 * 必须始终成立：权限沿用私有 JSON 写入；清理时只删自己写的那一份。
 * @module taoxi-pet/src/standalone/runtime-state
 */
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { writePrivateJson } from './ai-storage.ts';
/**
 * 写入运行状态并返回幂等的清理函数。
 * @param home - DSH_HOME。
 * @param details - 端口、令牌、设置页地址与插件根。
 * @returns 幂等的清理函数。
 * @throws 无法安全写入时抛出。
 */
export function writeStandaloneRuntime(home, details) {
    const directory = join(home, 'taoxi-pet');
    mkdirSync(directory, { recursive: true });
    const file = join(directory, 'standalone-runtime.json');
    try {
        writePrivateJson(file, {
            name: 'taoxi-pet-standalone',
            pid: process.pid,
            startedAt: new Date().toISOString(),
            ...details,
        });
    }
    catch (error) {
        throw new Error('无法安全写入桌宠运行状态，请检查数据目录的访问权限。', { cause: error });
    }
    let released = false;
    // 只删 pid 与令牌都匹配的文件，避免误删另一个实例的状态。
    return () => {
        if (released)
            return;
        released = true;
        try {
            const current = JSON.parse(readFileSync(file, 'utf8'));
            if (current.pid === process.pid && current.token === details.token)
                unlinkSync(file);
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return;
            throw new Error('清理桌宠运行状态失败；请检查数据目录，未删除其他进程的状态。', { cause: error });
        }
    };
}
