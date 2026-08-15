import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizPage, type GameId } from "@/components/jugar/QuizPage";
import { dictionary } from "@/lib/i18n/dictionary";

const GAME_IDS: readonly GameId[] = [
  "digitSpan",
  "stroop",
  "pathfinder",
  "wordBurst",
  "numberSequence",
  "spatialMemory",
  "quickCompare",
  "reactionCircle",
  "wordTyping",
];

// Server-rendered metadata has no per-request language signal (the language
// toggle is client-only, localStorage-based - see LanguageProvider), so this
// sources the Spanish dictionary directly rather than re-typing the titles
// by hand, matching the rest of app/layout.tsx's Spanish-only metadata.
function gameTitle(gameId: GameId) {
  const { quiz } = dictionary.es;
  return {
    digitSpan: quiz.memoryTitle,
    stroop: quiz.speedTitle,
    pathfinder: quiz.pathfinderTitle,
    wordBurst: quiz.wordBurstTitle,
    numberSequence: quiz.reasoningTitle,
    spatialMemory: quiz.spatialMemoryTitle,
    quickCompare: quiz.quickCompareTitle,
    reactionCircle: quiz.reactionCircleTitle,
    wordTyping: quiz.wordTypingTitle,
  }[gameId];
}

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
  const title = gameTitle(gameId);
  return {
    title: `${title} — IQ.Pulse`,
    description: `Jugá directo a ${title}, sin pasar por la pantalla de selección.`,
  };
}

export default async function JugarGame({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (!isGameId(gameId)) notFound();
  return <QuizPage initialGameId={gameId} />;
}
