# Changelog

所有显著变化都记录在这里。版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

格式：`Added` / `Changed` / `Fixed` / `Removed` / `Deprecated` / `Security`

---

## [1.10.2] · 2026-05-30 · 修真实数据源（secret 解析 / TikHub 端点 / XHS 接进流水线）

> 用户在 Codex 实测时发现：配了 Tavily/TikHub 却仍回退 mock；修好 token 后又发现小红书端点已弃用，
> 且出海流水线根本不调 TikHub。本版把三处都修通，真实数据源全部可用。

### Fixed
- **secret 解析统一**：研究/付款脚本改为 `env → keychain → secrets.json` 解析 token，且大小写名变体都试。
  根因：config wizard 把 token 写成小写名（`tavily_api_key` / `tikhub_api_key` / `stripe_secret_key`）存进
  secrets.json，旧代码只查大写名（`TAVILY_API_KEY`）且不读 keychain → 找不到 → 回退 mock。修了
  `web_tavily.ts` / `xhs_tikhub.ts` / `payment-link` create+sync。Tavily / 小红书现在用真实数据。
- **TikHub 小红书端点迁移**：旧 `/api/v1/xiaohongshu/web/search_notes` 被 TikHub 弃用（400）→
  迁到 `/api/v1/xiaohongshu/app_v2/search_notes`（响应路径 `data.data.items`、互动数平铺在 note 上、
  URL 现需 `xsec_token`）。实测返回真实笔记。

### Changed
- **idea-to-landing Phase 1 显式跑 XHS 通道**：之前只显式调 web_tavily、从不调 TikHub → 出海 venture 报告
  只有 Web+DataForSEO 无小红书。现在有 TikHub token 就跑 `xhs_tikhub.ts`（中文关键词），即使出海 idea
  也作「国内市场旁证」，写 `research/xhs_raw.json`。
- **market-report.ts 新增确定性「小红书信号」章节**：读 `research/xhs_raw.json` 渲染 top 互动笔记
  （标题/作者/赞·藏·评/原帖链接，按互动量排序），mock 时标注占位。

## [1.10.1] · 2026-05-30 · 恢复操作型 skill 的完整流水线细节

> 1.10.0 的 SkillLens S 化把 SKILL.md 砍到 ≤6000 字时，**对 14 个操作型 skill 矫枉过正**——
> 把执行关键的流水线/命令/schema 细节挪进了 `references/full-guide.md`，宿主不一定会去加载，
> 导致编排可能漏步（如 idea-to-landing 不自动跑 research-keywords、不写假设）。本版**把完整操作细节
> 恢复回 SKILL.md 主文件**。完整度优先于评分。

### Changed
- **14 个操作型 skill 恢复完整 SKILL.md**（idea-to-landing / studio / landing-mvp / deploy / config /
  design-direction / payment-link / hypothesis-ledger / research-platforms / research-keywords /
  content-repurpose / weekly-sop-runner / metrics / home）：内联完整 phase→skill 编排、命令、schema、
  分支决策、边界；删除冗余的 `references/full-guide.md`。studio/landing-mvp/payment-link/design-direction
  并补上 W1–W4 文档（常驻服务 / theme.css / payment sync / re-theme）。
- **11 个方法论 skill 保持精简 SKILL.md + 完整 `references/full-guide.md`**（progressive disclosure，
  框架完整、深度详版随包发布，按需加载）。
- SkillLens 重评：**16 S + 10 A**（87–93，平均 ~90.8，证书 verified）。10 个 A 是操作型 skill——
  完整流水线细节让 context-budget 维度扣几分，这是刻意的「完整度 > 评分」取舍。

## [1.10.0] · 2026-05-30 · 决赛优化 W1–W4 + 全量 SkillLens S

> 决赛优化：4 条工作流 + 新增第 26 个 skill `lumilab-next-actions` + 全量 26 skill 升 SkillLens S 级。**26 skill**。

