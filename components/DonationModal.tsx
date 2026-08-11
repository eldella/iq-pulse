"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, ExternalLink, Wallet, X } from "lucide-react";
import { springTransition, springExitTransition, tapScale } from "@/lib/motion";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

const DONATION_OPTIONS = [
  {
    label: "PayPal",
    icon: Wallet,
    href: "https://www.paypal.com/paypalme/aledellabianca",
  },
  {
    label: "Ko-fi",
    icon: ExternalLink,
    href: "https://ko-fi.com/eldella",
  },
] as const;

type DonationModalVariant = "sheet" | "dialog";

/**
 * Donation trigger with the overlay rendered through a portal into
 * `document.body`. Two instances exist (header + sustainment section); the
 * header's is nested inside `motion.header`, which carries an animated `y`
 * transform for the scroll-hide effect. Any CSS transform on an ancestor
 * turns `position: fixed` descendants into being fixed relative to THAT
 * ancestor's box instead of the viewport - so without the portal, opening
 * the header's donation trigger rendered the backdrop/sheet pinned to the
 * header's own (tiny, top-of-page) box, unclickable and visually broken.
 * Portaling to `document.body` escapes every transformed ancestor, so both
 * triggers behave identically regardless of where they're mounted.
 */
export function DonationModal({
  variant = "sheet",
  compactOnMobile = false,
}: {
  variant?: DonationModalVariant;
  compactOnMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: springTransition }}
            exit={{ opacity: 0, transition: springExitTransition }}
            onClick={() => setIsOpen(false)}
          />

          {variant === "sheet" ? (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.donation.title}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: springTransition }}
              exit={{ y: "100%", transition: springExitTransition }}
              className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md rounded-t-sheet border border-b-0 border-glass-border bg-glass p-6 pb-8 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:rounded-sheet sm:border-b"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15 sm:hidden" />
              <DonationModalBody onClose={() => setIsOpen(false)} />
            </motion.div>
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.donation.title}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: springTransition }}
              exit={{ opacity: 0, scale: 0.92, y: 12, transition: springExitTransition }}
              className="fixed inset-0 z-40 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-sm rounded-card border border-glass-border bg-glass p-6 shadow-2xl backdrop-blur-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <DonationModalBody onClose={() => setIsOpen(false)} />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        whileHover={{ y: -1 }}
        whileTap={tapScale}
        transition={springTransition}
        aria-label={t.donation.title}
        className={cn(
          "shine-hover inline-flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-glass-border bg-glass text-sm text-muted-foreground backdrop-blur-xl transition-shadow duration-300 hover:text-foreground hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none",
          compactOnMobile ? "px-3 sm:px-4" : "px-4"
        )}
      >
        <Coffee className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <span className={compactOnMobile ? "hidden sm:inline" : undefined}>
          {t.donation.trigger}
        </span>
      </motion.button>

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}

function DonationModalBody({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t.donation.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.donation.subtitle}
          </p>
        </div>
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={tapScale}
          transition={springTransition}
          aria-label={t.donation.close}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </motion.button>
      </div>

      <div className="flex flex-col gap-2">
        {DONATION_OPTIONS.map(({ label, icon: Icon, href }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            whileTap={tapScale}
            transition={springTransition}
            className="shine-hover flex h-12 min-w-[44px] items-center gap-3 rounded-card border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl transition-shadow duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none"
          >
            <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
            {label}
          </motion.a>
        ))}
      </div>
    </>
  );
}
