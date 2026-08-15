import type { GameId } from "@/components/jugar/QuizPage";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatElapsed, formatMs } from "@/lib/timing";
import { getStroopCostMs } from "@/lib/stroopSession";

export type PracticeResult = {
  // Reacción's "correct" answer is nearly always 100% (only an early tap
  // misses), so accuracy is a meaningless headline there - it leads with
  // its average reaction time instead. Every other practice game still
  // leads with accuracy, the metric that's actually being tested.
  headline: "accuracy" | "reactionTime";
  accuracy: number;
  avgResponseMs: number | null;
  // Fastest single correct tap this run - the average blurs together with
  // slower taps in the same session, so it's a confusing thing to call a
  // "personal best" (confirmed with the user after they hit a fast single
  // tap that the average then buried). previousBest/improved compare
  // against this, not the average.
  bestTapMs: number | null;
  previousBest: number | null;
  improved: boolean;
  // Raw tally behind `accuracy` (e.g. 16/20) - null for reactionTime-headline
  // runs. Kept alongside the fraction because some cards (Comparación
  // rápida) show the count itself, not just the derived percentage.
  correctCount: number | null;
  totalCount: number | null;
  // Same raw tally, but for the previously stored record (see
  // recordPracticeResult in lib/practicePerformance.ts) - only meaningful
  // when previousBest !== null.
  previousBestCorrectCount: number | null;
  previousBestTotalCount: number | null;
  // Set from QuizPage's sessionId state - only read by games whose card
  // needs cross-trial scratch data keyed by session (currently just
  // Stroop's cost metric, see lib/stroopSession.ts).
  sessionId?: string | null;
  // Every correct answer's response time this run, in order - only
  // populated for reactionCircle today, to draw the per-round bars.
  responseTimes: number[];
};

/**
 * "plain" renders the practice results as stacked text with no card, glow,
 * confetti or stat grid - the default for any game without a CARD_CONFIG
 * entry below. The other tiers get the bordered/glowing card treatment,
 * from strongest (record) to weakest (neutral).
 */
export type PracticeResultTier = "record" | "great" | "good" | "neutral" | "plain";

export type PracticeStatCard = { emoji: string; value: string; label: string };

export type PracticeFooterLine = { text: string; className: string };

export type PracticeResultsView = {
  headlineLabel: string;
  headlineValue: string;
  tier: PracticeResultTier;
  badgeText: string;
  /**
   * "success" only for a genuine new record - the badge text itself was
   * always rendered green regardless (e.g. "Tu mejor marca: 268 ms" showing
   * up green under a run that didn't beat it), which reads as good news
   * when there wasn't any. "neutral" covers first-time, close-to-record,
   * and the plain "here's your best for reference" case.
   */
  badgeTone: "success" | "neutral";
  /**
   * Optional fixed line rendered inside the hero card, below the badge -
   * for a raw comparison count ("16 de 20 aciertos") that needs to sit
   * separately from the conditional record/close-to-record badge above it.
   * Undefined means no games rendered card needs a second line here yet.
   */
  subtext?: string;
  showConfetti: boolean;
  statCards: PracticeStatCard[];
  footerLines: PracticeFooterLine[];
  // One bar per tap this run, in order, for a chart below the stat cards -
  // additive to the card system, doesn't replace anything in it. Undefined
  // means no game asked for this yet.
  tapBars?: { ms: number; isBest: boolean }[];
};

/**
 * Rough bands for coloring Reacción's results card - grounded in published
 * simple-visual-reaction-time norms (typical adult range is ~200-300ms), not
 * arbitrary. Below FAST is a genuinely quick result; above NORMAL isn't
 * flagged as "bad", it just doesn't get the extra glow.
 */
const REACTION_FAST_MS = 250;
const REACTION_NORMAL_MS = 400;
/** How close (ms) a non-improving best tap has to be to the record to still get an encouraging "close!" nudge. */
const REACTION_CLOSE_TO_RECORD_MS = 20;

type ReactionMsCardConfig = {
  kind: "reactionMs";
  fastMs: number;
  normalMs: number;
  closeToRecordMs: number;
  recordEmoji: string;
  bestEmoji: string;
};

/**
 * Accuracy-tier thresholds for Stroop / Comparación rápida - unlike
 * Reacción, precision *is* the thing being tested here, so it's not
 * optional the way avgResponseMs is: it always drives the headline and tier.
 */
const ACCURACY_GREAT = 0.9;
const ACCURACY_GOOD = 0.75;
/** How close (fraction, e.g. 0.05 = 5 points) a non-improving run has to be to the record to still get an encouraging "close!" nudge. */
const ACCURACY_CLOSE_TO_RECORD = 0.05;

