"""透明底贴纸 → 表情包 / 头像 / 通知图标 / 角色参考图（输出到 taoxi/）。

  docs/01-透明底素材/贴纸单格/*/*.png → taoxi/memes/<表情名>.png   384×384，气泡配图要求宽高比 ≤ 1
  01_主立绘_透明底.png 头部            → taoxi/logo.png             256×256，对话面板头像
  指定贴纸                            → taoxi/pic/notify-*.png      192×192，系统通知图标
  02_三视图_透明底.png                 → taoxi/main-character.png   /character 角色参考图

用法：python scripts/stickers_to_memes.py
"""
from __future__ import annotations

import shutil

from PIL import Image

from sticker_common import ROOT, STICKER_ROOT, clean_sticker, fit_square, sticker_index

OUT = ROOT / "taoxi"
MEME_SIZE = 384
LOGO_SIZE = 256
NOTIFY_SIZE = 192
# 主立绘（1831×2289）里头部所在的方框：left, top, right, bottom
LOGO_BOX = (380, 110, 1500, 1230)
# 通知图标 → 用哪张贴纸
NOTIFY = {
    "notify-done": "比心",
    "notify-error": "委屈",
    "notify-question": "困惑",
    "notify-approval": "招手",
    "notify-truncated": "无话",
    "notify-test": "挥手",
}


def main() -> int:
    idx = sticker_index()
    memes = OUT / "memes"
    pic = OUT / "pic"
    memes.mkdir(parents=True, exist_ok=True)
    pic.mkdir(parents=True, exist_ok=True)

    for name, path in idx.items():
        fit_square(clean_sticker(path), MEME_SIZE).save(memes / f"{name}.png", optimize=True)
    print(f"memes: {len(idx)} -> {memes}")

    for out_name, sticker in NOTIFY.items():
        fit_square(clean_sticker(idx[sticker]), NOTIFY_SIZE).save(pic / f"{out_name}.png", optimize=True)
    print(f"notify icons: {len(NOTIFY)} -> {pic}")

    portrait = Image.open(STICKER_ROOT / "立绘与三视图" / "01_主立绘_透明底.png").convert("RGBA")
    portrait.crop(LOGO_BOX).resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS).save(OUT / "logo.png", optimize=True)
    shutil.copyfile(STICKER_ROOT / "立绘与三视图" / "02_三视图_透明底.png", OUT / "main-character.png")
    print(f"logo + main-character -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
