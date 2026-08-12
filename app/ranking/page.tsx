import type { Metadata } from "next";
import { RankingPage } from "@/components/ranking/RankingPage";

export const metadata: Metadata = {
  title: "Ranking — IQ.Pulse",
  description: "Tabla clasificatoria y reto del mes de IQ.Pulse.",
};

export default function Ranking() {
  return <RankingPage />;
}
