---
name: lumilab-content-repurpose
description: |
  Multi-platform content repurposing for venture validation. Takes one source content (idea, story, insight) and generates 5 platform-specific versions following each platform's hard constraints. Deep support for 小红书 / 微信公众号 / X. Template-based for 抖音 / 朋友圈 (Phase 0 lighter, Phase 1 enrich). Reads platform rules from memory/resources/platform-rules/. Use when user types /lumilab content or /lumilab build-assets.
  关键词：多平台内容 / 一稿七发 / 跨平台改写 / 内容矩阵 / 小红书 / 公众号 / 抖音 / 朋友圈 / X / 内容工厂 / 自媒体
version: 1.4.1
metadata:
  hermes:
    tags: [content, xiaohongshu, wechat, douyin, x, repurpose]
  lumilab:
    tier: core
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: content
  upstream:
    - "JimLiu/baoyu-skills (跨 runtime user-input + image-gen 抽象 + trigger shotgun)"
    - "white0dew/XiaohongshuSkills (XHS 必做约束金标准)"
    - "github.com/Jack5316/pyq-wechat-moments (朋友圈唯一参考)"
    - "github.com/johndoeblocks/copy-skill (Ogilvy + Handley)"
    - "github.com/revfactory/viral-copywriting"
  outputs:
    - "data/ventures/<name>/content/xhs/<slug>.md (深度)"
    - "data/ventures/<name>/content/wechat-mp/<slug>.md (深度，含排版)"
    - "data/ventures/<name>/content/x-twitter/<slug>.md (深度，thread 格式)"
    - "data/ventures/<name>/content/douyin/<slug>.md (模板)"
    - "data/ventures/<name>/content/wechat-moments/<slug>.md (模板)"
  reads:
    - "memory/resources/platform-rules/{xiaohongshu,wechat-mp,douyin,wechat-moments,x-twitter}.md (必读)"
    - "data/ventures/<name>/product_definition.md (一句话定位)"
    - "data/ventures/<name>/audience.md (目标用户语言习惯)"
    - "data/ventures/<name>/painpoints.md (痛点 → 钩子素材)"
    - "data/ventures/<name>/landing_copy.md (主文案，可复用)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Content Repurpose — 一稿改写 5 平台

## 用途

把 venture 的核心信息（定位 / 痛点 / 解决方案）改写成 5 个平台的合规内容。

**不是简单翻译/复制粘贴**：每个平台有不同的钩子结构、字数限制、视觉规则、违禁词。

**两种模式：**
- **传播模式**（默认）：venture 已经在跑，要持续产出内容。
- **验证模式**（`--validate`）：venture 还在验证阶段，内容的工作不是「传播」，是**测量意愿** —— 见下面「## 验证模式」。

## 验证模式（社媒验证素材）

当用户在用 `lumilab-idea-to-landing` 验证一个 idea，除了 fake-door landing，还可以用社媒测意愿。这个模式生成的小红书 / 推特素材，**目的是产生可计数的意愿信号**，不是涨粉。

每篇验证素材必须包含：
1. **一个明确的「意愿动作」召唤** —— 不是「点赞收藏」，是能体现购买意愿的动作：
   - 「想要的扣 1」/「需要的评论区 +1」/「我做出来你会买吗，会的话评论『要』」
   - 「留邮箱我第一时间通知你」（引导到 landing 或私信）
   - 「转发给一个需要的朋友」
2. **诚实定位**：说清楚「还在验证 / 还没做出来 / 想看看有多少人需要」—— 不假装产品已存在。诚实反而是强钩子（「我在考虑做一个 X，先问问大家」）。
3. **可回收的信号设计**：发之前就想清楚「跑完我数什么」——评论里的「要」数、私信数、邮箱数、转发数。
4. **目标人群在的平台**：从 `market_analysis.json` 的 `audience[].where_they_are` 选平台，不要 5 个平台全发。

