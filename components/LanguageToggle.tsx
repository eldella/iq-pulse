"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Compact ES/EN switch, same footprint and visual language as ThemeToggle
 * so the two sit naturally side by side in the header. The language code
 * flips with a rotateX + fade instead of an instant text swap.
 */
export function LanguageToggle() {
  const { lang, t, toggleLang } = useLanguage();

  return (
    <motion.button
      type="button"
      onClick={toggleLang}
      whileHover={{ y: -1 }}
      whileTap={tapScale}
      transition={springTransition}
      aria-label={t.languageToggle.switchTo}
      className="theme-transition relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-glass text-sm font-semibold text-foreground hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={lang}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={springTransition}
          className="absolute inset-0 flex items-center justify-center uppercase tracking-wide"
        >
          {lang}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
