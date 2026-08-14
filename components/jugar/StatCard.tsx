import { GlassCard } from "@/components/GlassCard";

/**
 * Small metric tile for a results screen - emoji + value + label. Built for
 * Reacción's 3-up grid (record / best tap / total time) but kept generic on
 * purpose: the same "cards instead of stacked text" treatment is meant to
 * reach every game's results screen eventually, one at a time.
 */
export function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <GlassCard
      variant="plain"
      className="flex flex-col items-center gap-0.5 border border-glass-border px-2 py-3"
    >
      <span className="text-lg leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="tabular-nums text-sm font-semibold text-foreground">{value}</span>
      <span className="text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
        {label}
      </span>
    </GlassCard>
  );
}
