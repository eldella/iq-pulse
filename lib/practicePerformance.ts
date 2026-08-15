/**
 * Per-game "did you improve?" tracking for free practice runs - separate
 * from the real session/IQ data in Supabase, this is just a local best-
 * accuracy marker per gameId so the practice results screen can say
 * "beat your record" instead of restating an IQ estimate that free play
 * was never meant to carry (see QuizPage's isDailyRun branch).
 */

type PracticeRecord = { bestAccuracy: number };
type PracticeTimeRecord = { bestAvgResponseMs: number };
type PracticeSpanRecord = { bestSpan: number };

function storageKey(gameId: string): string {
  return `iqpulse-practice-${gameId}`;
}

function timeStorageKey(gameId: string): string {
  return `iqpulse-practice-time-${gameId}`;
}

function spanStorageKey(gameId: string): string {
  return `iqpulse-practice-span-${gameId}`;
}

function readBestAccuracy(gameId: string): number | null {
  try {
    const raw = window.localStorage.getItem(storageKey(gameId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeRecord;
    return typeof parsed.bestAccuracy === "number" ? parsed.bestAccuracy : null;
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

/** Compares this run's accuracy (0-1) against the stored best for this game, updates it if beaten. */
export function recordPracticeResult(
  gameId: string,
  accuracy: number
): { previousBest: number | null; improved: boolean } {
  const previousBest = readBestAccuracy(gameId);
  const improved = previousBest === null || accuracy > previousBest;
  if (improved) {
    window.localStorage.setItem(storageKey(gameId), JSON.stringify({ bestAccuracy: accuracy }));
  }
  return { previousBest, improved };
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

function readBestSpan(gameId: string): number | null {
  try {
    const raw = window.localStorage.getItem(spanStorageKey(gameId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeSpanRecord;
    return typeof parsed.bestSpan === "number" ? parsed.bestSpan : null;
  } catch {
    return null;
  }
}

/** Compares this run's max span reached (higher is better) against the stored best for this game, updates it if beaten. */
export function recordPracticeSpan(
  gameId: string,
  span: number
): { previousBest: number | null; improved: boolean } {
  const previousBest = readBestSpan(gameId);
  const improved = previousBest === null || span > previousBest;
  if (improved) {
    window.localStorage.setItem(spanStorageKey(gameId), JSON.stringify({ bestSpan: span }));
  }
  return { previousBest, improved };
}
