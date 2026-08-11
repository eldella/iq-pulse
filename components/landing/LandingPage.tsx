"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { StatsTicker } from "@/components/landing/StatsTicker";
import { LeaderboardPreview } from "@/components/landing/LeaderboardPreview";
import { staggerContainer, fadeSlideUp } from "@/components/landing/motionVariants";

/**
 * Full marketing landing page. Sections reveal in sequence via a
 * staggerChildren parent variant, skipped entirely when the user prefers
 * reduced motion (matches AnimatedBackground/AnimatedCounter elsewhere).
 * No quiz flow, store, or API behind any of this — everything here is
 * either static copy or self-contained local component state.
 */
export function LandingPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col bg-neutral-950">
      <AnimatedBackground />
      <Header />

      <motion.main
        variants={staggerContainer}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        className="flex flex-1 flex-col items-center gap-16 px-4 pb-24 pt-8 sm:px-6"
      >
        <motion.div variants={fadeSlideUp} className="w-full">
          <HeroSection />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="w-full max-w-3xl">
          <HowItWorks />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="w-full max-w-5xl">
          <BentoGrid />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="w-full max-w-3xl">
          <StatsTicker />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="flex w-full justify-center">
          <LeaderboardPreview />
        </motion.div>
      </motion.main>
    </div>
  );
}
