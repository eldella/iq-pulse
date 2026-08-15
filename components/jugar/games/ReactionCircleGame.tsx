"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ANSWER_FEEDBACK_MS } from "@/lib/motion";
import { now, formatMs } from "@/lib/timing";
import { cn } from "@/lib/utils";

const MIN_WAIT_MS = 1200;
const MAX_WAIT_MS = 4800;
// Exponential (truncated) wait instead of uniform: a uniform wait gets more
// predictable the longer it's already run ("it's got to turn green any
// second now"), which trains anticipation instead of measuring reaction. An
// exponential keeps the instantaneous odds of "it happens now" flat across
// the whole window - same distribution used in
// terminales/reference/reaccion-rediseno.html.
const WAIT_LAMBDA = 1 / 1400;
function waitMs(): number {
  const t = -Math.log(1 - Math.random()) / WAIT_LAMBDA;
  return MIN_WAIT_MS + Math.min(t, MAX_WAIT_MS - MIN_WAIT_MS);
}

/** Below this, it's not a reaction - the tap landed before anyone could actually perceive and respond to green, same as guessing. */
const ANTICIPATION_FLOOR_MS = 100;

/** Classic reaction-time test: wait for green, tap as fast as possible - tapping early, or absurdly fast, is a miss. */
export function ReactionCircleGame({
  onAnswer,
}: {
  level: number;
  onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
}) {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState<"waiting" | "go" | "early" | "anticipated" | "done">("waiting");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const goTimeRef = useRef(0);
  const goTimeoutRef = useRef<number | null>(null);
  // Debug-only breakdown of where time goes between "JS decided to show
  // green" and "measurement actually starts" - see console.log below.
  const debugRef = useRef<{ timeoutFired: number; raf1: number } | null>(null);

  useEffect(() => {
    goTimeoutRef.current = window.setTimeout(() => {
      debugRef.current = { timeoutFired: now(), raf1: 0 };
      setStage("go");
    }, waitMs());
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

  // `onPointerDown` is the primary path (fires at first contact, not on
  // release - `onClick` fires on mouseup/touchend, which for a quick tap
  // alone can add 50-100ms on top of the real reaction). It's wired on the
  // OUTER wrapper (see the returned JSX below), not just the disc, so the
  // whole game area accepts the tap - this measures reaction, not aim
  // (Fitts's law says a bigger target is faster to hit, which would be
  // measuring the wrong thing here). `onClick` stays on the disc itself as
  // the keyboard-activation fallback (Enter/Space on a focused button fire
  // click, not pointerdown). firedRef makes sure only whichever fires first
  // actually counts.
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

      // Faster than genuinely humanly possible off a visual stimulus - this
      // is a guess that happened to land after green appeared, not an
      // actual reaction to it. Doesn't count toward the average, same as a
      // true false start, but with its own message so it reads as "you
      // guessed the timing" rather than "you jumped the gun".
      if (responseTimeMs < ANTICIPATION_FLOOR_MS) {
        setStage("anticipated");
        window.setTimeout(() => onAnswer(false, 0), ANSWER_FEEDBACK_MS);
        return;
      }

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

  const stageLabel =
    stage === "waiting"
      ? t.quiz.reactionCircleWait
      : stage === "go"
        ? t.quiz.reactionCircleGo
        : stage === "early"
          ? t.quiz.reactionCircleEarly
          : stage === "anticipated"
            ? t.quiz.reactionCircleAnticipated
            : reactionMs !== null
              ? formatMs(reactionMs)
              : "";

  return (
    // The whole area accepts the tap, not just the disc - see the
    // handleActivate comment above.
    <div className="flex flex-col items-center gap-6" onPointerDown={handleActivate}>
      <p className="text-sm text-muted-foreground">
        {stage === "early" ? t.quiz.reactionCircleEarly : stage === "anticipated" ? t.quiz.reactionCircleAnticipated : t.quiz.reactionCircleInstructions}
      </p>

      <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
        {/* Breathing ring while armed - holds the gaze on the target
            without stealing it, gone the instant green appears. */}
        {stage === "waiting" && !shouldReduceMotion && (
          <motion.div
            className="pointer-events-none absolute -inset-3 rounded-full border border-accent/25"
            animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
        )}

        {/* Expanding wave - fires only on a successful tap (response
            already registered), never at the instant the stimulus appears:
            it's a reward, not a cue, so it can't leak timing information. */}
        <AnimatePresence>
          {stage === "done" && !shouldReduceMotion && (
            <motion.div
              key="wave"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-success"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

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
          onClick={handleActivate}
          aria-label={stageLabel}
          className={cn(
            "relative flex h-full w-full items-center justify-center rounded-full border-4 text-sm font-semibold focus-visible:outline-none active:scale-95",
            stage === "waiting"
              ? "border-glass-border bg-glass text-muted-foreground"
              : stage === "go"
                ? "border-success bg-success/25 text-success"
                : stage === "early" || stage === "anticipated"
                  ? "border-danger bg-danger/15 text-danger"
                  : "border-success bg-success/15 text-success"
          )}
        >
          {stage === "waiting" ? (
            // Static fixation point - the eye is already on the target by
            // the time green arrives, no animation to compete with it.
            <span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">{stageLabel}</span>
          )}
        </button>
      </div>
    </div>
  );
}
