"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { fadeSlideUp } from "@/components/landing/motionVariants";

/**
 * Fade + slide-up reveal triggered as a section scrolls into view, reused
 * across both routes so every major section shares the same motion
 * language. Fires once (`viewport.once`) and is skipped entirely when the
 * user prefers reduced motion, matching AnimatedBackground/AnimatedCounter.
 */
export function ScrollReveal({
  children,
  className,
  variants = fadeSlideUp,
  amount = 0.3,
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  amount?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={variants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}
