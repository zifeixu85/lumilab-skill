---
name: lumilab-research-keywords
description: |
  Quantitative search-demand validation for venture ideas. Given the product keywords behind an idea, reverse-searches Google search demand: search volume, CPC, competition, keyword difficulty, 12-month trend, related + long-tail + "People Also Search For" expansion. Scores each keyword direction as Blue Ocean / Red Ocean / Differentiation Opportunity. Pluggable provider layer — default DataForSEO (pay-as-you-go), optional Keywords Everywhere. SERP competition depth filled via lumi-lab's existing Playwright / Tavily. Feeds hypothesis-ledger as demand evidence and research-platforms cross-platform synthesis. Use when user types /lumilab keywords or asks for search volume / keyword difficulty / 红蓝海 / 关键词热度 / SEO 需求.
  关键词：关键词调研 / keyword research / 搜索量 / search volume / 关键词难度 / keyword difficulty / 长尾词 / long-tail / 趋势 / trend / 红海蓝海 / blue ocean / red ocean / 差异化机会 / SEO 需求验证 / DataForSEO / Keywords Everywhere
version: 1.4.1
status: P0-ready
metadata:
  hermes:
    tags: [dataforseo, keywordseverywhere, keyword-research, search-volume, blue-ocean]
  lumilab:
    tier: overlay
    requires_browser: false
    chat_only_ok: true
  category: agent
  agent: research
  authors: [lumilab]
  upstream:
    - "DataForSEO API v3 (https://docs.dataforseo.com/v3/) — default provider"
    - "Keywords Everywhere API v1 (https://api.keywordseverywhere.com/docs/) — optional provider"
    - "github.com/dzhng/deep-research (breadth × depth 迭代算法，复用关键词扩展)"
  outputs:
    - "data/ventures/<name>/research/keyword_landscape.md (★ 推荐先看 — 红蓝海地图)"
    - "data/ventures/<name>/research/keyword_metrics.csv (每个关键词全字段，供 Studio 渲染)"
    - "data/ventures/<name>/research/keyword_sources.jsonl (一行一条原始 API 返回，可追溯)"
  reads:
    - "data/ventures/<name>/project_brief.md (idea + 种子关键词)"
    - "data/ventures/<name>/hypotheses.yaml (要验证什么需求)"
    - "~/.lumilab/config.json (provider 选择 + 国家/语言)"
    - "~/.lumilab/secrets.json (DataForSEO / Keywords Everywhere token)"
license: Apache-2.0
platforms: [macos, linux]
prerequisites:
  env_vars: []
  commands: [bun]
compatibility: "Claude Code, OpenClaw 2026.4.25+, Hermes Agent v0.13.0+, Cursor, Codex"
---

# Research Keywords — 定量搜索需求验证

## 用途

用户给了 idea、定下了产品关键词之后，**反向去查这些关键词在 Google 上的真实搜索需求**：有多少人在搜、竞争多激烈、趋势是涨是跌、有哪些长尾切入点。把每个关键词方向标成**蓝海 / 红海 / 差异化机会**，让 idea 的市场体量和竞争格局变成可量化的判断。

## 在验证流程里的位置

Lumi Lab 的调研有两层，互补：

| Skill | 回答的问题 | 性质 | 数据源 |
|---|---|---|---|
| `lumilab-research-platforms` | 用户在**抱怨什么**、痛点密度 | 定性 | 小红书 Playwright + Tavily Web |
| **`lumilab-research-keywords`（本 skill）** | 有多少人在**主动搜**、竞争多激烈 | **定量** | DataForSEO / Keywords Everywhere + SERP 探测 |

两者产物都喂 `hypothesis-ledger`，并在 `cross_platform_synthesis.md` 里交叉合成。

## 何时调用

- 用户输入 `/lumilab keywords`
- 用户问「这个关键词搜索量多少」「难度大不大」「哪个方向是蓝海」「关键词热度」
- `lumilab-founder-coach` 定下产品关键词后，自动建议跑一轮
- Research Agent 跑完 platforms 调研后，建议补一轮 keywords 做定量交叉

## Provider 架构（pluggable adapter）

