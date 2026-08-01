/**
 * Creative Report 2.0 — scheduled digest config (iter-2 P4).
 * Simulated only — there is no real email/Slack send or backend scheduler in
 * this prototype. "Enabled" + a cadence is stored so the settings UI has
 * somewhere to persist to; DigestPreview renders what the next digest WOULD
 * contain, computed live from the same selectors the rest of the module
 * uses (never a fabricated preview).
 */
import { useSyncExternalStore } from "react";

export const DIGEST_CADENCES = ["daily", "weekly"] as const;
export type DigestCadence = (typeof DIGEST_CADENCES)[number];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface DigestConfig {
  enabled: boolean;
  cadence: DigestCadence;
  /** 0=Sun..6=Sat — only meaningful when cadence is "weekly". */
  dayOfWeek: number;
  /** "HH:mm", 24h. */
  time: string;
}

const KEY = "creative-report-v2-digest-config";

const DEFAULT_CONFIG: DigestConfig = { enabled: false, cadence: "weekly", dayOfWeek: 1, time: "09:00" };

function isValidConfig(raw: unknown): raw is DigestConfig {
  if (!raw || typeof raw !== "object") return false;
  const c = raw as DigestConfig;
  return (
    typeof c.enabled === "boolean" &&
    (DIGEST_CADENCES as readonly string[]).includes(c.cadence) &&
    typeof c.dayOfWeek === "number" &&
    c.dayOfWeek >= 0 &&
    c.dayOfWeek <= 6 &&
    typeof c.time === "string" &&
    /^\d{2}:\d{2}$/.test(c.time)
  );
}

function readInitial(): DigestConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return isValidConfig(parsed) ? parsed : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

let config: DigestConfig = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(config));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): DigestConfig {
  return config;
}

export function setDigestConfig(patch: Partial<DigestConfig>) {
  config = { ...config, ...patch };
  persist();
}

export function useDigestConfig(): DigestConfig {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_CONFIG);
}
