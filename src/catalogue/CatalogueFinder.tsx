import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Search, Tag, Building2, Package, ChevronRight, ExternalLink, Plus,
  Layers, FileText, Globe, Settings as SettingsIcon, Wand2,
  Users, Megaphone,
  Crosshair, MessageSquareQuote, Lightbulb, UserRound, Mic, Volume2,
  Languages, GitBranch, SlidersHorizontal, Copy, Trash2, Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brands, categories, products, audiences,
  angles, hooks, concepts, avatars, voices,
  scripts, ctas, templates, references,
} from "@/mocks/shared";
import type {
  Brand, Category, Product, Audience,
  Angle, Hook, Concept, Avatar, Voice,
} from "@/genie6/types/entities";
import type { ScriptAsset } from "@/mocks/shared/scripts";
import type { CtaAsset } from "@/mocks/shared/ctas";
import type { TemplateAsset } from "@/mocks/shared/templates";
import type { ReferenceAsset } from "@/mocks/shared/references";
import { SectionHeader } from "@/genie6/studio-v4/components/SectionHeader";
import {
  BrandDetail,
  CategoryDetail,
  ProductDetail,
  NotFound,
  StoryboardScenes,
  FrameworkStructure,
} from "./CatalogueDetailPage";
import { getFramework, type Framework } from "@/genie6/editor/frameworks";
import type { StoryboardAsset } from "@/mocks/shared/storyboards";
// Leaf taxonomy file — no cycle (same file `assetTypes.ts` already imports
// it from for the exact same reason: Avatar.personalityId / paired-voice
// tone are ids into these tables, never a raw string).
import { personalityLabel, VOICE_TONES } from "@/genie6/brain/avatarTaxonomy";
import { AddBrandModal } from "./AddBrandModal";
import { AddProductModal } from "./AddProductModal";
import { AddCategoryModal } from "./AddCategoryModal";
import {
  getAssetType,
  findEntityById,
  firstIdForType,
  buildDuplicate,
  groupedAssetTypes,
  type CatalogueType,
  type AssetCardData,
} from "./assetTypes";
import {
  useCatalogueWrites,
  addAsset,
  archiveAsset,
  deleteAsset,
  duplicateAsset,
} from "./catalogue-write-store";
import { CreditsPill, ProvenanceBadge, UnknownAssetType } from "./CatalogueShared";
import { AssetDetailActions } from "./AssetDetailActions";
import { GenerationsFromAsset, deriveGenieMatchCriteria } from "./GenerationsFromAsset";
// Aliased: this file already declares its own local `FieldList`/`FieldRow`
// (a simpler single-string-value pair used by Avatar's own field grid) —
// the DetailKit versions accept a ReactNode `value` + `emptyLabel`, which
// is what a real cross-link `<Link>` inside a field row needs.
import {
  SectionCard, FieldList as DetailFieldList, FieldRow as DetailFieldRow,
  Chip, ChipList, StatStrip, StatStripItem, CollapsibleCard, PillButton,
} from "./detail/DetailKit";
import { useInGenieUrl, bulkUseInGenieUrl, brandNameForProducts } from "./genieHandoff";
import { AssetFormModal } from "./AssetFormModal";
import { primaryActionFor } from "./assetActions";
import { CatalogueBulkBar } from "./CatalogueBulkBar";
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

type AnyEntity =
  | Brand | Category | Product | Audience
  | Angle | Hook | Concept | Avatar | Voice
  | ScriptAsset | CtaAsset | TemplateAsset | ReferenceAsset;

/** §10 "Search, sorting and filters across Brands → Products / Categories.
 *  With ten asset types in here, navigation depends on it." — no
 *  user-facing sort existed anywhere in the module; this is pane-1's.
 *  "Default" preserves the registry's existing resolve() order (unsorted)
 *  so picking no option changes nothing about today's behaviour. */
type SortKey = "default" | "name-asc" | "name-desc" | "recent" | "usage";
/**
 * The asset types that wear the owner's 2026-09-15 Figma treatment: the
 * 250px panel with "+ Add new …", and a single-page detail with no section
 * column. Scripts got it first; he then asked for "the other sub menu also,
 * just like script".
 *
 * DERIVED from the registry — it is exactly "the creative types currently on
 * the sub-nav", i.e. not `navHidden`. Hand-listing six strings here would be
 * a seventh copy of the type list in a file that already learned that lesson
 * (routes, the App redirect table and two breadcrumb maps had all drifted).
 * Surface a new type in `appRegistry.ts` and it inherits this automatically.
 */
const SPEC_TYPES: ReadonlySet<CatalogueType> = new Set(
  (groupedAssetTypes().find((g) => g.group === "creative")?.types ?? []).map((d) => d.id),
);

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default order" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "recent", label: "Last used" },
  { value: "usage", label: "Most used" },
];

/**
 * CatalogueFinder — 3-pane drill-down (Genie WorkspaceMasterDetail pattern).
 *
 *   Pane 1 (260px):  Entity list of the active type. Scroll, search, click to select.
 *   Pane 2 (280px):  Sections of the selected entity (Overview / Products / etc.).
 *                    Each section shows item count + a child list to drill into.
 *   Pane 3 (flex):   Detail of the selected child (or section overview if no child picked).
 *
 * Iter-6 A-9.7. Replaces the grid-based CatalogueListPage for entity browsing.
 * Per-type section configs below — easy to extend.
 */

