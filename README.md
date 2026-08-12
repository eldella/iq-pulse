# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage / illustrative. The leaderboard, metrics, and patron wall you see are mock data, clearly marked as such in the code. Login is a client-only visual demo, not real authentication. A [Supabase](https://supabase.com/) project is wired up with a schema (`supabase/schema.sql`) and a scoring/adaptive-difficulty algorithm (`lib/scoring.ts`), but there's no quiz UI or question bank yet - nothing in the schema is populated.

## Features

- Editorial landing page (hero, mission manifesto, "what IQ.Pulse measures" domain grid, sustainment model, patron wall)
- **Ranking** (`/ranking`): leaderboard + monthly challenge card
- **Rendimiento** (`/rendimiento`): personal vs. general performance comparison (precision by domain, time by difficulty), gated behind the demo login
- Demo login/profile flow (`/perfil`) — client-only session flag, no real accounts yet
- Light/dark theme (Apple-style black / white / system blue palette)
- ES/EN language switch (client-side, no page reload), with a mobile hamburger nav
- Animated, accessible UI throughout (Framer Motion, respects `prefers-reduced-motion`)
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
  ranking/            Leaderboard + monthly challenge
  rendimiento/        Personal vs. general performance comparison
  perfil/             Demo profile
  terminos/           Terms of service
  privacidad/         Privacy policy
components/
  landing/            Landing page sections + header/nav
  stats/              Shared leaderboard/patron-wall pieces
  ranking/            Ranking page
  rendimiento/        Rendimiento page
  legal/              Terms/privacy shell + content
  profile/            Demo profile
lib/
  i18n/               ES/EN dictionary
  supabase/           Supabase client
  scoring.ts          Scoring + adaptive-difficulty algorithm (pure, no UI/DB dependency)
  motion.ts           Shared Framer Motion presets
supabase/
  schema.sql          DB schema + RLS policies (run manually in the Supabase SQL editor)
```

## Roadmap

- Cognitive assessment engine: question bank + quiz UI (schema and scoring already exist, see `supabase/schema.sql` and `lib/scoring.ts`)
- Wire `lib/supabase/client.ts` queries into Rendimiento/Ranking/Profile to replace mock data
- Local/national/continental leaderboard tiers once per-user location data exists

## License

MIT — see [LICENSE](./LICENSE).
