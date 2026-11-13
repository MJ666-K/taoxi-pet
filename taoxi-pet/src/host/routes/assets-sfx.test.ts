/**
 * 动作角色声路由：只放行 assets/sfx 下的 ogg，路径越界与其它扩展名不读盘。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { handleAssetsRoutes } from './assets.ts';
import type { PetRouteDeps } from './types.ts';

function read(rest: string) {
  return handleAssetsRoutes({} as PetRouteDeps, {
    url: new URL('http://localhost/' + rest),
    rest,
    method: 'GET',
  });
}

test('sfx route rejects a non-ogg name', async () => {
  const result = await read('sfx/抱抱.wav');
  assert.ok(result !== undefined && result.kind === 'text');
  assert.equal(result.status, 400);
});

test('sfx route does not follow a path that leaves assets/sfx', async () => {
  const escaped = await read('sfx/../../../package.json');
  assert.ok(escaped !== undefined && escaped.kind === 'text');
  assert.equal(escaped.status, 400);
  const disguised = await read('sfx/../../../package.json.ogg');
  assert.ok(disguised !== undefined && disguised.kind === 'text');
  assert.equal(disguised.status, 404);
});

test('missing ogg is a sfx 404, not the thumb route', async () => {
  const result = await read('sfx/' + encodeURIComponent('没有这段.ogg'));
  assert.ok(result !== undefined && result.kind === 'text');
  assert.equal(result.status, 404);
  assert.match(result.body, /sfx not found/);
});
