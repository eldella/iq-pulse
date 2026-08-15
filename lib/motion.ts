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

/**
 * Fast fade for the memorize-phase "flash" in DigitSpanGame/WordBurstGame/
 * WordTypingGame (one digit/word/letter at a time, on a fixed interval as
 * short as 220ms at high tiers). springTransition's ~300-400ms settle time
 * doesn't fit in that window, and AnimatePresence's default "wait" mode
 * makes the incoming item wait for the outgoing one to fully exit first -
 * together that ate enough of the interval that fast items could flash by
 * without ever reaching full opacity. This is deliberately a plain tween,
 * short enough to always finish inside the fastest interval.
 */
export const flashTransition: Transition = { duration: 0.1 };

/** Tap scale-down used on every primary interactive element. */
export const tapScale = { scale: 0.95 };

/**
 * How long the minigames hold on the green/red correct-answer reveal before
 * calling onAnswer (which triggers the parent to remount into the next
 * question) - long enough to register, short enough not to slow down a
 * 30-second timed round.
 */
export const ANSWER_FEEDBACK_MS = 650;
