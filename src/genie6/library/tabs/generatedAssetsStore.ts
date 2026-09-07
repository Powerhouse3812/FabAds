import { useSyncExternalStore } from "react";
import { addAsset } from "@/catalogue/catalogue-write-store";
import { genId } from "@/catalogue/assetTypes";
import type { ScriptAsset } from "@/mocks/shared/scripts";
import type { Concept } from "@/genie6/types/entities";
import type { GeneratedConceptItem, GeneratedScriptItem } from "./generatedAssetPool";

/**
 * generatedAssetsStore — "Save to Catalogue" for the Library's Scripts /
 * Concepts tabs.
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
 * Building the full `ScriptAsset` / `Concept` object here (rather than
 * routing through `assetTypes.ts`'s generic `buildAdded(AddAssetInput)`)
 * is deliberate: `buildAdded` exists for the "manually add or upload" modal,
 * which only ever collects name + tags + a body string. A Genie-generated
 * draft already carries the full shape (framework, duration, angle, tone,
 * format, brand) — routing it through the lossy generic path would throw
 * that away. `addAsset()` itself is the same call either way.
 */

interface State {
  savedScriptCatalogueId: Record<string, string>;
  savedConceptCatalogueId: Record<string, string>;
}

let state: State = { savedScriptCatalogueId: {}, savedConceptCatalogueId: {} };
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

/** Save a generated script draft into the Catalogue's `scripts` type.
 *  Returns the new Catalogue id (idempotent — re-saving returns the same id). */
export function saveGeneratedScript(item: GeneratedScriptItem): string {
  const existing = state.savedScriptCatalogueId[item.id];
  if (existing) return existing;

  const catalogueId = genId("script");
  const asset: ScriptAsset = {
    id: catalogueId,
    title: item.title,
    brandId: item.brandId,
    framework: item.framework,
    body: item.body,
    durationSec: item.durationSec,
    tags: item.tags,
    usageCount: 0,
    lastUsedAt: new Date().toISOString().slice(0, 10),
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

/** Save a generated concept draft into the Catalogue's `concepts` type. */
export function saveGeneratedConcept(item: GeneratedConceptItem): string {
  const existing = state.savedConceptCatalogueId[item.id];
  if (existing) return existing;

  const catalogueId = genId("concept");
  const asset: Concept = {
    id: catalogueId,
    name: item.name,
    brandId: item.brandId,
    angle: item.angle,
    hook: item.hook,
    tone: item.tone,
    format: item.formatLabel,
    visualDirection: item.hook,
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

export function useGeneratedAssetsSaveState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSavedScriptCatalogueId(itemId: string): string | undefined {
  return useGeneratedAssetsSaveState().savedScriptCatalogueId[itemId];
}

export function useSavedConceptCatalogueId(itemId: string): string | undefined {
  return useGeneratedAssetsSaveState().savedConceptCatalogueId[itemId];
}
