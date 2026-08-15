"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { WORD_BANK } from "@/lib/wordBank";
import { contentTier } from "@/lib/scoring";
import { ExposureRing } from "@/components/jugar/games/ExposureRing";

/** Facil 700 . Medio 480 . Dificil 320 . Extremo 220 - one entry per named tier, not a formula. */
const LETTER_INTERVAL_BY_TIER = [700, 480, 320, 220];
/** Gap between every letter shown, even a repeated one - otherwise a double letter (e.g. "LLAMA") reads as a single flash. */
const GAP_MS = 140;
const COUNTDOWN_STEP_MS = 700;

/** Prefers longer words as tier climbs (falls back to the full bank if nothing meets the length floor). */
function pickWord(level: number, lang: "es" | "en"): string {
  const minLen = 3 + contentTier(level);
  const pool = WORD_BANK.filter((w) => w[lang].length >= minLen);
  const candidates = pool.length > 0 ? pool : WORD_BANK;
  return shuffle(candidates)[0][lang];
}

type LetterState = "hit" | "moved" | "miss";

/**
 * Two-pass (Wordle-style) grading with consumption, so a repeated letter in
 * `typed` isn't marked "moved" more times than it actually occurs in
 * `word`. Purely diagnostic - the round's actual pass/fail already happened
 * in handleSubmit via an exact string match, this only powers the
 * letter-by-letter review grid shown on a miss.
 */
function grade(word: string, typed: string): { states: LetterState[]; hits: number } {
  const states: LetterState[] = [];
  const pool: (string | null)[] = word.split("");
  let hits = 0;
  for (let i = 0; i < word.length; i++) {
    if (typed[i] === word[i]) {
      states[i] = "hit";
      hits++;
      pool[i] = null;
    }
  }
  for (let j = 0; j < word.length; j++) {
    if (states[j]) continue;
    if (!typed[j]) {
      states[j] = "miss";
      continue;
    }
    const k = pool.indexOf(typed[j]);
    if (k > -1) {
      states[j] = "moved";
      pool[k] = null;
    } else {
      states[j] = "miss";
    }
  }
  return { states, hits };
}

type Phase = "countdown" | "flash" | "recall" | "review";

/**
 * Letters flash one at a time with a gap between every one (word never
 * shown whole), then the player types the reconstructed word into a row of
 * boxes fed by a single hidden input. Stays a question inside QuizPage's
 * shared engine (unlike DigitSpanGame/SpatialMemoryGame) - only the
 * word-review screen on a miss is new, an extra phase this component
 * manages on its own before finally calling onAnswer.
 */
