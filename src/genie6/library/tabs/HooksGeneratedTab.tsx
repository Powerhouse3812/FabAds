import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Quote, Search, User } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { formatRelativeTime } from "../relativeTime";
import { GeneratedTabZeroState } from "./GeneratedTabZeroState";
import { saveGeneratedHook, useSavedHookCatalogueId } from "./generatedAssetsStore";
import { useGeneratedHookLines, type GeneratedHookLine } from "./hookLinePool";

/**
 * HooksGeneratedTab — the hook LINES Genie has produced, and the one place
 * to save them into Assets.
 *
 * WHY THIS TAB EXISTS AT ALL, GIVEN THERE IS NO `hook` GENERATION TARGET
 * The four generation targets are ad / script / concept / storyboard, so
 * nothing in Genie ever emits a hook as a standalone artefact — which is
 * exactly why this tab is NOT another "generated drafts" pool like Scripts
 * or Concepts. What Genie does emit is the line itself, carried on every
 * generated ad as `OutputData.headline`. That field is demonstrably the hook
 * line in this data model, not a separate headline concept: twenty of the
 * fifty seeded outputs carry a headline that is character-for-character an
 * existing seeded `Hook.text` in `src/mocks/shared/hooks.ts` — `var_4a2k7q9`
 * ↔ `hook-1` ("Hair fall is real. This is not."), `var_b7t4h2x` ↔ `hook-2`,
 * `var_sugar_1` ↔ `hook-sugar-1`, and seventeen more. So this tab reads the
 * SAME ad pool the Ads tab reads, projected down to its hook lines, and Save
 * writes a real `Hook` into the `hooks` asset type.
 *
 * Two sources were considered and rejected as the primary:
 *  - `GeneratedConceptItem.hook` (`generatedAssetPool.ts`) — four of its
 *    seven values read as a hook fused with a proof clause ("Hair fall is
 *    real. This is not — clinically tested, 6-week visible change.") rather
 *    than a clean opening line, and the same string is already written into
 *    `Concept.visualDirection`. A tagline, not a hook.
 *  - `OutputData.priorConfig.hookId` — a broken join. `sample-outputs.ts`
 *    backfills `hook-${idx % 18}` but only `hook-1,2,3,4,5,7,8` exist, so
 *    most ids resolve to nothing. Never dereference it.
 *
 * The card grammar here is deliberately NOT `GeneratedAssetCard`. That card
 * truncates its title to one line, which is correct when the title is a
 * document NAME (a script, a storyboard) and destructive when the title IS
 * the content — a hook truncated at one line is unreadable and unjudgeable.
 * It also stamps a "Free" pill, which would be a lie here: the ad this line
 * came from cost credits. So this reuses the compact line-first grammar of
 * the existing `HooksTab` (saved hooks, Assets side) with the provenance row
 * of `GeneratedAssetCard` — one line, its brand and angle, where it came
 * from, one action.
 */

