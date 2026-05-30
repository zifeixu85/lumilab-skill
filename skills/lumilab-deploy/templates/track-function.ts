/**
 * CF Pages Function · POST /api/track —— Lumi Lab 第一方埋点收集端（部署时拷到 deployDir/functions/api/track.ts）。
 *
 * 数据全落在你自己的 Cloudflare 账号：事件写 D1（env.DB），邮箱写 D1.emails，
 * email_submit 时若配了 Resend（env.RESEND_API_KEY + RESEND_FROM）→ 发欢迎邮件。
 * 边缘免费拿 country/city/timezone（request.cf）。UA 过滤爬虫。绝不抛错到页面（best-effort）。
 *
 * 绑定（部署时由 deploy.ts 经 CF API 配到 Pages 项目）：
 *   D1: DB   ·   env vars/secrets: RESEND_API_KEY, RESEND_FROM, LUMILAB_VENTURE
 */
interface Env {
  DB?: any;                 // D1Database（可空：未绑定时只回 204 不落库）
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;     // 形如 "Lumi Lab <hi@yourdomain.com>"
  LUMILAB_VENTURE?: string;
}
interface Ctx { request: Request; env: Env; }

const BOT_UA = /bot|crawl|spider|slurp|bing|baidu|yandex|duckduck|facebookexternalhit|headless|preview|monitor|curl|wget|python-requests|axios/i;

function s(v: unknown, n = 200): string { return typeof v === 'string' ? v.slice(0, n) : (v == null ? '' : String(v).slice(0, n)); }

export async function onRequestPost(ctx: Ctx): Promise<Response> {
  const { request, env } = ctx;
  try {
    const ua = request.headers.get('user-agent') || '';
    if (BOT_UA.test(ua)) return new Response(null, { status: 204 }); // 丢爬虫
    const cf: any = (request as any).cf || {};
    const body: any = await request.json().catch(() => ({}));
    const event = s(body.event, 40) || 'unknown';
    const now = new Date().toISOString();
    const row = {
      ts: now, venture: s(body.venture, 80) || s(env.LUMILAB_VENTURE, 80),
      event, sid: s(body.sid, 40), path: s(body.path, 200), ref: s(body.ref, 300),
      utm_source: s(body.utm_source, 80), utm_medium: s(body.utm_medium, 80), utm_campaign: s(body.utm_campaign, 80),
      country: s(cf.country, 8), city: s(cf.city, 80), region: s(cf.region, 80), tz: s(cf.timezone, 64),
      lang: s(body.lang, 32), vw: s(body.vw, 16), depth: Number(body.depth) || null, dwell_ms: Number(body.ms) || null,
      label: s(body.label, 80),
    };

    // 事件落 D1（绑定了才落；无绑定时静默跳过，页面无感）
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO events (ts,venture,event,sid,path,ref,utm_source,utm_medium,utm_campaign,country,city,region,tz,lang,vw,depth,dwell_ms,label)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(row.ts, row.venture, row.event, row.sid, row.path, row.ref, row.utm_source, row.utm_medium, row.utm_campaign,
          row.country, row.city, row.region, row.tz, row.lang, row.vw, row.depth, row.dwell_ms, row.label).run();
      } catch { /* 表未建/绑定缺失：忽略 */ }
    }

    // email_submit：落库（有 D1 才落）+ 发欢迎邮件（有 Resend 就发，**不依赖 D1**）
    if (event === 'email_submit') {
      const email = s(body.email, 160).trim();
      if (email && /.+@.+\..+/.test(email)) {
        if (env.DB) {
          try {
            await env.DB.prepare(`INSERT INTO emails (ts,venture,email,utm_source,country) VALUES (?,?,?,?,?)`)
              .bind(row.ts, row.venture, email, row.utm_source, row.country).run();
          } catch { /* ignore */ }
        }
        if (env.RESEND_API_KEY && env.RESEND_FROM) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
              body: JSON.stringify({
                from: env.RESEND_FROM, to: email,
                subject: '收到啦 —— 上线第一时间通知你 🌱',
                html: `<div style="font-family:-apple-system,sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a">
                  <p>嗨，</p><p>感谢你留下邮箱 —— 我们正在验证这个想法，<b>一旦开放就第一时间通知你</b>，你会是最早一批用上的人。</p>
                  <p>有任何想法/吐槽，直接回这封邮件就行，我会亲自看。</p><p>— Lumi Lab</p></div>`,
              }),
            });
          } catch { /* 发信失败不影响留资 */ }
        }
      }
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 }); // 任何异常都静默 204，页面无感
  }
}

// 健康检查
export async function onRequestGet(): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, service: 'lumilab-track' }), { headers: { 'content-type': 'application/json' } });
}