```
                 Keyword Research Agent
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
   Provider Adapter（统一接口）   SERP 竞争探测
   ┌─────────────────────┐      （复用 lumi-lab 现有）
   │ dataforseo（默认）   │      Playwright / Tavily
   │ keywordseverywhere   │      抓 SERP 首页强域名数
   │ (可选)               │
   └─────────────────────┘
              │                       │
              └───────────┬───────────┘
                          ▼
              统一 KeywordMetric schema
              红蓝海评分 → keyword_landscape.md
```

### Provider 对比与选择

| 维度 | DataForSEO（默认） | Keywords Everywhere（可选） |
|---|---|---|
| 计费 | **PAYG，$50 起充，余额不过期** | 年付制，credit 一年过期 |
| 认证 | Basic auth（login:password） | `Authorization: Bearer <key>` |
| 搜索量 / CPC / competition | ✅ Keywords Data 端点 | ✅ Get Keyword Data |
| 12 个月趋势 | ✅ + Google Trends 端点 | ✅ trend 数组 |
| **Keyword Difficulty 分数** | ✅ Labs Bulk Keyword Difficulty | ❌ 无（用 SERP 探测代理） |
| 相关词 / 长尾 / PASF | ✅ Labs Related/Suggestions/Ideas | ✅ Related + PASF 端点 |
| **SERP 竞品分析** | ✅ Labs SERP Competitors | ❌ 无（用 SERP 探测代理） |
| 与现有插件共用额度 | — | ✅ API 与浏览器插件共用 credit 池 |

**默认 `dataforseo`**：产品要给第三方用户用，充值即用、余额不过期，门槛最低。
**`keywordseverywhere`**：给本身已订阅 KE 的用户省钱用；它缺 KD 分数和 SERP 分析，由 SERP 探测层补齐。

provider 在 `~/.lumilab/config.json` 里配：

```json
{
  "keywords": {
    "provider": "dataforseo",
    "country": "us",
    "language": "en",
    "serp_probe": true
  }
}
```

## 命令

```bash
/lumilab keywords                                  # 从 project_brief 提种子词，默认 provider
/lumilab keywords --seed="跨平台内容改写,AI 改写工具"   # 直接给种子词
/lumilab keywords --provider=keywordseverywhere     # 覆盖 provider
/lumilab keywords --country=cn --language=zh        # 指定市场
/lumilab keywords --breadth=4 --no-serp-probe       # 控制扩展宽度 / 跳过 SERP 探测
```

## 流程

```
1. 取种子关键词
   ← project_brief.md 的产品关键词 + hypotheses.yaml 里要验证的需求
   ← 或 --seed 直接给

2. 关键词扩展（dzhng breadth × depth 思路）
   DataForSEO:        Labs Related Keywords + Keyword Suggestions + Keyword Ideas
   KeywordsEverywhere: Get Related Keywords + Get PASF Keywords
   → 收敛到 ~50–150 个候选关键词（去重、过滤无关）

3. 取指标（统一 KeywordMetric schema）
   每个关键词：vol / cpc / competition / keyword_difficulty / trend(12mo)
   DataForSEO: Keywords Data Search Volume + Labs Bulk Keyword Difficulty
   KE:         Get Keyword Data（KD 字段留空，等 SERP 探测补）

4. SERP 竞争探测（config.keywords.serp_probe，默认开）
   对 top 关键词（按 vol 排序取前 N，默认 15）：
   - 复用 lumi-lab 现有 Playwright / Tavily 抓 Google SERP 首页
   - 统计首页强域名数（DR 高 / 大站 / 官方）→ serp_strong_count
   - DataForSEO 用户可直接用 Labs SERP Competitors，跳过抓取

5. 红蓝海评分（见下）
   每个关键词打 opportunity_score + 标签

6. 写产物
   keyword_landscape.md / keyword_metrics.csv / keyword_sources.jsonl

7. 联动
   → 主动建议进 hypothesis-ledger（搜索需求 = 一类可证伪证据）
   → 触发 Studio 重渲染 Research Insights
```

## 统一 KeywordMetric Schema

不同 provider 的返回归一到这个结构，写入 `keyword_sources.jsonl`（一行一条）：

