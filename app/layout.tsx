import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProviderClient } from "@/components/ThemeProviderClient";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/Footer";
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
          <div className="relative flex min-h-screen flex-col bg-background">
            <AnimatedBackground />
            <Header />
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
          </div>
        </ThemeProviderClient>
      </body>
    </html>
  );
}
