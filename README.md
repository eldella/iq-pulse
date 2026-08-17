# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage. The leaderboard and monthly challenge now use real data. Rendimiento's General-vs-you comparison is live, but the "you" side is still illustrative pending real per-user auth, clearly marked as such in the code. Login is a client-only visual demo, not real authentication.

## Features

- **`/jugar`**: a daily training screen — "Today's training" heading with the date, a 🔥-streak counter and `done/3` progress line (`lib/dailyTraining.ts`, localStorage-backed), and a single "Start daily challenge" CTA for the 3-domain assessment. Completing it writes real points (0-1000, from the same scoring math as the IQ estimate) to Supabase against an anonymous per-browser id (`lib/deviceIdentity.ts`, no login) — once every 24h; replaying the same day keeps your best score, never your worst (`upsert_daily_result` DB function, see `supabase/schema.sql`). 9 minigames — Camino óptimo and Secuencia numérica (reasoning, the latter now also the reasoning slot in the daily 3-domain assessment - Matriz de patrones was retired for testing near-identical to Secuencia numérica: same "spot the missing number, pick from 4 options" task with a different generator underneath); Retención de dígitos, Ráfaga de palabras, Memoria espacial, and Palabra rápida (memory); Stroop, Comparación rápida, and Reacción (speed) — sit below under "Free practice" for picking one at a time, each card's icon color-coded by cognitive domain (accent blue for reasoning, a new pink `domain-memory` token for memory, a new orange `domain-speed` token for speed, both in `app/globals.css`/`tailwind.config.ts` - not reused from `accent-secondary`, which stays decorative-only per its own doc comment) with a matching tinted hover border; practice play still writes a real session/IQ estimate but never counts toward the streak or points, only the daily CTA does. Each exercise (daily or free) runs on a 30-second clock instead of a fixed question count — answer as many as you can, up to a 10-question cap so rapid-fire guessing can't inflate the count — except Camino óptimo and Secuencia numérica (8 fixed puzzles, no clock: racing a timer just adds pressure that contaminates "can you solve it"), Reacción (5 fixed rounds, no clock: each round already draws its own 1-5s random wait, so a shared clock was only cutting rounds short at an arbitrary point, not measuring anything), and Stroop/Comparación rápida (10 fixed attempts, but each question keeps its own 5s answer window - `PER_QUESTION_TIMEOUT_MS` in `lib/motion.ts` - instead of one shared 30s bucket; running out counts as a miss, auto-advances, and reveals the correct option with an explanatory caption so it doesn't read as the game answering for you) — all three still use the same shared results/header engine, just swapping the clock display for an attempt counter. Getting a Stroop/Comparación answer right pulses the correct option's border on reveal. Difficulty runs on 4 fixed named tiers - easy/medium/hard/extreme, level in {1x, 2x, 4x, 8x} - starting at easy (1x) each exercise: 2 correct in a row promotes one tier, but a single wrong answer demotes one tier immediately (no grace streak), and the level is literally the score multiplier (`lib/scoring.ts`). Game content scales with `contentTier` (0-3, one per tier) so it stays playable - grids/sequences/word counts genuinely grow (SpatialMemoryGame's grid up to 6x6, DigitSpanGame's sequence up to 12 digits, PathfinderGame's path up to 10 steps, Stroop's color pool up to 8, WordBurst/QuickCompare scale their counts too), each capped where a real ceiling exists (Stroop can't invent more distinguishable colors; PathfinderGame's path search is capped at 10 steps to stay fast, not just legible - the naive permutation approach it replaced was O(n!) and would have frozen the tab at high levels, since caught and rewritten as a direct O(C(n,k)) combination generator). Resets to easy (1x) when the exercise ends. The DB's difficulty_at_time column stores the tier name directly (easy/medium/hard/extreme) via `levelToBucket()`. Score is accuracy-weighted so it's fair regardless of how many you got through (`normalizeScore()` already divides by however many were answered). Every answer gets a green/red reveal (correct choice highlighted, your wrong pick if any) before moving on. An exit-to-menu link during play. Results differ by mode: the **Daily Challenge** shows an animated radar chart (per-domain % labels), the IQ number paired with a plain-language classification (e.g. "Superior") instead of a bare percentile (`classifyIQ()` in `lib/scoring.ts`, Wechsler-style bands), the percentile rephrased as a full sentence ("Better than X% of people"), and today's points; **free practice** skips the IQ framing entirely and instead shows that single game's accuracy plus whether it beat your local best for that game (`lib/practicePerformance.ts`, per-gameId, device-local), plus an average reaction time (correct answers only) for the three speed-domain games - both share total time taken and a copy-result action. Reaction-time capture itself is measured from `pointerdown` (first contact) rather than `click` (which fires on release) to avoid the press-to-release gap inflating every reading, and timestamped post-paint via a double `requestAnimationFrame` rather than at the state-update call, so React/paint latency never leaks into the number shown. Reacción is the one exception to the tier system above - its content doesn't scale with level (every round already draws its own fresh 1-5s wait regardless of streak), so it's pinned at 1x for the whole exercise instead of riding the multiplier - since a pinned difficulty never has anything to display, the in-game header skips the "Fácil" tier label entirely for this game instead of showing a value that never changes; its attempt counter and progress bar also pop with a spring animation on every completed round instead of snapping instantly, and if all 5 rounds are missed (no correct tap to report an avg/best from) the results screen shows a dedicated "didn't tap in time" message instead of falling back to a generic 0% accuracy card that made no sense for a reaction-time game. Camino óptimo's practice results screen adds a per-round review strip below the usual stats - one clickable chip per round (green/red for correct/incorrect) that swaps in a mini board below it: the correct path traced, and on a miss, exactly where your own path ran into an obstacle, with a small legend (start/goal/correct path/crash point) so the color coding is explained rather than assumed (`components/jugar/games/PathfinderReviewStrip.tsx`). Reacción's practice results screen replaces the plain accuracy/avg-ms text stack with a dedicated card layout: a headline average-ms card whose border/glow reflects the run (a success glow on a new personal record, a lighter success tint under 250ms, a warn border 250-400ms), a 3-up stat-card grid - record / best single tap / total time (`components/jugar/StatCard.tsx`, built reusable for the other games' results screens later) - a themed confetti burst on a new record (`components/jugar/RecordConfetti.tsx`, only the app's own success/accent/warn tokens, no arbitrary rainbow hex, skipped entirely under `prefers-reduced-motion`), and a "close to your record" nudge for a best tap within 20ms of it without beating it. The tracked "personal best" is the run's single fastest correct tap, not its average - the two are shown side by side since averaging them together buried a genuinely fast tap under slower ones from the same run. The results screen overall also gained a Space/Enter replay shortcut (shown as a kbd hint on the button, skipped when a button/link/input already has focus) and a relabeled "Copiar resultado" action whose Reacción share text reads as a sentence ("¡Hice Xms en el test de reacción de IQ.Pulse! ⚡") instead of a bare label:value pair
- **`/jugar/[gameId]`**: deep link straight into a single minigame (e.g. `/jugar/wordBurst`), skipping the selection screen — 404s on an unknown id
- Editorial landing page (hero, mission manifesto, "what IQ.Pulse measures" domain grid, sustainment model, patron wall)
- **Weekly challenge** (`components/stats/WeeklyChallengeCard.tsx`): 3 rounds, 10 seconds per round, up to 3 total mistakes before it's over. Which of 4 games is live rotates automatically week to week (`lib/weeklyPuzzle.ts`, seeded so it's identical for everyone): spot the odd hexagon, spot the mirrored (not just rotated) shape, repeat a flashed sequence, or count a flashed cluster of dots before it disappears. Rendered as SVG shapes and timed reveals, not a written description — there's no text pattern to paste into a text-only AI, and the sequence/count games go further since the content that matters only exists on screen for a moment. One attempt per week, result stored locally (`lib/weeklyChallengeState.ts`) - local-only for now, same staged approach as the Daily Challenge before it got wired to Supabase. Shown on the landing page, `/jugar`, and `/ranking`, with a countdown to next week's challenge once this week's is done
- **Ranking** (`/ranking`): leaderboard wired to real `daily_results` data (general/times/percentiles/streaks tabs, grouped by device — the streaks tab only counts a device's streak if its last play was today or yesterday, same grace period as the local streak logic) + the weekly challenge card above
- **Rendimiento** (`/rendimiento`): General-vs-you comparison, two card grids with separate scales — average precision by domain (%) and average time by difficulty tier (seconds, including "extreme"), each row a GlassCard with a paired General/Vos bar (same card treatment as Reacción's results screen). "General" is wired to a real Supabase aggregate query (`fetchGeneralPerformance`); "Vos" stays illustrative until real per-user auth exists (the demo login is a client-only flag, no real Supabase Auth user behind it) — the whole comparison blurs behind a login prompt for logged-out visitors instead of showing fake per-row numbers
- Demo login/profile flow (`/perfil`) — client-only session flag, no real accounts yet; deliberately separate from the real anonymous device id above (see `lib/deviceIdentity.ts`'s docstring for why they don't share state)
- Light/dark theme (Apple-style black / white / system blue palette)
- ES/EN language switch (client-side, no page reload), with a mobile hamburger nav
- Animated, accessible UI throughout (Framer Motion, respects `prefers-reduced-motion`, skip-to-content link, keyboard focus states)
- Small design-token system (`tailwind.config.ts` + `app/globals.css`): shared radius (`rounded-control`/`card`/`sheet`), glow shadow scales for both the accent color and (added for Reacción's results card) success (`shadow-accent-sm`/`md`/`lg`, `shadow-success-md`/`lg`), and semantic `danger`/`success`/`warn`/`surface-hover` colors, so every card/button/shadow across the site draws from the same small set of values instead of one-off Tailwind classes
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
  practicePerformance.ts  Per-game "beat your best" accuracy tracking for free practice (localStorage)
  wordBank.ts         Shared ES/EN word list for WordBurstGame and WordTypingGame
  weeklyPuzzle.ts     Deterministic weekly puzzle grid generator (pure, seeded by ISO week)
  weeklyChallengeState.ts  Result store for the weekly challenge (localStorage, useSyncExternalStore)
supabase/
  schema.sql          DB schema + RLS policies, applied to the live project (including the
                      daily_results table, upsert_daily_result(), and the leaderboard_* RPC functions)
```

## Roadmap

- Wire the weekly challenge's result to Supabase (real points + leaderboard) before launch - it's local-only for now
- Daily Challenge (full version): a seeded, identical-for-everyone daily game rotation with no-restart anti-cheat, on top of the points pipeline that now exists. Today's daily run still reuses the free-choice 3-game assessment rather than a seeded daily puzzle
- Real per-user auth (distinct from the anonymous device id used for daily points) so a person's ranking can follow them across devices
- Local/national/continental leaderboard tiers once per-user location data exists

## License

MIT — see [LICENSE](./LICENSE).
