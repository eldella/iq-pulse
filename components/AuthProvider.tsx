"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

const STORAGE_KEY = "iqpulse-demo-logged-in";
const listeners = new Set<() => void>();

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function setLoggedIn(value: boolean) {
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((notify) => notify());
}

type AuthContextValue = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Demo-only session state - there is no backend, no real accounts, no
 * passwords. "Iniciar sesión" just flips this flag (persisted to
 * localStorage so it survives a refresh) so the logged-in UI can be
 * designed and tested before a real auth provider + database exist. Never
 * treat `isLoggedIn` as actual authentication.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const isLoggedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value: AuthContextValue = {
    isLoggedIn,
    login: () => setLoggedIn(true),
    logout: () => setLoggedIn(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
