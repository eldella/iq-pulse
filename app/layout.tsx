import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProviderClient } from "@/components/ThemeProviderClient";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/Footer";
import { PersistentLanguageToggle } from "@/components/PersistentLanguageToggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const title = "IQ.Pulse — Explorá el límite de tu mente";
const description =
  "IQ.Pulse es una iniciativa independiente y de acceso libre para medir y entender el potencial cognitivo, sostenida por donaciones voluntarias.";

export const metadata: Metadata = {
  // Falls back to localhost until a real production domain exists - set
  // NEXT_PUBLIC_SITE_URL once this is actually deployed somewhere permanent,
  // otherwise Open Graph image URLs resolve against the wrong origin.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "IQ.Pulse",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProviderClient>
          <LanguageProvider>
            <AuthProvider>
              {/*
                No bg-background here on purpose: body already paints it (see
                globals.css). A background on this wrapper would be an in-flow
                box that paints AFTER (on top of) the fixed, negative-z-index
                AnimatedBackground layer, hiding it completely - fixed+z-index
                always forms its own stacking context, so it paints at the
                "negative child stacking context" step, which is earlier than a
                plain in-flow descendant's own background.
              */}
              <div className="relative flex min-h-screen flex-col">
                <AnimatedBackground />
                <ScrollProgressBar />
                <Header />
                <PersistentLanguageToggle />
                <div className="flex flex-1 flex-col">{children}</div>
                <Footer />
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
