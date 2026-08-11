"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Target, RotateCcw } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";
import { getAggregateScore, estimateIQ, getStrengths, getArchetype } from "@/lib/scoring";
import { springTransition, tapScale } from "@/lib/motion";
import { GlassCard } from "@/components/GlassCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ShareableCard } from "@/components/ShareableCard";
import { SubmitScoreModal } from "@/components/SubmitScoreModal";
import { DonationModal } from "@/components/DonationModal";
import { Leaderboard } from "@/components/Leaderboard";
import type { StrengthBadge } from "@/lib/scoring";
import type { LeaderboardEntry } from "@/lib/types";

const BADGE_ICONS: Record<StrengthBadge["key"], typeof Zap> = {
  reflejos: Zap,
  memoria: Brain,
  enfoque: Target,
};

export function Results() {
  const results = useQuizStore((s) => s.results);
  const resetQuiz = useQuizStore((s) => s.resetQuiz);

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | undefined>();

  const aggregateRawScore = useMemo(() => getAggregateScore(results), [results]);
  const iq = useMemo(() => estimateIQ(aggregateRawScore), [aggregateRawScore]);
  const strengths = useMemo(() => getStrengths(results), [results]);
  const archetype = useMemo(() => getArchetype(results), [results]);
  const roundedScore = Math.round(aggregateRawScore);

  function handleSubmitSuccess(entry: LeaderboardEntry) {
    setHighlightId(entry.id);
    setIsSubmitOpen(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-10 px-6 py-16">
      <AnimatedBackground />

      <GlassCard className="flex w-full max-w-md flex-col items-center gap-2 p-8 text-center">
        <span className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          Tu IQ estimado
        </span>
        <span className="text-6xl font-bold text-accent">
          <AnimatedCounter value={iq} />
        </span>
        <p className="mt-2 text-xs text-foreground/50">
          Resultado con fines de entretenimiento, no es una evaluación
          psicométrica clínica.
        </p>
      </GlassCard>

      {strengths.length > 0 && (
        <div className="flex w-full max-w-md flex-wrap justify-center gap-3">
          {strengths.map((badge) => {
            const Icon = BADGE_ICONS[badge.key];
            return (
              <motion.div
                key={badge.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: springTransition }}
                className="flex items-center gap-2 rounded-full border border-glass-border bg-glass px-4 py-2 backdrop-blur-xl"
              >
                <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">
                  {badge.label}
                </span>
                <span className="text-xs text-foreground/50">
                  {Math.round(badge.value)}%
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      <ShareableCard iq={iq} strengths={strengths} archetype={archetype} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={() => setIsSubmitOpen(true)}
          whileTap={tapScale}
          transition={springTransition}
          className="h-12 min-w-[44px] rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none"
        >
          Guardar mi puntaje
        </motion.button>

        <DonationModal />
      </div>

      <section className="flex w-full max-w-lg flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Tabla de posiciones
          </h2>
          <motion.button
            type="button"
            onClick={resetQuiz}
            whileTap={tapScale}
            transition={springTransition}
            className="flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl focus-visible:outline-none"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Jugar de nuevo
          </motion.button>
        </div>
        <Leaderboard highlightId={highlightId} />
      </section>

      <SubmitScoreModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        score={roundedScore}
        iq={iq}
        onSuccess={handleSubmitSuccess}
      />
    </div>
  );
}
