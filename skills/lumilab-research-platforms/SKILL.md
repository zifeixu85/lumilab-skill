---
name: lumilab-research-platforms
description: |
  Dual-channel platform research for venture validation. Channel A = browser automation (Playwright / CDP) for 小红书 (P0), 抖音 / 微博 / 知乎 / B 站 (P1). Channel B = third-party APIs (Tavily / Tavily for web; TikHub / 飞瓜 / 新榜 for China). Outputs cross-platform synthesis with pain point density, source URLs, evidence excerpts. Feeds back to hypothesis-ledger as evidence. Use when user types /lumilab research or asks for market/competitor/painpoint data.
  关键词：调研 / research / 市场调研 / 竞品分析 / 小红书搜索 / web search / 双通道 / Playwright / Tavily / TikHub / cross-platform / 痛点挖掘
version: 1.4.1
metadata:
  hermes:
    tags: [xhs, tavily, tikhub, research, playwright]
  lumilab:
    tier: utility
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  upstream:
    - "clawhub:xiaohongshu-search-summarizer (Playwright + 多模态采集 + AI 综合 ★)"
    - "github.com/white0dew/XiaohongshuSkills (CDP 备选)"
    - "github.com/dzhng/deep-research (breadth × depth 迭代算法)"
    - "github.com/paperclipai/interview-script (Mom Test 访谈脚本)"
    - "github.com/openclaudia/icp-builder (ICP 画像)"
    - "Tavily / Tavily / TikHub / 飞瓜 / 新榜 APIs"
  outputs:
    - "data/ventures/<name>/research/xhs_raw.json (XHS 原始抓取数据)"
    - "data/ventures/<name>/research/web_tavily.json (Web 原始搜索数据)"
    - "data/ventures/<name>/research/cross_platform_synthesis.md (★ 推荐先看，跨平台合成)"
    - "data/ventures/<name>/research/painpoint_density.csv (痛点跨平台分布)"
  reads:
    - "data/ventures/<name>/project_brief.md (idea + 关键词)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么)"
    - "~/.lumilab/config.json (启用哪些通道)"
    - "~/.lumilab/secrets.enc (各家 API token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Research Platforms — 双通道平台调研

## 用途

调研 venture 的市场 / 竞品 / 用户痛点。**核心特色：覆盖中国平台**（小红书、抖音、微博、知乎、B 站），不只是英文 Web。

## 双通道架构

```
                  Research Agent
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
  通道 A：浏览器自动化              通道 B：第三方 API
  (Playwright / CDP / Camoufox)    (Tavily / Tavily / TikHub / 飞瓜 / 新榜)
        │                              │
        ▼                              ▼
  优点：真实数据 / 免费             优点：稳定 / 快 / 不封号
  缺点：被风控 / 慢                 缺点：付费 / 数据可能滞后
        │                              │
        └──────────────┬──────────────┘
                       ▼
            统一 search_result schema
            写入 data/ventures/<name>/research/
```

## P0 支持的通道

| 平台 | 通道 A（浏览器） | 通道 B（API） |
|---|---|---|
| **小红书** | ✅ Playwright（复用 xiaohongshu-search-summarizer） | TikHub（可选）|
| **Web 通用** | - | ✅ Tavily（推荐）/ Tavily |
| 抖音 | P1 | P1（飞瓜）|
| 微博 | P1 | P1 |
| 知乎 | P1 | P1 |
| B 站 | P1 | P1 |

## 命令

```bash
/lumilab research                                # 默认所有启用通道
/lumilab research --platforms=xhs,web            # 指定通道
/lumilab research --query="跨平台改写痛点"        # 直接给关键词（默认从 project_brief 提）
/lumilab research --depth=2 --breadth=3          # 控制迭代深度
```

## XHS Playwright 流程（复用 xiaohongshu-search-summarizer）

```
1. 启动 Chrome（用户的 openclaw profile）
2. 检测登录态：
   - 已登录 → 继续
   - 未登录 → 弹二维码让用户扫码（headed 模式）
3. 搜索关键词（来自 project_brief + hypotheses）
4. 抓 50 条结果：
   - 标题 / 描述 / 图片 OCR / 评论 top 10
5. AI 综合分析：
   - 高频词
   - 痛点词
   - 情感分布
   - 用户画像信号
6. 写 xhs_raw.json
```

**Chrome profile 管理**：用 `~/.lumilab/config.json.search.xhs_chrome_profile`（默认 "openclaw"）。允许用户配多账号 profile。

## Web Tavily 流程（dzhng/deep-research 算法）

```
function deepResearch(query, breadth=3, depth=2) {
  if (depth === 0) return collectedFindings;
  
  // 生成 breadth 个 SERP query
  const queries = await generateQueries(query, breadth);
  
  for (const q of queries) {
    const results = await tavily.search(q);
    const summaries = await summarizeResults(results);
    
    collectedFindings.push(...summaries);
    
    // 递归更深
    const nextDirections = await deriveDirections(summaries);
    for (const nd of nextDirections) {
      collectedFindings.push(...await deepResearch(nd, breadth - 1, depth - 1));
    }
  }
  
  return collectedFindings;
}
```

