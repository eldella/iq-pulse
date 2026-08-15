"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated gradient/aurora background: two large drifting accent blobs, a
 * slow-rotating soft aura for a mesh-gradient feel, and a faint dot-grid
 * texture for depth (ReactBits/Uiverse-style ambient backgrounds). Disabled
 * (frozen) when the user prefers reduced motion - only the static, unmasked
 * dot grid remains, everything else (drift, rotation, the 15s breathing
 * pulse, mask) stops animating/applying.
 */
export function AnimatedBackground() {
  const shouldReduceMotion = useReducedMotion();
  // 15s breathe cycle on the two diagonal light blobs (name's the point -
  // it's called Pulse). Opposite phase between the top-left (blue) and
  // bottom-right (violet) blobs so they don't swell in lockstep.
  const breatheTransition = {
    duration: 15,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "rgb(var(--color-fg))",
          // Radial mask so the grid emerges where the primary (top-left)
          // light is and dissolves outward, instead of reading as flat,
          // uniform texture edge-to-edge.
          maskImage:
            "radial-gradient(125% 105% at 10% 0%, #000 0%, rgba(0,0,0,.42) 42%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(125% 105% at 10% 0%, #000 0%, rgba(0,0,0,.42) 42%, transparent 78%)",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,rgb(var(--color-accent))_0deg,transparent_120deg,rgb(var(--color-accent))_240deg,transparent_360deg)] opacity-[0.12] blur-[90px]"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[60vh] w-[60vh] rounded-full bg-accent/40 blur-[80px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 60, -20, 0],
                y: [0, 40, -30, 0],
                scale: [1, 1.09, 1],
                opacity: [0.86, 1, 0.86],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                x: { duration: 22, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 22, repeat: Infinity, ease: "easeInOut" },
                scale: breatheTransition,
                opacity: breatheTransition,
              }
        }
      />
      {/*
        Diagonal counterweight to the top-left blob above - deliberately
        violet (bg-accent-secondary, decorative-only token, see
        globals.css) instead of reusing accent blue, and deliberately at
        the opposite breathing phase (starts swelled, shrinks) so the two
        lights don't pulse in lockstep.
      */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[55vh] w-[55vh] rounded-full bg-accent-secondary/30 blur-[85px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -50, 20, 0],
                y: [0, -30, 40, 0],
                scale: [1.09, 1, 1.09],
                opacity: [1, 0.86, 1],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                x: { duration: 26, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 26, repeat: Infinity, ease: "easeInOut" },
                scale: breatheTransition,
                opacity: breatheTransition,
              }
        }
      />
      <motion.div
        className="absolute -top-1/4 right-0 h-[38vh] w-[38vh] rounded-full bg-accent/20 blur-[70px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -30, 30, 0],
                y: [0, 25, -25, 0],
                scale: [1, 1.15, 0.95, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/*
        Inline SVG turbulence noise, not a static asset - 0 extra requests.
        Breaks up banding on the large blurred gradients above (worst in
        dark mode, hence the stronger --grain-opacity there). Not tied to
        shouldReduceMotion - it's a static texture, not an animation. Styled
        via the .bg-grain class in globals.css, not Tailwind arbitrary
        values - see the comment there for why.
      */}
      <div className="absolute inset-0 bg-grain" />
    </div>
  );
}
