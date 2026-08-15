/**
 * Per-run scratch state for Stroop - StroopGame.tsx remounts on every trial
 * (see the `key` comment on the active-game wrapper in QuizPage.tsx), so the
 * fixed button order can't live in component state: it needs to survive
 * across those remounts for exactly one run, then reset for the next.
 * sessionId (passed down from QuizPage, fresh per handleStart) is the only
 * thing stable across a run's remounts but distinct across runs, so it's the
 * natural key.
 */

let activeSessionId: string | null = null;
let order: string[] | null = null;

function resetIfNewSession(sessionId: string) {
  if (activeSessionId === sessionId) return;
  activeSessionId = sessionId;
  order = null;
}

/** Returns this session's fixed button order, generating it via `shuffleAll` on first call. Falls back to a fresh shuffle every call when sessionId is unavailable. */
export function getStroopOrder(sessionId: string | null, shuffleAll: () => string[]): string[] {
  if (!sessionId) return shuffleAll();
  resetIfNewSession(sessionId);
  if (!order) order = shuffleAll();
  return order;
}
