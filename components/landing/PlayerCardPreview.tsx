import { ShareableCard } from "@/components/ShareableCard";
import type { Archetype, StrengthBadge } from "@/lib/scoring";

/**
 * Static illustrative sample data, only used to preview the shape of the
 * real results card on the landing page. Never wired to store state.
 */
const SAMPLE_ARCHETYPE: Archetype = {
  name: "El Estratega",
  tagline: "Filtra el ruido y encuentra el patrón correcto.",
};

const SAMPLE_STRENGTHS: StrengthBadge[] = [
  { key: "reflejos", label: "Reflejos", value: 78 },
  { key: "memoria", label: "Memoria", value: 84 },
  { key: "enfoque", label: "Enfoque", value: 91 },
];

const SAMPLE_IQ = 128;

/** Landing page preview of the results ShareableCard, reusing it as-is with static sample data plus an "Ejemplo" badge and no export actions. */
export function PlayerCardPreview() {
  return (
    <div className="relative flex w-full max-w-md flex-col items-center">
      <span className="absolute -top-3 right-4 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-lg">
        Ejemplo
      </span>
      <ShareableCard
        iq={SAMPLE_IQ}
        strengths={SAMPLE_STRENGTHS}
        archetype={SAMPLE_ARCHETYPE}
        previewOnly
      />
    </div>
  );
}
