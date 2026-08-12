import type { Metadata } from "next";
import { RendimientoPage } from "@/components/rendimiento/RendimientoPage";

export const metadata: Metadata = {
  title: "Rendimiento — IQ.Pulse",
  description: "Comparación de tu rendimiento con los datos generales de IQ.Pulse.",
};

export default function Rendimiento() {
  return <RendimientoPage />;
}
