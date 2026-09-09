import { useSyncExternalStore } from "react";
import {
  addAsset,
  getWriteSnapshot,
  useCatalogueWrites,
  writeKey,
} from "@/catalogue/catalogue-write-store";
import { genId, todayIso } from "@/catalogue/assetTypes";
import type { CatalogueType } from "@/catalogue/assetTypes";
import type { ScriptAsset } from "@/mocks/shared/scripts";
import type { StoryboardAsset } from "@/mocks/shared/storyboards";
import type { Concept, Hook } from "@/genie6/types/entities";
import type {
  GeneratedConceptItem,
  GeneratedScriptItem,
  GeneratedStoryboardItem,
} from "./generatedAssetPool";

/**
 * generatedAssetsStore — "Save to Assets" for the Library's Scripts /
 * Concepts / Storyboards tabs.
 *
 * Maalik: "they'll saved to catalogue only for now" — so saving does NOT
 * create a second persistence home in Library. It writes straight into the
 * real Catalogue store (`src/catalogue/catalogue-write-store.ts`'s
 * `addAsset`, the same seam `assetTypes.ts`'s generic add-form uses) and
 * this file only remembers, for THIS session, which generated drafts have
 * already been saved — so a re-render doesn't offer "Save" twice for the
 * same item. In-memory, resets on reload, same disclosed-prototype pattern
 * as `library/libraryActionsStore.ts`.
 *
 * Building the full `ScriptAsset` / `Concept` / `StoryboardAsset` object
 * here (rather than routing through `assetTypes.ts`'s generic
 * `buildAdded(AddAssetInput)`) is deliberate: `buildAdded` exists for the
 * "manually add or upload" modal, which only ever collects name + tags + a
 * body string — its storyboard branch literally produces `scenes: []`. A
 * Genie-generated draft already carries the full shape (framework,
 * duration, angle, tone, format, brand, every scene) — routing it through
 * the lossy generic path would throw that away and save an empty
 * storyboard. `addAsset()` itself is the same call either way.
 *
 * Storyboards joined this file on 2026-09-09, when `"storyboards"` became a
 * real `CatalogueType` member with its own registry entry, seed set
 * (`src/mocks/shared/storyboards.ts`) and route
 * (`/iq/genie6/assets/storyboards`). Before that the Library's storyboard
 * cards rendered an honest "no Catalogue home yet" dead end rather than a
 * Save button that would mis-save under the wrong type; that dead end is
 * now gone.
 */

interface State {
  savedScriptCatalogueId: Record<string, string>;
  savedConceptCatalogueId: Record<string, string>;
  savedStoryboardCatalogueId: Record<string, string>;
  savedHookCatalogueId: Record<string, string>;
}

let state: State = {
  savedScriptCatalogueId: {},
  savedConceptCatalogueId: {},
  savedStoryboardCatalogueId: {},
  savedHookCatalogueId: {},
};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): State {
  return state;
}

/**
 * Has the Catalogue row this draft was saved into been deleted since?
 *
 * The four save functions below cache "I already saved this draft" by source
 * id and return early on a hit. That cache alone is not enough to decide
 * whether a save is still valid: `catalogue-write-store` owns whether the row
 * still exists, and `deleteAsset` writes a tombstone rather than removing the
 * entry. Without this check the read side (`useSavedId`) correctly flips the
 * card back to "Save to Assets" after a delete while the write side keeps
 * returning the tombstoned id — so the button becomes a permanent no-op that
 * still fires a success toast, and the draft can never be re-saved.
 *
 * Imperative `getWriteSnapshot()` rather than the `useCatalogueWrites` hook
 * because these are plain functions called from click handlers, not hooks.
 */
function isDeletedInCatalogue(type: CatalogueType, catalogueId: string): boolean {
  return Boolean(getWriteSnapshot().overrides[writeKey(type, catalogueId)]?.deleted);
}

/** Save a generated script draft into the Catalogue's `scripts` type.
 *  Returns the new Catalogue id (idempotent — re-saving returns the same id). */
export function saveGeneratedScript(item: GeneratedScriptItem): string {
  const existing = state.savedScriptCatalogueId[item.id];
  if (existing && !isDeletedInCatalogue("scripts", existing)) return existing;

  const catalogueId = genId("script");
  const asset: ScriptAsset = {
    id: catalogueId,
    title: item.title,
    brandId: item.brandId,
    framework: item.framework,
    body: item.body,
    durationSec: item.durationSec,
    tags: [...item.tags],
    usageCount: 0,
    lastUsedAt: todayIso(),
    provenance: "client-created",
  };
  addAsset("scripts", asset);

  state = {
    ...state,
    savedScriptCatalogueId: { ...state.savedScriptCatalogueId, [item.id]: catalogueId },
  };
  emit();
  return catalogueId;
}

/**
 * Save a generated concept draft into the Catalogue's `concepts` type.
 *
 * `visualDirection` used to be set to `item.hook`, which made the Assets
 * detail view print the same sentence twice under two different headings
 * ("Hook" then "Visual direction"). A generated concept carries no
 * shot-level direction, so the honest value is the two things that ARE known
 * about how it should look — its format and its tone — rather than a
 * duplicate of a field that is already displayed above it.
 */
export function saveGeneratedConcept(item: GeneratedConceptItem): string {
  const existing = state.savedConceptCatalogueId[item.id];
  if (existing && !isDeletedInCatalogue("concepts", existing)) return existing;

  const catalogueId = genId("concept");
  const asset: Concept = {
    id: catalogueId,
    name: item.name,
    brandId: item.brandId,
    angle: item.angle,
    hook: item.hook,
    tone: item.tone,
    format: item.formatLabel,
    visualDirection: `${item.formatLabel} · ${item.tone}`,
    generationCount: item.generationCount,
  };
  addAsset("concepts", asset);

  state = {
    ...state,
    savedConceptCatalogueId: { ...state.savedConceptCatalogueId, [item.id]: catalogueId },
  };
  emit();
  return catalogueId;
}

