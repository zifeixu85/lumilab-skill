# Lumi Lab

> **把一句话想法，送进创业实验室。看清楚 · 测一下 · 下一步。**

[English](README.en.md) ｜ 简体中文

从一个念头，到判断它到底值不值得做 —— 查需求、想定位、做验证页、发出去、读数据，中间这段路 **Lumi Lab 替你跑**。它是一套装进你 AI 助手的技能包：给一句话想法，它自动接力做完，最后给你一个能测真实意愿的验证页，和一份「接着做什么」的判断。

[![版本](https://img.shields.io/badge/version-1.14.2-orange)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-26-blue)](skills/)
[![宿主](https://img.shields.io/badge/hosts-Claude_Code_·_OpenClaw_·_Hermes_·_Cursor_·_Codex-555)](docs/SKILLS.md)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green)](LICENSE)

## 🚀 一键安装

把这段话发给你的 AI 宿主（Claude Code / OpenClaw / Cursor / Codex…），它会自己装好（整段可直接复制）：

```text
帮我装 Lumi Lab：跑 curl -fsSL https://get.lumiclaw.ai | bash ，装完告诉我怎么用。
```

或自己在终端跑：

```bash
curl -fsSL https://get.lumiclaw.ai | bash
```

装到所有检测到的 AI 宿主（Claude Code / OpenClaw / Codex / Gemini）的 skills 目录；重跑即升级，本地数据保留。也可 `git clone` —— 见下方 [安装](#安装)。

---

## 不是给想法打个分，是带它走完一次验证

你有个想法，但心里没底：

> 「我觉得肯定有人需要……但多少人在找、谁在做、为什么不满意，我没认真查过。」
> 「想做的功能列了十个，结果一个没开始 —— 不知道先做哪个。」
> 「想测有没有人要，可连个像样的页面、一段能发的文案、一张图都做不出来。」
> 「页面做好了，该先发朋友圈还是小红书？发完没人理怎么办，心里完全没谱。」
> 「有人收藏、有人问、网页没人留邮箱……这到底算成了没成？下一步干嘛？」

Lumi Lab 把这几段路一步步替你跑完 ——

- **① 看清楚** · 先把脑子里那团模糊理清楚：做什么、给谁、赌哪一点。
- **② 测一下** · 网页、小红书、朋友圈、海报，挑省力的方式放出去，看真人怎么反应。
- **③ 下一步** · 数据回来，帮你读懂：接着做、换方向、还是先停一停。

展开就是 6 步：**想法澄清 → 看清地形（市场 / 竞品 / 痛点）→ 定位（做什么 · 给谁 · 怎么收费）→ 做出能测的东西（验证页 / 文案 / 配图 / 收款）→ 发出去（冷启动计划）→ 读数据定下一步**。

> 它给你**参考基线和解读，但不替你下成败结论** —— 每个项目基数不同，继续 / 调整 / 先停，最后你拍板。

---

## 一句话，跑完整条路

装好后，对你的 AI 说一句「帮我用 Lumi Lab 验证一个想法」，剩下交给它：自动跑市场分析、竞品扫描、方向建议，做出一个能测真实购买意愿的验证页；全程**只在两个真正要你拍板的地方停下来**，其余自动跑完。每一步都渲染成网页主动推给你看，不是丢一堆文件了事。

- **上手零配置** —— 核心流程开箱即用，不用先配一堆账号。
- **用你 AI 自己的脑子** —— 不用再给一个 LLM key，你的 Claude Code / Codex / OpenClaw 已经有了。
- **数据在你本地** —— venture、配置、密钥都在 `~/.lumilab/`，不上报。
- 联网调研 / 一键部署 / 生图等会用到第三方服务，需要各自的 Key，但**全部可跳过**，不填也能完整跑一遍。

---

## 26 个技能，覆盖从想法到验证的每一步

每个技能背后都有一套成熟方法论（Mom Test、April Dunford 定位、Sean Ellis PMF、YC office hours…）。你不用一个个学 —— **给一句话，它们自己接力**：调研 → 产品 → 文案 → 落地页 → 发布，一路做到能测真实意愿的验证页。

- **想法 → 验证 编排器** · 默认入口，把其它技能串起来的总指挥。
- **作战室 Studio** · 整个过程渲染成网页给你看，常驻服务、改了自动刷新。
- **假设账本** · 每次判断都留痕，可回头复盘、可 pivot 不丢历史。
- **下一步行动引擎** · 反馈回来，告诉你接着具体做什么。
- **创始人教练** · 想找人把某个问题聊透，随时在。

全部 26 个技能的一行说明见 [`docs/SKILLS.md`](docs/SKILLS.md)。

---

## 安装

### 前置依赖（自动处理，一般不用管）

- **bun ≥ 1.0**（运行时 + 脚本）—— **`install.sh` 检测到缺失会自动安装**；宿主 chat 路径下每个 SKILL.md 的 `## 环境自检` 段会让 agent 自己装
- **wrangler**（Cloudflare CLI；只在你要用 `lumilab deploy` 时需要）
- **qrencode**（可选，`lumilab manage` 生成二维码用）

需要手动装的话：

```bash
curl -fsSL https://bun.sh/install | bash    # install.sh 会自动做这步
npm install -g wrangler                      # 仅 deploy 用
brew install qrencode                        # 可选；或 apt install qrencode
```

### 安装 skills bundle

**最简单：把这段话发给你的 AI agent（Claude Code / OpenClaw / Cursor…），它会自己装好（整段可直接复制）：**

```text
帮我装 Lumi Lab：跑 curl -fsSL https://get.lumiclaw.ai | bash ，装完告诉我怎么用。
```

或自己在终端跑这条命令（效果一样）：

```bash
curl -fsSL https://get.lumiclaw.ai | bash
```

它会：检测系统 → 下载并校验 → 装到**所有检测到的宿主**的 skills 目录：

| Agent | 目录 |
|---|---|
| Claude Code | `~/.claude/skills/` |
| OpenClaw | `~/.openclaw/skills/` |
| Codex CLI | `~/.codex/skills/` |
| Gemini CLI | `~/.gemini/skills/` |

bun 缺失会自动安装。**重跑同一条命令即升级，本地数据（venture / 配置 / 密钥）完整保留**，升级前自动备份可回滚。

> **Cursor**（仅项目级）：在项目根目录跑
> `mkdir -p .cursor/skills && cp -R ~/.claude/skills/lumilab-* .cursor/skills/`

#### 从 GitHub 直接装（仓库 = [`zifeixu85/lumilab`](https://github.com/zifeixu85/lumilab)）

```bash
git clone https://github.com/zifeixu85/lumilab.git
cd lumilab
./install.sh            # 自动检测 Claude Code / Codex / OpenClaw / Gemini，装到每一个
```

`install.sh` 把整个 `skills/` 装到所有检测到的宿主，CLI 装到 `~/.lumilab/bin/`，升级前自动备份旧版可回滚。**只装到某一个宿主**：`./install.sh --target ~/.codex/skills`（例如只给 Codex）。

> 仓库已公开，`git clone` 无需登录。

#### 其它安装路径

- **飞书 Hermes（chat 内一句话）**：在已接好的 chat 里发 `/skills install https://github.com/zifeixu85/lumilab`，Hermes 静态扫描后写入 `~/.hermes/skills/lumilab/`
- **OpenClaw 原生命令**：`openclaw skills install lumilab && openclaw gateway restart`（飞书 bot 可选：`openclaw channels login --channel feishu`）

### 入口：「打开 lumilab」

装完不知道从哪开始？**在你的 AI 宿主里说一句「打开 lumilab」** —— 触发 `lumilab-home` 门面 skill：

- **首次** → 自动引导你走 **6 步首次引导页**（产品玩法 → 选界面风格 → 身份 → 偏好 → 工具 token → 完成）。工具 token **全部可跳过**。
- **回访** → 渲染 **home dashboard**：已配工具 ✓/—、所有 venture 及各自流水线进度、建议的下一步。

CLI 等价：`lumilab`（裸命令）或 `lumilab home`。飞书等 chat 环境的引导走 `wizard.ts --chat-onboard` 文本版。

### 试试 demo

```bash
lumilab list
lumilab studio lumilab-meta
```

在浏览器里打开自指 demo venture。

### 你自己的 idea（默认流程）

```bash
lumilab idea "给小红书 KOL 的 AI 内容工厂"
```

然后在**你的 AI 宿主**里（Claude Code、OpenClaw、飞书 @bot 等）说一句：

> 「用 lumilab-idea-to-landing 帮我把这个 idea 跑完整条流水线」

宿主 LLM 会自动跑：市场分析 → HTML 报告 → 方向选择（问你一次）→ 设计 + landing。产物会主动推给你。

最后一条命令上线验证：

```bash
lumilab deploy <venture>   # 发布 + 加密 + URL + 密码，30 秒
```

---

## 命令

```
lumilab idea "<一句话想法>"      ★ 默认入口：idea → 分析 → 方向 → landing
lumilab new "<想法>"            只建 venture 目录（手动流程）
lumilab list                    列出所有 venture
lumilab studio [venture]        浏览器打开 Studio（守护进程在跑则直接开它）
lumilab serve <start|stop|status|restart|open>   常驻 Studio 守护进程（固定端口，文件变更自动刷新）
lumilab render [venture]        重新渲染 Studio HTML

lumilab design-direction [venture]    选美学方向 + 旋钮 + 实时预览
lumilab deploy <venture>              部署到 Cloudflare Pages（带密码门）
lumilab manage                        管理所有已部署的 Studio
lumilab config                        Setup Wizard

lumilab retro [venture]               周复盘四桶交互页
lumilab payment create [...]          创建 Stripe 验证用 payment link（test mode）
lumilab payment sync <venture>        只读回读真实付款 → 验证信号（--mock 写样例）
lumilab research-xhs "<关键词>" [...]  小红书抓笔记（需 TIKHUB_API_KEY，无 key 自动 mock）
lumilab research-web  "<查询>"  [...]  Exa Web 搜（需 EXA_API_KEY，无 key 自动 mock）
lumilab secrets <动作> [...]           keychain CLI：which|get|set|del|list|migrate-plaintext

lumilab help                          显示帮助
```

在 Claude Code / OpenClaw 里，`coach / clarify / research / build-assets / launch / review` 这些 skill 通过**对话式**调用：

> 「为 venture xhs-factory 跑 lumilab-research-platforms，通道：web + xhs」

---

## 盒子里有什么

| 层 | 数量 | Skills |
|---|---|---|
| **门面 / 入口** | 1 | **lumilab-home**（首次引导 + home dashboard：工具状态 / venture 进度 / 下一步） |
| **Orchestrator** | 1 | **idea-to-landing**（一句话 idea → 分析 → 方向 → 验证页 全自动流水线） |
| **核心（自建）** | 6 | hypothesis-ledger、founder-coach、landing-mvp（含 SEO/GEO + theme.css）、content-repurpose、weekly-sop-runner、**next-actions**（信号 → 多方向下一步：看板 + 脑图 + 打印） |
| **基础设施** | 4 | config（Setup Wizard + Share Manager）、deploy（Cloudflare + 加密）、research-platforms（小红书 + Web）、**payment-link**（Stripe 真 checkout + 付款回流） |
| **渲染** | 1 | studio（常驻服务 + Studio HTML + 市场分析报告 + 看板/脑图/付款/re-theme） |
| **Overlay（上游封装）** | 12 | coach-yc、research-{interview,icp,competitor,keywords}、product-{positioning,pmf,mvp}、copy、launch-strategy、metrics、design-direction |
| **知识** | 1 | playbook-cn（13 个框架 + 中国平台规则索引） |

> `research-keywords` 是定量搜索需求验证（DataForSEO / Keywords Everywhere 查搜索量、KD、红蓝海），和 `research-platforms` 的定性痛点互补。`idea-to-landing` Phase 1 会自动跑它。

每个 skill 是 `skills/<name>/SKILL.md` 加上可选的 `scripts/`、`references/`、`templates/`、`tests/`。打开一个读读——是宿主 LLM 直接消费的扁平 Markdown。

---

## 跟一个「超级 prompt」有什么区别

超级 prompt 是文本。Lumi Lab 是一个工作区。

| 超级 prompt | Lumi Lab |
|---|---|
| 无状态。每次会话重新粘贴。 | `~/.lumilab/` 就是状态。 |
| 一个作者的口吻。 | 26 个独立 skill，各有各的纪律。 |
| 输出是丢进聊天框的文本。 | 输出是文件：HTML、YAML、CSV、MD。可 diff、可部署。 |
| 「试试这个方法。」 | atomic 假设账本，带 supersede 历史。 |
| 难分享。 | `lumilab deploy` → 30 秒一个加密的公开 Studio。 |
| 忘了上周。 | `~/.lumilab/` 里的 PARA 三层记忆。 |

---

## 质量纪律

操作型 skill 的 SKILL.md 内联完整流水线与命令细节（宿主执行时照做）；方法论类 skill 精简 SKILL.md + 完整详版在 `references/full-guide.md`（progressive disclosure）。每个 skill 都带可独立运行的 `scripts/validate-output.ts`（输出结构校验）+ `scripts/anti-slop-lint.ts`（反 AI 味文案检查）。

---

## 文档

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 技术架构
- [`docs/SKILLS.md`](docs/SKILLS.md) — 26 个 skill 索引，一行说明
- [`CHANGELOG.md`](CHANGELOG.md) — 版本变更

---

## 主要能力

> 逐版本变更见 [`CHANGELOG.md`](CHANGELOG.md)（当前 v1.14.0）。

- **常驻 Studio 守护进程** — `lumilab serve start`，固定端口统一服务所有 venture + home，文件变更 → 已打开页面**自动刷新**，访问时惰性重渲（不用 agent 手动 render）。
- **`lumilab-next-actions` 决策引擎** — 读全量 venture 数据 → 对照信号基线 → 多方向候选下一步。Studio 内联**看板**（原生拖拽持久化）+ **脑图**（离线渲染、断网可用）+ 可打印。
- **付款数据回流** — `lumilab payment sync` 只读回读真实 Stripe 付款笔数/金额（脱敏）→ 对照基线判信号 → 回写假设 → 喂 next-actions。付款是比留邮箱强 1000× 的需求信号。
- **落地页 `theme.css` + 实时 re-theme** — 构建阶段真实落地页 iframe + 设计面板并排，拖旋钮**立刻可见**；「应用设计」确定性写回 `theme.css`（不调 LLM）。
- **第一方埋点 + 内容配图 + 宿主代搜兜底** — 公开验证页第一方埋点（数据进你自己的 CF），小红书/朋友圈/活动长图配图，无 API key 时用宿主自身知识兜底调研。

## 当前状态

✅ 已就绪：
- **26 个 skill**，完整 SKILL.md + frontmatter，每个带 `validate-output.ts` 校验器 + `anti-slop-lint.ts` 文案检查器
- 常驻 Studio 服务（SSE 自动刷新）+ Studio HTML 渲染引擎（编辑式美学）+ 看板/脑图/付款验证/实时 re-theme
- Setup Wizard / Share Manager / Design Direction 三个浏览器 UI
- Cloudflare 部署 + 客户端加密（AES-GCM + PBKDF2 1M）+ localStorage 密码缓存
- Stripe 真 checkout 创建 + 只读付款回流（脱敏）
- 真 keychain 后端（macOS Keychain / Linux secret-tool）+ XHS / Exa 真集成 + 无 token 时 mock 降级
- 5 个中国平台规则表（2025–2026 更新）+ PARA 三层记忆布局
- 自指 demo venture（`lumilab demo` 一键装载）
- 每个 skill 都带可独立运行的输出校验器（validate-output.ts）+ 反 AI 味文案检查器（anti-slop-lint.ts）
- 两条安装通道都已发布最新：`curl get.lumiclaw.ai`（CF Pages）+ `git clone github.com/zifeixu85/lumilab`

详见 [`CHANGELOG.md`](CHANGELOG.md)。

---

## License

[AGPL-3.0](LICENSE) —— 可自由用 / 改 / 自部署；改了再分发、或作为网络服务提供，需同样以 AGPL 开源。商业 / 闭源授权另议。

## 致谢

**方法论**：YC office hours · Mom Test（Rob Fitzpatrick）· Lean Startup（Eric Ries）· Sean Ellis 40% PMF · April Dunford · Bob Moesta JTBD · Marc Lou · Lenny Rachitsky · Thariq Shihipar（HTML 有效性）

**上游 skill**（启发了模式/方法，未打包其代码）：garrytan/gstack（autoplan 一键决策流水线 · office-hours 决策简报）· JimLiu/baoyu-skills（跨 runtime 输入 + 出图抽象）· Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research

**基础设施**：Cloudflare Pages · wrangler · Web Crypto API · bun · Fraunces · JetBrains Mono · Geist
