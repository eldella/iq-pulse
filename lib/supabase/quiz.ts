import { supabase } from "@/lib/supabase/client";
import {
  normalizeScore,
  scoreAnswer,
  scoreToIQEstimate,
  iqToPercentile,
  type Difficulty,
} from "@/lib/scoring";

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

export async function fetchQuestions(domain: "reasoning" | "memory" | "speed", difficulty: Difficulty) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, prompt, correct_answer")
    .eq("domain", domain)
    .eq("difficulty", difficulty);

  if (error) throw error;
  return data;
}
