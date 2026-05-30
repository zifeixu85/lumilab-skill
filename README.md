# Lumi Lab

> **给创业者的 Skills bundle。把一个模糊的想法，7 天跑成一次市场实验。**

[English](README.en.md) ｜ 简体中文

**Lumi Lab** 是一套 26 个 skill 的 bundle，跑在 **Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI** 里。把它丢进你 AI 宿主的 skills 目录——**给它一句话 idea，它自动跑市场分析、提方向建议、生成带 SEO/GEO 的 landing 页**。全程最多问你两次。模糊的想法进，能验证的 landing 页出。

🎬 **演示视频**：[https://www.bilibili.com/video/BV15o5862EHV/](https://www.bilibili.com/video/BV15o5862EHV/)

[![版本](https://img.shields.io/badge/version-1.10.0-orange)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-26-blue)](skills/)
[![宿主](https://img.shields.io/badge/hosts-Claude_Code_·_OpenClaw_·_Hermes_·_Cursor_·_Codex-555)](docs/TUTORIAL.zh.md)
[![SkillLens](https://img.shields.io/badge/SkillLens-26_S_·_avg_92.6_·_verified-brightgreen)](docs/SKILLLENS_REPORT.md)

---

## 它是什么，不是什么

| Lumi Lab 是 | Lumi Lab 不是 |
|---|---|
| 一套 **Skills bundle**，丢进 `~/.claude/skills/` 用 | 一个独立的 Agent 产品 |
| 在 Claude Code / OpenClaw / Cursor 里被调用 | 一个 web app 或 SaaS |
| 产出文件：HTML、YAML、CSV、Markdown | 提供一个聊天界面 |
| **用你宿主自己的 LLM** | 要你自己的 LLM API key |
| 读写 `~/.lumilab/` 做状态 | 偷偷上报数据 |

**你不用给 Lumi Lab LLM API key。** 你的 AI 宿主已经有了——Lumi Lab 接进去就行。它要的那些可选 token 都是**工具集成**（Cloudflare 部署 Studio、Tavily 做网页搜索、TikHub 拿小红书 API 等）。

---

## 为什么有这东西

**Skill 不再稀缺，编排才稀缺。**

难的不是找一个 prompt 或一个 skill，而是知道：

- 有了新想法，该串哪些 skill
- 哪些平台规则是真的要命的（小红书标题 ≤ 38 字、X thread ≤ 7 条…）
- 假设该 pivot 了，而不是继续打磨 landing page
- 怎么发一个不像 AI demo 的私密项目 Studio

Lumi Lab 把这些答案编码成 26 个自包含的 skill + 一个共享的 `~/.lumilab/` 状态目录 + 一个**常驻 Studio 服务**（文件变更自动刷新浏览器）+ 3 个浏览器工具 UI（Setup Wizard、Share Manager、Design Direction）。

---

## 你得到什么

### 一句话 idea → 能测购买意愿的验证页（默认流程）

Lumi Lab 是 **C 端创业 idea 的快速验证工具**。`lumilab-idea-to-landing` 是默认入口，autoplan 式自动流水线：

```
你：一句话 idea
 ↓  （最多问你一次可选的补充，能跳过就跳过）
自动：市场分析 + 竞品扫描 + 人群拆解
 ↓
交付：图文并茂的 HTML 分析报告 + 3-5 个具体方向建议
 ↓  （唯一一次决策：选个方向，或说「你来定」）
自动：设计 + 文案 + 生成 fake-door 验证页（带 SEO/GEO）
 ↓
交付：可部署的验证页 —— 真实「立即购买/留邮箱」CTA + 转化追踪
       上线几天，回收「有多少人表达了购买意愿」这个数字
```

最终产出的 landing **不是营销页，是验证仪器**——它的工作是测量需求信号（CTA 点击率、邮箱留资率）。不是陪你聊天、一步步追问，是**帮你判断 + 帮你做出验证工具**。中间产物全部 HTML 主动推给你看，不静默落盘。

社媒验证：`lumilab-content-repurpose --validate` 还能生成专门测意愿的小红书/推特素材。验证跑完，`lumilab retro` 帮你把数字归到强/中/弱信号、判断继续还是 pivot。

### 一个可选的深度教练

需要被深挖、想把某个具体问题想透时，才用 `lumilab-founder-coach`：方法论 / 认知陷阱 / 心理向三层。**它也不再一次一个问题磨**——先给分析判断，再批量问，一轮 session 最多 2-3 次提问。

### 一个永不删除的假设账本

每个假设都是一条带 `id`、置信度、验证方法、证据、supersede 历史的 atomic YAML。你可以 pivot——旧假设保留 `status: superseded` + `superseded_by: <新 id>`。Studio 把 diff 内联渲染出来。

### 每个 venture 一个 Studio（常驻服务，实时刷新）

每个想法有自己的项目页——一份可打印的实验日志，编辑式排版（Fraunces 衬线 + JetBrains Mono）、SVG 进度时间线、假设卡片、决策轨迹。暖纸色 OKLCH + 颗粒噪声纹理。

`lumilab serve start` 起一个**常驻 Studio 守护进程**（固定端口，统一服务所有 venture + home）：改任意 venture 数据，**已打开的页面自动刷新**，不用手动重渲。Studio 里还内联了几块实时交互：

- **下一步行动**（复盘阶段）：决策引擎把本轮信号收敛成多方向候选 → **看板**（原生拖拽，drop 即持久化）+ **脑图**（离线渲染，断网可用）+ `@media print` 可打印贴墙。
- **付款验证**（启动阶段）：`lumilab payment sync` 只读回读真实 Stripe 付款 → 「N 笔 · ¥X · 转化 Y% · 强信号」（脱敏，不存邮箱/卡）。
- **实时 re-theme**（构建阶段）：真实落地页放进 iframe + 设计面板并排，**拖旋钮 → 落地页立刻变**；「应用设计」确定性写回 `theme.css`（不调 LLM）。

### 三个浏览器 UI（不需要 LLM）

- **Setup Wizard**（`lumilab config`）— 5 步。问你真正需要的工具 token：Cloudflare、Tavily、TikHub。**从不问 LLM key。**
- **Share Manager**（`lumilab manage`）— 列出每个已部署的 Studio，可显示密码 / rotate / 删除。
- **Design Direction**（`lumilab design-direction <venture>`）— 4 套美学样本 + 3 个旋钮（variance / motion / density）+ iframe 实时预览。产出 `design_direction.json` 供下游 skill 消费。

### 一条命令部署 + 密码门

```
$ lumilab deploy my-venture

  🔑 使用密码：••••••
  🔒 加密中（AES-GCM + PBKDF2 1M 迭代）
  ☁️  wrangler pages deploy → my-venture-yourname.pages.dev

  ✅ 已部署
     URL：     https://my-venture-yourname.pages.dev
     密码：    728345   （单独分享）
```

访客输一次密码。勾上「在此设备记住」后，刷新或新开标签页不再重复要密码——rotate 密码时 localStorage 缓存自动失效。

### 平台规则内置

5 个中国平台（小红书、公众号、抖音、朋友圈、X）各有硬规则，存在 `skills/lumilab-playbook-cn/references/platform-rules/`：

```
xiaohongshu.md：
- 标题 ≤ 38 字（中文 ×2，英文 / 数字 ×1）
- 图文必有图（无图不可发）
- 图 / 视频不可混用
- 首图必须可读
- 标签 3–10 个
- 正文不放外链
```

内容 skill 在生成任何东西之前先读这些规则。不靠 LLM「推断」——是写下来的规则。2025–2026 最新更新已纳入。

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

**最简单：把这句话发给你的 AI agent（Claude Code / OpenClaw / Cursor…），它会自己装好：**

> 帮我装 Lumi Lab：跑 `curl -fsSL https://get.lumiclaw.ai | bash`，装完告诉我怎么用。

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

> 私有仓库需要你已登录 GitHub（`gh auth login` 或配好 SSH key）。

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

## 质量评测

26 个 skill 全部跑过 [SkillLens](https://github.com/Yannickdes/SkillLens) 官方 agent-side Deep Review，**全部 S 级，平均 ~92.6 / 100，`deepReviewCertificate` 全部 `verified`**。每个 skill 都带可独立运行的 `scripts/validate-output.ts` 输出校验器 + `scripts/anti-slop-lint.ts` 文案检查器，完整操作详版放在 `references/full-guide.md`（progressive disclosure，按需加载）。

详见 [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md)。

---

## 文档

- [`docs/TUTORIAL.zh.md`](docs/TUTORIAL.zh.md) — 完整中文上手指南（三种宿主路径 + 飞书入门）
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 技术架构
- [`docs/SKILLS.md`](docs/SKILLS.md) — 26 个 skill 索引，一行说明
- [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md) — SkillLens 评测报告
- [`CHANGELOG.md`](CHANGELOG.md) — 版本变更

---

## 1.10.0 新增（决赛优化 W1–W4）

- **W1 · 常驻 Studio 守护进程** — `lumilab serve start`，固定端口统一服务所有 venture + home，文件变更 → 已打开页面**自动刷新**，访问时惰性重渲（不用 agent 手动 render）。
- **W2 · `lumilab-next-actions` 新 skill** — 决策引擎：读全量 venture 数据 → 对照 R6 信号基线 → 多方向候选下一步。Studio 内联**看板**（原生拖拽持久化）+ **脑图**（离线渲染、断网可用）+ 可打印。
- **W3 · 付款数据回流** — `lumilab payment sync` 只读回读真实 Stripe 付款笔数/金额（脱敏）→ 对照基线判信号 → 回写假设 → 喂 next-actions。付款是比留邮箱强 1000× 的需求信号。
- **W4 · 落地页 `theme.css` + 实时 re-theme** — 构建阶段真实落地页 iframe + 设计面板并排，拖旋钮**立刻可见**；「应用设计」确定性写回 `theme.css`（不调 LLM）。
- **全量 26 skill 跑过 SkillLens Deep Review → 全部 S 级**（平均 ~92.6，证书 verified）；每个 skill 精简 SKILL.md + 完整操作详版在 `references/full-guide.md`（progressive disclosure）。

## 当前状态（v1.10.0）

✅ 已就绪：
- **26 个 skill**，完整 SKILL.md + frontmatter，每个带 `validate-output.ts` 校验器 + `anti-slop-lint.ts` 文案检查器
- 常驻 Studio 服务（SSE 自动刷新）+ Studio HTML 渲染引擎（编辑式美学）+ 看板/脑图/付款验证/实时 re-theme
- Setup Wizard / Share Manager / Design Direction 三个浏览器 UI
- Cloudflare 部署 + 客户端加密（AES-GCM + PBKDF2 1M）+ localStorage 密码缓存
- Stripe 真 checkout 创建 + 只读付款回流（脱敏）
- 真 keychain 后端（macOS Keychain / Linux secret-tool）+ XHS / Exa 真集成 + 无 token 时 mock 降级
- 5 个中国平台规则表（2025–2026 更新）+ PARA 三层记忆布局
- 自指 demo venture（`lumilab demo` 一键装载）
- **SkillLens：26 个 skill 全部 S 级，平均 ~92.6，全部 verified**
- 两条安装通道都已发布最新：`curl get.lumiclaw.ai`（CF Pages）+ `git clone github.com/zifeixu85/lumilab`

详见 [`CHANGELOG.md`](CHANGELOG.md)。

---

## License

授权见 [`LICENSE`](LICENSE)。

## 致谢

**方法论**：YC office hours · Mom Test（Rob Fitzpatrick）· Lean Startup（Eric Ries）· Sean Ellis 40% PMF · April Dunford · Bob Moesta JTBD · Marc Lou · Lenny Rachitsky · Thariq Shihipar（HTML 有效性）

**上游 skill**：Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · JimLiu/baoyu-skills · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research

**基础设施**：Cloudflare Pages · wrangler · Web Crypto API · bun · Fraunces · JetBrains Mono · Geist
