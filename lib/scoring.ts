import type { GameId, GameResult } from "./types";

/**
 * Averages each completed game's normalized rawScore (0-100) into a single
 * aggregate raw score (0-100). Missing games are simply excluded from the
 * average rather than counted as zero.
 */
export function getAggregateScore(
  results: Partial<Record<GameId, GameResult>>
): number {
  const scores = Object.values(results)
    .filter((r): r is GameResult => Boolean(r))
    .map((r) => r.rawScore);

  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return sum / scores.length;
}

/**
 * Estimates a playful "estimated IQ" from the quiz's aggregate raw score (0-100).
 *
 * IMPORTANT: this is NOT a real psychometric instrument or clinical claim.
 * It simply maps the raw score onto the familiar IQ bell curve (mean 100,
 * SD 15) via a standard z-score transform, assuming the raw score is roughly
 * normally distributed across a hypothetical player population with an
 * assumed mean of 50 and an assumed standard deviation of 20. The result is
 * clamped to a believable, non-alarming display range. For entertainment only.
 */
export function estimateIQ(aggregateRawScore: number): number {
  const ASSUMED_RAW_MEAN = 50;
  const ASSUMED_RAW_SD = 20;
  const IQ_MEAN = 100;
  const IQ_SD = 15;
  const MIN_DISPLAY_IQ = 55;
  const MAX_DISPLAY_IQ = 145;

  const clampedRaw = Math.min(100, Math.max(0, aggregateRawScore));
  const z = (clampedRaw - ASSUMED_RAW_MEAN) / ASSUMED_RAW_SD;
  const iq = IQ_MEAN + z * IQ_SD;

  return Math.round(Math.min(MAX_DISPLAY_IQ, Math.max(MIN_DISPLAY_IQ, iq)));
}

export interface StrengthBadge {
  key: "reflejos" | "memoria" | "enfoque";
  label: string;
  /** 0-100 relative performance for this cognitive area. */
  value: number;
}

/**
 * Derives simple "cognitive strength" badges from relative per-game
 * performance. Purely presentational — not a scientific claim.
 */
export function getStrengths(
  results: Partial<Record<GameId, GameResult>>
): StrengthBadge[] {
  const badges: StrengthBadge[] = [];

  if (results.reactionTime) {
    badges.push({
      key: "reflejos",
      label: "Reflejos",
      value: results.reactionTime.rawScore,
    });
  }
  if (results.memorySpan) {
    badges.push({
      key: "memoria",
      label: "Memoria",
      value: results.memorySpan.rawScore,
    });
  }
  if (results.stroopTest) {
    badges.push({
      key: "enfoque",
      label: "Enfoque",
      value: results.stroopTest.rawScore,
    });
  }

  return badges.sort((a, b) => b.value - a.value);
}

export interface Archetype {
  name: string;
  tagline: string;
}

/**
 * Maps relative performance across the 3 stats to one of a small set of
 * "mental archetypes" for the shareable results card. Purely presentational
 * flavor text, not a scientific classification.
 */
export function getArchetype(
  results: Partial<Record<GameId, GameResult>>
): Archetype {
  const strengths = getStrengths(results);

  if (strengths.length === 0) {
    return {
      name: "El Explorador",
      tagline: "Recién estás descubriendo tu perfil mental.",
    };
  }

  const values = strengths.map((s) => s.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const spread = Math.max(...values) - Math.min(...values);
  const top = strengths[0];

  if (average >= 85) {
    return {
      name: "La Mente Prodigio",
      tagline: "Reflejos, memoria y lógica al máximo nivel.",
    };
  }
  if (average <= 35) {
    return {
      name: "El Explorador",
      tagline: "Cada intento suma — con práctica el perfil mejora rápido.",
    };
  }
  if (spread <= 10) {
    return {
      name: "El Equilibrado",
      tagline: "Rendimiento parejo en todas las áreas evaluadas.",
    };
  }

  switch (top.key) {
    case "reflejos":
      return { name: "El Reflejo Veloz", tagline: "Reacciona antes de pensar." };
    case "memoria":
      return { name: "El Archivista", tagline: "Retiene secuencias como nadie." };
    case "enfoque":
    default:
      return {
        name: "El Estratega",
        tagline: "Filtra el ruido y encuentra el patrón correcto.",
      };
  }
}
