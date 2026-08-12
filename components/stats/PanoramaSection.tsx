"use client";

import { useState } from "react";
import { Moon, RefreshCw, Scale } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";

/**
 * Same IQ brackets/percentages as the old MetricsPanel distribution bars
 * (already close to the real normal-distribution proportions for a
 * mean-100/SD-15 scale), now framed as clickable markers on a bell curve
 * instead of a bar list - each one reveals what that bracket actually means
 * instead of just a raw percentage.
 */
const MARKERS = [
  { id: "m1", label: "< 85", percent: 14, x: 70, y: 118 },
  { id: "m2", label: "85–100", percent: 34, x: 150, y: 66 },
  { id: "m3", label: "100–115", percent: 34, x: 250, y: 66 },
  { id: "m4", label: "115–130", percent: 14, x: 330, y: 118 },
  { id: "m5", label: "> 130", percent: 4, x: 385, y: 136 },
] as const;

/** Decorative bell-curve silhouette (illustrative, not a plotted function). */
function BellCurve({ selectedX }: { selectedX: number }) {
  return (
    <svg viewBox="0 0 400 150" className="h-32 w-full sm:h-40" aria-hidden="true">
      <path
        d="M 15 140 C 80 140 130 20 200 20 C 270 20 320 140 385 140"
        fill="none"
        stroke="rgb(var(--color-accent))"
        strokeOpacity={0.5}
        strokeWidth={2}
      />
      <motion.line
        animate={{ x1: selectedX, x2: selectedX }}
        transition={springTransition}
        y1={10}
        y2={140}
        stroke="rgb(var(--color-accent))"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
    </svg>
  );
}

export function PanoramaSection() {
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<number>(2);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const descriptions = [
    t.stats.panorama.marker1,
    t.stats.panorama.marker2,
    t.stats.panorama.marker3,
    t.stats.panorama.marker4,
    t.stats.panorama.marker5,
  ];

  const factors = [
    { id: "sleep", Icon: Moon, ...t.stats.panorama.factor1 },
    { id: "memory", Icon: Scale, ...t.stats.panorama.factor2 },
    { id: "fluctuation", Icon: RefreshCw, ...t.stats.panorama.factor3 },
  ];

  const myths = [
    { id: "fixed", ...t.stats.panorama.myth1 },
    { id: "general", ...t.stats.panorama.myth2 },
    { id: "exact", ...t.stats.panorama.myth3 },
  ];

  return (
    <section
      aria-labelledby="panorama-heading"
      className="relative w-full py-20 sm:py-24"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
            {t.stats.panorama.eyebrow}
          </p>
          <h2
            id="panorama-heading"
            className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl"
          >
            {t.stats.panorama.heading}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-balance text-base text-muted-foreground">
            {t.stats.panorama.subhead}
          </p>
        </div>

        {/* Interactive bell curve */}
        <div className="mt-12">
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
            {t.stats.panorama.curveHeading}
          </p>
          <BellCurve selectedX={MARKERS[selected].x} />
          <div
            role="tablist"
            aria-label={t.stats.panorama.curveHeading}
            className="mt-2 grid grid-cols-5 gap-1"
          >
            {MARKERS.map((marker, index) => (
              <motion.button
                key={marker.id}
                type="button"
                role="tab"
                aria-selected={selected === index}
                onClick={() => setSelected(index)}
                whileHover={{ y: -1 }}
                whileTap={tapScale}
                transition={springTransition}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center transition-colors duration-300 focus-visible:outline-none ${
                  selected === index
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs font-semibold">{marker.label}</span>
                <span className="text-[11px]">{marker.percent}%</span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={selected}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: springTransition }}
              exit={{ opacity: 0, y: -6, transition: springExitTransition }}
              className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground"
            >
              {descriptions[selected]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Cognitive factors */}
        <div className="mt-16">
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            {t.stats.panorama.factorsHeading}
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {factors.map(({ id, Icon, title, body }) => (
              <motion.div
                key={id}
                whileHover={{ y: -4 }}
                whileTap={tapScale}
                transition={springTransition}
              >
                <GlassCard className="flex h-full flex-col items-center gap-2 rounded-2xl border-0 p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Myths vs facts */}
        <div className="mt-16">
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            {t.stats.panorama.mythsHeading}
          </p>
          <div className="flex flex-col gap-3">
            {myths.map(({ id, myth, reality }) => {
              const isRevealed = Boolean(revealed[id]);
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() =>
                    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
                  }
                  whileHover={{ y: -1 }}
                  whileTap={tapScale}
                  transition={springTransition}
                  aria-expanded={isRevealed}
                  className="w-full rounded-2xl border border-glass-border bg-glass px-5 py-4 text-left backdrop-blur-xl transition-shadow duration-300 hover:shadow-lg focus-visible:outline-none"
                >
                  <p className="text-sm font-medium text-foreground">{myth}</p>
                  {!isRevealed && (
                    <span className="mt-1 inline-block text-xs text-muted-foreground underline-offset-4">
                      {t.stats.panorama.revealCta}
                    </span>
                  )}
                  {/*
                    The classic height:0->auto accordion recipe: a tween
                    (not a spring) on `height`, isolated in its own element
                    with overflow hidden so the inner text doesn't clip
                    mid-transition. A spring here (as tried before) looks
                    uneven because springs overshoot toward a measured pixel
                    target instead of settling directly like a tween does -
                    that's what read as "hard"/instant rather than smooth.
                  */}
                  <AnimatePresence initial={false}>
                    {isRevealed && (
                      <motion.div
                        key="reality"
                        initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <p className="mt-2 text-sm leading-relaxed text-accent">{reality}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
