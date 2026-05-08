import { useSyncExternalStore } from "react";
import type {
  WinnerAd,
  KbConcept,
  KbInstruction,
  EntityType,
  EntityId,
} from "@/mocks/shared";

/**
 * saved-store — global app store for items the user creates / saves
 * during the session. Cross-app state — surfaces in Catalogue Detail KB
 * tabs + ConceptsLibrary + ContextRail without prop-drilling.
 *
 * Built on useSyncExternalStore (no new deps; same pattern as useV7Shape).
 *
 * Persistence: in-memory for now. localStorage hydration is a follow-up
 * (rehydrating Date objects + user-uploaded thumbnails needs care).
 *
 * Maalik's rule (A-12.24): "jitne winner ads, utne concepts" — every
 * winner ad save automatically derives a matching concept entry. We
 * encode that here so consumers don't need to remember the rule.
 */

interface SavedStore {
  winners: WinnerAd[];
  concepts: KbConcept[];
  instructions: KbInstruction[];
}

let state: SavedStore = { winners: [], concepts: [], instructions: [] };
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): SavedStore {
  return state;
}

/* ─── Mutations ─────────────────────────────────────────── */

/**
 * Save a winner ad. Auto-derives a paired concept (Maalik's 1:1 rule).
 * The derived concept references the winner ad via winnerAdId.
 */
export function addWinnerAd(ad: WinnerAd) {
  const concept: KbConcept = {
    id: `kc-from-${ad.id}`,
    entityType: ad.entityType,
    entityId: ad.entityId,
    winnerAdId: ad.id,
    source: "from-winner-ad",
    name: ad.headline,
    description: ad.description ?? "Saved from Genie",
    visualDirection: ad.description ?? "Derived from winner ad",
    tone: "Auto",
    thumbnail: ad.thumbnail,
    capturedAt: ad.capturedAt,
  };
  state = {
    ...state,
    winners: [...state.winners, ad],
    concepts: [...state.concepts, concept],
  };
  emit();
}

/** Save a standalone concept (e.g. from Industry Insights or manual add). */
export function addConcept(concept: KbConcept) {
  state = { ...state, concepts: [...state.concepts, concept] };
  emit();
}

/** Save a custom instruction. */
export function addInstruction(instruction: KbInstruction) {
  state = { ...state, instructions: [...state.instructions, instruction] };
  emit();
}

/** Reset the store (for tests or "clear session" UI). */
export function resetSavedStore() {
  state = { winners: [], concepts: [], instructions: [] };
  emit();
}

/* ─── Hooks ─────────────────────────────────────────────── */

export function useSavedStore(): SavedStore {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSavedWinnersForEntity(
  entityType: EntityType,
  entityId: EntityId,
): WinnerAd[] {
  const { winners } = useSavedStore();
  return winners.filter(
    (w) => w.entityType === entityType && w.entityId === entityId,
  );
}

export function useSavedConceptsForEntity(
  entityType: EntityType,
  entityId: EntityId,
): KbConcept[] {
  const { concepts } = useSavedStore();
  return concepts.filter(
    (c) => c.entityType === entityType && c.entityId === entityId,
  );
}

export function useSavedInstructionsForEntity(
  entityType: EntityType,
  entityId: EntityId,
): KbInstruction[] {
  const { instructions } = useSavedStore();
  return instructions.filter(
    (i) => i.entityType === entityType && i.entityId === entityId,
  );
}
