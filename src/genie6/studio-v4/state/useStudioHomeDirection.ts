import { useSyncExternalStore } from "react";

/**
 * Studio HOME layout persistence — mirrors `useStudioLayoutVariant.ts`'s
 * architecture exactly (which itself mirrors `src/auth-v2/shared/
 * useAuthV2Variant.ts`): module-level external store + useSyncExternalStore
 * + localStorage, with cross-tab sync via `storage`.
 *
 * Two directions (Maalik, 2026-09-10, from the two-round Studio-home
 * comparison artifact — HeyGen/Worify language explorations, rebuilt in
 * FabAds' own tokens):
 *   - "toneGrid"      : today's Ad/Trending grid, each live card's
 *                       background tone-washed per `MODE_SCHEME[tone].wash`
 *                       instead of flat white.
 *   - "flagshipSplit" : Ad collapses into one confident panel (badge +
 *                       headline + a compact chip per mode), Trending gets
 *                       its own dashed "nothing shipped yet" shelf.
 *
 * UNLIKE `useStudioLayoutVariant` (a dev-only rail/linear toggle) this one is
 * NOT gated behind `import.meta.env.DEV` — Maalik asked to see both live on
 * the deployed app, not just in local dev, so `StudioHomeDirectionToggle`
 * renders unconditionally. Still persisted per-browser, not a real A/B.
 */
export type StudioHomeDirection = "toneGrid" | "flagshipSplit";

const KEY = "studio-home-direction";
const DEFAULT_DIRECTION: StudioHomeDirection = "toneGrid";

function isValid(v: string | null): v is StudioHomeDirection {
  return v === "toneGrid" || v === "flagshipSplit";
}

function read(): StudioHomeDirection {
  if (typeof window === "undefined") return DEFAULT_DIRECTION;
  const v = window.localStorage.getItem(KEY);
  return isValid(v) ? v : DEFAULT_DIRECTION;
}

let current: StudioHomeDirection = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): StudioHomeDirection {
  return current;
}

function getServerSnapshot(): StudioHomeDirection {
  return DEFAULT_DIRECTION;
}

export function setStudioHomeDirection(next: StudioHomeDirection) {
  if (next === current) return;
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, next);
  }
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    const next = read();
    if (next !== current) {
      current = next;
      emit();
    }
  });
}

export function useStudioHomeDirection() {
  const direction = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    direction,
    setDirection: setStudioHomeDirection,
  };
}