/**
 * Save a generated storyboard draft into the Catalogue's `storyboards` type.
 *
 * Every scene is carried across verbatim — `StoryboardScene` is
 * field-identical in `generatedAssetPool.ts` and `@/mocks/shared/storyboards`
 * (sceneNumber / shot / description / durationSec), deliberately so, and the
 * array is copied rather than aliased so a later edit on the saved asset can
 * never mutate the generated pool. `thumbnail` is optional on a generated
 * draft but required (string) on the saved asset — `""` is the documented
 * no-thumbnail value the registry's own `buildAdded` uses, and the Assets
 * card falls back to the type icon for it.
 */
export function saveGeneratedStoryboard(item: GeneratedStoryboardItem): string {
  const existing = state.savedStoryboardCatalogueId[item.id];
  if (existing && !isDeletedInCatalogue("storyboards", existing)) return existing;

  const catalogueId = genId("storyboard");
  const asset: StoryboardAsset = {
    id: catalogueId,
    title: item.title,
    brandId: item.brandId,
    productName: item.productName,
    formatLabel: item.formatLabel,
    scenes: item.scenes.map((scene) => ({ ...scene })),
    thumbnail: item.thumbnail ?? "",
    tags: [...item.tags],
    usageCount: 0,
    lastUsedAt: todayIso(),
    provenance: "client-created",
  };
  addAsset("storyboards", asset);

  state = {
    ...state,
    savedStoryboardCatalogueId: {
      ...state.savedStoryboardCatalogueId,
      [item.id]: catalogueId,
    },
  };
  emit();
  return catalogueId;
}

/**
 * Save one generated ad's hook LINE into the Catalogue's `hooks` type.
 *
 * There is no `hook` generation target — the four targets are
 * ad / script / concept / storyboard — so a hook is never generated on its
 * own. What IS generated is the line itself, carried on every generated ad
 * as `OutputData.headline`: 20 of the 50 seeded outputs carry a headline
 * that is character-for-character an existing seeded `Hook.text` in
 * `src/mocks/shared/hooks.ts` (e.g. `var_4a2k7q9` ↔ `hook-1`, "Hair fall is
 * real. This is not."). That is the evidence this field IS the hook line in
 * this data model, not a separate headline concept — so "save the hook off
 * this ad" acts on real content, not an invented one.
 *
 * Keyed by the SOURCE OUTPUT ID (`item.id`), which is why re-saving the same
 * ad's line is idempotent while two different ads that happen to share a
 * line stay two independent decisions.
 *
 * `brandId` / `angleId` are carried through deliberately: the Catalogue's own
 * generic add-form only captures `text` (`hooksType.buildAdded`), but
 * `hooksType.toCard` renders its subtitle from brand + angle, so a hook saved
 * from a generation lands as a materially richer card than a hand-typed one.
 * `performance` is left unset — a hook that has never run has no CTR, and
 * inventing one would put a fabricated number next to real ones.
 */
export function saveGeneratedHook(item: {
  id: string;
  text: string;
  brandId?: string;
  angleId?: string;
}): string {
  const existing = state.savedHookCatalogueId[item.id];
  if (existing && !isDeletedInCatalogue("hooks", existing)) return existing;

  const catalogueId = genId("hook");
  const asset: Hook = {
    id: catalogueId,
    text: item.text,
    brandId: item.brandId,
    angleId: item.angleId,
  };
  addAsset("hooks", asset);

  state = {
    ...state,
    savedHookCatalogueId: { ...state.savedHookCatalogueId, [item.id]: catalogueId },
  };
  emit();
  return catalogueId;
}

export function useGeneratedAssetsSaveState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Saved-id lookup, RECONCILED against the Catalogue write store.
 *
 * Two independent session stores can disagree: this file remembers "I saved
 * this draft", `catalogue-write-store` owns whether that row still exists.
 * Delete the saved asset from the Assets grid and the naive lookup keeps the
 * Library card claiming "Saved to Assets" with a live "View in Assets" link
 * pointing at a row that has been soft-deleted — the card lies, and the link
 * lands nowhere useful. Checking the `deleted` override here makes the card
 * fall back to offering Save again, which is the truth.
 *
 * (Re-saving after a delete mints a NEW Catalogue id rather than resurrecting
 * the old one — correct: `deleteAsset` is a tombstone on that id, so reusing
 * it would produce a row that reads as deleted.)
 */
function useSavedId(
  bucket: keyof State,
  type: CatalogueType,
  itemId: string,
): string | undefined {
  const savedId = useGeneratedAssetsSaveState()[bucket][itemId];
  const writes = useCatalogueWrites();
  if (!savedId) return undefined;
  if (writes.overrides[writeKey(type, savedId)]?.deleted) return undefined;
  return savedId;
}

export function useSavedScriptCatalogueId(itemId: string): string | undefined {
  return useSavedId("savedScriptCatalogueId", "scripts", itemId);
}

export function useSavedConceptCatalogueId(itemId: string): string | undefined {
  return useSavedId("savedConceptCatalogueId", "concepts", itemId);
}

export function useSavedStoryboardCatalogueId(itemId: string): string | undefined {
  return useSavedId("savedStoryboardCatalogueId", "storyboards", itemId);
}

export function useSavedHookCatalogueId(itemId: string): string | undefined {
  return useSavedId("savedHookCatalogueId", "hooks", itemId);
}
