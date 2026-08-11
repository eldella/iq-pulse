import { create } from "zustand";
import type { GameId, GameResult, Screen } from "@/lib/types";

/**
 * Ordered stage units. Each stage maps 1:1 to a mini-game component (see
 * STAGE_COMPONENTS in components/QuizFlow.tsx). The UI reads `totalStages`
 * and `currentStageIndex` off the store rather than hardcoding a count, so
 * adding a 4th stage later is just: push its GameId here, wire its
 * component into QuizFlow's map, and everything else (progress dots, "Etapa
 * X de N" copy, the transition CTA) adapts automatically.
 *
 * Currently 3 stages (Reflejos, Memoria, Enfoque) — the product brief asked
 * for a 4-stage "El Ídolo"-style run, but only 3 concrete mini-games exist
 * today. See the final report for that deviation note.
 */
export const STAGES: GameId[] = ["reactionTime", "memorySpan", "stroopTest"];

interface QuizState {
  screen: Screen;
  stages: GameId[];
  currentStageIndex: number;
  totalStages: number;
  results: Partial<Record<GameId, GameResult>>;
  startQuiz: () => void;
  recordGameResult: (game: GameId, result: GameResult) => void;
  /** Advances past the current stage-transition screen: next stage, or results if this was the last one. */
  nextScreen: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  screen: "landing",
  stages: STAGES,
  currentStageIndex: 0,
  totalStages: STAGES.length,
  results: {},

  startQuiz: () =>
    set({
      screen: "stage",
      currentStageIndex: 0,
      results: {},
    }),

  // A game component calls this once it finishes; it both stores the
  // result and hands control to the stage-transition screen (the game
  // itself no longer decides what comes next).
  recordGameResult: (game, result) =>
    set((state) => ({
      results: { ...state.results, [game]: result },
      screen: "stageTransition",
    })),

  nextScreen: () => {
    const { currentStageIndex, totalStages } = get();
    const isLastStage = currentStageIndex + 1 >= totalStages;
    set(
      isLastStage
        ? { screen: "results" }
        : { screen: "stage", currentStageIndex: currentStageIndex + 1 }
    );
  },

  resetQuiz: () =>
    set({
      screen: "landing",
      currentStageIndex: 0,
      results: {},
    }),
}));
