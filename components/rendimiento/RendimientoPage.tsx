"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { GlassCard } from "@/components/GlassCard";
import { fetchGeneralPerformance } from "@/lib/supabase/quiz";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Own nav destination comparing "you" (demo login flag, see AuthProvider)
 * against the general/aggregate
 * numbers. The "General" side is wired to a real Supabase aggregate query
 * (fetchGeneralPerformance) - falls back to these illustrative numbers only
 * when a bucket has no recorded answers yet (empty tables today, since
 * there's no quiz UI/question bank feeding them yet). "Vos" stays
 * illustrative: the demo login is a client-only flag with no real Supabase
 * Auth user behind it, so there's no real identity to query per-user data
 * for yet - that needs real auth first, a separate piece of work. Unlike
 * the quiz result itself (never gated - see Sostenimiento/Términos: "no hay
 * resultados bloqueados"), seeing yourself compared or ranked inherently
 * needs a persistent identity, so this whole comparison blurs out behind a
 * login prompt instead of showing per-row placeholders.
 */
const FALLBACK_GENERAL_PRECISION = [70, 79, 66] as const;
const YOUR_PRECISION = [76, 88, 61] as const;

const FALLBACK_GENERAL_TIME = [9, 15, 24] as const;
const YOUR_TIME = [8, 13, 26] as const;

type Metric = {
  id: string;
  label: string;
  generalPercent: number;
  yourPercent: number;
  generalDisplay: string;
  yourDisplay: string;
};

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PAD_X = 24;
const PAD_Y = 16;

/**
 * One combined "trading style" line chart: every metric (precision +
 * speed) plotted as a single x-axis, two continuous lines overlaid
 * (General vs Vos) instead of separate tabbed bar groups - replaces the
 * per-domain tab view per feedback asking for one unified comparison.
 * Speed metrics are inverted (faster = higher point) so "higher is
 * better" reads consistently across every point on the chart.
 */
function PerformanceLineChart({
  metrics,
  generalLabel,
  yourLabel,
}: {
  metrics: readonly Metric[];
  generalLabel: string;
  yourLabel: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const stepX = (CHART_WIDTH - PAD_X * 2) / (metrics.length - 1);
  const xAt = (i: number) => PAD_X + i * stepX;
  const yAt = (percent: number) => CHART_HEIGHT - PAD_Y - (percent / 100) * (CHART_HEIGHT - PAD_Y * 2);

  const generalPoints = metrics.map((m, i) => `${xAt(i)},${yAt(m.generalPercent)}`).join(" ");
  const yourPoints = metrics.map((m, i) => `${xAt(i)},${yAt(m.yourPercent)}`).join(" ");

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" aria-hidden="true" />
          {generalLabel}
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-accent">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          {yourLabel}
        </span>
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" aria-hidden="true">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={CHART_WIDTH - PAD_X}
            y1={CHART_HEIGHT - PAD_Y - f * (CHART_HEIGHT - PAD_Y * 2)}
            y2={CHART_HEIGHT - PAD_Y - f * (CHART_HEIGHT - PAD_Y * 2)}
            stroke="currentColor"
            strokeOpacity={0.06}
            className="text-foreground"
          />
        ))}

        <motion.polyline
          points={generalPoints}
          fill="none"
          stroke="rgb(var(--color-muted-fg))"
          strokeOpacity={0.5}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={shouldReduceMotion ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={springTransition}
        />
        <motion.polyline
          points={yourPoints}
          fill="none"
          stroke="rgb(var(--color-accent))"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={shouldReduceMotion ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ ...springTransition, delay: 0.1 }}
        />

        {metrics.map((m, i) => (
          <g key={m.id}>
            <circle cx={xAt(i)} cy={yAt(m.generalPercent)} r={3} fill="rgb(var(--color-muted-fg))" />
            <circle cx={xAt(i)} cy={yAt(m.yourPercent)} r={4} fill="rgb(var(--color-accent))" />
          </g>
        ))}
      </svg>

      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}>
        {metrics.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-0.5 px-0.5 text-center">
            <span className="text-[9px] leading-tight text-muted-foreground">{m.label}</span>
            <span className="tabular-nums text-xs font-semibold text-accent">{m.yourDisplay}</span>
            <span className="tabular-nums text-[10px] text-muted-foreground">{m.generalDisplay}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RendimientoPage() {
  const { t } = useLanguage();
  const { isLoggedIn, login } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [generalPrecision, setGeneralPrecision] = useState<
    readonly [number, number, number]
  >(FALLBACK_GENERAL_PRECISION);
  const [generalTime, setGeneralTime] = useState<readonly [number, number, number]>(
    FALLBACK_GENERAL_TIME
  );

  useEffect(() => {
    let cancelled = false;

    fetchGeneralPerformance()
      .then(({ precisionByDomain, avgTimeByDifficulty }) => {
        if (cancelled) return;
        setGeneralPrecision([
          precisionByDomain.reasoning ?? FALLBACK_GENERAL_PRECISION[0],
          precisionByDomain.memory ?? FALLBACK_GENERAL_PRECISION[1],
          precisionByDomain.speed ?? FALLBACK_GENERAL_PRECISION[2],
        ]);
        setGeneralTime([
          avgTimeByDifficulty.easy ?? FALLBACK_GENERAL_TIME[0],
          avgTimeByDifficulty.medium ?? FALLBACK_GENERAL_TIME[1],
          avgTimeByDifficulty.hard ?? FALLBACK_GENERAL_TIME[2],
        ]);
      })
      .catch(() => {
        // Falls back to the illustrative constants already in state - a
        // failed fetch shouldn't break the page, just keep the placeholder.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const timeUnit = ` ${t.stats.performance.avgTimeUnit}`;
  const timeMax = Math.max(...generalTime, ...YOUR_TIME);

  const metrics: Metric[] = [
    {
      id: "reasoning",
      label: t.domains.item1.title,
      generalPercent: generalPrecision[0],
      yourPercent: YOUR_PRECISION[0],
      generalDisplay: `${generalPrecision[0]}%`,
      yourDisplay: `${YOUR_PRECISION[0]}%`,
    },
    {
      id: "memory",
      label: t.domains.item2.title,
      generalPercent: generalPrecision[1],
      yourPercent: YOUR_PRECISION[1],
      generalDisplay: `${generalPrecision[1]}%`,
      yourDisplay: `${YOUR_PRECISION[1]}%`,
    },
    {
      id: "speed",
      label: t.domains.item3.title,
      generalPercent: generalPrecision[2],
      yourPercent: YOUR_PRECISION[2],
      generalDisplay: `${generalPrecision[2]}%`,
      yourDisplay: `${YOUR_PRECISION[2]}%`,
    },
    // Speed metrics are inverted (100 - percent) so a higher point always
    // means "better" across every metric on the chart, matching the
    // precision metrics above where higher already means better.
    {
      id: "easy",
      label: t.stats.performance.easy,
      generalPercent: 100 - (generalTime[0] / timeMax) * 100,
      yourPercent: 100 - (YOUR_TIME[0] / timeMax) * 100,
      generalDisplay: `${generalTime[0]}${timeUnit}`,
      yourDisplay: `${YOUR_TIME[0]}${timeUnit}`,
    },
    {
      id: "medium",
      label: t.stats.performance.medium,
      generalPercent: 100 - (generalTime[1] / timeMax) * 100,
      yourPercent: 100 - (YOUR_TIME[1] / timeMax) * 100,
      generalDisplay: `${generalTime[1]}${timeUnit}`,
      yourDisplay: `${YOUR_TIME[1]}${timeUnit}`,
    },
    {
      id: "hard",
      label: t.stats.performance.hard,
      generalPercent: 100 - (generalTime[2] / timeMax) * 100,
      yourPercent: 100 - (YOUR_TIME[2] / timeMax) * 100,
      generalDisplay: `${generalTime[2]}${timeUnit}`,
      yourDisplay: `${YOUR_TIME[2]}${timeUnit}`,
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16 sm:px-6">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: springTransition }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          {t.stats.performance.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.stats.performance.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.stats.performance.subhead}
        </p>
      </motion.div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div
          className={
            isLoggedIn
              ? "flex flex-col items-center gap-4 transition-[filter] duration-300"
              : "pointer-events-none flex select-none flex-col items-center gap-4 blur-md transition-[filter] duration-300"
          }
          aria-hidden={!isLoggedIn}
        >
          <PerformanceLineChart
            metrics={metrics}
            generalLabel={t.stats.performance.generalLabel}
            yourLabel={t.stats.performance.yourLabel}
          />
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            {t.stats.performance.chartCaption}
          </p>
        </div>

        {!isLoggedIn && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <GlassCard className="flex flex-col items-center gap-3 p-6 text-center shadow-2xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                {t.stats.performance.lockedTitle}
              </p>
              <motion.button
                type="button"
                onClick={login}
                whileHover={{ y: -1 }}
                whileTap={tapScale}
                transition={springTransition}
                className="shine-hover inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-accent-md focus-visible:outline-none"
              >
                {t.stats.performance.lockedCta}
              </motion.button>
            </GlassCard>
          </div>
        )}
      </div>

      <Link
        href="/perfil"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t.hero.viewProfile}
      </Link>
    </main>
  );
}