type AccuracyCardConfig = {
  kind: "accuracy";
  greatThreshold: number;
  goodThreshold: number;
  closeToRecordFraction: number;
  recordEmoji: string;
  speedEmoji: string;
  // "precision" swaps the headline for practicePrecisionLabel ("Precisión"/
  // "Accuracy") instead of the generic practiceAccuracyLabel ("Rendimiento"/
  // "Performance") - Comparación rápida's spec asks for that specific word,
  // Stroop keeps the generic one (omit this field).
  headlineLabelKey?: "precision";
  // Adds a fixed "16 de 20 aciertos (Tu mejor marca: 90%)" line inside the
  // card, below the badge - needs correctCount/totalCount on the run.
  showRawCountSubtext?: boolean;
  // Renders the record stat card as a raw fraction ("18/20") instead of a
  // percentage - legible without translation. Needs correctCount/totalCount
  // tracked both for this run and (via previousBestCorrectCount/
  // previousBestTotalCount) for the stored record.
  recordAsRawFraction?: boolean;
  // Adds a 3rd stat card with the live Stroop-cost metric (mean incongruent
  // RT minus mean congruent RT, see lib/stroopSession.ts) - "-" until at
  // least one correct answer of each type exists this run.
  showStroopCost?: boolean;
};

// A game whose "card" treatment needs a shape beyond these two kinds (e.g. a
// "longest streak reached" record instead of a numeric best) needs a new
// kind added here - ask Terminal 5 (owner of this file, see CLAUDE.md
// "Trabajo en Paralelo") rather than reimplementing the card/glow/confetti
// layout in QuizPage.tsx.
type CardConfig = ReactionMsCardConfig | AccuracyCardConfig;

/** Games not listed here get the plain (no card) results layout. */
const CARD_CONFIG: Partial<Record<GameId, CardConfig>> = {
  reactionCircle: {
    kind: "reactionMs",
    fastMs: REACTION_FAST_MS,
    normalMs: REACTION_NORMAL_MS,
    closeToRecordMs: REACTION_CLOSE_TO_RECORD_MS,
    recordEmoji: "🏆",
    bestEmoji: "⚡",
  },
  stroop: {
    kind: "accuracy",
    greatThreshold: ACCURACY_GREAT,
    goodThreshold: ACCURACY_GOOD,
    closeToRecordFraction: ACCURACY_CLOSE_TO_RECORD,
    recordEmoji: "🎯",
    speedEmoji: "⚡",
    showStroopCost: true,
  },
  quickCompare: {
    kind: "accuracy",
    greatThreshold: ACCURACY_GREAT,
    goodThreshold: ACCURACY_GOOD,
    closeToRecordFraction: ACCURACY_CLOSE_TO_RECORD,
    recordEmoji: "🎯",
    speedEmoji: "⚡",
    headlineLabelKey: "precision",
    showRawCountSubtext: true,
    recordAsRawFraction: true,
  },
};

function buildReactionMsView(config: ReactionMsCardConfig, result: PracticeResult, t: Dictionary): PracticeResultsView {
  // Guaranteed non-null whenever headline is "reactionTime" - QuizPage only
  // sets that headline once at least one correct tap produced a response
  // time (see handleAnswer's `bestTapMs !== null` guard).
  const avgResponseMs = result.avgResponseMs as number;
  const bestTapMs = result.bestTapMs as number;

  const isNewRecord = result.improved && result.previousBest !== null;
  const isCloseToRecord =
    !isNewRecord && result.previousBest !== null && bestTapMs - result.previousBest <= config.closeToRecordMs;
  const recordMs = result.previousBest === null || isNewRecord ? bestTapMs : result.previousBest;

  const tier: PracticeResultTier = isNewRecord
    ? "record"
    : avgResponseMs < config.fastMs
      ? "great"
      : avgResponseMs < config.normalMs
        ? "good"
        : "neutral";

  const badgeText =
    result.previousBest === null
      ? t.quiz.practiceFirstTimeLabel
      : isNewRecord
        ? `🎉 ${t.quiz.practiceNewRecordBadge}`
        : isCloseToRecord
          ? t.quiz.practiceCloseToRecordLabel
          : `${t.quiz.practiceBestLabel} ${result.previousBest} ms`;

  return {
    headlineLabel: t.quiz.practiceAvgResponseLabel,
    headlineValue: `${avgResponseMs} ms`,
    tier,
    badgeText,
    badgeTone: isNewRecord ? "success" : "neutral",
    showConfetti: isNewRecord,
    statCards: [
      { emoji: config.recordEmoji, value: `${recordMs} ms`, label: t.quiz.practiceRecordLabel },
      { emoji: config.bestEmoji, value: `${bestTapMs} ms`, label: t.quiz.practiceBestTapLabel },
    ],
    // No "total time" card here on purpose: Reacción's rounds take long
    // enough (1-5s wait each) that the 30s clock almost always runs out
    // before the 10-question cap does, so that stat was reading ~30s on
    // effectively every run - not useful information (confirmed with the
    // user).
    footerLines: [],
    tapBars: result.responseTimes.map((ms) => ({ ms, isBest: ms === bestTapMs })),
  };
}

