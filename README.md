# taoxi-pet 🐾

桃汐，住在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 里的桌面宠物。粉色及腰长卷发，半透明白色水母帽（蕾丝、奶黄小耳朵），奶油黄与白色蓬蓬裙，怀里抱着浅蓝色小水母。

作者：李明杰。联系方式：2212013739@qq.com。

代码基于 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet)（Copyright (c) 2026 PC2005-cloud，MIT）。可以商用、修改和再分发，公开使用时必须保留这段署名和仓库里的 `LICENSE`。形象「桃汐」和对应的动画、提示词由李明杰原创。

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-DeepSeek%20Harness%20Web-8A2BE2">
  <img alt="assets" src="https://img.shields.io/badge/assets-dynamic%20animations-ff69b4">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-orange">
</p>

桃汐会待机呼吸、随机动作（打瞌睡、玩魔方、吃火锅……）、左右转向、屏幕漫游、点击 Q 弹、拖拽甩抛反弹、右键菜单点播——一百余个透明动画随时无缝衔接；还能跟随 DSH 会话事件切换工作状态动画、按档位播放余额动画 + 头顶气泡、碎碎念与对话聊天、窗口失焦时弹系统通知。可多开同屏，能脱离浏览器住上**桌面**（透明置顶小窗），也能自己添加**全新宠物种类**（pet pack）。

这不是一个普通插件，而是**完整的三件套项目**：

```
① 提示词（配方）    →  ② 素材生成链（引擎）  →  ③ 插件（成品）
AI 生成动画的配方     源视频 → 透明动画的管线    运行在 DSH 里的宠物
```

任何人 clone 本仓库，都可以**从零生成自己的桌面宠物**——换角色、换动作、换风格，全流程可复现。

---

## 快速开始（安装插件）

两种装法，任选一种：

- **图形化（桌面应用内）**：打开「插件管理」页，在安装框里填 `taoxi-pet`，不用开终端。
- **命令行**：`dsh plugin --profile <profile> add taoxi-pet`，`<profile>` 按你在用的界面填——`dsh web` 填 `web`，桌面应用（Electron 版）填 `desktop`。

**不想装 DSH？** Release 里提供 Windows x64 绿色包 `taoxi-pet-win-x64.zip`，解压后双击 `taoxi-pet.exe` 就能跑——那是独立模式，不依赖 DSH 环境。

装完**重开 DSH**（`dsh web` 用户则重启 `dsh web`）才生效——运行中的进程持有内存里的旧插件。宠物默认落在界面右上角。

前置要求、源码安装、独立模式的用法与打包、Electron 首次下载、装完会看到什么，见 **[INSTALL.md](INSTALL.md)**。

## 插件功能

只做桌宠本身，不碰 DSH 内核；能力就下面这些。

- **100+ 段动画资产**：待机、走动漫游、玩耍、工作、对话等全部表现都由视频动画驱动，按权重首尾相接，也可换成自己的素材。
- **多开与种类**：同时养多只，各自大小与位置；也能自定义宠物种类（pet pack），一类一套动画与素材。
- **三种运行形态**：DSH web 的浏览器 overlay、DSH 桌面应用的透明置顶窗、完全不依赖 DSH 的独立模式。
- **交互与物理**：点击回应、拖拽甩抛、双击弹弓、宠物互撞，同一套物理与 Q 弹挤压手感，参数可调。
- **手机与触屏**：触屏直接拖拽甩抛，与鼠标共用同一套物理与挤压手感；手机浏览器上还能倾斜手机改变重力方向、摇一摇把宠物甩出去、碰撞时震动反馈——三项可在设置页「移动端效果」里分别关闭。传感器只在 HTTPS 或 localhost 下可用（iOS 还需点一次授权），iOS 与桌面端没有振动 API，会自动跳过。
- **碎碎念与对话**：按周期自动说一句，也能随时聊；记忆持久化、可配图、可念出来。
- **语音（说与听）**：对话回复与手动碎碎念会念出来，音色、音量与总开关可配；按住对话窗的话筒说一句，录音转成文字直接填进输入框。
- **余额展示**：内置常见服务商的余额 / 额度查询，按剩余额度分档播动画并弹气泡；也可以登记自己的服务商。
- **工作状态联动**：跟随 DSH 会话状态切档位动画，并在头顶常驻一句话。
- **待办事项**：一句话加可选到期时间，清单挂在宠物头顶；越临近到期提醒越密，由宠物说出来。
- **睡觉**：右键「睡觉」让它睡下，点一下或右键「起来」叫醒；睡着时完全安静——随机动作、碎碎念、余额、待办与工作状态都不打扰，还会按周期说梦话；睡姿可用 `animations.sleep` 配多套（蹲着睡、趴着睡…）。
- **系统通知**：任务完成或需要确认时弹系统通知，点一下回到对应会话。
- **右键菜单**：换动画、开聊、回到原位、打开 DSH / 网站、重载配置。
- **其他**：点击音效、系统托盘与每只宠物的显示位置。

