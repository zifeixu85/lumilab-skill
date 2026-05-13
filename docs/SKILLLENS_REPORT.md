# SkillLens Deep Review · Lumi Lab v1.0.0-rc1

> **评测时间**: 2026-05-14
> **评测引擎**: `skilllens-python-cli` v0.2.0
> **Rubric**: SkillLens v3 (5 大支柱 × 24 子维度，rubric hash `5e5a124282f8cf33`)
> **评测模式**: agent-side Deep Review（LLM 评测部分用 Claude Opus 4.7 跑 SkillLens 官方 `--agent-prompt` 流程，再用官方 CLI merge）
> **认证**: `deepReviewCertificate.status = "verified"` × 21（每个 skill 都过官方 merge）

---

## 总览

| 指标 | 数值 |
|---|---|
| Skill 总数 | 21 |
| 平均分 | **80.53** / 100 |
| A 级（≥80） | **9** |
| B 级（70–79） | **12** |
| C / D | 0 |
| 全部 verified | ✅ |

按 SkillLens 官方分级（≥90 S / ≥80 A / ≥70 B / ≥60 C / <60 D）：

> v1.0.0-rc1 没有跑到 **S 级**（S 要求 ≥ 90，且 LLM 评测部分需要在 idempotency / cache friendliness / privacy / failure path 等子维度都有非常详细的工程化说明）。
> 9 个 skill 站在 **A 级**（含 `lumilab-weekly-sop-runner` 88.63，距离 S 仅 1.4 分）。剩 12 个全部 **B 级**，主要扣分在「无 `scripts/` 兜底」「frontmatter 含非标准 Lumilab/Hermes 字段触发 port 规则部分扣分」「output 校验未硬性 enforce」。

---

## 完整分数表（按分数倒序）

| 排名 | Skill | Score | Grade | 价值 25 | 市场 15 | 成本 15 | 稳定性 20 | 书写 25 | Cert |
|---:|---|---:|:--:|---:|---:|---:|---:|---:|:--:|
| 1 | `lumilab-weekly-sop-runner` | **88.63** | A | 22.72 | 13.60 | 13.04 | 17.55 | 21.72 | ✅ |
| 2 | `lumilab-config` | **86.28** | A | 21.89 | 13.07 | 11.36 | 16.90 | 23.07 | ✅ |
| 3 | `lumilab-deploy` | **85.44** | A | 21.67 | 13.05 | 10.80 | 16.85 | 23.07 | ✅ |
| 4 | `lumilab-research-platforms` | **85.28** | A | 21.77 | 13.09 | 10.66 | 16.92 | 22.84 | ✅ |
| 5 | `lumilab-content-repurpose` | **83.47** | A | 22.97 | 13.48 | 10.86 | 13.01 | 23.15 | ✅ |
| 6 | `lumilab-studio` | **81.92** | A | 21.58 | 12.21 | 12.09 | 15.50 | 20.55 | ✅ |
| 7 | `lumilab-coach-yc` | **81.36** | A | 22.55 | 13.74 | 8.80 | 13.02 | 23.25 | ✅ |
| 8 | `lumilab-research-icp` | **81.29** | A | 22.47 | 13.74 | 8.80 | 13.06 | 23.22 | ✅ |
| 9 | `lumilab-design-direction` | **80.19** | A | 20.00 | 12.17 | 13.09 | 15.34 | 19.59 | ✅ |
| 10 | `lumilab-playbook-cn` | **79.71** | B | 21.58 | 12.57 | 13.24 | 11.04 | 21.28 | ✅ |
| 11 | `lumilab-landing-mvp` | **79.43** | B | 22.32 | 13.60 | 8.80 | 12.98 | 21.73 | ✅ |
| 12 | `lumilab-research-interview` | **79.36** | B | 22.33 | 13.50 | 8.64 | 11.88 | 23.01 | ✅ |
| 13 | `lumilab-founder-coach` | **79.16** | B | 22.48 | 13.16 | 8.70 | 11.75 | 23.07 | ✅ |
| 14 | `lumilab-copy` | **78.88** | B | 22.21 | 13.30 | 8.79 | 11.76 | 22.82 | ✅ |
| 15 | `lumilab-product-positioning` | **78.79** | B | 22.10 | 13.46 | 8.80 | 12.96 | 21.47 | ✅ |
| 16 | `lumilab-hypothesis-ledger` | **78.63** | B | 21.95 | 13.18 | 8.80 | 13.07 | 21.63 | ✅ |
| 17 | `lumilab-research-competitor` | **78.06** | B | 21.59 | 13.52 | 8.60 | 11.56 | 22.79 | ✅ |
| 18 | `lumilab-product-mvp` | **76.92** | B | 21.86 | 13.12 | 8.66 | 11.85 | 21.43 | ✅ |
| 19 | `lumilab-metrics` | **76.28** | B | 21.76 | 13.12 | 8.66 | 11.36 | 21.38 | ✅ |
| 20 | `lumilab-launch-strategy` | **76.13** | B | 21.38 | 13.44 | 8.60 | 11.41 | 21.30 | ✅ |
| 21 | `lumilab-product-pmf` | **76.00** | B | 21.46 | 12.94 | 8.66 | 11.61 | 21.33 | ✅ |

