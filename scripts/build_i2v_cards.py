"""为桃汐每段动画生成「图生视频」卡片：首帧绿幕图 + 可直接粘贴的提示词。

贴纸程序化动画只能做平面缩放/摇摆，要形象生动的 3D/2.5D 动作必须走 AI 图生视频。
本脚本把现有动画池（stickers_to_step03.CLIPS）拆成 49 张卡片，放到 docs/03-桃汐出片/i2v/<动画名>/：

  firstframe.png   —— 上传用的绿幕首帧
  prompt.txt       —— 整份粘贴的提示词
  lastframe.png    —— 仅睡觉-开始、睡觉-起来（首尾姿势不同）
负面提示词全片一份：docs/03-桃汐出片/i2v/negative.txt。总清单在同目录的 出片清单.md。

推荐工具（任选其一，图生视频 + 固定镜头）：
  · 豆包 / 即梦（Seedance）：上传 firstframe，粘贴 prompt，16:9，约 5–10 秒
  · 可灵：主体参考用三视图_绿幕.png，图生视频用 firstframe
生成的 mp4 按动画名命名（如 待机呼吸.mp4）放进 video/，再跑：
  python scripts/import_ai_videos.py

用法：python scripts/build_i2v_cards.py
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

from sticker_common import ROOT, STICKER_ROOT, clean_sticker, sticker_index
from stickers_to_step03 import BASE_POSE, CLIPS

OUT = ROOT.parent / "docs" / "03-桃汐出片" / "i2v"
GREEN = (0, 255, 0)
W, H = 1280, 720
HEAD_Y, FEET_Y = 0.20, 0.85

# 全局硬约束（每张卡片都会带上）——强调软 3D / 生动，而不是平面贴纸飘动
GLOBAL = """【画面硬约束】
16:9，纯绿幕背景 #00FF00，无阴影、无渐变、无地面、无房间、无文字、无水印。
固定机位正面拍摄，禁止推拉摇移、变焦、镜头晃动、景深变化。
角色全程全身完整入画：头顶（含水母帽）距顶边 ≥10%，脚底距底边 ≥10%，左右 ≥10%。
双脚落点始终在画面水平正中央，禁止平移、漂移、走动出画；只允许原地轴转、原地跳跃、原地重心起伏。

【角色硬约束——桃汐】
Q版二头身软 3D 渲染少女（柔和立体光影、体积感、轻微次表面散射，不要扁平贴纸、不要线稿平面），
粉色及腰长卷发、半透明白色水母帽（蕾丝边、顶上两只奶黄小耳朵、小白花与星星）、两侧灰藏青蝴蝶结、
奶油黄与白色多层蓬蓬裙、白色毛绒袖、黑色玛丽珍鞋、紫色大眼睛；怀里常抱浅蓝色小水母。
发型、服装、配色、头身比必须与首帧图完全一致，禁止换脸、换装、拉长腿、变高。

【动画硬约束——生动】
要有真实的肢体关节运动：手臂、腿、腰、头各自转动；裙摆、长发、水母帽蕾丝、蝴蝶结飘带有惯性二次运动。
眨眼、呼吸起伏、轻微重心转移。动作流畅自然，像高质量 3D 角色动画 / Live2D 高级版，不要整张图一起缩放晃动。
第一帧 = 标准正面站立（与首帧图一致，干净无道具特效）；最后一帧必须恢复到与第一帧完全相同的站立姿态。
"""

NEGATIVE = """flat 2D sticker, paper cutout, rigid whole-body scaling, sliding, floating without feet contact,
camera zoom, camera pan, camera shake, cropped limbs, out of frame, text, watermark, logo,
realistic photo, dark background, room, floor, shadow under feet, green spill on hair or hat,
different face, different outfit, different hair color, elongated legs, adult proportions"""

# 动画名 → 动作正文（秒表）。未列出的用 pose 名自动生成兜底。
ACTIONS: dict[str, str] = {
    "待机呼吸": """时长 6–8 秒，可无缝循环。
0–2s：原地轻微呼吸起伏，胸部与肩膀微动，每隔约 2 秒自然眨眼一次，双手抱着小水母。
2–5s：头部极小幅度左右环顾，长发与水母帽蕾丝随风极轻摆动，裙摆微微晃。
5–结束：头部回正，呼吸放缓，完全回到标准正面站立（与首帧一致）。""",
    "点击回应-开心跃动": """时长 5 秒。