各项能力的详细说明见 **[FEATURES.md](FEATURES.md)**；配置（大小 / 位置 / 多开 / 物理 / 模型 / 人设 / 宠物种类）见 **[CONFIG.md](CONFIG.md)**。

## 🔌 对外接口（供其他插件调用）

桌宠不只自己玩，也**对外开放两条调用通道**，让别的插件或脚本能驱动它、读它的状态。

- **能做什么**：让它说一句指定的话、播一段指定动画、与它对话；读它当前说的话、工作状态、系统通知与余额
- **为什么开放**：桌宠不该只是个摆设——比如一个「女仆」插件巡检验完想说句话，就能让桌宠当它的「实体」开口；也方便任何人基于它做二次开发
- **通道一 · HTTP**：挂在 DSH 自己的 Web 服务上（前缀 `/taoxi-pet-7340`，只监听本机、无鉴权），跨进程、脚本可直接调。动作类接口只回 `{ok}`，数据统一从 `GET /state` 读
- **通道二 · Cordis 服务**：客户端半侧在 DSH web 页面内注册，同页客户端插件用 `ctx.get('petApi7340')` 直接取，零网络、零端口；只在该页面实例内有效，方法与返回见 [`CORDIS.md`](CORDIS.md)

相关文件（HTTP 与 Cordis 各一套）：

- [`API.md`](API.md) —— HTTP 接口一览（每个接口一句话，功能预览）
- [`openapi.yaml`](openapi.yaml) —— 完整契约（OpenAPI 3.1，可直接导入 Swagger UI / Postman）
- [`CORDIS-API.md`](CORDIS-API.md) —— Cordis 服务一览（每个成员一句话，功能预览）
- [`CORDIS.md`](CORDIS.md) —— 对外 Cordis 服务（客户端半侧，页面内 `ctx.get('petApi7340')`，不走网络）
- [`tools/api-tester.html`](tools/api-tester.html) —— HTTP 侧示例：桌宠控制台，扮演第三方消费方，可直观试用（`node tools/api-tester.cjs` 启动）
- [`tools/cordis-probe`](tools/cordis-probe/README.md) —— Cordis 侧示例：扮演同页客户端插件，用 `ctx.get()` 消费服务

## 兼容性

- **操作系统**：Windows / Linux / macOS 三端均可运行——浏览器 overlay 与桌面模式（Electron 透明置顶窗）行为完全一致；Electron 按平台自动探测/下载（`electron.exe` / `Electron.app` / linux 单文件），无需手动安装
- **无头 / 无桌面环境**：支持 Linux headless 等无图形会话——桌面模式自动检测显示环境（Linux 无 `DISPLAY` / `WAYLAND_DISPLAY` 时判定无显示、跳过桌面窗口，仅日志告警），浏览器 overlay 不受影响
- **浏览器**：浏览器 overlay 兼容 **Chromium 内核（Chrome / Edge 等）与 Firefox**——透明动画依赖 VP9-Alpha webm，三者均已实测透明确认；**不支持 Safari**（macOS 不认 webm alpha，透明渲染为黑底）——macOS 用 `.mov` 素材（GitHub Release `assets-mov`），下载放入即可（见「②.5 Safari/HEVC 兼容素材」）
- **多显示器**：支持多屏环境——跨屏漫游/抛掷以各屏工作区为界，异构缩放（各屏 DPI 不同）、任务栏条带、屏幕之间空洞均正确判定（横屏 / 竖屏 / 上下叠放皆可）；设置页「锁定在当前屏幕」可让宠物（抛掷与漫游）只在当前所在那块屏内活动

## 运行效果

桃汐的动作效果。下面这 8 张是常用动作的预览，完整清单在下一节：

