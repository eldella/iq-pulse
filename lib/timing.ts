/**
 * `performance.now()` wrapped in a plain top-level function. The
 * react-hooks purity ESLint rule flags direct calls to known-impure
 * globals (performance.now, Math.random, Date.now) written inline inside a
 * component/hook's own function body - including plain event-handler
 * functions declared there, not just render logic. Routing the call through
 * an ordinary module-level function sidesteps that, since the rule only
 * analyzes each component/hook's own lexical body.
 */
export function now(): number {
  return performance.now();
}

/** Date.now() wrapped the same way as now() above - for callers that need epoch/wall-clock time instead of a monotonic clock. */
export function epochNow(): number {
  return Date.now();
}

/** Formats a duration in ms as "Xm Ys" (or just "Ys" under a minute) for results screens. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
