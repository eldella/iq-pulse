"use client";

import { TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Illustrative system-wide metrics — there is no analytics/aggregation
 * backend in this build. Purely decorative constants for the stats page.
 */
const AVERAGE_IQ = 102;
const TESTS_COMPLETED = 18342;

/**
 * Illustrative last-7-week trend points (mock) backing the sparklines under
 * each KPI number — no analytics backend behind these.
 */
const AVERAGE_IQ_TREND = [99, 100, 101, 100, 102, 101, 102] as const;
const TESTS_COMPLETED_TREND = [11200, 12600, 13900, 15100, 16400, 17300, 18342] as const;

/**
 * Illustrative global percentile distribution (mock, bell-curve shaped) —
 * percentage of recorded results falling in each IQ bracket. Adds up to
 * 100 and is rendered as an open horizontal bar list, no charting library.
 */
const PERCENTILE_DISTRIBUTION = [
  { label: "< 85", percent: 14 },
  { label: "85–100", percent: 34 },
  { label: "100–115", percent: 34 },
  { label: "115–130", percent: 14 },
  { label: "> 130", percent: 4 },
] as const;

/**
 * Minimal inline sparkline — plain SVG polyline, no charting library. Values
 * are normalized to the 0–100 viewBox range so the line always fills the
 * available height regardless of the underlying metric's scale. Floats
 * directly on the section background, no box of its own.
 */
function Sparkline({ data, className }: { data: readonly number[]; className?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small "+X% últimas semanas" trend line paired with each sparkline. */
function TrendNote({ data }: { data: readonly number[] }) {
  const { t } = useLanguage();
  const first = data[0];
  const last = data[data.length - 1];
  const percentChange = Math.round(((last - first) / first) * 100);

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
      +{percentChange}% {t.stats.metrics.trend}
    </span>
  );
}

/**
 * Open, card-less KPI panel: numbers are the visual protagonists, sections
 * are separated by dividers/spacing instead of boxes, borders, or shadows.
 * No background tint of its own (fully transparent) so the shared
 * `AnimatedBackground` layer stays visible here exactly like every other
 * section on the page - an opaque or even lightly-tinted fill was tried and
 * flattened/hid the glow, so this section intentionally carries none.
 */
export function MetricsPanel() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="metricas-heading"
      className="relative w-full py-20 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2
          id="metricas-heading"
          className="text-center text-2xl font-semibold text-foreground sm:text-3xl"
        >
          {t.stats.metrics.heading}
        </h2>

        <div className="mt-12 grid grid-cols-1 divide-y divide-black/10 dark:divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-8">
            <p className="text-sm font-medium text-muted-foreground">
              {t.stats.metrics.avgIQ}
            </p>
            <p className="text-6xl font-semibold tracking-tight text-foreground sm:text-7xl">
              <AnimatedCounter value={AVERAGE_IQ} />
            </p>
            <Sparkline
              data={AVERAGE_IQ_TREND}
              className="mt-2 h-12 w-full max-w-[220px] text-accent/70"
            />
            <TrendNote data={AVERAGE_IQ_TREND} />
          </div>

          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-8">
            <p className="text-sm font-medium text-muted-foreground">
              {t.stats.metrics.testsCompleted}
            </p>
            <p className="text-6xl font-semibold tracking-tight text-foreground sm:text-7xl">
              <AnimatedCounter value={TESTS_COMPLETED} />
            </p>
            <Sparkline
              data={TESTS_COMPLETED_TREND}
              className="mt-2 h-12 w-full max-w-[220px] text-accent/70"
            />
            <TrendNote data={TESTS_COMPLETED_TREND} />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
            {t.stats.metrics.distribution}
          </p>
          {PERCENTILE_DISTRIBUTION.map(({ label, percent }, index) => (
            <div
              key={label}
              className={
                index < PERCENTILE_DISTRIBUTION.length - 1
                  ? "flex items-center gap-4 border-b border-black/5 py-3 dark:border-white/5"
                  : "flex items-center gap-4 py-3"
              }
            >
              <span className="w-16 shrink-0 text-sm text-muted-foreground">{label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                {percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
