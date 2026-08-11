"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-2xl",
  md: "h-14 w-14 text-3xl",
  lg: "h-20 w-20 text-5xl",
} as const;

/**
 * Decorative "3D-style" emoji badge: a native emoji glyph (renders with the
 * OS's own glossy emoji font - Apple Color Emoji, Segoe UI Emoji, etc. -
 * which already reads as a glossy 3D illustration on most platforms) over a
 * soft accent glow, plus a drop-shadow for depth and a gentle float loop.
 * Purely illustrative - never used for functional icons/buttons/nav, those
 * stay lucide-react. Frozen under prefers-reduced-motion.
 */
export function Emoji3D({
  emoji,
  size = "md",
  className,
  durationSeconds = 6,
}: {
  emoji: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  durationSeconds?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative inline-flex select-none items-center justify-center",
        SIZE_CLASSES[size],
        className
      )}
      animate={
        shouldReduceMotion
          ? undefined
          : { y: [0, -8, 0], rotate: [0, -4, 4, 0] }
      }
      transition={{ duration: durationSeconds, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-accent/25 blur-xl" />
      <span style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
        {emoji}
      </span>
    </motion.span>
  );
}
