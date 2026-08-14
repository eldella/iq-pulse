/**
 * Pure scoring/adaptive-difficulty logic for the quiz engine - no Supabase
 * or React dependency here on purpose, so it's testable in isolation and
 * reusable from wherever the actual quiz UI ends up living.
 *
 * Design (confirmed with the user): precision is the primary driver of
 * score, response time only adds a small bonus - a lucky fast guess should
 * never outscore a slower correct answer.
 *
 * Difficulty is an uncapped numeric `level` (starts at 1 = "1x" each new
 * exercise), not 3 fixed tiers: 2 correct in a row DOUBLES it (1→2→4→8→16→
 * 32...), 2 wrong in a row halves it back down (floor of 1). `level` is also
 * literally the score multiplier (100 base points × level), so a 32x streak
 * scores dramatically more than a 1x one - the escalation and the score are
 * the same number, not two systems that happen to move together.
 *
 * Game content can't visually scale 1:1 with an exponential number (a 32x
 * grid would be unusable), so games derive their own visual complexity from
 * `contentTier(level)` - a small integer that only advances once per
 * doubling, giving a handful of meaningful content steps instead of a
 * literal 32x mess. The DB's difficulty_at_time column still only accepts
 * easy/medium/hard (see supabase/schema.sql), so `levelToBucket()` collapses
 * the numeric level down to that for storage - gameplay never touches the
 * 3-tier type again.
 */

export type Difficulty = "easy" | "medium" | "hard";
export type Domain = "reasoning" | "memory" | "speed";

const BASE_POINTS = 100;

/** Time bonus decays linearly from 20% (instant) to 0% at/after this many ms. */
const TIME_BONUS_WINDOW_MS = 10_000;
const TIME_BONUS_MAX_FACTOR = 0.2;

/** A session that sustains this level the whole way through normalizes to ~1.0 (see normalizeScore). */
const NORMALIZE_REFERENCE_LEVEL = 8;

/**
 * Points for a single answered question. Wrong answers always score 0,
 * regardless of how fast they were - speed only ever amplifies a correct
 * answer, it never substitutes for one. `level` multiplies linearly, so
 * doubling your streak literally doubles what each answer is worth.
 */
export function scoreAnswer(level: number, isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;

  const basePoints = BASE_POINTS * level;
  const timeBonusFactor =
    Math.max(0, 1 - responseTimeMs / TIME_BONUS_WINDOW_MS) * TIME_BONUS_MAX_FACTOR;

  return Math.round(basePoints * (1 + timeBonusFactor));
}

/**
 * Next level given consecutive-correct and consecutive-wrong streaks (each
 * reset to 0 by the caller whenever the other one advances) and whether the
 * just-answered question was correct. Called once per answer.
 *
 * Deliberately asymmetric (confirmed with the user): 2 in a row doubles the
 * level, but it still takes 2 wrong in a row to halve it back down - a
 * session shoots up fast and falls back slowly rather than oscillating.
 *
 * The streak counters the caller passes in never reset back to 0 on their
 * own once a streak continues (only the *other* outcome resets them), so
 * this can't gate on `>= 2` - that stayed true for every answer after the
 * 2nd correct in a row and re-doubled on each one, compounding into an
 * exponential runaway (16x -> 256x within a handful of correct taps) well
 * beyond the intended "every 2 in a row" pace. Gating on the streak being an
 * exact multiple of 2 instead makes it re-trigger only once per *additional*
 * 2-in-a-row, matching the documented 1x->2x->4x->8x->16x->32x progression.
 */
export function nextLevel(
  current: number,
  isCorrect: boolean,
  consecutiveCorrect: number,
  consecutiveWrong: number
): number {
  if (!isCorrect) {
    if (consecutiveWrong > 0 && consecutiveWrong % 2 === 0) {
      return Math.max(1, Math.floor(current / 2));
    }
    return current;
  }

  if (consecutiveCorrect > 0 && consecutiveCorrect % 2 === 0) {
    return current * 2;
  }

  return current;
}

/**
 * Small integer content-complexity tier for a given level - advances once
 * per doubling (level 1 → tier 0, 2-3 → tier 1, 4-7 → tier 2, 8-15 → tier 3,
 * 16-31 → tier 4, ...), so a game's grid/sequence/range formulas get a
 * handful of sane growth steps instead of trying to render "32x" literally.
 */
export function contentTier(level: number): number {
  return Math.floor(Math.log2(Math.max(1, level)));
}

/** Collapses the numeric level down to the DB's fixed easy/medium/hard column - display/scoring never use this. */
export function levelToBucket(level: number): Difficulty {
  const tier = contentTier(level);
  if (tier <= 1) return "easy";
  if (tier <= 3) return "medium";
  return "hard";
}

/**
 * Reverse of levelToBucket, for completeSession() re-scoring answers read
 * back from the DB (which only ever stored the bucket, not the exact
 * level). Picks the lowest level in each bucket's range - a conservative
 * reconstruction that never overstates a session's score.
 */
export function bucketToLevel(bucket: Difficulty): number {
  if (bucket === "easy") return 1;
  if (bucket === "medium") return 4;
  return 16;
}

/**
 * Normalizes a session's total points into the 0-1 range scoreToIQEstimate
 * expects, against a reference of every question answered at level 8 (a
 * strong, sustained streak) with a full time bonus. Levels are uncapped, so
 * this is a reference point rather than a true ceiling - exceeding it is
 * possible and fine, scoreToIQEstimate already clamps the input safely.
 */
export function normalizeScore(totalPoints: number, answeredCount: number): number {
  if (answeredCount <= 0) return 0;
  const ceiling = answeredCount * BASE_POINTS * NORMALIZE_REFERENCE_LEVEL * (1 + TIME_BONUS_MAX_FACTOR);
  return totalPoints / ceiling;
}

/**
 * Maps a 0-1 accuracy-weighted score into an IQ estimate on the standard
 * mean-100/SD-15 scale used by real IQ tests, via an inverse-normal-CDF
 * approximation (Acklam's algorithm) rather than an unrelated ad hoc scale.
 */
export function scoreToIQEstimate(normalizedScore: number): number {
  const p = Math.min(0.999, Math.max(0.001, normalizedScore));
  const z = inverseNormalCDF(p);
  return Math.round(100 + z * 15);
}

/** Percentile (0-100) for a given IQ estimate, mean 100 / SD 15. */
export function iqToPercentile(iq: number): number {
  const z = (iq - 100) / 15;
  return Math.round(normalCDF(z) * 100);
}

export type IQClassification =
  | "verySuperior"
  | "superior"
  | "highAverage"
  | "average"
  | "lowAverage"
  | "borderline"
  | "low";

/**
 * Standard Wechsler-style IQ classification bands - a plain-language label
 * ("Superior", "Promedio") reads instantly, unlike a bare percentile number
 * which needs the reader to already know what "percentile" means.
 */
export function classifyIQ(iq: number): IQClassification {
  if (iq >= 130) return "verySuperior";
  if (iq >= 120) return "superior";
  if (iq >= 110) return "highAverage";
  if (iq >= 90) return "average";
  if (iq >= 80) return "lowAverage";
  if (iq >= 70) return "borderline";
  return "low";
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 approximation - plenty accurate for a
  // percentile display, no need for a stats library dependency.
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function inverseNormalCDF(p: number): number {
  // Peter Acklam's approximation.
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((( a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}