export function CatalogueFinder({ type }: { type: CatalogueType }) {
  const def = getAssetType(type);
  const writes = useCatalogueWrites(); // subscribes so resolve() below sees fresh writes
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoading = searchParams.get("loading") === "1";
  // A-12.46 (Maalik): pane-1 search query is URL-backed via ?q= so HTML.to.design
  // captures + hard refreshes preserve the typed-in filter exactly.
  const query = searchParams.get("q") ?? "";
  const setQuery = (value: string) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (value) sp.set("q", value);
        else sp.delete("q");
        return sp;
      },
      { replace: true },
    );
  };
  // §10 sorting — URL-backed via ?sort= for the same reason ?q= is: a
  // hard refresh or a captured link should reproduce exactly what was on
  // screen, not silently reset to unsorted.
  const sort = (searchParams.get("sort") as SortKey | null) ?? "default";
  const setSort = (value: SortKey) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (value !== "default") sp.set("sort", value);
        else sp.delete("sort");
        return sp;
      },
      { replace: true },
    );
  };
  // A-12.46 (Maalik): pane-1 selection for non-B/P/C entities is URL-backed via
  // ?selected=. Brand/product/category own selection via the route param, so
  // they keep their existing first-entity fallback and ignore ?selected.
  const isRouteOwned = type === "brands" || type === "products" || type === "categories";
  const urlSelected = searchParams.get("selected");
  // RECON bug fix: this used to ignore `:id` entirely and always fall back
  // to the first item (`/catalogue/products/prod-x` rendered `products[0]`).
  // `routeId` is now read directly and validated against the registry
  // before trusting it, for every type — not just the three that happen to
  // route straight through this component.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (routeId && def && findEntityById(type, routeId)) return routeId;
    if (!isRouteOwned && urlSelected) return urlSelected;
    return def ? (firstIdForType(type) ?? null) : null;
  });
  // Keep selection in sync with the route on navigation (e.g. a ListPage
  // card click, or a direct deep link) — not just on first mount.
  useEffect(() => {
    if (routeId && def && findEntityById(type, routeId)) {
      setSelectedId(routeId);
      setSection("overview");
      setChildId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, type]);
  const [section, setSection] = useState<string>("overview");
  const [childId, setChildId] = useState<string | null>(null);
  // Add modal — single state, the type drives which modal renders.
  const [addOpen, setAddOpen] = useState(false);
  // Bulk select — §9 / §21.2, one Set of ids, cleared whenever the type changes.
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  useEffect(() => {
    setBulkSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (!def) return <UnknownAssetType type={type} />;

  // An `:id` in the URL that resolves to NOTHING must say so — see the
  // `routeUnresolved` bail below, which is deliberately placed after the last
  // hook rather than here.
  const routeUnresolved = !!routeId && !findEntityById(type, routeId);

  const canAdd = isRouteOwned || !!def.addForm;

  const handleAddClick = () => {
    if (isRouteOwned) {
      setAddOpen(true);
      return;
    }
    if (def.addForm) {
      setAddOpen(true);
      return;
    }
    // Avatars: no addForm by design (V1 is presets-only — §9/§13).
    toast.info(`${def.singular} creation isn't available yet`, {
      description: "Avatar presets ship in V1; avatar creation is a V2 feature.",
    });
  };

  const handleAddSubmit = (input: { name: string; tags: string[]; body?: string }) => {
    if (!def.buildAdded) return;
    const created = def.buildAdded(input);
    addAsset(def.id, created as { id: string });
  };

  // Registry-driven data resolution + search — replaces both the
  // per-type data ternary AND the per-type search-matching ternary RECON
  // flagged (the ternary's fallthrough default silently rendered
  // `products`; a type absent from the registry now bails out above
  // instead). Search matches against the same name/subtitle/tags the
  // asset-card grammar surfaces, so Finder and the grid page never
  // disagree about what "matches" means.
  const items = useMemo<AnyEntity[]>(() => {
    const base = def.resolve() as AnyEntity[];
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? base
      : base.filter((it) => {
          const card = def.toCard(it);
          return (
            card.name.toLowerCase().includes(q) ||
            (card.subtitle?.toLowerCase().includes(q) ?? false) ||
            card.tags.some((t) => t.toLowerCase().includes(q))
          );
        });
    if (sort === "default") return filtered;
    // Sort off the same card grammar every type already produces — no
    // per-type sort comparator needed, same reasoning as toCard() itself.
    return [...filtered].sort((a, b) => {
      const cardA = def.toCard(a);
      const cardB = def.toCard(b);
      switch (sort) {
        case "name-asc":
          return cardA.name.localeCompare(cardB.name);
        case "name-desc":
          return cardB.name.localeCompare(cardA.name);
        case "recent":
          return cardB.lastUsedAt.localeCompare(cardA.lastUsedAt);
        case "usage":
          return cardB.usageCount - cardA.usageCount;
        default:
          return 0;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, query, writes, sort]);

  // A deleted (or searched-away) selection must not keep rendering its
  // detail pane — after "Delete Notion" the left list dropped the row while
  // the right pane still showed Notion's full profile with live buttons.
  useEffect(() => {
    if (selectedId && !items.some((it) => def.getId(it) === selectedId)) {
      setSelectedId(items[0] ? def.getId(items[0]) : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedId]);

  // An `:id` in the URL that resolves to NOTHING must say so. It used to fall
  // through to `firstIdForType(type)`, rendering the FIRST seed row of the
  // type — its real name, tags and metrics — under a URL naming a vanished
  // id, with no error anywhere on screen. Session-saved assets live in an
  // in-memory store that empties on reload, so any "View in Assets" link
  // followed after a refresh hit exactly this. Same `NotFound` the `/grid/:id`
  // route already renders, imported rather than a second grammar invented.
  //
  // Placed AFTER the last hook on purpose. Unlike the `!def` bail above
  // (whose condition is fixed for the life of a mount), this one FLIPS while
  // mounted — navigate a valid id → a bad one, or delete the asset you are
  // looking at — and an early return above the hooks would change the hook
  // count between renders and crash React.
  //
  // The guard is on `routeId` only: `/assets/<type>` with no id at all still
  // opens on the first entity, which is the intended landing behaviour.
  if (routeUnresolved) {
    return <NotFound type={type} navigate={navigate} />;
  }

  const handleSelectEntity = (id: string) => {
    setSelectedId(id);
    setSection("overview");
    setChildId(null);
    // Mirror selection into the URL for non-route-owned types so HTML.to.design
    // captures preserve which entity is active in pane-1 after a hard refresh.
    if (!isRouteOwned) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (id) sp.set("selected", id);
          else sp.delete("selected");
          return sp;
        },
        { replace: true },
      );
    }
  };

  // §9 "Bulk select with bulk actions" / §21.2 "Multi-select and bulk
  // behave IDENTICALLY everywhere" — this is the LIVE surface (RECON:
  // CatalogueListPage's grid "survives only behind /grid"), so bulk
  // selection lives here too, not only on the grid page.
  const toggleBulkSelect = (bulkId: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bulkId)) next.delete(bulkId);
      else next.add(bulkId);
      return next;
    });
  };
  const bulkIds = Array.from(bulkSelected);
  const bulkCount = bulkIds.length;

  const handleBulkArchive = () => {
    bulkIds.forEach((bid) => archiveAsset(def.id, bid, true));
    toast.success(`${bulkCount} archived`);
    setBulkSelected(new Set());
  };
  const handleBulkDuplicate = () => {
    let created = 0;
    for (const bid of bulkIds) {
      const source = items.find((it) => it.id === bid);
      if (!source) continue;
      const clone = buildDuplicate(def, source as { id: string });
      duplicateAsset(def.id, bid, clone);
      created += 1;
    }
    toast.success(`${created} duplicated`, { description: "Local to this session." });
    setBulkSelected(new Set());
  };
  const handleBulkDownload = () => {
    toast.success(`${bulkCount} prepared for download`, {
      description: "Prototype surface: no real files are attached.",
    });
  };
  const handleBulkDeleteConfirm = () => {
    bulkIds.forEach((bid) => deleteAsset(def.id, bid));
    toast.success(`${bulkCount} deleted`, { description: "Local to this session." });
    setBulkSelected(new Set());
    setBulkDeleteConfirmOpen(false);
  };
  // §9 "Bulk product selection ... Selecting N products produces ONE ad
  // containing all of them — not N separate ads." Products is the one
  // type where multi-select changes what Generate DOES, so it states the
  // outcome before the user commits, and its bulk "Use in Genie" carries
  // all N ids via `?products=` (see genieHandoff.ts's report note).
  //
  // Categories: §10 "Bulk product selection applies to Category Ad and
  // Product Ad" — but Studio's URL sync (genieHandoff.ts, read-only for
  // this surface) only understands ONE bulk param, `?bulkProducts=`
  // (product ids), not a bulk-category equivalent. So selecting N
  // categories resolves every product across those categories and hands
  // THAT off as one ad — same "N things become ONE ad" promise, just
  // resolved down to the product ids Studio actually reads.
  const categoryBulkProductIds =
    type === "categories"
      ? products.filter((p) => p.categoryId && bulkIds.includes(p.categoryId)).map((p) => p.id)
      : [];
  const bulkProductNotice =
    type === "products" && bulkCount >= 2
      ? `${bulkCount} products${brandNameForProducts(bulkIds) ? ` from ${brandNameForProducts(bulkIds)}` : ""} will become ONE ad, not ${bulkCount} separate ads.`
      : type === "categories" && bulkCount >= 2
        ? categoryBulkProductIds.length > 0
          ? `${bulkCount} categories (${categoryBulkProductIds.length} products) will become ONE ad, not ${bulkCount} separate ads.`
          : `${bulkCount} categories selected — none have products yet, so there's nothing to hand off to Genie.`
        : undefined;
  const handleBulkUseInGenie =
    type === "products"
      ? () => navigate(bulkUseInGenieUrl(bulkIds))
      : type === "categories"
        ? () => {
            if (categoryBulkProductIds.length === 0) {
              toast.info("No products to hand off", {
                description: "The selected categories don't have any products yet.",
              });
              return;
            }
            navigate(bulkUseInGenieUrl(categoryBulkProductIds));
          }
        : undefined;

  const handleSelectSection = (s: string) => {
    setSection(s);
    setChildId(null);
  };

  return (
    <div className="v3-page-mesh flex h-full flex-col bg-background">
      {/* Top header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <def.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{def.label}</h1>
            <p className="text-[11px] text-muted-foreground">{def.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* §15 — credits balance now also shows in Catalogue, not just the Genie sub-nav. */}
          <CreditsPill />
          {canAdd && (
            <button
              type="button"
              onClick={handleAddClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-[1.02] active:scale-[0.99] transition-transform"
            >
              <Plus className="h-3.5 w-3.5" />
              New {def.singular}
            </button>
          )}
        </div>
      </header>

      {bulkCount >= 2 && (
        <div className="px-4 pt-3 shrink-0">
          <CatalogueBulkBar
            count={bulkCount}
            onDuplicate={handleBulkDuplicate}
            onArchive={handleBulkArchive}
            onDelete={() => setBulkDeleteConfirmOpen(true)}
            onDownload={handleBulkDownload}
            /* Same reason the Generations panel drops its CTA: the owner asked
               this type's headline action to be disabled for now, and bulk
               "Use in Genie" is that same trip by another door. Passing
               undefined makes CatalogueBulkBar omit the button entirely — it
               already renders it only when the handler exists. */
            onUseInGenie={primaryActionFor(type) ? undefined : handleBulkUseInGenie}
            useInGenieLabel="Use in Genie (1 ad)"
            bulkProductNotice={bulkProductNotice}
            onClear={() => setBulkSelected(new Set())}
          />
        </div>
      )}

      {/* 3-pane Finder body */}
      <div className="flex-1 flex min-h-0">
        {/* PANE 1 — entity list.
            Owner Figma spec (2026-09-15), Scripts only: dedicated 250px
            header (pill "+ Add new script" + restyled search/filter row)
            and dedicated row shape (round tile + two-line title/meta,
            lime active state). Every other type keeps the original
            260px generic header + `Pane1Row` untouched. */}
        <aside className={cnSafe("flex-shrink-0 border-r border-border flex flex-col", SPEC_TYPES.has(type) ? "w-[250px]" : "w-[260px]")}>
          {SPEC_TYPES.has(type) ? (
            <div className="border-b border-border px-3 py-2 shrink-0 space-y-2">
              {/* Label from the registry, never the word "script" — this
                  header is now shared by all six types. `canAdd` is false
                  for the ones with no `addForm` (Avatar + voice, Framework,
                  Storyboard are presets-only by registry decision), and a
                  button that opens a modal which cannot build the thing is
                  worse than one that says so. */}
              <button
                type="button"
                onClick={handleAddClick}
                disabled={!canAdd}
                title={canAdd ? undefined : `${def.singular} is presets-only for now`}
                className={cnSafe(
                  "flex h-8 w-full items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-normal leading-5 tracking-[-0.08px] transition-transform",
                  canAdd
                    ? "bg-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.99]"
                    : "cursor-not-allowed bg-primary/10 text-primary-text",
                )}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add new {def.singular.toLowerCase()}
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 flex-1 items-center gap-2 rounded-full bg-foreground/[0.03] px-3">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${def.label.toLowerCase()}…`}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-sm placeholder:text-muted-foreground outline-none"
                  />
                </div>
                {/* Same sort state/wiring as every other type — restyled from
                    a labeled dropdown into an icon-only filter button
                    (Select's own chevron hidden via the established
                    `[&>svg:last-child]:hidden` trick, already used for this
                    exact "Select as icon button" pattern in
                    InsightsV2Toolbar.tsx). */}
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger
                    aria-label={`Sort ${def.label.toLowerCase()}`}
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-transparent p-0 [&>svg:last-child]:hidden"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 border-b border-border shrink-0 space-y-1.5">
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${def.label.toLowerCase()}…`}
                  className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-7 w-full text-[11px] text-muted-foreground" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-1">
            {isLoading ? (
              <Pane1Skeleton />
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No {def.label.toLowerCase()} match "{query}"
              </p>
            ) : SPEC_TYPES.has(type) ? (
              items.map((item) => {
                const id = def.getId(item);
                return (
                  <SpecPane1Row
                    key={id}
                    card={def.toCard(item)}
                    icon={def.icon}
                    active={selectedId === id}
                    onClick={() => handleSelectEntity(id)}
                    selected={bulkSelected.has(id)}
                    onToggleSelect={() => toggleBulkSelect(id)}
                  />
                );
              })
            ) : (
              items.map((item) => {
                const active = selectedId === item.id;
                return (
                  <Pane1Row
                    key={item.id}
                    item={item}
                    type={type}
                    active={active}
                    onClick={() => handleSelectEntity(item.id)}
                    bulkSelected={bulkSelected.has(item.id)}
                    onToggleBulkSelect={() => toggleBulkSelect(item.id)}
                  />
                );
              })
            )}
          </div>
        </aside>

        {/* PANE 2 — sections.
            A-12.42-45 (Maalik): pane-2 sub-nav removed for brands, products,
            AND categories — each detail component carries its own tab strip
            in pane 3. Owner spec 2026-09-15: removed for scripts too — the
            four other tabs (angle/avatar/type/framework) just re-rendered
            the linked entity's OWN overview, which `ScriptSectionView`'s
            "overview" branch already showed inline. One scrolling page,
            no duplicate tab nav. Other entity types still render pane 2. */}
        {type !== "brands" && type !== "products" && type !== "categories" && !SPEC_TYPES.has(type) && (isLoading || selectedId) && (
          <aside className="w-[280px] flex-shrink-0 border-r border-border flex flex-col">
            {isLoading ? (
              <Pane2Skeleton />
            ) : (
              <Pane2Sections
                type={type}
                selectedId={selectedId!}
                activeSection={section}
                activeChildId={childId}
                onSelectSection={handleSelectSection}
                onSelectChild={(s, id) => {
                  setSection(s);
                  setChildId(id);
                }}
              />
            )}
          </aside>
        )}

        {/* PANE 3 — detail */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          {isLoading ? (
            <Pane3Skeleton />
          ) : (
            selectedId && (
              <Pane3Detail
                type={type}
                selectedId={selectedId}
                section={section}
                childId={childId}
              />
            )
          )}
        </main>
      </div>

      {/* Add modals — only mounted when their type is active. Single state
          drives whichever modal corresponds to the current entity type.
          Brand/Product/Category keep their existing dedicated modals
          untouched; every other Creative type with an `addForm` shares
          the one generic `AssetFormModal` (§9 "manually add or upload"). */}
      {type === "brands" && (
        <AddBrandModal
          open={addOpen}
          onOpenChange={setAddOpen}
          // Without this the modal toasted "Brand created … added to catalogue"
          // and nothing appeared — the row count stayed at 58 (QA-confirmed).
          // Build a complete Brand record so BrandDetail/toCard (usps, colors,
          // categoryIds…) never hit an undefined field.
          onCreated={(p) => {
            const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const id = `brand-${slug}-${Date.now().toString(36)}`;
            addAsset("brands", {
              id,
              name: p.name,
              domain: p.domain,
              logo: `https://www.google.com/s2/favicons?sz=128&domain=${p.domain}`,
              category: categories.find((c) => c.id === p.categoryId)?.name ?? "Uncategorised",
              categoryIds: p.categoryId ? [p.categoryId] : [],
              tone: p.voice,
              fonts: { display: "Geist", body: "Geist" },
              colors: [],
              voice: p.voice,
              usps: [],
              competitors: [],
              productIds: [],
            });
            navigate(`/catalogue/brands/${id}`);
          }}
        />
      )}
      {type === "products" && (
        <AddProductModal
          open={addOpen}
          onOpenChange={setAddOpen}
          // Same bug as AddBrandModal (QA-confirmed): onCreated was never
          // passed here, so the modal toasted "Product created" and the
          // row never appeared. Build a complete Product record so
          // ProductDetail/toCard (thumbnail, landingPages, campaignUrls,
          // variants…) never hit an undefined field.
          onCreated={(p) => {
            const brand = brands.find((b) => b.id === p.brandId);
            const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const id = `product-${slug}-${Date.now().toString(36)}`;
            addAsset("products", {
              id,
              brandId: p.brandId,
              categoryId: brand?.categoryIds?.[0],
              name: p.name,
              price: p.price,
              thumbnail: brand?.logo,
              benefits: p.benefits,
              promo: undefined,
              landingPages: [],
              campaignUrls: [],
              generatedCount: 0,
              variants: [],
            });
            navigate(`/catalogue/products/${id}`);
          }}
        />
      )}
      {type === "categories" && (
        <AddCategoryModal
          open={addOpen}
          onOpenChange={setAddOpen}
          // Same bug — onCreated was never passed, so a new category
          // vanished after the toast. Build a complete Category record.
          onCreated={(c) => {
            const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const id = `category-${slug}-${Date.now().toString(36)}`;
            addAsset("categories", {
              id,
              name: c.name,
              similarCategoryIds: [],
              referenceUrls: [],
              instruction: c.instruction,
              winnerCount: 0,
              feedbackCount: 0,
            });
            navigate(`/catalogue/categories/${id}`);
          }}
        />
      )}
      {!isRouteOwned && def.addForm && (
        <AssetFormModal
          open={addOpen}
          onOpenChange={setAddOpen}
          mode="add"
          singular={def.singular}
          addForm={def.addForm}
          onSubmit={handleAddSubmit}
        />
      )}

      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkCount} {def.label.toLowerCase()}?</AlertDialogTitle>
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
              Delete {bulkCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Pane skeletons (Phase C P2-C2) ─────────────────────────
   `?loading=1` URL flag forces these — useful for stakeholder demos
   and when CatalogueFinder is wired to async backend later (right
   now `brands/categories/products` are sync mock imports).
   Skeleton dimensions match the actual pane content so there's no
   layout shift when data arrives.
   ─────────────────────────────────────────────────────────── */
function Pane1Skeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-3 py-2 flex items-center gap-2.5">
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pane2Skeleton() {
  return (
    <div className="flex flex-col">
      {/* Header strip */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* Section rows */}
      <div className="flex-1 overflow-y-auto py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-3 py-2 flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
            <Skeleton className="h-3 flex-1 max-w-[140px]" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Pane3Skeleton() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      {/* Body sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

/* ─── Pane 1 row ────────────────────────────────────────── */
function Pane1Row({
  item,
  type,
  active,
  onClick,
  bulkSelected,
  onToggleBulkSelect,
}: {
  item: AnyEntity;
  type: CatalogueType;
  active: boolean;
  onClick: () => void;
  bulkSelected?: boolean;
  onToggleBulkSelect?: () => void;
}) {
  const meta = (() => {
    if (type === "brands") {
      const b = item as Brand;
      return { line1: b.name, line2: b.domain, logo: b.logo, fallbackIcon: Building2 as React.ElementType };
    }
    if (type === "categories") {
      const c = item as Category;
      const productCount = products.filter((p) => p.categoryId === c.id).length;
      return { line1: c.name, line2: `${productCount} products`, logo: undefined, fallbackIcon: Tag as React.ElementType };
    }
    if (type === "audiences") {
      const a = item as Audience;
      const brand = a.brandId ? brands.find((b) => b.id === a.brandId) : undefined;
      return {
        line1: a.label,
        line2: brand ? `${brand.name} · ${a.segment}` : a.segment,
        logo: brand?.logo,
        fallbackIcon: Users as React.ElementType,
      };
    }
    if (type === "angles") {
      const a = item as Angle;
      return { line1: a.label, line2: a.description ?? "", logo: undefined, fallbackIcon: Crosshair as React.ElementType };
    }
    if (type === "hooks") {
      const h = item as Hook;
      const brand = h.brandId ? brands.find((b) => b.id === h.brandId) : undefined;
      const angle = h.angleId ? angles.find((an) => an.id === h.angleId) : undefined;
      return {
        line1: h.text,
        line2: [brand?.name, angle?.label].filter(Boolean).join(" · "),
        logo: brand?.logo,
        fallbackIcon: MessageSquareQuote as React.ElementType,
      };
    }
    if (type === "concepts") {
      const c = item as Concept;
      const brand = brands.find((b) => b.id === c.brandId);
      return {
        line1: c.name,
        line2: `${c.angle} · ${c.tone}`,
        logo: brand?.logo,
        fallbackIcon: Lightbulb as React.ElementType,
      };
    }
    if (type === "avatars") {
      const av = item as Avatar;
      return {
        line1: av.name,
        line2: av.demographic,
        logo: undefined,
        fallbackIcon: UserRound as React.ElementType,
      };
    }
    if (type === "voices") {
      const v = item as Voice;
      return {
        line1: v.name,
        line2: v.language,
        logo: undefined,
        fallbackIcon: Mic as React.ElementType,
      };
    }
    // Generic fallback — every type without a bespoke branch above
    // (Products, Scripts, CTAs, Frameworks, Templates, References) renders
    // through the registry's own card shape instead of assuming a type
    // that isn't there. This is what replaces RECON's fallthrough-to-
    // `products` bug — a genuinely unrecognised type would have already
    // been caught by the `!def` check in `CatalogueFinder` itself.
    const def = getAssetType(type);
    const card = def?.toCard(item);
    return {
      line1: card?.name ?? "—",
      line2: card?.subtitle ?? "",
      logo: card?.thumbnail,
      fallbackIcon: (def?.icon ?? Package) as React.ElementType,
    };
  })();
  const FallbackIcon = meta.fallbackIcon;
  // Avatar gets a deterministic colored circle instead of plain icon.
  const avatarVis = type === "avatars" ? avatarVisual(item as Avatar) : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cnSafe(
        "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors cursor-pointer",
        active ? "bg-primary/10" : "hover:bg-muted/40"
      )}
    >
      {onToggleBulkSelect && (
        // <Checkbox> (Radix) renders its own <button> — wrapping it in
        // another <button> is invalid DOM nesting. A <span role="button">
        // gives the same click target + keyboard reachability without it.
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBulkSelect();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onToggleBulkSelect();
            }
          }}
          aria-label={bulkSelected ? "Deselect" : "Select"}
          className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border border-border bg-background"
        >
          <Checkbox checked={!!bulkSelected} className="h-3.5 w-3.5" />
        </span>
      )}
      {meta.logo ? (
        <img src={meta.logo} alt="" className="h-6 w-6 rounded-md bg-muted shrink-0" />
      ) : avatarVis ? (
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
          style={{ background: avatarVis.bg, color: avatarVis.fg }}
        >
          {avatarVis.initials}
        </div>
      ) : (
        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
          <FallbackIcon className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={cnSafe(
          "text-[13px] font-medium truncate",
          active ? "text-primary-text" : "text-foreground",
          // Hooks have long quoted copy — clamp to 1 line so the row stays compact.
          type === "hooks" && "italic"
        )}>
          {meta.line1}
        </p>
        {meta.line2 && (
          <p className="text-[10px] text-muted-foreground truncate">{meta.line2}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Spec pane-1 row (all SPEC_TYPES) ──────────────────── */
/**
 * Owner Figma spec (2026-09-15), now worn by every type on the sub-nav —
 * distinct from the generic `Pane1Row` above (which the `navHidden` types
 * and the three Business types still use unmodified):
 * a 24px round tile + two-line title/meta. Active state is a lime fill +
 * right-side accent bar, not the generic row's `bg-primary/10` treatment.
 *
 * THE CHECKBOX IS REVEALED, NOT RESIDENT. The spec's row anatomy has no
 * checkbox slot, and an earlier pass read that as "delete bulk-select" —
 * which made Scripts the only one of nine asset types with no way to reach
 * the bulk bar (Use in Genie / Duplicate / Archive / Delete), measured 0
 * checkboxes against 9-60 everywhere else. A drawing of a row at rest is
 * not an instruction to remove a capability. So: the resting row matches
 * the spec exactly, and the checkbox appears on hover, on focus, or while
 * selected — the same reveal the generic `Pane1Row` already uses.
 *
 * `#F5FBE2`/`#749818` are the same "fab-funnel/1" / "fab-funnel/7" lime
 * tint + border already used as literal hex across ~15 non-g6 files
 * (StrategyEditor.tsx, LaunchSettings.tsx, AccountSelectorPanel.tsx, …) —
 * there is no non-g6 Tailwind token for them (only the g6-* namespace
 * registers one, and that cascades via `data-theme` on `<html>` which this
 * file's `/catalogue`-mounted path never sets — see CLAUDE.md's g6 token
 * warning), so this follows the established non-g6 literal-hex convention
 * instead of risking an invisible border outside Genie routes. The active
 * title colour reuses `text-primary-text` (a real registered token) since
 * its light-mode value (`hsl(75 84% 25%)` ≈ `#5A750A`) is effectively the
 * spec's `#5B750A` — a token name over a near-identical raw value, per
 * house rule. `#F7F7F7` tile bg and `#8B8893` meta text both map onto
 * `bg-muted` / `text-muted-foreground` — DetailKit's own header already
 * establishes both of those exact hex → token mappings.
 */
function SpecPane1Row({
  card,
  icon: Icon,
  active,
  onClick,
  selected,
  onToggleSelect,
}: {
  /** The registry's own normalised card — so the meta line is whatever that
   *  type already decided it was ("PAS · 28s", "Female · 28-34 · South
   *  Asian", "3 scenes · 9:16"), never re-derived per type here. */
  card: AssetCardData;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  /** Bulk-select state. Named to match the generic `Pane1Row`'s
   *  `bulkSelected`/`onToggleBulkSelect` pair it mirrors. */
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cnSafe(
        "group/script flex w-full cursor-pointer items-start gap-2 p-3 text-left transition-colors",
        active ? "rounded-[12px_0_0_12px] border-r-2 border-[#749818] bg-[#F5FBE2]" : "hover:bg-muted/40",
      )}
    >
      <span
        className={cnSafe(
          "mt-0.5 shrink-0 transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover/script:opacity-100 group-focus-within/script:opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect()}
          aria-label={selected ? `Deselect ${card.name}` : `Select ${card.name}`}
        />
      </span>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cnSafe(
            "truncate text-[13px] font-medium leading-5 tracking-[-0.08px]",
            active ? "text-primary-text" : "text-foreground",
          )}
          /* Always set: a length test never fires, because what
             truncates is WIDTH. 7 of 12 seeded titles clip in the
             250px pane and none of them reached 40 characters. */
          title={card.name}
        >
          {card.name}
        </p>
        <p className="truncate text-[10px] font-normal leading-[15px] text-muted-foreground">
          {card.subtitle || "—"}
        </p>
      </div>
    </div>
  );
}

/* ─── Pane 2 sections ──────────────────────────────────── */
type SectionDef = {
  key: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  children?: { id: string; label: string; sub?: string }[];
};

function getSections(type: CatalogueType, selectedId: string): SectionDef[] {
  if (type === "brands") {
    const linkedProducts = products.filter((p) => p.brandId === selectedId);
    const linkedCategories = categories.filter((c) => brands.find((b) => b.id === selectedId)?.categoryIds?.includes(c.id));
    const linkedAudiences = audiences.filter((a) => a.brandId === selectedId);
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "products", label: "Products", icon: Package, count: linkedProducts.length, children: linkedProducts.map((p) => ({ id: p.id, label: p.name, sub: p.price })) },
      { key: "categories", label: "Categories", icon: Tag, count: linkedCategories.length, children: linkedCategories.map((c) => ({ id: c.id, label: c.name })) },
      { key: "audiences", label: "Audiences", icon: Users, count: linkedAudiences.length, children: linkedAudiences.map((a) => ({ id: a.id, label: a.label, sub: a.segment })) },
      { key: "kb", label: "Knowledge Base", icon: Layers },
      { key: "settings", label: "Settings", icon: SettingsIcon },
    ];
  }
  if (type === "categories") {
    const linkedProducts = products.filter((p) => p.categoryId === selectedId);
    const linkedBrands = brands.filter((b) => b.categoryIds?.includes(selectedId));
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "brands", label: "Brands", icon: Building2, count: linkedBrands.length, children: linkedBrands.map((b) => ({ id: b.id, label: b.name })) },
      { key: "products", label: "Products", icon: Package, count: linkedProducts.length, children: linkedProducts.map((p) => ({ id: p.id, label: p.name, sub: p.price })) },
      { key: "kb", label: "Knowledge Base", icon: Layers },
      { key: "references", label: "Reference URLs", icon: Globe },
    ];
  }
  if (type === "audiences") {
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "brand", label: "Parent brand", icon: Building2 },
      { key: "campaigns", label: "Linked campaigns", icon: Megaphone, count: 0 },
      { key: "kb", label: "Knowledge Base", icon: Layers },
    ];
  }
  if (type === "angles") {
    // High-level entity, no parent. Hooks + concepts that reference this angle.
    const angle = angles.find((a) => a.id === selectedId);
    const linkedHooks = hooks.filter((h) => h.angleId === selectedId);
    const linkedConcepts = angle
      ? concepts.filter((c) => c.angle.toLowerCase() === angle.label.toLowerCase())
      : [];
    return [
      { key: "overview", label: "Overview", icon: FileText },
      {
        key: "hooks", label: "Linked hooks", icon: MessageSquareQuote,
        count: linkedHooks.length,
        children: linkedHooks.map((h) => ({ id: h.id, label: h.text })),
      },
      {
        key: "concepts", label: "Linked concepts", icon: Lightbulb,
        count: linkedConcepts.length,
        children: linkedConcepts.map((c) => ({ id: c.id, label: c.name, sub: c.tone })),
      },
      { key: "generations", label: "Generations", icon: Wand2, count: 0 },
    ];
  }
  // Hooks / Concepts / Avatars: owner spec 2026-09-15 — pane 2 removed
  // entirely (see the Finder's pane-2 render guard above), same treatment
  // as Scripts. `HookSectionView` / `ConceptSectionView` / `AvatarSectionView`
  // are now one scrolling page each, so `getSections` is never called for
  // these three.
  if (type === "voices") {
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "language", label: "Language", icon: Languages },
      { key: "sample", label: "Sample", icon: Volume2 },
      { key: "generations", label: "Generations", icon: Wand2, count: 0 },
    ];
  }
  if (type === "products") {
    const product = products.find((p) => p.id === selectedId);
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "landingPages", label: "Landing Pages", icon: Globe, count: product?.landingPages?.length ?? 0 },
      { key: "campaignUrls", label: "Campaign URLs", icon: ExternalLink, count: product?.campaignUrls?.length ?? 0 },
      { key: "kb", label: "Knowledge Base", icon: Layers },
      { key: "generations", label: "Generations", icon: Wand2, count: product?.generatedCount ?? 0 },
    ];
  }
  // Scripts: owner spec 2026-09-15 — pane 2 removed entirely (see the
  // Finder's pane-2 render guard above). `ScriptSectionView` is now one
  // scrolling page carrying everything this section list used to gate
  // behind tabs, so `getSections` is never called for "scripts".
  // Frameworks / Storyboards: same removal as Hooks/Concepts/Avatars above
  // — one scrolling page, no pane-2 section list.
  // CTAs / Templates / References — untouched §21.2 types with no
  // relational data model to cross-link, so a generic Overview +
  // Generations pair (same as every other simple type ends with) is
  // honest rather than inventing bespoke relations that don't exist.
  return [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "generations", label: "Generations", icon: Wand2, count: 0 },
  ];
}

