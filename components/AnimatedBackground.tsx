"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Subtle animated gradient background — one of the max 1-2 animated focal
 * elements per screen. Disabled (frozen) when the user prefers reduced motion.
 */
export function AnimatedBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[60vh] w-[60vh] rounded-full bg-accent/25 blur-[100px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 60, -20, 0],
                y: [0, 40, -30, 0],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[55vh] w-[55vh] rounded-full bg-accent/15 blur-[110px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -50, 20, 0],
                y: [0, -30, 40, 0],
              }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
