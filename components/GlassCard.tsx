import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared glassmorphism surface: semi-opaque tint UNDER the blur (not blur
 * alone) so text keeps >=4.5:1 contrast in both themes. `variant="plain"`
 * drops the border for callers that want a borderless card (previously done
 * ad hoc with a trailing `border-0` in className, which only worked because
 * clsx concatenation happened to place it last — cn()/twMerge resolves the
 * conflict properly regardless of class order).
 */
export function GlassCard({
  children,
  className,
  variant = "bordered",
}: {
  children: ReactNode;
  className?: string;
  variant?: "bordered" | "plain";
}) {
  return (
    <div
      className={cn(
        "theme-transition rounded-card bg-glass backdrop-blur-xl",
        variant === "bordered" && "border border-glass-border",
        className
      )}
    >
      {children}
    </div>
  );
}