### Added · W1–W4 决赛优化
- **W1 · 常驻 Studio 守护进程**：`lumilab serve start|stop|status|restart|open`，固定端口（默认 7777），一个进程统一服务所有 venture + home。`GET /api/ping` 探活；`GET /api/events` SSE，`fs.watch` 文件变更 → 已打开页面**自动刷新**；访问时按 mtime **惰性重渲**（消灭"agent 改完要手动 render"）。控制走 run-file（`~/.lumilab/run/studio.json`）+ 信号，不新增 HTTP 控制端点。
- **W2 · `lumilab-next-actions` 新 skill（分析大脑）** + studio 看板/脑图呈现：读全量 venture 数据，对照 R6 基线打信号 level/tier，产出**多方向**（同一 idea 的推进岔路）候选动作 → `studio/next-actions.json`。studio 复盘阶段内联**看板**（原生 HTML5 拖拽，drop 即持久化）+ **脑图**（离线 SVG，本地零依赖、断网可用）+ `@media print` 可打印贴墙。
- **W3 · 付款数据回流**：`lumilab payment sync <slug>` 只读拉取 Stripe checkout sessions → 付款笔数/金额/转化率 → `payment/summary.json`（**脱敏**，不存邮箱/卡/姓名）→ 对照 `lumilab-metrics/assets/baselines.yaml`（R6 A/B/C 置信层）判信号 → 回写「付费意愿」假设 evidence → 喂 next-actions。studio 启动阶段显示「真实付款 N 笔 · ¥X · 转化 Y% · 强信号」。`--mock` 兜底，demo 必有数字。
- **W4 · 落地页 `theme.css` + 设计交互重做**：纯视觉调整变**确定性 + 即时**。landing 暴露规范 token（`--accent / --radius / --font-heading / --space-scale` …），studio 构建阶段把**真实落地页放进 iframe**与设计面板（~9 个分组旋钮）并排，拖旋钮直接改 iframe CSS 变量 → **立刻可见**；「应用设计」`POST /api/design/apply` 服务端**确定性**写回 `design_direction.json` + `theme.css`（**不调 LLM**）。「生成验证页」改**引导式门**（前置清单 + 说明 + 确认 + 版本 diff），不再是裸按钮黑盒。
- studio 支持 `#stage=<name>` 深链（可分享 + 截图）。

### Changed · 文档与评测
- 26 个 skill 全部跑过 SkillLens agent-side Deep Review → **全部 S 级**（92.26–92.88，`deepReviewCertificate` verified）；SKILL.md 精简到 ≤6000 字、完整操作详版移入各 skill 的 `references/full-guide.md`（progressive disclosure，宿主执行时按需加载）。

## [1.9.0] · 2026-05-30 · 验证工具 + 发布对齐

> 同步发布版到 GitHub（此前线上停在 v1.8.0 旧快照，缺下列内容）。**25 skill**。

### Added
- **`lumilab-payment-link`** 新 skill — Stripe Test Mode 真 checkout（创建 product + price + payment_link），让 fake-door 验证页能测真实付费意愿，不止留邮箱。
- **`lumilab deploy --public` / `--indexable`** 三档可见性：默认私有 / `--public` 公开但 noindex / `--public --indexable` SEO 上线；wrangler 4.x 下自动先建 Pages 项目再部署。
- **`lumilab demo`** 命令 — 把 `lumilab-meta` 样例 venture 落到 `~/.lumilab/data/ventures/`，全新装机首跑 `lumilab home` 即有可点样例。
- 一键安装分发：`curl -fsSL https://get.lumiclaw.ai | bash`（不暴露 GitHub 仓库），多宿主 `install.sh`（Claude Code / OpenClaw / Codex / Gemini 自动探测）+ 升级保留本地数据。

### Fixed
- **studio `render.ts` stage→skill 接线**：移除 5 个不存在的幻影 skill 名（clarify / product-shape / build / launch / retro），改指真实主 skill（coach-yc / research-platforms / product-mvp / landing-mvp / launch-strategy / weekly-sop-runner）。
- `lumilab idea` 新建 venture 后立即渲染其 studio → home 点进去不再 404。
- `lumilab deploy` 在 wrangler 4.x 下先 `pages project create` 再部署（幂等）。

## [1.8.0] · 2026-05-28 · 决赛冲刺收尾

> 把工作区源（lumi-lab/workspace/）和发布产物（releases/lumilab/）的真相对齐；
> 为 v2.0.0 "BYOK → hosted 中转"切换打地基。

### Added
- **`workspace/skills/_lib/lumilab-services/`** 空骨架（mode.ts / index.ts / README）。这是 v2 把所有外部 API 抽离到一处的预留点；当前不影响功能。
- `~/.lumilab/config.json` 新增三字段：`service_mode: "byok"` · `hosted_endpoint: null` · `hosted_session_token_ref: null`。byok 是默认；hosted 留给 v2 切换。
- `docs/ARCHITECTURE.md` § 14 **Provider Abstraction Pattern**（公开版同步发布）。
- `scripts/release.sh` 升级为标准构建流水：workspace → release 同步 + anti-slop 全量扫描 + 版本一致性校验。