```typescript
interface KeywordMetric {
  keyword: string;
  provider: 'dataforseo' | 'keywordseverywhere';
  volume: number;                       // 月均搜索量
  cpc: number | null;                   // 美元
  competition: number | null;           // 0–1，广告竞争度（Google Ads）
  keyword_difficulty: number | null;    // 0–100，SEO 难度。KE 无此字段 → null，由 serp_probe 估
  trend: { month: string; year: number; value: number }[];  // 近 12 月
  trend_slope: number;                  // 派生：线性回归斜率，正=上升
  serp_strong_count: number | null;     // SERP 首页强域名数（0–10），serp_probe 产出
  relation: 'seed' | 'related' | 'longtail' | 'pasf';
  opportunity_score: number;            // 见评分公式
  verdict: 'blue_ocean' | 'red_ocean' | 'differentiation' | 'low_demand';
  retrieved_at: string;                 // ISO-8601
}
```

## 红蓝海评分

### opportunity_score 公式

```
demand   = log10(volume + 1)                       # 需求量，取对数压缩
momentum = clamp(1 + trend_slope_normalized, 0.5, 2)  # 趋势加成，上升乘正
friction = 1 + (keyword_difficulty ?? serp_proxy) / 25  # 竞争阻力
           # KD 缺失时 serp_proxy = serp_strong_count * 10

opportunity_score = round( demand * momentum / friction , 2 )
```

### verdict 标签规则

| verdict | 条件 | 含义 |
|---|---|---|
| `low_demand` | volume < 阈值（默认 50） | 没人搜，先别做 |
| `blue_ocean` | 有量 + KD/SERP 低 + competition 低 | 蓝海，可直接切 |
| `red_ocean` | 高量 + KD/SERP 高 + competition 高 | 红海，要么不碰要么找差异化 |
| `differentiation` | 高量 + 高竞争，**但** trend 上升 或 长尾切口明显 | 红海里的差异化机会 |

阈值放 `config.keywords` 里，可调。

## 产物

### keyword_landscape.md（★ 先看）

```markdown
# Keyword Landscape — {venture}

## 红蓝海地图

### 🔵 蓝海方向（建议优先）
| 关键词 | 月搜索量 | KD | 趋势 | opp_score | 证据 |
|---|---|---|---|---|---|
| ai 改写不丢味 | 1,300 | 18 | ↗ +22% | 6.8 | [src/dfs/r12] |

### 🔴 红海方向（需差异化）
| 关键词 | 月搜索量 | KD | SERP 首页强站 | 建议差异化切口 |
|---|---|---|---|---|
| ai 写作工具 | 40,500 | 76 | 9/10 | 垂直「跨平台改写」长尾切入 |

### 🟡 差异化机会
| 关键词 | 为什么是机会 |
|---|---|
| 多平台内容分发 | 量大(8,100) + 趋势 ↗ + 首页无垂直专做的产品 |

### ⚪ 低需求（暂不做）
- xxx（月搜索量 < 50）

## 综合判断
{2–3 句：这个 idea 的搜索需求整体处于什么位置，最该切哪个方向}

## 建议的下一步
1. 进 lumilab-hypothesis-ledger 把「{关键词} 月搜索量 ≥ N」升格为可证伪假设
2. lumilab-research-platforms 对蓝海关键词做定性痛点交叉验证
3. lumilab-landing-mvp 落地页主打蓝海关键词
```

### keyword_metrics.csv

```csv
keyword,provider,volume,cpc,competition,keyword_difficulty,trend_slope,serp_strong_count,relation,opportunity_score,verdict
ai 改写不丢味,dataforseo,1300,1.2,0.21,18,0.18,2,longtail,6.8,blue_ocean
ai 写作工具,dataforseo,40500,3.4,0.88,76,0.05,9,seed,1.9,red_ocean
```

Studio index 用它渲染红蓝海散点图（x=competition/KD, y=volume, 气泡=opportunity_score）。

## 与 hypothesis-ledger 联动

搜索需求是一类**可证伪证据**。跑完后主动 surface：

```
Coach: 关键词调研完了。发现一个可以升格成假设的强信号：

     「ai 改写不丢味」月搜索量 1,300，KD 仅 18，近 12 月趋势 +22%
     → 这是蓝海，且与你 h-002「用户在意改写后丢失原味」方向一致

     建议：
     ☐ 给 h-002 追加这条搜索需求证据（推荐）
     ☐ 新增 h-005「'ai 改写不丢味' 月搜索量 ≥ 1000 且趋势为正」
     ☐ 暂不动

     你选哪个？
```

