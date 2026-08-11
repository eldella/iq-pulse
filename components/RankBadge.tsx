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
    <span className="flex h-8 w-8 items-center justify-center text-base font-semibold text-muted-foreground">
      {rankIcon ? (
        <rankIcon.Icon className={clsx("h-7 w-7", rankIcon.className)} aria-hidden="true" />
      ) : (
        rank
      )}
    </span>
  );
}
