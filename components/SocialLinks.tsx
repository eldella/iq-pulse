"use client";

import { FaDiscord, FaGithub, FaInstagram, FaTiktok } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { springTransition, tapScale } from "@/lib/motion";

const LINKS = [
  { key: "github", Icon: FaGithub, href: "https://github.com/eldella/iq-pulse", comingSoon: false },
  // TODO: replace with the real Instagram profile URL
  { key: "instagram", Icon: FaInstagram, href: "#", comingSoon: false },
  // TODO: replace with the real TikTok profile URL
  { key: "tiktok", Icon: FaTiktok, href: "#", comingSoon: false },
  { key: "discord", Icon: FaDiscord, href: "#", comingSoon: true },
] as const;

/**
 * Social icon row - GitHub/Instagram/TikTok link out (placeholder hrefs
 * until real profiles exist), Discord is visually present but marked
 * "soon" and non-interactive since there's no server yet to link to.
 */
export function SocialLinks() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      {LINKS.map(({ key, Icon, href, comingSoon }) => {
        const label = t.social[key];
        return (
          <motion.a
            key={key}
            href={comingSoon ? undefined : href}
            target={comingSoon ? undefined : "_blank"}
            rel={comingSoon ? undefined : "noopener noreferrer"}
            aria-disabled={comingSoon || undefined}
            aria-label={comingSoon ? `${label} (${t.social.soon})` : label}
            whileHover={comingSoon ? undefined : { y: -2 }}
            whileTap={comingSoon ? undefined : tapScale}
            transition={springTransition}
            className={
              comingSoon
                ? "relative flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border border-glass-border bg-glass text-muted-foreground/40 backdrop-blur-xl"
                : "relative flex h-11 w-11 items-center justify-center rounded-full border border-glass-border bg-glass text-muted-foreground backdrop-blur-xl transition-shadow duration-300 hover:text-foreground hover:shadow-lg hover:shadow-accent/20 focus-visible:outline-none"
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {comingSoon && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                {t.social.soon}
              </span>
            )}
          </motion.a>
        );
      })}
    </div>
  );
}
