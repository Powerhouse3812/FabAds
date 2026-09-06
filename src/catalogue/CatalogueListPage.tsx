import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAssetType,
  buildDuplicate,
  type CatalogueType,
  type AssetCardData,
} from "./assetTypes";
import {
  useCatalogueWrites,
  useAssetOverride,
  archiveAsset,
  deleteAsset,
  duplicateAsset,
  toggleBookmark,
  addAsset,
} from "./catalogue-write-store";
import { AssetCard } from "./AssetCard";
import { AssetFilterBar, matchesFilters, type DateRange } from "./AssetFilterBar";
import { CatalogueBulkBar } from "./CatalogueBulkBar";
import { AssetFormModal } from "./AssetFormModal";
import { CreditsPill, UnknownAssetType, SessionScopeNote } from "./CatalogueShared";
import { useInGenieUrl, bulkUseInGenieUrl } from "./genieHandoff";
import { AddBrandModal } from "./AddBrandModal";
import { AddProductModal } from "./AddProductModal";
import { AddCategoryModal } from "./AddCategoryModal";

/**
 * Catalogue grid page — §21.2 "asset-card grammar, one for all types" made
 * literal. Every type (all 14, though in practice Brand/Product/Category's
 * `/grid` routes redirect back to `CatalogueFinder` — see App.tsx) renders
 * through the same `AssetCard`, the same filter row (search + tag facet +
 * date range), and the same bulk toolbar, driven entirely by the
 * `assetTypes.ts` registry instead of a bespoke Card component per type.
 *
 * Previously this file had 9 hand-written Card components and a nested
 * ternary for both the type→data mapping and the search-field matching
 * (RECON.md's "adding a type means touching ~8 sites"). Both are gone —
 * the registry's `resolve()` + `toCard()` replace them, and adding a 15th
 * type now means one entry in `assetTypes.ts`, zero changes here.
 */
