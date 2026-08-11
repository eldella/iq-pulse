"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Small local ambient glow blob for individual sections — lower opacity and
 * footprint than the global `AnimatedBackground`, used to add subtle
 * decorative life behind a section's content without competing with
 * foreground text. Frozen (no animate loop) when the user prefers reduced
 * motion, matching `AnimatedBackground`.
 */
export function AmbientBlob({
  className,
  durationSeconds = 20,
}: {
  className?: string;
  durationSeconds?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full bg-accent/20 blur-[80px]",
        className
      )}
      animate={
        shouldReduceMotion
          ? undefined
          : { x: [0, 30, -20, 0], y: [0, -20, 15, 0] }
      }
      transition={{ duration: durationSeconds, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
