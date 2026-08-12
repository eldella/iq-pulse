"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Emoji3D } from "@/components/Emoji3D";
import { RadarChart } from "@/components/jugar/RadarChart";
import { PatternMatrixGame } from "@/components/jugar/games/PatternMatrixGame";
import { DigitSpanGame } from "@/components/jugar/games/DigitSpanGame";
import { StroopGame } from "@/components/jugar/games/StroopGame";
import { startSession, recordAnswer, completeSession } from "@/lib/supabase/quiz";
import { nextDifficulty, type Difficulty, type Domain } from "@/lib/scoring";
import { springTransition, tapScale } from "@/lib/motion";

const QUESTIONS_PER_DOMAIN = 4;
const DOMAIN_ORDER: readonly Domain[] = ["reasoning", "memory", "speed"];

type Phase = "idle" | Domain | "finished";

type DomainStats = { correct: number; answered: number };

/**
 * Core game engine: idle -> sequential reasoning/memory/speed rounds ->
 * finished. One assessment run = the whole sequence, not per-game entry
 * points - keeps the state machine to a single linear flow for this first
 * version instead of an open-ended game picker.
 */
export function QuizPage() {
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [streak, setStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [domainStats, setDomainStats] = useState<Record<Domain, DomainStats>>({
    reasoning: { correct: 0, answered: 0 },
    memory: { correct: 0, answered: 0 },
    speed: { correct: 0, answered: 0 },
  });
  const [result, setResult] = useState<{ iqEstimate: number; percentile: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    try {
      const id = await startSession();
      setSessionId(id);
      setDifficulty("medium");
      setStreak(0);
      setQuestionIndex(0);
      setDomainStats({
        reasoning: { correct: 0, answered: 0 },
        memory: { correct: 0, answered: 0 },
        speed: { correct: 0, answered: 0 },
      });
      setResult(null);
      setPhase("reasoning");
    } catch {
      setError("No se pudo conectar con la base de datos.");
    }
  }

  async function handleAnswer(domain: Domain, isCorrect: boolean, responseTimeMs: number) {
    if (!sessionId) return;

    setDomainStats((prev) => ({
      ...prev,
      [domain]: { correct: prev[domain].correct + (isCorrect ? 1 : 0), answered: prev[domain].answered + 1 },
    }));

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    setDifficulty((current) => nextDifficulty(current, isCorrect, newStreak));

    recordAnswer({ sessionId, domain, isCorrect, responseTimeMs, difficulty }).catch(() => {
      // Non-fatal: the run continues locally even if one write fails.
    });

    const nextIndex = questionIndex + 1;
    if (nextIndex < QUESTIONS_PER_DOMAIN) {
      setQuestionIndex(nextIndex);
      return;
    }

    const currentDomainIndex = DOMAIN_ORDER.indexOf(domain);
    setQuestionIndex(0);
    setStreak(0);
    setDifficulty("medium");

    if (currentDomainIndex < DOMAIN_ORDER.length - 1) {
      setPhase(DOMAIN_ORDER[currentDomainIndex + 1]);
      return;
    }

    try {
      const finalResult = await completeSession(sessionId);
      setResult(finalResult);
    } catch {
      setError("No se pudo calcular el resultado final.");
    }
    setPhase("finished");
  }

  function handleCopyResult() {
    if (!result) return;
    const summary = `IQ.Pulse — CI estimado: ${result.iqEstimate} (percentil ${result.percentile})`;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const domainTitle: Record<Domain, string> = {
    reasoning: t.quiz.reasoningTitle,
    memory: t.quiz.memoryTitle,
    speed: t.quiz.speedTitle,
  };

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-4 py-16 sm:px-6">
      {phase === "idle" && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Emoji3D emoji="🎮" size="lg" className="mb-1" />
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t.hero.play}
          </h1>
          <p className="max-w-md text-balance text-muted-foreground">
            {t.quiz.reasoningTitle} · {t.quiz.memoryTitle} · {t.quiz.speedTitle}
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <motion.button
            type="button"
            onClick={handleStart}
            whileHover={{ y: -2 }}
            whileTap={tapScale}
            transition={springTransition}
            className="shine-hover mt-2 inline-flex h-14 items-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
          >
            <Play className="h-5 w-5" aria-hidden="true" />
            {t.hero.play}
          </motion.button>
        </motion.div>
      )}

      {(phase === "reasoning" || phase === "memory" || phase === "speed") && (
        <motion.div
          key={`${phase}-${questionIndex}`}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="flex w-full max-w-md flex-col items-center gap-6"
        >
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              {domainTitle[phase]}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.quiz.progressLabel} {questionIndex + 1}/{QUESTIONS_PER_DOMAIN}
            </p>
          </div>

          {phase === "reasoning" && (
            <PatternMatrixGame
              difficulty={difficulty}
              onAnswer={(isCorrect, ms) => handleAnswer("reasoning", isCorrect, ms)}
            />
          )}
          {phase === "memory" && (
            <DigitSpanGame
              difficulty={difficulty}
              onAnswer={(isCorrect, ms) => handleAnswer("memory", isCorrect, ms)}
            />
          )}
          {phase === "speed" && (
            <StroopGame
              difficulty={difficulty}
              onAnswer={(isCorrect, ms) => handleAnswer("speed", isCorrect, ms)}
            />
          )}
        </motion.div>
      )}

      {phase === "finished" && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: springTransition }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.quiz.resultsHeading}
          </h1>

          {result && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-6xl font-semibold tracking-tight text-foreground">
                {result.iqEstimate}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.quiz.resultsIqLabel} · {t.quiz.resultsPercentileLabel} {result.percentile}
              </p>
            </div>
          )}

          <RadarChart
            reasoning={Math.round((domainStats.reasoning.correct / Math.max(1, domainStats.reasoning.answered)) * 100)}
            memory={Math.round((domainStats.memory.correct / Math.max(1, domainStats.memory.answered)) * 100)}
            speed={Math.round((domainStats.speed.correct / Math.max(1, domainStats.speed.answered)) * 100)}
            labels={[t.quiz.reasoningTitle, t.quiz.memoryTitle, t.quiz.speedTitle]}
          />

          <p className="max-w-sm text-xs text-muted-foreground">{t.quiz.resultsBody}</p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={handleCopyResult}
              whileHover={{ y: -1 }}
              whileTap={tapScale}
              transition={springTransition}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-glass-border bg-glass px-5 text-sm text-muted-foreground backdrop-blur-xl hover:text-foreground focus-visible:outline-none"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? "✓" : "Copiar"}
            </motion.button>

            <motion.button
              type="button"
              onClick={handleStart}
              whileHover={{ y: -1 }}
              whileTap={tapScale}
              transition={springTransition}
              className="shine-hover inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/30 focus-visible:outline-none"
            >
              {t.quiz.playAgainCta}
            </motion.button>
          </div>

          <Link
            href={isLoggedIn ? "/perfil" : "/rendimiento"}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.quiz.viewProfileCta}
          </Link>
        </motion.div>
      )}
    </main>
  );
}
