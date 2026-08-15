/**
 * Per-game "did you improve?" tracking for free practice runs - separate
 * from the real session/IQ data in Supabase, this is just a local best-
 * accuracy marker per gameId so the practice results screen can say
 * "beat your record" instead of restating an IQ estimate that free play
 * was never meant to carry (see QuizPage's isDailyRun branch).
 */

type PracticeRecord = { bestAccuracy: number; bestCorrectCount?: number; bestTotalCount?: number };
type PracticeTimeRecord = { bestAvgResponseMs: number };

function storageKey(gameId: string): string {
  return `iqpulse-practice-${gameId}`;
}

function timeStorageKey(gameId: string): string {
  return `iqpulse-practice-time-${gameId}`;
}

function readBestRecord(gameId: string): PracticeRecord | null {
  try {
    const raw = window.localStorage.getItem(storageKey(gameId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeRecord;
    return typeof parsed.bestAccuracy === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function readBestAvgResponseMs(gameId: string): number | null {
  try {
    const raw = window.localStorage.getItem(timeStorageKey(gameId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeTimeRecord;
    return typeof parsed.bestAvgResponseMs === "number" ? parsed.bestAvgResponseMs : null;
  } catch {
    return null;
  }
}

/**
 * Compares this run's accuracy (0-1) against the stored best for this game, updates it if beaten.
 * correctCount/totalCount are optional - only games that show a raw-fraction record (e.g. Comparación
 * rápida's "18/20") need to pass them; they're persisted alongside bestAccuracy when the record is beaten,
 * and echoed back (previousBestCorrectCount/previousBestTotalCount) so the record stat card can render the
 * historical fraction, not just this run's.
 */
export function recordPracticeResult(
  gameId: string,
  accuracy: number,
  correctCount?: number,
  totalCount?: number
): {
  previousBest: number | null;
  improved: boolean;
  previousBestCorrectCount: number | null;
  previousBestTotalCount: number | null;
} {
  const previousRecord = readBestRecord(gameId);
  const previousBest = previousRecord?.bestAccuracy ?? null;
  const improved = previousBest === null || accuracy > previousBest;
  if (improved) {
    window.localStorage.setItem(
      storageKey(gameId),
      JSON.stringify({ bestAccuracy: accuracy, bestCorrectCount: correctCount, bestTotalCount: totalCount })
    );
  }
  return {
    previousBest,
    improved,
    previousBestCorrectCount: previousRecord?.bestCorrectCount ?? null,
    previousBestTotalCount: previousRecord?.bestTotalCount ?? null,
  };
}

/** Compares this run's average response time (ms, lower is better) against the stored best for this game, updates it if beaten. */
export function recordPracticeReactionTime(
  gameId: string,
  avgResponseMs: number
): { previousBest: number | null; improved: boolean } {
  const previousBest = readBestAvgResponseMs(gameId);
  const improved = previousBest === null || avgResponseMs < previousBest;
  if (improved) {
    window.localStorage.setItem(timeStorageKey(gameId), JSON.stringify({ bestAvgResponseMs: avgResponseMs }));
  }
  return { previousBest, improved };
}
