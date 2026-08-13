/**
 * "Reto de la semana" puzzle generators - deterministic, seeded by the
 * current ISO week so everyone gets the same 3 rounds this week, and by a
 * fixed epoch so which of the 4 game types is active also rotates
 * automatically week to week with zero manual content authoring. Pure
 * calculation, no UI/DB dependency (lib/ convention).
 *
 * All 4 games are rendered as SVG shapes or timed reveals by the caller, not
 * a written description - there's no static text pattern to paste into a
 * text-only AI. Sequence and flashCount go further: the content that matters
 * (the flash order, the dot count) only exists on screen for a moment, so
 * even a single screenshot after the fact shows nothing to solve from.
 */

export const ROUND_COUNT = 3;
export const ROUND_SECONDS = 10;
/** Total wrong answers allowed across all 3 rounds combined before the attempt fails. */
export const MAX_MISTAKES = 3;

export type WeeklyGameType = "oddHexagon" | "mirror" | "sequence" | "flashCount";

const GAME_TYPES: WeeklyGameType[] = ["oddHexagon", "sequence", "mirror", "flashCount"];
/** Arbitrary fixed Monday used only as a stable reference point for the rotation. */
const EPOCH_MONDAY_MS = new Date(2024, 0, 1).getTime();

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

function getCurrentWeekStart(): Date {
  const next = getNextWeekStart();
  return new Date(next.getFullYear(), next.getMonth(), next.getDate() - 7);
}

/** Which of the 4 games is live this week - cycles in a fixed order, one per week. */
export function getWeeklyGameType(): WeeklyGameType {
  const weekStart = getCurrentWeekStart();
  const weekIndex = Math.round((weekStart.getTime() - EPOCH_MONDAY_MS) / (7 * 86400000));
  const i = ((weekIndex % GAME_TYPES.length) + GAME_TYPES.length) % GAME_TYPES.length;
  return GAME_TYPES[i];
}

// --- oddHexagon: spot the hexagon with a different rotation in a 5x5 grid ---

export type OddHexagonRound = {
  kind: "oddHexagon";
  gridSize: number;
  cells: { rotationDeg: number }[];
  oddIndex: number;
};

function generateOddHexagonRound(weekKey: string, round: number): OddHexagonRound {
  const rand = mulberry32(hashString(`${weekKey}:hex:${round}`));
  const gridSize = 5;
  const baseRotation = Math.floor(rand() * 60);
  const oddIndex = Math.floor(rand() * gridSize * gridSize);
  const oddOffset = 40 + Math.floor(rand() * 80);
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => ({
    rotationDeg: i === oddIndex ? baseRotation + oddOffset : baseRotation,
  }));
  return { kind: "oddHexagon", gridSize, cells, oddIndex };
}

// --- mirror: spot the mirrored (not just rotated) L-shape among 4 ---

export type MirrorRound = {
  kind: "mirror";
  cells: { rotationDeg: number; mirrored: boolean }[];
  oddIndex: number;
};

function generateMirrorRound(weekKey: string, round: number): MirrorRound {
  const rand = mulberry32(hashString(`${weekKey}:mirror:${round}`));
  const baseRotation = Math.floor(rand() * 4) * 90;
  const oddIndex = Math.floor(rand() * 4);
  const cells = Array.from({ length: 4 }, (_, i) => ({
    rotationDeg: i === oddIndex ? Math.floor(rand() * 4) * 90 : baseRotation,
    mirrored: i === oddIndex,
  }));
  return { kind: "mirror", cells, oddIndex };
}

// --- sequence: watch cells light up in order, then repeat the order ---

export type SequenceRound = {
  kind: "sequence";
  gridSize: number;
  sequence: number[];
};

function generateSequenceRound(weekKey: string, round: number): SequenceRound {
  const rand = mulberry32(hashString(`${weekKey}:seq:${round}`));
  const gridSize = 3;
  const length = 3 + round;
  const pool = Array.from({ length: gridSize * gridSize }, (_, i) => i);
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    const pick = Math.floor(rand() * pool.length);
    sequence.push(pool[pick]);
    pool.splice(pick, 1);
  }
  return { kind: "sequence", gridSize, sequence };
}

// --- flashCount: a cluster of dots flashes briefly, then pick the count ---

export type FlashCountRound = {
  kind: "flashCount";
  dots: { x: number; y: number }[];
  correctCount: number;
  options: number[];
  revealMs: number;
};

function generateFlashCountRound(weekKey: string, round: number): FlashCountRound {
  const rand = mulberry32(hashString(`${weekKey}:count:${round}`));
  const correctCount = 5 + round * 2;

  const slots: { x: number; y: number }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      slots.push({ x: 15 + col * 23, y: 15 + row * 23 });
    }
  }
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const dots = slots.slice(0, correctCount).map((s) => ({
    x: s.x + (rand() * 6 - 3),
    y: s.y + (rand() * 6 - 3),
  }));

  const options = new Set<number>([correctCount]);
  while (options.size < 4) {
    const candidate = correctCount + Math.floor(rand() * 5) - 2;
    if (candidate > 0) options.add(candidate);
  }
  const optionList = Array.from(options);
  for (let i = optionList.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [optionList[i], optionList[j]] = [optionList[j], optionList[i]];
  }

  return { kind: "flashCount", dots, correctCount, options: optionList, revealMs: 1200 + round * 200 };
}

export type WeeklyRound = OddHexagonRound | MirrorRound | SequenceRound | FlashCountRound;

export function generateWeeklyRound(gameType: WeeklyGameType, weekKey: string, round: number): WeeklyRound {
  switch (gameType) {
    case "oddHexagon":
      return generateOddHexagonRound(weekKey, round);
    case "mirror":
      return generateMirrorRound(weekKey, round);
    case "sequence":
      return generateSequenceRound(weekKey, round);
    case "flashCount":
      return generateFlashCountRound(weekKey, round);
  }
}
