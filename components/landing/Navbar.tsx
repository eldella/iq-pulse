"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonationModal } from "@/components/DonationModal";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Landing page top bar: wordmark, a jump link to the on-page leaderboard
 * preview, the existing donation trigger, and the theme toggle. Reuses
 * `DonationModal` and `ThemeToggle` as-is rather than rebuilding them.
 */
export function Navbar({ onLeaderboardClick }: { onLeaderboardClick: () => void }) {
  return (
    <nav className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-glass-border bg-glass px-4 py-3 backdrop-blur-xl sm:px-6">
      <span className="text-lg font-semibold tracking-tight text-foreground">
        IQ<span className="text-accent">.</span>Pulse
      </span>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <motion.button
          type="button"
          onClick={onLeaderboardClick}
          whileTap={tapScale}
          transition={springTransition}
          className="flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-sm font-medium text-foreground/80 backdrop-blur-xl hover:text-foreground focus-visible:outline-none"
        >
          <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className="hidden sm:inline">Ranking</span>
        </motion.button>
        <DonationModal />
        <ThemeToggle />
      </div>
    </nav>
  );
}
