"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useQuizStore } from "@/store/useQuizStore";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Primary CTA: tactile press animation + a tasteful magnetic hover glow.
 * The single "big" interactive focal element on the landing screen.
 */
export function StartButton() {
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springTransition);
  const springY = useSpring(y, springTransition);

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.2);
    y.set(relY * 0.3);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={startQuiz}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={shouldReduceMotion ? undefined : { x: springX, y: springY }}
      whileTap={tapScale}
      transition={springTransition}
      className="group relative inline-flex h-14 min-w-[220px] items-center justify-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-full bg-accent opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-90"
      />
      Comenzar
      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
    </motion.button>
  );
}
