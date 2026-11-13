import { createLlmFacade, createOfflineLlm } from './llm-facade.ts';
/** 独立模式下余额路由报出的未登记服务商 id。 */
export const STANDALONE_PROVIDER = 'standalone';
/**
 * webServer 替身：插件按前缀注册路由，独立模式的 server 再按同一份数组匹配。
 *
 * 端口用 getter 读取：服务先监听、端口确定之后才 apply，构造时取值会固定成 0。
 */
function createWebServer(routes, portOf) {
    return {
        get port() {
            return portOf();
        },
        register(spec) {
            routes.push({ kind: spec.kind, path: spec.path, handler: spec.handler });
            return () => {
                const index = routes.findIndex((route) => route.handler === spec.handler);
                if (index >= 0)
                    routes.splice(index, 1);
            };
        },
    };
}
/**
 * Cordis 的 effect 语义：跑一次注册函数并收集它返回的释放函数。
 * 单项失败只记录并打日志，不让整个插件起不来。
 */
function createEffectRunner(disposers, failures, logger) {
    return (fn) => {
        try {
            const dispose = fn();
            if (typeof dispose === 'function')
                disposers.push(dispose);
            return dispose;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            failures.push(message);
            logger.error(`初始化某项失败（已跳过）：${message}`);
            return undefined;
        }
    };
}
/**
 * Cordis 的 provide / get 语义：先查注册表，再回落到伪 ctx 自身的属性。
 * 独立模式把可选能力直接挂在伪 ctx 上，不回落会把本来就有的能力判成没有。
 */
function createServiceRegistry(services, attrs) {
    return {
        provide(name, value) {
            services.set(name, value);
            return () => {
                if (services.get(name) === value)
                    services.delete(name);
            };
        },
        get(name) {
            const registered = services.get(name);
            if (registered !== undefined)
                return registered;
            return attrs()[name];
        },
    };
}
/**
 * 创建独立模式的伪 ctx。
 * @param options - 端口、日志器与可选的路由收集数组。
 * @returns 伪 ctx、路由列表、初始化失败记录与释放函数。
 */
export function createStandaloneContext(options) {
    const { logger, ai } = options;
    const routes = options.routes ?? [];
    const failures = [];
    /** effect 释放函数，后注册先释放。 */
    const disposers = [];
    /** 通过 provide 挂出去的服务。 */
    const services = new Map();
    let disposed = false;
    const portOf = () => (typeof options.port === 'function' ? options.port() : options.port);
    const webServer = createWebServer(routes, portOf);
    const context = {
        effect: createEffectRunner(disposers, failures, logger),
        ...createServiceRegistry(services, () => context),
        /** 独立模式没有 DSH 会话事件：不订阅，工作状态保持空闲。 */
        on() {
            return () => { };
        },
        logger,
        webServer,
        connection: { authenticatedUrl: options.authenticatedUrl ?? ((baseUrl) => baseUrl) },
        ...(ai
            ? {
                standaloneAi: {
                    isReady: () => ai.isReady(),
                    // 余额走独立模式自己的服务商与密钥：DSH 的 credential store 与账号服务在这里都不在场。
                    balanceAuth: () => ai.balanceAuth(),
                },
            }
            : {}),
        // 托盘退出的能力开关：宿主路由只看这个字段在不在，停机实现由 cli.ts 提供。
        ...(options.shutdown ? { shutdownApp: options.shutdown } : {}),
        commands: { register: () => () => { } },
        agentDefaultModel: {
            currentSelection: () => ai?.currentSelection() ?? { provider: STANDALONE_PROVIDER, model: '' },
        },
        credentials: { resolve: async () => undefined },
        llm: ai ? createLlmFacade(ai) : createOfflineLlm(),
    };
    return {
        ctx: context,
        routes,
        failures,
        async dispose() {
            if (disposed)
                return;
            disposed = true;
            ai?.dispose();
            for (const dispose of disposers.splice(0).reverse()) {
                try {
                    await dispose();
                }
                catch (error) {
                    logger.warn(`释放某项失败：${error instanceof Error ? error.message : String(error)}`);
                }
            }
        },
    };
}
