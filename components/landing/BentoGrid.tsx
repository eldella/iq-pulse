import { Zap, Brain, SplitSquareHorizontal, Grid3x3 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

const BENTO_ITEMS = [
  {
    icon: Zap,
    title: "Reacción",
    description: "Medí qué tan rápido respondés a un estímulo visual.",
    available: true,
  },
  {
    icon: Brain,
    title: "Memoria Numérica",
    description: "Retené y repetí secuencias cada vez más largas.",
    available: true,
  },
  {
    icon: SplitSquareHorizontal,
    title: "Conflicto Stroop",
    description: "Ignorá el ruido y respondé al color, no a la palabra.",
    available: true,
  },
  {
    icon: Grid3x3,
    title: "Razonamiento Matricial",
    description: "Encontrá el patrón que completa la secuencia.",
    available: false,
  },
] as const;

/**
 * Marketing preview of the quiz's stages. The first three map to real,
 * working mini-games (see components/games/*). "Razonamiento Matricial" has
 * no implementation anywhere in the codebase yet — it's rendered visually
 * consistent with the others but in a disabled, non-interactive
 * "Próximamente" state rather than pretending it's playable.
 */
export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BENTO_ITEMS.map(({ icon: Icon, title, description, available }) => (
        <GlassCard
          key={title}
          className={`relative flex flex-col gap-3 p-5 ${available ? "" : "opacity-60"}`}
        >
          {!available && (
            <span className="absolute right-3 top-3 rounded-full bg-glass-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
              Próximamente
            </span>
          )}
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-glass backdrop-blur-xl">
            <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
          </span>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-foreground/60">{description}</p>
        </GlassCard>
      ))}
    </div>
  );
}
