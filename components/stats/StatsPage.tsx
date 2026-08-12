"use client";

import { PanoramaSection } from "@/components/stats/PanoramaSection";
import { ExploreMoreSection } from "@/components/stats/ExploreMoreSection";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Emoji3D } from "@/components/Emoji3D";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Fully static/mock stats page — general cognitive-science "Panorama".
 * The leaderboard/challenge moved to /ranking, the personal-vs-general
 * performance breakdown moved to /rendimiento, and the patron wall moved to
 * the landing page (next to the donation CTA it's thematically tied to) -
 * each easy to miss buried at the bottom of this page's scroll.
 */
export function StatsPage() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-1 flex-col items-center gap-8 py-16">
      <div className="relative flex flex-col items-center gap-3 px-4 text-center sm:px-6">
        <Emoji3D emoji="📊" size="lg" className="mb-1" />
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t.stats.heading}
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          {t.stats.subhead}
        </p>
      </div>

      <ScrollReveal className="w-full">
        <PanoramaSection />
      </ScrollReveal>

      <ScrollReveal className="flex w-full justify-center">
        <ExploreMoreSection />
      </ScrollReveal>

      <p className="px-4 text-center text-[11px] text-muted-foreground sm:px-6">
        {t.stats.footnote}
      </p>
    </main>
  );
}
