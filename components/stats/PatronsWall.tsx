import { Crown } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

/**
 * Illustrative patron/donor wall — mock pseudonymous names, not real
 * donors. There is no payments backend in this build, this is purely a
 * decorative recognition wall for the design.
 */
const PATRONS = [
  "night_owl",
  "quiet.thinker",
  "reflexo_9",
  "sparkfox",
  "mentat_ok",
  "lu_reflex",
  "sofia.codes",
  "quickdraw",
  "neutrino_84",
  "gris.claro",
  "andar_lento",
  "vector_norte",
] as const;

export function PatronsWall() {
  return (
    <section aria-labelledby="mecenas-heading" className="w-full max-w-4xl">
      <h2 id="mecenas-heading" className="mb-2 text-center text-xl font-semibold text-foreground sm:text-2xl">
        Muro de mecenas
      </h2>
      <p className="mb-6 text-center text-sm text-foreground/60">
        Gracias a quienes colaboran con una donación, IQ.Pulse sigue online.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {PATRONS.map((name) => (
          <GlassCard
            key={name}
            className="flex items-center gap-2 rounded-2xl p-4 ring-1 ring-inset ring-accent/20"
          >
            <Crown className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span className="truncate text-sm font-medium text-foreground/80">{name}</span>
          </GlassCard>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-foreground/40">
        Nombres ilustrativos de ejemplo.
      </p>
    </section>
  );
}
