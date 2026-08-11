"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

type WidgetPhase = "idle" | "waiting" | "ready" | "tooSoon" | "result";

const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 2200;

/**
 * Illustrative-only mock percentile, NOT a real statistic — there is no
 * player distribution backing this. Maps a reaction time to a plausible
 * "faster than X%" figure via a simple monotonic curve anchored around a
 * ~280ms assumed median, so the badge varies believably with the result
 * instead of being a hardcoded string.
 */
function mockPercentile(reactionTimeMs: number): number {
  const ASSUMED_MEDIAN_MS = 280;
  const ASSUMED_SPREAD_MS = 140;
  const raw = 50 + ((ASSUMED_MEDIAN_MS - reactionTimeMs) / ASSUMED_SPREAD_MS) * 34;
  return Math.min(97, Math.max(3, Math.round(raw)));
}

/**
 * Standalone reaction-time teaser widget: click to arm it, then click again
 * once it flips state. Purely local component state — no store, no backend,
 * no "official" result. Timing uses performance.now() captured in a ref
 * (not Date.now() in render state) so re-renders can't skew the measurement.
 */
export function ReactionMicroWidget() {
  const [phase, setPhase] = useState<WidgetPhase>("idle");
  const [resultMs, setResultMs] = useState<number | null>(null);

  const stimulusTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScheduledTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearScheduledTimeout, [clearScheduledTimeout]);

  function scheduleReady() {
    setPhase("waiting");
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timeoutRef.current = setTimeout(() => {
      stimulusTimeRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }

  function handleClick() {
    if (phase === "idle" || phase === "result" || phase === "tooSoon") {
      setResultMs(null);
      scheduleReady();
      return;
    }
    if (phase === "waiting") {
      clearScheduledTimeout();
      setPhase("tooSoon");
      return;
    }
    if (phase === "ready" && stimulusTimeRef.current !== null) {
      const elapsed = performance.now() - stimulusTimeRef.current;
      setResultMs(elapsed);
      setPhase("result");
    }
  }

  const percentile = resultMs !== null ? mockPercentile(resultMs) : null;

  return (
    <GlassCard className="w-full max-w-xs p-1">
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={tapScale}
        transition={springTransition}
        aria-label="Mini prueba de reacción de ejemplo"
        className={cn(
          "flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl px-6 text-center transition-colors focus-visible:outline-none",
          phase === "ready" && "bg-accent",
          phase === "tooSoon" && "bg-red-600",
          phase !== "ready" && phase !== "tooSoon" && "bg-white/5"
        )}
      >
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: springTransition }}
              exit={{ opacity: 0, transition: springExitTransition }}
              className="flex flex-col items-center gap-2"
            >
              <Zap className="h-6 w-6 text-accent" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground/80">
                Probá tu velocidad de reacción
              </span>
            </motion.div>
          )}
          {phase === "waiting" && (
            <motion.span
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: springTransition }}
              exit={{ opacity: 0, transition: springExitTransition }}
              className="text-sm text-foreground/70"
            >
              Esperá el cambio de color...
            </motion.span>
          )}
          {phase === "ready" && (
            <motion.span
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, transition: springTransition }}
              exit={{ opacity: 0, transition: springExitTransition }}
              className="text-lg font-semibold text-accent-foreground"
            >
              ¡Tocá ahora!
            </motion.span>
          )}
          {phase === "tooSoon" && (
            <motion.span
              key="tooSoon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: springTransition }}
              exit={{ opacity: 0, transition: springExitTransition }}
              className="px-4 text-sm font-medium text-white"
            >
              Muy pronto. Tocá para reintentar.
            </motion.span>
          )}
          {phase === "result" && resultMs !== null && percentile !== null && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: springTransition }}
              exit={{ opacity: 0, transition: springExitTransition }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl font-bold text-foreground">
                {Math.round(resultMs)} ms
              </span>
              <span className="text-xs text-accent">
                Más rápido que el {percentile}% de los jugadores*
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      <p className="px-3 pb-2 pt-1 text-center text-[11px] text-foreground/40">
        * Estimación ilustrativa y con fines de entretenimiento, no es un
        resultado oficial.
      </p>
    </GlassCard>
  );
}
