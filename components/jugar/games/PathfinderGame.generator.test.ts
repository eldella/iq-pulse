import { describe, expect, it } from "vitest";
import { generatePuzzle, type Move } from "./PathfinderGame";

/**
 * A "cheating player" only looks at the 4 option chips (never the board) and
 * picks one using some property of the arrow sequences themselves. If the
 * generator has any leak, at least one of these will do better than chance.
 * With 4 options, chance is 25%; ~32% is the ceiling the generator brief
 * sets for "no detectable fuga" (see terminales/terminal-1-razonamiento.txt).
 */
type CheatingBot = { name: string; pick: (options: Move[][]) => number };

function movesToKey(path: Move[]) {
  return path.join("");
}

function turnCount(path: Move[]) {
  let turns = 0;
  for (let i = 1; i < path.length; i++) {
    if (path[i] !== path[i - 1]) turns += 1;
  }
  return turns;
}

/** Index of the one option whose value at `columnIndex` differs from all the other 3, or -1 if none (2-2/4-0/0-4 split). */
function loneOutlierAt(options: Move[][], columnIndex: number): number {
  const values = options.map((path) => path[columnIndex]);
  for (let i = 0; i < values.length; i++) {
    const matches = values.filter((v) => v === values[i]).length;
    if (matches === 1) return i;
  }
  return -1;
}

function firstDistinctIndex(scores: number[], pickMax: boolean): number {
  const target = pickMax ? Math.max(...scores) : Math.min(...scores);
  const winners = scores.reduce<number[]>((acc, s, i) => (s === target ? [...acc, i] : acc), []);
  // Ties are common (e.g. two options share the same turn count) - a
  // deterministic tie-break (always take the first) is itself a strategy a
  // lazy player could use, so it must not leak either.
  return winners[0];
}

const CHEATING_BOTS: CheatingBot[] = [
  { name: "always position 0", pick: () => 0 },
  { name: "always position 1", pick: () => 1 },
  { name: "always position 2", pick: () => 2 },
  { name: "always position 3", pick: () => 3 },
  {
    name: "lone outlier at column 0",
    pick: (options) => {
      const idx = loneOutlierAt(options, 0);
      return idx === -1 ? 0 : idx;
    },
  },
  {
    name: "lone outlier at last column",
    pick: (options) => {
      const idx = loneOutlierAt(options, options[0].length - 1);
      return idx === -1 ? 0 : idx;
    },
  },
  {
    name: "lone outlier anywhere (first found)",
    pick: (options) => {
      for (let col = 0; col < options[0].length; col++) {
        const idx = loneOutlierAt(options, col);
        if (idx !== -1) return idx;
      }
      return 0;
    },
  },
  {
    name: "most turns (zigzaggiest)",
    pick: (options) => firstDistinctIndex(options.map(turnCount), true),
  },
  {
    name: "fewest turns (straightest)",
    pick: (options) => firstDistinctIndex(options.map(turnCount), false),
  },
  {
    name: "most R moves",
    pick: (options) => firstDistinctIndex(options.map((p) => p.filter((m) => m === "R").length), true),
  },
  {
    name: "most different from the rest (Hamming distance sum)",
    pick: (options) => {
      const scores = options.map((path, i) =>
        options.reduce((sum, other, j) => {
          if (i === j) return sum;
          let dist = 0;
          for (let k = 0; k < path.length; k++) if (path[k] !== other[k]) dist += 1;
          return sum + dist;
        }, 0)
      );
      return firstDistinctIndex(scores, true);
    },
  },
  {
    name: "most similar to the rest (Hamming distance sum)",
    pick: (options) => {
      const scores = options.map((path, i) =>
        options.reduce((sum, other, j) => {
          if (i === j) return sum;
          let dist = 0;
          for (let k = 0; k < path.length; k++) if (path[k] !== other[k]) dist += 1;
          return sum + dist;
        }, 0)
      );
      return firstDistinctIndex(scores, false);
    },
  },
  {
    name: "starts with R",
    pick: (options) => {
      const idx = options.findIndex((p) => p[0] === "R");
      return idx === -1 ? 0 : idx;
    },
  },
  {
    name: "alphabetically first move sequence",
    pick: (options) => {
      const sorted = [...options].map((p, i) => [movesToKey(p), i] as const).sort((a, b) => (a[0] < b[0] ? -1 : 1));
      return sorted[0][1];
    },
  },
  {
    name: "longest common-prefix-with-others break point (earliest diverger)",
    pick: (options) => {
      // Picks the option whose first point of divergence from the other 3
      // (as a group) comes earliest - a proxy for "the one that looks like
      // it splits off from the pack soonest".
      const scores = options.map((path, i) => {
        for (let col = 0; col < path.length; col++) {
          const idx = loneOutlierAt(options, col);
          if (idx === i) return col;
        }
        return path.length;
      });
      return firstDistinctIndex(scores, false);
    },
  },
];

const TRIALS_PER_LEVEL = 400;
// 25% is chance with 4 options; the brief's ceiling is ~32%. A few points of
// slack above that absorb sampling noise at 400 trials/level without
// letting a real leak (which should land well above 32%, not hug it) hide.
const MAX_ALLOWED_WIN_RATE = 0.34;

describe("PathfinderGame generator - anti-shortcut guarantee", () => {
  it("produces exactly one correct option and a full 4-option set every time", () => {
    for (let level = 1; level <= 40; level += 3) {
      for (let i = 0; i < 20; i++) {
        const puzzle = generatePuzzle(level);
        expect(puzzle.options).toHaveLength(4);
        const correctCount = puzzle.options.filter((o) => movesToKey(o) === movesToKey(puzzle.correct)).length;
        expect(correctCount).toBe(1);
      }
    }
  });

  it("never lets a column have a 3-1 or 1-3 split across the 4 options", () => {
    for (let level = 1; level <= 40; level += 3) {
      for (let i = 0; i < 50; i++) {
        const puzzle = generatePuzzle(level);
        for (let col = 0; col < puzzle.correct.length; col++) {
          const rCount = puzzle.options.filter((o) => o[col] === "R").length;
          expect([0, 2, 4]).toContain(rCount);
        }
      }
    }
  });

  it.each(CHEATING_BOTS)("cheating bot '$name' cannot beat the ~32% no-leak ceiling", ({ pick }) => {
    let correct = 0;
    let total = 0;
    for (let level = 1; level <= 40; level += 4) {
      for (let i = 0; i < TRIALS_PER_LEVEL; i++) {
        const puzzle = generatePuzzle(level);
        const guessIndex = pick(puzzle.options);
        if (movesToKey(puzzle.options[guessIndex]) === movesToKey(puzzle.correct)) correct += 1;
        total += 1;
      }
    }
    const winRate = correct / total;
    expect(winRate).toBeLessThan(MAX_ALLOWED_WIN_RATE);
  });
});
