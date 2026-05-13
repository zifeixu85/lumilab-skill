# Smoke test · lumilab-landing-mvp

# 该 skill 的最小冒烟测试由 host LLM 在对话中跑通即可。
# 真集成测试见 docs/TUTORIAL.zh.md §2 「你的第一个 venture」。

# 当 skill 含 scripts/ 时，建议在每个脚本顶部加 `bun test` 或手动 dry-run。


## 验证步骤

1. host LLM 加载 SKILL.md
2. 按「真实示例」段提示输入
3. 检查 outputs 列出的文件是否生成
4. 输出过 `反 Slop 自检` 6 条门

## 通过条件

- [ ] SKILL.md frontmatter 校验通过（agentskills.io v1）
- [ ] outputs 文件全部生成
- [ ] 反 Slop 自检 6/6
- [ ] chat-only fallback 路径可达（如 `LUMILAB_CHANNEL=feishu bun run scripts/<x>.ts`）
