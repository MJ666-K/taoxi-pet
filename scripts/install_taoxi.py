"""把 taoxi/ 下生成好的桃汐素材装进 DSH 用户目录，替换主宠物（main）的形象。

  taoxi/webm/*.webm          → ~/.dsh/taoxi-pet/main-animation/webm/
  taoxi/memes/*.png          → ~/.dsh/taoxi-pet/memes/
  taoxi/main-character.png   → ~/.dsh/taoxi-pet/pet/main-character.png（/character 参考图）
  taoxi/main-config.jsonc    → 合并进 ~/.dsh/taoxi-pet/main-config.jsonc（pets 保留用户现有的；原文件先备份）

  --patch-package：头像 logo.png 与通知图标 pic/notify-*.png 只从插件包内读、没有用户层覆盖，
                   加此参数会覆盖已安装插件包里的这几个文件（原文件备份为 *.whale.bak；升级插件后需重跑）。

用法：python scripts/install_taoxi.py [--patch-package] [--dsh-home <目录>]
"""
from __future__ import annotations

import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "taoxi"


def strip_jsonc(text: str) -> str:
    """去掉 // 与 /* */ 注释和尾逗号（跳过字符串内部）。"""
    out, i, n = [], 0, len(text)
    while i < n:
        ch = text[i]
        if ch == '"':
            j = i + 1
            while j < n and text[j] != '"':
                j += 2 if text[j] == "\\" else 1
            out.append(text[i:j + 1])
            i = j + 1
        elif text.startswith("//", i):
            while i < n and text[i] != "\n":
                i += 1
        elif text.startswith("/*", i):
            i = text.index("*/", i) + 2
        else:
            out.append(ch)
            i += 1
    return re.sub(r",(\s*[}\]])", r"\1", "".join(out))


def load_jsonc(path: Path) -> dict:
    return json.loads(strip_jsonc(path.read_text(encoding="utf-8")))


def animation_names(anims: dict) -> set[str]:
    names = set(anims["idle"]) | set(anims["turn"]) | set(anims["drag"]) | set(anims["clicks"])
    names |= {a["name"] for a in anims["moves"]["actions"]}
    for cat in anims["categories"]:
        names |= set(cat["actions"])
    for slots in anims["events"].values():
        for slot in slots:
            names |= set(slot) if isinstance(slot, list) else {slot}
    for s in anims.get("sleep", []):
        for part in s.values():
            names |= set(part)
    names |= set(anims.get("baifan", []))
    return names


def validate(conf: dict) -> list[str]:
    errors = []
    webm = {p.stem for p in (SRC / "webm").glob("*.webm")}
    for name in sorted(animation_names(conf["animations"]) - webm):
        errors.append(f"缺动画素材: {name}.webm")
    memes = {p.stem for p in (SRC / "memes").glob("*.png")}
    for name in sorted(set(conf["memes"]) - memes):
        errors.append(f"缺表情包图片: {name}.png")
    w = conf["animationWeights"]
    total = w["idle"] + w["turn"] + w["move"] + sum(c["weight"] for c in conf["animations"]["categories"])
    if total != 100:
        errors.append(f"权重合计 {total} ≠ 100")
    return errors


def copy_dir(src: Path, dst: Path, pattern: str) -> int:
    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(src.glob(pattern))
    for f in files:
        shutil.copy2(f, dst / f.name)
    return len(files)


def patch_package(dsh_home: Path) -> None:
    """npm 安装的插件包备份为 *.whale.bak；仓库源码包（独立模式从这里跑）由 git 兜底，不留备份。"""
    repo_assets = ROOT / "taoxi-pet" / "assets"
    targets = [(p, True) for p in sorted(dsh_home.glob("profiles/*/node_modules/taoxi-pet/assets"))]
    targets.append((repo_assets, False))
    for assets, backup in targets:
        pairs = [(SRC / "logo.png", assets / "logo.png")]
        pairs += [(p, assets / "pic" / p.name) for p in sorted((SRC / "pic").glob("notify-*.png"))]
        if assets == repo_assets:
            pairs.append((SRC / "main-character.png", assets / "main-character.png"))
        for src, dst in pairs:
            bak = dst.with_name(dst.name + ".whale.bak")
            if backup and dst.exists() and not bak.exists():
                shutil.copy2(dst, bak)
            shutil.copy2(src, dst)
        print(f"  插件包头像/通知图标已替换: {assets}")


def main() -> int:
    args = sys.argv[1:]
    dsh_home = Path(os.environ.get("DSH_HOME", Path.home() / ".dsh"))
    if "--dsh-home" in args:
        dsh_home = Path(args[args.index("--dsh-home") + 1])
    user_root = dsh_home / "taoxi-pet"

    conf = load_jsonc(SRC / "main-config.jsonc")
    errors = validate(conf)
    if errors:
        print("\n".join(errors))
        return 1

    user_root.mkdir(parents=True, exist_ok=True)
    user_conf_path = user_root / "main-config.jsonc"
    merged = dict(conf)
    if user_conf_path.exists():
        existing = load_jsonc(user_conf_path)
        backup = user_conf_path.with_name(f"main-config.{time.strftime('%Y%m%d-%H%M%S')}.jsonc.bak")
        shutil.copy2(user_conf_path, backup)
        print(f"  原配置已备份: {backup}")
        merged = {**existing, **{k: v for k, v in conf.items() if k != "pets"}}
        if "pets" not in existing:
            merged["pets"] = conf["pets"]
    user_conf_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  配置已写入: {user_conf_path}")

    n = copy_dir(SRC / "webm", user_root / "main-animation" / "webm", "*.webm")
    print(f"  动画 {n} 段 -> {user_root / 'main-animation' / 'webm'}")
    n = copy_dir(SRC / "memes", user_root / "memes", "*.png")
    print(f"  表情包 {n} 张 -> {user_root / 'memes'}")
    (user_root / "pet").mkdir(exist_ok=True)
    shutil.copy2(SRC / "main-character.png", user_root / "pet" / "main-character.png")
    print(f"  角色参考图 -> {user_root / 'pet' / 'main-character.png'}")

    if "--patch-package" in args:
        patch_package(dsh_home)
    print("完成。重启 DSH（或在设置页保存一次）后生效。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