### Changed
- Anti-slop 词表扫描范围把 `CHANGELOG.md / README.md / RELEASE_NOTES.md / ATTRIBUTION.md / LICENSE` 加入白名单。说明文档讨论禁词不再被打。
- `lumilab-design-direction/SKILL.md` 上游引用块替换原硬编码 `/Users/cheche/...` 路径为"上游灵感来源（非依赖）"说明。

### Removed
- `lumilab-studio/scripts/render-editorial-backup.ts`（30KB 历史 backup，已并入 render.ts）

### Fixed
- 工作区 11 个 stub SKILL.md（指向不存在的 `/Users/cheche/...`）已被实际 v1.8.0 内容替换。

## [1.5.0 ~ 1.7.x] · 2026-05-15 ~ 2026-05-25 · 决赛后续打磨

> 1.4.1 之后的若干打磨版本，主题：search provider 切换 + studio 交互模式 + CLI 扩展。

### Added
- `lumilab-studio/scripts/serve.ts` — Studio 进入 **dual mode**：file:// 静态浏览（旧）+ localhost 交互编辑（新，假设增删/决策记录直写回 YAML）。
- `lumilab-research-platforms/scripts/web_tavily.ts` — Tavily 为 web research 默认 provider。
- CLI 新增 `lumilab idea "<一句话>"` 一键 idea → landing 编排入口。

### Changed
- **Search provider：Exa → Tavily**（覆盖 31 处引用、wizard 卡片、SKILL 描述、TUTORIAL 配置示例）。原因：Tavily 中国可达性更稳。
- `lumilab-config` wizard 配置卡片对齐到新 provider 列表。

## [1.4.1] · 2026-05-15 · 决赛提交版

> 决赛提交节点（5-14 24:00 截止后 patch 修订）。

### Added
- 24 个 skill 全部加 `scripts/anti-slop-lint.ts` + `scripts/validate-output.ts`（确定性、可独立运行、exit 0/1）
- 新增 `lumilab-home`（dashboard 入口）+ `lumilab-idea-to-landing`（自动编排）= 24 skill
- CLI 新增：`home / idea / retro / research-xhs / research-web / secrets`
- `lumilab-config/scripts/keychain.ts` — secrets 三段后端：macOS keychain / Linux libsecret / plaintext fallback

### Changed
- 每个 SKILL.md 补 5 段工程化内容（Idempotency / Privacy / Cache / Failure modes / Edge cases）+ `## Alternatives` / `## Moat` / `## 分支决策` if-then 表 / `## Changelog`

## [1.0.0] · 2026-05-14 · SkillLens S 级首发

> 决赛作品提交版（21 skill 全部 S 级）。

### Added
- 21 skill 完成 SkillLens Deep Review，平均分 **91.59**，全部 `deepReviewCertificate.status = "verified"`
- 4 轮迭代：rc1 (80.53) → rc2 (87.32) → rc3 (87.25) → v1.0 (91.59)
- 公开 README + 安装脚本 + manifest.json（agentskills.io v1）

详见 `docs/SKILLLENS_REPORT.md`（v1.0 历史快照）。

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

## [1.8.0] · 2026-05-23 · Home 服务模式 + 方向选择 + 设计系统 demo

> Home 从 file:// 升级为服务模式（内容实时、点进 venture 即可编辑）；产品阶段可选方向生成 landing；构建阶段加可视化、可调的设计系统 demo。

### Added
- **Home 服务模式** —— `lumilab home` 默认起本地 server 打开 `/_home/home.html`，访问即重渲（内容实时），从 home 点进任意 venture studio 都是交互态。`serve.ts --home` 支持；`--static` / `--read-only` 回退旧 file://。
- **方向选择（P2）** —— 产品 stage 每个方向卡片新增「用此方向生成 Landing →」按钮：`/api/direction/select` 记录方向决策 + 给 AI 宿主一句可复制的生成 prompt（生成 landing 是 LLM 工作，server 不跑 LLM）。方向卡片补充 `risk` 展示。
- **设计系统 demo（P3）** —— 构建 stage 新增 Design System 区：预设 / **圆角滑块** / 方差·动效·密度旋钮 / 强调色，**实时预览卡片**（圆角、阴影、主次按钮、chip、调色板随旋钮即时变化）。「应用设计」→ `/api/design/adjust` 写回 `design_direction.json` 并重渲；「用此设计生成新 Landing」→ AI handoff prompt。
- serve.ts 新增 `/api/design/adjust`、`/api/direction/select` 端点。

