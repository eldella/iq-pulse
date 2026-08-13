"use client";

import { Crown, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { AmbientBlob } from "@/components/AmbientBlob";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Illustrative patron/donor wall — mock pseudonymous names, not real
 * donors. There is no payments backend in this build, this is purely a
 * decorative recognition wall for the design. `tier: "gold"` marks the
 * illustrative top-contribution bracket so the wall reads as having levels
 * rather than being visually identical entries.
 */
const PATRONS = [
  { name: "night_owl", tier: "standard" },
  { name: "quiet.thinker", tier: "standard" },
  { name: "reflexo_9", tier: "standard" },
  { name: "sparkfox", tier: "standard" },
  { name: "mentat_ok", tier: "gold" },
  { name: "lu_reflex", tier: "standard" },
  { name: "sofia.codes", tier: "gold" },
  { name: "quickdraw", tier: "standard" },
  { name: "neutrino_84", tier: "gold" },
  { name: "gris.claro", tier: "standard" },
  { name: "andar_lento", tier: "standard" },
  { name: "vector_norte", tier: "standard" },
] as const;

export function PatronsWall() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="mecenas-heading" className="relative w-full max-w-6xl">
      <AmbientBlob className="-left-20 bottom-0 h-72 w-72" durationSeconds={25} />
      <div className="flex flex-col items-center">
        <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Heart className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 id="mecenas-heading" className="mb-2 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t.stats.patrons.heading}
        </h2>
      </div>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t.stats.patrons.subhead}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {PATRONS.map(({ name, tier }) => {
          const isGold = tier === "gold";
          return (
            <motion.div
              key={name}
              whileHover={{ scale: 1.03 }}
              whileTap={tapScale}
              transition={springTransition}
              className={cn(isGold && "sm:col-span-2")}
            >
              <GlassCard
                className={cn(
                  "flex items-center gap-3 ring-1 ring-inset",
                  isGold ? "p-7 shadow-accent-lg ring-accent/50" : "p-6 ring-accent/20"
                )}
              >
                {isGold ? (
                  <Crown className="h-7 w-7 shrink-0 text-accent" aria-hidden="true" />
                ) : (
                  <Star className="h-5 w-5 shrink-0 text-foreground/30" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    "truncate font-medium text-muted-foreground",
                    isGold ? "text-xl" : "text-base"
                  )}
                >
                  {name}
                </span>
                {isGold && (
                  <span className="ml-auto shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                    {t.stats.patrons.top}
                  </span>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
