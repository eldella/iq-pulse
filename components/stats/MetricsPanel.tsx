"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Gauge, ClipboardCheck, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Illustrative system-wide metrics — there is no analytics/aggregation
 * backend in this build. Purely decorative constants for the stats page.
 */
const AVERAGE_IQ = 102;
const TESTS_COMPLETED = 18342;

/**
 * Illustrative global percentile distribution (mock, bell-curve shaped) —
 * percentage of recorded results falling in each IQ bracket. Adds up to
 * 100 and is rendered as a simple CSS bar breakdown, no charting library.
 */
const PERCENTILE_DISTRIBUTION = [
  { label: "< 85", percent: 14 },
  { label: "85–100", percent: 34 },
  { label: "100–115", percent: 34 },
  { label: "115–130", percent: 14 },
  { label: "> 130", percent: 4 },
] as const;

/** iOS-widget-style card: subtle press/hover scale, rounded-2xl glass. */
function MetricCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Gauge;
  label: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={tapScale}
      transition={springTransition}
      className="h-full"
    >
      <GlassCard className="flex h-full flex-col gap-3 rounded-2xl p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-white/5">
          <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-foreground/60">{label}</p>
          {children}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function MetricsPanel() {
  return (
    <section aria-labelledby="metricas-heading" className="flex w-full flex-col gap-4">
      <h2 id="metricas-heading" className="text-center text-xl font-semibold text-foreground sm:text-2xl">
        Panel de métricas generales
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={Gauge} label="CI medio registrado">
          <p className="text-2xl font-bold text-foreground">
            <AnimatedCounter value={AVERAGE_IQ} />
          </p>
        </MetricCard>

        <MetricCard icon={ClipboardCheck} label="Pruebas realizadas">
          <p className="text-2xl font-bold text-foreground">
            <AnimatedCounter value={TESTS_COMPLETED} />
          </p>
        </MetricCard>

        <MetricCard icon={BarChart3} label="Distribución de percentiles global">
          <div className="mt-2 flex flex-col gap-1.5">
            {PERCENTILE_DISTRIBUTION.map(({ label, percent }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] text-foreground/50">{label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-[11px] text-foreground/50">
                  {percent}%
                </span>
              </div>
            ))}
          </div>
        </MetricCard>
      </div>
      <p className="text-center text-[11px] text-foreground/40">
        Datos ilustrativos de ejemplo — todavía no existe un backend de
        analítica en este proyecto.
      </p>
    </section>
  );
}
