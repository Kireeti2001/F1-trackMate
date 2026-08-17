# F1-trackMate

An immersive Formula 1 analytics experience. A single, scroll-driven page (no
navbar, no sidebar) that decodes the latest Grand Prix using the free
[OpenF1](https://openf1.org) timing feed:

- **Hero** — the meeting, circuit and session with parallax, drifting aurora and a cursor-follow glow.
- **Classification** — animated podium (with driver headshots) and the full running order.
- **Fastest-lap telemetry** — a self-drawing speed trace with DRS zones plus throttle/brake inputs.
- **Race pace** — lap-by-lap times for the top five, pit/safety-car laps filtered out.
- **Tyre strategy** — the winner's compound timeline across the race distance.
- **Conditions** — trackside weather with count-up figures.

Built with Next.js 16 (App Router), React 19 and [Motion](https://motion.dev)
(Framer Motion). Data is fetched server-side and cached; no API key required.

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
| `npm run check` | Offline self-check for the OpenF1 transforms (no network). |

## Layout

- `app/page.tsx` — server component that fetches the race data and composes the sections.
- `lib/openf1.ts` — OpenF1 client plus the pure transforms (classification, fastest lap, telemetry, pace, stints, weather).
- `lib/openf1.selfcheck.ts` — assertion-based self-check for those transforms.
- `components/*` — client sections (`Hero`, `Classification`, `Telemetry`, `RacePace`, `Strategy`, `Weather`) and shared motion primitives.

## Cloud Agent environment

`.cursor/environment.json` installs dependencies with `npm ci` and runs
`npm run dev` in a persistent terminal on port 3000.
