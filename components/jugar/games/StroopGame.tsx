"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { shuffle } from "@/lib/random";
import { cn } from "@/lib/utils";
import { contentTier } from "@/lib/scoring";
import { getStroopOrder } from "@/lib/stroopSession";

// Red + standard green is the classic confusion pair for protanopia/
// deuteranopia (the most common color-vision deficiencies), and this is a
// color-perception task by nature (an answer's text label doesn't help
// with the stimulus itself, only with picking a response) - green is
// shifted to a teal to keep all hues distinguishable under common CVD. 8
// colors is the practical ceiling for staying distinguishable at a glance,
// so option-pool growth caps there regardless of how high level climbs.
const COLORS = [
  { key: "red", hex: "#FF3B30", es: "Rojo", en: "Red" },
  { key: "blue", hex: "#0A84FF", es: "Azul", en: "Blue" },
  { key: "teal", hex: "#12B5A6", es: "Turquesa", en: "Teal" },
  { key: "yellow", hex: "#FFD60A", es: "Amarillo", en: "Yellow" },
  { key: "purple", hex: "#AF52DE", es: "Violeta", en: "Purple" },
  { key: "orange", hex: "#FF9F0A", es: "Naranja", en: "Orange" },
  { key: "pink", hex: "#FF375F", es: "Rosa", en: "Pink" },
  { key: "brown", hex: "#8E6E53", es: "Marrón", en: "Brown" },
] as const;

type ColorDef = (typeof COLORS)[number];

// 30% of trials show a word whose text matches its own ink (e.g. "Rojo"
// painted red) - without any congruent trials the Stroop-cost metric
// (incongruent RT - congruent RT) would never have a congruent group to
// compare against. Matches terminales/reference/stroop-rediseno.html.
const P_CONGRUENT = 0.3;
/** Fixation-cross wait before each stimulus: 300ms plus 0-200ms of jitter (300-500ms total) - kills the anticipation rhythm a fixed interval would train. */
const FIXATION_MIN_MS = 300;
const FIXATION_JITTER_MS = 200;

function pickTrial(pool: readonly ColorDef[]) {
  const ink = pool[Math.floor(Math.random() * pool.length)];
  const congruent = Math.random() < P_CONGRUENT;
  let word = ink;
  if (!congruent) {
    do {
      word = pool[Math.floor(Math.random() * pool.length)];
    } while (word.key === ink.key);
  }
  return { ink, word, congruent };
}

export function StroopGame({
  level,
  onAnswer,
  sessionId,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
  sessionId?: string | null;
}) {
  const { t, lang } = useLanguage();

  // Difficulty pool (which colors are eligible this trial) still scales with
  // level, same as before. Display ORDER is separate and fixed for the
  // whole run (see lib/stroopSession.ts) so answering never turns into
  // visual search - as the pool grows/shrinks with level, colors already in
  // play keep the same relative slot they were first assigned.
  const optionCount = Math.min(COLORS.length, 3 + contentTier(level));
  const difficultyPool = useMemo(() => COLORS.slice(0, optionCount), [optionCount]);
  const displayPool = useMemo(() => {
    const order = getStroopOrder(sessionId ?? null, () => shuffle(COLORS.map((c) => c.key)));
    return order
      .filter((key) => difficultyPool.some((c) => c.key === key))
      .map((key) => COLORS.find((c) => c.key === key) as ColorDef);
  }, [difficultyPool, sessionId]);

  const [trial, setTrial] = useState<{ ink: ColorDef; word: ColorDef; congruent: boolean } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const stimAtRef = useRef(0);
  const answeredRef = useRef(false);

  // Fixation cross (300-500ms jitter) before the stimulus appears - the
  // trial's ink/word aren't even picked yet at this point, only decided once
  // the wait is over, so there's nothing for an eager answer to leak.
  useEffect(() => {
    const delay = FIXATION_MIN_MS + Math.random() * FIXATION_JITTER_MS;
    const timeoutId = window.setTimeout(() => setTrial(pickTrial(difficultyPool)), delay);
    return () => window.clearTimeout(timeoutId);
    // Only meant to fire once per mount (one trial per mount, see the `key`
    // comment on QuizPage's active-game wrapper) - difficultyPool is stable
    // for the lifetime of this instance regardless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stamp stimAtRef only after the stimulus has actually painted (double
  // requestAnimationFrame - same technique ReactionCircleGame.tsx uses), and
  // flip stimReady only then - otherwise a reading would include React's own
  // render/paint cost, not just the player's. stimReady (not the ref) is
  // what render reads, since reading a ref's value during render is unsafe.
  const [stimReady, setStimReady] = useState(false);
  useEffect(() => {
    if (!trial) return;
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        stimAtRef.current = now();
        setStimReady(true);
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [trial]);

  const locked = !trial || !stimReady || selected !== null;

  // `onPointerDown` is the primary path (fires at first contact, not on
  // release) for the same reason ReactionCircleGame.tsx uses it; `onClick`
  // stays wired to the same handler as the keyboard-activation fallback
  // (Enter/Space on a focused button fire click, not pointerdown).
  // answeredRef makes sure only whichever fires first actually counts.
  function handleChoice(colorKey: string, eventTimeStamp: number) {
    if (locked || answeredRef.current || !trial) return;
    answeredRef.current = true;
    const responseTimeMs = Math.round((eventTimeStamp || now()) - stimAtRef.current);
    const isCorrect = colorKey === trial.ink.key;
    setSelected(colorKey);
    window.setTimeout(() => onAnswer(isCorrect, responseTimeMs), ANSWER_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-sm text-muted-foreground">{t.quiz.stroopInstructions}</p>

      {trial ? (
        <p className="text-5xl font-bold sm:text-6xl" style={{ color: trial.ink.hex }}>
          {lang === "es" ? trial.word.es : trial.word.en}
        </p>
      ) : (
        <p className="text-5xl font-light text-muted-foreground opacity-55" aria-hidden="true">
          +
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {displayPool.map((color) => {
          const isCorrectOption = trial !== null && color.key === trial.ink.key;
          const isSelectedOption = color.key === selected;
          return (
            <motion.button
              key={color.key}
              type="button"
              onPointerDown={(e) => handleChoice(color.key, e.timeStamp)}
              onClick={(e) => handleChoice(color.key, e.timeStamp)}
              disabled={locked}
              aria-label={lang === "es" ? color.es : color.en}
              whileHover={!locked ? { y: -2 } : undefined}
              whileTap={!locked ? tapScale : undefined}
              transition={springTransition}
              className={cn(
                "h-12 w-12 rounded-full border-2 backdrop-blur-xl focus-visible:outline-none sm:h-14 sm:w-14",
                selected === null
                  ? "border-transparent"
                  : isCorrectOption
                    ? "border-success"
                    : isSelectedOption
                      ? "border-danger"
                      : "border-transparent opacity-50"
              )}
              style={{ backgroundColor: color.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
