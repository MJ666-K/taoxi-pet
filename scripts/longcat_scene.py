"""用 LongCat-2.5 按参考图写一段可逐帧截图的 3D 场景，再交给 Chrome 渲成绿幕 mp4。

密钥只从 taoxi-pet/.env 的 LONGCAT_API_KEY 读取，不写进仓库。

  .venv\\Scripts\\python.exe scripts\\longcat_scene.py 待机呼吸
  .venv\\Scripts\\python.exe scripts\\longcat_scene.py 待机呼吸 --render
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I2V = ROOT / "taoxi" / "i2v"
OUT = ROOT / "taoxi" / "longcat"
ENV = ROOT / ".env"
API = "https://api.longcat.chat/openai/v1/chat/completions"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
FFMPEG = Path(r"C:\ffmpeg\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")

SYSTEM = """你是桌宠用的 3D 角色动画程序员。只输出一个完整 HTML 文件，放在 ```html 代码块里，不要任何解释。

技术合同（必须全部满足）：
- 单文件。three.js 用 https://unpkg.com/three@0.160.0/build/three.min.js
- 画面固定 1280×720，body 与 canvas 都是 1280×720、margin 0、overflow hidden
- 场景清除色和页面背景都必须是精确的 #00FF00。不要地面、房间、文字、水印、logo
- 不要接触阴影贴在绿幕上。角色可以有体积光，但不要把绿幕颜色染到头发和衣服上
- 相机固定、正面、无推拉摇移。角色水平居中，全身入画，头顶离顶边至少 10%，脚底离底边至少 10%
- 软 3D 卡通，MeshToonMaterial 或近似明暗，有体积。按参考图重做桃汐，不要用贴图把原图贴在一块板上晃
- 角色：Q 版二头身，粉色及腰长卷发，半透明白色水母帽（蕾丝边、两只奶黄小耳朵、小白花和星星），两侧灰藏青蝴蝶结，奶油黄与白色多层蓬蓬裙，白色毛绒袖，黑玛丽珍，紫色大眼，怀里抱浅蓝色小水母
- 头发、裙摆、帽边、蝴蝶结要是独立网格，能跟着动作做惯性摆动。眨眼用眼皮网格或缩放，不要整个人一起缩放
- 提供 window.__setTime(seconds)。同一秒必须得到完全相同的姿势。禁止 requestAnimationFrame 自动播放
- 页面加载完成后立刻读取 URL 查询参数 t（秒，缺省 0）并调用 __setTime
- 动画在给定时长内演完，最后一帧回到第一帧的站立姿势，除非动作说明明确要求结尾保持别的姿势
"""


def load_key() -> str:
    key = ""
    if ENV.exists():
        for line in ENV.read_text(encoding="utf-8").splitlines():
            if line.startswith("LONGCAT_API_KEY="):
                key = line.split("=", 1)[1].strip()
    if not key:
        raise SystemExit("taoxi-pet/.env 里没有 LONGCAT_API_KEY")
    return key


def chat(key: str, content: list, max_tokens: int) -> str:
    body = {
        "model": "LongCat-2.5",
        "max_tokens": max_tokens,
        "temperature": 0.7,
        "thinking": {"type": "disabled"},
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": content},
        ],
    }
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:2000]
        raise SystemExit(f"HTTP {exc.code}: {detail}") from exc
    choice = payload["choices"][0]
    message = choice.get("message") or {}
    text = message.get("content") or ""
    usage = payload.get("usage") or {}
    print(f"finish={choice.get('finish_reason')} usage={usage}", flush=True)
    return text


def extract_html(text: str) -> str:
    match = re.search(r"```html\s*(.*?)```", text, re.I | re.S)
    html = match.group(1).strip() if match else text.strip()
    if "<html" not in html.lower() and "<!doctype" not in html.lower():
        start = html.lower().find("<!doctype")
        if start < 0:
            start = html.lower().find("<html")
        if start >= 0:
            html = html[start:]
    if "<html" not in html.lower():
        raise SystemExit("模型没有返回 HTML")
    return html


def build_user(name: str, prompt: str, image_b64: str) -> list:
    return [
        {
            "type": "text",
            "text": (
                f"动画名：{name}\n"
                "下面第一张图是角色参考，也是 t=0 和结尾要回到的站立姿势。"
                "按这段说明做完整段动作。时长用说明里的秒数；若写成区间，取上限。\n\n"
                f"{prompt}"
            ),
        },
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{image_b64}"},
        },
    ]


def generate(name: str) -> Path:
    folder = I2V / name
    prompt = (folder / "prompt.txt").read_text(encoding="utf-8")
    image = (folder / "firstframe.png").read_bytes()
    if name in ("睡觉-开始", "睡觉-起来"):
        last = base64.standard_b64encode((folder / "lastframe.png").read_bytes()).decode()
        extra = (
            "第二张图是结尾必须到达的姿势。第一张是起始姿势。"
            if name == "睡觉-起来"
            else "第一张是起始站立，第二张是结尾必须到达的睡姿，不要在结尾站起来。"
        )
    else:
        last = None
        extra = ""
    content = build_user(name, prompt + ("\n" + extra if extra else ""), base64.standard_b64encode(image).decode())
    if last:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{last}"}})
    print(f"请求 LongCat：{name}", flush=True)
    text = chat(load_key(), content, max_tokens=24000)
    dest = OUT / name
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "raw.txt").write_text(text, encoding="utf-8")
    html = extract_html(text)
    path = dest / "scene.html"
    path.write_text(html, encoding="utf-8")
    print(f"写出 {path} ({len(html)} 字符)", flush=True)
    return path


def render(name: str, seconds: float, fps: int) -> Path:
    html = OUT / name / "scene.html"
    if not html.exists():
        raise SystemExit(f"缺少 {html}")
    frames = OUT / name / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    n = int(round(seconds * fps))
    url_base = html.resolve().as_uri()
    for i in range(n):
        t = i / fps
        png = frames / f"{i:04d}.png"
        if png.exists() and png.stat().st_size > 1000:
            continue
        url = f"{url_base}?t={t:.4f}"
        cmd = [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            "--window-size=1280,720",
            f"--screenshot={png}",
            url,
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if (i + 1) % 12 == 0 or i == 0:
            print(f"  帧 {i + 1}/{n}", flush=True)
    video_dir = ROOT / "video"
    video_dir.mkdir(exist_ok=True)
    mp4 = video_dir / f"{name}.mp4"
    subprocess.run(
        [
            str(FFMPEG),
            "-y",
            "-framerate",
            str(fps),
            "-i",
            str(frames / "%04d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "18",
            str(mp4),
        ],
        check=True,
    )
    print(f"写出 {mp4}", flush=True)
    return mp4


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("name")
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--seconds", type=float, default=8)
    parser.add_argument("--fps", type=int, default=12)
    parser.add_argument("--samples", action="store_true", help="只截 t=0,2,4,6 四张看造型")
    args = parser.parse_args()
    generate(args.name)
    if args.samples:
        html = OUT / args.name / "scene.html"
        url_base = html.resolve().as_uri()
        for t in (0, 2, 4, 6):
            png = OUT / args.name / f"sample-{t}.png"
            subprocess.run(
                [
                    str(CHROME),
                    "--headless=new",
                    "--disable-gpu",
                    "--hide-scrollbars",
                    "--force-device-scale-factor=1",
                    "--window-size=1280,720",
                    "--virtual-time-budget=8000",
                    f"--screenshot={png}",
                    f"{url_base}?t={t}",
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            print(f"sample {png}", flush=True)
    elif args.render:
        render(args.name, args.seconds, args.fps)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
