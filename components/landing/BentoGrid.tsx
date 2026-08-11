import { Zap, Brain, SplitSquareHorizontal, Grid3x3 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const BENTO_ITEMS = [
  {
    icon: Zap,
    title: "Reacción",
    description: "Medí qué tan rápido respondés a un estímulo visual.",
  },
  {
    icon: Brain,
    title: "Memoria Numérica",
    description: "Retené y repetí secuencias cada vez más largas.",
  },
  {
    icon: SplitSquareHorizontal,
    title: "Conflicto Stroop",
    description: "Ignorá el ruido y respondé al color, no a la palabra.",
  },
  {
    icon: Grid3x3,
    title: "Razonamiento Matricial",
    description: "Encontrá el patrón que completa la secuencia.",
  },
] as const;

/**
 * Purely informational preview of the four mini-games — there is no quiz
 * flow behind these cards anymore, so they are non-interactive by design
 * (no links to routes that don't exist).
 */
export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BENTO_ITEMS.map(({ icon: Icon, title, description }) => (
        <GlassCard key={title} className="flex flex-col gap-3 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
          </span>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-foreground/60">{description}</p>
        </GlassCard>
      ))}
    </div>
  );
}