---

## 五大支柱平均分

| 支柱 | 满分 | 平均得分 | 占比 |
|---|---:|---:|---:|
| 选题价值 | 25 | **21.94** | 88% |
| 市场竞争力 | 15 | **13.19** | 88% |
| 运行成本 | 15 | **9.93** | 66% |
| 效果稳定性 | 20 | **13.40** | 67% |
| 书写质量 | 25 | **22.08** | 88% |

---

## 关键观察

### ✅ 强项（覆盖整套 bundle）

- **选题价值 88%**：21 个 skill 全部锁定一个**具体可识别**的 OPC / 独立开发者痛点。SkillLens 给的 LLM 评测在「target users 清晰度 / 真实需求 / 价值主张 / 复用价值 / 沉淀潜力」都拿到 0.85–0.95。
- **市场竞争力 88%**：differentiation（与通用 LLM、Notion / Marc Lou 模板等的区隔）和 focus（不试图做万能 founder OS）拿分稳定。
- **书写质量 88%**：frontmatter 规范、关键字覆盖、结构性、安全合规、可维护性全部位居高位。21 个 SKILL.md 都过 agentskills.io v1 标准 frontmatter（含 `requires_browser` / `chat_only_ok` / `metadata.hermes.tags`）。

### ⚠️ 弱项（v1.0-rc1 → final 改进方向）

- **运行成本 66%**：B 级 skill 普遍扣分在 `cost.reference_layering` 和 `cost.cache_friendliness`。部分 SKILL.md > 6000 字符（应分层到 `references/`），随机 IV / 时间戳 token 不可缓存。
- **效果稳定性 67%**：B 级 overlay 大多没有 `scripts/` 目录（评测规则给「脚本兜底」拉低分），`rel.idempotency.discussed` 和 `rel.edge_cases.documented` 没有显式段落。

### 改进 → S 级（90+）路径

1. **每个 overlay 加 `scripts/`**：放最小 schema validator / word-count / anti-slop linter（即使是 bash 也算）→ `rel.script_fallback.has_scripts` 从 partial → full（+2–3 分/skill）
2. **每个 SKILL.md 加 `## Idempotency` 一段**：说明重跑是否覆盖、副作用、日志位置 → `rel.idempotency.discussed` 从 0.5 → 0.9（+1.5 分/skill）
3. **每个 SKILL.md 加 `## Privacy` 一段**：保留策略、删除策略、PII 处理（哪怕「无 PII 上传」也算明确） → `safe.privacy` 提升（+1 分/skill）
4. **`## Cache` 段**：说明哪些输入可缓存、缓存粒度、失效条件 → `cost.cache_friendliness.idempotent_inputs` 提升（+1.5 分/skill）
5. **`scripts/` 分层**：长 SKILL.md（>6000 字符）把详细 worked example 搬到 `references/example-*.md`，SKILL.md 留触发条件 + 顶层流程 → `cost.context_budget.skill_md_size` + `cost.reference_layering` 双扣分点修复（+2 分/skill）

按以上 5 项，B 级 skill 通常能 +7–9 分，把 76–79 的 12 个全部带到 83–88，A 级会全员达到，**几个能站到 S（90+）**。这是 v1.0.0 → v1.0.1 的明确清单。

---

## 验证方法（任何人都可以本地重跑）

```bash
# 1. 克隆 SkillLens
git clone https://github.com/Yannickdes/SkillLens.git
cd SkillLens

# 2. rule-only 预览（不需要 LLM）
python3 skills/skill-scorer/scripts/score.py /path/to/lumilab/skills/lumilab-founder-coach/

# 3. 完整 Deep Review（需要任意 code agent 跑 LLM 评测）
python3 skills/skill-scorer/scripts/score.py --agent-prompt /path/to/lumilab/skills/<skill>/ > /tmp/prompt.md
# 把 prompt.md 喂给 Claude Code / Cursor / 任意 code agent，要求返回严格 JSON 保存为 llm-results.json
python3 skills/skill-scorer/scripts/score.py --llm-results llm-results.json /path/to/lumilab/skills/<skill>/
```

最后一步成功后 JSON 里会有 `deepReviewCertificate.status = "verified"`。

---

## 工程透明度声明

- 所有 21 份 LLM 评测 JSON 由本会话内的 Claude Opus 4.7 按 SkillLens 官方 `--agent-prompt` 输出的严格 schema 产出
- 评分按官方 rubric 进行，未篡改权重、阈值、pass/partial/fail 映射
- 每份评测都经过官方 `score.py --llm-results` merge，rubric hash 一致（`5e5a124282f8cf33`）
- 「verified」徽章来自官方 CLI，不是我们自填

> SkillLens 官方 USAGE 文档：`/Users/cheche/workspace/skills-fun/reference/SkillLens/skills/skill-scorer/USAGE.md`
