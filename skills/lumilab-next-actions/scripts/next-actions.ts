#!/usr/bin/env bun
/**
 * lumilab-next-actions — 下一步行动决策引擎（分析大脑的确定性骨架）。
 *
 * 把「本轮信号」收敛成「现在能执行的下一步」，落成 studio/next-actions.json：
 *   - source_signals：每个有数指标 → 对照 R6 baselines.yaml 打 level + tier + 一句解读
 *   - tasks：3 列看板（待验证 / 进行中 / 已学到）的候选动作
 *   - mindmap_md：脑图大纲（强信号 / 待验证 / 已学到）
 *
 * 用法：
 *   bun run next-actions.ts generate <venture-dir>   读全量数据 → 写 next-actions.json
 *   bun run next-actions.ts <venture-dir>             同 generate
 *
 * 房规（呼应 OPTIMIZATION_PLAN §0）：
 *   - 信号→解读→**候选**动作，「你来选，不替你拍板」。
 *   - 「多方向」= 同一 idea 的不同推进岔路（换定位/换渠道/改价/换受众/补证据），不是生成新 idea。
 *   - 本脚本做确定性骨架（baseline 查表 = 机械查找，不是推理）；host LLM 按 SKILL.md
 *     EXECUTION CONTRACT 在此基础上补充更精准的多方向判断与文案。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
// @ts-ignore
import * as yaml from 'js-yaml';

type Level = 'dead' | 'weak' | 'normal' | 'strong' | 'excellent';

function readJson<T = any>(p: string): T | null {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}
function readYaml<T = any>(p: string): T | null {
  try { return yaml.load(readFileSync(p, 'utf-8')) as T; } catch { return null; }
}
function readText(p: string): string {
  try { return readFileSync(p, 'utf-8'); } catch { return ''; }
}
function nowIso(): string { return new Date().toISOString(); }

// baselines.yaml 在 lumilab-metrics/assets/ —— 跨 workspace / release 布局都在同级 skills 下。
function resolveBaselines(): Record<string, any> {
  const here = import.meta.dir;
  const candidates = [
    process.env.LUMILAB_BASELINES,
    join(here, '..', '..', 'lumilab-metrics', 'assets', 'baselines.yaml'),
    join(here, '..', 'assets', 'baselines.yaml'),
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (existsSync(c)) { const y = readYaml<Record<string, any>>(c); if (y) return y; }
  }
  return {};
}

// 死/弱/正常/强 查表（机械，非推理）。
function classify(value: number, b: any): { level: Level; tier: string } {
  const tier = b?.tier ?? 'C';
  if (b?.excellent != null && value >= b.excellent) return { level: 'excellent', tier };
  if (b?.strong != null && value >= b.strong) return { level: 'strong', tier };
  if (b?.normal != null && value >= b.normal) return { level: 'normal', tier };
  if (b?.dead != null && value < b.dead) return { level: 'dead', tier };
  if (b?.weak != null && value >= (b.dead ?? 0) && value < b.normal) return { level: 'weak', tier };
  return { level: 'weak', tier };
}
const LEVEL_CN: Record<Level, string> = { dead: '死信号', weak: '弱信号', normal: '正常', strong: '强信号', excellent: '极强' };

interface Signal {
  metric: string; value: number | string; baseline?: number; level: Level | 'na';
  tier: string; interpretation: string;
}

function pct(x: number): string { return (x * 100).toFixed(1) + '%'; }

function buildSignals(dir: string, baselines: Record<string, any>): Signal[] {
  const out: Signal[] = [];
  const note = (tier: string) => (tier === 'C' ? '（经验基线，以自测为准）' : '');

  // 付款（W3）：唯一能服务端自动回读的真实信号 —— 最强。
  const pay = readJson<any>(join(dir, 'payment', 'summary.json'));
  if (pay && typeof pay.count_paid === 'number') {
    const b = baselines.payment_any ?? {};
    if (pay.count_paid > 0) {
      const amt = pay.gross_amount != null ? `，累计 ${(pay.gross_amount / 100).toFixed(0)} ${(pay.currency ?? '').toUpperCase()}` : '';
      out.push({ metric: 'payment_any', value: pay.count_paid, level: 'strong', tier: b.tier ?? 'A',
        interpretation: `已有 ${pay.count_paid} 笔真实付款${amt} —— 这是比任何留资/点赞都强的需求信号。应放大、扩量。` });
    } else {
      out.push({ metric: 'payment_any', value: 0, level: 'dead', tier: b.tier ?? 'A',
        interpretation: `付款 0 笔。若 UV 已足够（>100）仍无付款，说明「愿意付」假设未成立，考虑换定位或换受众。` });
    }
  }

  // 复盘 retro 桶（定性，转成温度信号）。
  const researchDir = join(dir, 'research');
  if (existsSync(researchDir)) {
    const retros = readdirSync(researchDir).filter((f) => /^retro-.*\.ya?ml$/.test(f)).sort();
    if (retros.length) {
      const r = readYaml<any>(join(researchDir, retros[retros.length - 1]));
      const sc = (Array.isArray(r?.strong) ? r.strong.length : 0);
      const wc = (Array.isArray(r?.weak) ? r.weak.length : 0);
      if (sc || wc) {
        const level: Level = sc >= 2 ? 'normal' : sc === 1 ? 'weak' : 'dead';
        out.push({ metric: 'retro_strong_signals', value: sc, level, tier: 'C',
          interpretation: `本轮复盘记录 ${sc} 条强信号、${wc} 条弱信号。强信号该倾斜资源放大；弱信号先观察不投入。${note('C')}` });
      }
    }
  }

  return out;
}

interface Task {
  id: string; column: string; title: string; detail: string;
  priority: 'high' | 'medium' | 'low'; stage: string;
  linked_hypothesis: string | null; source: string;
  created_at: string; updated_at: string;
}

function buildTasks(dir: string, signals: Signal[], market: any, hyps: any[]): Task[] {
  const tasks: Task[] = [];
  let n = 0;
  const ts = nowIso();
  const mk = (column: string, title: string, detail: string, priority: Task['priority'], stage: string, linked: string | null, source: string): Task => ({
    id: 't-' + String(++n).padStart(3, '0'), column, title, detail, priority, stage,
    linked_hypothesis: linked, source, created_at: ts, updated_at: ts,
  });

  const paySig = signals.find((s) => s.metric === 'payment_any');
  const strongPay = paySig && paySig.level === 'strong';

  // 1) 信号驱动 —— 强付款 → 放大；无付款/弱 → 放量再判 + 换定位岔路
  if (strongPay) {
    tasks.push(mk('to_validate', '把验证页推到第二批渠道，目标付款翻倍', '已有真实付款 = 需求成立。现在的风险假设变成「这个需求能否规模化」，放量验证可复制性。', 'high', 'launch', null, 'signal:payment_strong'));
    tasks.push(mk('in_progress', '联系已付款用户做 5 个 Mom Test 访谈', '付了钱的人最值钱。问「上次为什么付 / 付之前在用什么」，挖真实 JTBD。', 'high', 'retro', null, 'signal:payment_strong'));
  } else {
    tasks.push(mk('to_validate', '把落地页发到 3 个目标社群，目标 UV ≥ 100', '当前样本太低不足以判断转化。先放量到统计可信，再看 CTA / 付款。', 'high', 'launch', null, 'signal:uv_too_low'));
  }

  // 2) 多方向岔路 —— 来自 market_analysis.directions（同一 idea 的不同推进路线）
  const directions: any[] = Array.isArray(market?.directions) ? market.directions : [];
  const alt = directions.filter((d) => !d.recommended).slice(0, 2);
  for (const d of alt) {
    tasks.push(mk('to_validate', `岔路：换定位到「${d.title}」试一版`, `${d.angle ?? ''}${d.why_it_works ? '。为什么值得试：' + d.why_it_works : ''}。第一步：用这个角度重写 hero + 再发一轮，对比转化。`, 'medium', 'product', null, 'direction:' + (d.id ?? '')));
  }

  // 3) 假设驱动 —— 活跃且未测的高/中信号假设 → 进行中 ; 已通过 → 已学到
  for (const h of hyps) {
    if (h.status !== 'active') continue;
    if (h.test_status === 'passed') {
      tasks.push(mk('learned', `已学到：${h.fact}`, h.test_method ? '验证方法：' + h.test_method : '', 'low', 'retro', h.id, 'hypothesis:' + h.id));
    } else if ((h.confidence === 'high' || h.confidence === 'medium') && (h.test_status === 'pending' || h.test_status === 'running')) {
      tasks.push(mk('in_progress', `验证假设：${h.fact}`, h.test_method ? '方法：' + h.test_method : '补一个能证伪它的测试。', h.confidence === 'high' ? 'high' : 'medium', 'idea', h.id, 'hypothesis:' + h.id));
    }
  }

  // 4) 兜底：始终给一个「等待/补证据」选项，强调不替用户拍板
  tasks.push(mk('to_validate', '补证据：再攒一轮数据，先别急着 pivot', '信号不足时，按兵不动也是一种选择。攒到足够样本再决定继续 / 调整 / 放弃。', 'low', 'retro', null, 'discipline:wait'));

  return tasks;
}

function buildMindmap(idea: string, signals: Signal[], tasks: Task[]): string {
  const lines: string[] = [];
  lines.push('# ' + (idea || '本 venture'));
  const strong = signals.filter((s) => s.level === 'strong' || s.level === 'excellent');
  const weakDead = signals.filter((s) => s.level === 'weak' || s.level === 'dead');
  lines.push('## 强信号');
  if (strong.length) for (const s of strong) lines.push('- ' + s.metric + '：' + LEVEL_CN[s.level as Level]);
  else lines.push('- （暂无强信号）');
  lines.push('## 待验证');
  for (const t of tasks.filter((x) => x.column === 'to_validate')) lines.push('- ' + t.title);
  lines.push('## 进行中');
  for (const t of tasks.filter((x) => x.column === 'in_progress')) lines.push('- ' + t.title);
  lines.push('## 已学到');
  const learned = tasks.filter((x) => x.column === 'learned');
  if (learned.length) for (const t of learned) lines.push('- ' + t.title.replace(/^已学到：/, ''));
  else lines.push('- （还没有确证的结论）');
  if (weakDead.length) {
    lines.push('## 弱/死信号（先记录）');
    for (const s of weakDead) lines.push('- ' + s.metric + '：' + LEVEL_CN[s.level as Level]);
  }
  return lines.join('\n');
}

function extractIdea(dir: string, market: any): string {
  if (market?.idea) return String(market.idea);
  const brief = readText(join(dir, 'project_brief.md'));
  const m = brief.match(/>\s*\*\*(.+?)\*\*/);
  return m ? m[1] : '';
}

