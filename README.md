# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage. The leaderboard and monthly challenge now use real data. Rendimiento's "you" column is still a placeholder, clearly marked as such in the code. Login is a client-only visual demo, not real authentication.

## Features

- **`/jugar`**: a daily training screen — "Today's training" heading with the date, a 🔥-streak counter and `done/3` progress line (`lib/dailyTraining.ts`, localStorage-backed), and a single "Start daily challenge" CTA for the 3-domain assessment. Completing it writes real points (0-1000, from the same scoring math as the IQ estimate) to Supabase against an anonymous per-browser id (`lib/deviceIdentity.ts`, no login) — once every 24h; replaying the same day keeps your best score, never your worst (`upsert_daily_result` DB function, see `supabase/schema.sql`). 10 minigames — Matriz de patrones, Camino óptimo, and Secuencia numérica (reasoning); Retención de dígitos, Ráfaga de palabras, Memoria espacial, and Palabra rápida (memory); Stroop, Comparación rápida, and Reacción (speed) — sit below under "Free practice" for picking one at a time; practice play still writes a real session/IQ estimate but never counts toward the streak or points, only the daily CTA does. Each exercise (daily or free) runs on a 30-second clock instead of a fixed question count — answer as many as you can, up to a 10-question cap so rapid-fire guessing can't inflate the count, adaptive difficulty that starts "normal" (medium) and leans hard - 2 correct in a row bumps the tier up, but it takes 2 wrong in a row to drop one, so a single slip doesn't undo progress (`lib/scoring.ts`, one mode, no easy/normal/hard picker), score is accuracy-weighted so it's fair regardless of how many you got through (`normalizeScore()` already divides by however many were answered). Every answer gets a green/red reveal (correct choice highlighted, your wrong pick if any) before moving on. An exit-to-menu link during play, results shown with an animated radar chart (per-domain % labels on each vertex), total time taken, today's points (daily runs only), and a copy-result action. The IQ number is paired with a plain-language classification (e.g. "Superior") instead of a bare, easy-to-misread percentile (`classifyIQ()` in `lib/scoring.ts`, standard Wechsler-style bands), with the percentile rephrased as a full sentence ("Better than X% of people") underneath
- **`/jugar/[gameId]`**: deep link straight into a single minigame (e.g. `/jugar/wordBurst`), skipping the selection screen — 404s on an unknown id
- Editorial landing page (hero, mission manifesto, "what IQ.Pulse measures" domain grid, sustainment model, patron wall)
- **Weekly challenge** (`components/stats/WeeklyChallengeCard.tsx`): 3 rounds, 10 seconds per round, up to 3 total mistakes before it's over. Which of 4 games is live rotates automatically week to week (`lib/weeklyPuzzle.ts`, seeded so it's identical for everyone): spot the odd hexagon, spot the mirrored (not just rotated) shape, repeat a flashed sequence, or count a flashed cluster of dots before it disappears. Rendered as SVG shapes and timed reveals, not a written description — there's no text pattern to paste into a text-only AI, and the sequence/count games go further since the content that matters only exists on screen for a moment. One attempt per week, result stored locally (`lib/weeklyChallengeState.ts`) - local-only for now, same staged approach as the Daily Challenge before it got wired to Supabase. Shown on the landing page, `/jugar`, and `/ranking`, with a countdown to next week's challenge once this week's is done
- **Ranking** (`/ranking`): leaderboard wired to real `daily_results` data (general/times/percentiles/streaks tabs, grouped by device — the streaks tab only counts a device's streak if its last play was today or yesterday, same grace period as the local streak logic) + the weekly challenge card above
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
  supabase/           Supabase client + quiz.ts (session/answer/score data access, daily points upsert) +
                      leaderboard.ts (real leaderboard reads via RPC)
  scoring.ts          Scoring + adaptive-difficulty algorithm (pure, no UI/DB dependency)
  random.ts           Fisher-Yates shuffle() - array.sort(() => Math.random() - 0.5) is a known
                      biased-shuffle bug, replaced everywhere it was used
  timing.ts           performance.now() wrapper (works around an ESLint purity rule)
  motion.ts           Shared Framer Motion presets
  dailyTraining.ts    Daily streak/progress state (localStorage, useSyncExternalStore)
  deviceIdentity.ts   Anonymous per-browser id + auto alias for the real daily points (no login)
  weeklyPuzzle.ts     Deterministic weekly puzzle grid generator (pure, seeded by ISO week)
  weeklyChallengeState.ts  Result store for the weekly challenge (localStorage, useSyncExternalStore)
supabase/
  schema.sql          DB schema + RLS policies, applied to the live project (including the
                      daily_results table, upsert_daily_result(), and the leaderboard_* RPC functions)
```

## Roadmap

- Wire the weekly challenge's result to Supabase (real points + leaderboard) before launch - it's local-only for now
- Daily Challenge (full version): a seeded, identical-for-everyone daily game rotation with no-restart anti-cheat, on top of the points pipeline that now exists. Today's daily run still reuses the free-choice 3-game assessment rather than a seeded daily puzzle
- Rendimiento's General-vs-you comparison — resume from the working version at commit `c2983b8` rather than redesigning from scratch
- Real per-user auth (distinct from the anonymous device id used for daily points) so a person's ranking can follow them across devices
- Local/national/continental leaderboard tiers once per-user location data exists

## License

MIT — see [LICENSE](./LICENSE).
