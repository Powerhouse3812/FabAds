import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Clapperboard, Search } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import {
  GENERATED_STORYBOARDS,
  partialBatchIds,
  poolBrandOptions,
} from "./generatedAssetPool";
import { GeneratedAssetCard } from "./GeneratedAssetCard";

/**
 * StoryboardsGeneratedTab — Storyboards Genie has generated, not yet saved
 * anywhere. Same grammar as `ScriptsGeneratedTab` / `ConceptsGeneratedTab`,
 * with one deliberate difference: Storyboard has no Catalogue home.
 *
 * Genie 2.0 spec §10 lists the Catalogue's Creative asset types as exactly
 * Avatars · Voices · Scripts · Concepts · Hooks · CTAs · Frameworks —
 * Storyboard isn't one of them, and `src/catalogue/assetTypes.ts`'s
 * `CatalogueType` union (owned elsewhere, read-only from here) has no
 * `"storyboards"` member. So this tab passes `canSaveToCatalogue={false}`
 * and no `onSave` — `GeneratedAssetCard` renders an honest "Library only —
 * no Catalogue home yet" state instead of a button that would either no-op
 * or (worse) silently save a storyboard under the wrong asset type. If a
 * `storyboards` Catalogue type is added later, wiring a real save here is a
 * small follow-up (mirror `saveGeneratedConcept` in `generatedAssetsStore.ts`
 * and flip this flag) — not a redesign.
 */
export function StoryboardsGeneratedTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("storyboardsQ") ?? "";
  const brandFilter = searchParams.get("storyboardsBrand") ?? "all";

  const setQuery = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v) sp.set("storyboardsQ", v);
        else sp.delete("storyboardsQ");
        return sp;
      },
      { replace: true },
    );
  const setBrand = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v !== "all") sp.set("storyboardsBrand", v);
        else sp.delete("storyboardsBrand");
        return sp;
      },
      { replace: true },
    );

  const brandOptions = useMemo(() => poolBrandOptions(GENERATED_STORYBOARDS), []);
  const partialBatches = useMemo(() => partialBatchIds(GENERATED_STORYBOARDS), []);

  const filtered = useMemo(() => {
    return GENERATED_STORYBOARDS.filter((s) => {
      if (brandFilter !== "all" && s.brandId !== brandFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          s.title,
          s.brandName,
          s.productName,
          ...s.tags,
          ...s.scenes.map((scene) => scene.description),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }, [search, brandFilter]);

  const filtersActive = search.length > 0 || brandFilter !== "all";
  const clearFilters = () => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("storyboardsQ");
        sp.delete("storyboardsBrand");
        return sp;
      },
      { replace: true },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search storyboards..."
            aria-label="Search generated storyboards"
            className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter storyboards by brand"
          className="h-8 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-2.5 font-g6-sans text-g6-sm text-g6-text focus:border-g6-primary-border focus:outline-none"
        >
          <option value="all">All brands</option>
          {brandOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No storyboards match your filters"
          description={
            search
              ? `Nothing matches "${search}". Clear filters to see everything Genie's generated.`
              : "Try a different brand, or clear the filter to see every generated storyboard."
          }
          primaryAction={
            filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-9 items-center rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent transition-transform hover:-translate-y-0.5"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="font-g6-sans text-g6-sm text-g6-text-secondary">
            <span className="font-g6-mono text-g6-text">{filtered.length}</span> storyboards
          </div>
          <StoryboardGrid items={filtered} partialBatches={partialBatches} />
        </>
      )}
    </div>
  );
}

function StoryboardGrid({
  items,
  partialBatches,
}: {
  items: typeof GENERATED_STORYBOARDS;
  partialBatches: Set<string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((s) => (
        <StoryboardCard key={s.id} item={s} isPartialBatch={partialBatches.has(s.batchId)} />
      ))}
    </div>
  );
}

function StoryboardCard({
  item,
  isPartialBatch,
}: {
  item: (typeof GENERATED_STORYBOARDS)[number];
  isPartialBatch: boolean;
}) {
  const firstScene = item.scenes[0];
  const totalSec = item.scenes.reduce((sum, scene) => sum + scene.durationSec, 0);

  return (
    <GeneratedAssetCard
      icon={<Clapperboard className="h-4 w-4" aria-hidden />}
      thumbnail={item.thumbnail}
      title={item.title}
      subtitle={`${item.brandName}${item.productName ? ` · ${item.productName}` : ""} · ${item.scenes.length} scenes · ${item.formatLabel} · ${totalSec}s`}
      bodyPreview={firstScene ? `Scene 1 — ${firstScene.shot}: ${firstScene.description}` : undefined}
      tags={item.tags}
      batchId={item.batchId}
      batchLabel={item.batchLabel}
      module={item.module}
      createdBy={item.createdBy}
      generatedAt={item.generatedAt}
      status={item.status}
      batchIsPartial={isPartialBatch}
      catalogueType="storyboards"
      canSaveToCatalogue={false}
    />
  );
}
