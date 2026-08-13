import { useSyncExternalStore } from "react";

export type WeeklyChallengeStatus = "idle" | "success" | "failed";

const listeners = new Set<() => void>();

function storageKey(weekKey: string): string {
  return `iqpulse-weekly-${weekKey}`;
}

function readStatus(weekKey: string): WeeklyChallengeStatus {
  const raw = window.localStorage.getItem(storageKey(weekKey));
  return raw === "success" || raw === "failed" ? raw : "idle";
}

/**
 * One attempt per week - once this week's challenge ends in success or a
 * timeout, it's locked until next week's key rolls over (no local retries
 * this session; same "no server-side cheat defense, low-stakes hobby
 * feature" trust model already accepted elsewhere in this codebase).
 */
export function markWeeklyChallengeResult(weekKey: string, status: "success" | "failed") {
  window.localStorage.setItem(storageKey(weekKey), status);
  listeners.forEach((notify) => notify());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getServerSnapshot(): WeeklyChallengeStatus {
  return "idle";
}

export function useWeeklyChallengeStatus(weekKey: string): WeeklyChallengeStatus {
  return useSyncExternalStore(subscribe, () => readStatus(weekKey), getServerSnapshot);
}
