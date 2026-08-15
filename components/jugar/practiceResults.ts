import type { GameId } from "@/components/jugar/QuizPage";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { formatElapsed } from "@/lib/timing";

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

// Only one card kind exists today (reaction-time thresholds). A game whose
// "card" treatment needs a different shape (e.g. an accuracy-based tier, or
// a "longest streak reached" record instead of a numeric best) needs a new
// kind added here - ask Terminal 5 (owner of this file, see CLAUDE.md
// "Trabajo en Paralelo") rather than reimplementing the card/glow/confetti
// layout in QuizPage.tsx.
type CardConfig = ReactionMsCardConfig;

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
  return buildPlainAccuracyView(result, t, elapsedMs);
}
