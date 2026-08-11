import Link from "next/link";

/**
 * Minimal shared footer rendered once from app/layout.tsx. Only links to
 * routes that actually exist on this site — no placeholder social/legal
 * links.
 */
export function Footer() {
  return (
    <footer className="border-t border-glass-border px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <span className="text-base font-semibold tracking-tight text-foreground">
          IQ<span className="text-accent">.</span>Pulse
        </span>
        <p className="max-w-md text-sm text-foreground/60">
          Medición cognitiva honesta y de acceso libre, sostenida por quienes
          la usan.
        </p>
        <nav aria-label="Enlaces del pie de página" className="flex items-center gap-4 text-sm">
          <Link
            href="/estadisticas"
            className="rounded text-foreground/70 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
          >
            Ver ranking
          </Link>
          <span aria-hidden="true" className="text-foreground/30">
            ·
          </span>
          <Link
            href="/#sostenimiento"
            className="rounded text-foreground/70 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none"
          >
            Colaborar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
