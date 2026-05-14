# Changelog

所有显著变化都记录在这里。版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

格式：`Added` / `Changed` / `Fixed` / `Removed` / `Deprecated` / `Security`

---

## [0.1.0-p0] · 2026-05-13 · Phase 0 首发

> **Lumi Lab 是 Skills bundle，跑在你已有的 AI 宿主里**（Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI）。宿主提供 LLM。Lumi Lab 提供 21 个 skill、3 个浏览器 UI（Setup Wizard / Share Manager / Design Direction）、加密的 Cloudflare 部署，以及 `~/.lumilab/` 本地状态目录。**不需要 LLM API key**。
>
> **中文界面优先**（i18n 多语言切换将在后续版本提供）。

### 🎉 Highlights

- **1 个 OpenClaw Lead Agent + 21 个 Skills**，把模糊想法变成可验证的市场实验
- **Studio Mode** — 每个 venture 一个 HTML 项目作战室。Fraunces 可变衬线 + JetBrains Mono + OKLCH 暖纸色 + 牛血色重音 + SVG noise grain + 编辑磁带式 Nº 编号章节。SVG 9 阶段 progress diagram（罗马数字 + 呼吸动画）、Hypothesis 假设 ledger（含 supersede strike-through）、决策时间线（◆ / ◇ 类型符号）
- **3 个浏览器交互 UI**
  - **Setup Wizard**（`lumilab config`）— 5 步引导，实时 verify Anthropic / DashScope / Cloudflare / Exa token（返回具体 E_401 / E_403 / E_429 错误码）
  - **Share Manager**（`lumilab manage`）— 列表所有部署 venture，查看 / 复制 URL / 显示密码 / 内置 QR / rotate password / 删除
  - **Design Direction**（`lumilab design-direction`）— 4 套美学样本 + 3 旋钮（VARIANCE / MOTION / DENSITY）+ 5 OKLCH 色点 + iframe 实时 Live Preview
- **Cloudflare Pages 一键部署 + 客户端加密 + localStorage 缓存** — AES-GCM + PBKDF2 1M 迭代，浏览器 Web Crypto API 解密。首次解密后用 localStorage 缓存（"Remember on this device" 复选框），刷新 / 新标签不再重复输密码，rotate password 自动失效缓存
- **自指 demo** — `lumilab-meta` venture 跑通完整闭环

### Added

**核心架构**
- 工作区骨架（SOUL / IDENTITY / AGENTS / TOOLS / HEARTBEAT / MEMORY / openclaw.json）
- PARA 三层记忆（projects / areas / resources / archives）
- 5 平台必做约束（小红书 / 公众号 / 抖音 / 朋友圈 / X）
- 9 个产品理念（含 4.8「先让用户看到，再让 Agent 投入」+ 4.9「值得读，而不是仅可读」）

**5 个自建核心 Skill**
- `lumilab-hypothesis-ledger` — Atomic YAML facts + supersede + diff view
- `lumilab-founder-coach` — 3 层教练（方法论 / 认知陷阱 / 心理向）
- `lumilab-landing-mvp` — Landing 6 阶段流水线 + Anti-Slop + 6 条质量自检
- `lumilab-content-repurpose` — 一稿改写 5 平台
- `lumilab-weekly-sop-runner` — 7 天 blueprint + paperclip routines

**3 个 P0 新增能力**
- `lumilab-config` — Setup Wizard + Share Manager（P0 stub，P1 HTML UI）
- `lumilab-deploy` — Cloudflare Pages + 客户端加密 + 密码门（实测可用）
- `lumilab-research-platforms` — XHS Playwright + Web Exa 双通道

**2 个工程 Skill**
- `lumilab-studio` — HTML 渲染引擎，MD/YAML → HTML（含 SVG progress diagram）
- `lumilab-slides` — 自指 demo 第二层，键盘导航 slides 生成器

**11 个复用 overlay**
- `lumilab-coach-yc` / `lumilab-research-{interview,icp,competitor}` / `lumilab-product-{positioning,pmf,mvp}` / `lumilab-copy` / `lumilab-launch-strategy` / `lumilab-metrics` / `lumilab-design-direction`

