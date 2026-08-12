# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage / illustrative. There is no scoring backend yet — the leaderboard, metrics, and patron wall you see are mock data, clearly marked as such in the code. Login is a client-only visual demo, not real authentication. A [Supabase](https://supabase.com/) project is wired up (`lib/supabase/client.ts`) but has no schema yet.

## Features

- Editorial landing page (hero, mission manifesto, "what IQ.Pulse measures" domain grid, sustainment model)
- **Panorama** (`/estadisticas`): general cognitive-science content — interactive bell-curve percentile explainer, cognitive factors, myths vs. facts
- **Ranking** (`/ranking`): leaderboard + monthly challenge card
- **Rendimiento** (`/rendimiento`): personal vs. general performance comparison (precision by domain, time by difficulty), gated behind the demo login
- Demo login/profile flow (`/perfil`) — client-only session flag, no real accounts yet
- Light/dark theme (Apple-style black / white / system blue palette)
- ES/EN language switch (client-side, no page reload), with a mobile hamburger nav once there were 4+ destinations
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
  estadisticas/       Panorama (general cognitive-science content)
  ranking/            Leaderboard + monthly challenge
  rendimiento/        Personal vs. general performance comparison
  perfil/             Demo profile
  terminos/           Terms of service
  privacidad/         Privacy policy
components/
  landing/            Landing page sections + header/nav
  stats/              Panorama + shared stats pieces
  ranking/            Ranking page
  rendimiento/        Rendimiento page
  legal/              Terms/privacy shell + content
  profile/            Demo profile
lib/
  i18n/               ES/EN dictionary
  supabase/           Supabase client (no schema yet)
  motion.ts           Shared Framer Motion presets
```

## Roadmap

- Supabase schema (accounts, real leaderboard/performance data)
- Cognitive assessment engine (currently removed pending redesign)
- Real per-user results feeding the Rendimiento comparison

## License

MIT — see [LICENSE](./LICENSE).
