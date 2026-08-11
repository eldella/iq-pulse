"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonationModal } from "@/components/DonationModal";
import { springTransition } from "@/lib/motion";

/**
 * Minimal top bar: wordmark, donation trigger, theme toggle. No nav links —
 * this is a single-section landing page with no other routes to link to.
 */
export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0, transition: springTransition }}
      className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-neutral-950/70 px-4 py-3 backdrop-blur-xl sm:px-6"
    >
      <span className="text-lg font-semibold tracking-tight text-foreground">
        IQ<span className="text-accent">.</span>Pulse
      </span>

      <div className="flex items-center gap-2">
        <DonationModal />
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
