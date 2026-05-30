-- Lumi Lab 第一方埋点 D1 schema（部署时 wrangler d1 execute 应用一次）。
-- 事件表 + 邮箱表。第一方、可 SQL 查、可导出。
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  venture TEXT,
  event TEXT NOT NULL,          -- page_view / cta_click / modal_open / email_submit / scroll / dwell
  sid TEXT,                     -- cookie-less 会话 id
  path TEXT,
  ref TEXT,                     -- referrer
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  country TEXT, city TEXT, region TEXT, tz TEXT,   -- 边缘免费拿
  lang TEXT, vw TEXT,
  depth INTEGER,               -- scroll 深度 25/50/75/100
  dwell_ms INTEGER,            -- 停留毫秒
  label TEXT                   -- cta 文案等
);
CREATE INDEX IF NOT EXISTS idx_events_venture_event ON events(venture, event);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  venture TEXT,
  email TEXT NOT NULL,
  utm_source TEXT,
  country TEXT
);
CREATE INDEX IF NOT EXISTS idx_emails_venture ON emails(venture);
