"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
} as const;

const BADGE_PATH = "M4 32 L20 32 L25 14 L32 50 L39 20 L44 32 L60 32";
const AMBIENT_PATH =
  "M0 40 L60 40 L72 12 L88 68 L104 20 L118 40 L180 40 L192 14 L208 64 L224 22 L238 40 L400 40";

/**
 * Page badge (or ambient background texture): a reaction-time trace line,
 * echoing the product's own name — replaces the floating emoji motif for
 * routes centered on the live quiz/leaderboard rather than a scored result.
 * `variant="ambient"` renders a wide, low-opacity strip meant to sit behind
 * other content (e.g. the hero), not as a standalone badge. Frozen under
 * prefers-reduced-motion.
 */
export function PulseTrace({
  size = "md",
  variant = "badge",
  className,
}: {
  size?: keyof typeof SIZE_CLASSES;
  variant?: "badge" | "ambient";
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const draw = shouldReduceMotion
    ? { pathLength: 1 }
    : { pathLength: [0, 1] };
  const drawTransition = shouldReduceMotion
    ? undefined
    : { duration: 1.4, ease: "easeOut" as const };

  if (variant === "ambient") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
        className={cn("pointer-events-none select-none", className)}
        fill="none"
      >
        <motion.path
          d={AMBIENT_PATH}
          stroke="rgb(var(--color-accent))"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.18}
          initial={{ pathLength: 0 }}
          animate={draw}
          transition={drawTransition}
        />
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative inline-flex select-none items-center justify-center",
        SIZE_CLASSES[size],
        className
      )}
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-accent/25 blur-xl" />
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
        <motion.path
          d={BADGE_PATH}
          stroke="rgb(var(--color-accent))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={draw}
          transition={drawTransition}
        />
      </svg>
    </span>
  );
}
