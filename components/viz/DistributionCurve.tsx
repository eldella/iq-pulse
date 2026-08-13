"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
} as const;

// Normal-distribution silhouette across a 0-64 viewBox, baseline at y=50.
const CURVE_PATH =
  "M4 50 C 14 50, 18 48, 22 38 C 26 26, 28 10, 32 10 C 36 10, 38 26, 42 38 C 46 48, 50 50, 60 50";

function curveHeightAt(x: number) {
  // Mirrors the bezier's shape closely enough to place the marker on the
  // curve rather than floating above/below it: peak at x=32 (h=10),
  // baseline at the edges (h=50), falling off faster near the peak.
  const distance = Math.abs(x - 32) / 28;
  const eased = Math.pow(Math.min(1, distance), 1.6);
  return 10 + eased * 40;
}

/**
 * Page badge: a normal-distribution curve with the current position marked —
 * the actual artifact of a cognitive test, standing in for the floating
 * emoji motif. `highlight` is a 0-100 percentile; omit it for an
 * illustrative/generic mark (used where no real per-user result exists yet,
 * e.g. the landing hero). Frozen under prefers-reduced-motion, same contract
 * the emoji badges it replaces had.
 */
export function DistributionCurve({
  highlight = 65,
  size = "md",
  className,
}: {
  highlight?: number;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const markerX = 4 + (Math.max(0, Math.min(100, highlight)) / 100) * 56;
  const markerY = curveHeightAt(markerX);

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
        <path
          d={CURVE_PATH}
          stroke="rgb(var(--color-accent))"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.9}
        />
        <line
          x1={markerX}
          y1={50}
          x2={markerX}
          y2={markerY}
          stroke="rgb(var(--color-accent))"
          strokeWidth={1.5}
          strokeOpacity={0.4}
        />
        <motion.circle
          cx={markerX}
          cy={markerY}
          r={3}
          fill="rgb(var(--color-accent))"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.25, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${markerX}px ${markerY}px` }}
        />
      </svg>
    </span>
  );
}