用户选 → 调 `lumilab-hypothesis-ledger` Op 2（Add Evidence）或 Op 1（Add）。
**不自动写**——搜索量是信号不是结论，由用户决策。

## 与 research-platforms 联动

keywords 跑完后，把蓝海关键词回传给 `research-platforms` 做定性交叉：
「这些词有人搜，那他们在小红书/Web 上具体怎么抱怨的？」
最终在 `cross_platform_synthesis.md` 里，痛点密度表新增一列 `search_volume`，定性 × 定量对齐。

## Studio 集成

keywords 跑完自动触发 Studio 重渲染。Studio index.html 的「Research Insights」区块新增「关键词红蓝海地图」子块（散点图 + top 蓝海关键词列表）。

## scripts/ 布局

```
skills/lumilab-research-keywords/scripts/
├── research.ts                 # 主入口 /lumilab keywords
├── scoring.ts                  # opportunity_score + verdict 评分
├── serp-probe.ts               # 复用 Playwright/Tavily 抓 SERP 首页强域名数
└── providers/
    ├── index.ts                # provider 工厂，按 config 选择
    ├── dataforseo.ts           # 默认 — Keywords Data + Labs 端点
    └── keywords-everywhere.ts  # 可选 — get_keyword_data / related / pasf
```

每个 provider 实现统一接口：

```typescript
interface KeywordProvider {
  expand(seeds: string[], opts): Promise<string[]>;        // 扩展候选词
  metrics(keywords: string[], opts): Promise<KeywordMetric[]>;  // 取指标
}
```

## 配置位

`~/.lumilab/config.json` 新增 `keywords` 段（见上）。
`~/.lumilab/secrets.json` 新增（由 `lumilab-config` 向导收集）：

```json
{
  "dataforseo_login": "...",
  "dataforseo_password": "...",
  "keywordseverywhere_api_key": "..."
}
```

向导里两张 token 卡片，各带 4 步快速指引 + Verify 按钮：
- DataForSEO：注册 → 充值 $50 → API Dashboard 取 login/password → Verify 打 `GET /v3/appendix/user_data`
- Keywords Everywhere：装插件取 API key → Verify 打 `GET /get_credits`（返回 credit 余额）

## 必做约束

```
✓ 默认 read-only（只查不改）
✓ provider 调用带 rate limit + 重试（DataForSEO task 模式异步轮询；KE 单次 ≤100 词）
✓ 每条 KeywordMetric 带 provider + retrieved_at（可追溯，写 keyword_sources.jsonl）
✓ KD 缺失（KE）必须走 serp_probe 估算，不能留空就评分
✓ 评分阈值全部走 config，不硬编码
✓ 发现强信号必 surface 给用户，不自动写 hypotheses.yaml
✓ 成本提示：跑之前估算本次大概消耗（DataForSEO ~$ / KE ~credits），>预算阈值先确认
```

## Anti-Slop

❌ landscape 写「这个市场竞争激烈」「有一定的搜索需求」（泛泛、无数字）
❌ 「建议关注蓝海机会」（套话，不指具体关键词）
❌ 不带搜索量/KD 直接说「这个词值得做」

✅ 「'ai 改写不丢味' 月搜索量 1,300、KD 18、近 12 月 +22%，SERP 首页无垂直产品 → 蓝海」
✅ 每个 verdict 都有 volume + KD/SERP + trend 三个具体数字支撑
✅ 红海方向必须给出**具体的差异化切口**，不能只说「需要差异化」

## 引用

- 上游：见 metadata.upstream
- 配套：`lumilab-research-platforms`（定性痛点，交叉合成）
- 配套：`lumilab-hypothesis-ledger`（喂搜索需求证据）
- 配套：`lumilab-founder-coach`（定关键词后触发）
- 配套：`lumilab-landing-mvp`（落地页主打蓝海关键词）
- 配套：`lumilab-config`（收集 provider token）
- 配套：`lumilab-studio`（渲染红蓝海地图）

## Dependencies

