# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage / illustrative outside the quiz itself. The leaderboard, and Rendimiento's "you" column are still mock data, clearly marked as such in the code. Login is a client-only visual demo, not real authentication.

## Features

- **`/jugar`**: reframed as a daily training screen — "Today's training" heading with the date, a 🔥-streak counter and `done/3` progress line (`lib/dailyTraining.ts`, localStorage-backed), and a single "Start daily challenge" CTA for the 3-domain assessment. The 5 minigames — Matriz de patrones and Camino óptimo (reasoning), Retención de dígitos and Ráfaga de palabras (memory), Stroop (speed) — sit below under "Free practice" for picking one at a time (practice play doesn't count toward the streak, only the daily CTA does). 4 questions each, adaptive difficulty (`lib/scoring.ts`), an exit-to-menu link during play, real IQ estimate/percentile computed from actual answers and written to Supabase, results shown with a radar chart, total time taken, and a copy-result action
- **`/jugar/[gameId]`**: deep link straight into a single minigame (e.g. `/jugar/wordBurst`), skipping the selection screen — 404s on an unknown id
- Editorial landing page (hero, mission manifesto, "what IQ.Pulse measures" domain grid, sustainment model, patron wall)
- **Ranking** (`/ranking`): leaderboard + monthly challenge card
- **Rendimiento** (`/rendimiento`): personal vs. general performance comparison (precision by domain, time by difficulty), gated behind the demo login
- Demo login/profile flow (`/perfil`) — client-only session flag, no real accounts yet
- Light/dark theme (Apple-style black / white / system blue palette)
- ES/EN language switch (client-side, no page reload), with a mobile hamburger nav
- Animated, accessible UI throughout (Framer Motion, respects `prefers-reduced-motion`, skip-to-content link, keyboard focus states)
- Small design-token system (`tailwind.config.ts` + `app/globals.css`): shared radius (`rounded-control`/`card`/`sheet`), accent-glow shadow scale (`shadow-accent-sm`/`md`/`lg`), and semantic `danger`/`success`/`warn`/`surface-hover` colors, so every card/button/shadow across the site draws from the same small set of values instead of one-off Tailwind classes
- Quiz results pair a hand-rolled radar chart with `DistributionCurve` (`components/viz/`) — a normal-distribution curve marking your actual percentile, next to the per-domain breakdown
- Donation links (PayPal, Ko-fi) and social links (GitHub, Instagram, TikTok; Discord marked "soon")
- Terms of service and privacy policy pages

## Tech stack

| | |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | [lucide-react](https://lucide.dev/), [react-icons](https://react-icons.github.io/react-icons/) (brand icons) |
| Theme | [next-themes](https://github.com/pacocoursey/next-themes) |
| Backend (wired, unused) | [Supabase](https://supabase.com/) |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you want the Supabase client to initialize without throwing, create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only the anon/public key goes here — never the service role key or DB password.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |

## Project structure

```
app/                  Routes (App Router)
  page.tsx            Landing page
  jugar/               The quiz
  ranking/            Leaderboard + monthly challenge
  rendimiento/        Personal vs. general performance comparison
  perfil/             Demo profile
  terminos/           Terms of service
  privacidad/         Privacy policy
components/
  landing/            Landing page sections + header/nav
  jugar/              Quiz engine + the 5 minigames (games/) + radar chart
  stats/              Shared leaderboard/patron-wall pieces
  ranking/            Ranking page
  rendimiento/        Rendimiento page
  legal/              Terms/privacy shell + content
  profile/            Demo profile
  viz/                DistributionCurve (percentile bell curve, quiz results)
  GlassCard.tsx       Shared glassmorphism surface primitive
lib/
  i18n/               ES/EN dictionary
  supabase/           Supabase client + quiz.ts (session/answer/score data access)
  scoring.ts          Scoring + adaptive-difficulty algorithm (pure, no UI/DB dependency)
  timing.ts           performance.now() wrapper (works around an ESLint purity rule)
  motion.ts           Shared Framer Motion presets
  dailyTraining.ts    Daily streak/progress state (localStorage, useSyncExternalStore)
supabase/
  schema.sql          DB schema + RLS policies (run manually in the Supabase SQL editor)
```

## Roadmap

- Daily Challenge (full version): a seeded, identical-for-everyone daily game rotation with no-restart anti-cheat, a 0-1000 normalized score, and a Hoy/Ayer/Histórico leaderboard. `/jugar`'s current streak/progress habit layer (`lib/dailyTraining.ts`) is a lighter, local-only precursor to this — it reuses the existing free-choice 3-game assessment rather than a seeded daily puzzle, and has no server-side leaderboard or anti-cheat
- Real per-user auth so Rendimiento's "you" column and leaderboard placement can be real
- Local/national/continental leaderboard tiers once per-user location data exists

## License

MIT — see [LICENSE](./LICENSE).
