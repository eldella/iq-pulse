"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { LanguageToggle } from "@/components/LanguageToggle";
import { springTransition } from "@/lib/motion";

/**
 * Mirrors Header's own scroll-hide threshold (not shared state - Header
 * isn't lifted into context, and duplicating this small bit of logic is
 * cheaper than that refactor) so this floats in exactly where
 * HeaderMoreMenu's button sits, fading in only once the header itself has
 * slid away. Rendered as a sibling of Header in layout.tsx, not nested
 * inside it, so it's unaffected by Header's own scroll-hide transform.
 */
export function PersistentLanguageToggle() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (shouldReduceMotion) return;
    const delta = latest - lastScrollY.current;
    if (latest < 80) {
      setHeaderHidden(false);
    } else if (delta > 4) {
      setHeaderHidden(true);
    } else if (delta < -4) {
      setHeaderHidden(false);
    }
    lastScrollY.current = latest;
  });

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: headerHidden ? 1 : 0,
        y: headerHidden ? 0 : -8,
        pointerEvents: headerHidden ? "auto" : "none",
      }}
      transition={springTransition}
      className="fixed right-2.5 top-2.5 z-30 sm:right-6 sm:top-3"
    >
      <LanguageToggle />
    </motion.div>
  );
}
