import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProviderClient } from "@/components/ThemeProviderClient";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IQ.Pulse — Descubre tu perfil cognitivo",
  description:
    "IQ.Pulse mide tu velocidad de reacción, memoria y lógica con pruebas cortas, y te compara con otros jugadores.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProviderClient>{children}</ThemeProviderClient>
      </body>
    </html>
  );
}
