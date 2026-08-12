"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { DonationModal } from "@/components/DonationModal";
import { HeaderMoreMenu } from "@/components/landing/HeaderMoreMenu";
import { HeaderProfileLink } from "@/components/landing/HeaderProfileLink";
import { MobileNavMenu } from "@/components/landing/MobileNavMenu";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Shared top bar rendered once from app/layout.tsx: wordmark, route nav,
 * donation trigger, profile link, and the "more" overflow menu (theme,
 * language, social). Active route gets a filled pill so the current page is
 * always obvious. Theme/language live inside HeaderMoreMenu rather than as
 * their own persistent buttons - keeps the mobile actions row to 3 items
 * even after adding the profile link.
 */
export function Header() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const navLinks = [
    { href: "/", label: t.header.nav.home },
    { href: "/ranking", label: t.header.nav.ranking },
    { href: "/rendimiento", label: t.header.nav.performance },
  ] as const;
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
    if (shouldReduceMotion) return;
    const delta = latest - lastScrollY.current;
    if (latest < 80) {
      setHidden(false);
    } else if (delta > 4) {
      setHidden(true);
    } else if (delta < -4) {
      setHidden(false);
    }
    lastScrollY.current = latest;
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y: hidden ? "-100%" : 0,
        transition: springTransition,
      }}
      className={cn(
        "theme-transition sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1.5 border-b px-2.5 py-2.5 backdrop-blur-xl sm:gap-x-3 sm:px-6 sm:py-3",
        scrolled
          ? "border-glass-border bg-glass shadow-sm shadow-black/5 dark:shadow-black/20"
          : "border-transparent bg-glass/60"
      )}
    >
      <Link
        href="/"
        className="group shrink-0 justify-self-start rounded-full text-base font-semibold tracking-tight text-foreground focus-visible:outline-none sm:text-lg"
      >
        IQ
        <motion.span
          className="inline-block text-accent"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          .
        </motion.span>
        Pulse
      </Link>

      <div className="flex min-w-0 items-center justify-self-center">
        {/*
          4 destinations no longer fit as inline pills in a compact mobile
          header alongside donate/theme/more-menu - desktop keeps the
          inline row (hidden below sm), mobile collapses it behind
          MobileNavMenu's hamburger trigger instead of shrinking further.
        */}
        <nav
          aria-label={t.header.navAriaLabel}
          className="hidden items-center gap-0.5 sm:flex sm:gap-1"
        >
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <motion.div
                key={href}
                whileHover={{ y: -1 }}
                whileTap={tapScale}
                transition={springTransition}
              >
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors duration-300 focus-visible:outline-none",
                    isActive
                      ? "text-accent-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="header-active-pill"
                      transition={springTransition}
                      className="absolute inset-0 rounded-full bg-accent shadow-md shadow-accent/40"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <MobileNavMenu navLinks={navLinks} />
      </div>

      <div className="flex shrink-0 items-center justify-self-end gap-1 sm:gap-2">
        <DonationModal compactOnMobile />
        <HeaderProfileLink />
        <HeaderMoreMenu />
      </div>
    </motion.header>
  );
}
