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
