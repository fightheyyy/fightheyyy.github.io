const DAY = 86400000;
const dayInShanghai = timestamp => new Date(timestamp + 8 * 3600000).toISOString().slice(0, 10);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const path = new URL(request.url).pathname.replace(/\/$/, '');
    const publicRead = request.method === 'GET' && path === '/stats';
    const headers = {
      'Access-Control-Allow-Origin': publicRead ? '*' : env.SITE_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
    };
    const respond = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), {
      status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
    });
    if (origin && origin !== env.SITE_ORIGIN && !publicRead) return respond({ error: 'origin' }, 403);
    if (request.method === 'OPTIONS') return respond(null, 204);
    try {
      if (request.method === 'POST' && path === '/view') {
        if (origin !== env.SITE_ORIGIN) return respond({ error: 'origin' }, 403);
        if (!request.headers.get('Content-Type')?.startsWith('application/json')) return respond({ error: 'content type' }, 415);
        const body = await request.text();
        if (body.length > 128) return respond({ error: 'payload' }, 413);
        let id;
        try { id = JSON.parse(body).id; } catch { return respond({ error: 'payload' }, 400); }
        if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return respond({ error: 'id' }, 400);
        const now = Date.now();
        await env.DB.batch([
          env.DB.prepare('DELETE FROM view_receipts WHERE created_at < ?').bind(now - 2 * DAY),
          env.DB.prepare('INSERT OR IGNORE INTO view_receipts(id, day, created_at) VALUES (?, ?, ?)').bind(id, dayInShanghai(now), now),
        ]);
        return respond(null, 204);
      }
      if (request.method === 'GET' && path === '/stats') {
        const now = Date.now();
        const firstDay = dayInShanghai(now - 27 * DAY);
        const results = await env.DB.batch([
          env.DB.prepare('SELECT COALESCE(SUM(visits), 0) AS total, MIN(day) AS startedOn FROM traffic_daily'),
          env.DB.prepare('SELECT day AS date, visits FROM traffic_daily WHERE day >= ? ORDER BY day').bind(firstDay),
        ]);
        const summary = results[0].results[0];
        const byDay = new Map(results[1].results.map(row => [row.date, row.visits]));
        const days = [];
        for (let index = 27; index >= 0; index--) {
          const date = dayInShanghai(now - index * DAY);
          if (summary.startedOn && date >= summary.startedOn) days.push({ date, visits: byDay.get(date) ?? 0 });
        }
        return respond({ source: 'live', total: summary.total, startedOn: summary.startedOn, timezone: 'Asia/Shanghai', days });
      }
      return respond({ error: 'not found' }, 404);
    } catch {
      return respond({ error: 'temporarily unavailable' }, 503);
    }
  },
};
