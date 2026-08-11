import { MousePointerClick, BrainCircuit, ListOrdered } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

export const HOW_IT_WORKS_SECTION_ID = "how-it-works";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "1. Jugás 3 minipruebas rápidas",
    description: "Reflejos, memoria y foco, en formato corto y directo.",
  },
  {
    icon: BrainCircuit,
    title: "2. Calculamos tu perfil cognitivo",
    description: "Combinamos tus resultados en un puntaje fácil de leer.",
  },
  {
    icon: ListOrdered,
    title: "3. Te comparás en el ranking",
    description: "Mirá cómo te ubicás frente a otros jugadores.",
  },
] as const;

/**
 * Compact "what is this / why" explainer — answers the context the plain
 * bento grid alone doesn't: who this is for and what happens step by step.
 */
export function HowItWorks() {
  return (
    <section id={HOW_IT_WORKS_SECTION_ID} className="w-full scroll-mt-20">
      <h2 className="mb-6 text-center text-xl font-semibold text-foreground sm:text-2xl">
        Cómo funciona
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }) => (
          <GlassCard key={title} className="flex flex-col items-center gap-2 p-5 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-foreground/60">{description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
