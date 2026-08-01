/**
 * Overview section visibility — localStorage-backed useSyncExternalStore,
 * same discipline as automations/boards.ts (module-cached state; snapshot()
 * only ever returns the cached ref, never constructs a new object — a
 * getSnapshot that builds fresh on every call white-screens this repo, see
 * that file's header). Replaces the retired ReportWizard: unlike that wizard
 * (which only configured an export snapshot and admitted it didn't touch the
 * screen behind it), toggling a section here actually hides/shows it on
 * Overview.
 *
 * Guardrail: at least one section must always stay on. setSection() refuses
 * a change that would turn the last visible section off, and sanitize()
 * repairs any corrupt/hand-edited JSON that landed on all-false the same way
 * — Overview must never go fully blank with no control left to bring a
 * section back.
 */
import { useSyncExternalStore } from "react";

export type OverviewSectionKey =
  | "buckets"
  | "breakdown"
  | "recommendations"
  | "automations"
  | "velocity";

export type OverviewConfig = Record<OverviewSectionKey, boolean>;

export const OVERVIEW_SECTIONS: { key: OverviewSectionKey; label: string }[] = [
  { key: "buckets", label: "Bucket tabs" },
  { key: "breakdown", label: "Breakdown" },
  { key: "recommendations", label: "Recommendations" },
  { key: "automations", label: "Automations preview" },
  { key: "velocity", label: "Testing velocity" },
];

const KEY = "creative-report-overview-config";

const DEFAULT_STATE: OverviewConfig = {
  buckets: true,
  breakdown: true,
  recommendations: true,
  automations: true,
  velocity: true,
};

function hasAnyOn(config: OverviewConfig): boolean {
  return OVERVIEW_SECTIONS.some((s) => config[s.key]);
}

/** Validate localStorage payloads defensively — corrupt/hand-edited JSON, or
 *  a stray all-false payload, must degrade to the default state rather than
 *  crash or blank the screen. */
function sanitize(raw: unknown): OverviewConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const partial = raw as Partial<Record<OverviewSectionKey, unknown>>;
  const config = { ...DEFAULT_STATE };
  for (const { key } of OVERVIEW_SECTIONS) {
    if (typeof partial[key] === "boolean") config[key] = partial[key] as boolean;
  }
  return hasAnyOn(config) ? config : DEFAULT_STATE;
}

function readInitial(): OverviewConfig {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: OverviewConfig = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): OverviewConfig {
  return state;
}

/** Flip one section on/off. Refuses to turn off the last remaining visible
 *  section — Overview always keeps at least one section rendered. */
export function setSection(key: OverviewSectionKey, visible: boolean) {
  if (state[key] === visible) return;
  const next = { ...state, [key]: visible };
  if (!hasAnyOn(next)) return;
  state = next;
  persist();
}

export function useOverviewConfig(): OverviewConfig {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_STATE);
}
