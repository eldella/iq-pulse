import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProviderClient } from "@/components/ThemeProviderClient";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/Footer";
import { FloatingActionBar } from "@/components/FloatingActionBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IQ.Pulse — Explorá el límite de tu mente",
  description:
    "IQ.Pulse es una iniciativa independiente y de acceso libre para medir y entender el potencial cognitivo, sostenida por donaciones voluntarias.",
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
                <div className="flex flex-1 flex-col">{children}</div>
                <Footer />
                <FloatingActionBar />
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
