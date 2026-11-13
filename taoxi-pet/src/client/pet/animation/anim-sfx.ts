/**
 * 动作角色声：一段动画对应 assets/sfx 里的同名 ogg。
 * 不负责点击音效，也不读点击静音开关。每只宠物一份，换源就换声。
 * Audio 不存在或播放失败时静默，动画照常播。
 * @module taoxi-pet/src/client/pet/animation/anim-sfx
 */
import { ROUTE_PATH } from '../../../shared/constants.ts';

/** 角色声音量：比点击提示音更靠前，仍给对话留余量。 */
const ANIM_SFX_VOLUME = 0.8;

/**
 * 同名角色声的地址。外部地址和路径片段不是动画名，返回 null。
 *
 * @param anim - 动画名，与 webm / ogg 文件名（不含扩展名）相同。
 * @returns 可直接交给 Audio 的地址；不该发声时为 null。
 */
export function animSfxUrl(anim: string): string | null {
  if (anim === '' || anim.includes('://') || anim.includes('/') || anim.includes('\\')) return null;
  return ROUTE_PATH + '/sfx/' + encodeURIComponent(anim) + '.ogg';
}

/** 一只宠物的角色声。 */
export interface AnimSfx {
  /** 从头播放这一段；`loop` 与视频循环一致。 */
  play(anim: string, loop: boolean): void;
  /** 暂停，不解绑当前这一段。 */
  pause(): void;
  /** 这一圈播完就停，不再循环。 */
  hold(): void;
  /** 停掉并松开当前这一段。 */
  stop(): void;
}

/** 造一只宠物的角色声；浏览器没有 Audio 时所有方法空转。 */
export function createAnimSfx(): AnimSfx {
  let audio: HTMLAudioElement | null = null;

  const stop = (): void => {
    if (audio === null) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  return {
    play(anim, loop) {
      const url = animSfxUrl(anim);
      if (url === null || typeof Audio === 'undefined') {
        stop();
        return;
      }
      try {
        audio ??= new Audio();
        audio.volume = ANIM_SFX_VOLUME;
        audio.loop = loop;
        audio.src = url;
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      } catch {
        /* 音频不可用：静默。 */
      }
    },
    pause() {
      audio?.pause();
    },
    hold() {
      if (audio !== null) audio.loop = false;
    },
    stop,
  };
}