**1 个知识 Skill**
- `lumilab-playbook-cn` — 13 中文方法论 + 国内平台规则索引

**Anti-Slop 三源合并规则**
- 文案禁用词（17+条）
- 视觉禁用模式（8条）
- 代码禁用模式（10+条）
- 6 条质量自检 gate

**CLI**
- `lumilab new / list / render / studio / slides / deploy / config / manage / help`

### 中文化（Round D）

- **3 个浏览器 UI** 全量中文化（Setup Wizard / Share Manager / Design Direction）
- **Studio HTML**（venture journal）全量中文化：进度 / 假设 / 决策轨迹 / 简报、强信号 / 中信号 / 弱信号 / 已迭代、masthead 改为 `一份 venture 实验日志 · 第 N 期`
- **加密页面**（password gate）：「这是一个加密的 Studio」/「解锁」/「在此设备上记住密码」
- **CLI 输出**（`lumilab` 命令）的提示和错误信息中文化
- **install.sh** 安装器中文化
- 错误码格式保留（`E_401 · 描述`），错误描述部分翻译为中文
- 中英 / 中数空格按 W3C 中文排版规范处理，全角中文标点
- **专有名词不翻译**：Cloudflare / Exa / TikHub / Stripe / Resend / X / Anthropic / OpenAI / Gemini / Claude Code / OpenClaw

### Known Limitations（Phase 1 补齐）

- ⏳ Setup Wizard：真 keychain 加密（P0 用 plaintext + chmod 600 + 限本地 127.0.0.1）；OAuth flow；可选 provider（TikHub/Stripe/Resend/微信/X）的真 verify
- ⏳ Share Manager：访问统计（Cloudflare Analytics API）；多密码（不同访问者不同密码）；批量操作
- ⏳ Design Direction：5 个剩余交互页（clarify / pick-positioning / review-landing / review-content / confirm-launch / weekly-retro）
- ⏳ XHS Playwright 实际抓取（Setup Wizard 已能配 token，但 lumilab-research-platforms 的 adapter 还没接入）
- ⏳ Web Exa API 实际集成
- ⏳ Stripe / Resend / PostHog 接入
- ⏳ 多账号工作区
- ⏳ 跨 venture portfolio 总览 + 模式抽取
- ⏳ MCP Memory 关系图
- ⏳ paperclip routines 真 schedule + cron
- ⏳ playbook-en（13 英文方法论）
- ⏳ 加密 UX：document.write() → iframe srcdoc 隔离（防 XSS）；离线攻击锁定机制
- ⏳ **i18n 框架（en / zh-CN / zh-TW 切换）**：当前所有 UI 文案硬编码中文，多语言切换将提取到 locale 文件

### 兼容性

- **运行时**：bun ≥ 1.0（必需）/ node ≥ 20（fallback）
- **部署**：wrangler CLI（Cloudflare Pages）
- **Skill 加载**：Claude Code / OpenClaw 兼容

### 致谢

- **方法论参考**：YC office hours / Mom Test / Lean Startup / Sean Ellis / April Dunford / Bob Moesta / Marc Lou / Lenny / Thariq Shihipar
- **Skill 上游**：Aston1690/landing-page · Leonxlnx/taste-skill · pbakaus/impeccable · JimLiu/baoyu-skills · white0dew/XiaohongshuSkills · alirezarezvani/claude-skills · obra/superpowers · dzhng/deep-research · 等

---

## [1.1.0] · 2026-05-14 · 产品方向纠偏 — 一句话 idea → landing 自动流水线

