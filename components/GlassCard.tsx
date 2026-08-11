import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Shared glassmorphism surface: semi-opaque tint UNDER the blur (not blur
 * alone) so text keeps >=4.5:1 contrast in both themes.
 */
export function GlassCard({
  children,
  className,
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Component
      className={clsx(
        "rounded-card border border-glass-border bg-glass backdrop-blur-xl",
        className
      )}
    >
      {children}
    </Component>
  );
}
