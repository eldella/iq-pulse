import { RankBadge } from "@/components/RankBadge";

/**
 * Illustrative Top 5 — there is no backend/leaderboard API in this build.
 * A static mock array stands in for what a real ranking would show.
 */
const MOCK_ENTRIES = [
  { alias: "neutrino_84", score: 987 },
  { alias: "sofia.codes", score: 942 },
  { alias: "quickdraw", score: 918 },
  { alias: "mentat_ok", score: 875 },
  { alias: "lu_reflex", score: 861 },
] as const;

export function LeaderboardPreview() {
  return (
    <div className="w-full max-w-lg">
      <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
        Top 5 de hoy
      </h2>
      <ul className="flex flex-col gap-2">
        {MOCK_ENTRIES.map((entry, index) => (
          <li
            key={entry.alias}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
          >
            <RankBadge rank={index + 1} />
            <span className="flex-1 truncate font-medium text-foreground">
              {entry.alias}
            </span>
            <span className="font-semibold text-accent">{entry.score}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[11px] text-foreground/40">
        Datos ilustrativos de ejemplo.
      </p>
    </div>
  );
}
