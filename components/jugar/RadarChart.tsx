"use client";

/**
 * Minimal 3-axis radar/spider chart (reasoning/memory/speed precision, 0-100
 * each) - hand-rolled SVG, same "no charting library" convention as the
 * Sparkline/bar patterns used elsewhere on the site.
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
  const center = 100;
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
    center + (radius + 22) * Math.cos(angle),
    center + (radius + 22) * Math.sin(angle),
  ]);

  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
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
      <polygon
        points={pointsAttr}
        fill="rgb(var(--color-accent) / 0.25)"
        stroke="rgb(var(--color-accent))"
        strokeWidth={2}
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="rgb(var(--color-accent))" />
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
