"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Check, Copy, Flame, Gauge, Loader2, MapPin, Play, Puzzle, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fadeSlideUp, staggerContainer } from "@/components/landing/motionVariants";
import { GlassCard } from "@/components/GlassCard";
import { RadarChart } from "@/components/jugar/RadarChart";
import { PatternMatrixGame } from "@/components/jugar/games/PatternMatrixGame";
import { DigitSpanGame } from "@/components/jugar/games/DigitSpanGame";
import { StroopGame } from "@/components/jugar/games/StroopGame";
import { PathfinderGame } from "@/components/jugar/games/PathfinderGame";
import { WordBurstGame } from "@/components/jugar/games/WordBurstGame";
import { startSession, recordAnswer, completeSession, upsertDailyResult } from "@/lib/supabase/quiz";
import { nextDifficulty, type Difficulty, type Domain } from "@/lib/scoring";
import { springTransition, tapScale } from "@/lib/motion";
import { now } from "@/lib/timing";
import {
  DAILY_TARGET_COUNT,
  getCurrentStreak,
  getTodayKey,
  markGameCompleted,
  useDailyTraining,
} from "@/lib/dailyTraining";
import { getAlias, getDeviceId } from "@/lib/deviceIdentity";

const QUESTIONS_PER_GAME = 4;

export type GameId = "matrix" | "digitSpan" | "stroop" | "pathfinder" | "wordBurst";

type GameDef = {
  id: GameId;
  domain: Domain;
  Icon: typeof Puzzle;
  Component: (props: {
    difficulty: Difficulty;
    onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
  }) => React.ReactElement;
};

const GAMES: Record<GameId, GameDef> = {
  matrix: { id: "matrix", domain: "reasoning", Icon: Puzzle, Component: PatternMatrixGame },
  pathfinder: { id: "pathfinder", domain: "reasoning", Icon: MapPin, Component: PathfinderGame },
  digitSpan: { id: "digitSpan", domain: "memory", Icon: BrainCircuit, Component: DigitSpanGame },
  wordBurst: { id: "wordBurst", domain: "memory", Icon: Sparkles, Component: WordBurstGame },
  stroop: { id: "stroop", domain: "speed", Icon: Gauge, Component: StroopGame },
};

// The default "full assessment" - one game per domain. Pathfinder is a
// second reasoning-domain game, selectable on its own but not part of the
// default 3-game sequence, so that sequence's meaning stays stable.
const FULL_ASSESSMENT: readonly GameId[] = ["matrix", "digitSpan", "stroop"];

type Phase = "idle" | GameId | "finished";

type DomainStats = { correct: number; answered: number };

