import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Lightbulb, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import {
  GENERATED_CONCEPTS,
  partialBatchIds,
  poolBrandOptions,
} from "./generatedAssetPool";
import { GeneratedAssetCard } from "./GeneratedAssetCard";
import { GeneratedTabZeroState } from "./GeneratedTabZeroState";
import { saveGeneratedConcept, useSavedConceptCatalogueId } from "./generatedAssetsStore";

/**
 * ConceptsGeneratedTab — Concepts Genie has generated, not yet saved to
 * Catalogue. Same grammar as `ScriptsGeneratedTab` (§21.2 one asset-card
 * grammar) — this file mirrors it deliberately rather than inventing a
 * second layout, only swapping the data shape (angle/hook/tone/format
 * instead of framework/body/duration) and the Catalogue destination
 * (`concepts`, already wired in `generatedAssetsStore.ts`'s
 * `saveGeneratedConcept` — that function existed before this tab did and
 * was simply unused until now).
 */
export function ConceptsGeneratedTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("conceptsQ") ?? "";
  const brandFilter = searchParams.get("conceptsBrand") ?? "all";

  const setQuery = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v) sp.set("conceptsQ", v);
        else sp.delete("conceptsQ");
        return sp;
      },
      { replace: true },
    );
  const setBrand = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v !== "all") sp.set("conceptsBrand", v);
        else sp.delete("conceptsBrand");
        return sp;
      },
      { replace: true },
    );

  const brandOptions = useMemo(() => poolBrandOptions(GENERATED_CONCEPTS), []);
  const partialBatches = useMemo(() => partialBatchIds(GENERATED_CONCEPTS), []);

  const filtered = useMemo(() => {
    return GENERATED_CONCEPTS.filter((c) => {
      if (brandFilter !== "all" && c.brandId !== brandFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [c.name, c.angle, c.hook, c.tone, c.brandName, c.productName]
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
        sp.delete("conceptsQ");
        sp.delete("conceptsBrand");
        return sp;
      },
      { replace: true },
    );
  };

  // Zero-data — the pool itself is empty, so no filter change can bring
  // anything back. Search + brand filter are suppressed with it: a filter
  // over nothing is chrome that implies data is being hidden.
  if (GENERATED_CONCEPTS.length === 0) {
    return (
      <GeneratedTabZeroState
        noun="concepts"
        description="A concept is the angle, hook and tone an ad runs on — the idea, before any pixels exist."
        assetsPath="/iq/genie6/assets/concepts"
        assetsLabel="Saved concepts"
        Icon={Lightbulb}
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
            placeholder="Search concepts..."
            aria-label="Search generated concepts"
            className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter concepts by brand"
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
          title="No concepts match your filters"
          description={
            search
              ? `Nothing matches "${search}". Clear filters to see everything Genie's generated.`
              : "Try a different brand, or clear the filter to see every generated concept."
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
            <span className="font-g6-mono text-g6-text">{filtered.length}</span> concepts
          </div>
          <ConceptGrid items={filtered} partialBatches={partialBatches} />
        </>
      )}
    </div>
  );
}

function ConceptGrid({
  items,
  partialBatches,
}: {
  items: typeof GENERATED_CONCEPTS;
  partialBatches: Set<string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((c) => (
        <ConceptCard key={c.id} item={c} isPartialBatch={partialBatches.has(c.batchId)} />
      ))}
    </div>
  );
}

function ConceptCard({
  item,
  isPartialBatch,
}: {
  item: (typeof GENERATED_CONCEPTS)[number];
  isPartialBatch: boolean;
}) {
  const savedCatalogueId = useSavedConceptCatalogueId(item.id);

  return (
    <GeneratedAssetCard
      icon={<Lightbulb className="h-4 w-4" aria-hidden />}
      thumbnail={item.thumbnail}
      title={item.name}
      subtitle={`${item.brandName}${item.productName ? ` · ${item.productName}` : ""} · ${item.formatLabel}`}
      bodyPreview={item.hook}
      tags={[item.angle, item.tone]}
      batchId={item.batchId}
      batchLabel={item.batchLabel}
      module={item.module}
      createdBy={item.createdBy}
      generatedAt={item.generatedAt}
      status={item.status}
      batchIsPartial={isPartialBatch}
      savedCatalogueId={savedCatalogueId}
      catalogueType="concepts"
      onSave={() => {
        saveGeneratedConcept(item);
        toast.success(`"${item.name}" saved to Assets`);
      }}
    />
  );
}
