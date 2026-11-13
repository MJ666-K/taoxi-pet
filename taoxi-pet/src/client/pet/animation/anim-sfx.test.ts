/**
 * 动作角色声地址：同名 ogg，外部地址与路径片段不发声。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { animSfxUrl, createAnimSfx } from './anim-sfx.ts';
import { ROUTE_PATH } from '../../../shared/constants.ts';

test('animSfxUrl encodes the animation name onto /sfx', () => {
  assert.equal(animSfxUrl('抱抱'), ROUTE_PATH + '/sfx/' + encodeURIComponent('抱抱') + '.ogg');
  assert.equal(animSfxUrl('吃 Token'), ROUTE_PATH + '/sfx/' + encodeURIComponent('吃 Token') + '.ogg');
});

test('animSfxUrl rejects addresses and path fragments', () => {
  assert.equal(animSfxUrl(''), null);
  assert.equal(animSfxUrl('https://example.com/a.webm'), null);
  assert.equal(animSfxUrl('../secret'), null);
  assert.equal(animSfxUrl('a\\b'), null);
});

test('createAnimSfx plays, loops, and stops through one Audio element', () => {
  const sounds: Array<{
    src: string;
    loop: boolean;
    volume: number;
    currentTime: number;
    paused: boolean;
    plays: number;
  }> = [];
  class FakeAudio {
    src = '';
    loop = false;
    volume = 1;
    currentTime = 3;
    paused = true;
    plays = 0;
    constructor() {
      sounds.push(this);
    }
    play(): Promise<void> {
      this.plays += 1;
      this.paused = false;
      return Promise.resolve();
    }
    pause(): void {
      this.paused = true;
    }
    load(): void {}
    removeAttribute(name: string): void {
      if (name === 'src') this.src = '';
    }
  }
  const previous = globalThis.Audio;
  globalThis.Audio = FakeAudio as unknown as typeof Audio;
  try {
    const sfx = createAnimSfx();
    sfx.play('待机呼吸', true);
    assert.equal(sounds.length, 1);
    assert.equal(sounds[0].src, ROUTE_PATH + '/sfx/' + encodeURIComponent('待机呼吸') + '.ogg');
    assert.equal(sounds[0].loop, true);
    assert.equal(sounds[0].volume, 0.8);
    assert.equal(sounds[0].currentTime, 0);
    assert.equal(sounds[0].plays, 1);
    sfx.hold();
    assert.equal(sounds[0].loop, false);
    sfx.pause();
    assert.equal(sounds[0].paused, true);
    sfx.play('https://example.com/a.webm', false);
    assert.equal(sounds[0].src, '');
    assert.equal(sounds[0].paused, true);
  } finally {
    if (previous === undefined) delete (globalThis as { Audio?: typeof Audio }).Audio;
    else globalThis.Audio = previous;
  }
});
