/**
 * 桌面应用出站请求的访问凭证注入。
 *
 * 只负责给「本机渲染端发起、目标为插件路由」的请求附加令牌；不生成、不校验令牌（校验在宿主路由侧）。
 * 依赖 Electron 的 session 请求拦截与 file:// 渲染页。始终成立：令牌只进请求头，且只对顶层渲染端
 * 指向本机 origin 的插件路由生效，重定向目标不携带。
 * @module taoxi-pet/src/app/desktop-auth
 */

import { realpathSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_SEGMENT } from '../shared/constants.ts';

/** 一次出站请求的最小形态：只声明注入凭证需要读的字段。 */
interface RequestDetails {
  url: string;
  requestHeaders: Record<string, string>;
  frame?: { url: string; parent: unknown } | null;
}

/** 主进程默认 session 的最小形态（只用到请求头拦截）。 */
export interface DesktopSession {
  webRequest: {
    onBeforeSendHeaders(
      listener: (
        details: RequestDetails,
        callback: (response: { requestHeaders: Record<string, string> }) => void,
      ) => void,
    ): void;
  };
}

/**
 * 把本地路径收成可比对的键。
 *
 * 打包后的 exe 会解压到每台电脑自己的临时目录。窗口地址和主进程路径经常只在盘符大小写、
 * 百分号编码或 8.3 短名上不同；按 file 地址原文比对会漏加令牌，配置请求就被 403。
 * asar 内部路径对 realpath 不可见，就落到最近一层真实目录上再把余下的相对路径接回去。
 */
function fileKey(filePath: string): string {
  const resolved = resolve(filePath);
  const tail: string[] = [];
  let cursor = resolved;
  let canonical = resolved;
  while (true) {
    try {
      canonical = tail.reduceRight((dir, name) => resolve(dir, name), realpathSync.native(cursor));
      break;
    } catch {
      const parent = dirname(cursor);
      if (parent === cursor) break;
      tail.push(basename(cursor));
      cursor = parent;
    }
  }
  return process.platform === 'win32' ? canonical.toLowerCase() : canonical;
}

/** 去掉查询串和片段后再还原成本地路径。fileURLToPath 拒绝带 search/hash 的地址。 */
function pathFromFileUrl(href: string): string {
  const url = new URL(href);
  if (url.protocol !== 'file:') throw new Error('not a file url');
  url.search = '';
  url.hash = '';
  return fileURLToPath(url);
}

/**
 * 为本机顶层 file 渲染端访问插件路由的请求附加访问令牌。
 *
 * 目标 origin、插件路由段、顶层 frame 与渲染页真实路径必须同时匹配，任一不满足都不加令牌；
 * 先删同名请求头再按需写入，避免调用方自带的伪令牌被带到别的目标。
 *
 * @param session - 主进程默认 session（出站请求拦截）。
 * @param origin - 本机服务 origin。
 * @param rendererPath - 桌面 Helper 渲染页绝对路径。
 * @param token - 访问令牌。
 */
export function installDesktopAuth(session: DesktopSession, origin: string, rendererPath: string, token: string): void {
  const rendererKey = fileKey(rendererPath);
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    try {
      const frame = details.frame;
      const page = frame ? new URL(frame.url) : undefined;
      // 只动桌宠 file 渲染页：清掉自带头再按需注入。应用内设置窗是 http 同源页，
      // 自己从 #token= 带头；若这里一律剥离，设置接口会全部 403。
      const isPetRenderer =
        frame?.parent === null &&
        page?.protocol === 'file:' &&
        page.origin === 'null' &&
        fileKey(pathFromFileUrl(page.href)) === rendererKey;
      if (!isPetRenderer) {
        callback({ requestHeaders: headers });
        return;
      }
      // 重定向或非法目标都不得把凭证带出去：先剥，再仅对插件路由注入。
      for (const name of Object.keys(headers)) {
        const lower = name.toLowerCase();
        if (lower === 'x-taoxi-pet-token' || lower === 'x-dsh-pet-token') delete headers[name];
      }
      const target = new URL(details.url);
      if (target.origin === origin && target.pathname.startsWith(ROUTE_SEGMENT + '/')) {
        headers['X-Taoxi-Pet-Token'] = token;
      }
    } catch {
      // frame 缺失/已销毁或目标地址非法时，一律不授予凭证（桌宠页已剥头）。
    }
    callback({ requestHeaders: headers });
  });
}
