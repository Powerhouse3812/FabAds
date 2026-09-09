import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Clapperboard, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import {
  GENERATED_STORYBOARDS,
  partialBatchIds,
  poolBrandOptions,
} from "./generatedAssetPool";
import { GeneratedAssetCard } from "./GeneratedAssetCard";
import { GeneratedTabZeroState } from "./GeneratedTabZeroState";
import {
  saveGeneratedStoryboard,
  useSavedStoryboardCatalogueId,
} from "./generatedAssetsStore";

/**
 * StoryboardsGeneratedTab — Storyboards Genie has generated, not yet saved
 * to Assets. Same grammar as `ScriptsGeneratedTab` / `ConceptsGeneratedTab`,
 * and — since 2026-09-09 — the same real save path too.
 *
 * This tab used to pass `canSaveToCatalogue={false}` because
 * `src/catalogue/assetTypes.ts`'s `CatalogueType` union had no
 * `"storyboards"` member, so a Save button would have had nowhere honest to
 * write. That member now exists, with its own registry entry, seed set
 * (`src/mocks/shared/storyboards.ts`) and route
 * (`/iq/genie6/assets/storyboards`) — so the dead end is gone and Save
 * writes through `saveGeneratedStoryboard`, scene-for-scene, exactly the way
 * Scripts and Concepts already do.
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

  // Zero-data — the pool itself is empty, so no filter change can bring
  // anything back. Search + brand filter are suppressed with it: a filter
  // over nothing is chrome that implies data is being hidden.
  if (GENERATED_STORYBOARDS.length === 0) {
    return (
      <GeneratedTabZeroState
        noun="storyboards"
        description="A storyboard is the scene-by-scene shot plan behind a video ad — shot, description and duration per beat."
        assetsPath="/iq/genie6/assets/storyboards"
        assetsLabel="Saved storyboards"
        Icon={Clapperboard}
      />
    );
  }

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
  const savedCatalogueId = useSavedStoryboardCatalogueId(item.id);

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
      savedCatalogueId={savedCatalogueId}
      catalogueType="storyboards"
      onSave={() => {
        saveGeneratedStoryboard(item);
        toast.success(`"${item.title}" saved to Assets`);
      }}
    />
  );
}
