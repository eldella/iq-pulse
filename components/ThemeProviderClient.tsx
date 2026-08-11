"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * next-themes needs a Client Component boundary. Kept as a thin leaf so
 * app/layout.tsx can stay a Server Component.
 */
export function ThemeProviderClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
