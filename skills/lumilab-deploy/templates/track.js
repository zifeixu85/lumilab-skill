/* Lumi Lab 第一方埋点 · 客户端 beacon。
 * 自动采集 page_view / scroll 深度 / dwell 停留 / cta_click / email_submit，
 * 经 navigator.sendBeacon('/api/track') 发到同源 CF Pages Function（数据全在你自己 CF 账号）。
 * 不写 cookie、不依赖第三方。UTM 渠道归因从 URL 读。
 * 暴露 window.lumilabTrack(event, detail) 供页面显式打点（landing 的 cta/email 会调它）。
 */
(function () {
  var DATA = document.currentScript && document.currentScript.dataset || {};
  var VENTURE = DATA.venture || '';
  var started = Date.now();
  var sid = (function () {
    try { var k = 'll_sid'; var v = sessionStorage.getItem(k);
      if (!v) { v = (started.toString(36) + Math.random().toString(36).slice(2, 8)); sessionStorage.setItem(k, v); }
      return v; } catch (e) { return started.toString(36); }
  })();
  function qp(n) { try { return new URLSearchParams(location.search).get(n) || ''; } catch (e) { return ''; } }
  var base = {
    venture: VENTURE, sid: sid, path: location.pathname,
    ref: document.referrer || '',
    utm_source: qp('utm_source'), utm_medium: qp('utm_medium'), utm_campaign: qp('utm_campaign'),
    lang: navigator.language || '', vw: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0),
  };
  function send(event, detail) {
    try {
      var body = JSON.stringify(Object.assign({ event: event, t: Date.now() }, base, detail || {}));
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      else fetch('/api/track', { method: 'POST', body: body, keepalive: true, headers: { 'content-type': 'application/json' } });
    } catch (e) { /* 埋点绝不影响页面 */ }
  }
  window.lumilabTrack = send;

  // page_view
  send('page_view');

  // 滚动深度 25/50/75/100
  var marks = { 25: 0, 50: 0, 75: 0, 100: 0 };
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
    [25, 50, 75, 100].forEach(function (m) { if (p >= m && !marks[m]) { marks[m] = 1; send('scroll', { depth: m }); } });
  }
  window.addEventListener('scroll', function () { window.requestAnimationFrame(onScroll); }, { passive: true });

  // dwell 停留（关页/切后台时发，sendBeacon 保证发得出）
  var sent = false;
  function dwell() { if (sent) return; sent = true; send('dwell', { ms: Date.now() - started }); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') dwell(); });
  window.addEventListener('pagehide', dwell);

  // 兜底自动捕获：主 CTA 点击 + 表单提交（landing 也会显式调 lumilabTrack，重复由后端按 sid 去重影响小）
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('[data-cta],button,.cta,.buy,a[href^="#"]');
    if (el && /buy|cta|购买|预订|体验|抢|立即|join|subscribe|get/i.test((el.textContent || '') + (el.className || '') + (el.getAttribute('data-cta') || ''))) {
      send('cta_click', { label: (el.textContent || '').trim().slice(0, 40) });
    }
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.querySelector) return;
    var email = (f.querySelector('input[type=email],input[name*=email]') || {}).value || '';
    send('email_submit', { email: email.slice(0, 120) });
  }, true);
})();
