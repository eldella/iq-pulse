"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated gradient/aurora background: two large drifting accent blobs, a
 * slow-rotating soft aura for a mesh-gradient feel, and a faint dot-grid
 * texture for depth (ReactBits/Uiverse-style ambient backgrounds). Disabled
 * (frozen) when the user prefers reduced motion - only the static dot grid
 * remains, everything else stops animating.
 */
export function AnimatedBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "rgb(var(--color-fg))",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,rgb(var(--color-accent))_0deg,transparent_120deg,rgb(var(--color-accent))_240deg,transparent_360deg)] opacity-[0.12] blur-[90px]"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[60vh] w-[60vh] rounded-full bg-accent/40 blur-[80px]"
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
        className="absolute -bottom-1/4 -right-1/4 h-[55vh] w-[55vh] rounded-full bg-accent/28 blur-[85px]"
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
      <motion.div
        className="absolute -top-1/4 right-0 h-[38vh] w-[38vh] rounded-full bg-accent/20 blur-[70px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -30, 30, 0],
                y: [0, 25, -25, 0],
                scale: [1, 1.15, 0.95, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