export function HooksGeneratedTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("hooksQ") ?? "";
  const brandFilter = searchParams.get("hooksBrand") ?? "all";
  const rows = useGeneratedHookLines();

  const setQuery = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v) sp.set("hooksQ", v);
        else sp.delete("hooksQ");
        return sp;
      },
      { replace: true },
    );
  const setBrand = (v: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (v !== "all") sp.set("hooksBrand", v);
        else sp.delete("hooksBrand");
        return sp;
      },
      { replace: true },
    );

  const brandOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      if (!seen.has(row.brandKey)) seen.set(row.brandKey, row.brandName ?? "Unattributed");
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (brandFilter !== "all" && row.brandKey !== brandFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [row.text, row.brandName, row.angleLabel, row.supportingCopy]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, brandFilter]);

  const filtersActive = search.length > 0 || brandFilter !== "all";
  const clearFilters = () => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("hooksQ");
        sp.delete("hooksBrand");
        return sp;
      },
      { replace: true },
    );
  };

  // Zero-data — no generated ad carries a line, so there is nothing to save
  // and no filter can change that.
  if (rows.length === 0) {
    return (
      <GeneratedTabZeroState
        noun="hooks"
        description="A hook is the opening line an ad leads with — Genie writes one into every ad it generates."
        assetsPath="/iq/genie6/assets/hooks"
        assetsLabel="Saved hooks"
        Icon={Quote}
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
            placeholder="Search hooks..."
            aria-label="Search generated hooks"
            className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter hooks by brand"
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
          title="No hooks match your filters"
          description={
            search
              ? `Nothing matches "${search}". Clear filters to see every line Genie's written.`
              : "Try a different brand, or clear the filter to see every generated hook."
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
            <span className="font-g6-mono text-g6-text">{filtered.length}</span> hooks
            <span className="ml-2 font-g6-mono text-[10px] uppercase tracking-[0.05em] text-g6-text-tertiary">
              lifted from generated ads
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <HookLineCard key={row.id} item={row} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HookLineCard({ item }: { item: GeneratedHookLine }) {
  const savedCatalogueId = useSavedHookCatalogueId(item.id);
  const [searchParams] = useSearchParams();

  // Deep link back to the ad this line came from — the Library's own
  // AdDetailDrawer opens on `?ad=`, so the provenance is inspectable rather
  // than just asserted.
  const adHref = (() => {
    const sp = new URLSearchParams(searchParams);
    sp.set("ad", item.id);
    return `?${sp.toString()}`;
  })();

  const meta = [item.brandName, item.angleLabel].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-3 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-g6-border hover:shadow-g6-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-g6-lg bg-g6-bg-spotlight text-g6-text-secondary">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <Quote className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* The line IS the content — it wraps (to 3 lines) rather than
              truncating, unlike the document cards on the other tabs. */}
          <p className="line-clamp-3 break-words font-g6-sans text-g6-base font-semibold text-g6-text">
            {item.text}
          </p>
          {meta && (
            <p className="mt-1 truncate font-g6-mono text-g6-xs text-g6-text-tertiary" title={meta}>
              {meta}
            </p>
          )}
        </div>
      </div>

      {item.supportingCopy && (
        <p className="line-clamp-2 font-g6-sans text-g6-sm text-g6-text-secondary">
          {item.supportingCopy}
        </p>
      )}

      {/* Provenance — same vocabulary as GeneratedAssetCard / BatchGroupHeader.
          No credit pill here: the line was a by-product of an ad that DID cost
          credits, so a "Free" stamp would be wrong on both readings. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-g6-border-secondary pt-3">
        <span className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em] text-g6-text">
          {item.batchId ?? "Earlier generation"}
        </span>
        {item.module && (
          <span className="inline-flex items-center rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] uppercase tracking-[0.05em] text-g6-text-secondary">
            {item.module}
          </span>
        )}
        {item.createdBy && (
          <span className="inline-flex items-center gap-1 font-g6-mono text-[10px] text-g6-text-secondary">
            <User className="h-2.5 w-2.5" /> {item.createdBy}
          </span>
        )}
        <span className="font-g6-mono text-[10px] text-g6-text-tertiary">
          {formatRelativeTime(item.generatedAt)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {savedCatalogueId ? (
          <>
            <span className="inline-flex items-center gap-1 font-g6-sans text-g6-xs font-semibold text-success-text">
              <Check className="h-3.5 w-3.5" /> Saved to Assets
            </span>
            <Link
              to={`/iq/genie6/assets/hooks/${savedCatalogueId}`}
              className="font-g6-mono text-[11px] text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary"
            >
              View in Assets
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                saveGeneratedHook({
                  id: item.id,
                  text: item.text,
                  brandId: item.brandId,
                  angleId: item.angleId,
                });
                toast.success("Hook saved to Assets");
              }}
              className="inline-flex h-8 items-center justify-center rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-xs font-semibold text-g6-text-on-accent transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary focus-visible:ring-offset-2 focus-visible:ring-offset-g6-bg-container"
            >
              Save to Assets
            </button>
            <Link
              to={adHref}
              className="font-g6-mono text-[11px] text-g6-text-secondary underline-offset-2 hover:text-g6-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary"
            >
              View the ad
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
