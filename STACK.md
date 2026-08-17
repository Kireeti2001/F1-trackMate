# F1 TrackMate — tech stack

**Pick: Next.js 16 (App Router) + React 19 Server Components + TypeScript + Tailwind CSS 4, hosted on Vercel, data from Jolpica.**

This app is a Formula 1 companion: standings, last race, later a calendar and maybe live timing. That is **read-heavy, cacheable HTML**, not a SPA with a custom API. The speed that matters is TTFB from the CDN, not a smaller virtual DOM.

## Stack (latest as of Aug 2026)

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16.3** (App Router) | RSC = tables ship almost no client JS. Turbopack is default. Cache Components / PPR is the speed lever for standings. |
| UI | **React 19.2** | Server Components by default. Client components only for filters, timers, charts. |
| Language | **TypeScript** (5.7+, Node types 22) | One language for UI and server. |
| Styling | **Tailwind CSS 4** | Fastest way to ship a dark F1 UI. No CSS-in-JS runtime. |
| Bundler | **Turbopack** (built into Next 16) | Default; do not add Webpack config. |
| Data | **Jolpica** (Ergast-compatible F1 API) | Public, no key. Cache the responses; do not hit it on every request. |
| Hosting | **Vercel** | Closest Next.js runtime, CDN, ISR/tag revalidation. |
| Runtime | **Node 22 LTS** | Matches the platform image. Node 24 is fine later; not a bottleneck. |

No separate backend. Route handlers in `app/api/*` if a JSON endpoint is needed. No database until there are users.

## Why this is the fastest *for this case*

F1 results change on a race cadence, not every millisecond. Serve the dashboard as **cached RSC HTML**:

- `use cache` / `cacheLife` / `cacheTag` on the Jolpica fetch (minutes, not `force-dynamic` on every hit).
- Revalidate after a race (`revalidateTag('standings')`) or on a 5–15 min TTL.
- Keep the page a Server Component. A standings table does not need hydration.

That is faster in production than a “lighter” framework that still fetches the upstream API on every request.

The other PR already scaffolds Next 16 + React 19. Keep it. The first real speed fix is **caching**, not a rewrite.

## Runners-up (rejected)

| Option | Why not |
| --- | --- |
| **Svelte 5 + SvelteKit** | Smallest JS, highest raw RPS. Wins if this were a marketing site or a heavy client widget on slow phones. Here the page is server tables; RSC already ships near-zero JS. Switching now throws away the existing app and the Vercel/React path this repo is on. |
| **TanStack Start / Remix (RR7)** | Fine loaders. Smaller ecosystem, weaker Cache Components story for this exact workload. |
| **Astro** | Fastest static content. Awkward once you add live weekend UI. |
| **Express/Nest + SPA** | Extra hop, extra deploy, extra code. YAGNI. |
| **Flutter / React Native** | Mobile later, maybe. The product is a web companion first. |

## Do not add yet

- Database, ORM, auth, Redis
- GraphQL, tRPC, Redux/Zustand
- Chart.js / Recharts (huge). If telemetry lands, use **uPlot**
- WebSockets. If live timing lands, start with **SSE**
- AI / agents. Not the product.

## Add only when the feature exists

| Feature | Then |
| --- | --- |
| Accounts, predictions, garage | **Neon Postgres** + **Drizzle** |
| Live session timing | SSE route + short cache, not a new backend |
| Telemetry plots | uPlot, client island only |
| Auth | Clerk (or Auth.js) — not before there is a user row |

## Speed checklist

1. Never `force-dynamic` the standings page.
2. Cache Jolpica at the fetch, tag it, TTL in minutes.
3. Server Components for every table.
4. One client island per interactive widget, not a `'use client'` root layout.
5. Images (circuit maps, driver photos) through `next/image` only if we host them; skip until we have assets.
