"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Check,
  CircleDot,
  Copy,
  Flame,
  Gauge,
  Grid3x3,
  Keyboard,
  ListOrdered,
  Loader2,
  MapPin,
  Play,
  Puzzle,
  Scale,
  Sparkles,
  Timer,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { fadeSlideUp, staggerContainer } from "@/components/landing/motionVariants";
import { GlassCard } from "@/components/GlassCard";
import { WeeklyChallengeCard } from "@/components/stats/WeeklyChallengeCard";
import { RadarChart } from "@/components/jugar/RadarChart";
import { PatternMatrixGame } from "@/components/jugar/games/PatternMatrixGame";
import { DigitSpanGame } from "@/components/jugar/games/DigitSpanGame";
import { StroopGame } from "@/components/jugar/games/StroopGame";
import { PathfinderGame } from "@/components/jugar/games/PathfinderGame";
import { WordBurstGame } from "@/components/jugar/games/WordBurstGame";
import { NumberSequenceGame } from "@/components/jugar/games/NumberSequenceGame";
import { SpatialMemoryGame } from "@/components/jugar/games/SpatialMemoryGame";
import { QuickCompareGame } from "@/components/jugar/games/QuickCompareGame";
import { ReactionCircleGame } from "@/components/jugar/games/ReactionCircleGame";
import { WordTypingGame } from "@/components/jugar/games/WordTypingGame";
import { startSession, recordAnswer, completeSession, upsertDailyResult } from "@/lib/supabase/quiz";
import { classifyIQ, levelToBucket, nextLevel, type Domain } from "@/lib/scoring";
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
import { recordPracticeResult, recordPracticeReactionTime } from "@/lib/practicePerformance";

/**
 * Each exercise (daily or free) now runs on a 30-second clock instead of a
 * fixed question count: keep generating new questions until time's up, then
 * let whichever question is in flight resolve naturally before moving on.
 * lib/scoring.ts's normalizeScore() already divides by answeredCount, so a
 * variable number of answered questions per run doesn't skew the score.
 */
const GAME_DURATION_MS = 30_000;
/** Hard cap regardless of remaining time, so rapid-fire guessing can't inflate answeredCount. */
const MAX_QUESTIONS_PER_GAME = 10;

export type GameId =
  | "matrix"
  | "digitSpan"
  | "stroop"
  | "pathfinder"
  | "wordBurst"
  | "numberSequence"
  | "spatialMemory"
  | "quickCompare"
  | "reactionCircle"
  | "wordTyping";

type GameDef = {
  id: GameId;
  domain: Domain;
  Icon: typeof Puzzle;
  Component: (props: {
    level: number;
    onAnswer: (isCorrect: boolean, responseTimeMs: number) => void;
  }) => React.ReactElement;
};

