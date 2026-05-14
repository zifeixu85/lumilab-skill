# Smoke test · lumilab-research-keywords

# 该 skill 的最小冒烟测试由 host LLM 在对话中跑通即可。
# 真集成测试见 docs/TUTORIAL.zh.md。

# 当 skill 含 scripts/ 时，建议在每个脚本顶部加 `bun test` 或手动 dry-run。


## 验证步骤

1. host LLM 加载 SKILL.md
2. 按「Example」段提示输入（或直接 `--mock`）
3. 跑一次 mock 流程：
   ```bash
   bun run scripts/research.ts --mock --seed="AI 改写工具" --venture testv
   ```
4. 检查 outputs 列出的 3 个文件是否生成（keyword_landscape.md / keyword_metrics.csv / keyword_sources.jsonl）
5. 跑校验器：
   ```bash
   bun run scripts/validate-output.ts data/ventures/testv
   ```
6. 输出过 `Anti-Slop` 自检门：
   ```bash
   bun run scripts/anti-slop-lint.ts data/ventures/testv
   ```

## 通过条件

- [ ] SKILL.md frontmatter 校验通过（agentskills.io v1）
- [ ] `research.ts --mock` 退出码 0，3 个 outputs 文件全部生成
- [ ] `validate-output.ts` 退出码 0
- [ ] `anti-slop-lint.ts` 退出码 0
- [ ] 无 token / `--mock` 时 mock 路径可达，且 keyword_landscape.md 含 4 个红蓝海段落
- [ ] chat-only fallback 路径可达（`LUMILAB_CHANNEL=feishu bun run scripts/research.ts --mock ...`）