<p>
  <img src="taoxi-pet/assets/preview/待机呼吸.gif" width="160" alt="待机呼吸" title="待机呼吸">
  <img src="taoxi-pet/assets/preview/东张西望.gif" width="160" alt="东张西望" title="东张西望">
  <img src="taoxi-pet/assets/preview/螃蟹走路.gif" width="160" alt="螃蟹走路" title="螃蟹走路">
  <img src="taoxi-pet/assets/preview/桃汐悠闲哼歌.gif" width="160" alt="桃汐悠闲哼歌" title="桃汐悠闲哼歌">
  <img src="taoxi-pet/assets/preview/吃饭·碗饭.gif" width="160" alt="吃饭·碗饭" title="吃饭·碗饭">
  <img src="taoxi-pet/assets/preview/工作状态-忙碌点按.gif" width="160" alt="工作状态-忙碌点按" title="工作状态-忙碌点按">
  <img src="taoxi-pet/assets/preview/睡觉-循环.gif" width="160" alt="睡觉-循环" title="睡觉-循环">
  <img src="taoxi-pet/assets/preview/点击回应-开心跃动.gif" width="160" alt="点击回应-开心跃动" title="点击回应-开心跃动">
</p>

## 效果预览

全部动画的 GIF 预览在 `taoxi-pet/assets/preview/`，文件名与 `taoxi-pet/assets/webm/` 里的透明视频一致：

**待机 / 转向**

<p>
  <img src="taoxi-pet/assets/preview/待机呼吸.gif" width="160" alt="待机呼吸" title="待机呼吸">
  <img src="taoxi-pet/assets/preview/东张西望.gif" width="160" alt="东张西望" title="东张西望">
</p>

**移动**

<p>
  <img src="taoxi-pet/assets/preview/螃蟹走路.gif" width="160" alt="螃蟹走路" title="螃蟹走路">
  <img src="taoxi-pet/assets/preview/原地漂浮踏步.gif" width="160" alt="原地漂浮踏步" title="原地漂浮踏步">
  <img src="taoxi-pet/assets/preview/原地左转奔跑.gif" width="160" alt="原地左转奔跑" title="原地左转奔跑">
  <img src="taoxi-pet/assets/preview/侧身急躁跑.gif" width="160" alt="侧身急躁跑" title="侧身急躁跑">
  <img src="taoxi-pet/assets/preview/开心小跑.gif" width="160" alt="开心小跑" title="开心小跑">
</p>

**小动作**

