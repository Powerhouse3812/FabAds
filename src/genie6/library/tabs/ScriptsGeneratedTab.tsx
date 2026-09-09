import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import {
  GENERATED_SCRIPTS,
  partialBatchIds,
  poolBrandOptions,
} from "./generatedAssetPool";
import { GeneratedAssetCard } from "./GeneratedAssetCard";
import { GeneratedTabZeroState } from "./GeneratedTabZeroState";
import { saveGeneratedScript, useSavedScriptCatalogueId } from "./generatedAssetsStore";

/**
 * ScriptsGeneratedTab — Scripts Genie has generated, not yet saved to
 * Catalogue. Owner's spec: "Showing generated scripts... but they'll
 * saved to catalogue only for now" — this tab is a browse + save queue,
 * never a second script store (`generatedAssetsStore.ts` only remembers
 * "already saved this session"; the real record lives in Catalogue's
 * `scripts` type the moment Save fires).
 */
export function ScriptsGeneratedTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("scriptsQ") ?? "";
  const brandFilter = searchParams.get("scriptsBrand") ?? "all";

  const setQuery = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v) sp.set("scriptsQ", v);
        else sp.delete("scriptsQ");
        return sp;
      },
      { replace: true },
    );
  const setBrand = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v !== "all") sp.set("scriptsBrand", v);
        else sp.delete("scriptsBrand");
        return sp;
      },
      { replace: true },
    );

  const brandOptions = useMemo(() => poolBrandOptions(GENERATED_SCRIPTS), []);
  const partialBatches = useMemo(() => partialBatchIds(GENERATED_SCRIPTS), []);

  const filtered = useMemo(() => {
    return GENERATED_SCRIPTS.filter((s) => {
      if (brandFilter !== "all" && s.brandId !== brandFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [s.title, s.body, s.brandName, s.productName, ...s.tags]
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
        sp.delete("scriptsQ");
        sp.delete("scriptsBrand");
        return sp;
      },
      { replace: true },
    );
  };

  // Zero-data — the pool itself is empty, so no filter change can bring
  // anything back. Search + brand filter are suppressed with it: a filter
  // over nothing is chrome that implies data is being hidden.
  if (GENERATED_SCRIPTS.length === 0) {
    return (
      <GeneratedTabZeroState
        noun="scripts"
        description="A script is the spoken or on-screen copy behind an ad — a framework, a duration and the words themselves."
        assetsPath="/iq/genie6/assets/scripts"
        assetsLabel="Saved scripts"
        Icon={FileText}
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
            placeholder="Search scripts..."
            aria-label="Search generated scripts"
            className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter scripts by brand"
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
          title="No scripts match your filters"
          description={
            search
              ? `Nothing matches "${search}". Clear filters to see everything Genie's generated.`
              : "Try a different brand, or clear the filter to see every generated script."
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
            <span className="font-g6-mono text-g6-text">{filtered.length}</span> scripts
          </div>
          <ScriptGrid items={filtered} partialBatches={partialBatches} />
        </>
      )}
    </div>
  );
}

function ScriptGrid({
  items,
  partialBatches,
}: {
  items: typeof GENERATED_SCRIPTS;
  partialBatches: Set<string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((s) => (
        <ScriptCard key={s.id} item={s} isPartialBatch={partialBatches.has(s.batchId)} />
      ))}
    </div>
  );
}

function ScriptCard({
  item,
  isPartialBatch,
}: {
  item: (typeof GENERATED_SCRIPTS)[number];
  isPartialBatch: boolean;
}) {
  const savedCatalogueId = useSavedScriptCatalogueId(item.id);

  return (
    <GeneratedAssetCard
      icon={<FileText className="h-4 w-4" aria-hidden />}
      title={item.title}
      subtitle={`${item.brandName}${item.productName ? ` · ${item.productName}` : ""} · ${item.framework} · ${item.durationSec}s`}
      bodyPreview={item.body}
      tags={item.tags}
      batchId={item.batchId}
      batchLabel={item.batchLabel}
      module={item.module}
      createdBy={item.createdBy}
      generatedAt={item.generatedAt}
      status={item.status}
      batchIsPartial={isPartialBatch}
      savedCatalogueId={savedCatalogueId}
      catalogueType="scripts"
      onSave={() => {
        saveGeneratedScript(item);
        toast.success(`"${item.title}" saved to Assets`);
      }}
    />
  );
}
