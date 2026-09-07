import { useMemo, useSyncExternalStore } from "react";
import type {
  WinnerAd,
  KbConcept,
  KbInstruction,
  EntityType,
  EntityId,
  Product,
  BrandId,
} from "@/mocks/shared";
// Seed Winner Ads — value import (not just the type above). The cap and the
// live counter both have to count these alongside session-saved ones, or
// "8 / 50" on GenieBrain and the cap actually blocking at 50 would disagree
// with each other, which is the exact defect this file exists to close.
import { WINNER_ADS } from "@/mocks/shared";

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
  /** A-12.42: products added via Brand-Detail "Add product". Surface in
   *  global /catalogue/products grid + on the brand's Products tab. */
  products: Product[];
  /**
   * A-12.192: IDs the user has explicitly dismissed (soft-deleted). Works
   * for BOTH seed-mock items (which can't be mutated in place) and
   * session-saved items — filtering at the consumer's render time hides
   * them uniformly. Persistence is in-memory; refresh restores them.
   */
  dismissedIds: string[];
}

let state: SavedStore = {
  winners: [],
  concepts: [],
  instructions: [],
  products: [],
  dismissedIds: [],
};
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

/**
 * The real ceiling on Winner Ads is an account-wide total — FabFunnel's 8
 * seed rows (`WINNER_ADS`) PLUS whatever's been saved this session, minus
 * anything dismissed. This is the ONE place that total is computed: both
 * the cap check in `addWinnerAd` and the live "N / 50" counter GenieBrain
 * renders (via `useAllWinnerAds`) call this, so they can't disagree.
 */
function computeActiveWinnerAds(winners: WinnerAd[], dismissedIds: string[]): WinnerAd[] {
  const dismissed = new Set(dismissedIds);
  const sessionIds = new Set(winners.map((w) => w.id));
  const seedActive = WINNER_ADS.filter((w) => !dismissed.has(w.id) && !sessionIds.has(w.id));
  const sessionActive = winners.filter((w) => !dismissed.has(w.id));
  return [...seedActive, ...sessionActive];
}

/** Hard ceiling on total Winner Ads (seed + session, minus removed). Shown
 *  in GenieBrain's capacity panel and enforced by `addWinnerAd` below — one
 *  constant, not a display-only number copy-pasted at the call site. */
export const WINNER_ADS_CAP = 50;

/* ─── Mutations ─────────────────────────────────────────── */

export type AddWinnerAdResult = { ok: true } | { ok: false; reason: "cap"; cap: number };

/**
 * Save a winner ad. Auto-derives a paired concept (Maalik's 1:1 rule).
 * The derived concept references the winner ad via winnerAdId.
 *
 * Enforces `WINNER_ADS_CAP`: rejects (returns `{ ok: false, reason: "cap" }`)
 * once the account is at 50 active Winner Ads instead of appending past the
 * limit. Callers must surface this to the user (e.g. "You're at the 50
 * Winner Ad limit — remove one first") rather than assume the save always
 * succeeds.
 */
export function addWinnerAd(ad: WinnerAd): AddWinnerAdResult {
  if (computeActiveWinnerAds(state.winners, state.dismissedIds).length >= WINNER_ADS_CAP) {
    return { ok: false, reason: "cap", cap: WINNER_ADS_CAP };
  }
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
  return { ok: true };
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

/** Save a product (created via Brand-Detail "Add product" flow).
 *  Surfaces in BOTH the brand's Products tab AND the global /catalogue/products
 *  grid — single source of truth for the session. */
export function addProduct(product: Product) {
  state = { ...state, products: [...state.products, product] };
  emit();
}

/**
 * A-12.192: soft-delete by id. Works on both seed-mock items (where we
 * can't mutate the source) and session-saved items. The corresponding
 * remove* helpers below also strip the item from its in-memory list so
 * a re-add with the same id surfaces freshly. Idempotent — repeated
 * calls with the same id no-op.
 */
export function dismissItem(id: string) {
  if (state.dismissedIds.includes(id)) return;
  state = { ...state, dismissedIds: [...state.dismissedIds, id] };
  emit();
}

/** Undo a dismissal. Used by future "Restore" affordance or testing. */
export function restoreItem(id: string) {
  if (!state.dismissedIds.includes(id)) return;
  state = {
    ...state,
    dismissedIds: state.dismissedIds.filter((x) => x !== id),
  };
  emit();
}

/** Remove a user-saved instruction outright from the saved list. Pair
 *  with dismissItem(id) to also hide any seed-mock instruction sharing
 *  the same id (none should, but the dismissal is cheap insurance). */
export function removeInstruction(id: string) {
  state = {
    ...state,
    instructions: state.instructions.filter((i) => i.id !== id),
  };
  emit();
}

/**
 * Same shape for winners + concepts so the saved-store carries the full
 * delete API surface, not just instructions.
 *
 * NOTE for callers: this only strips a SESSION-SAVED winner ad — it filters
 * `state.winners`, which never contains the FabFunnel seed rows from
 * `WINNER_ADS` (those aren't in this array at all). Called on a seed row's
 * id, it silently no-ops. It's also a hard delete: nothing here restores the
 * derived concept it also removes. GenieBrain's interactive "Remove" control
 * (the fix for the 50-cap having no way out) deliberately does NOT call this
 * — it uses `dismissItem`/`restoreItem` instead, which is the one mechanism
 * that works uniformly on both seed and session rows and is fully reversible
 * via `restoreItem`. This function is left available for a genuine permanent
 * delete flow (e.g. an admin "purge" action) should one get built later.
 */
export function removeWinnerAd(id: string) {
  state = {
    ...state,
    winners: state.winners.filter((w) => w.id !== id),
    // Also drop any auto-derived concept that referenced this winner.
    concepts: state.concepts.filter((c) => c.winnerAdId !== id),
  };
  emit();
}

export function removeConcept(id: string) {
  state = { ...state, concepts: state.concepts.filter((c) => c.id !== id) };
  emit();
}

/** Reset the store (for tests or "clear session" UI). */
export function resetSavedStore() {
  state = {
    winners: [],
    concepts: [],
    instructions: [],
    products: [],
    dismissedIds: [],
  };
  emit();
}

/* ─── Hooks ─────────────────────────────────────────────── */

export function useSavedStore(): SavedStore {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Every Winner Ad the account actually has, live: FabFunnel's seed rows
 * plus session-saved ones, minus anything removed via `dismissItem`. This
 * is what GenieBrain's "N / 50" counter reads — it moves on both add
 * (`addWinnerAd`) and remove (`dismissItem`/`restoreItem`) because it's
 * derived from the store, not a static mock array.
 */
export function useAllWinnerAds(): WinnerAd[] {
  const { winners, dismissedIds } = useSavedStore();
  return useMemo(() => computeActiveWinnerAds(winners, dismissedIds), [winners, dismissedIds]);
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

/** All session-saved products (regardless of brand). Used by the global
 *  /catalogue/products grid to show new additions live. */
export function useSavedProducts(): Product[] {
  return useSavedStore().products;
}

/** Session-saved products filtered to one brand. Used by Brand Detail's
 *  Products tab. */
export function useSavedProductsForBrand(brandId: BrandId): Product[] {
  const { products } = useSavedStore();
  return products.filter((p) => p.brandId === brandId);
}

/**
 * A-12.192: live set of dismissed ids. Consumers filter their seed +
 * saved lists through this so the user's deletes take effect uniformly.
 */
export function useDismissedIds(): string[] {
  return useSavedStore().dismissedIds;
}
