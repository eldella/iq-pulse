"use client";

import { useId, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

const emptySubscribe = () => () => {};

/** 8 sun rays at 45° increments around the body circle (center 12,12). */
const RAYS = [
  { x1: 19, y1: 12, x2: 21, y2: 12 },
  { x1: 16.95, y1: 16.95, x2: 18.36, y2: 18.36 },
  { x1: 12, y1: 19, x2: 12, y2: 21 },
  { x1: 7.05, y1: 16.95, x2: 5.64, y2: 18.36 },
  { x1: 5, y1: 12, x2: 3, y2: 12 },
  { x1: 7.05, y1: 7.05, x2: 5.64, y2: 5.64 },
  { x1: 12, y1: 5, x2: 12, y2: 3 },
  { x1: 16.95, y1: 7.05, x2: 18.36, y2: 5.64 },
] as const;

/**
 * Light/dark toggle. `resolvedTheme` can already be defined on the very
 * first client render (next-themes reads it before React hydrates), so it
 * can't be used as the "not hydrated yet" signal - that mismatches the
 * server-rendered markup. `useSyncExternalStore` with a snapshot that only
 * flips to `true` on the client gives the same "mounted" flag without an
 * effect-body setState (flagged by react-hooks/set-state-in-effect).
 *
 * The icon itself is a single custom SVG rather than a Sun/Moon cross-fade:
 * an SVG `<mask>` circle slides over the body circle to "eclipse" it into a
 * crescent, while the rays retract and fade - one shape morphing into the
 * other, not two icons swapping.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const maskId = useId();
  const { t } = useLanguage();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileHover={{ y: -1 }}
      whileTap={tapScale}
      transition={springTransition}
      aria-label={isDark ? t.themeToggle.toLight : t.themeToggle.toDark}
      className="theme-transition flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        aria-hidden="true"
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            r={4.4}
            cy={8.5}
            fill="black"
            initial={false}
            animate={{ cx: isDark ? 15.5 : 26 }}
            transition={springTransition}
          />
        </mask>

        <motion.g
          animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? -35 : 0 }}
          style={{ transformOrigin: "12px 12px" }}
          transition={springTransition}
        >
          {RAYS.map((ray) => (
            <line
              key={`${ray.x1}-${ray.y1}`}
              {...ray}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </motion.g>

        <motion.circle
          cx={12}
          cy={12}
          r={5}
          fill="currentColor"
          mask={`url(#${maskId})`}
          animate={{ rotate: isDark ? -35 : 0 }}
          style={{ transformOrigin: "12px 12px" }}
          transition={springTransition}
        />
      </svg>
    </motion.button>
  );
}
