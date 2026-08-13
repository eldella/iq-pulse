"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS, springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import { cn } from "@/lib/utils";

// Randomized wait before the circle turns green (1-15s, confirmed with the
// user), same range at every level on purpose - unlike the other games'
// content, this one isn't meant to get easier to predict as level climbs,
// it's meant to stay unpredictable so the reading is a genuine reaction
// time. The level multiplier still scores this game (see lib/scoring.ts),
// it just doesn't change what's rendered here.
const DELAY_RANGE_MS: [number, number] = [1000, 15000];

/** Classic reaction-time test: wait for green, tap as fast as possible - tapping early is a miss. */
export function ReactionCircleGame({
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const [stage, setStage] = useState<"waiting" | "go" | "early" | "done">("waiting");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const goTimeRef = useRef(0);
  const goTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const [min, max] = DELAY_RANGE_MS;
    const delay = min + Math.random() * (max - min);
    goTimeoutRef.current = window.setTimeout(() => {
      setStage("go");
    }, delay);
    return () => {
      if (goTimeoutRef.current !== null) window.clearTimeout(goTimeoutRef.current);
    };
  }, []);

  // setStage("go") firing is not the same moment the green circle actually
  // reaches the screen - React still has to re-render, and the browser
  // still has to paint. Stamping goTimeRef right in the timeout callback
  // (like this used to) measured from "JS decided to show green", not from
  // "green is visible", which consistently overstated every reading by
  // however long that render+paint took. A double rAF runs after the frame
  // containing the change has actually been painted, same technique real
  // reaction-time tools use to avoid this exact bias.
  useEffect(() => {
    if (stage !== "go") return;
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        goTimeRef.current = now();
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [stage]);

  function handleClick() {
    if (stage === "waiting") {
      // Cancel the pending "go" timer - otherwise it would still fire later
      // and silently flip stage from "early" back to "go" with a fresh
      // (misleading) goTimeRef, since only unmount was clearing it before.
      if (goTimeoutRef.current !== null) window.clearTimeout(goTimeoutRef.current);
      setStage("early");
      window.setTimeout(() => onAnswer(false, 0), ANSWER_FEEDBACK_MS);
      return;
    }
    if (stage === "go") {
      const responseTimeMs = Math.round(now() - goTimeRef.current);
      setStage("done");
      setReactionMs(responseTimeMs);
      window.setTimeout(() => onAnswer(true, responseTimeMs), ANSWER_FEEDBACK_MS);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">
        {stage === "early" ? t.quiz.reactionCircleEarly : t.quiz.reactionCircleInstructions}
      </p>

      <motion.button
        type="button"
        onClick={handleClick}
        whileTap={stage === "waiting" || stage === "go" ? tapScale : undefined}
        transition={springTransition}
        className={cn(
          "flex h-40 w-40 items-center justify-center rounded-full border-4 text-sm font-semibold backdrop-blur-xl focus-visible:outline-none sm:h-48 sm:w-48",
          stage === "waiting"
            ? "border-glass-border bg-glass text-muted-foreground"
            : stage === "go"
              ? "border-success bg-success/25 text-success"
              : stage === "early"
                ? "border-danger bg-danger/15 text-danger"
                : "border-success bg-success/15 text-success"
        )}
      >
        {stage === "waiting" && t.quiz.reactionCircleWait}
        {stage === "go" && t.quiz.reactionCircleGo}
        {stage === "early" && t.quiz.reactionCircleEarly}
        {stage === "done" && reactionMs !== null && `${reactionMs} ms`}
      </motion.button>
    </div>
  );
}
