"use client";

import type { ComponentType, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuizStore } from "@/store/useQuizStore";
import { springTransition, springExitTransition } from "@/lib/motion";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { ReactionTime } from "@/components/games/ReactionTime";
import { MemorySpan } from "@/components/games/MemorySpan";
import { StroopTest } from "@/components/games/StroopTest";
import { StageTransition } from "@/components/StageTransition";
import { Results } from "@/components/Results";
import type { GameId } from "@/lib/types";

const screenVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, y: -12, transition: springExitTransition },
};

/** Maps each stage's GameId to its mini-game component. A 4th stage means adding one entry here. */
const STAGE_COMPONENTS: Record<GameId, ComponentType> = {
  reactionTime: ReactionTime,
  memorySpan: MemorySpan,
  stroopTest: StroopTest,
};

/**
 * Single top-level AnimatePresence for all screen transitions, keyed by the
 * current screen (and stage, where relevant). mode="wait" ensures outgoing
 * screens fully exit before the next one enters. The flow is now a staged
 * pipeline: landing -> (stage -> stageTransition) * N -> results.
 */
export function QuizFlow() {
  const screen = useQuizStore((s) => s.screen);
  const stages = useQuizStore((s) => s.stages);
  const currentStageIndex = useQuizStore((s) => s.currentStageIndex);

  let content: ReactNode;
  let key: string;

  if (screen === "landing") {
    content = <LandingScreen />;
    key = "landing";
  } else if (screen === "stage") {
    const gameId = stages[currentStageIndex];
    const StageComponent = STAGE_COMPONENTS[gameId];
    content = <StageComponent />;
    key = `stage-${gameId}`;
  } else if (screen === "stageTransition") {
    content = <StageTransition />;
    key = `transition-${currentStageIndex}`;
  } else {
    content = <Results />;
    key = "results";
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
