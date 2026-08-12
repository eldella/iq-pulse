"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Award, LogOut, User } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { RankBadge } from "@/components/RankBadge";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Demo profile - only reachable in a meaningful state once `login()` (a
 * client-only flag, see AuthProvider) has been triggered from the hero.
 * The stats shown here are illustrative, same as everywhere else on the
 * stats page - there's no real account or backend behind this yet.
 */
export function ProfilePage() {
  const { isLoggedIn, login, logout } = useAuth();
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.profile.backHome}
      </Link>

      {isLoggedIn ? (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="mt-8 flex flex-col items-center gap-8 text-center"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
              <User className="h-9 w-9" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-semibold text-foreground">demo_user</p>
              <p className="text-sm text-muted-foreground">{t.profile.demoNote}</p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 divide-x divide-black/10 dark:divide-white/10">
            <div className="flex flex-col items-center gap-1 px-4 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {t.profile.iqEstimate}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                <AnimatedCounter value={108} />
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 px-4 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {t.profile.rank}
              </p>
              <RankBadge rank={4} />
            </div>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-glass-border bg-glass px-5 py-4 text-left backdrop-blur-xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Award className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                {t.profile.badgeHeading}
              </p>
              <p className="text-sm font-medium text-foreground">{t.profile.badgeTitle}</p>
              <p className="text-xs text-muted-foreground">{t.profile.badgeBody}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Link
              href="/ranking"
              className="flex h-11 items-center justify-between rounded-xl px-3 text-sm text-muted-foreground transition-colors duration-300 hover:bg-white/5 hover:text-foreground focus-visible:outline-none"
            >
              {t.profile.viewRankingCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/rendimiento"
              className="flex h-11 items-center justify-between rounded-xl px-3 text-sm text-muted-foreground transition-colors duration-300 hover:bg-white/5 hover:text-foreground focus-visible:outline-none"
            >
              {t.profile.viewPerformanceCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <motion.button
            type="button"
            onClick={logout}
            whileHover={{ y: -1 }}
            whileTap={tapScale}
            transition={springTransition}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-glass-border bg-glass px-5 text-sm text-muted-foreground backdrop-blur-xl transition-shadow duration-300 hover:text-foreground hover:shadow-lg focus-visible:outline-none"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t.profile.logout}
          </motion.button>
        </motion.div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-semibold text-foreground">
            {t.profile.loggedOutTitle}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t.profile.loggedOutBody}
          </p>
          <motion.button
            type="button"
            onClick={login}
            whileHover={{ y: -1 }}
            whileTap={tapScale}
            transition={springTransition}
            className="shine-hover inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
          >
            {t.profile.login}
          </motion.button>
        </div>
      )}
    </main>
  );
}