参数默认：breadth=3, depth=2（共 ~12 个查询）。

## 统一 search_result Schema

```typescript
interface SearchResult {
  source: 'xhs' | 'web' | 'douyin' | 'weibo' | ...;
  url: string;
  title: string;
  excerpt: string;
  metrics?: {
    likes?: number;
    comments?: number;
    views?: number;
    plays?: number;
  };
  comments_top?: { text: string; likes: number }[];
  author?: { name: string; followers?: number };
  retrieved_at: string;
  query: string;
}
```

每条 SearchResult 落进 `research/xhs_raw.json`（`notes[]`）或 `research/web_tavily.json`（`results[]`）。

## Cross-Platform Synthesis

**这是核心产物**。把所有平台数据交叉合成：

`cross_platform_synthesis.md`：

```markdown
# Cross-Platform Synthesis - {venture}

## Pain Point Density (来自所有 sources)

| 痛点 | XHS | Web | 抖音 | 加权 | Evidence |
|---|---|---|---|---|---|
| 改写后丢味 | ●●●●●  | ●●●  | - | ★★★★★ | [xhs/n123] [web/tavily/r45] |
| 多平台分发耗时 | ● | ●●●● | - | ★★ | [web/tavily/r12] |
| ...

## 高一致性强信号

→ "改写后丢味" 是跨平台高一致性强信号
  建议：进 hypotheses.yaml 升格为 h-{next}（confidence: high）

## 各平台独有信号

### XHS 独有
- ...

### Web 独有
- ...

## 用户画像（合成）

{ICP description from cross-platform}

## 建议的下一步

1. 进 lumilab-hypothesis-ledger 更新 h-001 → h-004
2. 调 lumilab-product-pmf 重新评估 PMF 信号
3. 重新跑 lumilab-content-repurpose 调整钩子方向
```

## Painpoint Density CSV

`painpoint_density.csv`：

```csv
painpoint,xhs_count,web_count,douyin_count,total_weighted,top_evidence
改写后丢味,5,3,0,11,xhs/n123
多平台分发耗时,1,4,0,5,web/tavily/r12
...
```

便于 Studio index 渲染交叉对比表格。

## Studio 集成

Research 跑完自动触发 Studio 重渲染。Studio index.html 增加「Research Insights」区块（见 PRODUCT_DESIGN §7.7）。

## 与 hypothesis-ledger 联动

Research 找到强信号 → 主动提示：

```
Coach: 调研完了。发现一个冲突需要 surface 给你：

     你最初的 h-001「分发耗时」: 0/12 Web + 1/15 XHS 提及
     调研发现 h-004「改写后丢味」: 3/12 Web + 5/15 XHS 提及
     
     建议：
     ☐ Supersede h-001 by h-004（推荐）
     ☐ 保留 h-001 + 新增 h-004（两个并行测）
     ☐ 暂不动，再调研一轮
     
     你选哪个？
```

用户选 → 调 lumilab-hypothesis-ledger Op 4 Supersede。

## 实现：scripts/

```
skills/lumilab-research-platforms/scripts/
├── research.ts              # 主入口 /lumilab research
├── synthesize.ts            # 跨平台合成
├── adapters/
│   ├── xhs-playwright.ts    # P0 - 复用 xhs-search-summarizer 逻辑
│   ├── web-tavily.ts           # P0
│   ├── web-tavily.ts        # P0 备选
│   ├── xhs-tikhub.ts        # P1
│   ├── douyin-cdp.ts        # P1
│   ├── feigua-api.ts        # P1
│   └── ...
└── deep-research.ts         # dzhng 算法（breadth × depth）
```

## 跨 runtime user-input 协议

```yaml
user_input:
  - mode: terminal
    method: "AskUserQuestion 选关键词 / 选通道 / supersede 确认"
  - mode: browser
    method: "登录二维码（Playwright 启动 Chrome 用户自己扫）"
    method: "Studio Research Insights 区块查看"
```

## 必做约束

```
✓ 默认 read-only（不替用户回复评论 / 私信）
✓ 各平台 rate limit 内置（XHS 不超 50 笔记/次，避免风控）
✓ 抓取数据带 timestamp + source URL（可追溯）
✓ Cross-platform synthesis 必带 evidence 引用
✓ 发现冲突信号必 surface 给用户（不自决 supersede）
✓ 用户的 Chrome profile 不污染（独立 profile，关闭时不存 cookie）
```

## Anti-Slop

❌ Synthesis 写「行业内卷严重」「用户需求多元化」（泛泛）
❌ 「我们发现了一些有趣的模式」（套话）
❌ 不带 source URL 直接说「用户都喜欢 X」

✅ 「在 5 条 XHS 笔记和 3 个 Web 来源里，用户提到 X」
✅ 每个 finding 至少 1 个 source URL + 1 个 verbatim excerpt
✅ 痛点权重用具体数字，不用「主要」「次要」

## 引用

- 上游：见 metadata.upstream
- 配套：lumilab-hypothesis-ledger（喂 evidence）
- 配套：lumilab-research-interview / icp / competitor（其他维度）
- 配套：lumilab-studio（渲染 Insights 区块）

