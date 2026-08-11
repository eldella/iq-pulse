"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hash } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";
import { GlassCard } from "@/components/GlassCard";
import type { RoundResult } from "@/lib/types";

const MIN_LEVEL_LENGTH = 3;
const MAX_LEVEL_LENGTH = 9;
const MAX_CONSECUTIVE_MISSES = 2;
const DIGIT_DISPLAY_MS = 800;
const FEEDBACK_PAUSE_MS = 1000;

type Phase = "instructions" | "showing" | "input" | "feedback" | "done";

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

export function MemorySpan() {
  const recordGameResult = useQuizStore((s) => s.recordGameResult);

  const [phase, setPhase] = useState<Phase>("instructions");
  const [level, setLevel] = useState(MIN_LEVEL_LENGTH);
  const [sequence, setSequence] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState(-1);
  const [userInput, setUserInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const roundsRef = useRef<RoundResult[]>([]);
  const longestSpanRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const trialStartRef = useRef<number | null>(null);

  // Steps through the sequence one digit at a time while phase === "showing".
  useEffect(() => {
    if (phase !== "showing") return;

    if (displayIndex >= sequence.length) {
      const t = setTimeout(() => {
        trialStartRef.current = performance.now();
        setUserInput("");
        setPhase("input");
      }, 300);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setDisplayIndex((i) => i + 1), DIGIT_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [phase, displayIndex, sequence.length]);

  function startLevel(length: number) {
    setSequence(generateSequence(length));
    setDisplayIndex(0);
    setLevel(length);
    setPhase("showing");
  }

  function finishGame() {
    const rounds = roundsRef.current;
    const correctCount = rounds.filter((r) => r.correct).length;
    const accuracy = rounds.length > 0 ? (correctCount / rounds.length) * 100 : 0;
    const rawScore = Math.min(
      100,
      Math.max(0, (longestSpanRef.current / MAX_LEVEL_LENGTH) * 100)
    );
    const avgResponseTimeMs =
      rounds.length > 0
        ? rounds.reduce((a, r) => a + r.responseTimeMs, 0) / rounds.length
        : 0;

    recordGameResult("memorySpan", {
      game: "memorySpan",
      rounds,
      accuracy,
      avgResponseTimeMs,
      rawScore,
    });
    setPhase("done");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "input" || trialStartRef.current === null) return;

    const responseTimeMs = performance.now() - trialStartRef.current;
    const correct = userInput.trim() === sequence.join("");

    roundsRef.current = [...roundsRef.current, { responseTimeMs, correct }];

    if (correct) {
      longestSpanRef.current = Math.max(longestSpanRef.current, level);
      consecutiveMissesRef.current = 0;
    } else {
      consecutiveMissesRef.current += 1;
    }

    setLastCorrect(correct);
    setPhase("feedback");

    const shouldEnd =
      consecutiveMissesRef.current >= MAX_CONSECUTIVE_MISSES ||
      level + 1 > MAX_LEVEL_LENGTH;

    setTimeout(() => {
      if (shouldEnd) {
        finishGame();
      } else {
        startLevel(level + 1);
      }
    }, FEEDBACK_PAUSE_MS);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Hash className="h-4 w-4 text-accent" aria-hidden="true" />
        {phase === "instructions" ? "Prueba de memoria" : `Nivel ${level - MIN_LEVEL_LENGTH + 1}`}
      </div>

      <AnimatePresence mode="wait">
        {phase === "instructions" && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: springTransition }}
            exit={{ opacity: 0, y: -8, transition: springExitTransition }}
          >
            <GlassCard className="max-w-md p-8 text-center">
              <h2 className="mb-3 text-2xl font-semibold text-foreground">
                Memoria
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Memoriza la secuencia de números que aparecerá dígito a
                dígito, luego escríbela en el mismo orden.
              </p>
              <motion.button
                type="button"
                onClick={() => startLevel(MIN_LEVEL_LENGTH)}
                whileTap={tapScale}
                transition={springTransition}
                className="h-12 min-w-[44px] rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none"
              >
                Empezar
              </motion.button>
            </GlassCard>
          </motion.div>
        )}

        {phase === "showing" && (
          <motion.div
            key="showing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: springTransition }}
            exit={{ opacity: 0, scale: 0.95, transition: springExitTransition }}
          >
            <GlassCard className="flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
              <AnimatePresence mode="wait">
                <motion.span
                  key={displayIndex}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1, transition: springTransition }}
                  exit={{ opacity: 0, scale: 0.7, transition: springExitTransition }}
                  className="text-6xl font-semibold text-accent"
                >
                  {displayIndex >= 0 && displayIndex < sequence.length
                    ? sequence[displayIndex]
                    : ""}
                </motion.span>
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )}

        {phase === "input" && (
          <motion.form
            key="input"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: springTransition }}
            exit={{ opacity: 0, y: -8, transition: springExitTransition }}
          >
            <GlassCard className="flex w-80 flex-col items-center gap-4 p-8">
              <label htmlFor="sequence-input" className="text-sm text-foreground/70">
                Escribe la secuencia que recuerdes
              </label>
              <input
                id="sequence-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
                className="h-12 w-full rounded-card border border-glass-border bg-transparent px-4 text-center text-xl tracking-widest text-foreground focus-visible:outline-none"
              />
              <motion.button
                type="submit"
                whileTap={tapScale}
                transition={springTransition}
                className="h-12 min-w-[44px] w-full rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none"
              >
                Confirmar
              </motion.button>
            </GlassCard>
          </motion.form>
        )}

        {phase === "feedback" && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, transition: springTransition }}
            exit={{ opacity: 0, scale: 0.95, transition: springExitTransition }}
          >
            <GlassCard className="flex h-64 w-64 flex-col items-center justify-center gap-2 p-6 text-center sm:h-72 sm:w-72">
              <span className="text-lg font-semibold text-foreground">
                {lastCorrect ? "¡Correcto!" : "Secuencia incorrecta"}
              </span>
              {!lastCorrect && (
                <span className="text-sm text-foreground/60">
                  Era: {sequence.join("")}
                </span>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
