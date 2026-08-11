import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/components/legal/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Política de privacidad — IQ.Pulse",
  description: "Cómo maneja IQ.Pulse los datos de quienes visitan el sitio.",
};

export default function Privacidad() {
  return <PrivacyPolicyPage />;
}