<p>
  <img src="taoxi-pet/assets/preview/桃汐悠闲哼歌.gif" width="160" alt="桃汐悠闲哼歌" title="桃汐悠闲哼歌">
  <img src="taoxi-pet/assets/preview/超大伸懒腰.gif" width="160" alt="超大伸懒腰" title="超大伸懒腰">
  <img src="taoxi-pet/assets/preview/原地敲击桌面互动.gif" width="160" alt="原地敲击桌面互动" title="原地敲击桌面互动">
  <img src="taoxi-pet/assets/preview/原地重力下蹲压缩.gif" width="160" alt="原地重力下蹲压缩" title="原地重力下蹲压缩">
  <img src="taoxi-pet/assets/preview/打哈欠.gif" width="160" alt="打哈欠" title="打哈欠">
  <img src="taoxi-pet/assets/preview/原地小憩沉眠.gif" width="160" alt="原地小憩沉眠" title="原地小憩沉眠">
  <img src="taoxi-pet/assets/preview/女仆屈膝礼仪.gif" width="160" alt="女仆屈膝礼仪" title="女仆屈膝礼仪">
  <img src="taoxi-pet/assets/preview/被吓一跳.gif" width="160" alt="被吓一跳" title="被吓一跳">
  <img src="taoxi-pet/assets/preview/小幅度原地360度旋转展示.gif" width="160" alt="小幅度原地360度旋转展示" title="小幅度原地360度旋转展示">
  <img src="taoxi-pet/assets/preview/偷吃零食被抓住.gif" width="160" alt="偷吃零食被抓住" title="偷吃零食被抓住">
  <img src="taoxi-pet/assets/preview/用小水母触手轻拍.gif" width="160" alt="用小水母触手轻拍" title="用小水母触手轻拍">
  <img src="taoxi-pet/assets/preview/打瞌睡被惊醒.gif" width="160" alt="打瞌睡被惊醒" title="打瞌睡被惊醒">
  <img src="taoxi-pet/assets/preview/照镜子.gif" width="160" alt="照镜子" title="照镜子">
  <img src="taoxi-pet/assets/preview/整体换装试色.gif" width="160" alt="整体换装试色" title="整体换装试色">
  <img src="taoxi-pet/assets/preview/轻快记录.gif" width="160" alt="轻快记录" title="轻快记录">
  <img src="taoxi-pet/assets/preview/写代码.gif" width="160" alt="写代码" title="写代码">
  <img src="taoxi-pet/assets/preview/摇扇纳凉.gif" width="160" alt="摇扇纳凉" title="摇扇纳凉">
  <img src="taoxi-pet/assets/preview/晨间刷牙.gif" width="160" alt="晨间刷牙" title="晨间刷牙">
  <img src="taoxi-pet/assets/preview/下播了.gif" width="160" alt="下播了" title="下播了">
  <img src="taoxi-pet/assets/preview/偷看.gif" width="160" alt="偷看" title="偷看">
  <img src="taoxi-pet/assets/preview/发呆.gif" width="160" alt="发呆" title="发呆">
  <img src="taoxi-pet/assets/preview/喝水.gif" width="160" alt="喝水" title="喝水">
  <img src="taoxi-pet/assets/preview/困惑.gif" width="160" alt="困惑" title="困惑">
  <img src="taoxi-pet/assets/preview/委屈.gif" width="160" alt="委屈" title="委屈">
  <img src="taoxi-pet/assets/preview/害怕.gif" width="160" alt="害怕" title="害怕">
  <img src="taoxi-pet/assets/preview/害羞躲藏.gif" width="160" alt="害羞躲藏" title="害羞躲藏">
  <img src="taoxi-pet/assets/preview/心动.gif" width="160" alt="心动" title="心动">
  <img src="taoxi-pet/assets/preview/思考.gif" width="160" alt="思考" title="思考">
  <img src="taoxi-pet/assets/preview/打招呼.gif" width="160" alt="打招呼" title="打招呼">
  <img src="taoxi-pet/assets/preview/抱抱.gif" width="160" alt="抱抱" title="抱抱">
  <img src="taoxi-pet/assets/preview/无话.gif" width="160" alt="无话" title="无话">
  <img src="taoxi-pet/assets/preview/期待开饭.gif" width="160" alt="期待开饭" title="期待开饭">
  <img src="taoxi-pet/assets/preview/欢迎.gif" width="160" alt="欢迎" title="欢迎">
  <img src="taoxi-pet/assets/preview/比心.gif" width="160" alt="比心" title="比心">
  <img src="taoxi-pet/assets/preview/趴看.gif" width="160" alt="趴看" title="趴看">
  <img src="taoxi-pet/assets/preview/躺下.gif" width="160" alt="躺下" title="躺下">
  <img src="taoxi-pet/assets/preview/送礼物.gif" width="160" alt="送礼物" title="送礼物">
  <img src="taoxi-pet/assets/preview/加油.gif" width="160" alt="加油" title="加油">
  <img src="taoxi-pet/assets/preview/开心跳跃.gif" width="160" alt="开心跳跃" title="开心跳跃">
  <img src="taoxi-pet/assets/preview/生气扔东西.gif" width="160" alt="生气扔东西" title="生气扔东西">
  <img src="taoxi-pet/assets/preview/生气爆气.gif" width="160" alt="生气爆气" title="生气爆气">
</p>

**玩耍**

