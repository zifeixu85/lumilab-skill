---
name: lumilab-research-platforms
description: |
  Dual-channel platform research for venture validation. Channel A = browser automation (Playwright / CDP) for 小红书 (P0), 抖音 / 微博 / 知乎 / B 站 (P1). Channel B = third-party APIs (Exa / Tavily for web; TikHub / 飞瓜 / 新榜 for China). Outputs cross-platform synthesis with pain point density, source URLs, evidence excerpts. Feeds back to hypothesis-ledger as evidence. Use when user types /lumilab research or asks for market/competitor/painpoint data.
  关键词：调研 / research / 市场调研 / 竞品分析 / 小红书搜索 / web search / 双通道 / Playwright / Exa / TikHub / cross-platform / 痛点挖掘
version: 1.0.0-rc1
metadata:
  hermes:
    tags: [xhs, exa, tikhub, research, playwright]
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
    - "Exa.ai / Tavily / TikHub / 飞瓜 / 新榜 APIs"
  outputs:
    - "data/ventures/<name>/research/web_findings.md"
    - "data/ventures/<name>/research/xhs_findings.md"
    - "data/ventures/<name>/research/cross_platform_synthesis.md (★ 推荐先看)"
    - "data/ventures/<name>/research/sources.jsonl (一行一条原始数据)"
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
  (Playwright / CDP / Camoufox)    (Exa / Tavily / TikHub / 飞瓜 / 新榜)
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
| **Web 通用** | - | ✅ Exa.ai（推荐）/ Tavily |
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
6. 写 xhs_findings.md
```

**Chrome profile 管理**：用 `~/.lumilab/config.json.search.xhs_chrome_profile`（默认 "openclaw"）。允许用户配多账号 profile。

## Web Exa 流程（dzhng/deep-research 算法）

```
function deepResearch(query, breadth=3, depth=2) {
  if (depth === 0) return collectedFindings;
  
  // 生成 breadth 个 SERP query
  const queries = await generateQueries(query, breadth);
  
  for (const q of queries) {
    const results = await exa.search(q);
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

写到 `research/sources.jsonl`（一行一条）。

## Cross-Platform Synthesis

**这是核心产物**。把所有平台数据交叉合成：

`cross_platform_synthesis.md`：

```markdown
# Cross-Platform Synthesis - {venture}

## Pain Point Density (来自所有 sources)

| 痛点 | XHS | Web | 抖音 | 加权 | Evidence |
|---|---|---|---|---|---|
| 改写后丢味 | ●●●●●  | ●●●  | - | ★★★★★ | [xhs/n123] [web/exa/r45] |
| 多平台分发耗时 | ● | ●●●● | - | ★★ | [web/exa/r12] |
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
多平台分发耗时,1,4,0,5,web/exa/r12
...
```

便于 Studio index 渲染交叉对比表格。

## Studio 集成

Research 跑完自动触发 Studio 重渲染。Studio index.html 增加「Research Insights」区块（见 PRODUCT_DESIGN §7.7）。

## 与 hypothesis-ledger 联动

Research 找到强信号 → 主动提示：

```
VST: 调研完了。发现一个冲突需要 surface 给你：

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
│   ├── web-exa.ts           # P0
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

## Dependencies

| 依赖 | 类型 | 是否付费 | 说明 |
|---|---|---|---|
| bun | CLI runtime | 免费 | ≥1.0，必需 |
| host LLM | 由 Claude Code / OpenClaw / Cursor / Hermes 提供 | 取决于宿主 | Lumi Lab 本身不直连 LLM，复用宿主 |

## Outputs

`data/ventures/<slug>/research/xhs_raw.json` · `research/web_exa.json`

## Example

`lumilab research-xhs "AI 副业" --venture my-v --limit 10`（自动 mock 或真抓）

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：让 host LLM 在对话中跑通 SKILL.md「真实示例」段即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## Idempotency

`research/xhs_raw.json` / `web_exa.json` 每次覆盖最新（按 keyword + ISO 时间戳备份到 `research/history/`）。

## Privacy

XHS / Exa 抓回数据本地存储；TikHub / Exa API key 走 keychain，不入仓库。爬取频率受 TikHub / Exa 配额限制，自动节流。

## Cache

同一 keyword 24h 内复用上次 raw json（除非 `--force`）。

## Failure modes

`E_401` 立即停止并提示 token 失效；`E_429` 等待 + 指数退避；无网络回退 mock 并标 `source: mock`。

## Edge cases

mock 数据明确标记 `notice` 字段，下游 skill 可识别；真假数据 schema 严格一致，下游 0 改动。

