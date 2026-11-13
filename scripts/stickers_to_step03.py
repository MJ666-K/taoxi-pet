"""透明底贴纸 → 程序化透明动画（step03 母版），素材链路线 C：没有 AI 源视频时先让宠物动起来。

  docs/01-透明底素材/贴纸单格/*.png → 本脚本 → step03/<动画名>.webm（2160×1215，VP9-alpha）
  → encode_thumbs.py → step04/（640×360）→ 宠物素材目录

做法：
- 每段动画 = 若干「姿势段」（一张贴纸 + 一种程序化动作），相邻段之间交叉淡入；
  默认首尾各接一段基准站姿（BASE_POSE），所以任意两段动画首尾帧完全一致、可无缝衔接。
- 每种动作在段首段尾都回到静止（整数个周期或包络归零），交叉淡入只发生在静止帧之间。
- 所有贴纸用同一个缩放比例（基准站姿高 = TARGET_HEIGHT），脚底对齐 FEET_Y，
  直接产出 normalize_step03 的规格；不再走 normalize：它按首尾帧测站高，
  而「睡觉-开始」结尾是躺姿，测出来的比例会错。

用法：
  python scripts/stickers_to_step03.py            # 全部（已存在且比脚本新的跳过）
  python scripts/stickers_to_step03.py 待机呼吸    # 指定一个/多个
  python scripts/stickers_to_step03.py --list      # 列出动画清单
"""
from __future__ import annotations

import math
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image

from ffmpeg_path import FFMPEG
from sticker_common import ROOT, clean_sticker, sticker_index

OUT = ROOT / "step03"
PARALLEL = 4
CANVAS_W, CANVAS_H = 2160, 1215   # 与 normalize_step03 一致
TARGET_HEIGHT = 900               # 基准站姿高度
FEET_Y = CANVAS_H - 100           # 脚底线
FPS = 24
XFADE = 0.35                      # 姿势之间交叉淡入时长（秒）
BASE_POSE = "抱抱"                 # 基准站姿：与主立绘同款（抱着小水母）
BASE_HOLD = 0.5                   # 首尾基准站姿停留（秒）
FEET_BAND = 0.12                  # 取贴纸最下面这一比例的行估算双脚水平中心


@dataclass(frozen=True)
class Seg:
    pose: str
    dur: float
    motion: str = "still"


@dataclass(frozen=True)
class Clip:
    segs: tuple[Seg, ...]
    start_base: bool = True
    end_base: bool = True


def clip(pose: str, motion: str, dur: float = 3.0) -> Clip:
    return Clip((Seg(pose, dur, motion),))


