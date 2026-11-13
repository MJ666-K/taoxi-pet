/**
 * 松手结算：判断这次拖拽是原地放下、甩抛还是弹弓，并给出起飞的初速。
 * 不写 DOM、不读时钟：包围盒、轨迹与时刻都由调用方传入，便于单测与两端共用同一口径。
 * 依赖 shared/physics 的初速估算与弹弓换算。
 * 不变量：弹弓只看拉距（与手速无关）；非弹弓时轨迹估算不出速度就是原地放下。
 * @module taoxi-pet/src/client/pet/motion/drag-release
 */
import { estimateReleaseVelocity, pullAngle, slingshotPower, slingshotVelocity, } from '../../../shared/physics.ts';
/**
 * 决定松手之后怎么落。
 *
 * @param input - 包围盒、按下点、轨迹与物理参数。
 * @returns 弹弓（含拉距与力度，便于日志）、甩抛或原地放下。
 */
export function decideRelease(input) {
    if (input.sling) {
        // 力度取拉距（与手速无关），方向与拉向相反；拉向量用宠物实际中心算。
        const pullX = input.box.x + input.half.w - input.anchor.x;
        const pullY = input.box.y + input.half.h - input.anchor.y;
        const dist = Math.hypot(pullX, pullY);
        const power = slingshotPower(dist, input.size);
        return {
            kind: 'sling',
            dist,
            power,
            velocity: slingshotVelocity(pullAngle(pullX, pullY), power, input.physics.throwPower),
        };
    }
    const velocity = estimateReleaseVelocity(input.trail, input.now, input.physics);
    return velocity ? { kind: 'throw', velocity } : { kind: 'place' };
}