function buildAccuracyView(config: AccuracyCardConfig, result: PracticeResult, t: Dictionary): PracticeResultsView {
  const { accuracy, previousBest } = result;

  const isNewRecord = result.improved && previousBest !== null;
  const isCloseToRecord = !isNewRecord && previousBest !== null && previousBest - accuracy <= config.closeToRecordFraction;
  const recordAccuracy = previousBest === null || isNewRecord ? accuracy : previousBest;

  const tier: PracticeResultTier = isNewRecord
    ? "record"
    : accuracy >= config.greatThreshold
      ? "great"
      : accuracy >= config.goodThreshold
        ? "good"
        : "neutral";

  const badgeText =
    previousBest === null
      ? t.quiz.practiceFirstTimeLabel
      : isNewRecord
        ? `🎉 ${t.quiz.practiceNewRecordBadge}`
        : isCloseToRecord
          ? t.quiz.practiceCloseToRecordLabel
          : `${t.quiz.practiceBestLabel} ${Math.round(previousBest * 100)}%`;

  const isRecordSourceCurrentRun = isNewRecord || previousBest === null;
  const statCards: PracticeStatCard[] = [];
  if (config.recordAsRawFraction && result.correctCount !== null && result.totalCount !== null) {
    const recordCorrect = isRecordSourceCurrentRun ? result.correctCount : result.previousBestCorrectCount;
    const recordTotal = isRecordSourceCurrentRun ? result.totalCount : result.previousBestTotalCount;
    if (recordCorrect !== null && recordTotal !== null) {
      statCards.push({ emoji: config.recordEmoji, value: `${recordCorrect}/${recordTotal}`, label: t.quiz.practiceRecordLabel });
    }
  }
  if (statCards.length === 0) {
    statCards.push({ emoji: config.recordEmoji, value: `${Math.round(recordAccuracy * 100)}%`, label: t.quiz.practiceRecordLabel });
  }
  if (result.avgResponseMs !== null) {
    statCards.push({ emoji: config.speedEmoji, value: formatMs(result.avgResponseMs), label: t.quiz.practiceAvgResponseLabel });
  }
  if (config.showStroopCost) {
    const costMs = getStroopCostMs(result.sessionId ?? null);
    statCards.push({
      emoji: "⇄",
      value: costMs === null ? "-" : `${costMs >= 0 ? "+" : ""}${costMs} ms`,
      label: t.quiz.practiceStroopCostLabel,
    });
  }

  let subtext: string | undefined;
  if (config.showRawCountSubtext && result.correctCount !== null && result.totalCount !== null) {
    const countText = `${result.correctCount} ${t.quiz.practiceRawCountConnector} ${result.totalCount} ${t.quiz.practiceRawCountSuffix}`;
    subtext = previousBest !== null ? `${countText} (${t.quiz.practiceBestLabel} ${Math.round(previousBest * 100)}%)` : countText;
  }

  return {
    headlineLabel: config.headlineLabelKey === "precision" ? t.quiz.practicePrecisionLabel : t.quiz.practiceAccuracyLabel,
    headlineValue: `${Math.round(accuracy * 100)}%`,
    tier,
    badgeText,
    badgeTone: isNewRecord ? "success" : "neutral",
    subtext,
    showConfetti: isNewRecord,
    statCards,
    footerLines: [],
  };
}

function buildPlainAccuracyView(result: PracticeResult, t: Dictionary, elapsedMs: number): PracticeResultsView {
  const badgeText =
    result.previousBest === null
      ? t.quiz.practiceFirstTimeLabel
      : result.improved
        ? t.quiz.practiceImprovedLabel
        : `${t.quiz.practiceBestLabel} ${Math.round(result.previousBest * 100)}%`;

  const footerLines: PracticeFooterLine[] = [];
  if (result.avgResponseMs !== null) {
    footerLines.push({
      text: `${t.quiz.practiceAvgResponseLabel}: ${result.avgResponseMs} ms`,
      className: "tabular-nums text-sm text-muted-foreground",
    });
  }
  footerLines.push({
    text: `${t.quiz.resultsTimeLabel}: ${formatElapsed(elapsedMs)}`,
    className: "text-xs text-muted-foreground",
  });

  return {
    headlineLabel: t.quiz.practiceAccuracyLabel,
    headlineValue: `${Math.round(result.accuracy * 100)}%`,
    tier: "plain",
    badgeText,
    badgeTone: result.previousBest !== null && result.improved ? "success" : "neutral",
    showConfetti: false,
    statCards: [],
    footerLines,
  };
}

/** Reads `gameId`'s declared CARD_CONFIG (if any) and builds the view model QuizPage's results screen renders. */
export function buildPracticeResultsView(
  gameId: GameId,
  result: PracticeResult,
  t: Dictionary,
  elapsedMs: number
): PracticeResultsView {
  const config = CARD_CONFIG[gameId];
  if (config?.kind === "reactionMs" && result.avgResponseMs !== null && result.bestTapMs !== null) {
    return buildReactionMsView(config, result, t);
  }
  if (config?.kind === "accuracy") {
    return buildAccuracyView(config, result, t);
  }
  return buildPlainAccuracyView(result, t, elapsedMs);
}