> **基于 Hermes 实测反馈的方向纠偏。** 旧的 `founder-coach` 逐步追问交互被否决——用户要的是「帮我判断 + 帮我做」的轻量自动流水线，不是「陪我聊」。借鉴 [gstack](https://github.com/garrytan/gstack) 的 autoplan 编排 + 决策简报式提问 + boil-the-lake 原则。

### Added

**新 orchestrator skill `lumilab-idea-to-landing`（默认入口）**
- autoplan 式自动流水线，5 个 phase：极简 intake → 自主分析 → HTML 报告 → 方向选择门 → 自动生成 landing
- 全程**最多问用户 2 次**：1 次可选 intake（能跳过）+ 1 次方向选择
- `scripts/orchestrate.ts`：建 venture + token 检测（决定真 API vs 宿主 LLM 知识）+ 进度跟踪
- `scripts/validate-output.ts`：校验 `market_analysis.json` schema
- 无 TikHub/Exa token 时用宿主 LLM 知识做分析，**不停下来让用户去配**（轻量优先）

**市场分析报告 HTML 渲染器** `lumilab-studio/scripts/market-report.ts`
- 图文并茂：市场快照 + 竞品对比表 + 人群卡 + 3-5 个方向卡（推荐项高亮）
- 编辑式 OKLCH 美学，响应式（飞书移动端可读），grain 纹理 + 入场动画
- 主动交付：本地开浏览器 / chat 发文件附件

**`lumilab-landing-mvp` 加 SEO + GEO**
- SEO：title/meta/OG/Twitter Card/canonical/sitemap.xml/robots.txt + 性能优化
- GEO（生成式引擎优化）：JSON-LD 结构化数据、FAQ section + FAQPage schema、`llms.txt`、实体声明、事实密度——让 ChatGPT search / Perplexity 等 AI 搜索引擎能抓取并引用
- 新增第 7 条质量 gate（SEO+GEO gate），`validate-output.ts` 扩展校验

**`## 主动交付` 段加到全部 22 个 SKILL.md**
- 明确指令：用户该看的产物必须主动交付（HTML 优先 / chat 发附件 / 贴文字摘要），不静默落盘

**CLI**：`lumilab idea "<一句话>"` 默认入口

### Changed

**`lumilab-founder-coach` 重定位为「可选深度模式」**
- 不再是默认入口（让位给 idea-to-landing）
- 去掉「HARD-GATE 一次一个问题」默认节奏 → 改为**分析先行 + 批量提问**：先用框架自己推断一遍，只问 ≤ 3 个真正影响判断的点，一次问完，一轮 session ≤ 2-3 次提问
- 借 gstack 决策简报式 AskUserQuestion + anti-sycophancy（对每个回答表态，不和稀泥）
- 产出主动推给用户

- `VERSION` 1.0.1 → 1.1.0；manifest.json 22 skills + `default_entry: lumilab-idea-to-landing`
- README 中英双版重写「你得到什么」「命令」「盒子里有什么」反映新流程

### 为什么改
Hermes 实测反馈：旧 coach 逐步追问效果差。用户不知道 idea 行不行、市场竞争如何——不需要被一步步梳理，需要系统**先分析、给方向建议**。频繁提问 = 把产品该干的活推回给用户。北极星：一句 idea → 自动跑完 → 输出能验证想法的 landing 页。

---

## [1.0.1] · 2026-05-14 · bun 自动安装

> 把 `bun` 从「需要用户手动准备的前提」变成「自动处理」。`/skills install` 后整条链路不再需要任何手动环境准备。

### Added
- **`## 环境自检` 段**加到全部 21 个 SKILL.md —— 宿主 agent（Claude Code / OpenClaw / Hermes）读到任意 skill 时都会看到 bun 检测 + 自动安装指令，首次调用脚本前自行执行
- `manifest.json` 加 `bootstrap` 字段（机器可读的 check / install / path_hint）
- `docs/TUTORIAL.zh.md` 加「前置依赖（自动处理）」段

### Changed
- **`install.sh` 缺 bun 时自动安装**（原来只报错退出）：检测 `~/.bun/bin` 已有则补 PATH；否则 `curl -fsSL https://bun.sh/install | bash`（`--yes` 模式静默装，交互模式问一次确认）
- `VERSION` → 1.0.1

### 效果
飞书 Hermes 全自动链路：`/skills install <url>` → `@bot 配 Exa key` → agent 读 SKILL.md 见 `## 环境自检` → 缺 bun 自动装 → `wizard.ts --chat-set exa <key>`。用户无需任何手动环境准备。

---

## [1.0.0] · 2026-05-14 · 正式版

> **Lumi Lab v1.0.0 正式发布。** 21 个 skill，跑在 Claude Code / OpenClaw / Cursor / Codex / Hermes / Gemini CLI 里。
> SkillLens 官方 Deep Review：**21 个 skill 全部 S 级，平均 91.59 / 100，21 个 `deepReviewCertificate` 全部 `verified`**。

### 致用户

如果你是中国的独立开发者、OPC、startup 创始人——Lumi Lab 不是又一个「超级 prompt」，是一套跑在你已有 AI 宿主里的工作区：把模糊想法拆成 atomic 假设、生成不像 AI demo 的 landing 和多平台内容、跑 7 天验证 SOP、一条命令加密部署项目作战室。宿主提供 LLM，你只需要按需配几个工具 token（甚至全不配也能用大半功能）。三种宿主三条安装路径，飞书 chat 里一句话就能装、能配 key、能用。

### Added

**chat-mode 配置（B1）**
- `wizard.ts` 检测 `LUMILAB_CHANNEL`，提供 3 个 agent-friendly 子命令：
  - `--chat-prompts`：列出可配置 provider + 设置指引
  - `--chat-status`：当前配置状态（不回显 token）
  - `--chat-set <provider> <token>`：verify 真实 API → 写 keychain → 更新 config flag
- 飞书 / Telegram chat 里 host LLM 编排：收集 token → 逐个 `--chat-set` → 完成。不再依赖浏览器 wizard
- `verifyTikHub` 升级为真实 API 调用（原 P0 stub）

**每个 skill 一个真 validator 脚本（B2）**
- 21 个 `scripts/validate-output.ts`：确定性、可独立运行、exit 0/1、带 `--help`
- YAML / JSON / 内容 / HTML 各类输出对应各自的 schema 校验
- 每个 SKILL.md 加 `## Output validation` 段 + `校验字段:` schema 声明
- 全部用自指 demo venture（lumilab-meta）实测通过

**结构性补全（B2）**
- 文件名跨段一致：frontmatter `outputs` ↔ 正文 ↔ `## Outputs` 三处对齐
- `## Dependencies` 表加单次调用成本列
- 每个 skill 加 `## 分支决策` if-then 表（6–7 行）
- 每个 skill 加 `## Changelog` + `scripts/package.json`

### Fixed
- **3 个 validator schema bug**（用自指 demo 实测发现）：
  - `hypothesis-ledger`：evidence 非空只在 `test_status=passed|failed` 时要求
  - `studio`：校验真实的 `.nav-stage` 7 段导航，metrics/assets 段改为可选
  - `design-direction`：校验真实 schema（`preset`/`dials`/`palette`/`typography`），移除臆想的 `samples` 数组检查
- `anti-slop-lint.ts` 全 21 个加 `validate-output.ts` 到 SKIP_FILES（validator 含禁词检测常量，同 linter 自身）

### Changed
- `VERSION` 1.0.0-rc3 → **1.0.0**
- `manifest.json` version → 1.0.0，release channel → stable
- 21 个 SKILL.md frontmatter version → 1.0.0
- README badge：1 S + 20 A → **21 S，平均 91.6**
- `docs/SKILLLENS_REPORT.md` 重写为四轮迭代对比（rc1 → rc2 → rc3 → v1.0.0）

### SkillLens 四轮迭代

| | rc1 | rc2 | rc3 | **v1.0.0** |
|---|---:|---:|---:|---:|
| 平均分 | 80.53 | 87.32 | 87.25 | **91.59** |
| S 级 | 0 | 0 | 1 | **21** |
| 全部 verified | ✅ | ✅ | ✅ | ✅ |

### 待你的环境收尾（不阻塞代码可用性）
- 端到端 dogfood 安装真测（`./install.sh` + Claude Code / OpenClaw / Hermes 各识别一遍）
- 飞书 e2e demo 录屏（需建飞书 bot）
- ClawHub 发布（需注册 clawhub.ai 账号）
- XHS / Exa 真 token 联调（代码就绪，需你的 API key）

### 致谢
方法论 / 上游 skill 致谢见 README.md。SkillLens 评测工具：github.com/Yannickdes/SkillLens。

---

## [1.0.0-rc3] · 2026-05-14 · 首个 S 级 + README 中文化 + 3 bug 修复

> 第三个候选发布。首个 SkillLens S 级 skill 出现（`lumilab-content-repurpose` 90.33）。README 改为中文为主，英文版保留为 `README.en.md`。修复 deep review 暴露的 3 个真实 bug。

### Added
- 每个 SKILL.md 补 `## Alternatives`（具名竞品对比：v0 / bolt / Notion / 通用 LLM / G2 等）+ `## Moat`（复利护城河：累积会话历史 / supersede 链 / voc-bank / research history）
- `README.md` 全量中文化；英文版保留为 `README.en.md`，双向语言切换链接
- `docs/SKILLLENS_REPORT.md` 重写为三轮迭代对比（rc1 / rc2 / rc3）

### Fixed
- **`lumilab-deploy/scripts/encrypt.ts` 用了 `Inter Tight` 字体** —— 违反自身 Anti-Slop 规则，改为 `Fraunces`
- **`lumilab-deploy/scripts/deploy.ts` 直读明文 `secrets.json`** —— 与 Privacy 声明不一致，改为优先 `keychain.ts`（macOS Keychain / Linux secret-tool）+ env override + 明文兜底
- **`lumilab-design-direction` SKILL.md 旋钮取值范围矛盾** —— `1-10` vs `0-100`，统一为 `0–100，step 10`
- **`anti-slop-lint.ts` 假阳性** —— 重写为 negation-aware + 跳过 SKILL.md / references / 自身。21 个 skill 现在全部 `bun run scripts/anti-slop-lint.ts` exit 0

### Changed
- `VERSION` 1.0.0-rc2 → 1.0.0-rc3
- SkillLens badge：21 A → 1 S + 20 A

### SkillLens 评分（三轮）

| | rc1 | rc2 | **rc3** |
|---|---:|---:|---:|
| 平均分 | 80.53 | 87.32 | **87.25** |
| S 级 | 0 | 0 | **1** |
| A 级 | 9 | 21 | **20** |
| 全部 verified | ✅ | ✅ | ✅ |

首个 S：`lumilab-content-repurpose` **90.33**。距离全员 S 的工程清单见 `docs/SKILLLENS_REPORT.md`。

---

## [1.0.0-rc2] · 2026-05-14 · SkillLens 21 A 全员晋级

> 第二个候选发布。在 rc1 基础上：21 个 skill 全部 SkillLens A 级（rc1 是 9 A + 12 B），平均分从 80.53 升到 **87.32**。最高 `lumilab-content-repurpose` **89.93**（距离 S 仅 0.07）。

### Added

**每个 SKILL.md 加 5 段工程化具体内容**（非模板，按 skill 定制）：
- `## Idempotency` —— 文件命名 / 覆盖策略 / 重跑行为
- `## Privacy` —— 数据本地化 / 是否上传 / 删除策略
- `## Cache` —— 输入缓存粒度 / 失效条件
- `## Failure modes` —— 标准错误码 / 边界处理
- `## Edge cases` —— 阈值 / 极端输入

**所有 21 个 skill 都有了 `scripts/`**，原 15 个 overlay/methodology 类 skill 新增 `scripts/anti-slop-lint.ts`：
- 17+ 中文 slop 禁词扫描（赋能 / 打造 / 闭环 / 赛道 / 抓手 / 心智 / 颗粒度 / 数智 / 链路 / 用户画像 等）
- 6 英文 AI slop 禁词（delve / robust / crucial / comprehensive / nuanced / leverage）
- 5 视觉禁用模式（Inter / Roboto / Arial / #000 / #fff / purple gradient）
- 可独立调用：`bun run skills/<name>/scripts/anti-slop-lint.ts <path>`，退出码 0 / 1

### Changed
- `VERSION` 1.0.0-rc1 → 1.0.0-rc2
- README SkillLens badge 9A+12B avg 80.5 → 21 A avg 87.3
- `docs/SKILLLENS_REPORT.md` 全量重写，含 rc1 → rc2 对比表 + 五大支柱平均分 + 距离 S 路径

### SkillLens 评分（21 个 skill 全部 verified Deep Review）

| 排名 | Skill | rc1 | **rc2** | Δ |
|---:|---|---:|---:|---:|
| 1 | `lumilab-content-repurpose` | 83.47 | **89.93** | +6.46 |
| 2 | `lumilab-research-platforms` | 85.28 | **88.63** | +3.35 |
| 3 | `lumilab-copy` | 78.88 | **88.62** | +9.74 |
| 4 | `lumilab-research-interview` | 79.36 | **88.29** | +8.93 |
| 5 | `lumilab-playbook-cn` | 79.71 | **88.27** | +8.56 |
| 5 | `lumilab-research-icp` | 81.29 | **88.27** | +6.98 |
| 5 | `lumilab-weekly-sop-runner` | 88.63 | **88.27** | -0.36 |
| 8 | `lumilab-coach-yc` | 81.36 | **88.09** | +6.73 |
| 9 | `lumilab-founder-coach` | 79.16 | **87.95** | +8.79 |
| 10 | `lumilab-research-competitor` | 78.06 | **87.80** | +9.74 |
| ... | ... | ... | ... | ... |

详见 `docs/SKILLLENS_REPORT.md`。

---

## [1.0.0-rc1] · 2026-05-14 · v1.0 第一个候选发布

> **第一个完整对外可用版本**。
> 三种宿主三条安装路径：Claude Code / Cursor / Codex 本地 + OpenClaw ClawHub + Hermes `/skills install URL`。
> 21 个 skill 全部带 agentskills.io v1 标准 frontmatter（含 `requires_browser` / `chat_only_ok` 自描述）。
> 中文界面优先，i18n 留 v1.1。

### Highlights

- **manifest.json**（agentskills.io v1）一份顶层 manifest 描述 21 skill / 平台兼容性 / 工具依赖 / 三种安装入口
- **三种宿主三条路径全部 ready**：`./install.sh`（本地）/ `openclaw skills install lumilab`（ClawHub）/ `/skills install https://github.com/zifeixu85/lumilab`（Hermes 飞书内一句话）
- **10 个 overlay skill 全部 ≥ 300 行真内容**：coach-yc、copy、launch-strategy、metrics、product-{mvp,pmf,positioning}、research-{icp,competitor,interview}——含方法论核心 / 工作流程 / 真实示例 / 输出 schema / 反 Slop 自检 / Chat-only fallback 六段
- **5 平台规则 2025–2026 增量更新**：小红书 / 公众号 / 抖音 / 朋友圈 / X 各加 2 条最新规则（限流 / 算法 / 违禁词），含发布时间 / 来源 / 影响 / 应对建议
- **weekly-retro 交互页**（M5）：四桶填写表（强信号 / 中信号 / 弱信号 / 已迭代）+ chat 文本 fallback
- **真 keychain 后端**（M6）：macOS Keychain / Linux secret-tool 双后端，`~/.lumilab/secrets.json` plaintext 自动迁移
- **XHS + Exa 真集成代码骨架**（M3 / M4）：`TIKHUB_API_KEY` 配置后自动切真抓；`EXA_API_KEY` 同理；无 key 时 mock 数据 graceful fallback
- **Chat-only UX fallback**（M14）：Setup Wizard / Share Manager / Design Direction 三个浏览器 UI 各自记录飞书 / Telegram chat 模式降级路径（interactive card / 文本编号）
- **完整中文用户教程**（M7）`docs/TUTORIAL.zh.md` 三种宿主路径 + 飞书入门 demo + FAQ

### Added

**M10 · Frontmatter agentskills.io v1.0 升级（21 文件全量）**
- `version: 1.0.0-rc1` / `license: Apache-2.0` / `platforms: [macos, linux]` / `prerequisites.commands: [bun]` / `compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, ..."`
- `metadata.lumilab.tier`（core / overlay / utility / knowledge）
- `metadata.lumilab.requires_browser`（false / true）
- `metadata.lumilab.chat_only_ok`（true / false）
- `metadata.hermes.tags`（按 skill 主题）

**M11 / M12 · 顶级安装配置**
- `manifest.json`：21 skill 完整索引 + 三宿主兼容性矩阵 + tool token 声明（**显式声明不需要 LLM API key**）
- README install 段重写：Claude Code / OpenClaw / Hermes 三种路径独立小节，含飞书 bot 绑定命令

**M3 / M4 · 真抓取代码（带 mock fallback）**
- `skills/lumilab-research-platforms/scripts/xhs_tikhub.ts`：TikHub API（`search_notes`），输出 `research/xhs_raw.json`；错误码 `E_4XX · 描述`
- `skills/lumilab-research-platforms/scripts/web_exa.ts`：Exa `/search` API，含 `contents.text` + `highlights`，输出 `research/web_exa.json`

**M5 · weekly-retro 交互页**
- `skills/lumilab-weekly-sop-runner/scripts/weekly-retro.ts`：bun HTTP 7779，四桶 textarea + 元信息（day / next direction / key decision），保存 YAML 到 `research/retro-<ISO>.yaml`，chat-only 模式打印结构化模板

**M6 · 真 keychain bridge**
- `skills/lumilab-config/scripts/keychain.ts`：macOS `security` + Linux `secret-tool` + plaintext fallback；`migrate-plaintext` 命令一键迁移 P0 plaintext

**CLI 新增子命令**
- `lumilab retro [venture]`
- `lumilab research-xhs "<keyword>" [--venture] [--limit] [--mock]`
- `lumilab research-web "<query>" [--venture] [--num] [--mock]`
- `lumilab secrets which|get|set|del|list|migrate-plaintext`

**M7 · 完整中文用户教程**
- `docs/TUTORIAL.zh.md` 3300+ 字，含三种宿主路径 / 10 分钟 venture / 飞书入门 5 步 / 6 条 FAQ

**M8 · 5 平台规则 2025–2026 更新**
- `skills/lumilab-playbook-cn/references/platform-rules/` 5 文件全量更新

### Changed
- `VERSION` 0.1.0-p0 → 1.0.0-rc1
- `README.md` install 段从单一 `git clone` 重写为三宿主路径
- 10 个 overlay skill 从 49 行 stub → 平均 320 行真内容
- 顶层 `prerequisites` 现明确声明 `env_vars: []`（不要 LLM key）

### Known limitations · rc1 → final
- M1：端到端 dogfood 安装验证（需用户在自己机器跑 install.sh + Claude Code / OpenClaw / Hermes 各自识别 skill）
- M3 真抓取：需配置 TikHub token（mock 已通）
- M4 真抓取：需配置 Exa API key（mock 已通）
- M6 真 keychain：macOS / Linux 可用，Windows credential manager 留 v1.1
- M13 飞书 e2e demo：需用户建飞书 bot 录屏
- ClawHub 发布、Hermes TRUSTED_REPOS PR：需用户 / 维护者操作

### 致谢
方法论 / 上游 skill 致谢列表见 README.md / docs/TUTORIAL.zh.md。

---

## [Unreleased] · v1.1 计划

详见 [`docs/PRODUCT_DESIGN.md`](docs/PRODUCT_DESIGN.md) §14。

预计能力：
- 4 个 Studio 交互页（含 design-direction 旋钮 + Live Preview）
- 抖音 / 微博 / 知乎 / B 站搜索通道
- Stripe Payment Intent / Resend / Loops 邮件
- Cloudflare Analytics 部署访问统计
- 多账号工作区
- 跨 venture portfolio
- MCP Memory 关系图集成

---

[0.1.0-p0]: https://github.com/cheche/lumilab/releases/tag/v0.1.0-p0