# 动画名 → 编排。多姿势串联（表情变化 + 动作），比单张贴纸缩放更生动；
# 真正的 3D 肢体动画请用 AI 图生视频覆盖（见 scripts/build_i2v_cards.py）。
CLIPS: dict[str, Clip] = {
    # 只用全身贴纸（半身表情没有脚，归一化后会对不齐）
    "待机呼吸": Clip(
        (Seg(BASE_POSE, 2.4, "breathe"), Seg("挥手", 1.6, "sway"), Seg(BASE_POSE, 2.4, "breathe")),
        start_base=False, end_base=False,
    ),
    "点击回应-开心跃动": Clip((
        Seg("加油", 0.45, "anticipate"), Seg("开心跳跃", 1.5, "bounce"), Seg("比心", 0.55, "hop"),
    )),
    "点击回应-害羞": Clip((
        Seg("害羞低头", 0.5, "anticipate"), Seg("害羞低头", 1.2, "wiggle"), Seg("害羞躲藏", 0.9, "wiggle"),
    )),
    "点击回应-生气": Clip((
        Seg("生气爆气", 0.45, "anticipate"), Seg("生气爆气", 1.3, "shake"), Seg("生气扔东西", 0.7, "shake"),
    )),
    "点击回应-挥手": Clip((
        Seg("打招呼", 0.45), Seg("挥手", 1.5, "sway"), Seg("招手", 0.7, "sway"),
    )),
    "点击回应-摸头": Clip((
        Seg("害羞低头", 0.4, "nod"), Seg("摸头", 1.6, "nod"), Seg(BASE_POSE, 0.5, "breathe"),
    )),
    "被拖拽悬空": Clip((
        Seg("害怕", 0.5, "anticipate"), Seg("害怕", 2.0, "dangle"), Seg("委屈", 0.5, "tremble"),
    )),
    "余额-钱袋满溢": Clip((Seg("心动", 0.5, "hop"), Seg("开心跳跃", 1.4, "bounce"), Seg("比心", 0.8, "hop"))),
    "余额-金袋叮当": Clip((Seg("欢迎", 0.5, "sway"), Seg("打招呼", 1.4, "hop"), Seg("挥手", 0.8, "sway"))),
    "余额-钱袋如常": Clip((Seg("吃瓜", 1.6, "nod"), Seg(BASE_POSE, 1.0, "breathe"))),
    "余额-数金皱眉": Clip((Seg("困惑", 1.2, "tilt"), Seg("思考", 1.2, "tilt"), Seg("无话", 0.8, "slump"))),
    "余额-袋空如洗": Clip((Seg("委屈", 1.4, "tremble"), Seg("无话", 1.2, "slump"))),
    "余额-分文不剩": Clip((Seg("无话", 1.2, "slump"), Seg("委屈", 1.4, "tremble"))),
    "碎碎念-发呆": Clip((Seg("发呆", 2.2, "breathe"), Seg("思考", 1.4, "tilt"), Seg("发呆", 1.2, "sway"))),
    "碎碎念-偷看": Clip((Seg("发呆", 0.5), Seg("偷看", 2.0, "sway"), Seg("害羞低头", 0.8, "wiggle"))),
    "碎碎念-喝水": Clip((Seg("喝水", 2.0, "nod"), Seg(BASE_POSE, 0.9, "breathe"))),
    "工作状态-思考": Clip((Seg("思考", 2.0, "tilt"), Seg("困惑", 1.4, "tilt"), Seg("思考", 1.2, "breathe"))),
    "工作状态-加油": Clip((Seg("加油", 1.2, "hop"), Seg("开心跳跃", 1.2, "bounce"), Seg("加油", 0.8, "hop"))),
    "工作状态-感谢": Clip((Seg("感谢", 1.6, "nod"), Seg("比心", 1.0, "hop"))),
    "工作状态-招手": Clip((Seg("招手", 1.5, "sway"), Seg("挥手", 1.2, "sway"), Seg("欢迎", 0.8, "sway"))),
    "工作状态-比心": Clip((Seg("心动", 0.7, "hop"), Seg("比心", 1.4, "bounce"), Seg(BASE_POSE, 0.7, "breathe"))),
    "工作状态-委屈": Clip((Seg("委屈", 1.6, "tremble"), Seg("无话", 1.2, "slump"), Seg("委屈", 0.8, "nod"))),
    "睡觉-开始": Clip((
        Seg("打哈欠", 1.6, "nod"), Seg("困了", 1.4, "sway"), Seg("晚安", 0.8, "sleep"),
    ), end_base=False),
    "睡觉-循环": Clip((Seg("晚安", 4.0, "sleep"),), start_base=False, end_base=False),
    "睡觉-起来": Clip((
        Seg("晚安", 0.5, "sleep"), Seg("打哈欠", 1.4, "nod"), Seg("困了", 0.8, "sway"),
    ), start_base=False),
    "打哈欠": Clip((Seg("困了", 0.5, "nod"), Seg("打哈欠", 1.8, "nod"), Seg("困了", 0.7, "breathe"))),
    "喝水": Clip((Seg("喝水", 2.2, "nod"), Seg(BASE_POSE, 0.8, "breathe"))),
    "吃东西": Clip((Seg("吃东西", 1.6, "nod"), Seg("吃瓜", 1.2, "nod"), Seg(BASE_POSE, 0.6))),
    "发呆": Clip((Seg("发呆", 2.2, "breathe"), Seg("思考", 1.4, "sway"))),
    "思考": Clip((Seg("思考", 1.8, "tilt"), Seg("困惑", 1.2, "tilt"))),
    "躺下": Clip((Seg("困了", 0.6, "slump"), Seg("躺下", 2.2, "sleep"), Seg("困了", 0.6, "nod"))),
    "趴看": Clip((Seg("趴看", 2.4, "breathe"), Seg("偷看", 1.0, "sway"))),
    "开心跳跃": Clip((Seg("加油", 0.4, "anticipate"), Seg("开心跳跃", 1.6, "bounce"), Seg("比心", 0.7, "hop"))),
    "比心": Clip((Seg("心动", 0.6, "hop"), Seg("比心", 1.6, "bounce"))),
    "抱抱": Clip((Seg(BASE_POSE, 1.4, "sway"), Seg("欢迎", 1.2, "breathe"), Seg(BASE_POSE, 1.0, "sway"))),
    "送礼物": Clip((Seg("送礼物", 1.6, "hop"), Seg("比心", 1.0, "hop"))),
    "欢迎": Clip((Seg("欢迎", 1.4, "sway"), Seg("打招呼", 1.2, "sway"))),
    "打招呼": Clip((Seg("打招呼", 1.2, "sway"), Seg("挥手", 1.2, "sway"))),
    "加油": Clip((Seg("加油", 1.4, "hop"), Seg("开心跳跃", 1.2, "bounce"))),
    "生气爆气": Clip((Seg("生气爆气", 0.5, "anticipate"), Seg("生气爆气", 1.6, "shake"))),
    "生气扔东西": Clip((Seg("生气爆气", 0.5, "shake"), Seg("生气扔东西", 1.6, "shake"))),
    "害怕": Clip((Seg("害怕", 1.6, "tremble"), Seg("委屈", 1.0, "slump"))),
    "委屈": Clip((Seg("委屈", 1.6, "tremble"), Seg("无话", 1.2, "slump"))),
    "困惑": Clip((Seg("困惑", 1.4, "tilt"), Seg("思考", 1.2, "tilt"))),
    "心动": Clip((Seg("心动", 1.4, "hop"), Seg("比心", 1.2, "bounce"))),
    "无话": Clip((Seg("无话", 1.8, "slump"), Seg("发呆", 1.2, "breathe"))),
    "害羞躲藏": Clip((Seg("害羞低头", 0.5, "wiggle"), Seg("害羞躲藏", 1.8, "wiggle"), Seg("害羞低头", 0.8))),
    "偷看": Clip((Seg("偷看", 2.0, "sway"), Seg("害羞低头", 0.9, "wiggle"))),
    "下播了": Clip((Seg("下播了", 1.4, "sway"), Seg("挥手", 1.2, "sway"), Seg("晚安", 0.6))),
}


