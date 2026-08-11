"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { tapScale } from "@/lib/motion";
import { ReactionMicroWidget } from "@/components/landing/ReactionMicroWidget";
import { HOW_IT_WORKS_SECTION_ID } from "@/components/landing/HowItWorks";

/**
 * Snappier local press spring for the hero CTA only, per spec — intentionally
 * different from the app-wide springTransition in lib/motion.ts, so it's
 * kept local instead of changing the shared preset.
 */
const heroCtaSpring = { type: "spring" as const, stiffness: 400, damping: 25 };

function scrollToHowItWorks() {
  document
    .getElementById(HOW_IT_WORKS_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-8 pb-6 pt-6 text-center sm:pt-10">
      <div className="flex max-w-2xl flex-col items-center gap-4">
        <h1 className="text-balance bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl">
          Descubre tu verdadero perfil cognitivo
        </h1>
        <p className="text-balance text-base text-foreground/70 sm:text-lg">
          IQ.Pulse mide tu velocidad de reacción, tu memoria y tu lógica con
          pruebas cortas de pocos minutos, y te muestra cómo te comparás con
          otros jugadores.
        </p>
      </div>

      <ReactionMicroWidget />

      <motion.button
        type="button"
        onClick={scrollToHowItWorks}
        whileHover={{ scale: 1.03 }}
        whileTap={tapScale}
        transition={heroCtaSpring}
        className="group relative flex h-14 min-w-[220px] items-center justify-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-accent opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-90"
        />
        Comenzar Test
        <ArrowRight
          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </motion.button>
    </section>
  );
}
