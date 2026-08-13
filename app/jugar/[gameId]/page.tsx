import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizPage, type GameId } from "@/components/jugar/QuizPage";

const GAME_IDS: readonly GameId[] = ["matrix", "digitSpan", "stroop", "pathfinder", "wordBurst"];

const GAME_TITLES: Record<GameId, string> = {
  matrix: "Matriz de patrones",
  digitSpan: "Retención de dígitos",
  stroop: "Stroop",
  pathfinder: "Camino óptimo",
  wordBurst: "Ráfaga de palabras",
};

function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return GAME_IDS.map((gameId) => ({ gameId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  if (!isGameId(gameId)) return {};
  return {
    title: `${GAME_TITLES[gameId]} — IQ.Pulse`,
    description: `Jugá directo a ${GAME_TITLES[gameId]}, sin pasar por la pantalla de selección.`,
  };
}

export default async function JugarGame({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (!isGameId(gameId)) notFound();
  return <QuizPage initialGameId={gameId} />;
}
