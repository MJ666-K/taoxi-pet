import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installDesktopAuth, type DesktopSession } from './desktop-auth.ts';

test('only the local main renderer receives the capability, scoped to the API origin', () => {
  let listener: Parameters<DesktopSession['webRequest']['onBeforeSendHeaders']>[0] | undefined;
  const rendererPath = resolve('runtime/electron-helper/index.html');
  const renderer = pathToFileURL(rendererPath).href;
  installDesktopAuth(
    {
      webRequest: {
        onBeforeSendHeaders(fn) {
          listener = fn;
        },
      },
    },
    'http://127.0.0.1:3080',
    rendererPath,
    'private-token',
  );
  assert.ok(listener);
  const send = (url: string, frame?: { url: string; parent: unknown } | null) => {
    let result: Record<string, string> = {};
    listener!(
      { url, frame, requestHeaders: { 'content-type': 'application/json', 'x-taoxi-pet-token': 'stale-token' } },
      (response) => {
        result = response.requestHeaders;
      },
    );
    return result;
  };
  const endpoint = 'http://127.0.0.1:3080/taoxi-pet-7340/chat';
  const ownFrame = { url: renderer + '?petIndex=0', parent: null };
  assert.equal(send(endpoint, ownFrame)['X-Taoxi-Pet-Token'], 'private-token');
  // 非桌宠 file 页：不碰请求头（应用内设置窗要自己保留 #token= 换来的头）
  for (const frame of [
    undefined,
    null,
    { url: 'about:srcdoc', parent: {} },
    { url: renderer, parent: {} },
    { url: 'https://example.invalid/', parent: null },
    { url: renderer + '.other', parent: null },
  ]) {
    const headers = send(endpoint, frame);
    assert.equal(headers['x-taoxi-pet-token'], 'stale-token');
    assert.equal(headers['content-type'], 'application/json');
  }
  // 桌宠页打到非插件路由 / 外站：清掉头，绝不注入
  for (const url of [
    'http://127.0.0.1:3081/taoxi-pet-7340/chat',
    'http://localhost:3080/taoxi-pet-7340/chat',
    'https://example.invalid/taoxi-pet-7340/chat',
    'http://127.0.0.1:3080/standalone-ai/settings',
    'invalid-url',
  ]) {
    const headers = send(url, ownFrame);
    assert.equal(headers['X-Taoxi-Pet-Token'], undefined);
    assert.equal(
      Object.keys(headers).some((name) => name.toLowerCase() === 'x-taoxi-pet-token'),
      false,
    );
  }
});

test('in-app settings window keeps its own token header', () => {
  let listener: Parameters<DesktopSession['webRequest']['onBeforeSendHeaders']>[0] | undefined;
  const rendererPath = resolve('runtime/electron-helper/index.html');
  installDesktopAuth(
    {
      webRequest: {
        onBeforeSendHeaders(fn) {
          listener = fn;
        },
      },
    },
    'http://127.0.0.1:3080',
    rendererPath,
    'private-token',
  );
  let result: Record<string, string> = {};
  listener!(
    {
      url: 'http://127.0.0.1:3080/standalone-ai/settings',
      frame: { url: 'http://127.0.0.1:3080/standalone-ai/', parent: null },
      requestHeaders: { 'X-DSH-Pet-Token': 'page-hash-token', 'content-type': 'application/json' },
    },
    (response) => {
      result = response.requestHeaders;
    },
  );
  assert.equal(result['X-DSH-Pet-Token'], 'page-hash-token');
  assert.equal(result['X-Taoxi-Pet-Token'], undefined);
});

test('token still attaches when the file url only differs by encoding or drive-letter case', () => {
  let listener: Parameters<DesktopSession['webRequest']['onBeforeSendHeaders']>[0] | undefined;
  const rendererPath = 'C:\\Users\\李明杰\\AppData\\Local\\Temp\\taoxi pet\\resources\\app.asar\\runtime\\electron-helper\\index.html';
  installDesktopAuth(
    {
      webRequest: {
        onBeforeSendHeaders(fn) {
          listener = fn;
        },
      },
    },
    'http://127.0.0.1:3080',
    rendererPath,
    'private-token',
  );
  const send = (frameUrl: string) => {
    let result: Record<string, string> = {};
    listener!(
      {
        url: 'http://127.0.0.1:3080/taoxi-pet-7340/config',
        frame: { url: frameUrl, parent: null },
        requestHeaders: {},
      },
      (response) => {
        result = response.requestHeaders;
      },
    );
    return result['X-Taoxi-Pet-Token'];
  };
  const encoded = pathToFileURL(rendererPath).href;
  assert.equal(send(encoded + '?petIndex=0'), 'private-token');
  assert.equal(send(encoded.replace('/C:/', '/c:/')), 'private-token');
  assert.equal(send(encoded.replace('index.html', 'other.html')), undefined);
});
