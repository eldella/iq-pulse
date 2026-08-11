"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonationModal } from "@/components/DonationModal";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/estadisticas", label: "Estadísticas" },
] as const;

/**
 * Shared top bar rendered once from app/layout.tsx: wordmark, route nav,
 * donation trigger, theme toggle. Active route gets a filled pill so the
 * current page is always obvious.
 */
export function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0, transition: springTransition }}
      className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-glass-border bg-glass/80 px-3 py-3 backdrop-blur-xl sm:px-6"
    >
      <Link
        href="/"
        className="rounded-full text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none"
      >
        IQ<span className="text-accent">.</span>Pulse
      </Link>

      <nav aria-label="Principal" className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <motion.div key={href} whileTap={tapScale} transition={springTransition}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none sm:px-4",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <DonationModal />
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