## 分支决策

| if 条件 | then 走哪条路径 |
|---|---|
| 用户未指定 `--platforms` | 跑 config.json 里所有启用通道（默认 xhs + web） |
| `TIKHUB_API_KEY` 缺失 + 无 Chrome profile | XHS 通道回退 mock，标 `source: mock`，web 通道照常 |
| `TAVILY_API_KEY` 缺失 | web 通道回退 mock；提示用户去 lumilab-config 配置 |
| XHS 未登录态 + headless 环境 | 跳过 XHS Playwright，只跑 API/mock 通道，不强制扫码 |
| 同一 keyword 24h 内已有 raw json 且无 `--force` | 复用缓存，不重新抓取 |
| synthesis 发现跨平台强信号与现有 hypothesis 冲突 | surface 给用户选 supersede，不自决 |

## Output validation

`scripts/validate-output.ts` 是确定性 JSON schema 校验器，校验 `xhs_raw.json` / `web_tavily.json` 的 `source` 枚举、必填键、`notes[]` / `results[]` 元素类型。下游 skill 消费前必须先过校验：

```bash
bun run scripts/validate-output.ts data/ventures/<name>/research/
# exit 0 = schema 合规，exit 1 = 有违规并逐条列出
```

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| host LLM | 宿主提供 | 取决于宿主 | ~3-8k tokens / synthesis | 综合分析复用宿主，不直连 |
| Tavily API | Web 搜索 | 免费额度 + 付费 | basic 1 credit / advanced 2 credit（每月 1000 credit 免费额度，超出 ~$0.008/credit） | 缺 key 回退 mock |
| TikHub API | XHS 数据 | 付费 | ~$0.01 / 次搜索（按配额计） | 缺 key 回退 mock 或 Playwright |
| Playwright Chromium | XHS 浏览器通道 | 免费 | free（本地浏览器，仅耗时） | 备选 XHS 通道，需登录态 |

## Outputs

`data/ventures/<slug>/research/xhs_raw.json` · `research/web_tavily.json` · `research/cross_platform_synthesis.md` · `research/painpoint_density.csv`

## Example

`lumilab research-xhs "AI 副业" --venture my-v --limit 10`（自动 mock 或真抓）

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`research/xhs_raw.json` / `web_tavily.json` 每次覆盖最新（按 keyword + ISO 时间戳备份到 `research/history/`）。

## Privacy

XHS / Tavily 抓回数据本地存储；TikHub / Tavily API key 走 keychain，不入仓库。爬取频率受 TikHub / Tavily 配额限制，自动节流。

## Cache

同一 keyword 24h 内复用上次 raw json（除非 `--force`）。

## Failure modes

`E_401` 立即停止并提示 token 失效；`E_429` 等待 + 指数退避；无网络回退 mock 并标 `source: mock`。

## Edge cases

mock 数据明确标记 `notice` 字段，下游 skill 可识别；真假数据 schema 严格一致，下游 0 改动。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **手动刷小红书 / Google**：慢，记不全，无结构化输出。
- **通用 LLM 联网搜**：结果不结构化、不可复现、无配额管理。
- **各类爬虫 SaaS**：贵，且不为 venture 验证场景设计。

Lumi Lab 的差异：TikHub（XHS）+ Tavily（Web）双通道，结构化 JSON 输出，无 token 时 mock graceful fallback，schema 严格一致下游 0 改动。

## Moat（复利护城河）

research/history/ 累积所有抓取快照，同一 keyword 跨时间的趋势可对比——这是单次搜索给不了的。

## Changelog

- **1.0.0-rc4** — 新增 `scripts/validate-output.ts`（xhs_raw.json / web_tavily.json 确定性 schema 校验器）+ Output validation 段；新增 分支决策 if-then 表；Dependencies 表加单次调用约成本列；统一 outputs 文件名（frontmatter / 正文 / Outputs 段一致，改用脚本真实产出的 xhs_raw.json / web_tavily.json）。
- **1.0.0-rc1** — 初版：双通道平台调研 + 跨平台合成。

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

## 写时更新（产物变了就刷新 home / studio）

Lumi Lab 用「写时更新」保持 home dashboard 和 venture Studio 是最新的 —— 没有常驻进程做实时同步，所以**谁改了数据，谁负责顺手刷新**。

这个 skill 只要**创建或更新了某个 venture 的文件**（写了 `market_analysis.json` / `reports/` / `landing/` / `decisions.yaml` / `design_direction.json` / retro YAML 等），做完后**必须**：

1. 重渲这个 venture 的 Studio：`bun run ../lumilab-studio/scripts/render.ts ~/.lumilab/data/ventures/<slug>`
2. 重渲 home dashboard：`bun run ../lumilab-home/scripts/home.ts render`

这样用户回到 home 或 Studio 就能立刻看到这一步的产物，不用手动说「刷新」。如果只是读、没写 venture 数据，不用刷新。

CLI 入口（`lumilab idea` / `config` / `deploy`）已经内置了写时更新；**对话式调用时由你（宿主 agent）负责补这两步**。
