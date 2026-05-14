# Lumi Lab

> **给创业者的 Skills bundle。把一个模糊的想法，7 天跑成一次市场实验。**

[English](README.en.md) ｜ 简体中文

**Lumi Lab** 是一套 22 个 skill 的 bundle，跑在 **Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI** 里。把它丢进你 AI 宿主的 skills 目录——**给它一句话 idea，它自动跑市场分析、提方向建议、生成带 SEO/GEO 的 landing 页**。全程最多问你两次。模糊的想法进，能验证的 landing 页出。

[![版本](https://img.shields.io/badge/version-1.4.1-orange)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Apache_2.0-blue)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-24-blue)](skills/)
[![宿主](https://img.shields.io/badge/hosts-Claude_Code_·_OpenClaw_·_Hermes_·_Cursor_·_Codex-555)](docs/TUTORIAL.zh.md)
[![SkillLens](https://img.shields.io/badge/SkillLens-21_S_·_avg_91.6_·_verified-brightgreen)](docs/SKILLLENS_REPORT.md)

---

## 它是什么，不是什么

| Lumi Lab 是 | Lumi Lab 不是 |
|---|---|
| 一套 **Skills bundle**，丢进 `~/.claude/skills/` 用 | 一个独立的 Agent 产品 |
| 在 Claude Code / OpenClaw / Cursor 里被调用 | 一个 web app 或 SaaS |
| 产出文件：HTML、YAML、CSV、Markdown | 提供一个聊天界面 |
| **用你宿主自己的 LLM** | 要你自己的 LLM API key |
| 读写 `~/.lumilab/` 做状态 | 偷偷上报数据 |

**你不用给 Lumi Lab LLM API key。** 你的 AI 宿主已经有了——Lumi Lab 接进去就行。它要的那些可选 token 都是**工具集成**（Cloudflare 部署 Studio、Exa 做网页搜索、TikHub 拿小红书 API 等）。

---

## 为什么有这东西

**Skill 不再稀缺，编排才稀缺。**

难的不是找一个 prompt 或一个 skill，而是知道：

- 有了新想法，该串哪些 skill
- 哪些平台规则是真的要命的（小红书标题 ≤ 38 字、X thread ≤ 7 条…）
- 假设该 pivot 了，而不是继续打磨 landing page
- 怎么发一个不像 AI demo 的私密项目 Studio

Lumi Lab 把这些答案编码成 21 个自包含的 skill + 一个共享的 `~/.lumilab/` 状态目录 + 3 个浏览器工具 UI（Setup Wizard、Share Manager、Design Direction）。

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

### 每个 venture 一个 Studio

每个想法有自己的项目页——一份可打印的实验日志，编辑式排版（Fraunces 衬线 + JetBrains Mono）、SVG 进度时间线、假设卡片、决策轨迹。暖纸色 OKLCH + 颗粒噪声纹理。

### 三个浏览器 UI（不需要 LLM）

- **Setup Wizard**（`lumilab config`）— 5 步。问你真正需要的工具 token：Cloudflare、Exa、TikHub。**从不问 LLM key。**
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

Lumi Lab 支持三种宿主的三条安装路径——选你正在用的：

#### Claude Code / Cursor / Codex（本地 `~/.claude/skills/`）

```bash
git clone https://github.com/zifeixu85/lumilab.git
cd lumilab
./install.sh
```

`install.sh` 把 21 个 skill 复制到 `~/.claude/skills/`（或 `--target` 自定义）。`--yes` 非交互。

#### OpenClaw（ClawHub 集中安装）

```bash
openclaw skills install lumilab
openclaw gateway restart
```

绑定飞书 bot（可选，跑通 OpenClaw → 飞书 chat 入口）：

```bash
openclaw channels login --channel feishu
```

#### Hermes Agent（chat 内一句话装，飞书 / Telegram / Slack 全 channel 通用）

在你已经接好的 chat（如飞书 @bot）直接发：

```
/skills install https://github.com/zifeixu85/lumilab
```

Hermes 会 quarantine → `skills_guard` 静态扫描 → 写入 `~/.hermes/skills/lumilab/`。之后 `@bot 帮我用 lumilab 走一遍这个 idea` 即可调用。

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
lumilab studio [venture]        浏览器打开 Studio
lumilab render [venture]        重新渲染 Studio HTML

lumilab design-direction [venture]    选美学方向 + 旋钮 + 实时预览
lumilab deploy <venture>              部署到 Cloudflare Pages（带密码门）
lumilab manage                        管理所有已部署的 Studio
lumilab config                        Setup Wizard

lumilab retro [venture]               周复盘四桶交互页
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
| **核心（自建）** | 5 | hypothesis-ledger、founder-coach、landing-mvp（含 SEO/GEO）、content-repurpose、weekly-sop-runner |
| **基础设施** | 3 | config（Setup Wizard + Share Manager + chat-mode）、deploy（Cloudflare + 加密）、research-platforms（小红书 + Web） |
| **渲染** | 1 | studio（Studio HTML + 市场分析报告 HTML） |
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
| 一个作者的口吻。 | 21 个独立 skill，各有各的纪律。 |
| 输出是丢进聊天框的文本。 | 输出是文件：HTML、YAML、CSV、MD。可 diff、可部署。 |
| 「试试这个方法。」 | atomic 假设账本，带 supersede 历史。 |
| 难分享。 | `lumilab deploy` → 30 秒一个加密的公开 Studio。 |
| 忘了上周。 | `~/.lumilab/` 里的 PARA 三层记忆。 |

---

## 质量评测

原 21 个 skill 全部跑过 [SkillLens](https://github.com/Yannickdes/SkillLens) 官方 agent-side Deep Review，**全部 S 级，平均 91.6 / 100，21 个 `deepReviewCertificate` 全部 `verified`**。每个 skill 都带可独立运行的 `scripts/validate-output.ts` 输出校验器 + `scripts/anti-slop-lint.ts` 文案检查器。（v1.1.0 新增的 idea-to-landing orchestrator 待下一轮评测。）

详见 [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md)。

---

## 文档

- [`docs/TUTORIAL.zh.md`](docs/TUTORIAL.zh.md) — 完整中文上手指南（三种宿主路径 + 飞书入门）
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 技术架构
- [`docs/SKILLS.md`](docs/SKILLS.md) — 21 个 skill 索引，一行说明
- [`docs/SKILLLENS_REPORT.md`](docs/SKILLLENS_REPORT.md) — SkillLens 评测报告
- [`CHANGELOG.md`](CHANGELOG.md) — 版本变更

---

## v1.0.0 状态

✅ 已就绪：
- 21 个 skill，完整 SKILL.md + agentskills.io v1 frontmatter
- 每个 skill 带 `scripts/validate-output.ts` 输出校验器 + `scripts/anti-slop-lint.ts` 文案检查器
- Studio HTML 渲染引擎（编辑式美学）
- Setup Wizard / Share Manager / Design Direction 三个浏览器 UI
- **chat-mode 配置**：飞书 / Telegram 里 `wizard.ts --chat-set <provider> <token>` 直接配 key（verify 真实 API → 写 keychain）
- Cloudflare 部署 + 客户端加密（AES-GCM + PBKDF2 1M）
- localStorage 密码缓存（刷新不重复要密码）
- PARA 三层记忆布局
- 5 个中国平台规则表（2025–2026 更新）
- `lumilab` CLI（含 retro / research-xhs / research-web / secrets）
- 真 keychain 后端（macOS Keychain / Linux secret-tool）
- XHS / Exa 真集成代码 + 无 token 时 mock 降级
- 自指 demo venture（已用 v1.0 重跑验证）
- **SkillLens：21 个 skill 全部 S 级，平均 91.6，全部 verified**

⏳ 待你的环境收尾（不阻塞代码可用性）：
- 端到端 dogfood 安装真测（需在你的机器上跑 `./install.sh`）
- 飞书 e2e demo 录屏（需建飞书 bot）
- ClawHub 发布（需注册 clawhub.ai 账号）
- XHS / Exa 真 token 联调（代码就绪，需你的 API key）

详见 [`CHANGELOG.md`](CHANGELOG.md)。

---

## License

Apache 2.0 — 见 [`LICENSE`](LICENSE)。

## 致谢

**方法论**：YC office hours · Mom Test（Rob Fitzpatrick）· Lean Startup（Eric Ries）· Sean Ellis 40% PMF · April Dunford · Bob Moesta JTBD · Marc Lou · Lenny Rachitsky · Thariq Shihipar（HTML 有效性）

**上游 skill**：Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · JimLiu/baoyu-skills · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research

**基础设施**：Cloudflare Pages · wrangler · Web Crypto API · bun · Fraunces · JetBrains Mono · Geist