输出 `data/ventures/<slug>/content/validation/<platform>.md`，每篇带一段 `## 怎么回收` 说明跑完数什么。

判断基准（经验值，需结合自身粉丝量调整）：一条几百赞的笔记，评论区 ≥ 30 个明确「要」≈ 中信号；有人主动私信问「怎么买 / 什么时候上」≈ 强信号。这些数字回收到 `lumilab-weekly-sop-runner` 的周复盘四桶。

## 流程

```
1. 读取源信息
   - product_definition.md / painpoints.md / landing_copy.md
   - 选择 1-2 个最强的「钩子角度」（用户决定或 Agent 推荐）
2. 用户确认源（避免改完才发现方向不对）
3. 并行生成 5 平台版本
4. 各自跑自检（见各平台 self-check）
5. 输出到 data/ventures/<name>/content/
```

## 深度 vs 模板平台分配

| 平台 | P0 处理 | P1 升级 |
|---|---|---|
| **小红书** | 深度（6 图 + 全文 + tags） | 同 + 多版本 A/B |
| **微信公众号** | 深度（HTML + 排版 + 配图） | 同 + 多标题 A/B |
| **X / Twitter** | 深度（thread 5-7 条） | 同 + 多钩子 A/B |
| 抖音 | 模板（前 3s 钩子 + 口播脚本骨架） | 完整分镜 + 字幕 + BGM 选择 |
| 朋友圈 | 模板（6 行 + 配图建议） | 同 + 行业话术库 |

## 钩子复用规则

一个 venture 的 5 平台钩子要**风格一致但表达不同**：

```
源洞察：「现有改写工具改完丢味，我们改完仍像你写的」

→ XHS（数字开头）："3 步让 AI 改写的内容仍像你"
→ 公众号（反差）："为什么 AI 改写后总是没了灵魂？"
→ X（反共识）："Stop using ChatGPT to repurpose your content."
→ 抖音（悬念）："这个工具，让 AI 改的内容不再像 AI"
→ 朋友圈（个人）："今天发现一个让我意外的事情..."
```

## 平台 know-how 引用

每个生成前**必读**对应文件：

```
memory/resources/platform-rules/xiaohongshu.md     ← XHS 必做约束 + 钩子模板
memory/resources/platform-rules/wechat-mp.md       ← 公众号 22 字标题 + 排版
memory/resources/platform-rules/x-twitter.md       ← thread 5 钩子结构
memory/resources/platform-rules/douyin.md          ← 前 3 秒 5 种钩子
memory/resources/platform-rules/wechat-moments.md  ← 6 行结构
```

文件已写好，包含每个平台 self-check 段。

## 输出格式

### content/xhs/<slug>.md（小红书深度）

```markdown
# 小红书发布版

## 标题（≤38 字，中 2 英 1 计算后 X 字）
3 步让 AI 改写的内容仍像你

## 6 图分镜
图 1（封面）：{title 大字 + 主题图描述}
图 2：{痛点呈现}
图 3-5：{3 个 takeaway}
图 6（CTA）：{评论引导}

## 正文
{4 段结构：钩子 / 价值 / 细节 / 互动}

## 标签（3-10）
#变现期博主 #内容创作 #AI改写 #小红书运营 #独立开发者

## Self-check
✓ 标题 18 字（≤38）
✓ 图文 6 张
✓ 首图大字标题：[已确认]
✓ 比例 3:4
✓ 标签 5 个
✓ 无外链
✓ 违禁词扫描：通过
```

### content/wechat-mp/<slug>.md（公众号 HTML + 排版）

```html
<!-- 公众号发布版 - 直接复制到后台编辑器 -->
<section style="...">
  <h1 style="...">{标题 ≤22 字}</h1>
  <p style="...">{开头钩子段}</p>
  ...
  <h2>{副标题}</h2>
  <p>{段落 ≤80 字}</p>
  ...
  <hr>
  <h3>参考链接</h3>
  <ul>
    <li>{外链 1}</li>
  </ul>
  <p style="...">{在看引导}</p>
</section>

<!-- Self-check
✓ 标题 X 字（≤22）
✓ 段落均 ≤80 字
✓ 外链已转底部
✓ 配图 X 张（≤8）
-->
```