function Pane2Sections({
  type,
  selectedId,
  activeSection,
  activeChildId,
  onSelectSection,
  onSelectChild,
}: {
  type: CatalogueType;
  selectedId: string;
  activeSection: string;
  activeChildId: string | null;
  onSelectSection: (s: string) => void;
  onSelectChild: (s: string, id: string) => void;
}) {
  const sections = getSections(type, selectedId);
  // Registry-driven — replaces the per-type "primary label" ternary.
  const def = getAssetType(type);
  const entityItem = def ? findEntityById(type, selectedId) : undefined;
  const entityName = def && entityItem ? def.getName(entityItem) : "—";
  const entityKindLabel = def?.singular ?? type;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-border shrink-0">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {entityKindLabel}
        </p>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{entityName}</p>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {sections.map((sec) => {
          const SecIcon = sec.icon;
          const isOpen = activeSection === sec.key;
          return (
            <div key={sec.key}>
              <button
                type="button"
                onClick={() => onSelectSection(sec.key)}
                className={cnSafe(
                  "w-full text-left px-3 py-2 flex items-center gap-2 transition-colors",
                  isOpen && !activeChildId ? "bg-primary/10 text-primary-text" : "hover:bg-muted/40 text-foreground"
                )}
              >
                <SecIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-[13px] font-medium">{sec.label}</span>
                {sec.count !== undefined && (
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums">{sec.count}</span>
                )}
                {sec.children && sec.children.length > 0 && (
                  <ChevronRight className={cnSafe("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
                )}
              </button>
              {isOpen && sec.children && sec.children.length > 0 && (
                <div className="ml-2 border-l border-border pl-1.5 mb-1">
                  {sec.children.map((child) => {
                    const childActive = activeChildId === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectChild(sec.key, child.id)}
                        className={cnSafe(
                          "w-full text-left pl-2.5 pr-3 py-1.5 rounded-md transition-colors flex items-center justify-between gap-2",
                          childActive ? "bg-primary/10 text-primary-text font-medium" : "hover:bg-muted/40 text-foreground/80"
                        )}
                      >
                        <span className="text-[12px] truncate">{child.label}</span>
                        {child.sub && (
                          <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0">{child.sub}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Pane 3 detail ─────────────────────────────────────── */
function Pane3Detail({
  type,
  selectedId,
  section,
  childId,
}: {
  type: CatalogueType;
  selectedId: string;
  section: string;
  childId: string | null;
}) {
  // If a child is picked, render its detail. Otherwise render the section overview.
  if (childId) {
    if (type === "brands" && section === "products") return <ProductQuickCard productId={childId} />;
    if (type === "brands" && section === "categories") return <CategoryQuickCard categoryId={childId} />;
    if (type === "brands" && section === "audiences") return <AudienceQuickCard audienceId={childId} />;
    if (type === "categories" && section === "brands") return <BrandQuickCard brandId={childId} />;
    if (type === "categories" && section === "products") return <ProductQuickCard productId={childId} />;
    if (type === "angles" && section === "hooks") return <HookQuickCard hookId={childId} />;
    if (type === "angles" && section === "concepts") return <ConceptQuickCard conceptId={childId} />;
  }

  // Section overviews
  if (type === "brands") return <BrandSectionView brandId={selectedId} section={section} />;
  if (type === "categories") return <CategorySectionView categoryId={selectedId} section={section} />;
  if (type === "audiences") return <AudienceSectionView audienceId={selectedId} section={section} />;
  if (type === "angles") return <AngleSectionView angleId={selectedId} section={section} />;
  // Hooks / Concepts / Avatars / Frameworks / Storyboards — owner spec
  // 2026-09-15, same "one scrolling page, no section tabs" treatment
  // Scripts got first. No `section` prop left to pass through — each of
  // these five is now a single bespoke view with nothing left to switch.
  if (type === "hooks") return <HookSectionView hookId={selectedId} />;
  if (type === "concepts") return <ConceptSectionView conceptId={selectedId} />;
  if (type === "avatars") return <AvatarSectionView avatarId={selectedId} />;
  if (type === "voices") return <VoiceSectionView voiceId={selectedId} section={section} />;
  if (type === "products") return <ProductSectionView productId={selectedId} section={section} />;
  if (type === "scripts") return <ScriptSectionView scriptId={selectedId} />;
  if (type === "frameworks") return <FrameworkSectionView frameworkId={selectedId} />;
  if (type === "storyboards") return <StoryboardSectionView storyboardId={selectedId} />;
  // CTAs / Templates / References — §21.2 additions with no bespoke
  // relational view of their own. Generic overview + real
  // Generations-from-it + full action set, shared with every other type.
  return <GenericAssetSectionView type={type} selectedId={selectedId} section={section} />;
}

/* ─── Generic section view — Scripts / CTAs / Frameworks / Templates /
 * References. One implementation instead of five bespoke ones, since none
 * of these types has a relational model worth a dedicated view (unlike
 * Angle→Hooks→Concepts). Overview shows the registry's own card fields
 * (name / subtitle / tags / provenance) plus the shared action row;
 * Generations shows the real batches-made-from-it. ─── */
function GenericAssetSectionView({
  type,
  selectedId,
  section,
}: {
  type: CatalogueType;
  selectedId: string;
  section: string;
}) {
  const def = getAssetType(type);
  const item = def ? findEntityById<{ id: string }>(type, selectedId) : undefined;
  if (!def || !item) return <Empty>{def?.singular ?? "Item"} not found</Empty>;
  const card = def.toCard(item);
  const criteria = deriveGenieMatchCriteria(type, item);
  const genieHref = useInGenieUrl(type, selectedId);

  if (section === "generations") {
    return (
      <div className="p-6 max-w-3xl">
        <GenerationsFromAsset {...criteria} useInGenieHref={genieHref} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
            {card.thumbnail ? (
              <img src={card.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <def.icon className="h-5 w-5 text-primary-text" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground line-clamp-2 leading-snug">{card.name}</h2>
            {card.subtitle && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{card.subtitle}</p>}
          </div>
        </div>
        <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
      </div>

      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted-foreground/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Frameworks and Storyboards no longer reach this generic view — they
          each got their own bespoke card-language page (owner spec
          2026-09-15), so the "type !== frameworks" usage-row exception and
          the storyboard-scenes / framework-structure branches that used to
          live here are gone with them. This view is CTAs / Templates /
          References only now — all three have a real, honest `card`
          usage/last-used pair. */}
      <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground tabular-nums">
        <span>{card.usageCount} runs</span>
        <span aria-hidden>·</span>
        <span>Last used {card.lastUsedLabel}</span>
      </div>

      <AssetDetailActions def={def} item={item} useInGenieHref={genieHref} />

      <GenerationsFromAsset {...criteria} useInGenieHref={genieHref} />
    </div>
  );
}

/* Brand section views */
function BrandSectionView({ brandId, section }: { brandId: string; section: string }) {
  const navigate = useNavigate();
  const brand = brands.find((b) => b.id === brandId);
  if (!brand) return <Empty>Brand not found</Empty>;

  // A-12.42 (Maalik): Brand "overview" pane-3 now renders the full 6-tab
  // BrandDetail (Guidelines / KB / Winners / Library / Activity / Products).
  // Replaces the legacy voice/USPs/colors/competitors stub. The BrandDetail
  // component reads its active sub-tab from ?tab= so it stays URL-syncable
  // even inside the Finder.
  if (section === "overview") {
    return <BrandDetail brand={brand} navigate={navigate} embedded />;
  }

  if (section === "kb") {
    return <div className="p-6"><Empty>Knowledge Base · use the &quot;Knowledge Base&quot; tab inside Overview for the full KB editor.</Empty></div>;
  }
  if (section === "settings") {
    return <div className="p-6"><Empty>Settings · stub. Brand voice, fonts, and identity editor ships next sprint.</Empty></div>;
  }

  // products / categories sections — show prompt to select a child
  return <div className="p-6"><Empty>Pick an item from the list to see details.</Empty></div>;
}

function CategorySectionView({ categoryId, section }: { categoryId: string; section: string }) {
  const navigate = useNavigate();
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return <Empty>Category not found</Empty>;

  // A-12.45 (Maalik): Category "overview" pane-3 now renders the full 7-tab
  // CategoryDetail (Overview / KB / Winners / Library / Activity / Brands /
  // Products). Replaces the legacy name+icon+kb-instruction stub.
  if (section === "overview") {
    return <CategoryDetail category={cat} navigate={navigate} embedded />;
  }
  if (section === "kb") {
    return <div className="p-6"><Empty>Knowledge Base · use the &quot;Knowledge Base&quot; tab inside Overview for the full KB editor.</Empty></div>;
  }
  if (section === "references") {
    return <div className="p-6"><Empty>Reference URLs · stub. Curated reference list ships next sprint.</Empty></div>;
  }
  return <div className="p-6"><Empty>Pick an item from the list to see details.</Empty></div>;
}

function ProductSectionView({ productId, section }: { productId: string; section: string }) {
  const navigate = useNavigate();
  const prod = products.find((p) => p.id === productId);
  if (!prod) return <Empty>Product not found</Empty>;

  // A-12.43 (Maalik): Product "overview" pane-3 now renders the full 6-tab
  // ProductDetail (Guidelines / KB / Winners / Library / Activity / Variants),
  // mirroring brand. Replaces the legacy name+price+benefits stub.
  if (section === "overview") {
    const brand = brands.find((b) => b.id === prod.brandId);
    const cat = categories.find((c) => c.id === prod.categoryId);
    return (
      <ProductDetail
        product={prod}
        brand={brand}
        category={cat}
        navigate={navigate}
        embedded
      />
    );
  }
  if (section === "landingPages") {
    return (
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Landing Pages · {prod.landingPages?.length ?? 0}</h3>
        <ul className="space-y-1.5">
          {prod.landingPages?.map((lp) => (
            <li key={lp}>
              <a href={lp} target="_blank" rel="noreferrer" className="text-sm text-primary-text hover:underline inline-flex items-center gap-1.5">
                {lp} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
          {!prod.landingPages?.length && <Empty>No landing pages yet.</Empty>}
        </ul>
      </div>
    );
  }
  if (section === "campaignUrls") {
    return (
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Campaign URLs · {prod.campaignUrls?.length ?? 0}</h3>
        <ul className="space-y-1.5">
          {prod.campaignUrls?.map((cu) => (
            <li key={cu}>
              <a href={cu} target="_blank" rel="noreferrer" className="text-xs font-mono text-muted-foreground hover:text-primary-text inline-flex items-center gap-1.5">
                {cu} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
          {!prod.campaignUrls?.length && <Empty>No campaign URLs yet.</Empty>}
        </ul>
      </div>
    );
  }
  if (section === "kb") return <div className="p-6"><Empty>Product KB · stub. Per-product KB editor ships next sprint.</Empty></div>;
  if (section === "generations") {
    const brand = brands.find((b) => b.id === prod.brandId);
    return (
      <div className="p-6 max-w-3xl">
        {/* The one hand-built criteria set left in this file; `assetLabel`
            uses registry casing (`AssetTypeDef.singular`) so it matches every
            other call site, all of which now get the label from the spread. */}
        <GenerationsFromAsset
          brandName={brand?.name}
          productName={prod.name}
          tracked
          assetLabel="Product"
          useInGenieHref={useInGenieUrl("products", prod.id)}
        />
      </div>
    );
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* Audience section views */
function AudienceSectionView({ audienceId, section }: { audienceId: string; section: string }) {
  const audience = audiences.find((a) => a.id === audienceId);
  if (!audience) return <Empty>Audience not found</Empty>;
  const brand = audience.brandId ? brands.find((b) => b.id === audience.brandId) : undefined;
  const def = getAssetType("audiences")!;
  const card = def.toCard(audience);
  const genieHref = useInGenieUrl("audiences", audience.id);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary-text" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{audience.label}</h2>
              <p className="text-xs text-muted-foreground truncate">{audience.segment}</p>
            </div>
          </div>
          <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
        </div>
        <Section title="Segment definition">
          <p className="text-sm text-foreground">{audience.segment}</p>
        </Section>
        <Section title="Parent brand">
          {brand ? (
            <Link
              to={`/catalogue/brands/${brand.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:border-primary/40"
            >
              {brand.logo && <img src={brand.logo} alt="" className="h-5 w-5 rounded" />}
              <span className="font-medium text-foreground">{brand.name}</span>
              <span className="text-xs text-muted-foreground">· {brand.domain}</span>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Brand-agnostic audience — applies across multiple brands.
            </p>
          )}
        </Section>
        <Section title="Linked campaigns">
          <p className="text-sm text-muted-foreground italic">No campaigns linked yet.</p>
        </Section>
        <AssetDetailActions def={def} item={audience} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...deriveGenieMatchCriteria("audiences", audience)} useInGenieHref={genieHref} />
      </div>
    );
  }
  if (section === "brand") {
    if (!brand) {
      return (
        <div className="p-6">
          <Empty>Brand-agnostic audience — applies across multiple brands.</Empty>
        </div>
      );
    }
    return <BrandSectionView brandId={brand.id} section="overview" />;
  }
  if (section === "campaigns") {
    return (
      <div className="p-6">
        <Empty>No campaigns linked yet.</Empty>
      </div>
    );
  }
  if (section === "kb") {
    return <div className="p-6"><Empty>Audience KB · stub. Per-audience targeting templates ship next sprint.</Empty></div>;
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* Reusable detail cards */
function ProductQuickCard({ productId }: { productId: string }) {
  return <ProductSectionView productId={productId} section="overview" />;
}
function BrandQuickCard({ brandId }: { brandId: string }) {
  return <BrandSectionView brandId={brandId} section="overview" />;
}
function CategoryQuickCard({ categoryId }: { categoryId: string }) {
  return <CategorySectionView categoryId={categoryId} section="overview" />;
}
function AudienceQuickCard({ audienceId }: { audienceId: string }) {
  return <AudienceSectionView audienceId={audienceId} section="overview" />;
}
function HookQuickCard({ hookId }: { hookId: string }) {
  return <HookSectionView hookId={hookId} />;
}
function ConceptQuickCard({ conceptId }: { conceptId: string }) {
  return <ConceptSectionView conceptId={conceptId} />;
}

/* ─── Angle section view ───────────────────────────── */
function AngleSectionView({ angleId, section }: { angleId: string; section: string }) {
  const angle = angles.find((a) => a.id === angleId);
  if (!angle) return <Empty>Angle not found</Empty>;
  const linkedHooks = hooks.filter((h) => h.angleId === angle.id);
  const linkedConcepts = concepts.filter((c) => c.angle.toLowerCase() === angle.label.toLowerCase());
  const def = getAssetType("angles")!;
  const card = def.toCard(angle);
  const genieHref = useInGenieUrl("angles", angle.id);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Crosshair className="h-5 w-5 text-primary-text" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{angle.label}</h2>
              {angle.description && <p className="text-xs text-muted-foreground truncate">{angle.description}</p>}
            </div>
          </div>
          <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
        </div>
        {angle.description && (
          <Section title="What it is"><p className="text-sm text-foreground">{angle.description}</p></Section>
        )}
        <Section title={`Linked hooks · ${linkedHooks.length}`}>
          {linkedHooks.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Pick a hook from the section list to see its detail.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No hooks linked yet.</p>
          )}
        </Section>
        <Section title={`Linked concepts · ${linkedConcepts.length}`}>
          {linkedConcepts.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Pick a concept from the section list to see its detail.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No concepts linked yet.</p>
          )}
        </Section>
        <AssetDetailActions def={def} item={angle} useInGenieHref={genieHref} />
      </div>
    );
  }
  if (section === "generations") {
    return (
      <div className="p-6 max-w-3xl">
        <GenerationsFromAsset {...deriveGenieMatchCriteria("angles", angle)} useInGenieHref={genieHref} />
      </div>
    );
  }
  return <div className="p-6"><Empty>Pick an item from the list to see details.</Empty></div>;
}

/* ─── Hook section view ───────────────────────────── */
/**
 * Owner spec 2026-09-15 — same "one scrolling page, no section tabs"
 * treatment Script got first. Locked field spec (2026-09-14): "the hook
 * text itself, Angle." The two dead branches that used to open ANOTHER
 * record's full page (`brand` → `BrandSectionView`, `angle` →
 * `AngleSectionView`) are gone — Angle is a real `Chip` link straight off
 * this page instead of a second tab that re-rendered the Angle's own
 * overview. Brand stays as plain context text under the title (unchanged
 * from before — it was never a tab of its own, `brand` was) since it isn't
 * part of the locked field list.
 */
function HookSectionView({ hookId }: { hookId: string }) {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/iq/genie6/assets") ? "/iq/genie6/assets" : "/catalogue";
  // `findEntityById`, not `hooks.find` — the raw seed array does not contain
  // session-added rows, so a hook saved from Genie's Library (Hooks tab →
  // "Save to Assets") appeared in panes 1 and 2 and then hit "Hook not found"
  // here. `findEntityById` goes through the registry's `resolve()`, which
  // merges the write store's added/duplicated rows (assetTypes.ts's
  // `makeResolver`) — the same reason the Frameworks/Storyboards views
  // already use it.
  const hook = findEntityById<Hook>("hooks", hookId);
  if (!hook) return <Empty>Hook not found</Empty>;
  const brand = hook.brandId ? brands.find((b) => b.id === hook.brandId) : undefined;
  const angle = hook.angleId ? angles.find((a) => a.id === hook.angleId) : undefined;
  const def = getAssetType("hooks")!;
  const card = def.toCard(hook);
  const genieHref = useInGenieUrl("hooks", hook.id);

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      <div className="max-w-3xl space-y-4 border-l border-[rgba(0,0,0,0.06)] pb-6 pl-5 pr-6 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <h2
                className="min-w-0 text-[14px] font-semibold italic leading-[22px] text-foreground"
                title={hook.text}
              >
                "{hook.text}"
              </h2>
              <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
            </div>
          </div>
          {/* Named AND reachable. This was a plain <p>: the brand was printed
              and the deleted `brand` tab had been its only route out, so the
              one entity a hook names became a dead end. Storyboard already
              links its brand; all three are consistent now. */}
          {brand && (
            <div>
              <Chip to={`/catalogue/brands/${brand.id}`}>{brand.name}</Chip>
            </div>
          )}
          <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
        </div>

        <SectionCard title="Angle" icon={Crosshair} tint="lime">
          <DetailFieldList>
            <DetailFieldRow
              label="Angle:"
              emptyLabel="No angle linked"
              value={
                angle ? (
                  <ChipList>
                    <Chip to={`${basePath}/angles/${angle.id}`}>{angle.label}</Chip>
                  </ChipList>
                ) : undefined
              }
            />
          </DetailFieldList>
        </SectionCard>

        {hook.performance && (
          <SectionCard title="Performance" icon={MessageSquareQuote} tint="purple">
            <div className="flex items-center gap-6 font-mono tabular-nums">
              <div>
                <p className="text-[11px] leading-4 text-muted-foreground">CTR</p>
                <p className="text-[18px] font-semibold text-foreground">{hook.performance.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[11px] leading-4 text-muted-foreground">Impressions</p>
                <p className="text-[18px] font-semibold text-foreground">
                  {formatCompactN(hook.performance.impressions)}
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        <AssetDetailActions def={def} item={hook} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...deriveGenieMatchCriteria("hooks", hook)} useInGenieHref={genieHref} />
      </div>
    </div>
  );
}

/* ─── Concept section view ───────────────────────────── */
/**
 * Owner spec 2026-09-15 — same "one scrolling page, no section tabs"
 * treatment Script got first. Locked field spec (2026-09-14): "Name, the
 * concept content itself, Angle, Avatar + voice." The three dead branches
 * that used to open ANOTHER record's full page (`brand` → `BrandSectionView`,
 * `hook` → `HookSectionView` for the concept's own hook COPY happening to
 * match a registered Hook entity, `avatar` → `AvatarSectionView`) are gone —
 * Angle and Avatar + voice are real `Chip` links straight off this page now,
 * and the hook copy itself is still shown inline (it always was, as "Hook
 * copy" — that content isn't lost, only the second full-page tab for it is).
 */
function ConceptSectionView({ conceptId }: { conceptId: string }) {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/iq/genie6/assets") ? "/iq/genie6/assets" : "/catalogue";
  // Merged lookup, not the raw seed array — see HookSectionView above. A
  // concept saved from Genie's Library rendered "Concept not found" here
  // while showing correctly in panes 1 and 2.
  const concept = findEntityById<Concept>("concepts", conceptId);
  if (!concept) return <Empty>Concept not found</Empty>;
  const angle = angles.find((a) => a.label.toLowerCase() === concept.angle.toLowerCase());
  // Owner spec 2026-09-14: "Avatar + voice" joins Name/content/Angle as the
  // fourth field a Concept must surface. `voiceId` is never independently
  // chosen — it's whichever voice `avatarId` is paired with — so only the
  // persona needs resolving here.
  const conceptAvatar = concept.avatarId ? avatars.find((a) => a.id === concept.avatarId) : undefined;
  const conceptVoice = concept.voiceId ? voices.find((v) => v.id === concept.voiceId) : undefined;
  const def = getAssetType("concepts")!;
  const card = def.toCard(concept);
  const genieHref = useInGenieUrl("concepts", concept.id);

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      <div className="max-w-3xl space-y-4 border-l border-[rgba(0,0,0,0.06)] pb-6 pl-5 pr-6 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <h2
                className="min-w-0 truncate text-[14px] font-semibold leading-[22px] text-foreground"
                title={concept.name}
              >
                {concept.name}
              </h2>
              <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
            </div>
          </div>
          {/* `generationCount` is a real tracked field on the entity (unlike
              this card's `lastUsedAt`, which `assetTypes.ts` fabricates via
              `deterministicLastUsed` for Concepts) — so only the runs count
              rides this line, same "don't dress up a fake date as a real
              one" call the Framework view below makes explicitly. */}
          <p className="font-mono text-[12px] font-medium leading-4 text-muted-foreground">
            {concept.angle} · {concept.tone} · {concept.generationCount} runs
          </p>
          <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
        </div>

        {/* The concept's own substance — format, visual direction, hook
            copy — grouped as one open-by-default card, same grammar Script
            uses for its "Framework & Script" primary content. */}
        <CollapsibleCard title="Concept" icon={Lightbulb} defaultOpen>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] leading-4 text-muted-foreground">Format</p>
              <p className="mt-0.5 font-mono text-[13px] leading-5 text-foreground">{concept.format}</p>
            </div>
            <div>
              <p className="text-[11px] leading-4 text-muted-foreground">Visual direction</p>
              <p className="mt-0.5 text-[13px] leading-5 tracking-[-0.08px] text-foreground">
                {concept.visualDirection}
              </p>
            </div>
            <div>
              <p className="text-[11px] leading-4 text-muted-foreground">Hook copy</p>
              <p className="mt-0.5 text-[13px] italic leading-5 text-foreground">"{concept.hook}"</p>
            </div>
          </div>
        </CollapsibleCard>

        <div className="grid grid-cols-2 gap-3">
          <SectionCard title="Angle" icon={Crosshair} tint="lime">
            <DetailFieldList>
              <DetailFieldRow
                label="Angle:"
                emptyLabel={`"${concept.angle}" not found in registry`}
                value={
                  angle ? (
                    <ChipList>
                      <Chip to={`${basePath}/angles/${angle.id}`}>{angle.label}</Chip>
                    </ChipList>
                  ) : undefined
                }
              />
            </DetailFieldList>
          </SectionCard>

          <SectionCard title="Avatar + voice" icon={UserRound} tint="purple">
            <DetailFieldList>
              <DetailFieldRow
                label="Avatar:"
                emptyLabel="No persona linked to this concept yet"
                value={
                  conceptAvatar ? (
                    <ChipList>
                      <Chip to={`${basePath}/avatars/${conceptAvatar.id}`}>{conceptAvatar.name}</Chip>
                    </ChipList>
                  ) : undefined
                }
              />
              <DetailFieldRow
                label="Voice:"
                emptyLabel="No data"
                value={
                  conceptVoice ? (
                    <ChipList>
                      {/* One template string, not two JSX children — `Chip`
                          only derives its `title` when the child IS a string,
                          so the array form silently shipped a chip that
                          truncates at 1024 with no tooltip at all. */}
                      <Chip to={`${basePath}/voices/${conceptVoice.id}`}>
                        {`${conceptVoice.name} · ${conceptVoice.language}`}
                      </Chip>
                    </ChipList>
                  ) : undefined
                }
              />
            </DetailFieldList>
          </SectionCard>
        </div>

        <AssetDetailActions def={def} item={concept} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...deriveGenieMatchCriteria("concepts", concept)} useInGenieHref={genieHref} />
      </div>
    </div>
  );
}

/* ─── Avatar section view ───────────────────────────── */
/**
 * Owner spec 2026-09-15 — same "one scrolling page, no section tabs"
 * treatment Script got first. Locked field spec (2026-09-14): "name,
 * gender, age, personality, race, tone" as SEPARATE rows. Avatar has no
 * Brand/Angle relation of its own to link out to (unlike Hook/Concept/
 * Framework), so its one real cross-link is Tone → the paired Voice's own
 * page, resolved through the pairing exactly like the label already was.
 */
function AvatarSectionView({ avatarId }: { avatarId: string }) {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/iq/genie6/assets") ? "/iq/genie6/assets" : "/catalogue";
  // `findEntityById`, not `avatars.find` — a duplicated avatar (the
  // Duplicate action in `AssetDetailActions` below works on every type,
  // Avatar included, even though Avatar has no `addForm`) lives only in the
  // write store, same "Hook not found" bug class `HookSectionView` already
  // fixed above.
  const avatar = findEntityById<Avatar>("avatars", avatarId);
  if (!avatar) return <Empty>Avatar not found</Empty>;
  const visual = avatarVisual(avatar);
  const def = getAssetType("avatars")!;
  const card = def.toCard(avatar);
  const genieHref = useInGenieUrl("avatars", avatar.id);
  // `gender`/`ageRange`/`race` are typed as required on `Avatar`, but the
  // seed builder that's meant to parse them off `demographic` (see the
  // entities.ts docblock — "parsed... not typed in alongside it") hasn't
  // landed in `mocks/shared/avatars.ts` as of this pass, so they resolve to
  // `undefined` at runtime today despite the type saying otherwise. Every
  // row below is guarded on the raw value (not the type) for exactly that
  // reason. Unlike Tone, these four still RENDER their row with the
  // DetailFieldRow "No data" empty state rather than disappearing — dropping
  // only applies to Tone (no pairing to point at), not to a field that's
  // simply missing.
  const personality = avatar.personalityId ? personalityLabel(avatar.personalityId) : undefined;
  const voice = avatar.voiceId ? voices.find((v) => v.id === avatar.voiceId) : undefined;
  const tone = avatarToneLabel(avatar);

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      <div className="max-w-3xl space-y-4 border-l border-[rgba(0,0,0,0.06)] pb-6 pl-5 pr-6 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{ background: visual.bg, color: visual.fg }}
              >
                {visual.initials}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h2
                    className="min-w-0 truncate text-[14px] font-semibold leading-[22px] text-foreground"
                    title={avatar.name}
                  >
                    {avatar.name}
                  </h2>
                  <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
                </div>
                <p className="truncate text-[11px] leading-4 text-muted-foreground">{avatar.demographic}</p>
              </div>
            </div>
          </div>
          {/* No "Last used / N runs" line here — unlike Storyboards (a real
              tracked field), an Avatar's `usageCount`/`lastUsedAt` are both
              `deterministicUsage`/`deterministicLastUsed` hashes in
              `assetTypes.ts` (fabricated, not real facts), the exact
              dishonesty `FrameworkStructure` already refuses to paper over
              for Frameworks. The original overview never showed this either. */}
          <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
        </div>

        <SectionCard title="Avatar & voice" icon={UserRound} tint="lime">
          <DetailFieldList>
            <DetailFieldRow label="Name" value={avatar.name} />
            <DetailFieldRow label="Gender" value={avatar.gender} />
            <DetailFieldRow label="Age" value={avatar.ageRange} />
            <DetailFieldRow label="Personality" value={personality} />
            <DetailFieldRow label="Race" value={avatar.race} />
            {tone && (
              <DetailFieldRow
                label="Tone"
                value={
                  <ChipList>
                    <Chip to={voice ? `${basePath}/voices/${voice.id}` : undefined}>{tone}</Chip>
                  </ChipList>
                }
              />
            )}
          </DetailFieldList>
        </SectionCard>

        <SectionCard title={`Languages · ${avatar.language.length}`} icon={Languages} tint="purple">
          <ChipList emptyLabel="No languages set">
            {avatar.language.map((l) => (
              <Chip key={l}>{l}</Chip>
            ))}
          </ChipList>
        </SectionCard>

        {/* No "New avatar" affordance anywhere (V1 = presets only, §9/§13) —
            but Edit/Duplicate/Archive/Delete/Use-in-Genie on an existing
            preset are all fine, so the full action row still applies. */}
        <AssetDetailActions def={def} item={avatar} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...deriveGenieMatchCriteria("avatars", avatar)} useInGenieHref={genieHref} />
      </div>
    </div>
  );
}

/* ─── Voice section view ───────────────────────────── */
function VoiceSectionView({ voiceId, section }: { voiceId: string; section: string }) {
  const voice = voices.find((v) => v.id === voiceId);
  if (!voice) return <Empty>Voice not found</Empty>;
  const def = getAssetType("voices")!;
  const card = def.toCard(voice);
  const genieHref = useInGenieUrl("voices", voice.id);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mic className="h-5 w-5 text-primary-text" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{voice.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{voice.language}</p>
            </div>
          </div>
          <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
        </div>
        <Section title="Description"><p className="text-sm text-foreground">{voice.description}</p></Section>
        {voice.sample && (
          <Section title="Sample">
            <a
              href={voice.sample}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
            >
              <Volume2 className="h-3.5 w-3.5 text-primary-text" />
              <span className="font-medium text-foreground">Play sample</span>
            </a>
          </Section>
        )}
        <AssetDetailActions def={def} item={voice} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...deriveGenieMatchCriteria("voices", voice)} useInGenieHref={genieHref} />
      </div>
    );
  }
  if (section === "language") {
    return (
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Language</h3>
        <span className="text-sm font-mono rounded bg-muted px-2.5 py-1 text-foreground">{voice.language}</span>
      </div>
    );
  }
  if (section === "sample") {
    return (
      <div className="p-6">
        {voice.sample ? (
          <a
            href={voice.sample}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
          >
            <Volume2 className="h-3.5 w-3.5 text-primary-text" />
            <span className="font-medium text-foreground">Play sample</span>
          </a>
        ) : (
          <Empty>No sample uploaded yet.</Empty>
        )}
      </div>
    );
  }
  if (section === "generations") {
    return (
      <div className="p-6 max-w-3xl">
        <GenerationsFromAsset {...deriveGenieMatchCriteria("voices", voice)} useInGenieHref={genieHref} />
      </div>
    );
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* ─── Script section view ───────────────────────────── */
/**
 * Owner spec 2026-09-14 — a Script reads as "content · Angle + concept ·
 * Avatar + voice · B/P/C+p or no type · Framework". Replaces the generic
 * Overview + Generations fallback: Scripts aren't a `deriveGenieMatchCriteria`
 * tracked type (only brands/products/angles/hooks/concepts are), so the old
 * generic pane-2 "Generations" tab would only ever have opened on a
 * fabricated-looking "not tracked" state — this view still surfaces that
 * panel INLINE at the bottom of Overview (§9 "closes the loop"), same as
 * Audiences/Avatars/Voices already do without a dedicated tab, just doesn't
 * dedicate a pane-2 slot to it.
 */
/**
 * Owner spec 2026-09-15 (Hinglish, verbatim: "ek hi page ho jayega saara
 * data... repeat pe jo data hai wo remove krdena") — Script's pane-2 tab
 * strip is GONE (see the Finder's pane-2 render guard + `getSections`
 * above). This is now one scrolling page carrying everything the four
 * removed tabs (`angle` / `avatar` / `type` / `framework`) used to gate:
 * each of those tabs just re-rendered the linked entity's OWN "overview"
 * section, which this "overview" content already showed inline — that
 * duplication is what "repeat" meant, so those four branches are gone,
 * not just hidden. Pane 1 (the script list) is untouched.
 *
 * Section order (owner spec): identity → Script body → Angle + concept →
 * Avatar + voice → Brand / Product / Category → Framework → actions →
 * generations. No `section` prop — there is nothing left to switch.
 */
function ScriptSectionView({ scriptId }: { scriptId: string }) {
  // The 10 Creative types are mounted both under /catalogue (legacy
  // redirect-only) and /iq/genie6/assets (their real home) — same reasoning
  // CatalogueListPage/CatalogueDetailPage already derive `basePath` for, so
  // a real cross-link resolves correctly regardless of which base this
  // Finder instance is mounted under.
  const location = useLocation();
  const navigate = useNavigate();
  // Hooks must run unconditionally before the `!script` early return below
  // (Rules of Hooks) — this one specifically matters here because deleting
  // the currently-viewed script via the new title-row Delete button changes
  // `writes`, which can re-render this component with a now-stale
  // `scriptId` for one frame before the parent's own effect reassigns
  // `selectedId`. A `useState` placed after the early return would then be
  // skipped on that render, changing the hook count and crashing React.
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const basePath = location.pathname.startsWith("/iq/genie6/assets") ? "/iq/genie6/assets" : "/catalogue";
  const script = findEntityById<ScriptAsset>("scripts", scriptId);
  if (!script) return <Empty>Script not found</Empty>;
  const brand = script.brandId ? brands.find((b) => b.id === script.brandId) : undefined;
  const angle = script.angleId ? angles.find((a) => a.id === script.angleId) : undefined;
  const concept = script.conceptId ? findEntityById<Concept>("concepts", script.conceptId) : undefined;
  const avatar = script.avatarId ? avatars.find((a) => a.id === script.avatarId) : undefined;
  const voice = script.voiceId ? voices.find((v) => v.id === script.voiceId) : undefined;
  const product = script.productId ? products.find((p) => p.id === script.productId) : undefined;
  const category = script.categoryId ? categories.find((c) => c.id === script.categoryId) : undefined;
  const framework = getFramework(script.frameworkId);
  const def = getAssetType("scripts")!;
  const card = def.toCard(script);
  const genieHref = useInGenieUrl("scripts", script.id);
  const criteria = deriveGenieMatchCriteria("scripts", script);

  // Title-row Duplicate/Delete (owner Figma spec, 2026-09-15) — same store
  // calls `AssetDetailActions` below already makes for its own Duplicate/
  // Delete buttons, just surfaced a second time up top per spec. Delete
  // still confirms (house policy: destructive actions confirm); Duplicate
  // doesn't, matching `AssetDetailActions.handleDuplicate` exactly.
  const handleTopDuplicate = () => {
    const clone = buildDuplicate(def, script);
    duplicateAsset(def.id, script.id, clone);
    toast.success(`${def.getName(clone)} created`, {
      description: "Duplicate appears in the list — local to this session.",
    });
  };
  const handleTopDeleteConfirm = () => {
    deleteAsset(def.id, script.id);
    toast.success(`${script.title} deleted`, { description: "Local to this session — reload restores it." });
    setConfirmDeleteOpen(false);
  };

  // Creative Identity's copy action — copies real field values only
  // (Hook/Brief/CTA), skipping any that are empty rather than printing
  // "undefined" or the "No data" label into the clipboard.
  const handleCopyIdentity = () => {
    const lines = [
      script.hook ? `Hook: ${script.hook}` : undefined,
      `Brief: ${script.body}`,
      script.cta ? `CTA: ${script.cta}` : undefined,
    ].filter((line): line is string => Boolean(line));
    const text = lines.join("\n");
    if (!navigator.clipboard?.writeText) {
      toast.error("Clipboard isn't available in this browser");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast.success("Creative identity copied"),
      () => toast.error("Couldn't copy — try selecting the text manually"),
    );
  };

  // The three-beat strategy strip is either fully present-or-partial (every
  // seed row that has ANY of the three has all three) or fully absent (both
  // draft rows). A fully-empty strip reads as three dead "—" tiles in a row,
  // which is worse than not showing the section at all — so this hides the
  // whole `StatStrip` rather than rendering an all-empty one. Any partial
  // case (none exist in the seed data today, but the data model allows it)
  // still renders, with `StatStripItem`'s own per-item "—" handling covering
  // whichever field is missing.
  const hasStrategyStrip = Boolean(script.who || script.wantsThemTo || script.by);

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      <div className="max-w-3xl space-y-4 border-l border-[rgba(0,0,0,0.06)] pb-6 pl-5 pr-6 pt-6">
        {/* 1. Title row — title + provenance pill, right-aligned
            Duplicate/Delete, uploaded/edited meta, hairline divider. */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h2
                className="min-w-0 truncate text-[14px] font-semibold leading-[22px] text-foreground"
                /* Always set — see ScriptPane1Row: width truncates, not
                   character count, so a length gate never fires. */
                title={card.name}
              >
                {card.name}
              </h2>
              <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PillButton icon={Copy} onClick={handleTopDuplicate}>
                Duplicate
              </PillButton>
              <PillButton icon={Trash2} onClick={() => setConfirmDeleteOpen(true)}>
                Delete
              </PillButton>
            </div>
          </div>
          {/* The spec's literal string was "Uploaded 4d ago · Edited 2h ago",
              and it shipped hardcoded — the same sentence on all 12 scripts,
              stating two timestamps `ScriptAsset` does not carry. Figma copy
              is a placeholder for real data, not the data. `lastUsedAt` IS
              real, so that is what this says now; the two invented dates are
              gone rather than dressed up. */}
          <p className="font-mono text-[12px] font-medium leading-4 text-muted-foreground">
            Last used {card.lastUsedLabel} · {script.usageCount} runs
          </p>
          <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
        </div>

        {/* 2. Framework & Script — the actual script content, open by
            default (it's the primary artifact, not something to hide
            behind a click). "Use framework" opens the real Framework
            library item (there's no "insert framework" flow to wire to);
            "Use script" reuses the same honest Genie hand-off the bottom
            actions row's primary CTA already uses. */}
        <CollapsibleCard
          title="Framework & Script"
          icon={GitBranch}
          defaultOpen
          actions={
            <>
              <PillButton
                disabled={!framework}
                onClick={() => framework && navigate(`${basePath}/frameworks/${framework.id}`)}
              >
                Use framework
              </PillButton>
              <PillButton onClick={() => navigate(genieHref)}>Use script</PillButton>
            </>
          }
        >
          <p className="text-[11px] leading-[15px] text-muted-foreground">Script</p>
          <p className="mt-1 whitespace-pre-line text-[13px] leading-5 tracking-[-0.08px] text-foreground">
            {script.body}
          </p>
        </CollapsibleCard>

        {/* 3. Who / Wants them to / By — see `hasStrategyStrip` above for
            the empty-section decision. */}
        {hasStrategyStrip && (
          <StatStrip>
            <StatStripItem icon={Users} tint="lime" caption="Who" value={script.who} />
            <StatStripItem icon={Target} tint="purple" caption="Wants them to" value={script.wantsThemTo} />
            <StatStripItem icon={Megaphone} tint="teal" caption="By" value={script.by} />
          </StatStrip>
        )}

        {/* 4. Two-up row — Creative Identity / Audience & Strategy. */}
        <div className="grid grid-cols-2 gap-3">
          <SectionCard
            title="Creative Identity"
            icon={MessageSquareQuote}
            tint="lime"
            actions={
              <button
                type="button"
                onClick={handleCopyIdentity}
                aria-label="Copy creative identity"
                className="fab-focus flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
              </button>
            }
          >
            <DetailFieldList>
              <DetailFieldRow label="Hook:" value={script.hook} />
              {/* `brief` is the APPROACH in one line, never the script. This
                  row pointed at `script.body` for want of a real field, which
                  printed the entire script a second time — the Framework &
                  Script card above already shows it in full. On the one page
                  whose purpose was removing repeats, that was the repeat. */}
              <DetailFieldRow label="Brief:" value={script.brief} />
              <DetailFieldRow label="CTA:" value={script.cta} />
            </DetailFieldList>
          </SectionCard>

          <SectionCard title="Audience & Strategy" icon={Users} tint="purple">
            <DetailFieldList>
              <DetailFieldRow label="Audience:" value={script.audience} />
              <DetailFieldRow
                label="Tone:"
                emptyLabel="No data"
                value={
                  script.tone && script.tone.length > 0 ? (
                    <ChipList>
                      {script.tone.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </ChipList>
                  ) : undefined
                }
              />
              <DetailFieldRow
                label="Angles:"
                emptyLabel="No data"
                value={
                  angle ? (
                    <ChipList>
                      <Chip to={`${basePath}/angles/${angle.id}`}>{angle.label}</Chip>
                    </ChipList>
                  ) : undefined
                }
              />
              <DetailFieldRow
                label="Framework:"
                emptyLabel="No data"
                value={
                  framework ? (
                    <Link
                      to={`${basePath}/frameworks/${framework.id}`}
                      className="fab-focus text-primary-text hover:underline"
                    >
                      {framework.name}
                    </Link>
                  ) : undefined
                }
              />
            </DetailFieldList>
          </SectionCard>
        </div>

        {/* 5. Concept — the linked concept's own visual direction, or a
            calm explicit absence (mcaffeine has none seeded, nor do either
            draft script). */}
        <CollapsibleCard title="Concept" icon={Lightbulb} defaultOpen>
          {concept ? (
            <div className="space-y-1.5">
              {/* The concept's own NAME and route came back with it — the
                  card had been reduced to a paragraph of its visual
                  direction, which read as loose prose belonging to nothing. */}
              <Link
                to={`${basePath}/concepts/${concept.id}`}
                className="fab-focus inline-block text-[11px] font-medium leading-4 text-primary-text hover:underline"
              >
                {concept.name}
              </Link>
              <p className="text-[11px] leading-4 text-foreground">{concept.visualDirection}</p>
            </div>
          ) : (
            <p className="text-[11px] leading-4 text-muted-foreground">No concept linked.</p>
          )}
        </CollapsibleCard>

        {/* 6. Other details — two columns. `Ad type:` has no source
            anywhere on ScriptAsset (no field for it at all), so it always
            renders the explicit "No data" empty state below rather than
            guessing a value. */}
        <SectionCard title="Other details" icon={Building2} tint="purple">
          <div className="grid grid-cols-2 gap-6">
            <DetailFieldList>
              <DetailFieldRow
                label="Product:"
                emptyLabel="No data"
                value={
                  product ? (
                    <Link
                      to={`/catalogue/products/${product.id}`}
                      className="fab-focus text-primary-text hover:underline"
                    >
                      {product.name}
                    </Link>
                  ) : undefined
                }
              />
              <DetailFieldRow
                label="Brand:"
                emptyLabel="No data"
                value={brand ? <Chip to={`/catalogue/brands/${brand.id}`}>{brand.name}</Chip> : undefined}
              />
              <DetailFieldRow
                label="Category:"
                emptyLabel="No data"
                value={
                  category ? (
                    <ChipList>
                      <Chip to={`/catalogue/categories/${category.id}`}>{category.name}</Chip>
                    </ChipList>
                  ) : undefined
                }
              />
            </DetailFieldList>
            <DetailFieldList>
              <DetailFieldRow label="Ad type:" value={undefined} emptyLabel="No data" />
              <DetailFieldRow
                label="Avatar:"
                emptyLabel="No data"
                value={
                  avatar ? (
                    <ChipList>
                      <Chip to={`${basePath}/avatars/${avatar.id}`}>{avatar.name}</Chip>
                    </ChipList>
                  ) : undefined
                }
              />
              <DetailFieldRow
                label="Voice & lang.:"
                emptyLabel="No data"
                value={
                  voice ? (
                    <ChipList>
                      <Chip to={`${basePath}/voices/${voice.id}`}>
                        {voice.name} · {voice.language}
                      </Chip>
                    </ChipList>
                  ) : undefined
                }
              />
            </DetailFieldList>
          </div>
        </SectionCard>

        {/* 7. Existing actions + generations, untouched. */}
        <AssetDetailActions def={def} item={script} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...criteria} useInGenieHref={genieHref} />
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{script.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone within this session — the row is gone until reload resets the
              demo data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTopDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Framework section view ───────────────────────────── */
/**
 * Owner spec 2026-09-14 — a Framework reads as "Name · Angle + concept",
 * and that field must read correctly WITH and WITHOUT a worked-example
 * concept attached (Carousel Reveal deliberately has none — see
 * `frameworks.ts`'s header note). A linked concept's "actual content" IS
 * its `visualDirection` field, so "with/without visual direction" here
 * means: show it when a concept resolves, and render a calm, explicit
 * absence — never a dangling "Visual direction" heading over nothing —
 * when it doesn't. The ordered section breakdown itself is unchanged,
 * still the shared `FrameworkStructure` component used by `/grid/:id` so
 * the two surfaces can't drift.
 */
/**
 * Owner spec 2026-09-15 — same "one scrolling page, no section tabs"
 * treatment Script got first. Locked field spec (2026-09-14): "Name,
 * Angle + concept." The dead `angle` branch that used to open a full
 * `ConceptSectionView`/`AngleSectionView` page is gone — Angle and Concept
 * are real `Chip` links straight off this page now. `FrameworkStructure`
 * (the shared, unchanged component) is what already reads correctly with
 * and without a visual direction per section — PAS carries one on every
 * beat, 4Ps/QUEST deliberately don't (see `frameworks.ts`'s header note) —
 * so nothing new was needed there.
 */
function FrameworkSectionView({ frameworkId }: { frameworkId: string }) {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/iq/genie6/assets") ? "/iq/genie6/assets" : "/catalogue";
  const framework = findEntityById<Framework>("frameworks", frameworkId);
  if (!framework) return <Empty>Framework not found</Empty>;
  const angle = framework.angleId ? angles.find((a) => a.id === framework.angleId) : undefined;
  const concept = framework.conceptId ? findEntityById<Concept>("concepts", framework.conceptId) : undefined;
  const def = getAssetType("frameworks")!;
  const card = def.toCard(framework);
  const genieHref = useInGenieUrl("frameworks", framework.id);
  const criteria = deriveGenieMatchCriteria("frameworks", framework);

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      <div className="max-w-3xl space-y-4 border-l border-[rgba(0,0,0,0.06)] pb-6 pl-5 pr-6 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <h2
                className="min-w-0 truncate text-[14px] font-semibold leading-[22px] text-foreground"
                title={framework.name}
              >
                {framework.name}
              </h2>
              <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
            </div>
          </div>
          {framework.fullName && (
            <p className="truncate text-[11px] leading-4 text-muted-foreground">{framework.fullName}</p>
          )}
          {/* No "Last used / N runs" meta line here — `FrameworkStructure`
              below renders its OWN honest usage row ("N logged uses · Last
              used — not tracked for frameworks"). A second, differently-
              worded line up here is exactly the repeat this whole rebuild
              is about — see the original bug this avoided (two rows that
              disagreed on screen, one real, one a fabricated date). */}
          <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
        </div>

        {framework.description && (
          <SectionCard title="What it's for">
            <p className="text-[13px] leading-5 text-foreground">{framework.description}</p>
          </SectionCard>
        )}

        <SectionCard title="Angle + concept" icon={Crosshair} tint="lime">
          <DetailFieldList>
            <DetailFieldRow
              label="Angle + concept:"
              emptyLabel="No angle or worked-example concept assigned to this structure"
              value={
                angle || concept ? (
                  <ChipList>
                    {angle && <Chip to={`${basePath}/angles/${angle.id}`}>{angle.label}</Chip>}
                    {concept && <Chip to={`${basePath}/concepts/${concept.id}`}>{concept.name}</Chip>}
                  </ChipList>
                ) : undefined
              }
            />
          </DetailFieldList>
          {/* WITH a worked-example concept: its own visual direction.
              WITHOUT (Carousel Reveal — see `frameworks.ts`'s header note):
              an explicit, calm line rather than a dangling empty heading. */}
          {concept ? (
            <p className="mt-2 text-[13px] leading-5 text-foreground">{concept.visualDirection}</p>
          ) : angle ? (
            <p className="mt-2 text-[11px] italic leading-4 text-muted-foreground">
              No worked-example concept yet — angle only.
            </p>
          ) : null}
        </SectionCard>

        <FrameworkStructure framework={framework} />

        <AssetDetailActions def={def} item={framework} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...criteria} useInGenieHref={genieHref} />
      </div>
    </div>
  );
}

/* ─── Storyboard section view ───────────────────────────── */
/**
 * Owner spec 2026-09-15 — Storyboards were the `GenericAssetSectionView`
 * fallback (shared with CTAs/Templates/References); they get their own view
 * now, same as the other four SPEC_TYPES, but the CONTENT is unchanged from
 * that fallback per spec ("keep what it shows today … just restyled into
 * the card language"): thumbnail, tags, provenance, and the shared
 * `StoryboardScenes` component (still the one the `/grid/:id` page also
 * renders, so the two can't drift).
 *
 * One real addition, not a new field: `brandId` was already on the entity
 * and already in `card.subtitle` as plain text next to the scene count —
 * exactly the "cross-link rendered as text, zero anchors on the page"
 * pattern the report already flagged twice elsewhere. Restyling it as a
 * real `Chip` link is "the card language", not new scope. `productName` is
 * a free string with no Product id, but it matches a real record by name —
 * resolved the same way this file already resolves Concept→Angle by label,
 * and falling back to plain text when nothing matches.
 */
function StoryboardSectionView({ storyboardId }: { storyboardId: string }) {
  // Hook BEFORE the early return. This file has 12 pre-existing
  // `rules-of-hooks` errors from exactly this shape (hook called after a
  // `return <Empty>`), and it is not cosmetic: the row can vanish mid-render
  // — `AssetDetailActions` right below has a Delete — and React then throws
  // on the changed hook order. Twelve inherited instances are their own
  // cleanup; this view is new, so it does not become the thirteenth.
  const genieHref = useInGenieUrl("storyboards", storyboardId);
  const storyboard = findEntityById<StoryboardAsset>("storyboards", storyboardId);
  if (!storyboard) return <Empty>Storyboard not found</Empty>;
  const brand = storyboard.brandId ? brands.find((b) => b.id === storyboard.brandId) : undefined;
  const def = getAssetType("storyboards")!;
  const card = def.toCard(storyboard);
  const criteria = deriveGenieMatchCriteria("storyboards", storyboard);

  return (
    <div className="min-h-full bg-[#FAFAF7]">
      <div className="max-w-3xl space-y-4 border-l border-[rgba(0,0,0,0.06)] pb-6 pl-5 pr-6 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                {storyboard.thumbnail ? (
                  <img src={storyboard.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <def.icon className="h-5 w-5 text-primary-text" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h2
                    className="min-w-0 truncate text-[14px] font-semibold leading-[22px] text-foreground"
                    title={storyboard.title}
                  >
                    {storyboard.title}
                  </h2>
                  <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
                  {brand && <Chip to={`/catalogue/brands/${brand.id}`}>{brand.name}</Chip>}
                  {/* `productName` is a free string, not an id — but it is an
                      exact match to a real Product, and this file already
                      resolves Concept→Angle by label the same way. Falls back
                      to plain text when no record matches, so a hand-typed
                      name never becomes a broken link. */}
                  {storyboard.productName &&
                    (() => {
                      const sbProduct = products.find((pr) => pr.name === storyboard.productName);
                      return sbProduct ? (
                        <Chip to={`/catalogue/products/${sbProduct.id}`}>{storyboard.productName}</Chip>
                      ) : (
                        <span>{storyboard.productName}</span>
                      );
                    })()}
                  <span>{storyboard.formatLabel}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="font-mono text-[12px] font-medium leading-4 text-muted-foreground">
            Last used {card.lastUsedLabel} · {card.usageCount} runs
          </p>
          <div className="h-px w-full bg-[rgba(0,0,0,0.06)]" />
        </div>

        {card.tags.length > 0 && (
          <ChipList>
            {card.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </ChipList>
        )}

        <StoryboardScenes storyboard={storyboard} />

        <AssetDetailActions def={def} item={storyboard} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...criteria} useInGenieHref={genieHref} />
      </div>
    </div>
  );
}

/* ─── Shared small field widget ─────────────────
 * `avatarToneLabel` below is still used by `AvatarSectionView`. The local
 * `FieldList`/`FieldRow`/`PersonaChip` trio that used to live here is gone —
 * every call site (Avatar, Concept) now goes through DetailKit's own
 * `FieldList`/`FieldRow` (imported here as `DetailFieldList`/`DetailFieldRow`),
 * which accepts a real `<Chip to=…>` as its value where this hand-rolled
 * version only ever took a plain string. */
/** The voice a persona reads in, as a display label — resolved through the
 *  pairing (`voiceId` → that voice's first tone → `VOICE_TONES` label),
 *  never invented on the avatar itself. `undefined` (not "Unspecified")
 *  when there's no pairing or no tone, so the caller drops the row instead
 *  of printing a placeholder. Same logic `assetTypes.ts`'s (unexported)
 *  `toneLabelForAvatar` uses — kept in sync by being this short. */
function avatarToneLabel(avatar: Avatar): string | undefined {
  if (!avatar.voiceId) return undefined;
  const voice = voices.find((v) => v.id === avatar.voiceId);
  const toneId = voice?.tones?.[0];
  if (!toneId) return undefined;
  return VOICE_TONES.find((t) => t.id === toneId)?.label;
}

/* ─── Layout helpers ───────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} />
      <div className="mt-2">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground italic">{children}</p>;
}
function cnSafe(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

/* Compact-format a number (1.2M / 23k). Renamed from formatCompact in
 * CatalogueDetailPage to avoid linker collision in this file's scope. */
function formatCompactN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

/* Deterministic colored circle for an avatar — same logic as
 * CatalogueListPage. Avoids needing real photos. */
function avatarVisual(avatar: Avatar): { bg: string; fg: string; initials: string } {
  const palette = [
    { bg: "hsl(220, 40%, 88%)", fg: "hsl(220, 50%, 30%)" },
    { bg: "hsl(160, 35%, 86%)", fg: "hsl(160, 50%, 25%)" },
    { bg: "hsl(30, 50%, 88%)", fg: "hsl(30, 60%, 30%)" },
    { bg: "hsl(340, 35%, 88%)", fg: "hsl(340, 50%, 32%)" },
    { bg: "hsl(265, 35%, 88%)", fg: "hsl(265, 50%, 32%)" },
    { bg: "hsl(195, 35%, 86%)", fg: "hsl(195, 60%, 28%)" },
  ];
  let hash = 0;
  for (let i = 0; i < avatar.id.length; i++) hash = (hash * 31 + avatar.id.charCodeAt(i)) | 0;
  const slot = Math.abs(hash) % palette.length;
  const initials = avatar.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { ...palette[slot], initials };
}
