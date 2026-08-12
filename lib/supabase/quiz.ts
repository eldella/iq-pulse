import { supabase } from "@/lib/supabase/client";
import {
  normalizeScore,
  scoreAnswer,
  scoreToIQEstimate,
  iqToPercentile,
  type Difficulty,
  type Domain,
} from "@/lib/scoring";

const DOMAINS: readonly Domain[] = ["reasoning", "memory", "speed"];
const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

/**
 * Thin data-access layer over the tables in supabase/schema.sql - kept
 * separate from lib/scoring.ts (which stays pure/UI-agnostic) and from
 * whatever the actual quiz UI ends up being, so both can be built/tested
 * independently of each other.
 */

export async function startSession(userId?: string): Promise<string> {
  const { data, error } = await supabase
    .from("quiz_sessions")
    .insert({ user_id: userId ?? null })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function recordAnswer(params: {
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  difficulty: Difficulty;
}): Promise<void> {
  const { error } = await supabase.from("quiz_answers").insert({
    session_id: params.sessionId,
    question_id: params.questionId,
    is_correct: params.isCorrect,
    response_time_ms: params.responseTimeMs,
    difficulty_at_time: params.difficulty,
  });

  if (error) throw error;
}

/**
 * Reads back every answer for a session, scores it with lib/scoring.ts,
 * and writes the final iq_estimate/percentile/completed_at onto the
 * session row.
 */
export async function completeSession(
  sessionId: string
): Promise<{ iqEstimate: number; percentile: number }> {
  const { data: answers, error: fetchError } = await supabase
    .from("quiz_answers")
    .select("is_correct, response_time_ms, difficulty_at_time")
    .eq("session_id", sessionId);

  if (fetchError) throw fetchError;
  if (!answers || answers.length === 0) {
    throw new Error("Cannot complete a session with no recorded answers.");
  }

  const totalPoints = answers.reduce(
    (sum, answer) =>
      sum +
      scoreAnswer(
        answer.difficulty_at_time as Difficulty,
        answer.is_correct,
        answer.response_time_ms
      ),
    0
  );

  const normalized = normalizeScore(totalPoints, answers.length);
  const iqEstimate = scoreToIQEstimate(normalized);
  const percentile = iqToPercentile(iqEstimate);

  const { error: updateError } = await supabase
    .from("quiz_sessions")
    .update({
      completed_at: new Date().toISOString(),
      iq_estimate: iqEstimate,
      percentile,
    })
    .eq("id", sessionId);

  if (updateError) throw updateError;

  return { iqEstimate, percentile };
}

export async function fetchQuestions(domain: Domain, difficulty: Difficulty) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, prompt, correct_answer")
    .eq("domain", domain)
    .eq("difficulty", difficulty);

  if (error) throw error;
  return data;
}

/**
 * Site-wide averages across every recorded answer - "General" in
 * RendimientoPage. `null` per bucket means no answers exist yet for that
 * domain/difficulty (empty tables today), the caller falls back to the
 * illustrative placeholder in that case rather than showing 0%/0s, which
 * would misleadingly read as "everyone scored zero."
 */
export async function fetchGeneralPerformance(): Promise<{
  precisionByDomain: Record<Domain, number | null>;
  avgTimeByDifficulty: Record<Difficulty, number | null>;
}> {
  const { data, error } = await supabase
    .from("quiz_answers")
    .select("is_correct, response_time_ms, difficulty_at_time, questions(domain)");

  if (error) throw error;

  const precisionByDomain = {} as Record<Domain, number | null>;
  const avgTimeByDifficulty = {} as Record<Difficulty, number | null>;

  for (const domain of DOMAINS) {
    const rows = (data ?? []).filter((row) => row.questions?.[0]?.domain === domain);
    precisionByDomain[domain] =
      rows.length === 0
        ? null
        : Math.round((rows.filter((row) => row.is_correct).length / rows.length) * 100);
  }

  for (const difficulty of DIFFICULTIES) {
    const rows = (data ?? []).filter((row) => row.difficulty_at_time === difficulty);
    avgTimeByDifficulty[difficulty] =
      rows.length === 0
        ? null
        : Math.round(rows.reduce((sum, row) => sum + row.response_time_ms, 0) / rows.length / 1000);
  }

  return { precisionByDomain, avgTimeByDifficulty };
}
