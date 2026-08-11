import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
  title: "Tu perfil — IQ.Pulse",
  description: "Perfil de demostración de IQ.Pulse.",
};

export default function Perfil() {
  return <ProfilePage />;
}
