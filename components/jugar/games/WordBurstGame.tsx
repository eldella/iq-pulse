"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { WORD_BANK } from "@/lib/wordBank";
import { contentTier } from "@/lib/scoring";
import type { PracticeLadderStep, WordReviewRunSummary } from "@/components/jugar/practiceResults";

const WORD_INTERVAL_MS = 900;
const MAX_SHOWN = 8;
/** How long the word-by-word feedback frame stays up before calling onAnswer and moving on. */
const FEEDBACK_FRAME_MS = 1700;
const LOW_TIME_THRESHOLD_MS = 5000;

/** Both counts grow with tier; optionCount caps at WORD_BANK.length - can't offer more options than words that exist. */
function generateRound(level: number, lang: "es" | "en") {
  const tier = contentTier(level);
  const shownCount = Math.min(MAX_SHOWN, 3 + tier);
  const optionCount = Math.min(WORD_BANK.length, 6 + tier * 2);
  const pool = shuffle(WORD_BANK);
  const shown = pool.slice(0, shownCount).map((w) => w[lang]);
  const options = shuffle(pool.slice(0, optionCount).map((w) => w[lang]));
  return { shown, options };
}

type Phase = "memorize" | "recall" | "feedback";
type WordTone = "success" | "warn" | "danger" | "off";

/** success = acertada, warn = se te escapó ("estaba" and wasn't marked), danger = falso positivo, off = descarte correcto. */
function toneFor(word: string, shownSet: Set<string>, selectedSet: Set<string>): WordTone {
  const wasShown = shownSet.has(word);
  const wasSelected = selectedSet.has(word);
  if (wasShown && wasSelected) return "success";
  if (wasShown && !wasSelected) return "warn";
  if (!wasShown && wasSelected) return "danger";
  return "off";
}

/**
 * "Memory Burst": words flash one at a time, then the player must tap
 * exactly the words they saw out of a larger grid - still a question
 * inside QuizPage's shared engine (unlike DigitSpanGame/SpatialMemoryGame).
 * The confirmed gap this fixes: a missed word (shown, never marked) used
 * to render identically to a correctly-marked one - recall feedback is now
 * 4-state (see toneFor above), shown as its own frame before onAnswer
 * fires so it's actually visible instead of skipped straight to results.
 */
export function WordBurstGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number, spanSummary?: undefined, wordReview?: WordReviewRunSummary) => void;
}) {
  const { t, lang } = useLanguage();
  const round = useMemo(() => generateRound(level, lang), [level, lang]);
  const totalFlashMs = (round.shown.length + 1) * WORD_INTERVAL_MS;

  const [phase, setPhase] = useState<Phase>("memorize");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [flashMsLeft, setFlashMsLeft] = useState(totalFlashMs);
  const recallStartRef = useRef(0);

  const shownSet = useMemo(() => new Set(round.shown), [round]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  useEffect(() => {
    const timers = round.shown.map((_, index) =>
      window.setTimeout(() => setVisibleIndex(index + 1), (index + 1) * WORD_INTERVAL_MS)
    );
    const recallTimer = window.setTimeout(() => {
      setPhase("recall");
      recallStartRef.current = now();
    }, totalFlashMs);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(recallTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => {
    if (phase !== "memorize") return;
    const id = window.setInterval(() => setFlashMsLeft((prev) => Math.max(0, prev - 100)), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  function toggleWord(word: string) {
    if (phase !== "recall") return;
    setSelected((prev) => (prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]));
  }

  function handleSubmit() {
    if (phase !== "recall" || selected.length === 0) return;
    setPhase("feedback");
    const responseTimeMs = Math.round(now() - recallStartRef.current);

    const isCorrect = shownSet.size === selectedSet.size && [...shownSet].every((w) => selectedSet.has(w));
    const hits = round.shown.filter((w) => selectedSet.has(w)).length;
    const falsePositives = selected.filter((w) => !shownSet.has(w)).length;
    const ladder: PracticeLadderStep[] = round.shown.map((w) => ({
      label: w,
      tone: selectedSet.has(w) ? "success" : "warn",
    }));

    window.setTimeout(() => {
      onAnswer(isCorrect, responseTimeMs, undefined, {
        fractionValue: `${hits}/${round.shown.length}`,
        accuracy: round.shown.length > 0 ? hits / round.shown.length : 0,
        hits,
        falsePositives,
        totalTimeMs: responseTimeMs,
        ladder,
      });
    }, FEEDBACK_FRAME_MS);
  }

  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-6">
      {phase === "memorize" ? (
        <>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full bg-accent transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (flashMsLeft / totalFlashMs) * 100))}%` }}
            />
          </div>
          {flashMsLeft < LOW_TIME_THRESHOLD_MS && (
            <span role="timer" className="tabular-nums text-xs font-semibold text-warn">
              {Math.ceil(flashMsLeft / 1000)}s
            </span>
          )}

          <p className="text-sm text-muted-foreground">{t.quiz.wordBurstMemorize}</p>
          <div className="flex h-20 items-center justify-center">
            {visibleIndex > 0 && (
              <span className="font-bold text-accent" style={{ fontSize: "clamp(46px, 9.5vw, 74px)" }}>
                {round.shown[visibleIndex - 1]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {round.shown.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i + 1 === visibleIndex
                    ? "w-4 bg-accent shadow-accent-sm"
                    : i < visibleIndex
                      ? "w-1.5 bg-accent/60"
                      : "w-1.5 bg-surface-hover"
                )}
              />
            ))}
          </div>
          <span className="tabular-nums text-xs text-muted-foreground">
            {visibleIndex} {t.quiz.wordBurstOfLabel} {round.shown.length}
          </span>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordBurstRecall}</p>
          <div className="grid w-full max-w-xs grid-cols-2 gap-2">
            {round.options.map((word) => {
              const isSelected = selectedSet.has(word);
              const tone = phase === "feedback" ? toneFor(word, shownSet, selectedSet) : null;
              return (
                <motion.button
                  key={word}
                  type="button"
                  onClick={() => toggleWord(word)}
                  disabled={phase !== "recall"}
                  whileHover={phase === "recall" ? { y: -1 } : undefined}
                  whileTap={phase === "recall" ? tapScale : undefined}
                  transition={springTransition}
                  className={cn(
                    "relative flex h-[62px] items-center justify-center rounded-control border px-3 text-sm font-medium backdrop-blur-xl focus-visible:outline-none",
                    phase === "feedback"
                      ? tone === "success"
                        ? "border-success bg-success/15 text-success"
                        : tone === "warn"
                          ? "border-2 border-dashed border-warn bg-transparent text-warn"
                          : tone === "danger"
                            ? "border-danger bg-danger/15 text-danger line-through"
                            : "border-glass-border bg-glass text-muted-foreground opacity-50"
                      : isSelected
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-glass-border bg-glass text-foreground"
                  )}
                >
                  {word}
                  {phase === "recall" && isSelected && (
                    <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  )}
                  {phase === "feedback" && tone === "warn" && (
                    <span className="absolute -top-2 right-1 rounded-full border border-warn bg-warn/20 px-1.5 py-0.5 text-[9px] font-bold text-warn">
                      {t.quiz.wordBurstMissedTag}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {phase === "recall" && (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={selected.length === 0}
              whileHover={selected.length > 0 ? { y: -1 } : undefined}
              whileTap={selected.length > 0 ? tapScale : undefined}
              transition={springTransition}
              className="shine-hover inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-md disabled:opacity-30 focus-visible:outline-none"
            >
              {t.quiz.digitSpanSubmit} · {selected.length}
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}
