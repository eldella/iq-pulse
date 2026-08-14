"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS } from "@/lib/motion";
import { now } from "@/lib/timing";
import { cn } from "@/lib/utils";

// Randomized wait before the circle turns green (1-5s, confirmed with the
// user), same range at every level on purpose - unlike the other games'
// content, this one isn't meant to get easier to predict as level climbs,
// it's meant to stay unpredictable so the reading is a genuine reaction
// time. The level multiplier still scores this game (see lib/scoring.ts),
// it just doesn't change what's rendered here.
const DELAY_RANGE_MS: [number, number] = [1000, 5000];

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
  // Debug-only breakdown of where time goes between "JS decided to show
  // green" and "measurement actually starts" - see console.log below.
  const debugRef = useRef<{ timeoutFired: number; raf1: number } | null>(null);

  useEffect(() => {
    const [min, max] = DELAY_RANGE_MS;
    const delay = min + Math.random() * (max - min);
    goTimeoutRef.current = window.setTimeout(() => {
      debugRef.current = { timeoutFired: now(), raf1: 0 };
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
      if (debugRef.current) debugRef.current.raf1 = now();
      innerFrame = requestAnimationFrame(() => {
        goTimeRef.current = now();
        if (debugRef.current) {
          const { timeoutFired, raf1 } = debugRef.current;
          console.log(
            `[ReactionCircle] timeout→raf1: ${(raf1 - timeoutFired).toFixed(1)}ms | raf1→raf2 (measurement starts here): ${(goTimeRef.current - raf1).toFixed(1)}ms | total render/paint overhead removed from the reading: ${(goTimeRef.current - timeoutFired).toFixed(1)}ms`
          );
        }
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [stage]);

  // Guards against handling the same tap twice - see handleActivate below.
  const firedRef = useRef(false);

  // `onClick` fires on mouseup/touchend, not on first contact - for a quick
  // tap, the press-to-release gap alone can add 50-100ms on top of the real
  // reaction, which lines up with readings coming in ~50-100ms above what
  // the player feels. `onPointerDown` fires at first contact (mousedown /
  // touchstart) instead, so it's the primary path here; `onClick` stays
  // wired to the same handler purely as the keyboard-activation fallback
  // (Enter/Space on a focused button fire click, not pointerdown). firedRef
  // makes sure only whichever event fires first actually counts - once a
  // pointerdown has been handled, the click that follows it is a no-op.
  function handleActivate() {
    if (firedRef.current) return;

    if (stage === "waiting") {
      firedRef.current = true;
      // Cancel the pending "go" timer - otherwise it would still fire later
      // and silently flip stage from "early" back to "go" with a fresh
      // (misleading) goTimeRef, since only unmount was clearing it before.
      if (goTimeoutRef.current !== null) window.clearTimeout(goTimeoutRef.current);
      setStage("early");
      window.setTimeout(() => onAnswer(false, 0), ANSWER_FEEDBACK_MS);
      return;
    }
    if (stage === "go") {
      firedRef.current = true;
      const activationTime = now();
      const responseTimeMs = Math.round(activationTime - goTimeRef.current);
      console.log(
        `[ReactionCircle] measured reaction time: ${responseTimeMs}ms (from post-paint go→pointerdown${
          debugRef.current ? `, naive timeout→pointerdown would have read ${Math.round(activationTime - debugRef.current.timeoutFired)}ms` : ""
        })`
      );
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

      {/*
        Plain button, not motion.button: this is the one place in the app
        where render/composite cost directly pollutes the number shown to
        the player, so it skips Framer Motion's tap gesture handling and the
        backdrop-blur compositing layer entirely - both were candidate
        sources of the measurement bias reported, and neither is worth the
        risk here even if hard to pin down for certain without profiling.
      */}
      <button
        type="button"
        onPointerDown={handleActivate}
        onClick={handleActivate}
        className={cn(
          "flex h-40 w-40 items-center justify-center rounded-full border-4 text-sm font-semibold focus-visible:outline-none active:scale-95 sm:h-48 sm:w-48",
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
      </button>
    </div>
  );
}