export function WordTypingGame({
  level,
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t, lang } = useLanguage();
  const word = useMemo(() => pickWord(level, lang), [level, lang]);
  const tier = contentTier(level);
  const showMs = Math.max(80, LETTER_INTERVAL_BY_TIER[tier] - GAP_MS);

  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [showingLetter, setShowingLetter] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState<{ isCorrect: boolean } | null>(null);

  const recallStartRef = useRef(0);
  const tokenRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const myToken = ++tokenRef.current;
    const timers = [1, 2, 3].map((step) =>
      window.setTimeout(() => {
        if (tokenRef.current !== myToken) return;
        if (step < 3) {
          setCountdown(3 - step);
        } else {
          setPhase("flash");
        }
      }, step * COUNTDOWN_STEP_MS)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [word]);

  useEffect(() => {
    if (phase !== "flash") return;
    const myToken = tokenRef.current;
    const letters = word.split("");
    const timers: number[] = [];
    let t = 0;
    letters.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          if (tokenRef.current !== myToken) return;
          setVisibleIndex(i + 1);
          setShowingLetter(true);
        }, t)
      );
      t += showMs;
      timers.push(
        window.setTimeout(() => {
          if (tokenRef.current === myToken) setShowingLetter(false);
        }, t)
      );
      t += GAP_MS;
    });
    const recallTimer = window.setTimeout(() => {
      if (tokenRef.current !== myToken) return;
      setPhase("recall");
      recallStartRef.current = now();
    }, t);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(recallTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "recall") inputRef.current?.focus();
  }, [phase]);

  function handleSubmit() {
    if (phase !== "recall" || submitted || typed.length !== word.length) return;
    const isCorrect = typed.toLowerCase() === word.toLowerCase();
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    setSubmitted({ isCorrect });
    if (isCorrect) {
      window.setTimeout(() => onAnswer(true, responseTimeMs), ANSWER_FEEDBACK_MS);
    } else {
      window.setTimeout(() => setPhase("review"), ANSWER_FEEDBACK_MS);
    }
  }

  function handleProceed() {
    const responseTimeMs = Math.round(now() - recallStartRef.current);
    onAnswer(false, responseTimeMs);
  }

  const ready = phase === "recall" && typed.length === word.length;
  const { states, hits } = useMemo(() => grade(word, typed), [word, typed]);
  const hitRatio = word.length > 0 ? hits / word.length : 0;
  const primaryIsUpgrade = phase === "review" && hitRatio >= 1;
  const showLowerDifficultyNudge = phase === "review" && hits === 0 && word.length > 4;

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "countdown" && (
        <motion.p
          key={countdown}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springTransition}
          className="text-6xl font-bold text-accent"
        >
          {countdown}
        </motion.p>
      )}

      {phase === "flash" && (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordTypingFlash}</p>
          <div className="relative flex h-20 w-20 items-center justify-center">
            <ExposureRing key={visibleIndex} durationMs={showMs} active={showingLetter} />
            {showingLetter && visibleIndex > 0 && (
              <span className="text-6xl font-bold uppercase text-accent">{word[visibleIndex - 1]}</span>
            )}
          </div>
        </>
      )}

      {(phase === "recall" || phase === "review") && (
        <>
          <p className="text-sm text-muted-foreground">{t.quiz.wordTypingRecall}</p>

          <div className="relative" onClick={() => inputRef.current?.focus()}>
            <LetterBoxes word={word} typed={typed} tone={submitted ? (submitted.isCorrect ? "success" : "danger") : undefined} />
            <input
              ref={inputRef}
              type="text"
              value={typed}
              disabled={phase !== "recall" || submitted !== null}
              onChange={(e) => setTyped(e.target.value.slice(0, word.length))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={t.quiz.wordTypingRecall}
              className="absolute inset-0 h-full w-full cursor-default opacity-0"
            />
          </div>

          {phase === "recall" && (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!ready}
              whileHover={ready ? { y: -1 } : undefined}
              whileTap={ready ? tapScale : undefined}
              transition={springTransition}
              className={cn(
                "shine-hover inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-accent-foreground focus-visible:outline-none",
                ready ? "bg-accent shadow-accent-md" : "bg-accent/30"
              )}
            >
              {t.quiz.digitSpanSubmit}
            </motion.button>
          )}

          {phase === "review" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="flex w-full max-w-xs flex-col items-center gap-4"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.quiz.recallYouTypedLabel}
                </span>
                <div className="flex flex-wrap justify-center gap-1">
                  {typed.split("").map((ch, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex h-9 w-8 items-center justify-center rounded-control text-sm font-semibold uppercase",
                        states[i] === "hit" && "bg-success/20 text-success",
                        states[i] === "moved" && "bg-warn/20 text-warn",
                        states[i] === "miss" && "text-muted-foreground/50 line-through"
                      )}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.quiz.wordTypingCorrectWord}
                </span>
                <div className="flex flex-wrap justify-center gap-1">
                  {word.split("").map((ch, i) => (
                    <span
                      key={i}
                      className="flex h-9 w-8 items-center justify-center rounded-control border border-glass-border bg-glass text-sm font-semibold uppercase text-foreground"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {showLowerDifficultyNudge && (
                <button
                  type="button"
                  onClick={handleProceed}
                  className="inline-flex items-center rounded-full border border-glass-border bg-glass px-3 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none"
                >
                  {t.quiz.wordTypingLowerDifficultyNudge}
                </button>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  onClick={handleProceed}
                  whileHover={{ y: -1 }}
                  whileTap={tapScale}
                  transition={springTransition}
                  className="shine-hover inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-accent-md focus-visible:outline-none"
                >
                  {primaryIsUpgrade ? t.quiz.wordTypingUpgradeCta : t.quiz.wordTypingNewWordCta}
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

/** Fixed-width box row shown from the start of recall - one box per letter of the target word. */
function LetterBoxes({ word, typed, tone }: { word: string; typed: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: word.length }, (_, i) => {
        const filled = i < typed.length;
        return (
          <span
            key={i}
            className={cn(
              "flex h-11 w-9 items-center justify-center rounded-control border text-lg font-semibold uppercase backdrop-blur-xl",
              !filled && "border-glass-border bg-glass text-muted-foreground/40",
              filled &&
                (tone === "success"
                  ? "border-success bg-success/15 text-success"
                  : tone === "danger"
                    ? "border-danger bg-danger/15 text-danger"
                    : "border-accent bg-accent/10 text-foreground")
            )}
          >
            {filled ? typed[i] : ""}
          </span>
        );
      })}
    </div>
  );
}
