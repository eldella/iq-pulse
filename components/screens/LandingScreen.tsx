"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { LiveStatsTicker } from "@/components/landing/LiveStatsTicker";
import { PlayerCardPreview } from "@/components/landing/PlayerCardPreview";
import { LeaderboardExpress } from "@/components/landing/LeaderboardExpress";
import { staggerContainer, fadeSlideUp } from "@/components/landing/motionVariants";

const LEADERBOARD_SECTION_ID = "leaderboard-express";

function scrollToLeaderboard() {
  document
    .getElementById(LEADERBOARD_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Full marketing landing page. Sections reveal in sequence via a
 * staggerChildren parent variant (skipped entirely when the user prefers
 * reduced motion, matching the pattern already used across the app — see
 * AnimatedBackground/StartButton/AnimatedCounter).
 */
export function LandingScreen() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Navbar onLeaderboardClick={scrollToLeaderboard} />

      <motion.main
        variants={staggerContainer}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        className="flex flex-1 flex-col items-center gap-16 px-4 pb-24 pt-8 sm:px-6"
      >
        <motion.div variants={fadeSlideUp} className="w-full">
          <HeroSection />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="w-full max-w-5xl">
          <BentoGrid />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="w-full max-w-3xl">
          <LiveStatsTicker />
        </motion.div>

        <motion.div variants={fadeSlideUp} className="flex w-full justify-center">
          <PlayerCardPreview />
        </motion.div>

        <motion.section
          id={LEADERBOARD_SECTION_ID}
          variants={fadeSlideUp}
          className="flex w-full scroll-mt-20 justify-center"
        >
          <LeaderboardExpress />
        </motion.section>
      </motion.main>
    </div>
  );
}
