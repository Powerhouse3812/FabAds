import { useSyncExternalStore } from "react";
import type { Launch2Variant } from "../types";

/**
 * Launch 2.0 home variant — dev-only toggle (Maalik), hidden from end users.
 * Mirrors the genie6 external-store pattern (module-level source of truth +
 * useSyncExternalStore) so every consumer stays in sync, HMR-safe.
 *
 * NOTE: only "mission" (Mission Control / genie-style) is implemented today.
 * "ops" and "launchpad" are wired but build after Mission Control is finalized.
 */

const VARIANT_KEY = "launch2-home-variant";
const DEFAULT_VARIANT: Launch2Variant = "mission";

const VALID: Launch2Variant[] = ["mission", "ops", "launchpad"];

export const VARIANT_META: Record<Launch2Variant, { label: string; hint: string; built: boolean }> = {
  mission: { label: "Mission Control", hint: "Studio-style hub", built: true },
  ops: { label: "Ops Console", hint: "Dense, table-first", built: false },
  launchpad: { label: "Launchpad", hint: "Editorial-minimal (bespoke)", built: false },
};

export const VARIANT_CYCLE: Launch2Variant[] = ["mission", "ops", "launchpad"];

function readFromStorage(): Launch2Variant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY) as Launch2Variant | null;
  return v && VALID.includes(v) ? v : DEFAULT_VARIANT;
}

let current: Launch2Variant = readFromStorage();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): Launch2Variant {
  return current;
}

function getServerSnapshot(): Launch2Variant {
  return DEFAULT_VARIANT;
}

export function setLaunch2Variant(next: Launch2Variant) {
  if (next === current) return;
  current = next;
  if (typeof window !== "undefined") window.localStorage.setItem(VARIANT_KEY, next);
  emit();
}

export function cycleLaunch2Variant() {
  const i = VARIANT_CYCLE.indexOf(current);
  setLaunch2Variant(VARIANT_CYCLE[(i + 1) % VARIANT_CYCLE.length]);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== VARIANT_KEY) return;
    const next = readFromStorage();
    if (next !== current) {
      current = next;
      emit();
    }
  });
}

export function useLaunch2Variant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { variant, setVariant: setLaunch2Variant, cycle: cycleLaunch2Variant };
}
