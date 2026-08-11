import type { Metadata } from "next";
import { StatsPage } from "@/components/stats/StatsPage";

export const metadata: Metadata = {
  title: "Estadísticas — IQ.Pulse",
  description:
    "Métricas generales, ranking y mecenas que sostienen IQ.Pulse.",
};

export default function Estadisticas() {
  return <StatsPage />;
}
