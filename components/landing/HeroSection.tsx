"use client";

import { motion, useReducedMotion } from "framer-motion";
import { springTransition } from "@/lib/motion";
import { heroTextStagger, heroWordFade } from "@/components/landing/motionVariants";

const HEADLINE = "El límite de tu mente es el primero que nunca cuestionaste.";

/**
 * Purely editorial hero — no widget, no game preview. The headline animates
 * in word-by-word on mount via the shared stagger pattern, then the
 * supporting line fades in once the headline has mostly settled.
 */
export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const words = HEADLINE.split(" ");
  const subheadDelay = shouldReduceMotion ? 0 : words.length * 0.06 + 0.3;

  return (
    <section className="flex flex-col items-center gap-6 px-4 pb-12 pt-20 text-center sm:pt-28">
      <motion.h1
        variants={heroTextStagger}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
      >
        {words.map((word, index) => (
          <motion.span key={`${word}-${index}`} variants={heroWordFade} className="inline-block">
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { ...springTransition, delay: subheadDelay },
        }}
        className="max-w-xl text-balance text-base text-foreground/70 sm:text-lg"
      >
        Construimos IQ.Pulse para que cuestionarlo sea posible: una forma
        honesta de medir, entender y expandir tu potencial cognitivo.
      </motion.p>
    </section>
  );
}
