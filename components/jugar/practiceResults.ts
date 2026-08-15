import type { GameId } from "@/components/jugar/QuizPage";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatElapsed, formatMs } from "@/lib/timing";
import { getStroopCostMs } from "@/lib/stroopSession";

export type PracticeResult = {
  // Reacción's "correct" answer is nearly always 100% (only an early tap
  // misses), so accuracy is a meaningless headline there - it leads with
  // its average reaction time instead. "span" is for games that run their
  // own independent level ladder (Retención de Dígitos, Memoria Espacial)
  // and lead with how far the ladder was climbed, not accuracy or ms.
  // Every other practice game still leads with accuracy.
  headline: "accuracy" | "reactionTime" | "span";
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
  // span-only fields, filled in by the game itself via QuizPage's onAnswer
  // spanSummary param (see QuizPage.tsx) - the game owns its own localized
  // unit label/note/stat tiles instead of practiceResults.ts having to know
  // each span game's specific vocabulary ("dígitos" vs "casillas").
  span?: number;
  spanUnitLabel?: string;
  spanNote?: string;
  // "6/10" style value that overrides the default percentage headline -
  // Palabra Rápida and Ráfaga de Palabras both want a raw fraction, not %.
  fractionValue?: string;
  extraStatCards?: PracticeStatCard[];
  extraFooterLines?: PracticeFooterLine[];
  ladder?: PracticeLadderStep[];
  roundLog?: PracticeRoundLogEntry[];
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

/** One row of a collapsible "detail per round" disclosure on the results screen (Memoria Espacial's rounds table). */
export type PracticeRoundLogEntry = { label: string; value: string };

/**
 * What Ráfaga de Palabras hands QuizPage's onAnswer alongside the ordinary
 * isCorrect/ms pair - unlike DigitSpanGame/SpatialMemoryGame this game
 * still plays inside QuizPage's shared engine (one call per round, not
 * once for a whole run), but the round-scoped detail a miss needs to show
 * (which words were false positives, which were missed) only exists
 * inside the round's own component instance, not in anything QuizPage
 * tracks generically.
 */
export type WordReviewRunSummary = {
  fractionValue: string;
  accuracy: number;
  hits: number;
  falsePositives: number;
  totalTimeMs: number;
  ladder: PracticeLadderStep[];
};

/**
 * One chip in the results-screen strip - reused for two different things:
 * a game's own level ladder (Retención de Dígitos, Memoria Espacial) and
 * Ráfaga de Palabras' per-word review row. `tone` is why one shape covers
 * both: a ladder step only ever needs success/danger/off, but the word
 * review needs a 4th ("warn", for a missed word) - a plain boolean
 * couldn't express that, so every caller just states its own tone directly
 * instead of two parallel chip-strip systems existing side by side.
 */
export type PracticeLadderStep = { label: string; tone: "success" | "danger" | "warn" | "off" };

/**
 * What a self-contained game (own clock/lives/level ladder, see
 * DigitSpanGame/SpatialMemoryGame) hands QuizPage's onAnswer at the end of
 * its whole run, in place of the ordinary per-question isCorrect/ms pair -
 * everything QuizPage needs to build a "span" PracticeResult without having
 * to know the game's own vocabulary or ladder shape.
 */
export type SpanRunSummary = {
  span: number;
  spanUnitLabel: string;
  spanNote?: string;
  accuracy: number;
  avgResponseMs: number | null;
  extraStatCards: PracticeStatCard[];
  ladder: PracticeLadderStep[];
  roundLog?: PracticeRoundLogEntry[];
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
  ladder?: PracticeLadderStep[];
  roundLog?: PracticeRoundLogEntry[];
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

/** Accuracy-based glow tiers (great/good/neutral bands), for games that lead with a %/fraction instead of ms. */
type AccuracyTierCardConfig = {
  kind: "accuracyTier";
  greatMin: number;
  goodMin: number;
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

// A game whose "card" treatment needs a shape beyond these three kinds
// needs a new kind added here - ask Terminal 5 (owner of this file, see
// CLAUDE.md "Trabajo en Paralelo") rather than reimplementing the
// card/glow/confetti layout in QuizPage.tsx.
type CardConfig = ReactionMsCardConfig | AccuracyTierCardConfig | AccuracyCardConfig;

/** Games not listed here get the plain (no card) results layout. */
const CARD_CONFIG: Partial<Record<GameId, CardConfig>> = {
  wordTyping: { kind: "accuracyTier", greatMin: 0.9, goodMin: 0.6 },
  wordBurst: { kind: "accuracyTier", greatMin: 0.9, goodMin: 0.6 },
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

/**
 * Shared "span" results view for any game that runs its own independent
 * level ladder (Retención de Dígitos, Memoria Espacial) - the headline is
 * how far the ladder was climbed, not accuracy or a raw ms figure. Reused
 * as-is by both games (not a per-game CARD_CONFIG entry) since every piece
 * of game-specific vocabulary (unit label, note, stat tiles, ladder steps)
 * already arrives pre-built and localized on `result` itself.
 */
function buildSpanView(result: PracticeResult, t: Dictionary): PracticeResultsView {
  const span = result.span as number;
  const unitLabel = result.spanUnitLabel ?? "";
  const isNewRecord = result.improved && result.previousBest !== null;

  const badgeText =
    result.previousBest === null
      ? t.quiz.practiceFirstTimeLabel
      : isNewRecord
        ? `🎉 ${t.quiz.practiceNewRecordBadge}`
        : `${t.quiz.practiceBestLabel} ${result.previousBest} ${unitLabel}`;

  const footerLines: PracticeFooterLine[] = [];
  if (result.spanNote) {
    footerLines.push({ text: result.spanNote, className: "text-xs text-muted-foreground" });
  }

  return {
    headlineLabel: t.quiz.practiceSpanLabel,
    headlineValue: `${span}`,
    tier: isNewRecord ? "record" : "neutral",
    badgeText,
    badgeTone: isNewRecord ? "success" : "neutral",
    showConfetti: isNewRecord,
    statCards: result.extraStatCards ?? [],
    footerLines,
    ladder: result.ladder,
    roundLog: result.roundLog,
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

/** Accuracy/fraction headline with the same card/glow tiering as the ms-based games, for Palabra Rápida and Ráfaga de Palabras. */
function buildAccuracyTierView(config: AccuracyTierCardConfig, result: PracticeResult, t: Dictionary): PracticeResultsView {
  const isNewRecord = result.improved && result.previousBest !== null;
  const tier: PracticeResultTier = isNewRecord
    ? "record"
    : result.accuracy >= config.greatMin
      ? "great"
      : result.accuracy >= config.goodMin
        ? "good"
        : "neutral";

  const badgeText =
    result.previousBest === null
      ? t.quiz.practiceFirstTimeLabel
      : isNewRecord
        ? `🎉 ${t.quiz.practiceNewRecordBadge}`
        : `${t.quiz.practiceBestLabel} ${Math.round(result.previousBest * 100)}%`;

  return {
    headlineLabel: t.quiz.practiceAccuracyLabel,
    headlineValue: result.fractionValue ?? `${Math.round(result.accuracy * 100)}%`,
    tier,
    badgeText,
    badgeTone: isNewRecord ? "success" : "neutral",
    showConfetti: isNewRecord,
    statCards: result.extraStatCards ?? [],
    footerLines: result.extraFooterLines ?? [],
    ladder: result.ladder,
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
  if (config?.kind === "accuracyTier") {
    return buildAccuracyTierView(config, result, t);
  }
  if (config?.kind === "accuracy") {
    return buildAccuracyView(config, result, t);
  }
  if (result.headline === "span" && result.span !== undefined) {
    return buildSpanView(result, t);
  }
  return buildPlainAccuracyView(result, t, elapsedMs);
}
