"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { springTransition, tapScale } from "@/lib/motion";

const emptySubscribe = () => () => {};

/**
 * Light/dark toggle. `resolvedTheme` can already be defined on the very
 * first client render (next-themes reads it before React hydrates), so it
 * can't be used as the "not hydrated yet" signal - that mismatches the
 * server-rendered markup. `useSyncExternalStore` with a snapshot that only
 * flips to `true` on the client gives the same "mounted" flag without an
 * effect-body setState (flagged by react-hooks/set-state-in-effect).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={tapScale}
      transition={springTransition}
      aria-label={
        isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      className="flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-glass backdrop-blur-xl text-foreground focus-visible:outline-none"
    >
      {mounted && isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </motion.button>
  );
}