const EMPTY_STATS: Record<Domain, DomainStats> = {
  reasoning: { correct: 0, answered: 0 },
  memory: { correct: 0, answered: 0 },
  speed: { correct: 0, answered: 0 },
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function gameCopy(id: GameId, t: Dictionary) {
  return {
    matrix: { title: t.quiz.reasoningTitle, description: t.quiz.reasoningDescription },
    pathfinder: { title: t.quiz.pathfinderTitle, description: t.quiz.pathfinderDescription },
    digitSpan: { title: t.quiz.memoryTitle, description: t.quiz.memoryDescription },
    wordBurst: { title: t.quiz.wordBurstTitle, description: t.quiz.wordBurstDescription },
    stroop: { title: t.quiz.speedTitle, description: t.quiz.speedDescription },
  }[id];
}

/**
 * Core game engine: idle (pick one game, or the full 3-domain assessment)
 * -> sequential rounds through `plan` -> finished. Free play lets people
 * choose what to play; only the (separate, not-yet-built) Daily Challenge
 * is meant to be a fixed, no-choice sequence.
 */
export function QuizPage({ initialGameId }: { initialGameId?: GameId } = {}) {
  const { t, lang } = useLanguage();
  const { isLoggedIn } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const { streak: dailyStreak, completedCount: dailyCompletedCount, completedIds: dailyCompletedIds } = useDailyTraining();

  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<readonly GameId[]>(FULL_ASSESSMENT);
  const [isDailyRun, setIsDailyRun] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [streak, setStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [domainStats, setDomainStats] = useState<Record<Domain, DomainStats>>(EMPTY_STATS);
  const [result, setResult] = useState<{ iqEstimate: number; percentile: number; points?: number } | null>(
    null
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const startTimeRef = useRef(0);

  async function handleStart(chosenPlan: readonly GameId[], { daily = false }: { daily?: boolean } = {}) {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const id = await startSession();
      startTimeRef.current = now();
      setSessionId(id);
      setPlan(chosenPlan);
      setIsDailyRun(daily);
      setDifficulty("medium");
      setStreak(0);
      setQuestionIndex(0);
      setDomainStats(EMPTY_STATS);
      setResult(null);
      setPhase(chosenPlan[0]);
    } catch {
      setError(t.quiz.sessionStartError);
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!initialGameId) return;
    const timer = setTimeout(() => handleStart([initialGameId]), 0);
    return () => clearTimeout(timer);
    // Only meant to fire once, on mount, for deep-linked single-game plays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExitToMenu() {
    setPhase("idle");
    setSessionId(null);
  }

  async function handleAnswer(gameId: GameId, isCorrect: boolean, responseTimeMs: number) {
    if (!sessionId) return;
    const domain = GAMES[gameId].domain;

    setDomainStats((prev) => ({
      ...prev,
      [domain]: { correct: prev[domain].correct + (isCorrect ? 1 : 0), answered: prev[domain].answered + 1 },
    }));

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    setDifficulty((current) => nextDifficulty(current, isCorrect, newStreak));

    recordAnswer({ sessionId, domain, isCorrect, responseTimeMs, difficulty }).catch(() => {
      // Non-fatal: the run continues locally even if one write fails.
    });

    const nextIndex = questionIndex + 1;
    if (nextIndex < QUESTIONS_PER_GAME) {
      setQuestionIndex(nextIndex);
      return;
    }

    if (isDailyRun) markGameCompleted(gameId);

    const currentGameIndex = plan.indexOf(gameId);
    setQuestionIndex(0);
    setStreak(0);
    setDifficulty("medium");

    if (currentGameIndex < plan.length - 1) {
      setPhase(plan[currentGameIndex + 1]);
      return;
    }

    setElapsedMs(Math.round(now() - startTimeRef.current));

    try {
      const finalResult = await completeSession(sessionId);

      if (isDailyRun) {
        const points = Math.round(finalResult.normalized * 1000);
        setResult({ ...finalResult, points });
        // Non-fatal, matching recordAnswer above: the results screen and
        // local streak/progress are already correct even if this write
        // fails, only the (separate, not-yet-shipped) ranking display
        // would miss today's entry.
        upsertDailyResult({
          deviceId: getDeviceId(),
          alias: getAlias(),
          challengeDate: getTodayKey(),
          points,
          streak: getCurrentStreak(),
          sessionId,
        }).catch(() => {});
      } else {
        setResult(finalResult);
      }
    } catch {
      setError(t.quiz.resultError);
    }
    setPhase("finished");
  }

  function handleCopyResult() {
    if (!result) return;
    const summary = `IQ.Pulse — ${t.quiz.resultsIqLabel}: ${result.iqEstimate} (${t.quiz.resultsPercentileLabel} ${result.percentile})`;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const activeGame = phase !== "idle" && phase !== "finished" ? GAMES[phase] : null;
  const todayLabel = new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-4 py-16 sm:px-6">
      {phase === "idle" && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="flex w-full max-w-lg flex-col items-center gap-4">
            <div className="flex w-full items-start justify-between gap-4">
              <div className="flex flex-col items-start text-left">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {t.quiz.dailyHeading}
                </h1>
                <p className="text-sm capitalize text-muted-foreground">{todayLabel}</p>
              </div>
              <div
                role="status"
                aria-label={`${dailyStreak} ${t.quiz.streakDaysLabel}`}
                className={`theme-transition flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-xl ${
                  dailyStreak > 0 ? "border-glass-border bg-accent/10 shadow-accent-sm" : "border-glass-border bg-glass"
                }`}
              >
                <motion.span
                  animate={!shouldReduceMotion && dailyStreak > 0 ? { scale: [1, 1.18, 1] } : undefined}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Flame
                    className={`h-5 w-5 ${dailyStreak > 0 ? "text-accent" : "text-muted-foreground"}`}
                    aria-hidden="true"
                  />
                </motion.span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={dailyStreak}
                    initial={shouldReduceMotion ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={springTransition}
                    className="tabular-nums text-base font-bold text-foreground"
                  >
                    {dailyStreak}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {error && (
              <p role="status" aria-live="polite" className="text-sm text-danger">
                {error}
              </p>
            )}

            <p className="tabular-nums text-sm text-muted-foreground">
              {dailyCompletedCount >= DAILY_TARGET_COUNT
                ? t.quiz.dailyDoneToday
                : `${dailyCompletedCount}/${DAILY_TARGET_COUNT} ${t.quiz.dailyProgressLabel}`}
            </p>

            <motion.button
              type="button"
              disabled={starting}
              onClick={() => handleStart(FULL_ASSESSMENT, { daily: true })}
              whileHover={{ y: -2 }}
              whileTap={tapScale}
              transition={springTransition}
              className="shine-hover inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-accent-md focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
            >
              {starting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-5 w-5" aria-hidden="true" />
              )}
              {t.quiz.startDailyCta}
            </motion.button>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {t.quiz.freePracticeHeading}
            </h2>
            <p className="max-w-sm text-xs text-muted-foreground">{t.quiz.freePracticeSubhead}</p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {(Object.keys(GAMES) as GameId[]).map((id) => {
              const { Icon } = GAMES[id];
              const { title, description } = gameCopy(id, t);
              const doneToday = FULL_ASSESSMENT.includes(id) && dailyCompletedIds.includes(id);
              return (
                <motion.div
                  key={id}
                  variants={fadeSlideUp}
                  whileHover={{ y: -3 }}
                  whileTap={tapScale}
                  transition={springTransition}
                >
                  <button
                    type="button"
                    disabled={starting}
                    onClick={() => handleStart([id])}
                    className="block h-full w-full text-left focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
                  >
                    <GlassCard
                      variant="plain"
                      className="relative flex h-full flex-col items-center gap-2 p-5 text-center shadow-sm transition-shadow hover:shadow-md"
                    >
                      {doneToday && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          {t.quiz.dailyCompletedTag}
                        </span>
                      )}
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                        {starting ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </GlassCard>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {activeGame && (
        <motion.div
          key={`${phase}-${questionIndex}`}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="flex w-full max-w-md flex-col items-center gap-6"
        >
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={handleExitToMenu}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
            >
              {t.quiz.exitToMenuCta}
            </button>
            <p className="tabular-nums text-xs text-muted-foreground">
              {t.quiz.progressLabel} {questionIndex + 1}/{QUESTIONS_PER_GAME}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {gameCopy(activeGame.id, t).title}
            </p>
          </div>

          <activeGame.Component
            difficulty={difficulty}
            onAnswer={(isCorrect, ms) => handleAnswer(activeGame.id, isCorrect, ms)}
          />
        </motion.div>
      )}

      {phase === "finished" && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.quiz.resultsHeading}
          </h1>

          {result && (
            <div className="flex flex-col items-center gap-1">
              <p className="tabular-nums text-6xl font-semibold tracking-tight text-foreground">
                {result.iqEstimate}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.quiz.resultsIqLabel} · {t.quiz.resultsPercentileLabel} {result.percentile}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.quiz.resultsTimeLabel}: {formatElapsed(elapsedMs)}
              </p>
              {result.points !== undefined && (
                <p className="tabular-nums text-sm font-semibold text-accent">
                  {t.quiz.resultsPointsLabel}: {result.points}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {t.quiz.resultsRadarLabel}
            </p>
            <RadarChart
              reasoning={Math.round((domainStats.reasoning.correct / Math.max(1, domainStats.reasoning.answered)) * 100)}
              memory={Math.round((domainStats.memory.correct / Math.max(1, domainStats.memory.answered)) * 100)}
              speed={Math.round((domainStats.speed.correct / Math.max(1, domainStats.speed.answered)) * 100)}
              labels={[t.quiz.reasoningTitle, t.quiz.memoryTitle, t.quiz.speedTitle]}
            />
          </div>

          <p className="max-w-sm text-xs text-muted-foreground">{t.quiz.resultsBody}</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={handleCopyResult}
              whileHover={{ y: -1 }}
              whileTap={tapScale}
              transition={springTransition}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-glass-border bg-glass px-5 text-sm text-muted-foreground backdrop-blur-xl hover:text-foreground focus-visible:outline-none"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? t.quiz.copiedLabel : t.quiz.copyResultCta}
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleStart(plan)}
              whileHover={{ y: -1 }}
              whileTap={tapScale}
              transition={springTransition}
              className="shine-hover inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-accent-md focus-visible:outline-none"
            >
              {t.quiz.playAgainCta}
            </motion.button>
          </div>

          <Link
            href={isLoggedIn ? "/perfil" : "/rendimiento"}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.quiz.viewProfileCta}
          </Link>
        </motion.div>
      )}
    </main>
  );
}
