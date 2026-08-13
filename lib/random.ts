/**
 * Fisher-Yates shuffle. `array.sort(() => Math.random() - 0.5)` (used to be
 * scattered across the minigames) is a well-known bug, not just a style
 * nit: V8's sort isn't guaranteed to compare every pair, so a random
 * comparator produces a biased, only-partially-shuffled result - on small
 * arrays it visibly favors the original order, which is why the same
 * puzzle/obstacle/word set could show up many times in a row.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
