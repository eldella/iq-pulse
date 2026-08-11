"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * Smooth animated number counter used for the IQ score reveal.
 * Counts up from 0 to `value`; jumps straight to the final value when the
 * user prefers reduced motion.
 */
export function AnimatedCounter({
  value,
  durationSeconds = 1.4,
}: {
  value: number;
  durationSeconds?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const controls = animate(0, value, {
      duration: durationSeconds,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, durationSeconds, shouldReduceMotion]);

  return <span>{shouldReduceMotion ? value : display}</span>;
}