### content/x-twitter/<slug>.md（X thread）

```markdown
# X Thread - 7 tweets

## 1/7（首推钩子，≤280 字）
{反共识/数字/故事}

## 2/7
{问题}

## 3/7
{洞察 1}

## 4/7
{洞察 2}

## 5/7
{洞察 3 / 案例}

## 6/7
{结论}

## 7/7 (CTA + 链接)
{follow + link}

## Self-check
✓ 首推 X 字（≤280）
✓ Thread 7 条
✓ Hashtag ≤2
✓ Emoji ≤2
✓ 语言一致性：[全英/全中]
```

### content/douyin/<slug>.md（模板版）

```markdown
# 抖音口播脚本（P0 模板版）

## 前 3 秒钩子（必）
[钩子结构：{数字冲击 | 反共识 | 悬念 | 痛点 | 个人故事}]
原文：{文字}

## 口播 (15-30s)
[钩子 0-3s]
"开场金句"
[停顿 0.5s]

[价值 3-15s]
"核心论点"，"详细展开"。
[快] 一个例子。

[结论 15-30s]
[慢] "所以，X 是 Y。"

[互动 30-45s]
"评论区告诉我..."

## 标题（≤14 字）
{title}

## 标签（2-3）
#{tag1} #{tag2}

## Self-check
✓ 前 3 秒钩子已写
✓ 长度 ≤60s
✓ 标题 X 字（≤14）
```

### content/wechat-moments/<slug>.md（朋友圈模板）

```markdown
# 朋友圈发布版

## 文案（6 行内）
Line 1: {钩子}
Line 2: {展开}
Line 3: {展开}
Line 4: {展开}
Line 5: {转折/反思}
Line 6: {CTA}

## 配图建议
{1/3/6/9 张配图，每张主题}

## Self-check
✓ 行数 6
✓ 首行钩子
✓ 无外链
✓ 配图 X 张
```

## 跨 platform 共享原则

- **统一品牌色 + 字体**（来自 design_direction.json）
- **统一价值主张**（不能这个平台说 A，那个说 B）
- **统一 CTA 方向**（都引到 Landing 邮件收集，或都引到微信号）
- **不统一**：语气、emoji 数、长度（按各平台规则）

## Anti-Slop

❌ 在小红书用「赋能 / 抓手 / 闭环」（B 端职场词，C 端用户反感）
❌ 在公众号每段都用 emoji（看着像营销号）
❌ 在 X 用纯英文 hashtag 跟中文混搭
❌ 在抖音直接说「关注我点赞」（限流）
❌ 5 个平台都用同一张图（图也要适配平台比例）

## 必做约束

```
✓ 每个平台读对应 memory/resources/platform-rules/<platform>.md
✓ 每个平台输出顶部带 self-check
✓ 不替用户按发布键
✓ 输出前过违禁词扫描
✓ 钩子风格 5 平台一致但表达不同
✓ 标签 / 数据 / 引导符合各平台规则
```

## 跨 runtime user-input 协议

terminal：`AskUserQuestion` 钩子选择 / 源确认。browser：`studio/preview/content-{platform}.html` 每平台预览（P1）。

## 引用

