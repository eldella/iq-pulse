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
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonationModal } from "@/components/DonationModal";
import { HeaderMoreMenu } from "@/components/landing/HeaderMoreMenu";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Shared top bar rendered once from app/layout.tsx: wordmark, route nav,
 * donation trigger, theme toggle. Active route gets a filled pill so the
 * current page is always obvious.
 */
export function Header() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const navLinks = [
    { href: "/", label: t.header.nav.home },
    { href: "/estadisticas", label: t.header.nav.stats },
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
        "theme-transition sticky top-0 z-20 flex items-center justify-between gap-x-1.5 border-b px-2.5 py-2.5 backdrop-blur-xl sm:gap-x-3 sm:px-6 sm:py-3",
        scrolled
          ? "border-glass-border bg-glass shadow-sm shadow-black/5 dark:shadow-black/20"
          : "border-transparent bg-glass/60"
      )}
    >
      <Link
        href="/"
        className="group shrink-0 rounded-full text-base font-semibold tracking-tight text-foreground focus-visible:outline-none sm:text-lg"
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

      <nav aria-label="Principal" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
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
                  "relative flex h-11 items-center whitespace-nowrap rounded-full px-2 text-sm font-medium transition-colors duration-300 focus-visible:outline-none sm:px-4",
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

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <DonationModal compactOnMobile />
        <ThemeToggle />
        <HeaderMoreMenu />
      </div>
    </motion.header>
  );
}
