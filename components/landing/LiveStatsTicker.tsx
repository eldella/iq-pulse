import { CheckCircle2, Gauge, Trophy } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";

/**
 * Illustrative placeholder stats — there is no real analytics/aggregation
 * backend yet. Mirrors the mock-now/real-DB-later boundary already
 * documented in app/api/scores/route.ts; swap these constants for a real
 * aggregation endpoint once one exists.
 */
const TESTS_COMPLETED_TODAY = 342;
const AVERAGE_IQ_TODAY = 104;
const TODAY_RECORD_IQ = 141;

const STATS = [
  { icon: CheckCircle2, label: "Tests completados hoy", value: TESTS_COMPLETED_TODAY },
  { icon: Gauge, label: "CI promedio global", value: AVERAGE_IQ_TODAY },
  { icon: Trophy, label: "Récord del día", value: TODAY_RECORD_IQ },
] as const;

export function LiveStatsTicker() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {STATS.map(({ icon: Icon, label, value }) => (
        <GlassCard key={label} className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass backdrop-blur-xl">
            <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-bold text-foreground">
              <AnimatedCounter value={value} />
            </p>
            <p className="text-xs text-foreground/60">{label}</p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
