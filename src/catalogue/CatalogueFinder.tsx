import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Search, Tag, Building2, Package, ChevronRight, ExternalLink, Plus,
  Layers, FileText, Globe, Settings as SettingsIcon, Wand2,
  Users, Megaphone,
  Crosshair, MessageSquareQuote, Lightbulb, UserRound, Mic, Volume2,
  Languages,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BrandDetail, CategoryDetail, ProductDetail } from "./CatalogueDetailPage";
import { AddBrandModal } from "./AddBrandModal";
import { AddProductModal } from "./AddProductModal";
import { AddCategoryModal } from "./AddCategoryModal";
import {
  getAssetType,
  findEntityById,
  firstIdForType,
  buildDuplicate,
  type CatalogueType,
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
import { useInGenieUrl, bulkUseInGenieUrl, brandNameForProducts } from "./genieHandoff";
import { AssetFormModal } from "./AssetFormModal";
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
    if (!q) return base;
    return base.filter((it) => {
      const card = def.toCard(it);
      return (
        card.name.toLowerCase().includes(q) ||
        (card.subtitle?.toLowerCase().includes(q) ?? false) ||
        card.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, query, writes]);

  // A deleted (or searched-away) selection must not keep rendering its
  // detail pane — after "Delete Notion" the left list dropped the row while
  // the right pane still showed Notion's full profile with live buttons.
  useEffect(() => {
    if (selectedId && !items.some((it) => def.getId(it) === selectedId)) {
      setSelectedId(items[0] ? def.getId(items[0]) : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedId]);

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
  const bulkProductNotice =
    type === "products" && bulkCount >= 2
      ? `${bulkCount} products${brandNameForProducts(bulkIds) ? ` from ${brandNameForProducts(bulkIds)}` : ""} will become ONE ad, not ${bulkCount} separate ads.`
      : undefined;
  const handleBulkUseInGenie =
    type === "products" ? () => navigate(bulkUseInGenieUrl(bulkIds)) : undefined;

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
            onUseInGenie={handleBulkUseInGenie}
            useInGenieLabel="Use in Genie (1 ad)"
            bulkProductNotice={bulkProductNotice}
            onClear={() => setBulkSelected(new Set())}
          />
        </div>
      )}

      {/* 3-pane Finder body */}
      <div className="flex-1 flex min-h-0">
        {/* PANE 1 — entity list */}
        <aside className="w-[260px] flex-shrink-0 border-r border-border flex flex-col">
          <div className="px-3 py-2 border-b border-border shrink-0">
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
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {isLoading ? (
              <Pane1Skeleton />
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No {def.label.toLowerCase()} match "{query}"
              </p>
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
            in pane 3. Other entity types still render pane 2. */}
        {type !== "brands" && type !== "products" && type !== "categories" && (isLoading || selectedId) && (
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
        <AddProductModal open={addOpen} onOpenChange={setAddOpen} />
      )}
      {type === "categories" && (
        <AddCategoryModal open={addOpen} onOpenChange={setAddOpen} />
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
          active ? "text-primary" : "text-foreground",
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
  if (type === "hooks") {
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "brand", label: "Parent brand", icon: Building2 },
      { key: "angle", label: "Linked angle", icon: Crosshair },
      { key: "generations", label: "Generations", icon: Wand2, count: 0 },
    ];
  }
  if (type === "concepts") {
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "brand", label: "Parent brand", icon: Building2 },
      { key: "angle", label: "Linked angle", icon: Crosshair },
      { key: "hook", label: "Linked hook", icon: MessageSquareQuote },
      { key: "generations", label: "Generations", icon: Wand2, count: 0 },
    ];
  }
  if (type === "avatars") {
    const avatar = avatars.find((a) => a.id === selectedId);
    return [
      { key: "overview", label: "Overview", icon: FileText },
      { key: "languages", label: "Languages", icon: Languages, count: avatar?.language.length ?? 0 },
      { key: "generations", label: "Generations", icon: Wand2, count: 0 },
    ];
  }
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
  // Scripts / CTAs / Frameworks / Templates / References — new §21.2 types
  // with no relational data model to cross-link, so a generic Overview +
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
                  isOpen && !activeChildId ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-foreground"
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
                          childActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/40 text-foreground/80"
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
  if (type === "hooks") return <HookSectionView hookId={selectedId} section={section} />;
  if (type === "concepts") return <ConceptSectionView conceptId={selectedId} section={section} />;
  if (type === "avatars") return <AvatarSectionView avatarId={selectedId} section={section} />;
  if (type === "voices") return <VoiceSectionView voiceId={selectedId} section={section} />;
  if (type === "products") return <ProductSectionView productId={selectedId} section={section} />;
  // Scripts / CTAs / Frameworks / Templates / References — §21.2 additions
  // with no bespoke relational view of their own. Generic overview + real
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
              <def.icon className="h-5 w-5 text-primary" />
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
              <a href={lp} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
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
              <a href={cu} target="_blank" rel="noreferrer" className="text-xs font-mono text-muted-foreground hover:text-primary inline-flex items-center gap-1.5">
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
        <GenerationsFromAsset
          brandName={brand?.name}
          productName={prod.name}
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
              <Users className="h-5 w-5 text-primary" />
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
  return <HookSectionView hookId={hookId} section="overview" />;
}
function ConceptQuickCard({ conceptId }: { conceptId: string }) {
  return <ConceptSectionView conceptId={conceptId} section="overview" />;
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
              <Crosshair className="h-5 w-5 text-primary" />
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
function HookSectionView({ hookId, section }: { hookId: string; section: string }) {
  const hook = hooks.find((h) => h.id === hookId);
  if (!hook) return <Empty>Hook not found</Empty>;
  const brand = hook.brandId ? brands.find((b) => b.id === hook.brandId) : undefined;
  const angle = hook.angleId ? angles.find((a) => a.id === hook.angleId) : undefined;
  const def = getAssetType("hooks")!;
  const card = def.toCard(hook);
  const genieHref = useInGenieUrl("hooks", hook.id);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquareQuote className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground italic leading-snug">"{hook.text}"</h2>
              {(brand || angle) && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {brand?.name}{brand && angle && " · "}{angle?.label}
                </p>
              )}
            </div>
          </div>
          <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
        </div>
        {hook.performance && (
          <Section title="Performance">
            <div className="flex items-center gap-6 font-mono tabular-nums">
              <div>
                <p className="text-xs text-muted-foreground">CTR</p>
                <p className="text-2xl font-bold text-foreground">{hook.performance.ctr.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold text-foreground">{formatCompactN(hook.performance.impressions)}</p>
              </div>
            </div>
          </Section>
        )}
        <AssetDetailActions def={def} item={hook} useInGenieHref={genieHref} />
      </div>
    );
  }
  if (section === "brand") {
    if (!brand) return <div className="p-6"><Empty>No brand linked.</Empty></div>;
    return <BrandSectionView brandId={brand.id} section="overview" />;
  }
  if (section === "angle") {
    if (!angle) return <div className="p-6"><Empty>No angle linked.</Empty></div>;
    return <AngleSectionView angleId={angle.id} section="overview" />;
  }
  if (section === "generations") {
    return (
      <div className="p-6 max-w-3xl">
        <GenerationsFromAsset {...deriveGenieMatchCriteria("hooks", hook)} useInGenieHref={genieHref} />
      </div>
    );
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* ─── Concept section view ───────────────────────────── */
function ConceptSectionView({ conceptId, section }: { conceptId: string; section: string }) {
  const concept = concepts.find((c) => c.id === conceptId);
  if (!concept) return <Empty>Concept not found</Empty>;
  const brand = brands.find((b) => b.id === concept.brandId);
  const angle = angles.find((a) => a.label.toLowerCase() === concept.angle.toLowerCase());
  const linkedHook = hooks.find((h) => h.text === concept.hook);
  const def = getAssetType("concepts")!;
  const card = def.toCard(concept);
  const genieHref = useInGenieUrl("concepts", concept.id);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{concept.name}</h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                {concept.angle} · {concept.tone}
              </p>
            </div>
          </div>
          <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
        </div>
        <Section title="Format"><p className="text-sm text-foreground font-mono">{concept.format}</p></Section>
        <Section title="Visual direction"><p className="text-sm text-foreground">{concept.visualDirection}</p></Section>
        <Section title="Hook copy"><p className="text-sm text-foreground italic">"{concept.hook}"</p></Section>
        <Section title="Generations">
          <div className="flex items-baseline gap-2">
            <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm text-foreground font-mono tabular-nums">{concept.generationCount} runs</p>
          </div>
        </Section>
        <AssetDetailActions def={def} item={concept} useInGenieHref={genieHref} />
      </div>
    );
  }
  if (section === "brand") {
    if (!brand) return <div className="p-6"><Empty>No brand linked.</Empty></div>;
    return <BrandSectionView brandId={brand.id} section="overview" />;
  }
  if (section === "angle") {
    if (!angle) return <div className="p-6"><Empty>Angle "{concept.angle}" not found in registry.</Empty></div>;
    return <AngleSectionView angleId={angle.id} section="overview" />;
  }
  if (section === "hook") {
    if (!linkedHook) return <div className="p-6"><Empty>This concept's hook copy isn't a registered hook entity.</Empty></div>;
    return <HookSectionView hookId={linkedHook.id} section="overview" />;
  }
  if (section === "generations") {
    return (
      <div className="p-6 max-w-3xl">
        <GenerationsFromAsset {...deriveGenieMatchCriteria("concepts", concept)} useInGenieHref={genieHref} />
      </div>
    );
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* ─── Avatar section view ───────────────────────────── */
function AvatarSectionView({ avatarId, section }: { avatarId: string; section: string }) {
  const avatar = avatars.find((a) => a.id === avatarId);
  if (!avatar) return <Empty>Avatar not found</Empty>;
  const visual = avatarVisual(avatar);
  const def = getAssetType("avatars")!;
  const card = def.toCard(avatar);
  const genieHref = useInGenieUrl("avatars", avatar.id);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
              style={{ background: visual.bg, color: visual.fg }}
            >
              {visual.initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{avatar.name}</h2>
              <p className="text-xs text-muted-foreground">{avatar.demographic}</p>
            </div>
          </div>
          <ProvenanceBadge provenance={card.provenance} className="shrink-0" />
        </div>
        <Section title={`Languages · ${avatar.language.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {avatar.language.map((l) => (
              <span key={l} className="text-xs font-mono rounded bg-muted px-2 py-1 text-muted-foreground">{l}</span>
            ))}
          </div>
        </Section>
        {/* No "New avatar" affordance anywhere (V1 = presets only, §9/§13) —
            but Edit/Duplicate/Archive/Delete/Use-in-Genie on an existing
            preset are all fine, so the full action row still applies. */}
        <AssetDetailActions def={def} item={avatar} useInGenieHref={genieHref} />
        <GenerationsFromAsset {...deriveGenieMatchCriteria("avatars", avatar)} useInGenieHref={genieHref} />
      </div>
    );
  }
  if (section === "languages") {
    return (
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Languages · {avatar.language.length}</h3>
        <div className="flex flex-wrap gap-1.5">
          {avatar.language.map((l) => (
            <span key={l} className="text-xs font-mono rounded bg-muted px-2 py-1 text-muted-foreground">{l}</span>
          ))}
        </div>
      </div>
    );
  }
  if (section === "generations") {
    return (
      <div className="p-6 max-w-3xl">
        <GenerationsFromAsset {...deriveGenieMatchCriteria("avatars", avatar)} useInGenieHref={genieHref} />
      </div>
    );
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
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
              <Mic className="h-5 w-5 text-primary" />
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
              <Volume2 className="h-3.5 w-3.5 text-primary" />
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
            <Volume2 className="h-3.5 w-3.5 text-primary" />
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