def motion_at(kind: str, t: float, dur: float) -> tuple[float, float, float, float, float]:
    """程序化动作在段内 t 秒时的 (dx, dy, 旋转度, sx, sy)，以脚底中心为锚点；t=0 与 t=dur 恒为静止。"""
    u = t / dur
    env = math.sin(math.pi * u)  # 段首段尾归零的包络

    def cycles(period: float) -> int:
        return max(1, round(dur / period))

    if kind == "breathe":
        k = math.sin(math.pi * cycles(2.0) * u) ** 2
        return 0, -3 * k, 0.8 * math.sin(2 * math.pi * cycles(4.0) * u), 1 - 0.006 * k, 1 + 0.018 * k
    if kind == "sleep":
        k = math.sin(math.pi * cycles(2.6) * u) ** 2
        return 0, 0, 0.6 * math.sin(2 * math.pi * cycles(2.6) * u), 1 + 0.01 * k, 1 - 0.014 * k
    if kind == "anticipate":
        # 起手蓄力：先下压再回弹，段尾归零
        k = math.sin(math.pi * u)
        return 0, 10 * k, 0, 1 + 0.04 * k, 1 - 0.06 * k
    if kind in ("bounce", "hop"):
        n, height = (cycles(0.55), 90) if kind == "bounce" else (cycles(0.85), 36)
        phase = math.sin(math.pi * n * u)
        k = abs(phase)
        squash = max(0, -phase)  # 落地瞬间压扁
        return 0, -height * k, 0, 1 - 0.03 * k + 0.06 * squash, 1 + 0.04 * k - 0.08 * squash
    if kind == "sway":
        ang = 5.5 * math.sin(2 * math.pi * cycles(1.1) * u)
        return 6 * math.sin(2 * math.pi * cycles(1.1) * u), 0, ang, 1, 1
    if kind == "wiggle":
        n = cycles(0.45)
        return 0, 0, 4.5 * math.sin(2 * math.pi * n * u) * env, 1 + 0.015 * env, 1 - 0.015 * env
    if kind == "nod":
        k = math.sin(math.pi * cycles(0.75) * u) ** 2
        return 0, 8 * k, 2.2 * math.sin(2 * math.pi * cycles(1.5) * u), 1, 1 - 0.015 * k
    if kind == "tilt":
        return 0, 0, 7.0 * env * math.sin(math.pi * cycles(1.4) * u), 1, 1
    if kind == "shake":
        return 16 * math.sin(2 * math.pi * cycles(0.1) * u) * env, 0, 2 * math.sin(2 * math.pi * cycles(0.1) * u) * env, 1, 1
    if kind == "tremble":
        return 5 * math.sin(2 * math.pi * cycles(0.06) * u) * env, 0, 0, 1 + 0.012 * env, 1 - 0.018 * env
    if kind == "slump":
        return 0, 4 * env, 0, 1 + 0.03 * env, 1 - 0.055 * env
    if kind == "dangle":
        return 8 * math.sin(2 * math.pi * cycles(1.2) * u), -55 * env, 8.0 * math.sin(2 * math.pi * cycles(1.2) * u), 1, 1
    return 0, 0, 0, 1, 1