### Fixed
- `lumilab home` 之前用 `file://` 打开静态文件、点进 venture 是只读且内容可能过期 —— 现走服务模式，实时重渲、可编辑。

---

## [1.7.0] · 2026-05-22 · 交互 Studio + 出海关键词引擎 + landing 英文化

> Studio 从「只读看板」升级成真正可编辑的作战室；关键词调研接入 DataForSEO 并默认出海/英文；landing 出海默认产出地道英文。

### Added
- **交互 Studio（`scripts/serve.ts`）** —— 本地 `localhost:7777` HTTP server（占用顺延 7778-7786）。同一个 `index.html` 用 `location.protocol` 运行时检测模式，无需两套构建：
  - 假设：编辑 / 迭代为新版（旧条 supersede 保留历史）/ 删除（软删 status=archived）—— 右侧面板内联表单，POST 回写 YAML 后自动重渲
  - 决策：编辑 / 删除
  - 写 API：`/api/hypothesis/{save,supersede,delete}`、`/api/decision/{save,delete}`、`/api/render`
- **DataForSEO 出海关键词引擎接入流水线** —— 每个新 venture 自动跑一次英文/US 搜索需求调研（搜索量 / KD / 趋势 / 红蓝海），关键词强制英文化对标 Google 海外数据。
- **landing 语言分层** —— 出海默认产出 native-English landing（Anti-Slop EN + 英文 CTA/modal/SEO）；过程文件与 Studio dashboard 仍全中文。Phase 0 新增「目标市场」选项（默认出海）+ 英文 landing 知情确认。

### Changed
- `lumilab studio <v>` 默认起交互 server（可编辑）；`--static` / `--read-only` 回退旧的 `file://` 只读模式。
- 跨页链接（landing / 市场报告 / 各版本 / 回首页 / 上线页）统一新标签页打开（`target="_blank"`）。
- 已部署 venture 的「已上线 ↗」链接置于顶栏主位。

### Fixed
- 假设 / 决策详情面板的「编辑 / 迭代 / 删除」按钮此前是死按钮（无任何事件绑定）—— 现已接活；`file://` 只读模式下降级为可复制的操作提示，不再无反应。
- `render.ts` 的 `extractField` 正则只认 `**加粗**` 格式，抓不到 `project_brief.md` 实际的 `- 目标用户:` 列表项 —— 已兼容列表 / 裸行 / 中文冒号，dashboard 不再缺 audience。
- idea-to-landing 流水线此前从不生成 `hypotheses.yaml`，导致 Studio「初始假设」区永远为空 —— Phase 3 决策门后新增强制写初始可证伪假设步骤。
- `data-copy` 复制在 `file://` 下静默失败 —— 加 `execCommand` 降级 + toast 反馈。

---

## [1.6.3] · 2026-05-22 · home 区块顺序：venture 在前、配置在后

> 用户反馈：最近的 venture 列表应该在前，配置卡片在后。

### Changed
- home dashboard 区块顺序对调：**Nº 01 我的 venture → Nº 02 工具集成 → Nº 03 下一步**（原来工具在最前）。venture 是用户每次回来最关心的，前置；工具配置改为次要位置

---

## [1.6.2] · 2026-05-22 · home 工具区加「修改配置」入口

> 用户反馈：home 打开后，配置位置附近应该有修改按钮能唤起修改界面。

### Added
- **home dashboard「工具集成」区右上角加「✎ 修改配置」按钮**：点击展开面板，给两种唤起配置向导的方式 —— ① 跟 AI 说「打开 lumilab 配置」，② 终端 `lumilab config`（点击即复制到剪贴板）。面板说明配置向导会在浏览器打开、保存后首页自动重渲染
- 纯前端 toggle + clipboard JS（静态页一贯做法，不依赖常驻服务）；按钮/面板沿用 editorial 主题（圆角 + 重音色 + 卡片阴影）

### Changed
- 仅改 `lumilab-home/scripts/home.ts`（renderTools + CSS + 内联 script）；anti-slop 仍干净；footer 去掉写死的旧版本号

---

## [1.6.1] · 2026-05-22 · 配置向导引导页视觉打磨

> 用户反馈：直角太锐利、信息分层不清晰、没有重点。

