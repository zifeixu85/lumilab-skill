---
name: lumilab-content-repurpose
description: |
  Multi-platform content repurposing for venture validation. Takes one source content (idea, story, insight) and generates 5 platform-specific versions following each platform's hard constraints. Deep support for 小红书 / 微信公众号 / X. Template-based for 抖音 / 朋友圈 (Phase 0 lighter, Phase 1 enrich). Reads platform rules from memory/resources/platform-rules/. Use when user types /lumilab content or /lumilab build-assets.
  关键词：多平台内容 / 一稿七发 / 跨平台改写 / 内容矩阵 / 小红书 / 公众号 / 抖音 / 朋友圈 / X / 内容工厂 / 自媒体
version: 1.0.0-rc1
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
    - "data/ventures/<name>/content/xhs.md (深度)"
    - "data/ventures/<name>/content/wechat.html (深度，含排版)"
    - "data/ventures/<name>/content/x.md (深度，thread 格式)"
    - "data/ventures/<name>/content/douyin.md (模板)"
    - "data/ventures/<name>/content/moments.md (模板)"
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

### content/xhs.md（小红书深度）

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

### content/wechat.html（公众号 HTML + 排版）

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

### content/x.md（X thread）

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

### content/douyin.md（模板版）

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

### content/moments.md（朋友圈模板）

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

```yaml
user_input:
  - mode: terminal
    method: "AskUserQuestion 钩子选择 / 源确认"
  - mode: browser
    method: "studio/decisions/06-review-content.html (P1，模块审阅)"
    method: "studio/preview/content-{platform}.html (每个平台预览)"
```

## 引用

- 上游：见 metadata.upstream
- 必读：memory/resources/platform-rules/*.md
- 配套：lumilab-design-direction（视觉一致性）
- 配套：lumilab-copy（核心文案库）

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/content/{xhs,wechat-mp,douyin,wechat-moments,x}/*.md`

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