const GAMES: Record<GameId, GameDef> = {
  matrix: { id: "matrix", domain: "reasoning", Icon: Puzzle, Component: PatternMatrixGame },
  pathfinder: { id: "pathfinder", domain: "reasoning", Icon: MapPin, Component: PathfinderGame },
  numberSequence: { id: "numberSequence", domain: "reasoning", Icon: ListOrdered, Component: NumberSequenceGame },
  digitSpan: { id: "digitSpan", domain: "memory", Icon: BrainCircuit, Component: DigitSpanGame },
  wordBurst: { id: "wordBurst", domain: "memory", Icon: Sparkles, Component: WordBurstGame },
  spatialMemory: { id: "spatialMemory", domain: "memory", Icon: Grid3x3, Component: SpatialMemoryGame },
  wordTyping: { id: "wordTyping", domain: "memory", Icon: Keyboard, Component: WordTypingGame },
  stroop: { id: "stroop", domain: "speed", Icon: Gauge, Component: StroopGame },
  quickCompare: { id: "quickCompare", domain: "speed", Icon: Scale, Component: QuickCompareGame },
  reactionCircle: { id: "reactionCircle", domain: "speed", Icon: CircleDot, Component: ReactionCircleGame },
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
    numberSequence: { title: t.quiz.numberSequenceTitle, description: t.quiz.numberSequenceDescription },
    digitSpan: { title: t.quiz.memoryTitle, description: t.quiz.memoryDescription },
    wordBurst: { title: t.quiz.wordBurstTitle, description: t.quiz.wordBurstDescription },
    spatialMemory: { title: t.quiz.spatialMemoryTitle, description: t.quiz.spatialMemoryDescription },
    wordTyping: { title: t.quiz.wordTypingTitle, description: t.quiz.wordTypingDescription },
    stroop: { title: t.quiz.speedTitle, description: t.quiz.speedDescription },
    quickCompare: { title: t.quiz.quickCompareTitle, description: t.quiz.quickCompareDescription },
    reactionCircle: { title: t.quiz.reactionCircleTitle, description: t.quiz.reactionCircleDescription },
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
  const { streak: dailyStreak, completedCount: dailyCompletedCount } = useDailyTraining();

  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<readonly GameId[]>(FULL_ASSESSMENT);
  const [isDailyRun, setIsDailyRun] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [missStreak, setMissStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [domainStats, setDomainStats] = useState<Record<Domain, DomainStats>>(EMPTY_STATS);
  const [result, setResult] = useState<{ iqEstimate: number; percentile: number; points?: number } | null>(
    null
  );
  const [practiceResult, setPracticeResult] = useState<{
    // Reacción's "correct" answer is nearly always 100% (only an early tap
    // misses), so accuracy is a meaningless headline there - it leads with
    // its average reaction time instead. Every other practice game still
    // leads with accuracy, the metric that's actually being tested.
    headline: "accuracy" | "reactionTime";
    accuracy: number;
    avgResponseMs: number | null;
    // Fastest single correct tap this run - the average blurs together
    // with slower taps in the same session, so it's a confusing thing to
    // call a "personal best" (confirmed with the user after they hit a
    // fast single tap that the average then buried). previousBest/improved
    // below compare against this, not the average.
    bestTapMs: number | null;
    previousBest: number | null;
    improved: boolean;
  } | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [secondsLeftInGame, setSecondsLeftInGame] = useState(GAME_DURATION_MS / 1000);
  const startTimeRef = useRef(0);
  // Response times for correct answers in the current practice game - only
  // meaningful for a single-game run (practice always plays one game), reset
  // per handleStart, read once at completion to average into practiceResult.
  const responseTimesRef = useRef<number[]>([]);
  const gameStartRef = useRef(0);

  async function handleStart(chosenPlan: readonly GameId[], { daily = false }: { daily?: boolean } = {}) {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const id = await startSession();
      startTimeRef.current = now();
      gameStartRef.current = now();
      setSessionId(id);
      setPlan(chosenPlan);
      setIsDailyRun(daily);
      responseTimesRef.current = [];
      setLevel(1);
      setStreak(0);
      setMissStreak(0);
      setQuestionIndex(0);
      setDomainStats(EMPTY_STATS);
      setResult(null);
      setPracticeResult(null);
      setSecondsLeftInGame(GAME_DURATION_MS / 1000);
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

  // Ticks while a game is active. Keyed on `phase` (not questionIndex), so
  // it keeps running unbroken across the questions within one game and only
  // resets when gameStartRef itself is reset (new game, see handleStart /
  // handleAnswer).
  useEffect(() => {
    if (phase === "idle" || phase === "finished") return;
    const id = window.setInterval(() => {
      const remainingMs = Math.max(0, GAME_DURATION_MS - (now() - gameStartRef.current));
      setSecondsLeftInGame(Math.ceil(remainingMs / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [phase]);

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

    if (isCorrect) responseTimesRef.current.push(responseTimeMs);

    const newStreak = isCorrect ? streak + 1 : 0;
    const newMissStreak = isCorrect ? 0 : missStreak + 1;
    setStreak(newStreak);
    setMissStreak(newMissStreak);
    // Reacción's content doesn't scale with level (see ReactionCircleGame's
    // top comment) and every round already draws its own fresh 1-5s delay,
    // so there's no real difficulty to escalate - pinned at 1x instead of
    // riding the same streak-driven multiplier the other games use.
    if (gameId !== "reactionCircle") {
      setLevel((current) => nextLevel(current, isCorrect, newStreak, newMissStreak));
    }

    recordAnswer({ sessionId, domain, isCorrect, responseTimeMs, difficulty: levelToBucket(level) }).catch(() => {
      // Non-fatal: the run continues locally even if one write fails.
    });

    if (questionIndex + 1 < MAX_QUESTIONS_PER_GAME && now() - gameStartRef.current < GAME_DURATION_MS) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    if (isDailyRun) markGameCompleted(gameId);

    const currentGameIndex = plan.indexOf(gameId);
    setQuestionIndex(0);
    setStreak(0);
    setMissStreak(0);
    setLevel(1);

    if (currentGameIndex < plan.length - 1) {
      gameStartRef.current = now();
      setSecondsLeftInGame(GAME_DURATION_MS / 1000);
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
        const finalCorrect = domainStats[domain].correct + (isCorrect ? 1 : 0);
        const finalAnswered = domainStats[domain].answered + 1;
        const accuracy = finalAnswered > 0 ? finalCorrect / finalAnswered : 0;
        const times = responseTimesRef.current;
        const avgResponseMs =
          times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : null;
        const bestTapMs = times.length > 0 ? Math.min(...times) : null;

        if (gameId === "reactionCircle" && bestTapMs !== null) {
          const { previousBest, improved } = recordPracticeReactionTime(gameId, bestTapMs);
          setPracticeResult({ headline: "reactionTime", accuracy, avgResponseMs, bestTapMs, previousBest, improved });
        } else {
          const { previousBest, improved } = recordPracticeResult(gameId, accuracy);
          setPracticeResult({ headline: "accuracy", accuracy, avgResponseMs, bestTapMs, previousBest, improved });
        }
      }
    } catch {
      setError(t.quiz.resultError);
    }
    setPhase("finished");
  }

  function handleCopyResult() {
    const summary = result
      ? `IQ.Pulse — ${t.quiz.resultsIqLabel}: ${result.iqEstimate}, ${t.quiz.iqClassifications[classifyIQ(result.iqEstimate)]} (${t.quiz.resultsBetterThanLabel} ${result.percentile}% ${t.quiz.resultsBetterThanSuffix})`
      : practiceResult
        ? practiceResult.headline === "reactionTime"
          ? `IQ.Pulse — ${t.quiz.practiceAvgResponseLabel}: ${practiceResult.avgResponseMs} ms (${t.quiz.practiceBestTapLabel}: ${practiceResult.bestTapMs} ms)`
          : `IQ.Pulse — ${t.quiz.practiceAccuracyLabel}: ${Math.round(practiceResult.accuracy * 100)}%`
        : null;
    if (!summary) return;
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

          <WeeklyChallengeCard />

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
          // sessionId (fresh per handleStart) is load-bearing here, not just
          // decorative - replaying the exact same game (phase="reactionCircle",
          // questionIndex=0 again) would otherwise produce the same key as
          // the previous run, and React reuses the existing component
          // instance instead of remounting it. For most games that's
          // harmless, but ReactionCircleGame keeps its "go" timestamp in a
          // ref that only resets via mount - reused instances kept measuring
          // against a stale timestamp from the earlier run, producing
          // reaction-time readings inflated by however old that timestamp was.
          key={`${sessionId}-${phase}-${questionIndex}`}
          // Reacción is a bare stimulus-response timer, not a "screen" -
          // every question remounts this (see the key above), and an
          // entrance fade/slide replaying every 1-6 seconds fights the
          // instant-on read the game is trying to measure. Skip motion for
          // it entirely rather than just reduced-motion users (confirmed
          // with the user).
          initial={shouldReduceMotion || activeGame.id === "reactionCircle" ? false : { opacity: 0, y: 12 }}
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
            <p
              role="timer"
              aria-label={`${t.quiz.timeRemainingLabel}: ${secondsLeftInGame}s`}
              className="flex items-center gap-1.5 tabular-nums text-xs text-muted-foreground"
            >
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              {secondsLeftInGame}s
            </p>
          </div>

          <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full bg-accent transition-[width] duration-200 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (secondsLeftInGame / (GAME_DURATION_MS / 1000)) * 100))}%` }}
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {gameCopy(activeGame.id, t).title}
            </p>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={level}
                initial={shouldReduceMotion || activeGame.id === "reactionCircle" ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
                className="tabular-nums text-lg font-bold text-foreground"
              >
                {level}x
              </motion.p>
            </AnimatePresence>
          </div>

          <activeGame.Component
            level={level}
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

          {isDailyRun ? (
            <>
              {result && (
                <div className="flex flex-col items-center gap-1">
                  <p className="tabular-nums text-6xl font-semibold tracking-tight text-foreground">
                    {result.iqEstimate}
                  </p>
                  <p className="text-sm font-semibold text-accent">
                    {t.quiz.iqClassifications[classifyIQ(result.iqEstimate)]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.quiz.resultsIqLabel} · {t.quiz.resultsBetterThanLabel} {result.percentile}%{" "}
                    {t.quiz.resultsBetterThanSuffix}
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
            </>
          ) : (
            practiceResult && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                  {practiceResult.headline === "reactionTime"
                    ? t.quiz.practiceAvgResponseLabel
                    : t.quiz.practiceAccuracyLabel}
                </p>
                <p className="tabular-nums text-6xl font-semibold tracking-tight text-foreground">
                  {practiceResult.headline === "reactionTime"
                    ? `${practiceResult.avgResponseMs} ms`
                    : `${Math.round(practiceResult.accuracy * 100)}%`}
                </p>
                {practiceResult.headline === "reactionTime" ? (
                  <>
                    {/* The average blurs a fast tap together with slower ones
                        in the same run, so the record it tracks/shows here is
                        the run's single fastest tap, not the average above
                        (confirmed with the user after that mismatch confused
                        them). */}
                    {practiceResult.bestTapMs !== null && (
                      <p className="tabular-nums text-sm text-muted-foreground">
                        {t.quiz.practiceBestTapLabel}: {practiceResult.bestTapMs} ms
                      </p>
                    )}
                    <p className="text-sm font-semibold text-success">
                      {practiceResult.previousBest === null
                        ? t.quiz.practiceFirstTimeLabel
                        : practiceResult.improved
                          ? t.quiz.practiceImprovedLabel
                          : `${t.quiz.practiceBestLabel} ${practiceResult.previousBest} ms`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-success">
                      {practiceResult.previousBest === null
                        ? t.quiz.practiceFirstTimeLabel
                        : practiceResult.improved
                          ? t.quiz.practiceImprovedLabel
                          : `${t.quiz.practiceBestLabel} ${Math.round(practiceResult.previousBest * 100)}%`}
                    </p>
                    {practiceResult.avgResponseMs !== null && (
                      <p className="tabular-nums text-sm text-muted-foreground">
                        {t.quiz.practiceAvgResponseLabel}: {practiceResult.avgResponseMs} ms
                      </p>
                    )}
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  {t.quiz.resultsTimeLabel}: {formatElapsed(elapsedMs)}
                </p>
              </div>
            )
          )}

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
