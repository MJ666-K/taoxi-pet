"""素材链共用的 ffmpeg / ffprobe 定位。

查找顺序：环境变量 DSH_FFMPEG_DIR（ffmpeg.exe 所在目录）→ 工作区 .tools 自带版本 → 系统 PATH。
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_BUNDLED = ROOT / ".tools" / "ffmpeg-9.0.1-essentials_build" / "bin"


def _resolve(name: str) -> str:
    exe = name + (".exe" if os.name == "nt" else "")
    env_dir = os.environ.get("DSH_FFMPEG_DIR")
    for d in ([Path(env_dir)] if env_dir else []) + [_BUNDLED]:
        if (d / exe).exists():
            return str(d / exe)
    found = shutil.which(name)
    if found:
        return found
    raise FileNotFoundError(f"找不到 {name}：设置 DSH_FFMPEG_DIR，或放到 {_BUNDLED}，或加入 PATH")


FFMPEG = _resolve("ffmpeg")
FFPROBE = _resolve("ffprobe")
