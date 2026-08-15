/**
 * Per-run scratch state for Stroop - StroopGame.tsx remounts on every trial
 * (see the `key` comment on the active-game wrapper in QuizPage.tsx), so
 * neither the fixed button order nor the running congruent/incongruent
 * tally behind the Stroop-cost metric can live in component state. Both
 * need to survive across those remounts for exactly one run, then reset for
 * the next. sessionId (passed down from QuizPage, fresh per handleStart) is
 * the only thing stable across a run's remounts but distinct across runs,
 * so it's the natural key. Deliberately NOT Supabase/localStorage: this is
 * scratch data for the current run's results screen only, gone the moment
 * a new run starts (see terminales/terminal-3-velocidad.txt - "SIN
 * persistir nada nuevo en Supabase").
 */

type StroopTrial = { correct: boolean; responseTimeMs: number; congruent: boolean };

let activeSessionId: string | null = null;
let trials: StroopTrial[] = [];
let order: string[] | null = null;

function resetIfNewSession(sessionId: string) {
  if (activeSessionId === sessionId) return;
  activeSessionId = sessionId;
  trials = [];
  order = null;
}

/** Returns this session's fixed button order, generating it via `shuffleAll` on first call. Falls back to a fresh shuffle every call when sessionId is unavailable. */
export function getStroopOrder(sessionId: string | null, shuffleAll: () => string[]): string[] {
  if (!sessionId) return shuffleAll();
  resetIfNewSession(sessionId);
  if (!order) order = shuffleAll();
  return order;
}

/** Records one trial's outcome for the live Stroop-cost calculation. No-op when sessionId is unavailable. */
export function recordStroopTrial(sessionId: string | null, trial: StroopTrial): void {
  if (!sessionId) return;
  resetIfNewSession(sessionId);
  trials.push(trial);
}

/** Mean RT on correct incongruent trials minus mean RT on correct congruent trials, for this session so far - null until at least one correct answer of each type exists. */
export function getStroopCostMs(sessionId: string | null): number | null {
  if (!sessionId || activeSessionId !== sessionId) return null;
  const correct = trials.filter((trial) => trial.correct);
  const congruentMs = correct.filter((trial) => trial.congruent).map((trial) => trial.responseTimeMs);
  const incongruentMs = correct.filter((trial) => !trial.congruent).map((trial) => trial.responseTimeMs);
  if (congruentMs.length === 0 || incongruentMs.length === 0) return null;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(mean(incongruentMs) - mean(congruentMs));
}
