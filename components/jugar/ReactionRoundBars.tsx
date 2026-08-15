import { cn } from "@/lib/utils";

/** Chart height in px, not a Tailwind/percentage height - bars need a fixed pixel budget to size against, since their immediate flex parent has no explicit height for a CSS percentage to resolve against. */
const CHART_HEIGHT_PX = 56;

/** One bar per tap, in order, best in green - additive strip below Reacción's result card (see practiceResults.ts's tapBars). */
export function ReactionRoundBars({ bars, caption }: { bars: { ms: number; isBest: boolean }[]; caption: string }) {
  if (bars.length === 0) return null;
  const maxMs = Math.max(...bars.map((bar) => bar.ms));
  const summary = bars.map((bar) => `${bar.ms} ms`).join(", ");

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full items-end gap-1.5 px-1 pt-4" role="img" aria-label={summary}>
        {bars.map((bar, index) => (
          <div key={index} className="relative flex-1" aria-hidden="true">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 tabular-nums text-[9px] text-muted-foreground">
              {bar.ms}
            </span>
            <div
              className={cn("w-full rounded-t-sm", bar.isBest ? "bg-success" : "bg-accent/50")}
              style={{ height: `${Math.max(10, (bar.ms / maxMs) * CHART_HEIGHT_PX)}px` }}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{caption}</p>
    </div>
  );
}
