/**
 * 桌面换源时的角色声：与动画同名的 ogg，循环跟着视频，外部地址不发声。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const playback = readFileSync(new URL('../../runtime/electron-helper/sprite/playback.js', import.meta.url), 'utf8');

test('desktop playAnimSfx uses /sfx and stops for an external address', () => {
  const sounds: Array<{
    src: string;
    loop: boolean;
    volume: number;
    currentTime: number;
    paused: boolean;
  }> = [];
  const { PetSprite } = runInNewContext(
    'class PetSprite {}\n' + playback + '\n({ PetSprite })',
    {
      BASE: 'taoxi-pet-bridge://taoxi-pet/taoxi-pet-7340',
      Audio: class {
        src = '';
        loop = false;
        volume = 1;
        currentTime = 4;
        paused = true;
        constructor() {
          sounds.push(this);
        }
        play() {
          this.paused = false;
          return Promise.resolve();
        }
        pause() {
          this.paused = true;
        }
        load() {}
        removeAttribute(name: string) {
          if (name === 'src') this.src = '';
        }
      },
      window: { setTimeout() {}, clearTimeout() {} },
      console,
    },
  ) as { PetSprite: new () => { playAnimSfx(name: string, loop: boolean): void } };
  const pet = new PetSprite();
  pet.playAnimSfx('抱抱', false);
  assert.equal(sounds.length, 1);
  assert.equal(sounds[0].src, 'taoxi-pet-bridge://taoxi-pet/taoxi-pet-7340/sfx/' + encodeURIComponent('抱抱') + '.ogg');
  assert.equal(sounds[0].loop, false);
  assert.equal(sounds[0].volume, 0.8);
  assert.equal(sounds[0].currentTime, 0);
  pet.playAnimSfx('https://example.com/a.webm', true);
  assert.equal(sounds[0].paused, true);
  assert.equal(sounds[0].src, '');
});
