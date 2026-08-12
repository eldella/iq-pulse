"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Home, Menu, TrendingUp, Trophy, X, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/** Same icon language as each page's own Emoji3D badge (📊/🏆/📈), just as SVG instead of emoji here. */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/estadisticas": BarChart3,
  "/ranking": Trophy,
  "/rendimiento": TrendingUp,
};

/**
 * Mobile-only nav (sm:hidden, paired with the inline nav which is
 * hidden below sm) - once there were 4 destinations (Inicio, Estadísticas,
 * Ranking, Rendimiento), an inline pill row no longer fit a small header
 * alongside donate/theme/more-menu, so mobile collapses them behind a
 * hamburger trigger instead. Portaled to `document.body` for the same
 * reason as DonationModal/HeaderMoreMenu: Header carries an animated
 * transform for its scroll-hide effect, which breaks plain `position:
 * fixed` children if they're nested inside it.
 */
export function MobileNavMenu({
  navLinks,
}: {
  navLinks: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            role="menu"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
            }}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: springTransition }}
            exit={{ opacity: 0, y: -12, scale: 0.97, transition: springExitTransition }}
            className="fixed inset-x-3 top-[4.25rem] z-40 flex flex-col gap-1.5 rounded-card border border-glass-border bg-glass p-3 shadow-2xl backdrop-blur-xl"
          >
            {navLinks.map(({ href, label }, index) => {
              const isActive = pathname === href;
              const Icon = NAV_ICONS[href] ?? Home;
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: { ...springTransition, delay: index * 0.05 } }}
                >
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex h-14 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-300 focus-visible:outline-none",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        isActive ? "bg-white/15" : "bg-accent/10 text-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        whileHover={{ y: -1 }}
        whileTap={tapScale}
        transition={springTransition}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={isOpen ? t.header.closeMenu : t.header.openMenu}
        className="theme-transition relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-glass text-foreground hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none sm:hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? "close" : "menu"}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={springTransition}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
