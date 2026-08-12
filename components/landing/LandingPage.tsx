import { HeroSection } from "@/components/landing/HeroSection";
import { ManifestoSection } from "@/components/landing/ManifestoSection";
import { DomainsSection } from "@/components/landing/DomainsSection";
import { SustainmentSection } from "@/components/landing/SustainmentSection";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * Purely editorial landing page: hero manifesto headline, creator/mission
 * essay, an icon-forward preview of what IQ.Pulse measures, and the
 * sustainment model with the donation CTA. No game screenshots or full
 * how-it-works walkthrough — that content was deliberately removed, this
 * page's job is to sell the mission, not the quizzes. Header/footer/
 * background are shared chrome from app/layout.tsx.
 */
export function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center">
      <HeroSection />

      <ScrollReveal className="w-full">
        <ManifestoSection />
      </ScrollReveal>

      <ScrollReveal className="w-full">
        <DomainsSection />
      </ScrollReveal>

      <ScrollReveal className="w-full">
        <SustainmentSection />
      </ScrollReveal>
    </main>
  );
}
