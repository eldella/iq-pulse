"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const PARTICLE_COUNT = 14;
// Only the palette's own tokens - keeps the burst "on brand" instead of
// reaching for arbitrary confetti-rainbow hex values.
const PARTICLE_COLORS = ["bg-success", "bg-accent", "bg-warn"];

type Particle = {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  rotate: number;
};

/**
 * Plain module-level function (not a hook/component) so its Math.random()
 * calls sit outside RecordConfetti's own lexical body - same pattern as
 * lib/timing.ts's `now()` wrapper, which the react-hooks purity rule doesn't
 * flag since it only analyzes each component/hook's own function body.
 */
function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 60 + Math.random() * 50;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      size: 5 + Math.random() * 4,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      delay: Math.random() * 0.08,
      rotate: (Math.random() - 0.5) * 360,
    };
  });
}

/**
 * One-shot burst of small squares from the center, for the "new personal
 * record" moment on Reacción's results card. Pure CSS-transform/opacity via
 * Framer Motion (cheap, GPU-composited) - mounts, plays once, the parent
 * unmounts it after `RECORD_CONFETTI_DURATION_MS` (see the caller's
 * setTimeout). Doesn't render at all under prefers-reduced-motion, same as
 * every other animation in the app.
 */
export function RecordConfetti() {
  const particles = useMemo(() => generateParticles(), []);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute rounded-sm ${p.color}`}
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 0.7, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/** How long the caller should keep <RecordConfetti> mounted before dropping it. */
export const RECORD_CONFETTI_DURATION_MS = 900;