<p>
  <img src="taoxi-pet/assets/preview/原地专心玩魔方.gif" width="160" alt="原地专心玩魔方" title="原地专心玩魔方">
  <img src="taoxi-pet/assets/preview/原地蹲下玩玩具汽车.gif" width="160" alt="原地蹲下玩玩具汽车" title="原地蹲下玩玩具汽车">
  <img src="taoxi-pet/assets/preview/吹泡泡.gif" width="160" alt="吹泡泡" title="吹泡泡">
  <img src="taoxi-pet/assets/preview/原地跳跃抓碎头顶光球.gif" width="160" alt="原地跳跃抓碎头顶光球" title="原地跳跃抓碎头顶光球">
  <img src="taoxi-pet/assets/preview/玩游戏气急败坏.gif" width="160" alt="玩游戏气急败坏" title="玩游戏气急败坏">
  <img src="taoxi-pet/assets/preview/玩水枪.gif" width="160" alt="玩水枪" title="玩水枪">
  <img src="taoxi-pet/assets/preview/小提琴演奏.gif" width="160" alt="小提琴演奏" title="小提琴演奏">
  <img src="taoxi-pet/assets/preview/小水母蓝光现世.gif" width="160" alt="小水母蓝光现世" title="小水母蓝光现世">
  <img src="taoxi-pet/assets/preview/优雅女仆舞.gif" width="160" alt="优雅女仆舞" title="优雅女仆舞">
  <img src="taoxi-pet/assets/preview/轻快摇摆舞.gif" width="160" alt="轻快摇摆舞" title="轻快摇摆舞">
  <img src="taoxi-pet/assets/preview/可爱宅舞.gif" width="160" alt="可爱宅舞" title="可爱宅舞">
  <img src="taoxi-pet/assets/preview/吹气球.gif" width="160" alt="吹气球" title="吹气球">
  <img src="taoxi-pet/assets/preview/动物环绕.gif" width="160" alt="动物环绕" title="动物环绕">
  <img src="taoxi-pet/assets/preview/放风筝.gif" width="160" alt="放风筝" title="放风筝">
  <img src="taoxi-pet/assets/preview/拆礼物.gif" width="160" alt="拆礼物" title="拆礼物">
  <img src="taoxi-pet/assets/preview/变鸽子.gif" width="160" alt="变鸽子" title="变鸽子">
  <img src="taoxi-pet/assets/preview/扑克魔术.gif" width="160" alt="扑克魔术" title="扑克魔术">
  <img src="taoxi-pet/assets/preview/抽陀螺.gif" width="160" alt="抽陀螺" title="抽陀螺">
  <img src="taoxi-pet/assets/preview/吹笛子.gif" width="160" alt="吹笛子" title="吹笛子">
  <img src="taoxi-pet/assets/preview/蝴蝶蜜蜂环绕头顶开花.gif" width="160" alt="蝴蝶蜜蜂环绕头顶开花" title="蝴蝶蜜蜂环绕头顶开花">
  <img src="taoxi-pet/assets/preview/撸猫.gif" width="160" alt="撸猫" title="撸猫">
  <img src="taoxi-pet/assets/preview/凭空生花.gif" width="160" alt="凭空生花" title="凭空生花">
  <img src="taoxi-pet/assets/preview/骑木马.gif" width="160" alt="骑木马" title="骑木马">
  <img src="taoxi-pet/assets/preview/三球抛接.gif" width="160" alt="三球抛接" title="三球抛接">
  <img src="taoxi-pet/assets/preview/踢毽子.gif" width="160" alt="踢毽子" title="踢毽子">
  <img src="taoxi-pet/assets/preview/下五子棋.gif" width="160" alt="下五子棋" title="下五子棋">
  <img src="taoxi-pet/assets/preview/荡秋千.gif" width="160" alt="荡秋千" title="荡秋千">
</p>

**吃什么**

<p>
  <img src="taoxi-pet/assets/preview/吃饭·碗饭.gif" width="160" alt="吃饭·碗饭" title="吃饭·碗饭">
  <img src="taoxi-pet/assets/preview/吃饭团.gif" width="160" alt="吃饭团" title="吃饭团">
  <img src="taoxi-pet/assets/preview/吃东西.gif" width="160" alt="吃东西" title="吃东西">
  <img src="taoxi-pet/assets/preview/吃%20Token.gif" width="160" alt="吃 Token" title="吃 Token">
  <img src="taoxi-pet/assets/preview/吃早餐.gif" width="160" alt="吃早餐" title="吃早餐">
  <img src="taoxi-pet/assets/preview/吃午餐.gif" width="160" alt="吃午餐" title="吃午餐">
  <img src="taoxi-pet/assets/preview/吃晚餐.gif" width="160" alt="吃晚餐" title="吃晚餐">
  <img src="taoxi-pet/assets/preview/吃冰淇淋融化.gif" width="160" alt="吃冰淇淋融化" title="吃冰淇淋融化">
  <img src="taoxi-pet/assets/preview/吃大闸蟹.gif" width="160" alt="吃大闸蟹" title="吃大闸蟹">
  <img src="taoxi-pet/assets/preview/吃糖葫芦.gif" width="160" alt="吃糖葫芦" title="吃糖葫芦">
  <img src="taoxi-pet/assets/preview/吃长寿面.gif" width="160" alt="吃长寿面" title="吃长寿面">
  <img src="taoxi-pet/assets/preview/吃西瓜.gif" width="160" alt="吃西瓜" title="吃西瓜">
  <img src="taoxi-pet/assets/preview/涮火锅.gif" width="160" alt="涮火锅" title="涮火锅">
