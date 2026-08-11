"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";
import { GlassCard } from "@/components/GlassCard";
import type { RoundResult } from "@/lib/types";

const TOTAL_TRIALS = 8;
const BASELINE_MS = 700;

const COLOR_OPTIONS = [
  { name: "ROJO", hex: "#EF4444" },
  { name: "AZUL", hex: "#3B82F6" },
  { name: "VERDE", hex: "#22C55E" },
  { name: "AMARILLO", hex: "#EAB308" },
] as const;

type Phase = "instructions" | "trial" | "done";

interface Trial {
  word: string;
  colorName: string;
  colorHex: string;
}

function generateTrial(): Trial {
  const wordIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
  let colorIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
  // Force incongruence: the font color must never match the word's own meaning.
  while (colorIndex === wordIndex) {
    colorIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
  }
  return {
    word: COLOR_OPTIONS[wordIndex].name,
    colorName: COLOR_OPTIONS[colorIndex].name,
    colorHex: COLOR_OPTIONS[colorIndex].hex,
  };
}

export function StroopTest() {
  const recordGameResult = useQuizStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState<Phase>("instructions");
  const [trialNumber, setTrialNumber] = useState(0);
  const [current, setCurrent] = useState<Trial | null>(null);

  const roundsRef = useRef<RoundResult[]>([]);
  const trialStartRef = useRef<number | null>(null);

  const startTrial = useCallback((index: number) => {
    setCurrent(generateTrial());
    setTrialNumber(index);
    trialStartRef.current = performance.now();
    setPhase("trial");
  }, []);

  function finishGame() {
    const rounds = roundsRef.current;
    const correctCount = rounds.filter((r) => r.correct).length;
    const accuracy = (correctCount / rounds.length) * 100;
    const avgResponseTimeMs =
      rounds.reduce((a, r) => a + r.responseTimeMs, 0) / rounds.length;
    const speedFactor = Math.min(
      100,
      Math.max(0, 100 - (avgResponseTimeMs - BASELINE_MS) / 8)
    );
    const rawScore = Math.min(100, Math.max(0, accuracy * 0.7 + speedFactor * 0.3));

    recordGameResult("stroopTest", {
      game: "stroopTest",
      rounds,
      accuracy,
      avgResponseTimeMs,
      rawScore,
    });
    setPhase("done");
  }

  function handleChoice(e: React.MouseEvent<HTMLButtonElement>) {
    const colorName = e.currentTarget.dataset.color;
    if (!colorName || phase !== "trial" || !current || trialStartRef.current === null) {
      return;
    }
    const responseTimeMs = performance.now() - trialStartRef.current;
    const correct = colorName === current.colorName;
    roundsRef.current = [...roundsRef.current, { responseTimeMs, correct }];

    const nextIndex = trialNumber + 1;
    if (nextIndex >= TOTAL_TRIALS) {
      finishGame();
    } else {
      startTrial(nextIndex);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Palette className="h-4 w-4 text-accent" aria-hidden="true" />
        {phase === "instructions"
          ? "Prueba de enfoque"
          : `Palabra ${Math.min(trialNumber + 1, TOTAL_TRIALS)} de ${TOTAL_TRIALS}`}
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
                Enfoque
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Selecciona el COLOR en el que está pintada la palabra, no lo
                que la palabra dice.
              </p>
              <motion.button
                type="button"
                onClick={() => startTrial(0)}
                whileTap={tapScale}
                transition={springTransition}
                className="h-12 min-w-[44px] rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none"
              >
                Empezar
              </motion.button>
            </GlassCard>
          </motion.div>
        ) : (
          current && (
            <motion.div
              key={trialNumber}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, transition: springTransition }}
              exit={{ opacity: 0, scale: 0.95, transition: springExitTransition }}
              className="flex flex-col items-center gap-8"
            >
              <GlassCard className="flex h-40 w-72 items-center justify-center sm:w-80">
                <span
                  className="text-4xl font-bold tracking-wide"
                  style={{ color: current.colorHex }}
                >
                  {current.word}
                </span>
              </GlassCard>

              <div className="grid grid-cols-2 gap-3">
                {COLOR_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.name}
                    type="button"
                    data-color={opt.name}
                    onClick={handleChoice}
                    whileTap={tapScale}
                    transition={springTransition}
                    className="flex h-14 min-w-[120px] items-center justify-center gap-2 rounded-card border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl focus-visible:outline-none"
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: opt.hex }}
                      aria-hidden="true"
                    />
                    {opt.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