0–1s：抱着小水母微微下蹲蓄力，眼睛亮起来，露出开心笑。
1–2.5s：双脚发力原地向上跳起，双手（或一手）上举欢呼，裙摆与长发上扬，可冒出半透明粉色小心心特效。
2.5–4s：落地屈膝缓冲，小心心淡出。
4–5s：站稳，回到标准正面站立。跳跃最高点时帽顶仍在安全区内。""",
    "点击回应-害羞": """时长 5 秒。
0–1.5s：脸颊迅速泛红，双手捂脸或捂腮，眼睛变成害羞眯眼。
1.5–3.5s：原地轻微左右扭腰，偶尔从指缝偷看一眼。
3.5–5s：双手放下，红晕消退，回到标准正面站立。""",
    "点击回应-生气": """时长 5 秒。
0–1s：双手叉腰，眉头皱起，头顶冒出红色怒气符号。
1–3s：原地跺脚一两下，身体微微前后晃，怒气符号跳动。
3–5s：怒气消散，表情缓和，回到标准正面站立。""",
    "点击回应-挥手": """时长 5 秒。
0–1s：面向镜头露出甜笑，右手抬起。
1–3.5s：右手左右挥手打招呼，左手仍抱小水母，发丝与帽带轻摆。
3.5–5s：手放下，回到标准正面站立。""",
    "点击回应-摸头": """时长 5 秒。
0–1s：被无形的手摸到头，眼睛舒服地眯起。
1–3.5s：双手轻轻按住帽檐附近，享受地左右轻蹭，身体微微前倾。
3.5–5s：直起身，回到标准正面站立。""",
    "被拖拽悬空": """时长 5 秒，可循环感。
0–结束：双脚离地被无形力量提起来，四肢轻柔晃荡，表情略带慌张又可爱，裙摆与长发向下垂落并随晃动摆动。
仍保持画面水平居中，不要飞出画幅；结束帧回到标准正面站立落地。""",
    "余额-钱袋满溢": """时长 5 秒。开心捧出鼓鼓的金色小钱袋，原地小跳庆祝，钱袋可从虚影凝聚再淡出；结束回站立。""",
    "余额-金袋叮当": """时长 5 秒。拎着钱袋轻轻摇晃发出叮当感，表情轻松；钱袋凝聚→摇→淡出；结束回站立。""",
    "余额-钱袋如常": """时长 5 秒。平静数着不大不小的钱袋，轻微点头；结束回站立。""",
    "余额-数金皱眉": """时长 5 秒。皱眉低头数变瘪的钱袋，略带担忧地歪头；结束回站立。""",
    "余额-袋空如洗": """时长 5 秒。翻开空空的钱袋，委屈瘪嘴，肩膀垮下来；结束回站立。""",
    "余额-分文不剩": """时长 5 秒。钱袋消失，摊手无奈，叹气；结束回站立。""",
    "碎碎念-发呆": """时长 6 秒。抱着小水母望向远方发呆，偶尔眨眼，身体缓慢呼吸；结束回站立。""",
    "碎碎念-偷看": """时长 5 秒。侧身从画面一侧的小木板/墙角后探头偷看（墙可从虚到实再消散），然后缩回去再探一次；结束回站立且墙消失。""",
    "碎碎念-喝水": """时长 5 秒。从虚影凝聚出小杯子，喝两口水，满足地呼气，杯子淡出；结束回站立。""",
    "工作状态-思考": """时长 6 秒。托腮思考，眼睛望向斜上方，头顶可冒出半透明思考泡泡再淡出；结束回站立。""",
    "工作状态-加油": """时长 5 秒。握拳给自己加油，原地小幅蹦跳，表情认真又元气；结束回站立。""",
    "工作状态-感谢": """时长 5 秒。双手合十鞠躬致谢，起身后甜笑；结束回站立。""",
    "工作状态-招手": """时长 5 秒。面向镜头招手“轮到你啦”，微微踮脚；结束回站立。""",
    "工作状态-比心": """时长 5 秒。双手比心，眼睛弯成笑眼，可冒小心心特效后淡出；结束回站立。""",
    "工作状态-委屈": """时长 5 秒。瘪嘴委屈，眼眶含泪，肩膀发抖一下，然后吸吸鼻子；结束回站立。""",
    "睡觉-开始": """时长 8–10 秒。【特殊：结尾不要站立】
