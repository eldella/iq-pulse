import type { GameId } from "@/components/jugar/QuizPage";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatElapsed } from "@/lib/timing";

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
  showConfetti: boolean;
  statCards: PracticeStatCard[];
  footerLines: PracticeFooterLine[];
  ladder?: PracticeLadderStep[];
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

// A game whose "card" treatment needs a shape neither of these two kinds
// cover (e.g. a "longest streak reached" record instead of a numeric best)
// needs a new kind added here - ask Terminal 5 (owner of this file, see
// CLAUDE.md "Trabajo en Paralelo") rather than reimplementing the
// card/glow/confetti layout in QuizPage.tsx.
type CardConfig = ReactionMsCardConfig | AccuracyTierCardConfig;

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
  if (result.headline === "span" && result.span !== undefined) {
    return buildSpanView(result, t);
  }
  return buildPlainAccuracyView(result, t, elapsedMs);
}
