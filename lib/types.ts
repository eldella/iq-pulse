/**
 * Shared types for the quiz flow, games, and leaderboard.
 * Kept framework-agnostic so the data layer (mock now, real DB later)
 * can be swapped without touching component or route logic.
 */

export type GameId = "reactionTime" | "memorySpan" | "stroopTest";

/**
 * Top-level screens the orchestrator switches between. The quiz itself is a
 * generic staged pipeline: "stage" renders whichever game is at the current
 * stage index, and "stageTransition" shows the between-stage recap/CTA.
 * Nothing here hardcodes how many stages exist — see store/useQuizStore.ts.
 */
export type Screen = "landing" | "stage" | "stageTransition" | "results";

/** A single trial/attempt within a game. */
export interface RoundResult {
  responseTimeMs: number;
  correct: boolean;
}

/** The full outcome of one game, aggregated from its rounds. */
export interface GameResult {
  game: GameId;
  rounds: RoundResult[];
  /** Percentage of rounds answered correctly, 0-100. */
  accuracy: number;
  /** Average response time across valid rounds, in ms. */
  avgResponseTimeMs: number;
  /** Normalized score for this game, 0-100, used for the aggregate IQ calc. */
  rawScore: number;
}

/** Leaderboard row shape — mirrors what a real DB (Supabase/Vercel KV) would return. */
export interface LeaderboardEntry {
  id: string;
  alias: string;
  score: number;
  iq?: number;
  createdAt: string;
}

export type LeaderboardRange = "today" | "week" | "alltime";
