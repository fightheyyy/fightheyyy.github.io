# Blog pageview counter

Both presentations use `public/traffic.js` and one Cloudflare Worker backed by D1.
The blog itself stays on GitHub Pages. This is pageview counting (PV), not unique
visitors: document loads, reloads, restored pages, and editorial route changes
count once. Hash navigation and query-only changes do not count. Random-entry
redirect documents, the shared-footer iframe, prerendering, and localhost do not
write to the production counter. No cookie or persistent style preference is set.

The Worker stores daily aggregate counts in Asia/Shanghai time. Cumulative PV is
the sum of all stored days, so rolling the four-week window never resets the total.
Days before the first recorded visit are omitted. Dates after collection began
with no visits are genuine zeroes. Background dust is decorative; the 28 larger,
interactive stars represent the daily values. The dot-matrix number is cumulative
PV since this counter was installed. Requests or database errors show an unavailable
state, never fabricated counts. Preview fixtures have been removed.

Production endpoint: `https://fightheyyy-blog-traffic.fightheyyy.workers.dev`.
No paid Workers subscription is created by this deployment. Stay on Workers Free;
daily quota exhaustion should make statistics unavailable, rather than upgrading
the account. The blog remains readable if the statistics backend is unavailable.

## Initial deployment (requires the owner's Cloudflare login)

Run from `analytics/`:

```sh
pnpm dlx wrangler@4 login
pnpm dlx wrangler@4 d1 create fightheyyy-blog-traffic
```

Copy the returned database ID into `analytics/wrangler.jsonc`, replacing the explicit
placeholder. Then apply the real schema and deploy:

```sh
pnpm dlx wrangler@4 d1 migrations apply fightheyyy-blog-traffic --remote
pnpm dlx wrangler@4 deploy
```

Set `public/traffic-config.json`'s `endpoint` to the deployed HTTPS Worker origin
(without `/stats` or `/view`). Commit and deploy the GitHub Pages source normally.
The endpoint is public; no Cloudflare API token belongs in this file or the browser.
With the endpoint empty the UI honestly displays no data and makes no counter writes.

## API and counting semantics

- `POST /view`: accepts `{ "id": "<random UUID v4>" }` only from the configured
  production origin. A unique receipt triggers one atomic daily increment.
  Network retries reuse the receipt ID. Receipts expire after two days; aggregates
  remain. The client does not send article paths, IPs or visitor identifiers.
- `GET /stats`: public, read-only aggregate data; no-cache. Returns `source`, `total`,
  `startedOn`, `timezone`, and up to 28 `{date, visits}` entries including today.
- Classic pages use the same script as Nuxt. Only their parent document writes;
  their embedded shared footer reads. Localhost can read, but never writes.

Origin checks prevent other browser sites from embedding a working write request;
they do not authenticate humans. As with any public browser counter, blockers,
disabled JavaScript, network failures and automated clients affect coverage.
This does not reconstruct traffic from before installation.

Cloudflare access logs are governed by the owner's Cloudflare account settings.
The application database only retains daily totals and temporary random receipts.
Do not add private API credentials to the GitHub repository.
