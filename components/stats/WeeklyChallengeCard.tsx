"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { epochNow, now } from "@/lib/timing";
import {
  MAX_MISTAKES,
  ROUND_COUNT,
  ROUND_SECONDS,
  generateWeeklyRound,
  getNextWeekStart,
  getWeekKey,
  getWeeklyGameType,
  type WeeklyRound,
} from "@/lib/weeklyPuzzle";
import { markWeeklyChallengeResult, useWeeklyChallengeStatus } from "@/lib/weeklyChallengeState";

const REVEAL_STEP_MS = 550;

function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

function hexagonPoints(size: number, rotationDeg: number): string {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = rotationRad + (i * Math.PI) / 3;
    const x = 50 + size * Math.cos(angle);
    const y = 50 + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
}

/** Asymmetric L-tromino outline, centered on a 100x100 viewBox, rotated and optionally mirrored. */
const L_UNITS: [number, number][] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
];

function lShapePoints(rotationDeg: number, mirrored: boolean): string {
  const unit = 20;
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return L_UNITS.map(([ux, uy]) => {
    let x = (ux - 1) * unit;
    const y = (uy - 1) * unit;
    if (mirrored) x = -x;
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return `${(50 + rx).toFixed(2)},${(50 + ry).toFixed(2)}`;
  }).join(" ");
}

/**
 * "Reto de la semana" - 3 timed rounds, 10 seconds each, up to 3 total
 * mistakes before the attempt fails. Which of 4 games is live rotates every
 * week (lib/weeklyPuzzle.ts): spot the odd hexagon, spot the mirrored shape,
 * repeat a flashed sequence, or count a flashed cluster of dots. Local-only
 * for now (no Supabase writes) - matches how the Daily Challenge shipped in
 * two stages: get the mechanic right first, wire it to a real points/
 * leaderboard pipeline in a later pass before this counts publicly.
 */
