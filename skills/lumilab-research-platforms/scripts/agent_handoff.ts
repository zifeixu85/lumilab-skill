#!/usr/bin/env bun
/**
 * Agent-handoff helper — 「宿主代搜 / 代答」tier（无 key 时的真实数据兜底）。
 *
 * 设计动机：这些 skill 永远跑在宿主 agent 里（Claude Code / Cursor / Codex / OpenClaw …），
 * 而宿主 agent 本身具备很宽的知识面 + 通常带 web 搜索能力。所以没有外置 API key 时，
 * 不该退到 mock 假数据——应该把检索这件事**交还给宿主 agent**，让它用自己的 web 工具
 * 或训练知识产出**真实**结果。mock 只在显式 `--mock`（测试 / 离线 demo）时才出现。
 *
 * 流程：
 *   1. 数据脚本无 key → 调 emitAgentPending() 写一份「检索清单」(source: agent-pending)，
 *      并打印 AGENT_SEARCH_NEEDED 指令块到 stderr。
 *   2. 宿主 agent（编排者）读 SKILL.md 决策树 → 用 WebSearch/WebFetch/已装搜索 skill 真搜，
 *      或在无 web 工具时用自身知识，按 canonical schema 写结果。
 *   3. ingest_agent_results.ts 校验 + 归一 → 写 canonical 文件，source=agent-web|agent-knowledge。
 *      下游（synthesis / market-report / hypothesis-ledger）schema 0 改动。
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export type Channel = 'web' | 'xhs';

export function ventureResearchDir(venture: string): string {
  const home = process.env.LUMILAB_HOME ?? join(homedir(), '.lumilab');
  return join(home, 'data', 'ventures', venture, 'research');
}

/** 记一次外部服务/代搜消耗到 venture 的 usage.json。best-effort：缺 config skill 也绝不报错。 */
export function recordUsage(venture: string | undefined, service: string, opts: { calls?: number; costUsd?: number } = {}): void {
  if (!venture) return;
  try {
    const u = require('../../lumilab-config/scripts/usage.ts');
    if (typeof u?.recordService === 'function') u.recordService(venture, service, opts);
  } catch { /* usage 账本可选，不阻塞主流程 */ }
}

interface ChannelSpec { file: string; itemsKey: 'results' | 'notes'; queryKey: 'query' | 'keyword'; schema: string; how: string; }

export const CHANNEL_SPEC: Record<Channel, ChannelSpec> = {
  web: {
    file: 'web_tavily.json',
    itemsKey: 'results',
    queryKey: 'query',
    schema: '[{ "title": string, "url": string, "text": string(摘要,≤2000), "published_date"?: "YYYY-MM-DD", "score"?: number(0~1 相关度) }]',
    how: '用你的 web 搜索能力（WebSearch / WebFetch / 任意已装搜索 skill）逐条检索，每条取前 8~10 条真实结果，带真实 URL 与摘要。若当前宿主无 web 工具，则用你的训练知识写出你**确知为真**的竞品 / 痛点 / 市场事实（--mode knowledge，url 可留空，但 text 必须是真知识，绝不可编造）。',
  },
  xhs: {
    file: 'xhs_raw.json',
    itemsKey: 'notes',
    queryKey: 'keyword',
    schema: '[{ "title": string, "desc": string, "author"?: string, "likes"?: number, "collects"?: number, "comments"?: number, "tags"?: string[], "url"?: string }]',
    how: '用你的 web 搜索能力检索小红书 / 中文社区里该关键词下的真实讨论与痛点。若搜不到站内数据，用你对中国市场该品类的真实认知概述「用户实际怎么说」（--mode knowledge）。互动数未知就填 0，不要编造具体数字。',
  },
};

export interface PendingOpts {
  channel: Channel;
  venture?: string;
  queries: string[];
  reason: string;       // 为什么走代搜（如「未配置 TAVILY_API_KEY」）
}

/**
 * 写「检索清单」+ 打印 AGENT_SEARCH_NEEDED。返回写入路径（无 venture 时返回空串，
 * 并把 pending 对象打到 stdout 供调用方/管道使用）。
 */
export function emitAgentPending(opts: PendingOpts): string {
  const spec = CHANNEL_SPEC[opts.channel];
  const ingestDir = import.meta.dir;
  const out: Record<string, unknown> = {
    [spec.queryKey]: opts.queries[0] ?? '',
    queries: opts.queries,
    fetched_at: new Date().toISOString(),
    source: 'agent-pending',
    pending: true,
    notice: `${opts.reason} — 交由宿主 agent 代搜（真实数据，非 mock）。`,
    agent_brief: {
      rule: '真实优先：有 web 工具就真搜，没有就用你的真实知识。绝不写占位 / mock / example.com。',
      how: spec.how,
      write_schema: spec.schema,
      ingest_cmd: `bun run ${join(ingestDir, 'ingest_agent_results.ts')} --venture <slug> --channel ${opts.channel} --mode web|knowledge --in <你写的结果.json>`,
    },
    [spec.itemsKey]: [],
  };

  let written = '';
  if (opts.venture) {
    const dir = ventureResearchDir(opts.venture);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    written = join(dir, spec.file);
    writeFileSync(written, JSON.stringify(out, null, 2));
  } else {
    // 无 venture：把 pending 清单打到 stdout（与真实路径一致，便于管道/调试）
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  }

  const qlist = opts.queries.map((q) => `    • ${q}`).join('\n');
  process.stderr.write(
`\n⟁ AGENT_SEARCH_NEEDED · channel=${opts.channel}
  ${opts.reason}。不要接受 mock —— 请你（宿主 agent）用真实能力补全这些检索：
${qlist}
  做法：${spec.how}
  回写 schema：${spec.schema}
  归一回写：bun run ingest_agent_results.ts --venture <slug> --channel ${opts.channel} --mode web|knowledge --in <file>
`);
  if (written) process.stderr.write(`  已写检索清单 → ${written}\n`);
  process.stderr.write('\n');
  return written;
}