</p>

**时节**

<p>
  <img src="taoxi-pet/assets/preview/被落叶淹没.gif" width="160" alt="被落叶淹没" title="被落叶淹没">
  <img src="taoxi-pet/assets/preview/中秋赏月吃月饼.gif" width="160" alt="中秋赏月吃月饼" title="中秋赏月吃月饼">
  <img src="taoxi-pet/assets/preview/堆雪人.gif" width="160" alt="堆雪人" title="堆雪人">
  <img src="taoxi-pet/assets/preview/放烟花.gif" width="160" alt="放烟花" title="放烟花">
  <img src="taoxi-pet/assets/preview/吃粽子.gif" width="160" alt="吃粽子" title="吃粽子">
  <img src="taoxi-pet/assets/preview/吃年糕.gif" width="160" alt="吃年糕" title="吃年糕">
  <img src="taoxi-pet/assets/preview/吃青团.gif" width="160" alt="吃青团" title="吃青团">
  <img src="taoxi-pet/assets/preview/吃腊八粥.gif" width="160" alt="吃腊八粥" title="吃腊八粥">
  <img src="taoxi-pet/assets/preview/吃重阳糕.gif" width="160" alt="吃重阳糕" title="吃重阳糕">
  <img src="taoxi-pet/assets/preview/收红包.gif" width="160" alt="收红包" title="收红包">
  <img src="taoxi-pet/assets/preview/写福字.gif" width="160" alt="写福字" title="写福字">
  <img src="taoxi-pet/assets/preview/穿针乞巧.gif" width="160" alt="穿针乞巧" title="穿针乞巧">
  <img src="taoxi-pet/assets/preview/舞狮头.gif" width="160" alt="舞狮头" title="舞狮头">
  <img src="taoxi-pet/assets/preview/讨糖南瓜灯.gif" width="160" alt="讨糖南瓜灯" title="讨糖南瓜灯">
  <img src="taoxi-pet/assets/preview/插茱萸赏菊.gif" width="160" alt="插茱萸赏菊" title="插茱萸赏菊">
  <img src="taoxi-pet/assets/preview/放河灯.gif" width="160" alt="放河灯" title="放河灯">
  <img src="taoxi-pet/assets/preview/萌化小幽灵.gif" width="160" alt="萌化小幽灵" title="萌化小幽灵">
  <img src="taoxi-pet/assets/preview/装点圣诞树.gif" width="160" alt="装点圣诞树" title="装点圣诞树">
  <img src="taoxi-pet/assets/preview/放孔明灯.gif" width="160" alt="放孔明灯" title="放孔明灯">
  <img src="taoxi-pet/assets/preview/吃汤圆.gif" width="160" alt="吃汤圆" title="吃汤圆">
  <img src="taoxi-pet/assets/preview/吃饺子.gif" width="160" alt="吃饺子" title="吃饺子">
</p>

**文字**

<p>
  <img src="taoxi-pet/assets/preview/是啊，吃什么.gif" width="160" alt="是啊，吃什么" title="是啊，吃什么">
  <img src="taoxi-pet/assets/preview/深度思考碎碎念.gif" width="160" alt="深度思考碎碎念" title="深度思考碎碎念">
</p>

**点击回应**

<p>
  <img src="taoxi-pet/assets/preview/点击回应-开心跃动.gif" width="160" alt="点击回应-开心跃动" title="点击回应-开心跃动">
  <img src="taoxi-pet/assets/preview/点击回应-害羞.gif" width="160" alt="点击回应-害羞" title="点击回应-害羞">
  <img src="taoxi-pet/assets/preview/点击回应-生气.gif" width="160" alt="点击回应-生气" title="点击回应-生气">
  <img src="taoxi-pet/assets/preview/点击回应-挠痒咯咯笑.gif" width="160" alt="点击回应-挠痒咯咯笑" title="点击回应-挠痒咯咯笑">
  <img src="taoxi-pet/assets/preview/点击回应-挥手.gif" width="160" alt="点击回应-挥手" title="点击回应-挥手">
  <img src="taoxi-pet/assets/preview/点击回应-摸头.gif" width="160" alt="点击回应-摸头" title="点击回应-摸头">
</p>

**拖拽**

<p>
  <img src="taoxi-pet/assets/preview/被拖拽悬空.gif" width="160" alt="被拖拽悬空" title="被拖拽悬空">
</p>

