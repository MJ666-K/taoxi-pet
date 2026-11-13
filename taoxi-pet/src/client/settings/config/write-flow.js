import { persistSettings, syncSettings } from './persist.ts';
import { validateForm } from './validate-form.ts';
/**
 * 造写路径。
 *
 * @param deps - 状态读取与写入回调。
 * @returns 保存 / 请求同步 / 确认派发。
 */
export function createWriteFlow(deps) {
    const { setBusy, setMsg, setDialog, t } = deps;
    const save = async (force = false) => {
        if (deps.busy())
            return;
        const fields = deps.fields();
        const invalid = validateForm({
            pets: fields.pets,
            physics: fields.physics,
            whisperModel: fields.whisperModel,
            chatModel: fields.chatModel,
            chatMemory: fields.chatMemoryRounds,
            chatImageLimit: fields.chatImageLimit,
            font: fields.font,
        });
        if (invalid !== null) {
            setMsg({ kind: 'err', text: t(invalid) });
            return;
        }
        setBusy(true);
        setMsg({ kind: '', text: '' });
        try {
            const result = await persistSettings(fields, deps.packWrites(), force, deps.userFile());
            if (result.kind === 'ok') {
                setMsg({ kind: 'ok', text: t('saved') });
                return;
            }
            if (result.kind === 'corrupt') {
                setDialog({ kind: 'corrupt', path: result.path });
                return;
            }
            // main 已落盘、部分种类没写成功：必须如实说，否则用户会以为整包都没保存。
            if (result.kind === 'partial') {
                setMsg({ kind: 'err', text: t('savePartial').replace('{names}', result.failed.join('、')) });
                return;
            }
            setMsg({ kind: 'err', text: t(result.kind === 'invalid' ? 'saveInvalid' : 'saveError') });
        }
        finally {
            setBusy(false);
        }
    };
    const doSync = async () => {
        setBusy(true);
        setMsg({ kind: '', text: '' });
        try {
            // 同步用户层：POST 把内置默认配置（原文，含注释）整份写入用户配置，响应体同样是成品聚合。
            const merged = await syncSettings();
            if (merged === null) {
                setMsg({ kind: 'err', text: t('syncError') });
                return;
            }
            // 同一份成品既刷新表单也交给容器：编辑列表与渲染列表都由成品派生。
            deps.applyConfig(merged);
            setMsg({ kind: 'ok', text: t('saved') });
        }
        finally {
            setBusy(false);
        }
    };
    return {
        save,
        requestSync: () => setDialog({ kind: 'sync' }),
        confirmDialog: () => {
            const pending = deps.dialog();
            if (pending === null)
                return;
            setDialog(null);
            if (pending.kind === 'remove')
                deps.onRemove();
            else if (pending.kind === 'corrupt')
                void save(true);
            else if (pending.kind === 'sync')
                void doSync();
        },
    };
}
