/**
 * Industry Insights — setup/checklist state store (mock-first, no new
 * Supabase tables). Same localStorage + useSyncExternalStore discipline as
 * src/creative-report-v2/automations/rulesStore.ts (stable cached snapshot
 * reference, defensive sanitization of whatever localStorage hands back,
 * cross-tab 'storage' sync).
 */
import { useSyncExternalStore } from "react";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightBoards } from "@/hooks/use-insight-boards";

const KEY = "fabads:insights:setup:v1";

export type InsightsSetupState = {
  prefsSet: boolean;
  competitorAdded: boolean;
  adSaved: boolean;
  doneCount: number;
  total: number;
  complete: boolean;
  extensionInstalled: boolean;
  extensionDismissed: boolean;
};

type PersistedFlags = {
  adSavedFlag: boolean;
  competitorAddedFlag: boolean;
  extensionInstalled: boolean;
  extensionDismissed: boolean;
};

const DEFAULT_FLAGS: PersistedFlags = {
  adSavedFlag: false,
  competitorAddedFlag: false,
  extensionInstalled: false,
  extensionDismissed: false,
};

function sanitize(raw: unknown): PersistedFlags {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FLAGS };
  const r = raw as Record<string, unknown>;
  return {
    adSavedFlag: r.adSavedFlag === true,
    competitorAddedFlag: r.competitorAddedFlag === true,
    extensionInstalled: r.extensionInstalled === true,
    extensionDismissed: r.extensionDismissed === true,
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

export function markAdSaved(): void {
  setFlags({ adSavedFlag: true });
}

export function markCompetitorAdded(): void {
  setFlags({ competitorAddedFlag: true });
}

export function markExtensionInstalled(): void {
  setFlags({ extensionInstalled: true });
}

export function dismissExtensionNudge(): void {
  setFlags({ extensionDismissed: true });
}

const EMPTY_FLAGS: PersistedFlags = DEFAULT_FLAGS;

export function useInsightsSetupState(): InsightsSetupState & { loading: boolean } {
  const persisted = useSyncExternalStore(subscribe, snapshot, () => EMPTY_FLAGS);
  const { preferences, isLoading: prefsLoading } = useInsightPreferences();
  const { competitors, isLoading: competitorsLoading } = useInsightCompetitors();
  const { boards, isLoading: boardsLoading } = useInsightBoards();

  const prefsSet = !!preferences?.onboarded;
  // The hook returns DB rows only — the page component's FALLBACK_COMPETITORS
  // are UI-only mock data, never reflected here, so this stays truthful for
  // a genuinely new user with nothing tracked yet.
  const competitorAdded = persisted.competitorAddedFlag || competitors.length > 0;
  // Self-heals like competitorAdded: a user who already has ads on a board
  // from before this checklist existed must not be told to go save one. The
  // boards query already embeds insight_board_items(count), so this reads
  // existing data rather than adding a query.
  const adSaved =
    persisted.adSavedFlag ||
    boards.some((b) => {
      const embedded = (b as { insight_board_items?: unknown })
        .insight_board_items;
      const count = Array.isArray(embedded)
        ? (embedded[0] as { count?: number } | undefined)?.count
        : undefined;
      return typeof count === "number" && count > 0;
    });

  const doneCount = [prefsSet, competitorAdded, adSaved].filter(Boolean).length;
  const total = 3;

  return {
    prefsSet,
    competitorAdded,
    adSaved,
    doneCount,
    total,
    complete: doneCount === total,
    extensionInstalled: persisted.extensionInstalled,
    extensionDismissed: persisted.extensionDismissed,
    loading: prefsLoading || competitorsLoading || boardsLoading,
  };
}