| 依赖 | 类型 | 是否付费 | 单次调用约成本 | 说明 |
|---|---|---|---|---|
| bun | CLI runtime | 免费 | free | ≥1.0，必需 |
| DataForSEO API v3 | 默认 provider | 付费（PAYG，$50 起充，余额不过期） | ~$0.01–0.05 / 次（搜索量 + KD + 扩展端点合计，按关键词数计） | Basic auth；缺 token 回退 mock |
| Keywords Everywhere API v1 | 可选 provider | 付费（年付 credit，一年过期） | ~1 credit / 关键词（与浏览器插件共用 credit 池） | Bearer auth；无 KD 字段，由 serp-probe 补；缺 token 回退 mock |
| host LLM | 宿主提供 | 取决于宿主 | ~2–5k tokens / landscape 解读 | 红蓝海综合解读复用宿主，不直连 |
| SERP probe（Playwright / Tavily） | serp-probe 真实实现 | 免费（本地浏览器）/ 复用 research-platforms 配额 | free–低 | 当前为确定性 stub，TODO 接真实抓取 |

## Output validation

`scripts/validate-output.ts` 是确定性校验器，校验本 skill 写出的产物：`keyword_metrics.csv` 必含全部必需列、`keyword_landscape.md` 必含红蓝海段落。下游 skill 消费前必须先过校验：

```bash
bun run scripts/validate-output.ts data/ventures/<name>
# exit 0 = 合规，exit 1 = 有违规并逐条列出
```

**校验字段**（脚本头部 `校验字段:` 块同步）：

- `keyword_metrics.csv` — header 必含 `keyword, provider, volume, cpc, competition, keyword_difficulty, trend_slope, serp_strong_count, relation, opportunity_score, verdict`，至少 1 行数据行。
- `keyword_landscape.md` — 必含段落 `## 红蓝海地图`、`### 🔵 蓝海方向`、`### 🔴 红海方向`、`### 🟡 差异化机会`、`### ⚪ 低需求`、`## 综合判断`。

## Example

```bash
bun run scripts/research.ts --mock --seed="AI 改写工具" --venture my-v
```

无 provider token 时自动 mock，产出 `data/ventures/my-v/research/` 下三件套（landscape.md / metrics.csv / sources.jsonl）；配置 DataForSEO 后同一命令切真实查询，schema 不变。

## Tests

`tests/smoke.md` — 该 skill 的最小冒烟测试约定：host LLM 在对话中跑通 SKILL.md「Example」段、并验证 `validate-output.ts` + `anti-slop-lint.ts` 退出码均为 0 即视为通过。E2E 真集成见 `docs/TUTORIAL.zh.md`。

## 环境自检（首次运行前）

本 skill 的 `scripts/` 用 **bun ≥ 1.0** 运行。宿主里第一次调用 Lumi Lab 任意 skill 前，先做一次环境自检——缺 bun 就自动装（装在 `~/.bun/`，无需 root，约 30 秒）：

```bash
command -v bun >/dev/null 2>&1 || { [ -x "$HOME/.bun/bin/bun" ] && export PATH="$HOME/.bun/bin:$PATH"; }
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"   # 当前 shell 立即可用
```

宿主 agent（Claude Code / OpenClaw / Hermes）能跑 shell，应在首次调用前自动执行上面这段。纯方法论用法（不跑脚本、只读 SKILL.md 做对话）不需要 bun。

## Idempotency

`research/keyword_landscape.md` / `keyword_metrics.csv` / `keyword_sources.jsonl` 每次运行整体覆盖最新。同一 venture 重复跑相同 provider + 种子词 + 市场，结果稳定（mock 路径完全确定性；真实路径受 provider 数据刷新影响）。

## Privacy

provider token（DataForSEO login/password、Keywords Everywhere key）走 keychain，缺失时回退 `~/.lumilab/secrets.json`（chmod 600），不入仓库。查询关键词与返回指标本地存储在 `data/ventures/<name>/research/`。provider 调用带 rate limit + 重试，受各家配额限制自动节流。

## Cache

当前每次运行重新查询并整体覆盖产物。`keyword_sources.jsonl` 一行一条原始 KeywordMetric（带 `retrieved_at`），可作为历史快照保留以做跨时间对比。

## Failure modes

`E_401` / `E_AUTH` 立即提示 token 失效；`E_429` 由 provider 层等待 + 退避；单个扩展端点失败只记 stderr 不中断整体；任意 provider 整体失败或无网络 → 回退 mock 并在 `notice` 标注，退出码仍为 0，下游不阻塞。

## Edge cases