function generate(dir: string): string {
  const baselines = resolveBaselines();
  const market = readJson<any>(join(dir, 'market_analysis.json'));
  const hyps = (readYaml<any[]>(join(dir, 'hypotheses.yaml')) ?? []).filter((h) => h && h.id);
  const idea = extractIdea(dir, market);

  const signals = buildSignals(dir, baselines);
  const tasks = buildTasks(dir, signals, market, hyps);
  const mindmap_md = buildMindmap(idea, signals, tasks);

  const na = {
    venture: dir.split('/').filter(Boolean).pop(),
    generated_at: nowIso(),
    source_signals: signals,
    columns: [
      { id: 'to_validate', title: '待验证', color: 'oklch(92% 0.05 250)' },
      { id: 'in_progress', title: '进行中', color: 'oklch(92% 0.06 80)' },
      { id: 'learned', title: '已学到', color: 'oklch(92% 0.06 150)' },
    ],
    tasks,
    mindmap_md,
  };

  const outDir = join(dir, 'studio');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'next-actions.json');
  writeFileSync(outPath, JSON.stringify(na, null, 2) + '\n', 'utf-8');
  return outPath;
}

function main(): void {
  const argv = process.argv.slice(2);
  const cmd = argv[0] === 'generate' ? argv[1] : argv[0];
  const dir = resolve(cmd ?? '');
  if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error('用法：bun run next-actions.ts generate <venture-dir>');
    process.exit(1);
  }
  const out = generate(dir);
  console.log('✓ next-actions.json 已生成 → ' + out);
  console.log('  在 Studio 复盘阶段查看看板 + 脑图；host LLM 可按 SKILL.md 补充更精准的多方向判断。');
}

if (import.meta.main) main();
