# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage / illustrative outside the quiz itself. The leaderboard, and Rendimiento's "you" column are still mock data, clearly marked as such in the code. Login is a client-only visual demo, not real authentication.

## Features

- **`/jugar`**: a daily training screen — "Today's training" heading with the date, a 🔥-streak counter and `done/3` progress line (`lib/dailyTraining.ts`, localStorage-backed), and a single "Start daily challenge" CTA for the 3-domain assessment. Completing it writes real points (0-1000, from the same scoring math as the IQ estimate) to Supabase against an anonymous per-browser id (`lib/deviceIdentity.ts`, no login) — once every 24h; replaying the same day keeps your best score, never your worst (`upsert_daily_result` DB function, see `supabase/schema.sql`). The 5 minigames — Matriz de patrones and Camino óptimo (reasoning), Retención de dígitos and Ráfaga de palabras (memory), Stroop (speed) — sit below under "Free practice" for picking one at a time; practice play still writes a real session/IQ estimate but never counts toward the streak or points, only the daily CTA does. 4 questions per game, adaptive difficulty (`lib/scoring.ts`), an exit-to-menu link during play, results shown with a radar chart, total time taken, today's points (daily runs only), and a copy-result action
- **`/jugar/[gameId]`**: deep link straight into a single minigame (e.g. `/jugar/wordBurst`), skipping the selection screen — 404s on an unknown id
- Editorial landing page (hero, mission manifesto, "what IQ.Pulse measures" domain grid, sustainment model, patron wall)
- **Ranking** (`/ranking`): leaderboard (general/times/percentiles/streaks tabs, still illustrative mock data — wiring it to the real `daily_results` table is the next step) + monthly challenge card
- **Rendimiento** (`/rendimiento`): placeholder for now ("being tuned, check back soon") — the General-vs-you comparison went through several chart redesigns this pass and was pulled off the live page rather than shipped half-right; a working two-section version (separate % and seconds scales) is preserved in git history at commit `c2983b8` to resume from
- Demo login/profile flow (`/perfil`) — client-only session flag, no real accounts yet; deliberately separate from the real anonymous device id above (see `lib/deviceIdentity.ts`'s docstring for why they don't share state)
- Light/dark theme (Apple-style black / white / system blue palette)
- ES/EN language switch (client-side, no page reload), with a mobile hamburger nav
- Animated, accessible UI throughout (Framer Motion, respects `prefers-reduced-motion`, skip-to-content link, keyboard focus states)
- Small design-token system (`tailwind.config.ts` + `app/globals.css`): shared radius (`rounded-control`/`card`/`sheet`), accent-glow shadow scale (`shadow-accent-sm`/`md`/`lg`), and semantic `danger`/`success`/`warn`/`surface-hover` colors, so every card/button/shadow across the site draws from the same small set of values instead of one-off Tailwind classes
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
  GlassCard.tsx       Shared glassmorphism surface primitive
lib/
  i18n/               ES/EN dictionary
  supabase/           Supabase client + quiz.ts (session/answer/score data access, daily points upsert)
  scoring.ts          Scoring + adaptive-difficulty algorithm (pure, no UI/DB dependency)
  timing.ts           performance.now() wrapper (works around an ESLint purity rule)
  motion.ts           Shared Framer Motion presets
  dailyTraining.ts    Daily streak/progress state (localStorage, useSyncExternalStore)
  deviceIdentity.ts   Anonymous per-browser id + auto alias for the real daily points (no login)
supabase/
  schema.sql          DB schema + RLS policies, applied to the live project (including the
                      daily_results table + upsert_daily_result() function)
```

## Roadmap

- Wire `LeaderboardTable` on `/ranking` to the real `daily_results` rows instead of its current mock data, now that real points exist to show
- Daily Challenge (full version): a seeded, identical-for-everyone daily game rotation with no-restart anti-cheat, on top of the points pipeline that now exists. Today's daily run still reuses the free-choice 3-game assessment rather than a seeded daily puzzle
- Rendimiento's General-vs-you comparison — resume from the working version at commit `c2983b8` rather than redesigning from scratch
- Real per-user auth (distinct from the anonymous device id used for daily points) so a person's ranking can follow them across devices
- Local/national/continental leaderboard tiers once per-user location data exists

## License

MIT — see [LICENSE](./LICENSE).