export function CatalogueListPage({ type }: { type: string }) {
  const def = getAssetType(type);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoading = searchParams.get("loading") === "1";

  const writes = useCatalogueWrites(); // subscribes so resolve() below sees fresh writes
  void writes;

  const [query, setQuery] = useState("");
  const [facetValue, setFacetValue] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Hooks above this point must run on every render (rules-of-hooks), so
  // the unknown-type bail happens after them, not before.
  const items = useMemo(() => (def ? def.resolve({ includeArchived }) : []), [def, includeArchived, writes]);
  const cards = useMemo(() => (def ? items.map((it) => def.toCard(it)) : []), [def, items]);
  const facetOptions = useMemo(
    () => Array.from(new Set(cards.flatMap((c) => c.tags))).sort(),
    [cards],
  );
  const filtered = useMemo(
    () => cards.filter((c) => matchesFilters(c, query, facetValue, dateRange)),
    [cards, query, facetValue, dateRange],
  );

  if (!def) return <UnknownAssetType type={type} />;

  const isBusinessAddFlow = type === "brands" || type === "products" || type === "categories";
  const canAdd = isBusinessAddFlow || !!def.addForm;

  const onCardClick = (id: string) => navigate(`/catalogue/${type}/${id}`);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedIds = Array.from(selected);
  const selectedCount = selectedIds.length;

  const handleBulkArchive = () => {
    selectedIds.forEach((id) => archiveAsset(def.id, id, true));
    toast.success(`${selectedCount} archived`);
    setSelected(new Set());
  };

  const handleBulkDuplicate = () => {
    let created = 0;
    for (const id of selectedIds) {
      const source = items.find((it) => def.getId(it) === id);
      if (!source) continue;
      const clone = buildDuplicate(def, source);
      duplicateAsset(def.id, id, clone);
      created += 1;
    }
    toast.success(`${created} duplicated`, { description: "Local to this session." });
    setSelected(new Set());
  };

  const handleBulkDownload = () => {
    toast.success(`${selectedCount} prepared for download`, {
      description: "Prototype surface: no real files are attached.",
    });
  };

  const handleBulkDeleteConfirm = () => {
    selectedIds.forEach((id) => deleteAsset(def.id, id));
    toast.success(`${selectedCount} deleted`, { description: "Local to this session." });
    setSelected(new Set());
    setBulkDeleteOpen(false);
  };

  // §9 "Bulk product selection ... applies to Category Ad and Product Ad.
  // Selecting N products produces ONE ad containing all of them." Only
  // Products offers this — the notice states the outcome before commit.
  const bulkProductNotice =
    type === "products" && selectedCount >= 2
      ? `${selectedCount} products will become ONE ad, not ${selectedCount} separate ads.`
      : undefined;
  const handleBulkUseInGenie =
    type === "products"
      ? () => navigate(bulkUseInGenieUrl(selectedIds))
      : undefined;

  const handleAddSubmit = (input: { name: string; tags: string[]; body?: string }) => {
    if (!def.buildAdded) return;
    const created = def.buildAdded(input);
    addAsset(def.id, created as { id: string });
  };

  return (
    <div className="v3-page-mesh flex h-full flex-col p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <def.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{def.label}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditsPill />
            {canAdd && (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                <Plus className="h-3.5 w-3.5" />
                New {def.singular}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filter row */}
      <AssetFilterBar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={`Search ${def.label.toLowerCase()}…`}
        facetOptions={facetOptions}
        facetValue={facetValue}
        onFacetChange={setFacetValue}
        facetLabel="Tag"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        includeArchived={includeArchived}
        onIncludeArchivedChange={setIncludeArchived}
        className="mb-3"
      />

      {selectedCount >= 2 && (
        <CatalogueBulkBar
          count={selectedCount}
          onDuplicate={handleBulkDuplicate}
          onArchive={handleBulkArchive}
          onDelete={() => setBulkDeleteOpen(true)}
          onDownload={handleBulkDownload}
          onUseInGenie={handleBulkUseInGenie}
          useInGenieLabel="Use in Genie (1 ad)"
          bulkProductNotice={bulkProductNotice}
          onClear={() => setSelected(new Set())}
          className="mb-3"
        />
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <def.icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {query || facetValue !== "all" || dateRange.from || dateRange.to
              ? `No ${def.label.toLowerCase()} match this filter`
              : `No ${def.label.toLowerCase()} yet`}
          </h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            {query || facetValue !== "all"
              ? "Try a different search term or clear a filter."
              : canAdd
                ? `Add your first ${def.singular.toLowerCase()} to start managing your catalogue.`
                : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((card) => (
            <AssetCardWired
              key={card.id}
              def={def}
              card={card}
              selected={selected.has(card.id)}
              onToggleSelect={() => toggleSelect(card.id)}
              onOpen={() => onCardClick(card.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && <SessionScopeNote className="mt-3" />}

      {/* Add flows */}
      {isBusinessAddFlow ? (
        <>
          {type === "brands" && <AddBrandModal open={addOpen} onOpenChange={setAddOpen} />}
          {type === "products" && <AddProductModal open={addOpen} onOpenChange={setAddOpen} />}
          {type === "categories" && <AddCategoryModal open={addOpen} onOpenChange={setAddOpen} />}
        </>
      ) : (
        def.addForm && (
          <AssetFormModal
            open={addOpen}
            onOpenChange={setAddOpen}
            mode="add"
            singular={def.singular}
            addForm={def.addForm}
            onSubmit={handleAddSubmit}
          />
        )
      )}

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} {def.label.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone within this session — these rows are gone until reload resets
              the demo data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Wires one card's per-row actions to the write store + genie handoff,
 *  kept separate from the presentational `AssetCard` itself. */
function AssetCardWired({
  def,
  card,
  selected,
  onToggleSelect,
  onOpen,
}: {
  def: NonNullable<ReturnType<typeof getAssetType>>;
  card: AssetCardData;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}) {
  const navigate = useNavigate();
  const override = useAssetOverride(def.id as CatalogueType, card.id);
  const archived = !!override?.archived;
  const bookmarked = !!override?.bookmarked;

  return (
    <AssetCard
      card={card}
      icon={def.icon}
      selectable
      selected={selected}
      onToggleSelect={onToggleSelect}
      onOpen={onOpen}
      archived={archived}
      bookmarked={bookmarked}
      onToggleBookmark={() => toggleBookmark(def.id as CatalogueType, card.id)}
      onUseInGenie={() => {
        navigate(useInGenieUrl(def.id as CatalogueType, card.id));
      }}
      onDuplicate={() => {
        // Grid-level duplicate needs the full item, not just the card — the
        // page-level bulk duplicate has it; single-card duplicate re-resolves.
        const source = def.resolve({ includeArchived: true }).find((it: unknown) => def.getId(it) === card.id);
        if (!source) return;
        const clone = buildDuplicate(def, source);
        duplicateAsset(def.id as CatalogueType, card.id, clone);
        toast.success(`${def.getName(clone)} created`, { description: "Local to this session." });
      }}
      onDownload={() => toast.success(`${card.name} — download prepared`, { description: "Prototype surface: no real file is attached." })}
      onArchive={() => {
        archiveAsset(def.id as CatalogueType, card.id, !archived);
        toast.success(archived ? `${card.name} unarchived` : `${card.name} archived`);
      }}
      onDelete={() => {
        deleteAsset(def.id as CatalogueType, card.id);
        toast.success(`${card.name} deleted`, { description: "Local to this session." });
      }}
    />
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5 rounded-xl border border-border p-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
