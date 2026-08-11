"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Copy, Check, Download, Sparkles, Zap, Brain, Target } from "lucide-react";
import { springTransition, tapScale } from "@/lib/motion";
import type { Archetype, StrengthBadge } from "@/lib/scoring";

const STAT_ROWS: { key: StrengthBadge["key"]; label: string; icon: typeof Zap }[] = [
  { key: "reflejos", label: "Reacción", icon: Zap },
  { key: "memoria", label: "Memoria", icon: Brain },
  { key: "enfoque", label: "Lógica", icon: Target },
];

/**
 * Shareable results snapshot: archetype, estimated IQ, and a stat
 * breakdown. Always rendered with the dark glass recipe (spec: "Apple-style
 * glass card, dark mode") regardless of the site's active theme, since it's
 * meant to be exported as a standalone image via html-to-image.
 */
export function ShareableCard({
  iq,
  strengths,
  archetype,
  previewOnly = false,
}: {
  iq: number;
  strengths: StrengthBadge[];
  archetype: Archetype;
  /** When true, hides the copy/download actions — used for the landing page's static preview, where there's nothing real to export. */
  previewOnly?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isDownloading, setIsDownloading] = useState(false);

  const byKey = new Map(strengths.map((s) => [s.key, s]));

  function statValue(key: StrengthBadge["key"]): number {
    return Math.round(byKey.get(key)?.value ?? 0);
  }

  function buildSummaryText(): string {
    const reaccion = statValue("reflejos");
    const memoria = statValue("memoria");
    const logica = statValue("enfoque");
    return `🧠 Mi CI estimado: ${iq} — Arquetipo: ${archetype.name} ⚡ Reacción: ${reaccion}% 🧩 Memoria: ${memoria}% 🎯 Lógica: ${logica}%`;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  async function handleDownload() {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "mi-perfil-mental.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // Export failures shouldn't break the results screen.
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="flex w-full flex-col items-center gap-4 rounded-card border border-white/[0.08] bg-[rgba(28,28,30,0.6)] p-8 text-center backdrop-blur-xl"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/5">
          <Sparkles className="h-5 w-5 text-[#8B7CF6]" aria-hidden="true" />
        </span>

        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">
            Arquetipo Mental
          </p>
          <h3 className="text-2xl font-semibold text-white">{archetype.name}</h3>
          <p className="mt-1 text-sm text-white/60">{archetype.tagline}</p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs uppercase tracking-wide text-white/50">CI estimado</p>
          <p className="text-4xl font-bold text-[#8B7CF6]">{iq}</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          {STAT_ROWS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-1 rounded-card border border-white/[0.08] bg-white/5 p-3"
            >
              <Icon className="h-4 w-4 text-[#8B7CF6]" aria-hidden="true" />
              <span className="text-xs text-white/60">{label}</span>
              <span className="text-sm font-semibold text-white">
                {statValue(key)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {!previewOnly && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <motion.button
            type="button"
            onClick={handleCopy}
            whileTap={tapScale}
            transition={springTransition}
            className="flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl focus-visible:outline-none"
          >
            {copyState === "copied" ? (
              <>
                <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copiar resumen
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            whileTap={isDownloading ? undefined : tapScale}
            transition={springTransition}
            className="flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {isDownloading ? "Generando..." : "Descargar imagen"}
          </motion.button>
        </div>
      )}

      {!previewOnly && copyState === "error" && (
        <p role="alert" className="text-xs text-red-500">
          No se pudo copiar. Probá de nuevo.
        </p>
      )}
    </div>
  );
}
