import type { Transition } from "framer-motion";

/**
 * Shared spring preset for all screen/state transitions and microinteractions
 * (button taps, card entrances, etc). Validated design token — do not change.
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * Snappier spring for exits — higher damping settles faster so outgoing
 * elements feel quicker than incoming ones.
 */
export const springExitTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 40,
};

/** Tap scale-down used on every primary interactive element. */
export const tapScale = { scale: 0.95 };

/**
 * How long the minigames hold on the green/red correct-answer reveal before
 * calling onAnswer (which triggers the parent to remount into the next
 * question) - long enough to register, short enough not to slow down a
 * 30-second timed round.
 */
export const ANSWER_FEEDBACK_MS = 650;

/**
 * Per-question time limit for Stroop and Comparación rápida (5s, 10 fixed
 * attempts instead of the shared 30s clock - decided per-game, not a
 * blanket rule other games inherit). A question that runs out counts as a
 * miss and auto-advances, same as an explicit wrong tap.
 */
export const PER_QUESTION_TIMEOUT_MS = 5000;