@lru_cache(maxsize=None)
def base_scale() -> float:
    return TARGET_HEIGHT / clean_sticker(sticker_index()[BASE_POSE]).height


@lru_cache(maxsize=None)
def sprite(pose: str) -> tuple[Image.Image, float, float]:
    """贴纸按统一比例缩放（预乘 alpha，变换时边缘不发黑），返回 (图, 脚底中心 x, 脚底 y)。"""
    im = clean_sticker(sticker_index()[pose])
    s = base_scale()
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    a = np.asarray(im)[..., 3]
    band = a[int(a.shape[0] * (1 - FEET_BAND)):]
    xs = np.nonzero(band > 16)[1]
    cx = float(np.median(xs)) if len(xs) else im.width / 2
    return im.convert("RGBa"), cx, float(im.height)


def render(pose: str, m: tuple[float, float, float, float, float]) -> np.ndarray:
    """把一张贴纸按动作参数画到画布上，返回预乘 RGBa 的 float32 数组。"""
    im, ax, ay = sprite(pose)
    dx, dy, deg, sx, sy = m
    th = math.radians(deg)
    c, s = math.cos(th), math.sin(th)
    tx, ty = CANVAS_W / 2 + dx, FEET_Y + dy
    # 正向：canvas = T + R·S·(p − anchor)；PIL 要的是逆映射 p = anchor + S⁻¹·R⁻¹·(canvas − T)
    a, b = c / sx, s / sx
    d, e = -s / sy, c / sy
    data = (a, b, ax - a * tx - b * ty, d, e, ay - d * tx - e * ty)
    out = im.transform((CANVAS_W, CANVAS_H), Image.AFFINE, data, resample=Image.BICUBIC)
    return np.asarray(out, dtype=np.float32)


def frames(spec: Clip):
    segs = list(spec.segs)
    if spec.start_base:
        segs.insert(0, Seg(BASE_POSE, BASE_HOLD))
    if spec.end_base:
        segs.append(Seg(BASE_POSE, BASE_HOLD))
    for i, seg in enumerate(segs):
        n = max(1, round(seg.dur * FPS))
        for f in range(n):
            yield render(seg.pose, motion_at(seg.motion, f / FPS, seg.dur))
        if i + 1 < len(segs):
            a = render(seg.pose, motion_at(seg.motion, seg.dur, seg.dur))
            b = render(segs[i + 1].pose, (0, 0, 0, 1, 1))
            nx = round(XFADE * FPS)
            for f in range(1, nx + 1):
                w = f / (nx + 1)
                w = w * w * (3 - 2 * w)
                yield a * (1 - w) + b * w
    last = segs[-1]
    yield render(last.pose, motion_at(last.motion, last.dur, last.dur))


def encode(name: str) -> str:
    dst = OUT / f"{name}.webm"
    p = subprocess.Popen(
        [FFMPEG, "-y", "-loglevel", "error",
         "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{CANVAS_W}x{CANVAS_H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "30", "-b:v", "0",
         "-auto-alt-ref", "0", "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1", str(dst)],
        stdin=subprocess.PIPE)
    count = 0
    for fr in frames(CLIPS[name]):
        rgba = Image.fromarray(np.clip(fr, 0, 255).astype(np.uint8), "RGBa").convert("RGBA")
        p.stdin.write(rgba.tobytes())
        count += 1
    p.stdin.close()
    if p.wait() != 0:
        raise RuntimeError(f"encode failed: {name}")
    return f"{name} {count / FPS:.1f}s"


def _process_one(name: str) -> str:
    dst = OUT / f"{name}.webm"
    if dst.exists() and dst.stat().st_mtime > Path(__file__).stat().st_mtime:
        return f"SKIP {name}"
    return encode(name)


def main() -> int:
    args = sys.argv[1:]
    if args == ["--list"]:
        for n, c in CLIPS.items():
            print(n, " → ", " / ".join(f"{s.pose}:{s.motion}" for s in c.segs))
        return 0
    unknown = [a for a in args if a not in CLIPS]
    if unknown:
        print(f"未知动画: {unknown}")
        return 1
    missing = {s.pose for c in CLIPS.values() for s in c.segs} - set(sticker_index())
    if missing:
        print(f"贴纸缺失: {sorted(missing)}")
        return 1
    OUT.mkdir(exist_ok=True)
    names = args or list(CLIPS)
    with ProcessPoolExecutor(max_workers=PARALLEL) as ex:
        for i, msg in enumerate(ex.map(_process_one, names), start=1):
            print(f"[{i}/{len(names)}] {msg}", flush=True)
    print(f"Done. {len(names)} clips -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
