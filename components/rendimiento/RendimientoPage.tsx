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
 * against the general/aggregate numbers. The "General" side is wired to a
 * real Supabase aggregate query (fetchGeneralPerformance) - falls back to
 * these illustrative numbers only when a bucket has no recorded answers yet.
 * "Vos" stays illustrative: the demo login is a client-only flag with no
 * real Supabase Auth user behind it, so there's no real identity to query
 * per-user data for yet. Unlike the quiz result itself (never gated - see
 * Sostenimiento/Términos: "no hay resultados bloqueados"), seeing yourself
 * compared inherently needs a persistent identity, so this whole comparison
 * blurs out behind a login prompt instead of showing per-row placeholders.
 */
const FALLBACK_GENERAL_PRECISION = [70, 79, 66] as const;
const YOUR_PRECISION = [76, 88, 61] as const;

const FALLBACK_GENERAL_TIME = [9, 15, 24, 34] as const;
const YOUR_TIME = [8, 13, 26, 33] as const;

/**
 * Precision and time render as two separate card grids (see
 * PerformanceSection below), each with its own scale, instead of one
 * combined axis - mixing % and seconds on a single scale was flagged as
 * misleading even after normalizing/inverting the time values.
 */
function ComparisonBar({
  label,
  value,
  maxValue,
  suffix,
  tone,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  suffix: string;
  tone: "muted" | "accent";
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-12 shrink-0 text-[11px] font-medium ${
          tone === "accent" ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover">
        <motion.div
          initial={shouldReduceMotion ? false : { width: 0 }}
          whileInView={{ width: `${percent}%` }}
          viewport={{ once: true }}
          transition={{ ...springTransition, delay }}
          className={`h-full rounded-full ${
            tone === "accent" ? "bg-accent shadow-accent-sm" : "bg-muted-foreground/40"
          }`}
        />
      </div>
      <span
        className={`w-12 shrink-0 text-right text-xs tabular-nums ${
          tone === "accent" ? "font-semibold text-accent" : "text-muted-foreground"
        }`}
      >
        {value}
        {suffix}
      </span>
    </div>
  );
}

function ComparisonCard({
  label,
  generalValue,
  yourValue,
  maxValue,
  suffix,
  generalLabel,
  yourLabel,
  delay,
}: {
  label: string;
  generalValue: number;
  yourValue: number;
  maxValue: number;
  suffix: string;
  generalLabel: string;
  yourLabel: string;
  delay: number;
}) {
  return (
    <GlassCard variant="plain" className="flex flex-col gap-3 border border-glass-border p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-col gap-2">
        <ComparisonBar
          label={generalLabel}
          value={generalValue}
          maxValue={maxValue}
          suffix={suffix}
          tone="muted"
          delay={delay}
        />
        <ComparisonBar
          label={yourLabel}
          value={yourValue}
          maxValue={maxValue}
          suffix={suffix}
          tone="accent"
          delay={delay + 0.06}
        />
      </div>
    </GlassCard>
  );
}

function PerformanceSection({
  heading,
  subhead,
  rows,
  maxValue,
  suffix,
  generalLabel,
  yourLabel,
  gridCols,
}: {
  heading: string;
  subhead: string;
  rows: readonly { id: string; label: string; general: number; yours: number }[];
  maxValue: number;
  suffix: string;
  generalLabel: string;
  yourLabel: string;
  gridCols: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="text-sm font-medium text-foreground">{heading}</p>
        <p className="text-xs text-muted-foreground">{subhead}</p>
      </div>
      <div className={`grid w-full grid-cols-1 gap-3 ${gridCols}`}>
        {rows.map((row, index) => (
          <ComparisonCard
            key={row.id}
            label={row.label}
            generalValue={row.general}
            yourValue={row.yours}
            maxValue={maxValue}
            suffix={suffix}
            generalLabel={generalLabel}
            yourLabel={yourLabel}
            delay={index * 0.08}
          />
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
  const [generalTime, setGeneralTime] = useState<
    readonly [number, number, number, number]
  >(FALLBACK_GENERAL_TIME);

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
          avgTimeByDifficulty.extreme ?? FALLBACK_GENERAL_TIME[3],
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

  const precisionRows = [
    { id: "reasoning", label: t.domains.item1.title, general: generalPrecision[0], yours: YOUR_PRECISION[0] },
    { id: "memory", label: t.domains.item2.title, general: generalPrecision[1], yours: YOUR_PRECISION[1] },
    { id: "speed", label: t.domains.item3.title, general: generalPrecision[2], yours: YOUR_PRECISION[2] },
  ];

  const timeRows = [
    { id: "easy", label: t.stats.performance.easy, general: generalTime[0], yours: YOUR_TIME[0] },
    { id: "medium", label: t.stats.performance.medium, general: generalTime[1], yours: YOUR_TIME[1] },
    { id: "hard", label: t.stats.performance.hard, general: generalTime[2], yours: YOUR_TIME[2] },
    { id: "extreme", label: t.quiz.difficultyExtreme, general: generalTime[3], yours: YOUR_TIME[3] },
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

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-10">
        <div
          className={
            isLoggedIn
              ? "flex flex-col gap-10 transition-[filter] duration-300"
              : "pointer-events-none flex select-none flex-col gap-10 blur-md transition-[filter] duration-300"
          }
          aria-hidden={!isLoggedIn}
        >
          <PerformanceSection
            heading={t.stats.performance.precisionHeading}
            subhead={t.stats.performance.precisionSubhead}
            rows={precisionRows}
            maxValue={100}
            suffix="%"
            generalLabel={t.stats.performance.generalLabel}
            yourLabel={t.stats.performance.yourLabel}
            gridCols="sm:grid-cols-3"
          />

          <PerformanceSection
            heading={t.stats.performance.timeHeading}
            subhead={t.stats.performance.timeSubhead}
            rows={timeRows}
            maxValue={Math.max(...generalTime, ...YOUR_TIME)}
            suffix={` ${t.stats.performance.avgTimeUnit}`}
            generalLabel={t.stats.performance.generalLabel}
            yourLabel={t.stats.performance.yourLabel}
            gridCols="sm:grid-cols-2 lg:grid-cols-4"
          />
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
