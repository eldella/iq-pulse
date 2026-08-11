"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";
import { GlassCard } from "@/components/GlassCard";
import type { RoundResult } from "@/lib/types";

const TOTAL_TRIALS = 5;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;
/** Reference response time used to normalize the raw score, in ms. */
const BASELINE_MS = 450;

type Phase = "instructions" | "waiting" | "go" | "falseStart" | "trialResult" | "done";

export function ReactionTime() {
  const recordGameResult = useQuizStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState<Phase>("instructions");
  const [lastTimeMs, setLastTimeMs] = useState<number | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);

  // performance.now() timestamps live in refs, never in render state, so
  // measurement precision isn't skewed by re-render timing.
  const stimulusTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timesRef = useRef<number[]>([]);

  const clearScheduledTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearScheduledTimeout, [clearScheduledTimeout]);

  const scheduleTrial = useCallback(() => {
    setPhase("waiting");
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timeoutRef.current = setTimeout(() => {
      stimulusTimeRef.current = performance.now();
      setPhase("go");
    }, delay);
  }, []);

  function finishGame(times: number[]) {
    const rounds: RoundResult[] = times.map((t) => ({
      responseTimeMs: t,
      correct: true,
    }));
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    // Faster average reaction time yields a higher normalized score.
    const rawScore = Math.min(100, Math.max(0, 100 - ((avg - BASELINE_MS) / 6)));

    recordGameResult("reactionTime", {
      game: "reactionTime",
      rounds,
      accuracy: 100,
      avgResponseTimeMs: avg,
      rawScore,
    });
    setPhase("done");
  }

  function handleAreaClick() {
    if (phase === "instructions") {
      timesRef.current = [];
      setTrialIndex(0);
      scheduleTrial();
      return;
    }

    if (phase === "waiting") {
      // Tapped before the stimulus appeared: false start, re-run this trial.
      clearScheduledTimeout();
      setPhase("falseStart");
      setTimeout(() => scheduleTrial(), 900);
      return;
    }

    if (phase === "go" && stimulusTimeRef.current !== null) {
      const reactionTime = performance.now() - stimulusTimeRef.current;
      timesRef.current = [...timesRef.current, reactionTime];
      setLastTimeMs(reactionTime);
      setPhase("trialResult");

      setTimeout(() => {
        const nextIndex = trialIndex + 1;
        setTrialIndex(nextIndex);
        if (nextIndex >= TOTAL_TRIALS) {
          finishGame(timesRef.current);
        } else {
          scheduleTrial();
        }
      }, 800);
    }
  }

  const areaColor =
    phase === "go"
      ? "bg-accent"
      : phase === "falseStart"
      ? "bg-red-600"
      : "bg-glass";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Zap className="h-4 w-4 text-accent" aria-hidden="true" />
        {phase === "instructions"
          ? "Prueba de reflejos"
          : `Intento ${Math.min(trialIndex + 1, TOTAL_TRIALS)} de ${TOTAL_TRIALS}`}
      </div>

      <AnimatePresence mode="wait">
        {phase === "instructions" ? (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: springTransition }}
            exit={{ opacity: 0, y: -8, transition: springExitTransition }}
          >
            <GlassCard className="max-w-md p-8 text-center">
              <h2 className="mb-3 text-2xl font-semibold text-foreground">
                Reflejos
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Cuando el recuadro cambie a color acento, toca lo más rápido
                posible. Si tocas antes de tiempo, esa ronda se repite.
              </p>
              <motion.button
                type="button"
                onClick={handleAreaClick}
                whileTap={tapScale}
                transition={springTransition}
                className="h-12 min-w-[44px] rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none"
              >
                Empezar
              </motion.button>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.button
            key="stimulus-area"
            type="button"
            onClick={handleAreaClick}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: springTransition }}
            exit={{ opacity: 0, scale: 0.95, transition: springExitTransition }}
            className={`flex h-64 w-64 select-none flex-col items-center justify-center rounded-card border border-glass-border ${areaColor} text-center shadow-lg backdrop-blur-xl transition-colors focus-visible:outline-none sm:h-72 sm:w-72`}
          >
            {phase === "waiting" && (
              <span className="px-6 text-sm text-foreground/70">
                Espera el color...
              </span>
            )}
            {phase === "go" && (
              <span className="text-xl font-semibold text-accent-foreground">
                ¡Toca ahora!
              </span>
            )}
            {phase === "falseStart" && (
              <span className="px-6 text-sm font-medium text-white">
                Muy pronto. Repitiendo ronda...
              </span>
            )}
            {phase === "trialResult" && lastTimeMs !== null && (
              <span className="text-lg font-semibold text-foreground">
                {Math.round(lastTimeMs)} ms
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
