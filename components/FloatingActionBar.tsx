"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

/**
 * Persistent floating action pill, fixed to the bottom of the viewport
 * across both routes (rendered once from app/layout.tsx so it survives
 * navigation). Currently a single "Ver stats" action; built so a second
 * "Jugar" pill can be added next to it later, once there's a real quiz flow
 * to link to - not rendering a disabled placeholder now, since that would
 * imply broken functionality rather than a coming feature.
 *
 * Hidden on /estadisticas itself: linking to the page you're already on is
 * dead weight, not a shortcut. Also fades out cleanly once you're near the
 * bottom of the page (footer territory) - it has nothing useful left to
 * float over down there, and would otherwise sit on top of the footer.
 */
export function FloatingActionBar() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll();
  const [nearBottom, setNearBottom] = useState(false);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setNearBottom(latest > 0.94);
  });

  if (pathname === "/estadisticas") return null;

  const hidden = nearBottom;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.9 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y: hidden ? 16 : 0,
        scale: hidden ? 0.92 : 1,
        transition: {
          ...springTransition,
          delay: hasEnteredOnce ? 0 : 0.4,
        },
      }}
      onAnimationComplete={() => {
        if (!hasEnteredOnce) setHasEnteredOnce(true);
      }}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4"
    >
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={tapScale}
        transition={springTransition}
        className={hidden ? "pointer-events-none" : "pointer-events-auto"}
      >
        <Link
          href="/estadisticas"
          className="shine-hover inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl hover:shadow-accent/50 focus-visible:outline-none"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          {t.floatingBar.viewStats}
        </Link>
      </motion.div>
    </motion.div>
  );
}
