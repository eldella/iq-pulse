import { useSyncExternalStore } from "react";

const STORAGE_KEY = "iqpulse-daily-training";
const listeners = new Set<() => void>();

/** Daily challenge = 3 games (matches FULL_ASSESSMENT in QuizPage.tsx). */
export const DAILY_TARGET_COUNT = 3;

type StoredState = {
  completedDate: string;
  completedIds: string[];
  streak: number;
  lastStreakDate: string | null;
};

const EMPTY_STATE: StoredState = {
  completedDate: "",
  completedIds: [],
  streak: 0,
  lastStreakDate: null,
};

const EMPTY_IDS: readonly string[] = [];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local (not UTC) YYYY-MM-DD key, so "today" matches the player's own day. */
function dateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readStored(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_STATE;
  }
}

function writeStored(state: StoredState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  invalidateIdsCache();
  listeners.forEach((notify) => notify());
}

/** Today's completed ids, or [] if the stored set belongs to an earlier day. */
function effectiveCompletedIds(stored: StoredState, today: string): string[] {
  return stored.completedDate === today ? stored.completedIds : [];
}

/**
 * The streak survives an unplayed *today* (grace period - it only resets once
 * a full day has been skipped with nothing played), so this checks whether
 * the last day the target was hit was today or yesterday.
 */
function effectiveStreak(stored: StoredState, today: string, yesterday: string): number {
  if (stored.lastStreakDate === today || stored.lastStreakDate === yesterday) {
    return stored.streak;
  }
  return 0;
}

/**
 * Marks one of today's daily games as completed. Only called from the
 * official "Iniciar desafío diario" flow (see QuizPage's `isDailyRun`) - a
 * standalone practice-card play of the same game does not call this, so the
 * counter can't be inflated by replaying games outside the daily flow.
 */
export function markGameCompleted(gameId: string) {
  const today = dateKey();
  const yesterday = dateKey(-1);
  const stored = readStored();
  const currentIds = effectiveCompletedIds(stored, today);
  if (currentIds.includes(gameId)) return;

  const nextIds = [...currentIds, gameId];
  const justCompleted = currentIds.length < DAILY_TARGET_COUNT && nextIds.length >= DAILY_TARGET_COUNT;
  const currentStreak = effectiveStreak(stored, today, yesterday);

  writeStored({
    completedDate: today,
    completedIds: nextIds,
    streak: justCompleted ? currentStreak + 1 : currentStreak,
    lastStreakDate: justCompleted ? today : stored.lastStreakDate,
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", handleStorageEvent);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

/** Cross-tab sync: another tab wrote to localStorage, so drop our cache too. */
function handleStorageEvent() {
  invalidateIdsCache();
  listeners.forEach((notify) => notify());
}

function getStreakSnapshot(): number {
  const stored = readStored();
  return effectiveStreak(stored, dateKey(), dateKey(-1));
}

function getServerSnapshotZero(): number {
  return 0;
}

// Cached array reference, only rebuilt when the underlying data actually
// changes (on write, or a cross-tab storage event) or the day rolls over.
// useSyncExternalStore requires getSnapshot to return a stable reference
// when nothing changed - a freshly-built array every render call would
// break that (and produce a console warning) even when its contents are
// identical, so this caches instead of computing fresh each call.
let cachedIds: readonly string[] = EMPTY_IDS;
let cachedIdsDate = "";

function invalidateIdsCache() {
  cachedIdsDate = "";
}

function getCompletedIdsSnapshot(): readonly string[] {
  const today = dateKey();
  if (cachedIdsDate !== today) {
    cachedIds = effectiveCompletedIds(readStored(), today);
    cachedIdsDate = today;
  }
  return cachedIds;
}

function getServerSnapshotIds(): readonly string[] {
  return EMPTY_IDS;
}

export function useDailyStreak(): number {
  return useSyncExternalStore(subscribe, getStreakSnapshot, getServerSnapshotZero);
}

/** Today's completed game ids - check `.includes(gameId)` per card. */
export function useCompletedIdsToday(): readonly string[] {
  return useSyncExternalStore(subscribe, getCompletedIdsSnapshot, getServerSnapshotIds);
}

export function useDailyTraining() {
  const streak = useDailyStreak();
  const completedIds = useCompletedIdsToday();
  return {
    streak,
    completedCount: completedIds.length,
    completedIds,
    isDoneToday: completedIds.length >= DAILY_TARGET_COUNT,
  };
}
