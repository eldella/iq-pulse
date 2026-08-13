/**
 * Per-game "did you improve?" tracking for free practice runs - separate
 * from the real session/IQ data in Supabase, this is just a local best-
 * accuracy marker per gameId so the practice results screen can say
 * "beat your record" instead of restating an IQ estimate that free play
 * was never meant to carry (see QuizPage's isDailyRun branch).
 */

type PracticeRecord = { bestAccuracy: number };

function storageKey(gameId: string): string {
  return `iqpulse-practice-${gameId}`;
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
