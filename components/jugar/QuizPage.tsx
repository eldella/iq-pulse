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
import { StatCard } from "@/components/jugar/StatCard";
import { RecordConfetti } from "@/components/jugar/RecordConfetti";
import {
  buildPracticeResultsView,
  type PracticeResult,
  type PracticeResultTier,
  type SpanRunSummary,
  type WordReviewRunSummary,
} from "@/components/jugar/practiceResults";
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
import { now, formatElapsed, formatMs } from "@/lib/timing";
import {
  DAILY_TARGET_COUNT,
  getCurrentStreak,
  getTodayKey,
  markGameCompleted,
  useDailyTraining,
} from "@/lib/dailyTraining";
import { getAlias, getDeviceId } from "@/lib/deviceIdentity";
import { recordPracticeResult, recordPracticeReactionTime, recordPracticeSpan } from "@/lib/practicePerformance";
import { cn } from "@/lib/utils";

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
  Icon: typeof MapPin;
  Component: (props: {
    level: number;
    // spanSummary is only passed by games that run their own independent
    // level ladder (see the exception list in handleAnswer below); wordReview
    // is only passed by Ráfaga de Palabras, for its per-round miss detail.
    // Every other game leaves both undefined and QuizPage builds the
    // practice result from isCorrect/responseTimeMs as before.
    onAnswer: (
      isCorrect: boolean,
      responseTimeMs: number,
      spanSummary?: SpanRunSummary,
      wordReview?: WordReviewRunSummary
    ) => void;
  }) => React.ReactElement;
};

