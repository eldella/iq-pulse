import type { Metadata } from "next";
import { QuizPage } from "@/components/jugar/QuizPage";

export const metadata: Metadata = {
  title: "Jugar — IQ.Pulse",
  description: "El test cognitivo de IQ.Pulse: razonamiento, memoria y velocidad.",
};

export default function Jugar() {
  return <QuizPage />;
}
