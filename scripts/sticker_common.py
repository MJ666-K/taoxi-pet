"""透明底贴纸的公共处理：读图、去掉相邻格残片、按内容裁边。

贴纸是从整页图鉴按格切出来的，格子边缘常带着隔壁格的一条残片；
做法是对 alpha 做连通域标记，只保留主体所在的连通域（膨胀后再标记，避免发丝被切成碎块丢掉）。
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
STICKER_ROOT = ROOT.parent / "docs" / "01-透明底素材"
STICKER_DIR = STICKER_ROOT / "贴纸单格"
ALPHA_MIN = 16      # 低于此视为透明（压掉抠图残留的淡光晕）
CORE_ALPHA = 128    # 连通域只按实心像素算：半透明光晕会把残片和主体粘成一块
JOIN_RADIUS = 6     # 离主体这么近（px）的碎块（发丝/飘带）并回主体
HALO_TOL = 6        # 残留底色判定容差：RGB 各分量与 alpha 的最大差
EDGE_STRIP_PX = 16  # 左右边多宽范围内查隔壁格边框
EDGE_STRIP_RATIO = 0.75  # 不透明像素占列高超过此比例才算边框


def sticker_index() -> dict[str, Path]:
    """表情名（去掉序号前缀，如「挥手」）→ 贴纸路径。"""
    out: dict[str, Path] = {}
    for p in sorted(STICKER_DIR.glob("*/*.png")):
        out[p.stem.split("_", 1)[-1]] = p
    return out


def clean_sticker(path: Path) -> Image.Image:
    """只保留主体连通域并按内容裁边，返回 RGBA。"""
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).copy()
    # 抠图残留的灰色底：R≈G≈B≈A（白底被预乘进颜色），角色本体的半透明像素不会落在这条线上
    rgb = arr[..., :3].astype(np.int16)
    a16 = arr[..., 3].astype(np.int16)
    residue = (np.abs(rgb - a16[..., None]).max(axis=2) <= HALO_TOL) & (a16 < 240)
    arr[..., 3] = np.where(residue, 0, arr[..., 3])
    # 贴着左右边、几乎通高的竖条是切格时带进来的隔壁格边框（角色发梢不会通高）
    a = arr[..., 3]
    tall = (a >= ALPHA_MIN).sum(axis=0) > a.shape[0] * EDGE_STRIP_RATIO
    for x in [*range(EDGE_STRIP_PX), *range(a.shape[1] - EDGE_STRIP_PX, a.shape[1])]:
        if tall[x]:
            arr[:, x, 3] = 0
    a = arr[..., 3]
    labels, n = ndimage.label(a >= CORE_ALPHA)
    if n > 0:
        sizes = ndimage.sum(np.ones_like(a), labels, index=range(1, n + 1))
        core = labels == (int(np.argmax(sizes)) + 1)
        # 主体附近的半透明边缘与碎发并回来；远处的残片（隔壁格）不在范围内
        # 开运算切断 1~2px 的细桥：残片常靠一线极淡像素和主体粘连
        soft = a >= ALPHA_MIN
        opened = ndimage.binary_opening(soft, iterations=2)
        near = ndimage.binary_dilation(core, iterations=JOIN_RADIUS)
        soft_labels, _ = ndimage.label(opened)
        keep_ids = np.unique(soft_labels[near & (soft_labels > 0)])
        kept = np.isin(soft_labels, keep_ids) & (soft_labels > 0)
        keep = soft & ndimage.binary_dilation(kept, iterations=2)
        arr[..., 3] = np.where(keep, a, 0)
        im = Image.fromarray(arr, "RGBA")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def fit_square(im: Image.Image, size: int, margin: float = 0.04, anchor_bottom: bool = False) -> Image.Image:
    """等比缩放进 size×size 透明画布（四周留 margin 比例的边），默认居中。"""
    inner = int(size * (1 - 2 * margin))
    scale = inner / max(im.width, im.height)
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    sm = im.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    y = size - int(size * margin) - h if anchor_bottom else (size - h) // 2
    canvas.alpha_composite(sm, ((size - w) // 2, y))
    return canvas
