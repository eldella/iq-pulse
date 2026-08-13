"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { springTransition, tapScale } from "@/lib/motion";
import { heroTextStagger, heroWordFade } from "@/components/landing/motionVariants";
import { AmbientBlob } from "@/components/AmbientBlob";
import { DistributionCurve } from "@/components/viz/DistributionCurve";
import { PulseTrace } from "@/components/viz/PulseTrace";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Purely editorial hero — no widget, no game preview. The headline animates
 * in word-by-word on mount via the shared stagger pattern, then the
 * supporting line fades in once the headline has mostly settled. A primary
 * CTA follows, pointing at /ranking: the quiz engine was removed in a prior
 * reset, so the leaderboard is the closest real, functional destination —
 * this is the honest "start here" action rather than a fake test flow.
 */
export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const { isLoggedIn, login } = useAuth();
  const { t } = useLanguage();
  const words = t.hero.headline.split(" ");
  const subheadDelay = shouldReduceMotion ? 0 : words.length * 0.06 + 0.3;
  const ctaDelay = shouldReduceMotion ? 0 : subheadDelay + 0.15;
  const ctaHoverLift = shouldReduceMotion ? undefined : { y: -3 };

  return (
    <section className="relative flex flex-col items-center gap-6 px-4 pb-12 pt-20 text-center sm:pt-28">
      <AmbientBlob className="-top-16 left-1/2 h-72 w-72 -translate-x-1/2" durationSeconds={24} />
      <PulseTrace
        variant="ambient"
        className="absolute -top-4 left-1/2 h-16 w-[36rem] max-w-[90vw] -translate-x-1/2"
      />
      <DistributionCurve size="lg" />
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
        className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
      >
        {t.hero.subhead}
      </motion.p>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { ...springTransition, delay: ctaDelay },
        }}
        className="mt-2 flex flex-col items-center gap-4"
      >
        {isLoggedIn ? (
          <motion.div whileHover={ctaHoverLift} whileTap={tapScale} className="inline-block">
            <Link
              href="/jugar"
              className="shine-hover inline-flex h-14 min-w-[44px] items-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-accent-md transition-shadow duration-300 hover:shadow-accent-lg focus-visible:outline-none"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              {t.hero.play}
            </Link>
          </motion.div>
        ) : (
          <motion.div whileHover={ctaHoverLift} whileTap={tapScale} className="inline-block">
            <Link
              href="/ranking"
              className="shine-hover inline-flex h-14 min-w-[44px] items-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-accent-md transition-shadow duration-300 hover:shadow-accent-lg focus-visible:outline-none"
            >
              {t.hero.viewRanking}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        <div className="flex items-center gap-4 text-sm">
          {isLoggedIn ? (
            <>
              <Link
                href="/ranking"
                className="rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
              >
                {t.hero.viewRanking}
              </Link>
              <span aria-hidden="true" className="text-foreground/30">
                ·
              </span>
              <Link
                href="/perfil"
                className="rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
              >
                {t.hero.viewProfile}
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
            >
              {t.hero.login}
            </button>
          )}
        </div>

        {!isLoggedIn && (
          <p className="text-xs text-muted-foreground/70">{t.hero.demoNote}</p>
        )}
      </motion.div>
    </section>
  );
}