首帧标准站立 → 打哈欠伸懒腰 → 眼皮沉重 → 慢慢蹲下躺到地上抱着小水母睡着。
最后一帧必须是睡着的姿势，禁止起身。""",
    "睡觉-循环": """时长 4–6 秒，可无缝循环。【特殊：首尾都是同一睡姿】
抱着小水母侧躺睡着，只有轻微呼吸起伏，头顶偶尔冒出半透明 Zzz 再淡出。
第一帧和最后一帧必须是完全相同的睡姿，禁止起身。""",
    "睡觉-起来": """时长 6–8 秒。【特殊：开头是睡姿】
首帧睡着 → 揉眼睛打哈欠 → 慢慢坐起站起来，抱好小水母。
最后一帧必须是标准正面站立。""",
    "打哈欠": """时长 5 秒。大大打一个哈欠，双手上举伸懒腰，眼角带泪，然后恢复；结束回站立。""",
    "喝水": """时长 5 秒。凝聚出杯子喝水，满足，杯子淡出；结束回站立。""",
    "吃东西": """时长 5 秒。凝聚出小吃塞进嘴里鼓腮帮，开心嚼两下，食物淡出；结束回站立。""",
    "发呆": """时长 6 秒。放空发呆，轻微呼吸与眨眼；结束回站立。""",
    "思考": """时长 5 秒。托腮歪头思考，冒思考泡泡再淡出；结束回站立。""",
    "躺下": """时长 5 秒。慢慢躺平摆烂，抱着小水母看天，再坐起来；结束回站立。""",
    "趴看": """时长 5 秒。趴下抬头看你，腿在身后轻轻晃，再站起来；结束回站立。""",
    "开心跳跃": """时长 5 秒。开心原地连跳两下，双手张开，发丝裙摆上扬；结束回站立。""",
    "比心": """时长 5 秒。双手比心，眨眼卖萌；结束回站立。""",
    "抱抱": """时长 5 秒。把小水母抱得更紧，左右轻摇，脸颊贴上去；结束回站立。""",
    "送礼物": """时长 5 秒。从虚影凝聚出礼物盒捧到胸前，开心地递出，再淡出；结束回站立。""",
    "欢迎": """时长 5 秒。张开双臂欢迎，微微鞠躬，再张开；结束回站立。""",
    "打招呼": """时长 5 秒。元气挥手打招呼，踮脚；结束回站立。""",
    "加油": """时长 5 秒。握拳打气，原地跳一下；结束回站立。""",
    "生气爆气": """时长 5 秒。头顶冒火，跺脚，怒气消散；结束回站立。""",
    "生气扔东西": """时长 5 秒。凝聚出一个小抱枕扔出去（出画前淡出），气呼呼；结束回站立。""",
    "害怕": """时长 5 秒。缩成一团抱紧小水母，发抖，四处张望；结束回站立。""",
    "委屈": """时长 5 秒。瘪嘴掉小眼泪，抹眼泪；结束回站立。""",
    "困惑": """时长 5 秒。歪头，头顶冒问号再淡出；结束回站立。""",
    "心动": """时长 5 秒。捧着爱心脸红，原地小跳；结束回站立。""",
    "无话": """时长 5 秒。面无表情摊手，无奈叹气；结束回站立。""",
    "害羞躲藏": """时长 5 秒。把水母帽/半透明罩子拉下来把自己罩住，露半张脸，再掀开；结束回站立。""",
    "偷看": """时长 5 秒。从墙后偷看两下，墙凝聚再消散；结束回站立。""",
    "下播了": """时长 5 秒。挥手再见，微微鞠躬，像要下播；结束回站立。""",
}

# 睡觉三段用睡姿贴纸做 last/first（循环）
SLEEP_POSE = "晚安"

PRIORITY = {
    "待机呼吸": 1,
    "点击回应-开心跃动": 1,
    "点击回应-害羞": 1,
    "点击回应-生气": 1,
    "点击回应-挥手": 1,
    "点击回应-摸头": 1,
    "被拖拽悬空": 1,
    "工作状态-思考": 1,
    "工作状态-加油": 1,
    "工作状态-感谢": 1,
    "工作状态-招手": 1,
    "工作状态-比心": 1,
    "工作状态-委屈": 1,
    "碎碎念-发呆": 1,
    "碎碎念-偷看": 1,
    "碎碎念-喝水": 1,
    "余额-钱袋满溢": 1,
    "余额-金袋叮当": 1,
    "余额-钱袋如常": 1,
    "余额-数金皱眉": 1,
    "余额-袋空如洗": 1,
    "余额-分文不剩": 1,
    "睡觉-开始": 2,
    "睡觉-循环": 2,
    "睡觉-起来": 2,
}


def standing_frame() -> Image.Image:
    src = ROOT / "taoxi" / "greenscreen" / "首帧_1280x720.png"
    if src.exists():
        return Image.open(src).convert("RGB")
    # 兜底：从主立绘现拼
    portrait = Image.open(STICKER_ROOT / "立绘与三视图" / "01_主立绘_透明底.png").convert("RGBA")
    portrait = portrait.crop(portrait.getbbox())
    target_h = round(H * (FEET_Y - HEAD_Y))
    im = portrait.resize((round(portrait.width * target_h / portrait.height), target_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), GREEN + (255,))
    canvas.alpha_composite(im, ((W - im.width) // 2, round(H * HEAD_Y)))
    return canvas.convert("RGB")


def pose_frame(pose: str) -> Image.Image:
    """把贴纸摆到绿幕画布上（用于睡觉首/尾帧）。"""
    im = clean_sticker(sticker_index()[pose])
    target_h = round(H * (FEET_Y - HEAD_Y) * (0.55 if pose in ("晚安", "躺下", "趴看") else 1.0))
    im = im.resize((round(im.width * target_h / im.height), target_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), GREEN + (255,))
    x = (W - im.width) // 2
    y = round(H * FEET_Y) - im.height if pose in ("晚安", "躺下", "趴看") else round(H * HEAD_Y)
    canvas.alpha_composite(im, (x, max(0, y)))
    return canvas.convert("RGB")


def action_text(name: str) -> str:
    if name in ACTIONS:
        return ACTIONS[name]
    # 兜底：用贴纸姿势名写一句
    pose = CLIPS[name].segs[0].pose
    return f"时长 5 秒。从标准站立开始，做出「{pose}」的生动肢体动作（关节运动 + 头发裙摆二次运动），再回到标准正面站立。"


def build_prompt(name: str) -> str:
    special = ""
    if name == "睡觉-开始":
        special = "\n【本段例外】最后一帧必须是睡着姿势，不要回到站立。\n"
    elif name == "睡觉-循环":
        special = "\n【本段例外】首尾帧必须是完全相同的睡姿，全程不要站起来。\n"
    elif name == "睡觉-起来":
        special = "\n【本段例外】第一帧是睡着姿势，最后一帧才回到站立。\n"
    return (
        f"桌宠角色动画素材，图生视频。严格保持与参考首帧同一角色。\n\n"
        f"{GLOBAL}{special}\n"
        f"【本段动作：{name}】\n{action_text(name)}\n"
    )


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    stand = standing_frame()
    sleep = pose_frame(SLEEP_POSE) if SLEEP_POSE in sticker_index() else stand
    # 三视图复制一份到 i2v 根，方便当主体参考
    sheet = ROOT / "taoxi" / "greenscreen" / "三视图_绿幕.png"
    if sheet.exists():
        shutil.copy2(sheet, OUT / "三视图_绿幕.png")

    index = []
    for name in CLIPS:
        d = OUT / name
        d.mkdir(exist_ok=True)
        if name == "睡觉-循环":
            sleep.save(d / "firstframe.png")
        elif name == "睡觉-开始":
            stand.save(d / "firstframe.png")
            sleep.save(d / "lastframe.png")
        elif name == "睡觉-起来":
            sleep.save(d / "firstframe.png")
            stand.save(d / "lastframe.png")
        else:
            stand.save(d / "firstframe.png")
            last = d / "lastframe.png"
            if last.exists():
                last.unlink()
        for stale in ("negative.txt", "meta.json"):
            p = d / stale
            if p.exists():
                p.unlink()
        (d / "prompt.txt").write_text(build_prompt(name), encoding="utf-8", newline="\n")
        meta = {
            "name": name,
            "priority": PRIORITY.get(name, 3),
            "duration_sec": 5 if not name.startswith("睡觉") and name != "待机呼吸" else 8,
            "mp4_name": f"{name}.mp4",
        }
        index.append(meta)
        print(name)

    index.sort(key=lambda m: (m["priority"], m["name"]))
    (OUT / "INDEX.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "negative.txt").write_text(NEGATIVE + "\n", encoding="utf-8", newline="\n")
    print(f"\n{len(index)} cards -> {OUT}")
    print("清单见 出片清单.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
