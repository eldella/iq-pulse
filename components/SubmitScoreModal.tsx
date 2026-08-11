"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { springTransition, tapScale } from "@/lib/motion";
import type { LeaderboardEntry } from "@/lib/types";

const MIN_ALIAS_LENGTH = 3;
const MAX_ALIAS_LENGTH = 12;

function validateAlias(alias: string): string | null {
  const trimmed = alias.trim();
  if (trimmed.length === 0) return "Escribí un alias para continuar.";
  if (trimmed.length < MIN_ALIAS_LENGTH || trimmed.length > MAX_ALIAS_LENGTH) {
    return `El alias debe tener entre ${MIN_ALIAS_LENGTH} y ${MAX_ALIAS_LENGTH} caracteres.`;
  }
  return null;
}

export function SubmitScoreModal({
  isOpen,
  onClose,
  score,
  iq,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  iq: number;
  onSuccess: (entry: LeaderboardEntry) => void;
}) {
  const [alias, setAlias] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEntry, setCreatedEntry] = useState<LeaderboardEntry | null>(null);

  const validationError = touched ? validateAlias(alias) : null;
  const isInvalid = validateAlias(alias) !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (isInvalid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: alias.trim(), score, iq }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "No se pudo guardar el puntaje.");
        return;
      }

      setCreatedEntry(data.entry as LeaderboardEntry);
      onSuccess(data.entry as LeaderboardEntry);
    } catch {
      setSubmitError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    onClose();
    // Reset once the close animation has had time to run.
    setTimeout(() => {
      setAlias("");
      setTouched(false);
      setSubmitError(null);
      setCreatedEntry(null);
    }, 300);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Guardar mi puntaje">
      {createdEntry ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-accent" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">
            ¡Puntaje guardado!
          </h2>
          <p className="text-sm text-foreground/70">
            {createdEntry.alias} ya aparece en la tabla de posiciones.
          </p>
          <motion.button
            type="button"
            onClick={handleClose}
            whileTap={tapScale}
            transition={springTransition}
            className="mt-2 h-11 min-w-[44px] rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground focus-visible:outline-none"
          >
            Ver tabla de posiciones
          </motion.button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Guardar mi puntaje
            </h2>
            <p className="text-sm text-foreground/70">
              Elegí un alias para aparecer en la tabla de posiciones.
            </p>
          </div>

          <div>
            <label htmlFor="alias-input" className="mb-1 block text-sm text-foreground/70">
              Alias
            </label>
            <input
              id="alias-input"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? "alias-error" : undefined}
              maxLength={MAX_ALIAS_LENGTH}
              className="h-12 w-full rounded-card border border-glass-border bg-transparent px-4 text-foreground focus-visible:outline-none"
              placeholder="Ej: Nova92"
            />
            {validationError && (
              <p id="alias-error" role="alert" className="mt-1 text-xs text-red-500">
                {validationError}
              </p>
            )}
          </div>

          {submitError && (
            <p role="alert" className="text-xs text-red-500">
              {submitError}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={isInvalid || isSubmitting}
            whileTap={isInvalid || isSubmitting ? undefined : tapScale}
            transition={springTransition}
            className="h-12 min-w-[44px] rounded-full bg-accent px-6 font-medium text-accent-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar puntaje"}
          </motion.button>
        </form>
      )}
    </Modal>
  );
}
