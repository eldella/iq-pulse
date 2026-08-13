/**
 * "Reto del mes" puzzle generator - deterministic, seeded by the current
 * year-month so everyone gets the same grid this month and it changes
 * automatically next month with zero manual content authoring. Pure
 * calculation, no UI/DB dependency (lib/ convention).
 */

export type PuzzleCell = { rotationDeg: number };
export type MonthlyPuzzle = { cells: PuzzleCell[]; oddIndex: number; gridSize: number };

const GRID_SIZE = 5;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 - small, fast, deterministic PRNG from an integer seed. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Local YYYY-MM key, matching the date-key convention in lib/dailyTraining.ts. */
export function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Every cell shares the same hexagon rotation except one, which is offset by
 * a large enough angle to be visually unambiguous once you look for it.
 * Rendered as SVG shapes (not text) by the caller - there's no written
 * pattern to paste into a text-only AI, seeing the odd one out means
 * actually looking at the grid.
 */
export function generateMonthlyPuzzle(monthKey: string): MonthlyPuzzle {
  const rand = mulberry32(hashString(monthKey));
  const baseRotation = Math.floor(rand() * 60);
  const oddIndex = Math.floor(rand() * GRID_SIZE * GRID_SIZE);
  const oddOffset = 40 + Math.floor(rand() * 80);

  const cells: PuzzleCell[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    rotationDeg: i === oddIndex ? baseRotation + oddOffset : baseRotation,
  }));

  return { cells, oddIndex, gridSize: GRID_SIZE };
}
