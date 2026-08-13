"use client";

import { motion, useReducedMotion } from "framer-motion";
import { springTransition } from "@/lib/motion";

/**
 * Minimal 3-axis radar/spider chart (reasoning/memory/speed precision, 0-100
 * each) - hand-rolled SVG, same "no charting library" convention as the
 * Sparkline/bar patterns used elsewhere on the site. 3 axes draws a
 * triangle, so the shape itself is the whole point here - it grows in from
 * the center on mount and each vertex gets its own percentage label instead
 * of leaving the reader to eyeball a bare outline against the grid.
 */
export function RadarChart({
  reasoning,
  memory,
  speed,
  labels,
}: {
  reasoning: number;
  memory: number;
  speed: number;
  labels: readonly [string, string, string];
}) {
  const shouldReduceMotion = useReducedMotion();
  // center/radius leave enough margin (radius + label offset + text height)
  // inside the viewBox so axis labels never clip against the SVG edge.
  const center = 110;
  const radius = 80;
  const angles = [-90, 30, 150].map((deg) => (deg * Math.PI) / 180);
  const values = [reasoning, memory, speed];

  const points = angles.map((angle, i) => {
    const r = (values[i] / 100) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  });
  const pointsAttr = points.map(([x, y]) => `${x},${y}`).join(" ");

  const axisEnds = angles.map((angle) => [
    center + radius * Math.cos(angle),
    center + radius * Math.sin(angle),
  ]);
  const labelPositions = angles.map((angle) => [
    center + (radius + 24) * Math.cos(angle),
    center + (radius + 24) * Math.sin(angle),
  ]);
  const valueLabelPositions = angles.map((angle, i) => {
    const r = (values[i] / 100) * radius;
    // Push the value label a little further out than its vertex so it
    // never sits on top of the accent dot.
    return [center + (r + 14) * Math.cos(angle), center + (r + 14) * Math.sin(angle)];
  });

  return (
    <svg
      viewBox="0 0 220 220"
      className="h-56 w-56"
      role="img"
      aria-label={labels.map((label, i) => `${label}: ${values[i]}%`).join(", ")}
    >
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity={0.4} />
          <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity={0.12} />
        </radialGradient>
      </defs>

      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={angles
            .map((angle) => `${center + radius * scale * Math.cos(angle)},${center + radius * scale * Math.sin(angle)}`)
            .join(" ")}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.08}
          className="text-foreground"
        />
      ))}
      {axisEnds.map(([x, y], i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="currentColor"
          strokeOpacity={0.12}
          className="text-foreground"
        />
      ))}

      <motion.g
        initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: springTransition }}
        style={{ transformOrigin: `${center}px ${center}px` }}
      >
        <polygon points={pointsAttr} fill="url(#radarFill)" stroke="rgb(var(--color-accent))" strokeWidth={2} strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.5} fill="rgb(var(--color-accent))" />
        ))}
      </motion.g>

      {valueLabelPositions.map(([x, y], i) => (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-accent text-[9px] font-semibold tabular-nums"
        >
          {values[i]}%
        </text>
      ))}
      {labelPositions.map(([x, y], i) => (
        <text
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[9px] font-medium"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}