- 无 `--seed` 且无 project_brief → 用占位种子词跑通，stderr 提示。
- `--no-serp-probe` 或 config `serp_probe: false` → 跳过 SERP 探测；Keywords Everywhere 路径下 KD 仍为 null，friction 退化为仅 demand/momentum。
- mock 数据明确标 `source: mock` + `notice`，真假数据 schema 严格一致，下游 0 改动。
- `volume < low_demand_threshold`（默认 50）的词一律判 `low_demand`，不参与蓝/红海。

## Alternatives

用户现在可能用什么替代方案，以及 Lumi Lab 为什么不一样：

- **Google Keyword Planner 手查**：要跑广告账户，无 KD 分数，无结构化导出。
- **Ahrefs / SEMrush 订阅**：月费高，为 SEO 团队设计，不为 venture 验证场景做红蓝海判定。
- **通用 LLM 估搜索量**：纯猜测，不可复现，无 CPC / 竞争度 / 趋势真实数据。

Lumi Lab 的差异：pluggable provider（DataForSEO 默认 PAYG / Keywords Everywhere 可选），统一 KeywordMetric schema，确定性红蓝海评分，无 token 时 mock graceful fallback，产物直接喂 hypothesis-ledger 与 research-platforms 交叉合成。

## Moat（复利护城河）

`keyword_sources.jsonl` 累积每次查询的全字段 KeywordMetric 快照（带 `retrieved_at`），同一关键词跨时间的搜索量 / KD / 趋势变化可对比——单次查询给不了的纵向信号。多个 venture 的红蓝海判定还能横向沉淀成「哪些方向反复是红海」的经验。

## Changelog

- **1.3.0** — 新增 `scripts/`：research.ts 主入口 + scoring.ts + serp-probe.ts + providers/（index / dataforseo / keywords-everywhere）+ validate-output.ts + anti-slop-lint.ts；补齐 bundle 标准段（Dependencies / Output validation / Example / Tests / 环境自检 / Idempotency / Privacy / Cache / Failure modes / Edge cases / Alternatives / Moat / 主动交付）；frontmatter 升 v1（version 1.3.0 / license / platforms / prerequisites / compatibility / metadata.lumilab + hermes.tags）。
- **0.1.0** — 初版：pluggable provider 定量搜索需求验证 + 红蓝海评分规格。

## 主动交付（不要静默落盘）

这个 skill 产出的任何**用户该看的东西**，都要主动交付给用户 —— 不能写完文件就完事。

- **优先 HTML 图文并茂**：红蓝海地图（散点图 + top 蓝海关键词列表）渲染成 HTML，本地自动开浏览器，chat 环境（`LUMILAB_CHANNEL != local`）作为**文件附件**发给用户。
- **.md / .csv 产物**：在 chat 里贴一段**纯文字摘要**（top 蓝海词 + 综合判断）+ 告诉用户文件路径；用户要细节再发完整文件。
- **每个 phase 结束**：用一两句话告诉用户「这一步做了什么、产出在哪、下一步是什么」。
- **发现强信号必 surface**：蓝海关键词强信号要主动提示进 hypothesis-ledger，不自动写 hypotheses.yaml。
- **判断「用户该看」的标准**：如果这个产物影响用户的下一个决策，或者用户花了输入成本期待一个结果 —— 就必须主动交付，不能等用户问。

## 写时更新（产物变了就刷新 home / studio）

Lumi Lab 用「写时更新」保持 home dashboard 和 venture Studio 是最新的 —— 没有常驻进程做实时同步，所以**谁改了数据，谁负责顺手刷新**。

这个 skill 只要**创建或更新了某个 venture 的文件**（写了 `market_analysis.json` / `reports/` / `landing/` / `decisions.yaml` / `design_direction.json` / retro YAML 等），做完后**必须**：

1. 重渲这个 venture 的 Studio：`bun run ../lumilab-studio/scripts/render.ts ~/.lumilab/data/ventures/<slug>`
2. 重渲 home dashboard：`bun run ../lumilab-home/scripts/home.ts render`

这样用户回到 home 或 Studio 就能立刻看到这一步的产物，不用手动说「刷新」。如果只是读、没写 venture 数据，不用刷新。

CLI 入口（`lumilab idea` / `config` / `deploy`）已经内置了写时更新；**对话式调用时由你（宿主 agent）负责补这两步**。