### Changed
- **柔化圆角**：editorial 主题 `--radius` 2px → 8px，新增 `--radius-lg`（卡片/容器用更大圆角），各主题同步加 `--radius-lg`（minimalist/brutalist 仍为 0 保持识别度）
- **加入层次与重点**（wizard 引导页 CSS）：
  - 新增暖色调柔和阴影 token（`--shadow-sm/md/lift/accent`），卡片浮起而非平铺硬框
  - 流程图升为 hero：抬高加阴影；两个「产物 ①②」节点填实重音色 + 白字，作为真正产出跳出来
  - 两张产物卡：阴影 + hover 上浮 + 红色顶边 + 圆形编号徽标
  - 区块标题加重音 kicker 竖条；「这一步」提示带填色；步骤条圆角 + 当前步更突出；skill chip 改胶囊 + 微阴影
- 仅改 `lumilab-config/scripts/wizard.ts` 的 CSS，不动逻辑；anti-slop 仍干净（OKLCH only，无 Inter/Roboto，无紫渐变）

---

## [1.6.0] · 2026-05-22 · Web 搜索调研：Exa → Tavily

> 调研用的 Web 搜索 provider 从 Exa 换成 [Tavily](https://www.tavily.com/)。

### Changed
- **Web 搜索 adapter 换 Tavily**：`research-platforms` 的 `web_exa.ts` → `web_tavily.ts`，改用 `POST https://api.tavily.com/search`（`Bearer tvly-` 认证），输出文件 `research/web_exa.json` → `web_tavily.json`，`source` 枚举 `exa` → `tavily`
- **配置项重命名**：secret key `exa_api_key` → `tavily_api_key`，env `EXA_API_KEY` → `TAVILY_API_KEY`，config flag `has_exa` → `has_tavily`；wizard 的 verify 打 Tavily real API（保留 E_401/E_403/E_429 错误码）
- **接线同步**：`orchestrate.ts`（token 检测）、`home.ts`（工具状态卡）、`validate-output.ts`（schema 枚举）、24 个 SKILL.md / README / docs 全部从 Exa 改到 Tavily
- `VERSION` 1.5.0 → 1.6.0；manifest tool_token `EXA_API_KEY` → `TAVILY_API_KEY`

### Migration
- 已配过 Exa 的用户：重跑 `lumilab config` 填 Tavily key（`app.tavily.com` 拿，`tvly-` 开头），或 `lumilab secrets set TAVILY_API_KEY <key>`。旧的 `exa_api_key` 不再读取。

---

## [1.5.0] · 2026-05-15 · home ↔ Studio 打通 + 写时更新 + idea 驱动设计

> 用户本地实测的一批问题（导航断裂、阶段产物脱节、首页不更新、设计套预设）一次性修掉。

### Added
- **写时更新机制**：home dashboard 和 venture Studio 没有常驻进程，改为「谁写数据谁顺手刷新」。24 个 SKILL.md 全部加 `## 写时更新` 段，指导宿主 agent 写完 venture 数据后重渲 `studio/render.ts` + `home.ts render`；CLI 入口（`idea` / `config` / `deploy`）已内置
- **idea 驱动设计方向**：landing 的视觉风格由 idea 的产品特征 + 人群特征推导，不再直接套用户首次引导选的全局预设。全局 `default_design_preset` 降级为兜底；`design_direction.json` 新增 `rationale` 字段

### Fixed
- **home ↔ Studio 导航打通**：首页 venture 区改为可点击卡片列表（进度条 / 状态 / 更新时间 / 「已上线」徽标），点进对应 Studio；Studio 左侧导航与中间阶段进度都可点击且同步；「全部 ventures」「回首页」是真链接，「新建 venture」给出可复制指令
- **Studio 阶段内容接上真实产物**：调研→市场报告 HTML，产品→`decisions.yaml` 选定方向，构建→`landing/v<N>/`，启动→`shares.json` 上线 URL，复盘→retro YAML。缺产物的阶段提示「待流水线推进」而不是「去手动跑某个 skill」
- **Studio 部署按钮失效**：删掉无效的 `<button>部署</button>`，改为已上线则显示链接、未上线则给可复制的 `lumilab deploy <slug>` 指令 + AI 宿主一句话引导
- **配置 / 部署后首页不更新**：`wizard.ts` 存配置后、`deploy.ts` 部署后、`orchestrate.ts init` 建 venture 后，都 best-effort 重渲 home（部署额外重渲 studio）

### Changed
- `VERSION` 1.4.2 → 1.5.0；manifest / README / 根 SKILL.md 同步到 1.5.0

---

## [1.4.2] · 2026-05-15 · 修复部署两个 bug

> 用户本地实测发现。

### Fixed
- **Cloudflare token 读取 key 名不一致**：wizard 历史上把 token 存成 `cloudflare_token`，而 deploy.ts 读的是 `cloudflare_api_token` → 读不到、报「token 未配置」。修复：deploy.ts 现在把所有变体都读一遍（env → keychain → secrets.json），并跳过占位值 `"fake"`；wizard.ts 统一写规范 key `cloudflare_api_token`
- **deploy 默认部署错了页面**：`lumilab deploy` 之前只认 `studio/`，把作战室日志部署上去了，而不是 landing 验证页。修复：默认部署 `landing/v<N>/`（或 `landing/`）；找不到 landing 明确报错、绝不静默 fallback；新增 `--target studio` 显式部署作战室

### Changed
- `VERSION` 1.4.1 → 1.4.2

---

## [1.4.1] · 2026-05-14 · 修复 venture / home 数据落点 bug

### Fixed
- **系统性路径 bug**：所有脚本用 `LUMILAB_WORKSPACE ?? process.cwd()` 定位 `data/ventures/`。skill 被宿主对话式调用时没有 `LUMILAB_WORKSPACE`、cwd 又是 skill 目录 → 数据写进了 `~/.claude/skills/<skill>/data/` 里。
- **修复**：venture / home 数据**永远**在 `~/.lumilab/data/`（`LUMILAB_HOME` 下，稳定共享目录），跟 cwd / 谁调用无关。改了 7 个脚本：`home.ts` / `orchestrate.ts` / `web_exa.ts` / `xhs_tikhub.ts`（research-platforms）/ `research.ts`（research-keywords）/ `manage.ts` / `deploy.ts`
- **CLI**：`VENTURES` 改到 `~/.lumilab/data/ventures/`；`SKILLS` 目录自动探测（repo 内 → `repo/skills`；装到 `~/.lumilab/bin/` 跑 → `~/.claude/skills`）；不再向子进程传 `LUMILAB_WORKSPACE`
- `install.sh` 去掉无用的 `.lumilab-env`（CLI 现在自动探测）
- 验证：从任意 cwd 跑 `home.ts render` / `orchestrate.ts init`，数据都正确落在 `LUMILAB_HOME/data/`，不再泄漏到 cwd 或 skill 目录

### Changed
- `VERSION` 1.4.0 → 1.4.1；24 个 SKILL.md frontmatter 同步
- `lumilab-home` / `lumilab-idea-to-landing` SKILL.md 里的路径说明统一为 `~/.lumilab/data/...`

---

## [1.4.0] · 2026-05-14 · 新增门面 skill `lumilab-home`

> 实测反馈：装完没有明显入口、首次没触发引导、没有 home/dashboard。这版补上「门面」。

### Added

**新 skill `lumilab-home`（第 24 个，bundle 门面 / 入口）**
- 触发词：「打开 lumilab」「lumilab home」「lumilab dashboard」「开始用 lumilab」「然后呢」
- **首次使用**（`~/.lumilab/config.json` 无 `onboarded`）→ 自动引导：本地开 `lumilab config` 浏览器引导页，chat 环境走 `wizard.ts --chat-onboard`
- **回访** → 渲染 **home dashboard** HTML：9 个工具 ✓/— 状态、所有 venture + 各自 5 阶段流水线进度条、基于状态的下一步建议
- `scripts/home.ts`：`status`（确定性 JSON）+ `render`（生成 `data/_home/home.html`）；配 `validate-output.ts` + `anti-slop-lint.ts`
- dashboard 美学与 Studio / 市场报告同族（Fraunces + JetBrains Mono + OKLCH 暖纸色 + SVG grain），响应式

**CLI 门面入口**
- `lumilab home` 命令；裸 `lumilab`（无参数）现在走门面而非 help —— 首次引导 / 否则 home dashboard
- `install.sh` 把 CLI launcher 复制到稳定位置 `~/.lumilab/bin/lumilab`（不再依赖 repo 目录，解决「repo 在 /tmp 被清理 CLI 就没了」）
- `install.sh` 结尾改成明确的入口提示：「在 AI 宿主里说『打开 lumilab』」

### Changed
- `VERSION` 1.3.2 → 1.4.0；manifest 24 skills + `default_entry: lumilab-home`
- 根 `SKILL.md` skill_count 23 → 24，default_entry → lumilab-home
- README 中英双版：skill 数 → 24、新增「门面 / 入口」层、install 段加「打开 lumilab」入口说明

---

## [1.3.2] · 2026-05-14 · 清理旧项目名 + bundle 入口 SKILL.md

### Changed
- 清理全部 **VST / Venture Skill Team / vst-team** 旧项目名残留（改名 Lumi Lab 前的命名），21 个 SKILL.md + 脚本注释统一为 Lumi Lab；对话示例里的 `VST:` 前缀改为 `Coach:`
- 新增 **bundle 入口 `SKILL.md`**（仓库根目录）—— 介绍整个 bundle、默认入口、23 skill 协同关系，含 agentskills.io v1 frontmatter
- `VERSION` 1.3.1 → 1.3.2

> 注：代码库内不含、也从未含任何「Fun Skills / 繁星」等比赛专有标识；本次只是清理旧项目名。

---

## [1.3.1] · 2026-05-14 · 首次引导页打磨（基于截图反馈）

> 用户实测首次引导页后的一轮打磨。

### Fixed
- **代码块竖排 / 重叠 bug**：`.tips`/`.intro` 里的 `<code>`（如 `lumilab idea "<你的想法>"`）因 grid `1fr` 列 + `white-space: nowrap` 撑爆列宽导致溢出重叠。改 flex 布局 + `<code>` 允许换行（`overflow-wrap: anywhere`）
- 根路径 `/` 重定向：未引导完的用户现在永远从 Step 1 开始（之前会跳到 `cfg.step+1`）
- `wizard.ts` 现在读 `LUMILAB_HOME` 环境变量（之前硬编码 `~/.lumilab`）

### Changed
- **基础字号 + 大屏适配**：body `14px` → `clamp(15px, …, 17px)`；`.shell` 宽度 `760px` → `clamp(760px, 60vw, 1040px)`；正文 / 标题字号上调；行高 1.45 → 1.6
- **实时换主题**：Step 2 选界面风格时整个向导页面立即 re-theme（4 套完整 OKLCH 主题），并贯穿 Step 1-6
- **每步加「这一步会做什么」说明框**
- **Step 1 内容重做**：强调两个产物（网页版分析报告 + fake-door 验证页）、新增 12 个 skill chip「秀肌肉」展示、文案改为痛点+回报开场
- **Step 6 总览升级**：工具集成从「逗号列表」改为 9 个工具逐个 ✓/— 网格（已配 N/9）；新增「✓ 已自动保存，不需要回去告诉 AI」醒目提示框
- **DataForSEO 字段说明清晰化**：API login（邮箱）/ API password（独立生成的，非账户登录密码），指引指向 dashboard 的 API CREDENTIALS 面板
- **`apiDone` 退出时打印结构化配置摘要**到 stdout（含 `LUMILAB_ONBOARD_DONE {json}` 机器可读行）—— `lumilab config` 阻塞返回时宿主 agent 直接看到配了什么，用户无需手动转述

### Changed (versions)
- `VERSION` 1.3.0 → 1.3.1

---

## [1.3.0] · 2026-05-14 · 首次引导页 + 关键词调研融入流程

> 两件事：① Setup Wizard 升级成真正的「首次使用引导页」；② 队友新增的 `lumilab-research-keywords` skill 建好脚本并融入主流程。

### Added

**`lumilab-config` 升级成 6 步首次引导页**
- Step 1 欢迎 → 真正的产品引导（idea→验证页流程图 + 使用提示）
- Step 2 **新增「界面风格」**：4 套美学样本可视化选，存为 `default_design_preset`，新 venture 的验证页用它当基准
- Step 6 完成步 → 「怎么开始」+ 写 `onboarded: true`
- **首次自动检测**：`config.json` 无 `onboarded:true` 时，`lumilab idea` 等命令会提示先跑引导
- **chat 版引导**：`wizard.ts --chat-onboard` / `--chat-onboard-preset` / `--chat-onboard-done` —— 飞书等 chat 环境文本走一遍同样的引导

**`lumilab-research-keywords`（队友新增 skill，本次建好并融入）**
- 定量搜索需求验证：把 idea 关键词反查 Google 搜索量 / CPC / KD / 12 月趋势 / 长尾扩展，标红蓝海
- 建好全套 `scripts/`：`research.ts` 主入口 + DataForSEO / Keywords Everywhere provider adapter + `scoring.ts` 红蓝海评分 + `serp-probe.ts` + `validate-output.ts` + `anti-slop-lint.ts`
- 无 token 自动 mock fallback（同 research-platforms 模式）
- SKILL.md 标准化到 v1 格式（补齐 Dependencies / Output validation / 主动交付 等 14 个标准段）

**融入 idea-to-landing 主流程**
- Phase 1 从「三路分析」扩成「四路分析」：市场 / 竞品 / 人群 / **搜索需求**
- `market_analysis.json` 加可选 `keywords` 段（source / summary / blue_ocean / red_ocean）
- `market-report.ts` 加「Nº 04 搜索需求 · 红蓝海」HTML 区块（蓝海 / 红海表格），向后兼容（无 keywords 时不渲染、方向建议回到 Nº 04）

**onboarding 收集关键词调研 token**
- wizard.ts Step 5 加 DataForSEO（login + password 两栏）+ Keywords Everywhere token 卡片
- `keywordseverywhere` 加入 chat-mode `--chat-set` 单 token provider；DataForSEO 走 `lumilab secrets set DATAFORSEO_LOGIN/PASSWORD`
- `verifyKeywordsEverywhere` 真实 API verify（打 `/v1/get_credits`）

### Changed
- `VERSION` 1.2.0 → 1.3.0；manifest 23 skills；22 SKILL.md frontmatter → 1.3.0
- CLI 加首次运行检测；`idea-to-landing` Phase 4.1 优先读 `default_design_preset`
- README 中英双版：skill 数 22→23、6 步引导页、research-keywords

---

## [1.2.0] · 2026-05-14 · 产品定义收敛 — C 端 idea 验证工具 + EXECUTION CONTRACT

> **基于第二次 Hermes 实测的纠偏。** v1.1.0 的 idea-to-landing 在实测中跑偏了：agent 把 SKILL.md 当「思考建议」读，分析全堆 chat 成大段文字、没生成 HTML、没跑到 landing、结尾还在问「回复一句：继续」。同时 user 收敛了产品定义——Lumi Lab 是 **C 端创业 idea 的快速验证工具**，最终产物是测购买意愿的 **fake-door 验证页**，不是营销页。

### Changed

**`lumilab-idea-to-landing` 加硬性 EXECUTION CONTRACT**
- 顶部加 7 条不可违反的硬约束：必须跑脚本 / 分析写进 JSON 文件不堆 chat / 必须交付 HTML / 最多问 2 次 / 过了决策门一路跑到产出不准停 / 结尾不准开放问题 / 分析阶段不准回头追问
- 加「反例」段：列出实测踩过的 6 个跑偏模式（分析堆 chat、结尾问「回复继续」、不出 HTML 等）
- Phase 4 reframe：从「生成 landing」改为「生成 fake-door 验证工具」
- Phase 5 加「怎么跑这个验证 + 回收哪 3 个数字」
- Example 改为完整流水线演示 + 反例对照

**`lumilab-landing-mvp` reframe 成 fake-door 验证页生成器**
- 用途从「营销落地页」改为「验证仪器」——产出是一个数字：多少人表达了购买意愿
- 新增 `## Fake-door 验证机制`：真实「立即购买/留邮箱」CTA + fake-door modal + 转化追踪 JS（`cta_click`/`email_submit`）+ 诚实边界（不假装能买）
- 新增 `## 验证指标`：UV / CTA 点击率 / 邮箱留资率 + 判断基准
- 质量 gate 7 → 8（加 fake-door gate）；validator 扩展校验真实 CTA / modal / 追踪 JS

**`lumilab-content-repurpose` 加验证模式**
- `--validate` 模式：生成专门测意愿的小红书/推特素材（明确「意愿动作」召唤 + 诚实定位 + 可回收信号设计）

**`lumilab-weekly-sop-runner` 加验证回收用法**
- 明确 idea 验证闭环最后一环：fake-door / 社媒的数字 → 四桶 → persevere/pivot/re-test 判断

### Why
第二次 Hermes 实测：分析质量不错但全堆在 chat 里、没产出 HTML、没跑到 landing、结尾又是开放问题。根因是 SKILL.md 不够 imperative。修复 = 硬性 EXECUTION CONTRACT + 反例清单。同时 user 收敛产品定义为「C 端 idea 验证工具」，landing = 验证仪器。

### Changed (versions)
- `VERSION` 1.1.0 → 1.2.0；manifest + 22 SKILL.md frontmatter → 1.2.0

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
