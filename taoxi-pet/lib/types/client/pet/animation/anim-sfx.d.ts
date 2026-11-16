/**
 * 同名角色声的地址。外部地址和路径片段不是动画名，返回 null。
 *
 * @param anim - 动画名，与 webm / ogg 文件名（不含扩展名）相同。
 * @returns 可直接交给 Audio 的地址；不该发声时为 null。
 */
export declare function animSfxUrl(anim: string): string | null;
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
export declare function createAnimSfx(): AnimSfx;
