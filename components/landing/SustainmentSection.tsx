"use client";

import { DonationModal } from "@/components/DonationModal";
import { AmbientBlob } from "@/components/AmbientBlob";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Transparent, non-salesy explanation of how the project stays free. Reuses
 * the shared DonationModal (single source of truth for the donation
 * options/links) but with the "dialog" variant - a centered, scale-in modal
 * - so it reads as a distinct trigger from the header's bottom sheet rather
 * than a duplicate of it.
 */
export function SustainmentSection() {
  const { t } = useLanguage();

  return (
    <section
      id="sostenimiento"
      className="relative mx-auto flex w-full max-w-2xl scroll-mt-20 flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24"
    >
      <AmbientBlob className="-left-24 top-1/4 h-72 w-72" durationSeconds={23} />
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t.sustainment.heading}
      </h2>
      <div className="flex flex-col gap-4 text-base text-muted-foreground sm:text-lg">
        <p>{t.sustainment.p1}</p>
        <p>{t.sustainment.p2}</p>
        <p>{t.sustainment.p3}</p>
      </div>
      <DonationModal variant="dialog" />
    </section>
  );
}
