# IQ.Pulse

An independent, free-to-access project exploring cognitive measurement — an honest, editorial take on IQ testing without paywalls, dark patterns, or locked results.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

> **Status:** early stage / illustrative. There is no backend yet — the ranking, metrics, and patron wall you see are mock data, clearly marked as such in the code. Login is a client-only visual demo, not real authentication.

## Features

- Editorial landing page (hero, mission manifesto, sustainment model)
- Stats dashboard (metrics panel, leaderboard, patron wall) — currently mock data
- Light/dark theme (Apple-style black / white / system blue palette)
- ES/EN language switch (client-side, no page reload)
- Animated, accessible UI throughout (Framer Motion, respects `prefers-reduced-motion`)
- Donation links (PayPal, Ko-fi)
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

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
  estadisticas/       Stats dashboard
  perfil/             Demo profile
  terminos/           Terms of service
  privacidad/         Privacy policy
components/
  landing/            Landing page sections
  stats/              Stats dashboard sections
  legal/              Terms/privacy shell + content
  profile/            Demo profile
lib/
  i18n/               ES/EN dictionary
  motion.ts           Shared Framer Motion presets
```

## Roadmap

- Real backend (accounts, real leaderboard/metrics)
- Cognitive assessment engine (currently removed pending redesign)
- Social presence: GitHub, Instagram, TikTok, Discord (footer/header icons already in place)

## License

MIT — see [LICENSE](./LICENSE).