export function WeeklyChallengeCard() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const weekKey = getWeekKey();
  const gameType = getWeeklyGameType();
  const c = t.stats.leaderboard.challenge;

  const storedStatus = useWeeklyChallengeStatus(weekKey);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<"reveal" | "answer">("answer");
  const [round, setRound] = useState(0);
  const [roundData, setRoundData] = useState<WeeklyRound | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [msUntilNext, setMsUntilNext] = useState(() => Math.max(0, getNextWeekStart().getTime() - epochNow()));
  const deadlineRef = useRef(0);

  function beginAnswerPhase() {
    setPhase("answer");
    deadlineRef.current = now() + ROUND_SECONDS * 1000;
    setSecondsLeft(ROUND_SECONDS);
  }

  function startRound(nextRound: number) {
    const data = generateWeeklyRound(gameType, weekKey, nextRound);
    setRound(nextRound);
    setRoundData(data);
    setUserSequence([]);
    setWrongIndex(null);
    if (data.kind === "sequence" || data.kind === "flashCount") {
      setPhase("reveal");
    } else {
      setPhase("answer");
      deadlineRef.current = now() + ROUND_SECONDS * 1000;
      setSecondsLeft(ROUND_SECONDS);
    }
  }

  function startChallenge() {
    setMistakes(0);
    startRound(0);
    setPlaying(true);
  }

  function registerMistake(shakeIndex: number | null) {
    if (shakeIndex !== null) {
      setWrongIndex(shakeIndex);
      window.setTimeout(() => setWrongIndex((current) => (current === shakeIndex ? null : current)), 300);
    }
    setMistakes((current) => {
      const next = current + 1;
      if (next >= MAX_MISTAKES) {
        setPlaying(false);
        markWeeklyChallengeResult(weekKey, "failed");
      }
      return next;
    });
  }

  function advanceRoundOrFinish() {
    if (round + 1 >= ROUND_COUNT) {
      setPlaying(false);
      markWeeklyChallengeResult(weekKey, "success");
      return;
    }
    startRound(round + 1);
  }

  function handleOddPick(index: number, oddIndex: number) {
    if (!playing || phase !== "answer") return;
    if (index !== oddIndex) {
      registerMistake(index);
      return;
    }
    advanceRoundOrFinish();
  }

  function handleSequenceClick(index: number, sequence: number[]) {
    if (!playing || phase !== "answer") return;
    const expected = sequence[userSequence.length];
    if (index !== expected) {
      setUserSequence([]);
      registerMistake(index);
      return;
    }
    const next = [...userSequence, index];
    setUserSequence(next);
    if (next.length === sequence.length) {
      advanceRoundOrFinish();
    }
  }

  function handleCountPick(value: number, correctCount: number) {
    if (!playing || phase !== "answer") return;
    if (value !== correctCount) {
      registerMistake(value);
      return;
    }
    advanceRoundOrFinish();
  }

  useEffect(() => {
    if (!playing || phase !== "reveal" || !roundData) return;
    const revealMs =
      roundData.kind === "flashCount"
        ? roundData.revealMs
        : roundData.kind === "sequence"
          ? roundData.sequence.length * REVEAL_STEP_MS + 300
          : 0;
    if (revealMs <= 0) return;
    const id = window.setTimeout(beginAnswerPhase, revealMs);
    return () => window.clearTimeout(id);
  }, [playing, phase, roundData]);

  useEffect(() => {
    if (!playing || phase !== "answer") return;
    const id = window.setInterval(() => {
      const remainingMs = Math.max(0, deadlineRef.current - now());
      setSecondsLeft(remainingMs / 1000);
      if (remainingMs <= 0) {
        setPlaying(false);
        markWeeklyChallengeResult(weekKey, "failed");
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, phase, weekKey]);

  useEffect(() => {
    if (storedStatus === "idle") return;
    const id = window.setInterval(() => {
      setMsUntilNext(Math.max(0, getNextWeekStart().getTime() - epochNow()));
    }, 30_000);
    return () => window.clearInterval(id);
  }, [storedStatus]);

  const timerPct = Math.max(0, Math.min(100, (secondsLeft / ROUND_SECONDS) * 100));

  return (
    <motion.div whileHover={{ y: -3 }} transition={springTransition} className="w-full max-w-2xl">
      <GlassCard variant="plain" className="flex flex-col items-center gap-4 p-8 text-center shadow-sm transition-shadow hover:shadow-md">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{c.heading}</p>
        <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>

        <AnimatePresence mode="wait">
          {storedStatus === "success" ? (
            <motion.div
              key="success"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex flex-col items-center gap-2 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="max-w-md text-sm font-medium text-pretty text-foreground">{c.solvedLabel}</p>
              <p className="tabular-nums text-xs text-muted-foreground">
                {c.nextInLabel} {formatCountdown(msUntilNext)}
              </p>
            </motion.div>
          ) : storedStatus === "failed" ? (
            <motion.div
              key="failed"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springTransition}
              className="flex flex-col items-center gap-2 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                <X className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="max-w-md text-sm font-medium text-pretty text-foreground">{c.failedLabel}</p>
              <p className="tabular-nums text-xs text-muted-foreground">
                {c.nextInLabel} {formatCountdown(msUntilNext)}
              </p>
            </motion.div>
          ) : playing && roundData ? (
            <motion.div key="playing" className="flex flex-col items-center gap-3">
              <div className="flex w-full max-w-xs items-center justify-between text-xs font-medium text-muted-foreground">
                <span>
                  {c.roundLabel} {round + 1}/{ROUND_COUNT}
                </span>
                {phase === "answer" && (
                  <span className="tabular-nums text-danger">
                    {c.mistakesLabel} {mistakes}/{MAX_MISTAKES}
                  </span>
                )}
                {phase === "answer" && <span className="tabular-nums">{secondsLeft.toFixed(1)}s</span>}
              </div>
              {phase === "answer" && (
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={
                      shouldReduceMotion ? "h-full bg-accent" : "h-full bg-accent transition-[width] duration-100 ease-linear"
                    }
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              )}

              {roundData.kind === "oddHexagon" && (
                <div role="group" aria-label={c.title} className="grid grid-cols-5 gap-1 sm:gap-1.5">
                  {roundData.cells.map((cell, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleOddPick(index, roundData.oddIndex)}
                      whileTap={tapScale}
                      animate={shouldReduceMotion || wrongIndex !== index ? undefined : { x: [0, -4, 4, -4, 0] }}
                      transition={{ duration: 0.3 }}
                      aria-label={`${c.cellLabel} ${index + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-control text-accent transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true">
                        <polygon points={hexagonPoints(38, cell.rotationDeg)} fill="none" stroke="currentColor" strokeWidth="6" />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              )}

              {roundData.kind === "mirror" && (
                <>
                  <p className="max-w-sm text-xs text-muted-foreground">{c.mirrorHint}</p>
                  <div role="group" aria-label={c.title} className="grid grid-cols-2 gap-3">
                    {roundData.cells.map((cell, index) => (
                      <motion.button
                        key={index}
                        type="button"
                        onClick={() => handleOddPick(index, roundData.oddIndex)}
                        whileTap={tapScale}
                        animate={shouldReduceMotion || wrongIndex !== index ? undefined : { x: [0, -4, 4, -4, 0] }}
                        transition={{ duration: 0.3 }}
                        aria-label={`${c.cellLabel} ${index + 1}`}
                        className="flex h-16 w-16 items-center justify-center rounded-control text-accent transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <svg viewBox="0 0 100 100" className="h-12 w-12" aria-hidden="true">
                          <polygon
                            points={lShapePoints(cell.rotationDeg, cell.mirrored)}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {roundData.kind === "sequence" && (
                <>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {phase === "reveal" ? c.sequenceRevealHint : c.sequenceAnswerHint}
                  </p>
                  {phase === "answer" && (
                    <p className="tabular-nums text-xs text-muted-foreground">
                      {userSequence.length}/{roundData.sequence.length}
                    </p>
                  )}
                  <div role="group" aria-label={c.title} className="grid grid-cols-3 gap-2">
                    {Array.from({ length: roundData.gridSize * roundData.gridSize }, (_, index) => {
                      const stepIndex = roundData.sequence.indexOf(index);
                      const confirmed = phase === "answer" && userSequence.includes(index);
                      return (
                        <motion.button
                          key={index}
                          type="button"
                          onClick={() => handleSequenceClick(index, roundData.sequence)}
                          whileTap={phase === "answer" ? tapScale : undefined}
                          initial={false}
                          animate={
                            shouldReduceMotion
                              ? undefined
                              : phase === "reveal" && stepIndex !== -1
                                ? { opacity: [0.3, 1, 0.3], scale: [1, 1.18, 1] }
                                : wrongIndex === index
                                  ? { x: [0, -4, 4, -4, 0] }
                                  : { opacity: 1, scale: 1 }
                          }
                          transition={
                            phase === "reveal" && stepIndex !== -1
                              ? { duration: REVEAL_STEP_MS / 1000, delay: (stepIndex * REVEAL_STEP_MS) / 1000 }
                              : { duration: 0.3 }
                          }
                          aria-label={`${c.cellLabel} ${index + 1}`}
                          className={`flex h-14 w-14 items-center justify-center rounded-control border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                            confirmed
                              ? "border-accent bg-accent/20"
                              : phase === "reveal" && stepIndex !== -1
                                ? "border-accent/60 bg-accent/10"
                                : "border-glass-border bg-glass hover:bg-surface-hover"
                          }`}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {roundData.kind === "flashCount" && (
                <>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {phase === "reveal" ? c.flashCountRevealHint : c.flashCountAnswerHint}
                  </p>
                  {phase === "reveal" ? (
                    <svg viewBox="0 0 100 100" className="h-40 w-40 text-accent" aria-hidden="true">
                      {roundData.dots.map((dot, index) => (
                        <circle key={index} cx={dot.x} cy={dot.y} r={3.4} fill="currentColor" />
                      ))}
                    </svg>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {roundData.options.map((value) => (
                        <motion.button
                          key={value}
                          type="button"
                          onClick={() => handleCountPick(value, roundData.correctCount)}
                          whileTap={tapScale}
                          animate={shouldReduceMotion || wrongIndex !== value ? undefined : { x: [0, -4, 4, -4, 0] }}
                          transition={{ duration: 0.3 }}
                          className="flex h-12 w-12 items-center justify-center rounded-control border border-glass-border bg-glass text-lg font-semibold tabular-nums text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {value}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="idle" className="flex flex-col items-center gap-4">
              <p className="max-w-md text-sm text-pretty leading-relaxed text-muted-foreground">{c.body}</p>
              <p className="text-xs font-medium text-muted-foreground">
                {c.thisWeekLabel} <span className="text-foreground">{c.gameNames[gameType]}</span>
              </p>
              <motion.button
                type="button"
                onClick={startChallenge}
                whileHover={{ y: -1 }}
                whileTap={tapScale}
                transition={springTransition}
                className="shine-hover flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-sm focus-visible:outline-none"
              >
                {c.startCta}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
