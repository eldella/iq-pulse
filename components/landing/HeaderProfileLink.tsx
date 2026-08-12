"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Quick-access link to /perfil from the header - previously only reachable
 * via a small text link in the Hero. Filled/accent when the demo login flag
 * is on, outline/muted otherwise (the profile page itself handles the
 * logged-out state with its own login prompt, so this never needs to be
 * hidden - just styled differently).
 */
export function HeaderProfileLink() {
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();

  return (
    <motion.div whileHover={{ y: -1 }} whileTap={tapScale} transition={springTransition}>
      <Link
        href="/perfil"
        aria-label={t.profile.headerAriaLabel}
        className={cn(
          "theme-transition flex h-11 w-11 items-center justify-center rounded-full border focus-visible:outline-none",
          isLoggedIn
            ? "border-transparent bg-accent text-accent-foreground shadow-md shadow-accent/40"
            : "border-glass-border bg-glass text-foreground hover:shadow-lg hover:shadow-accent/20"
        )}
      >
        <User className="h-4 w-4" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
