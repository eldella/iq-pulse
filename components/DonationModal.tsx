"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Heart, ExternalLink } from "lucide-react";
import { Modal } from "@/components/Modal";
import { springTransition, tapScale } from "@/lib/motion";

const DONATION_OPTIONS = [
  {
    label: "Mercado Pago",
    icon: Heart,
    // TODO: replace with real donation link
    href: "#",
  },
  {
    label: "Buy Me a Coffee",
    icon: Coffee,
    // TODO: replace with real donation link
    href: "#",
  },
  {
    label: "Ko-fi",
    icon: ExternalLink,
    // TODO: replace with real donation link
    href: "#",
  },
] as const;

export function DonationModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileTap={tapScale}
        transition={springTransition}
        className="inline-flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-glass-border bg-glass px-4 text-sm text-foreground/70 backdrop-blur-xl hover:text-foreground focus-visible:outline-none"
      >
        <Coffee className="h-4 w-4 text-accent" aria-hidden="true" />
        Invitar un café
      </motion.button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Invitar un café">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Invitar un café
        </h2>
        <p className="mb-6 text-sm text-foreground/70">
          Si te gustó el quiz, podés apoyar el proyecto por cualquiera de
          estas vías.
        </p>
        <div className="flex flex-col gap-3">
          {DONATION_OPTIONS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 min-w-[44px] items-center gap-3 rounded-card border border-glass-border bg-glass px-4 text-sm font-medium text-foreground backdrop-blur-xl focus-visible:outline-none"
            >
              <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
              {label}
            </a>
          ))}
        </div>
      </Modal>
    </>
  );
}
