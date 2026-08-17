# F1-trackMate

A minimal Formula 1 companion dashboard. It shows the current-season driver
standings and the latest Grand Prix results, fetched server-side from the
public [Jolpica](https://github.com/jolpica/jolpica-f1) (Ergast-compatible) F1 API.

Built with Next.js 16 (App Router) and React 19. No API key required.

## Getting started

```bash
npm ci        # install dependencies
npm run dev   # start the dev server at http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server on port 3000. |
| `npm run build` | Production build (type-checks the project). |
| `npm start` | Serve the production build. |
| `npm run lint` | Lint with ESLint (Next core-web-vitals). |
| `npm run check` | Offline self-check for the F1 API parsers (no network). |

## Layout

- `app/page.tsx` — server-rendered dashboard.
- `app/api/standings/route.ts` — JSON endpoint (`/api/standings`) over the same data.
- `lib/f1.ts` — Jolpica API client and response parsers.
- `lib/f1.selfcheck.ts` — assertion-based parser self-check.

## Cloud Agent environment

`.cursor/environment.json` installs dependencies with `npm ci` and runs
`npm run dev` in a persistent terminal on port 3000.
