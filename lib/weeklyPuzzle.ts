/**
 * "Reto de la semana" puzzle generator - deterministic, seeded by the
 * current ISO week so everyone gets the same 3 rounds this week and it
 * changes automatically next week with zero manual content authoring. Pure
 * calculation, no UI/DB dependency (lib/ convention).
 */

export type PuzzleCell = { rotationDeg: number };
export type WeeklyPuzzle = { cells: PuzzleCell[]; oddIndex: number; gridSize: number };

const GRID_SIZE = 5;
export const ROUND_COUNT = 3;
export const ROUND_SECONDS = 10;
/** Total wrong clicks allowed across all rounds combined before the attempt fails. */
export const MAX_MISTAKES = 3;

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

/** ISO 8601 week key (e.g. "2026-W07"), local time. */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Local Date for the upcoming Monday 00:00 - when the next weekly challenge unlocks. */
export function getNextWeekStart(): Date {
  const d = new Date();
  const dayNum = d.getDay() || 7; // Mon=1..Sun=7
  const daysUntilNextMonday = 8 - dayNum;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysUntilNextMonday, 0, 0, 0, 0);
}

/**
 * Every cell shares the same hexagon rotation except one, which is offset by
 * a large enough angle to be visually unambiguous once you look for it.
 * Rendered as SVG shapes (not text) by the caller - there's no written
 * pattern to paste into a text-only AI, seeing the odd one out means
 * actually looking at the grid. `round` (0..ROUND_COUNT-1) gives each of the
 * week's 3 rounds its own distinct grid from the same weekly seed.
 */
export function generateWeeklyPuzzle(weekKey: string, round: number): WeeklyPuzzle {
  const rand = mulberry32(hashString(`${weekKey}:${round}`));
  const baseRotation = Math.floor(rand() * 60);
  const oddIndex = Math.floor(rand() * GRID_SIZE * GRID_SIZE);
  const oddOffset = 40 + Math.floor(rand() * 80);

  const cells: PuzzleCell[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    rotationDeg: i === oddIndex ? baseRotation + oddOffset : baseRotation,
  }));

  return { cells, oddIndex, gridSize: GRID_SIZE };
}