**余额事件**（按余额已用百分比分档，满格 → 告急 → 耗尽）

<p>
  <img src="taoxi-pet/assets/preview/余额-钱袋满溢.gif" width="160" alt="余额-钱袋满溢" title="余额-钱袋满溢">
  <img src="taoxi-pet/assets/preview/余额-金袋叮当.gif" width="160" alt="余额-金袋叮当" title="余额-金袋叮当">
  <img src="taoxi-pet/assets/preview/余额-钱袋如常.gif" width="160" alt="余额-钱袋如常" title="余额-钱袋如常">
  <img src="taoxi-pet/assets/preview/余额-数金皱眉.gif" width="160" alt="余额-数金皱眉" title="余额-数金皱眉">
  <img src="taoxi-pet/assets/preview/余额-袋空如洗.gif" width="160" alt="余额-袋空如洗" title="余额-袋空如洗">
  <img src="taoxi-pet/assets/preview/余额-分文不剩.gif" width="160" alt="余额-分文不剩" title="余额-分文不剩">
</p>

**碎碎念说话动画**（碎碎念 / 对话回复触发，随机抽 1 段）

<p>
  <img src="taoxi-pet/assets/preview/碎碎念-擦桌碎碎念.gif" width="160" alt="碎碎念-擦桌碎碎念" title="碎碎念-擦桌碎碎念">
  <img src="taoxi-pet/assets/preview/碎碎念-发呆.gif" width="160" alt="碎碎念-发呆" title="碎碎念-发呆">
  <img src="taoxi-pet/assets/preview/碎碎念-对屏碎碎念.gif" width="160" alt="碎碎念-对屏碎碎念" title="碎碎念-对屏碎碎念">
  <img src="taoxi-pet/assets/preview/碎碎念-偷看.gif" width="160" alt="碎碎念-偷看" title="碎碎念-偷看">
  <img src="taoxi-pet/assets/preview/碎碎念-喝水.gif" width="160" alt="碎碎念-喝水" title="碎碎念-喝水">
</p>

**工作状态动画**（跟随 DSH 会话事件）

<p>
  <img src="taoxi-pet/assets/preview/工作状态-思考.gif" width="160" alt="工作状态-思考" title="工作状态-思考">
  <img src="taoxi-pet/assets/preview/工作状态-忙碌点按.gif" width="160" alt="工作状态-忙碌点按" title="工作状态-忙碌点按">
  <img src="taoxi-pet/assets/preview/工作状态-清点归档.gif" width="160" alt="工作状态-清点归档" title="工作状态-清点归档">
  <img src="taoxi-pet/assets/preview/工作状态-原地踱步张望.gif" width="160" alt="工作状态-原地踱步张望" title="工作状态-原地踱步张望">
  <img src="taoxi-pet/assets/preview/工作状态-比心.gif" width="160" alt="工作状态-比心" title="工作状态-比心">
  <img src="taoxi-pet/assets/preview/工作状态-委屈.gif" width="160" alt="工作状态-委屈" title="工作状态-委屈">
  <img src="taoxi-pet/assets/preview/工作状态-加油.gif" width="160" alt="工作状态-加油" title="工作状态-加油">
  <img src="taoxi-pet/assets/preview/工作状态-感谢.gif" width="160" alt="工作状态-感谢" title="工作状态-感谢">
  <img src="taoxi-pet/assets/preview/工作状态-招手.gif" width="160" alt="工作状态-招手" title="工作状态-招手">
</p>

**睡觉**（右键「睡觉」或鼠标停上去按 `S`；睡着时点一下叫醒）

<p>
  <img src="taoxi-pet/assets/preview/睡觉-开始.gif" width="160" alt="睡觉-开始" title="睡觉-开始">
  <img src="taoxi-pet/assets/preview/睡觉-循环.gif" width="160" alt="睡觉-循环" title="睡觉-循环">
  <img src="taoxi-pet/assets/preview/睡觉-起来.gif" width="160" alt="睡觉-起来" title="睡觉-起来">
</p>

> 注：动画为透明背景；GIF 预览中透明部分显示为页面底色，实际 webm 播放为透明。

## 从零生成你自己的宠物

AI 提示词 → 绿幕视频 → 透明动画 → 插件，换角色、换动作、换风格，全流程可复现。

完整步骤见 **[MAKE-YOUR-OWN-PET.md](MAKE-YOUR-OWN-PET.md)**（提示词配方、素材链、Safari 兼容、发布）。