const GAMES: Record<GameId, GameDef> = {
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
const FULL_ASSESSMENT: readonly GameId[] = ["numberSequence", "digitSpan", "stroop"];

/**
 * Border/glow classes per PracticeResultTier - the only styling QuizPage
 * owns for the declarative results card (see components/jugar/practiceResults.ts).
 * "plain" is never actually read (that tier skips the card entirely) but is
 * listed so this stays a total mapping.
 */
const TIER_BORDER_CLASSES: Record<PracticeResultTier, string> = {
  record: "border-success shadow-success-lg",
  great: "border-success/50 shadow-success-md",
  good: "border-warn/50",
  neutral: "border-glass-border",
  plain: "",
};

type Phase = "idle" | GameId | "finished";

type DomainStats = { correct: number; answered: number };

const EMPTY_STATS: Record<Domain, DomainStats> = {
  reasoning: { correct: 0, answered: 0 },
  memory: { correct: 0, answered: 0 },
  speed: { correct: 0, answered: 0 },
};

function gameCopy(id: GameId, t: Dictionary) {
  return {
    pathfinder: { title: t.quiz.pathfinderTitle, description: t.quiz.pathfinderDescription },
    numberSequence: { title: t.quiz.reasoningTitle, description: t.quiz.reasoningDescription },
    digitSpan: { title: t.quiz.memoryTitle, description: t.quiz.memoryDescription },
    wordBurst: { title: t.quiz.wordBurstTitle, description: t.quiz.wordBurstDescription },
    spatialMemory: { title: t.quiz.spatialMemoryTitle, description: t.quiz.spatialMemoryDescription },
    wordTyping: { title: t.quiz.wordTypingTitle, description: t.quiz.wordTypingDescription },
    stroop: { title: t.quiz.speedTitle, description: t.quiz.speedDescription },
    quickCompare: { title: t.quiz.quickCompareTitle, description: t.quiz.quickCompareDescription },
    reactionCircle: { title: t.quiz.reactionCircleTitle, description: t.quiz.reactionCircleDescription },
  }[id];
}

function difficultyLabel(level: number, t: Dictionary) {
  return {
    easy: t.quiz.difficultyEasy,
    medium: t.quiz.difficultyMedium,
    hard: t.quiz.difficultyHard,
    extreme: t.quiz.difficultyExtreme,
  }[levelToBucket(level)];
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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [domainStats, setDomainStats] = useState<Record<Domain, DomainStats>>(EMPTY_STATS);
  const [result, setResult] = useState<{ iqEstimate: number; percentile: number; points?: number } | null>(
    null
  );
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
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
  // Highest consecutive-correct streak reached this run - reuses the same
  // streak the escalation ladder already tracks (see setStreak below), just
  // remembers its peak instead of resetting to 0 on a miss. Surfaced as
  // Palabra Rápida's "racha perfecta" stat card.
  const maxStreakRef = useRef(0);

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
      maxStreakRef.current = 0;
      setLevel(1);
      setStreak(0);
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

  // Space/Enter replays the same plan from the results screen - lets a
  // keyboard-driven session (someone timing rounds back to back) go again
  // without reaching for the mouse. Guarded to the "finished" phase only, so
  // it never hijacks Space/Enter while a game itself is in progress (some
  // games use those keys for their own answers).
  useEffect(() => {
    if (phase !== "finished") return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== " " && e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "BUTTON", "A"].includes(target.tagName)) return;
      e.preventDefault();
      handleStart(plan);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, plan]);


  function handleExitToMenu() {
    setPhase("idle");
    setSessionId(null);
  }

  async function handleAnswer(
    gameId: GameId,
    isCorrect: boolean,
    responseTimeMs: number,
    spanSummary?: SpanRunSummary,
    wordReview?: WordReviewRunSummary
  ) {
    if (!sessionId) return;
    const domain = GAMES[gameId].domain;

    setDomainStats((prev) => ({
      ...prev,
      [domain]: { correct: prev[domain].correct + (isCorrect ? 1 : 0), answered: prev[domain].answered + 1 },
    }));

    if (isCorrect) responseTimesRef.current.push(responseTimeMs);

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    maxStreakRef.current = Math.max(maxStreakRef.current, newStreak);
    // Reacción's content doesn't scale with level (see ReactionCircleGame's
    // top comment) and every round already draws its own fresh 1-5s delay,
    // so there's no real difficulty to escalate - pinned at 1x instead of
    // riding the same streak-driven multiplier the other games use.
    // Retención de Dígitos and Memoria Espacial run their own independent
    // level ladder (own clock/lives, see their components) instead of
    // being "one more question" in this engine's escalation, so the global
    // level/tier here would just be dead weight for them too.
    if (gameId !== "reactionCircle" && gameId !== "digitSpan" && gameId !== "spatialMemory") {
      setLevel((current) => nextLevel(current, isCorrect, newStreak));
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
      } else if (spanSummary) {
        const { previousBest, improved } = recordPracticeSpan(gameId, spanSummary.span);
        setPracticeResult({
          headline: "span",
          accuracy: spanSummary.accuracy,
          avgResponseMs: spanSummary.avgResponseMs,
          bestTapMs: null,
          previousBest,
          improved,
          span: spanSummary.span,
          spanUnitLabel: spanSummary.spanUnitLabel,
          spanNote: spanSummary.spanNote,
          extraStatCards: spanSummary.extraStatCards,
          ladder: spanSummary.ladder,
          roundLog: spanSummary.roundLog,
        });
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
        } else if (wordReview) {
          const { previousBest, improved } = recordPracticeResult(gameId, wordReview.accuracy);
          setPracticeResult({
            headline: "accuracy",
            accuracy: wordReview.accuracy,
            // Not applicable to a recall test the way it is for a
            // stimulus-response one - dropped in favor of the "tiempo"
            // stat tile below (confirmed in the brief).
            avgResponseMs: null,
            bestTapMs: null,
            previousBest,
            improved,
            fractionValue: wordReview.fractionValue,
            extraStatCards: [
              { emoji: "✅", value: `${wordReview.hits}`, label: t.quiz.wordBurstHitsLabel },
              { emoji: "⚠️", value: `${wordReview.falsePositives}`, label: t.quiz.wordBurstFalsePositivesLabel },
              { emoji: "⏱️", value: formatMs(wordReview.totalTimeMs), label: t.quiz.resultsTimeLabel },
            ],
            ladder: wordReview.ladder,
          });
        } else {
          const { previousBest, improved } = recordPracticeResult(gameId, accuracy);
          setPracticeResult({
            headline: "accuracy",
            accuracy,
            avgResponseMs,
            bestTapMs,
            previousBest,
            improved,
            fractionValue: `${finalCorrect}/${finalAnswered}`,
            extraStatCards:
              gameId === "wordTyping"
                ? [{ emoji: "🔥", value: `${maxStreakRef.current}`, label: t.quiz.wordTypingStreakLabel }]
                : undefined,
          });
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
          ? `${t.quiz.practiceReactionShareLead} ${practiceResult.avgResponseMs}ms ${t.quiz.practiceReactionShareTail}`
          : `IQ.Pulse — ${t.quiz.practiceAccuracyLabel}: ${Math.round(practiceResult.accuracy * 100)}%`
        : null;
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const activeGame = phase !== "idle" && phase !== "finished" ? GAMES[phase] : null;

  // Practice always runs a single game (plan.length === 1 outside the daily
  // run), so plan[0] is the game this practiceResult belongs to.
  const practiceResultsView = practiceResult ? buildPracticeResultsView(plan[0], practiceResult, t, elapsedMs) : null;

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
                className="text-lg font-bold text-foreground"
              >
                {difficultyLabel(level, t)}
              </motion.p>
            </AnimatePresence>
          </div>

          <activeGame.Component
            level={level}
            onAnswer={(isCorrect, ms, spanSummary, wordReview) =>
              handleAnswer(activeGame.id, isCorrect, ms, spanSummary, wordReview)
            }
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
            practiceResultsView &&
            (practiceResultsView.tier === "plain" ? (
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                  {practiceResultsView.headlineLabel}
                </p>
                <p className="tabular-nums text-6xl font-semibold tracking-tight text-foreground">
                  {practiceResultsView.headlineValue}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    practiceResultsView.badgeTone === "success" ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {practiceResultsView.badgeText}
                </p>
                {practiceResultsView.footerLines.map((line) => (
                  <p key={line.text} className={line.className}>
                    {line.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex w-full max-w-xs flex-col items-center gap-3">
                {/* Headline card - border/glow reflects how the run went:
                    gold-ish success glow for a "record" tier, a lighter
                    success tint for "great", a warn border for "good",
                    nothing special for "neutral" (see TIER_BORDER_CLASSES). */}
                <div
                  className={cn(
                    "relative flex w-full flex-col items-center gap-1 overflow-visible rounded-card border p-6 theme-transition",
                    TIER_BORDER_CLASSES[practiceResultsView.tier]
                  )}
                >
                  {practiceResultsView.showConfetti && !shouldReduceMotion && <RecordConfetti />}
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                    {practiceResultsView.headlineLabel}
                  </p>
                  <p className="tabular-nums text-6xl font-semibold tracking-tight text-foreground">
                    {practiceResultsView.headlineValue}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      practiceResultsView.badgeTone === "success" ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    {practiceResultsView.badgeText}
                  </p>
                  {practiceResultsView.subtext && (
                    <p className="text-xs text-muted-foreground">{practiceResultsView.subtext}</p>
                  )}
                </div>

                {practiceResultsView.statCards.length > 0 && (
                  <div className="grid w-full grid-cols-2 gap-2">
                    {practiceResultsView.statCards.map((card) => (
                      <StatCard key={card.label} {...card} />
                    ))}
                  </div>
                )}

                {practiceResultsView.ladder && practiceResultsView.ladder.length > 0 && (
                  <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
                    {practiceResultsView.ladder.map((step, index) => (
                      <span
                        key={`${step.label}-${index}`}
                        title={step.label}
                        aria-label={step.label}
                        className={cn(
                          "h-6 w-4 shrink-0 rounded-sm",
                          step.tone === "success" && "bg-success",
                          step.tone === "danger" && "bg-danger/70",
                          step.tone === "warn" && "border-2 border-dashed border-warn bg-transparent",
                          step.tone === "off" && "bg-surface-hover"
                        )}
                      />
                    ))}
                  </div>
                )}

                {practiceResultsView.footerLines.map((line) => (
                  <p key={line.text} className={line.className}>
                    {line.text}
                  </p>
                ))}

                {practiceResultsView.roundLog && practiceResultsView.roundLog.length > 0 && (
                  <details className="w-full text-left">
                    <summary className="cursor-pointer text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      {t.quiz.resultsRoundLogCta}
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1">
                      {practiceResultsView.roundLog.map((entry, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                        >
                          <span>{entry.label}</span>
                          <span className="tabular-nums text-foreground">{entry.value}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))
          )}

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
              <kbd className="rounded border border-accent-foreground/30 bg-accent-foreground/10 px-1.5 py-0.5 font-sans text-[10px] font-medium">
                {t.quiz.playAgainShortcutHint}
              </kbd>
            </motion.button>
          </div>

          <Link
            href={isLoggedIn ? "/perfil" : "/rendimiento"}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.quiz.viewProfileCta}
          </Link>

          <p className="max-w-sm text-[11px] text-muted-foreground/70">{t.quiz.resultsBody}</p>
        </motion.div>
      )}
    </main>
  );
}
