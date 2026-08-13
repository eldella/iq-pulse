const DEVICE_ID_KEY = "iqpulse-device-id";
const ALIAS_KEY = "iqpulse-alias";

const ALIAS_ADJECTIVES = [
  "quiet",
  "quick",
  "night",
  "sharp",
  "calm",
  "swift",
  "bright",
  "steady",
  "keen",
  "silent",
] as const;

const ALIAS_NOUNS = [
  "owl",
  "fox",
  "lynx",
  "raven",
  "wolf",
  "hawk",
  "otter",
  "heron",
  "falcon",
  "badger",
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Stable anonymous identity for the (real, Supabase-backed) daily challenge
 * ranking - no login screen, no account. This is deliberately separate from
 * AuthProvider's demo `isLoggedIn` flag, which is explicitly fake and never
 * tied to real data; mixing the two would mean "logging out" of the demo
 * could look like it resets real progress it never actually touches.
 * Per-device only: the same person on a different browser/device gets a
 * different id and a fresh alias, same tradeoff every localStorage-based
 * identity on this site already makes (auth, theme, language).
 */
export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export function getAlias(): string {
  const existing = window.localStorage.getItem(ALIAS_KEY);
  if (existing) return existing;

  const alias = `${pick(ALIAS_ADJECTIVES)}_${pick(ALIAS_NOUNS)}`;
  window.localStorage.setItem(ALIAS_KEY, alias);
  return alias;
}
