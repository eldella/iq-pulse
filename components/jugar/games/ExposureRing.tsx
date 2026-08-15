"use client";

import { motion } from "framer-motion";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Ring that drains over `durationMs`, meant to sit as an absolutely
 * positioned overlay behind whatever it's timing (a board, a flashing
 * letter) - shared by Memoria Espacial and Palabra Rápida instead of each
 * building its own.
 *
 * Uses a plain SVG <circle> with a hardcoded radius instead of measuring a
 * <path> at runtime via getTotalLength() - that call throws if invoked
 * before the element has laid out, which is exactly the kind of bug this
 * needs to avoid. A circle's circumference is just math (2πr), so there's
 * nothing to measure and nothing that can throw.
 */
export function ExposureRing({ durationMs, active }: { durationMs: number; active: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r={RADIUS} strokeWidth="3" className="fill-none stroke-glass-border" />
      {active && (
        <motion.circle
          cx="50"
          cy="50"
          r={RADIUS}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          className="fill-none stroke-accent"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: CIRCUMFERENCE }}
          transition={{ duration: Math.max(0, durationMs) / 1000, ease: "linear" }}
        />
      )}
    </svg>
  );
}
