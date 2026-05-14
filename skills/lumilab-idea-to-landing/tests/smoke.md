# Smoke test · lumilab-idea-to-landing

最小冒烟测试由 host LLM 在对话中跑通即可。

## 验证步骤

1. `bun run scripts/orchestrate.ts init "测试想法：给独立开发者的记账工具"` → 输出 JSON 含 slug / source
2. host LLM 按 SKILL.md Phase 1 写 `market_analysis.json`
3. `bun run scripts/validate-output.ts data/ventures/<slug>` → exit 0
4. `bun run ../lumilab-studio/scripts/market-report.ts data/ventures/<slug>` → 生成 reports/market-report.html
5. Phase 3 决策门 → Phase 4 landing → Phase 5 交付

## 通过条件

- [ ] orchestrate.ts init 输出合法 JSON，slug 非空
- [ ] market_analysis.json 过 validate-output.ts 校验
- [ ] reports/market-report.html 生成且非空
- [ ] landing/ 下有 v1
- [ ] 全程最多 2 次 AskUserQuestion
- [ ] HTML 产物被主动交付（本地开浏览器 / chat 发附件）
- [ ] anti-slop-lint 全过
