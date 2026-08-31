/**
 * Industry Insights — setup/checklist state store (mock-first, no new
 * Supabase tables). Same localStorage + useSyncExternalStore discipline as
 * src/creative-report-v2/automations/rulesStore.ts (stable cached snapshot
 * reference, defensive sanitization of whatever localStorage hands back,
 * cross-tab 'storage' sync).
 *
 * 4-item checklist (Maalik's Figma pick, wholesale):
 *   1. Follow your industries        — prefsSet
 *   2. Install the Chrome extension  — extensionInstalled
 *   3. Track your first competitor   — competitorAdded
 *   4. Turn on the weekly digest     — digestEnabled
 *
 * The Chrome extension now lives INSIDE the checklist as input #2 — this
 * REVERSES the earlier design where extensionInstalled/extensionDismissed
 * gated a separate post-completion card. There is no "dismissed" state
 * anymore: the checklist just tracks progress, it doesn't gate anything.
 *
 * "Save an ad to a board" has been removed as a step per Maalik's call.
 */
import { useSyncExternalStore } from "react";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";

const KEY = "fabads:insights:setup:v1";

export type InsightsSetupState = {
  prefsSet: boolean;
  extensionInstalled: boolean;
  competitorAdded: boolean;
  digestEnabled: boolean;
  doneCount: number;
  total: number;
  complete: boolean;
};

type PersistedFlags = {
  competitorAddedFlag: boolean;
  extensionInstalled: boolean;
  digestEnabled: boolean;
};

const DEFAULT_FLAGS: PersistedFlags = {
  competitorAddedFlag: false,
  extensionInstalled: false,
  digestEnabled: false,
};

function sanitize(raw: unknown): PersistedFlags {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FLAGS };
  const r = raw as Record<string, unknown>;
  return {
    competitorAddedFlag: r.competitorAddedFlag === true,
    extensionInstalled: r.extensionInstalled === true,
    digestEnabled: r.digestEnabled === true,
  };
}

function readInitial(): PersistedFlags {
  if (typeof window === "undefined") return { ...DEFAULT_FLAGS };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_FLAGS };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

let flags: PersistedFlags = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(flags));
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory flags and
      // don't let a write failure wedge the store.
    }
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): PersistedFlags {
  return flags;
}

// Cross-tab sync — another tab writing KEY should update this tab's store
// without a manual mark* call here.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    flags = readInitial();
    emit();
  });
}

function setFlags(patch: Partial<PersistedFlags>) {
  flags = { ...flags, ...patch };
  persist();
}

export function markCompetitorAdded(): void {
  setFlags({ competitorAddedFlag: true });
}

export function markExtensionInstalled(): void {
  setFlags({ extensionInstalled: true });
}

export function enableWeeklyDigest(): void {
  setFlags({ digestEnabled: true });
}

export function disableWeeklyDigest(): void {
  setFlags({ digestEnabled: false });
}

const EMPTY_FLAGS: PersistedFlags = DEFAULT_FLAGS;

export function useInsightsSetupState(): InsightsSetupState & { loading: boolean } {
  const persisted = useSyncExternalStore(subscribe, snapshot, () => EMPTY_FLAGS);
  const { preferences, isLoading: prefsLoading } = useInsightPreferences();
  const { competitors, isLoading: competitorsLoading } = useInsightCompetitors();

  const prefsSet = !!preferences?.onboarded;
  const extensionInstalled = persisted.extensionInstalled;
  // Self-heals like the old adSaved check did: a workspace that already has
  // a tracked competitor from before this checklist existed must not be
  // told to go add one. The Figma annotation calls the FIRST tracked
  // competitor the activation event (even though its checklist label is
  // step 3), so any competitor already present ticks this immediately.
  const competitorAdded = persisted.competitorAddedFlag || competitors.length > 0;
  const digestEnabled = persisted.digestEnabled;

  const doneCount = [prefsSet, extensionInstalled, competitorAdded, digestEnabled].filter(Boolean).length;
  const total = 4;

  return {
    prefsSet,
    extensionInstalled,
    competitorAdded,
    digestEnabled,
    doneCount,
    total,
    complete: doneCount === total,
    loading: prefsLoading || competitorsLoading,
  };
}
