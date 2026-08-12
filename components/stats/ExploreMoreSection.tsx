"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Cross-links to /ranking and /rendimiento - added after both moved out of
 * this page, which left Panorama as the only content here. Fills the space
 * with something people actually want (discovering the other two pages)
 * instead of invented filler.
 */
export function ExploreMoreSection() {
  const { t } = useLanguage();

  const cards = [
    {
      id: "ranking",
      href: "/ranking",
      Icon: Trophy,
      ...t.stats.exploreMore.ranking,
    },
    {
      id: "performance",
      href: "/rendimiento",
      Icon: TrendingUp,
      ...t.stats.exploreMore.performance,
    },
  ];

  return (
    <section className="w-full max-w-3xl px-4 sm:px-6">
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
        {t.stats.exploreMore.heading}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(({ id, href, Icon, title, body, cta }) => (
          <motion.div key={id} whileHover={{ y: -3 }} whileTap={tapScale} transition={springTransition}>
            <Link href={href} className="block h-full focus-visible:outline-none">
              <GlassCard className="flex h-full flex-col gap-2 rounded-2xl border-0 p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  {cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
