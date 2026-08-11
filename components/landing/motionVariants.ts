import type { Variants } from "framer-motion";
import { springTransition } from "@/lib/motion";

/**
 * Parent stagger container for the landing page's sections. Children using
 * `fadeSlideUp` reveal in sequence as this container's `animate` prop
 * transitions from "hidden" to "show".
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

/** Simple fade + slide-up entrance for staggered landing page children. */
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: springTransition },
};

/**
 * Word-by-word stagger container for the hero headline entrance. Faster
 * cadence than `staggerContainer` since it's staggering short words, not
 * whole sections.
 */
export const heroTextStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

/** Per-word fade + slide-up used by the hero headline's word stagger. */
export const heroWordFade: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: springTransition },
};
