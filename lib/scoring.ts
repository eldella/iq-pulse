/**
 * Pure scoring/adaptive-difficulty logic for the quiz engine - no Supabase
 * or React dependency here on purpose, so it's testable in isolation and
 * reusable from wherever the actual quiz UI ends up living.
 *
 * Design (confirmed with the user): precision is the primary driver of
 * score, response time only adds a small bonus - a lucky fast guess should
 * never outscore a slower correct answer. Difficulty starts at "medium"
 * (starting at "easy" wastes a capable person's first few questions) and
 * adapts: 2 correct in a row bumps it up one tier, 1 incorrect drops it one
 * tier, both clamped to the easy/medium/hard range.
 */

export type Difficulty = "easy" | "medium" | "hard";
export type Domain = "reasoning" | "memory" | "speed";

const DIFFICULTY_BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 200,
};

const DIFFICULTY_ORDER: readonly Difficulty[] = ["easy", "medium", "hard"];

/** Time bonus decays linearly from 20% (instant) to 0% at/after this many ms. */
const TIME_BONUS_WINDOW_MS = 10_000;
const TIME_BONUS_MAX_FACTOR = 0.2;

/**
 * Points for a single answered question. Wrong answers always score 0,
 * regardless of how fast they were - speed only ever amplifies a correct
 * answer, it never substitutes for one.
 */
export function scoreAnswer(
  difficulty: Difficulty,
  isCorrect: boolean,
  responseTimeMs: number
): number {
  if (!isCorrect) return 0;

  const basePoints = DIFFICULTY_BASE_POINTS[difficulty];
  const timeBonusFactor =
    Math.max(0, 1 - responseTimeMs / TIME_BONUS_WINDOW_MS) * TIME_BONUS_MAX_FACTOR;

  return Math.round(basePoints * (1 + timeBonusFactor));
}

/**
 * Next difficulty tier given consecutive-correct and consecutive-wrong
 * streaks (each reset to 0 by the caller whenever the other one advances)
 * and whether the just-answered question was correct. Called once per
 * answer.
 *
 * Deliberately asymmetric (confirmed with the user): 2 in a row bumps the
 * tier up, but it also takes 2 wrong in a row to drop one - a single slip
 * doesn't undo progress, so a session trends toward "hard" rather than
 * oscillating around "medium". There's still only one overall mode (no
 * easy/normal/hard picker), this just biases that one mode upward.
 */
export function nextDifficulty(
  current: Difficulty,
  isCorrect: boolean,
  consecutiveCorrect: number,
  consecutiveWrong: number
): Difficulty {
  const currentIndex = DIFFICULTY_ORDER.indexOf(current);

  if (!isCorrect) {
    if (consecutiveWrong >= 2) {
      return DIFFICULTY_ORDER[Math.max(0, currentIndex - 1)];
    }
    return current;
  }

  if (consecutiveCorrect >= 2) {
    return DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, currentIndex + 1)];
  }

  return current;
}

/**
 * Normalizes a session's total points into the 0-1 range scoreToIQEstimate
 * expects, against a ceiling of every question answered at "hard" with a
 * full time bonus. Difficulty is adaptive, so this is intentional: staying
 * at "hard" the whole session scores higher than acing "easy" the whole
 * way through, even at 100% accuracy in both cases - the ceiling rewards
 * the difficulty level you sustained, not just correctness.
 */
export function normalizeScore(totalPoints: number, answeredCount: number): number {
  if (answeredCount <= 0) return 0;
  const ceiling = answeredCount * DIFFICULTY_BASE_POINTS.hard * (1 + TIME_BONUS_MAX_FACTOR);
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