## 项目结构

只列代码与发布相关目录；素材链的 video / scripts / step / pr 见 [MAKE-YOUR-OWN-PET.md](MAKE-YOUR-OWN-PET.md) 的 ② 章节（gitignore 的本地目录不列）：

```
├── README.md  INSTALL.md  FEATURES.md  MAKE-YOUR-OWN-PET.md  CONFIG.md  API.md  CORDIS.md  openapi.yaml   # 说明 / 安装 / 功能详解 / 宠物制作指南 / 配置 / HTTP 接口 / Cordis 服务 / OpenAPI 规范
├── prompts/           # ① 动画生成提示词（141 段按动画拆开，见 prompts/README.md）
├── assets/            # 仓库展示用截图
├── tools/             # 开发工具：API 调试页、cordis-probe mock 服务商、DPI 探针
├── .github/workflows/ # CI：Safari/HEVC 转码流水线（macOS runner，手动触发 → 发布 assets-mov Release）
├── taoxi-pet/           # ③ 插件（可独立 npm 发布）
│   ├── src/
│   │   ├── host/       # 宿主半侧：配置 / 路由 / 余额 / 工作状态
│   │   ├── client/     # 浏览器半侧：宠物渲染 / 动画链 / 设置页
│   │   ├── shared/     # 双端共用纯逻辑（物理 / 菜单 / 取数）
│   │   └── standalone/ # 独立模式 CLI（不依赖 DSH 直接跑桌宠）
│   ├── lib/            # 构建产物（npm run build 生成，不入库）
│   ├── runtime/        # 桌面模式运行壳（Electron 透明窗）
│   ├── assets/         # webm 动画 / preview GIF / 字体 / 图标 / config.jsonc 默认配置
│   └── scripts/        # 构建、发布与开发脚本
└── LICENSE             # MIT
```

## 相关项目

- **[aipets](https://github.com/kallen-noelle/aipets)** —— Windows 11 桌面宠物，五个角色可多开，透明置顶、点击穿透、甩动带惯性。特色在**动作由大模型决定**：每轮对话后模型结合时间、天气、电量与好感度挑动作，无人说话时还能排出接近一整天的编排，模型不可用时回退内置规则。聊天接任意 OpenAI 兼容接口，带长期记忆、贴纸、画图与工具调用（联网搜索 / Home Assistant / MCP），支持语音朗读与语音输入；同一套代码既有单文件 `aipets.exe` 桌面版，也有浏览器里的整页舞台版。

## 💬 反馈与发版节奏

问题记在本仓库。这个插件专注桌宠与 DSH 本身。代码问题如果来自上游，也可以对照 [dsh-pet 的提交记录](https://github.com/PC2005-cloud/dsh-pet/commits/main)。

- **小修不单独发版**：不影响使用的小 bug 与优化会**累计**到下一个版本一起发，避免版本更迭过于频繁。所以「`main` 上已经修了」不等于「你装的这版已经包含」——`latest` 没更新时，以 `main` 的提交记录为准。
- **想立刻用上未发布的修复**：按 [INSTALL.md](INSTALL.md) 的「从源码安装」把插件指向本地仓库即可；注意**宿主半侧**的代码改动要**重开 DSH** 才生效（浏览器半侧刷新页面即可）。
- **报 bug 时请带上**：插件版本、`dsh` 版本、操作系统、复现步骤（有日志或截图更好）。

## 许可

- **作者**：李明杰。联系方式：2212013739@qq.com。
- **代码**：MIT，版权属于上游 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet)（Copyright (c) 2026 PC2005-cloud）。可以商用、修改、再分发；副本和实质性部分必须带上 `LICENSE` 里的版权声明和许可全文，公开说明里写上上游仓库地址。
- **形象与动画**：桌宠「桃汐」（粉色长发、半透明白色水母帽、灰藏青蝴蝶结、奶油黄白蓬蓬裙、怀里的浅蓝色小水母）以及本仓库的提示词、透明动画，由李明杰原创。可以商用、修改、再分发；副本和实质性部分必须带上 `LICENSE` 里的版权声明和许可全文，公开说明里写上上游仓库地址。
- **再分发**：基于本仓库的公开衍生作品，除了保留上游代码署名，也要注明形象是桃汐。可以商用、修改、再分发；副本和实质性部分必须带上 `LICENSE` 里的版权声明和许可全文，公开说明里写上上游仓库地址。
