"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Thin accent line pinned to the very top of the viewport (above the header,
 * z-50) that fills left-to-right with scroll progress. Rendered as its own
 * fixed element rather than nested inside Header so it stays visible even
 * while the header auto-hides on scroll-down - it's the one piece of
 * constant feedback while reading.
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-accent"
      style={{ scaleX: shouldReduceMotion ? scrollYProgress : smoothProgress }}
    />
  );
}
