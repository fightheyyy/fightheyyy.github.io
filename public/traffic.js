(() => {
  if (window.blogTraffic) return;
  const root = new URL('./', document.currentScript.src);
  let config;
  let lastPath;
  let reading;
  const client = window.blogTraffic = {
    status: 'loading', data: null, track, refresh,
  };
  function notify() {
    window.dispatchEvent(new Event('blog:traffic-updated'));
    document.querySelectorAll('.classic-footer-frame').forEach(frame => {
      frame.contentWindow?.postMessage({ type: 'blog:traffic-refresh' }, location.origin);
    });
  }
  const ready = fetch(new URL('traffic-config.json', root), { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('config'); return response.json(); })
    .then(value => {
      if (!value.endpoint) { client.status = 'unconfigured'; notify(); return; }
      const endpoint = new URL(value.endpoint);
      if (endpoint.protocol !== 'https:') throw new Error('endpoint');
      config = { endpoint: endpoint.href.replace(/\/$/, ''), siteOrigin: value.siteOrigin };
    }).catch(() => { client.status = 'unavailable'; notify(); });

  async function refresh() {
    await ready;
    if (!config) return;
    if (reading) return reading;
    reading = (async () => {
      try {
        const response = await fetch(`${config.endpoint}/stats`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('stats');
        const value = await response.json();
        if (value.source !== 'live' || !Number.isSafeInteger(value.total) || value.total < 0
          || !Array.isArray(value.days) || value.days.length > 28
          || !value.days.every(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isSafeInteger(day.visits) && day.visits >= 0)) throw new Error('data');
        client.data = value;
        client.status = 'live';
      } catch { client.status = 'unavailable'; }
      finally { reading = undefined; notify(); }
    })();
    return reading;
  }
  async function track() {
    if (window.top !== window.self || window.__blogEntryRedirect || document.prerendering) return;
    if (document.visibilityState !== 'visible') return;
    const path = location.pathname.replace(/\/$/, '') || '/';
    if (path.endsWith('/shared-footer') || lastPath === path) return;
    lastPath = path;
    await ready;
    if (!config || location.origin !== config.siteOrigin) { refresh(); return; }
    const id = crypto.randomUUID();
    // Retry with the same receipt ID: a lost response cannot count twice.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(`${config.endpoint}/view`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }), keepalive: true, signal: AbortSignal.timeout(10000),
        });
        if (response.ok || response.status < 500) break;
      } catch { /* The next attempt reuses the receipt. */ }
    }
    if (reading) await reading;
    await refresh();
  }
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'blog:traffic-refresh') refresh();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') track(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { lastPath = undefined; track(); } });
  window.dispatchEvent(new Event('blog:traffic-ready'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { track(); refresh(); }, { once: true });
  else { track(); refresh(); }
})();
