"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Emoji3D } from "@/components/Emoji3D";
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

function ComparisonRow({
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
  const shouldReduceMotion = useReducedMotion();
  const generalPercent = Math.round((generalValue / maxValue) * 100);
  const yourPercent = Math.round((yourValue / maxValue) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>

      <div className="flex items-center gap-3">
        <span className="w-14 shrink-0 text-xs text-muted-foreground">{generalLabel}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
          <motion.span
            initial={shouldReduceMotion ? false : { width: 0 }}
            whileInView={{ width: `${generalPercent}%` }}
            viewport={{ once: true }}
            transition={{ ...springTransition, delay }}
            className="block h-full rounded-full bg-muted-foreground/40"
          />
        </span>
        <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
          {generalValue}
          {suffix}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-14 shrink-0 text-xs font-medium text-accent">{yourLabel}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
          <motion.span
            initial={shouldReduceMotion ? false : { width: 0 }}
            whileInView={{ width: `${yourPercent}%` }}
            viewport={{ once: true }}
            transition={{ ...springTransition, delay: delay + 0.06 }}
            className="block h-full rounded-full bg-accent"
          />
        </span>
        <span className="w-14 shrink-0 text-right text-xs font-medium text-accent">
          {yourValue}
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function RendimientoPage() {
  const { t } = useLanguage();
  const { isLoggedIn, login } = useAuth();
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

  const precisionRows = [
    { id: "reasoning", label: t.domains.item1.title, general: generalPrecision[0], yours: YOUR_PRECISION[0] },
    { id: "memory", label: t.domains.item2.title, general: generalPrecision[1], yours: YOUR_PRECISION[1] },
    { id: "speed", label: t.domains.item3.title, general: generalPrecision[2], yours: YOUR_PRECISION[2] },
  ];

  const timeRows = [
    { id: "easy", label: t.stats.performance.easy, general: generalTime[0], yours: YOUR_TIME[0] },
    { id: "medium", label: t.stats.performance.medium, general: generalTime[1], yours: YOUR_TIME[1] },
    { id: "hard", label: t.stats.performance.hard, general: generalTime[2], yours: YOUR_TIME[2] },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Emoji3D emoji="📈" size="lg" className="mb-1" />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          {t.stats.performance.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.stats.performance.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.stats.performance.subhead}
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-10">
        <div
          className={
            isLoggedIn
              ? "flex flex-col gap-10 transition-[filter] duration-300"
              : "pointer-events-none flex select-none flex-col gap-10 blur-md transition-[filter] duration-300"
          }
          aria-hidden={!isLoggedIn}
        >
          <div>
            <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
              {t.stats.performance.precisionHeading}
            </p>
            <div className="flex flex-col gap-6">
              {precisionRows.map((row, index) => (
                <ComparisonRow
                  key={row.id}
                  label={row.label}
                  generalValue={row.general}
                  yourValue={row.yours}
                  maxValue={100}
                  suffix="%"
                  generalLabel={t.stats.performance.generalLabel}
                  yourLabel={t.stats.performance.yourLabel}
                  delay={index * 0.08}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
              {t.stats.performance.timeHeading}
            </p>
            <div className="flex flex-col gap-6">
              {timeRows.map((row, index) => (
                <ComparisonRow
                  key={row.id}
                  label={row.label}
                  generalValue={row.general}
                  yourValue={row.yours}
                  maxValue={Math.max(...generalTime, ...YOUR_TIME)}
                  suffix={` ${t.stats.performance.avgTimeUnit}`}
                  generalLabel={t.stats.performance.generalLabel}
                  yourLabel={t.stats.performance.yourLabel}
                  delay={index * 0.08}
                />
              ))}
            </div>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <GlassCard className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center shadow-2xl">
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
                className="shine-hover inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
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