- 上游：见 metadata.upstream；必读 memory/resources/platform-rules/*.md
- 配套：lumilab-design-direction / lumilab-copy

## 分支决策

| 条件 | 动作 |
|---|---|
| 源信息齐全（product_definition + painpoints + landing_copy 都在） | 直接并行生成 5 平台 |
| 缺 product_definition.md | HALT，先跑 lumilab-product-positioning |
| 用户只要 1-2 个平台 | 只生成指定平台，跳过其余，不写空文件 |
| 违禁词扫描命中 | 高亮 + 给替代词，拒绝输出该平台，其余正常 |
| 标题超字数（XHS >38 / 公众号 >22 / 抖音 >14） | 自动截取 + 标 `[truncated]`，要求用户复核 |
| `LUMILAB_CHANNEL != local` | 走 chat-only fallback，文本编号交互 |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，扫 `content/<platform>/<slug>.md` 是否符合各平台硬规则（XHS 标题 ≤38 字、标签 3-10 个、≥1 图、无外链；公众号标题 ≤22 字、段落 ≤80 字；X thread 5-7 条、hashtag ≤2；抖音标题 ≤14 字 + 前 3 秒钩子；朋友圈 ≤6 行、无外链）。

```bash
bun run skills/lumilab-content-repurpose/scripts/validate-output.ts data/ventures/<slug>
# exit 0 = 全平台合规；exit 1 = 列出违例文件 + 规则
bun run skills/lumilab-content-repurpose/scripts/validate-output.ts --help
```

生成 5 平台内容后必跑一次；任何 exit 1 都必须修复后再交付。

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | $0（本地执行） | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | 约 $0.02–0.06（5 平台改写，复用宿主额度） | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/content/{xhs,wechat-mp,x-twitter,douyin,wechat-moments}/<slug>.md`

## Example

`@bot 把这篇笔记改写成 5 平台版本` → skill 读 platform-rules → 5 个文件，标题字数、标签数量、违禁词 100% 合规。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

5 平台各自写 `content/<platform>/<slug>.md`，重跑时覆盖**单个文件**（不动其它平台），用户可以单独刷新一个平台版本。

## Privacy

本地文件生成；微信公众号 / X 等若用户配了 publish token 才会真上传，默认只写本地 `.md`。

## Cache

平台规则文件（`references/platform-rules/*.md`）按 mtime 缓存。同一篇原文重跑 5 平台改写，结果非确定性但风格一致。

## Failure modes

若违禁词扫描挂 → 高亮违禁词 + 给替代词建议，不直接发；若超字数（如 XHS > 38 字标题）→ 自动截取 + 标注 `[truncated]` 让用户复核。

## Edge cases

XHS 笔记必须 ≥ 1 张图（无图直接报错）；X 串推自动分块 ≤ 280 字符；公众号底部不自动加水印（合规要求）。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **通用 LLM「帮我改成 5 个平台」**：能改，但不知道 XHS 标题 ≤38 字、不知道抖音违禁词、不知道公众号不能放外链。
- **各类「一键多平台」SaaS**：套壳分发，不做平台合规改写。
- **人工搬运**：慢，且规则记不全。

Lumi Lab 的差异：每个平台读 `references/platform-rules/*.md`（2025–2026 最新规则），违禁词扫描 + 字数/标签数硬约束，不合规直接拒绝输出。

## Moat（复利护城河）

platform-rules 持续更新，你跑得越久，积累的合规改写样本越多。`content/<platform>/` 历史稿件成为你的风格语料库，下次改写风格更稳。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。

## 主动交付（不要静默落盘）

这个 skill 产出的任何**用户该看的东西**，都要主动交付给用户 —— 不能写完文件就完事。

- **优先 HTML 图文并茂**：分析报告、landing、Studio、周复盘等用户要「看」的产物，渲染成 HTML，本地自动开浏览器，chat 环境（`LUMILAB_CHANNEL != local`）作为**文件附件**发给用户。
- **.md / .yaml 产物**：在 chat 里贴一段**纯文字摘要** + 告诉用户文件路径；用户要细节再发完整文件。不要假设用户会自己去翻 `data/ventures/` 目录。
- **每个 phase 结束**：用一两句话告诉用户「这一步做了什么、产出在哪、下一步是什么」。
- **判断「用户该看」的标准**：如果这个产物影响用户的下一个决策，或者用户花了输入成本期待一个结果 —— 就必须主动交付，不能等用户问。
