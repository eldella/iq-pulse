import { CheckCircle2, Gauge, Trophy } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";

/**
 * Illustrative placeholder stats — there is no analytics/aggregation backend
 * in this build. Purely decorative constants for the landing preview.
 */
const TESTS_COMPLETED_TODAY = 342;
const AVERAGE_IQ_TODAY = 104;
const TODAY_RECORD_IQ = 141;

const STATS = [
  { icon: CheckCircle2, label: "Tests completados hoy", value: TESTS_COMPLETED_TODAY },
  { icon: Gauge, label: "CI promedio global", value: AVERAGE_IQ_TODAY },
  { icon: Trophy, label: "Récord del día", value: TODAY_RECORD_IQ },
] as const;

export function StatsTicker() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {STATS.map(({ icon: Icon, label, value }) => (
        <GlassCard key={label} className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
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
