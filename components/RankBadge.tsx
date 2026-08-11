import { Trophy, Medal, Award } from "lucide-react";
import clsx from "clsx";

const RANK_ICONS = [
  { Icon: Trophy, className: "text-yellow-500" },
  { Icon: Medal, className: "text-slate-400" },
  { Icon: Award, className: "text-amber-700" },
] as const;

/**
 * Medal icon for ranks 1-3, falling back to the plain numeric rank.
 * Shared between the full `Leaderboard` and the landing page's
 * `LeaderboardExpress` so the medal visual language stays in one place.
 */
export function RankBadge({ rank }: { rank: number }) {
  const rankIcon = RANK_ICONS[rank - 1];
  return (
    <span className="flex h-6 w-6 items-center justify-center text-sm font-semibold text-foreground/60">
      {rankIcon ? (
        <rankIcon.Icon className={clsx("h-5 w-5", rankIcon.className)} aria-hidden="true" />
      ) : (
        rank
      )}
    </span>
  );
}
