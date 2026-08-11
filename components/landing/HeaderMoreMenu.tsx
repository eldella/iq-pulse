"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, X } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SocialLinks } from "@/components/SocialLinks";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";

const emptySubscribe = () => () => {};

/**
 * Compact header trigger (44x44, matches ThemeToggle) that reveals language
 * + social links in a small animated dropdown, instead of adding several
 * persistent buttons to the header's already-tight mobile row. The panel is
 * portaled to `document.body` for the same reason DonationModal is: Header
 * carries an animated `y` transform for its scroll-hide effect, which would
 * otherwise turn a plain `position: fixed` child into being fixed relative
 * to the header's own box instead of the viewport.
 */
export function HeaderMoreMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
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
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: springTransition }}
            exit={{ opacity: 0, y: -12, scale: 0.95, transition: springExitTransition }}
            className="fixed right-3 top-[4.25rem] z-40 flex flex-col gap-3 rounded-card border border-glass-border bg-glass p-4 shadow-2xl backdrop-blur-xl sm:right-6"
          >
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.social.heading}
              </span>
              <LanguageToggle />
            </div>
            <SocialLinks />
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
        aria-label={t.social.heading}
        className="theme-transition relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-glass text-foreground hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? "close" : "globe"}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={springTransition}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Globe className="h-5 w-5" aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
