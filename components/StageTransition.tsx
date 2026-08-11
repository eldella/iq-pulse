"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Brain, Target } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";
import { springTransition, tapScale } from "@/lib/motion";
import { GlassCard } from "@/components/GlassCard";
import type { GameId } from "@/lib/types";

const STAGE_META: Record<GameId, { label: string; icon: typeof Zap }> = {
  reactionTime: { label: "Reflejos", icon: Zap },
  memorySpan: { label: "Memoria", icon: Brain },
  stroopTest: { label: "Enfoque", icon: Target },
};

/**
 * Shown between every stage: progress dots, a quick recap of the stage just
 * finished, and one CTA that advances the store to the next stage (or to
 * results on the last one). Generic over `totalStages` — never hardcodes a
 * stage count, so a 4th stage slots in without touching this file.
 */
export function StageTransition() {
  const stages = useQuizStore((s) => s.stages);
  const currentStageIndex = useQuizStore((s) => s.currentStageIndex);
  const totalStages = useQuizStore((s) => s.totalStages);
  const results = useQuizStore((s) => s.results);
  const nextScreen = useQuizStore((s) => s.nextScreen);

  const completedGame = stages[currentStageIndex];
  const result = results[completedGame];
  const meta = STAGE_META[completedGame];
  const isLastStage = currentStageIndex + 1 >= totalStages;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div
        role="list"
        aria-label={`Etapa ${currentStageIndex + 1} de ${totalStages}`}
        className="flex items-center gap-2"
      >
        {Array.from({ length: totalStages }).map((_, i) => (
          <span
            key={i}
            role="listitem"
            className={`h-2 w-8 rounded-full transition-colors ${
              i <= currentStageIndex ? "bg-accent" : "bg-glass-border"
            }`}
          />
        ))}
      </div>

      <GlassCard className="flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">
        {meta && (
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-glass-border bg-glass backdrop-blur-xl">
            <meta.icon className="h-6 w-6 text-accent" aria-hidden="true" />
          </span>
        )}

        <div>
          <p className="text-sm text-foreground/60">
            Etapa {currentStageIndex + 1} de {totalStages}
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            {meta?.label ?? "Etapa completa"}
          </h2>
        </div>

        {result && (
          <div className="grid w-full grid-cols-2 gap-3 text-sm">
            <div className="rounded-card border border-glass-border bg-glass p-3">
              <p className="text-foreground/50">Precisión</p>
              <p className="text-lg font-semibold text-foreground">
                {Math.round(result.accuracy)}%
              </p>
            </div>
            <div className="rounded-card border border-glass-border bg-glass p-3">
              <p className="text-foreground/50">Tiempo prom.</p>
              <p className="text-lg font-semibold text-foreground">
                {Math.round(result.avgResponseTimeMs)} ms
              </p>
            </div>
          </div>
        )}

        <motion.button
          type="button"
          onClick={nextScreen}
          whileTap={tapScale}
          transition={springTransition}
          className="mt-1 flex h-12 min-w-[44px] items-center gap-2 rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none"
        >
          {isLastStage ? "Ver resultados" : "Siguiente reto"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </motion.button>
      </GlassCard>
    </div>
  );
}
