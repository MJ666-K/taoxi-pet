"""把 AI 图生视频的绿幕 mp4 导入成桃汐透明 webm，并可选安装。

  video/<动画名>.mp4
    → step01（统一 1280×720/24fps；默认 --no-watermark）
    → step02（HSV 绿幕抠像）
    → step03（归一化站立居中）
    → step04（640×360 播放变体）
    → taoxi/webm/（覆盖同名贴纸版）
    → 可选：encode_preview_gifs + install_taoxi

用法：
  python scripts/import_ai_videos.py                  # 处理 video/ 里全部 mp4
  python scripts/import_ai_videos.py 待机呼吸 开心跳跃  # 只处理指定动作
  python scripts/import_ai_videos.py --install        # 处理完写入 ~/.dsh
  python scripts/import_ai_videos.py --keep-steps     # 保留中间 step 目录（默认也保留，便于排查）

注意：
  · 文件名必须与配置里的动画名一致（不含扩展名），提示词在 docs/03-桃汐出片/i2v/
  · 水母帽半透明易发绿：某段抠坏可改走 PR，把 .mov 放进 pr/ 后跑 pr_import_step02.py 再续跑本脚本
  · 本脚本会**只**对本次涉及的文件做增量，不会重做无关动作
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PY = ROOT / ".venv" / "Scripts" / "python.exe"
if not PY.exists():
    PY = Path(sys.executable)

VIDEO = ROOT / "video"
STEP01, STEP02, STEP03, STEP04 = ROOT / "step01", ROOT / "step02", ROOT / "step03", ROOT / "step04"
TAOXI_WEBM = ROOT / "taoxi" / "webm"


def run(script: str, *args: str) -> None:
    cmd = [str(PY), str(ROOT / "scripts" / script), *args]
    print("+", " ".join(cmd), flush=True)
    r = subprocess.run(cmd, cwd=str(ROOT))
    if r.returncode != 0:
        raise SystemExit(r.returncode)


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    do_install = "--install" in sys.argv
    VIDEO.mkdir(exist_ok=True)

    mp4s = sorted(VIDEO.glob("*.mp4"))
    if args:
        want = set(args)
        mp4s = [p for p in mp4s if p.stem in want]
        missing = want - {p.stem for p in mp4s}
        if missing:
            print("video/ 里找不到：", ", ".join(sorted(missing)))
            return 1
    if not mp4s:
        print(f"video/ 没有 mp4。先把 AI 生成的视频按动画名放进来，例如：\n  {VIDEO / '待机呼吸.mp4'}")
        print("提示词卡片在 docs/03-桃汐出片/i2v/<动画名>/prompt.txt")
        return 1

    names = [p.stem for p in mp4s]
    print(f"导入 {len(names)} 段：{', '.join(names)}")

    # 为避免无关旧文件被链式重做，临时隔离：只把本次 mp4 暴露给 step01
    # 简单做法：直接跑全链，各脚本有按 mtime 的 SKIP；用户只放新文件时最干净。
    run("watermark_step01.py", "--no-watermark")
    run("chroma_step02.py")
    run("normalize_step03.py")
    run("encode_thumbs.py")

    TAOXI_WEBM.mkdir(parents=True, exist_ok=True)
    for name in names:
        src = STEP04 / f"{name}.webm"
        if not src.exists():
            print(f"  FAIL 缺少 step04/{name}.webm")
            return 1
        shutil.copy2(src, TAOXI_WEBM / f"{name}.webm")
        print(f"  OK {name}.webm -> taoxi/webm/")

    run("encode_preview_gifs.py", "--src", "taoxi/webm", "--out", "taoxi/preview", *names)

    if do_install:
        run("install_taoxi.py", "--patch-package")
    else:
        print("未加 --install：素材已在 taoxi/webm/。确认无误后运行：")
        print("  .venv\\Scripts\\python.exe scripts\\install_taoxi.py --patch-package")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
