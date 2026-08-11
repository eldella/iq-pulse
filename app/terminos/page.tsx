import type { Metadata } from "next";
import { TermsOfServicePage } from "@/components/legal/TermsOfServicePage";

export const metadata: Metadata = {
  title: "Términos de servicio — IQ.Pulse",
  description: "Condiciones de uso de IQ.Pulse.",
};

export default function Terminos() {
  return <TermsOfServicePage />;
}
