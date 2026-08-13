import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function storageKey(monthKey: string): string {
  return `iqpulse-monthly-${monthKey}`;
}

function readSolved(monthKey: string): boolean {
  return window.localStorage.getItem(storageKey(monthKey)) === "true";
}

export function markMonthlyChallengeSolved(monthKey: string) {
  window.localStorage.setItem(storageKey(monthKey), "true");
  listeners.forEach((notify) => notify());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getServerSnapshot(): boolean {
  return false;
}

export function useMonthlyChallengeSolved(monthKey: string): boolean {
  return useSyncExternalStore(subscribe, () => readSolved(monthKey), getServerSnapshot);
}
