import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Tag, Building2, Package, ChevronRight, ExternalLink, Plus,
  Layers, FileText, Globe, Settings as SettingsIcon, Wand2, Sparkles,
  Users, Megaphone,
  Crosshair, MessageSquareQuote, Lightbulb, UserRound, Mic, Volume2,
  Languages,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  brands, categories, products, audiences,
  angles, hooks, concepts, avatars, voices,
} from "@/mocks/shared";
import type {
  Brand, Category, Product, Audience,
  Angle, Hook, Concept, Avatar, Voice,
} from "@/genie6/types/entities";
import { SectionHeader } from "@/genie6/studio-v4/components/SectionHeader";

type CatalogueType =
  | "categories"
  | "brands"
  | "products"
  | "audiences"
  | "angles"
  | "hooks"
  | "concepts"
  | "avatars"
  | "voices";

type AnyEntity = Brand | Category | Product | Audience | Angle | Hook | Concept | Avatar | Voice;

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

const TYPE_CONFIG: Record<
  CatalogueType,
  { label: string; singular: string; icon: React.ElementType; description: string }
> = {
  categories: {
    label: "Categories", singular: "Category", icon: Tag,
    description: "Browse categories — drill into linked brands, products, KB.",
  },
  brands: {
    label: "Brands", singular: "Brand", icon: Building2,
    description: "Browse brands — drill into products, categories, voice + identity.",
  },
  products: {
    label: "Products", singular: "Product", icon: Package,
    description: "Browse products — drill into landing pages, campaign URLs, KB.",
  },
  audiences: {
    label: "Audiences", singular: "Audience", icon: Users,
    description: "Targeting segments your campaigns reach. Each audience has a brand link, demographic profile, and generation history.",
  },
  angles: {
    label: "Angles", singular: "Angle", icon: Crosshair,
    description: "Strategic ad angles — how a creative frames the product (Hero, Lifestyle, Social Proof, Urgency, etc.). Reusable across brands and campaigns.",
  },
  hooks: {
    label: "Hooks", singular: "Hook", icon: MessageSquareQuote,
    description: "Opening lines + visual hooks proven to grab attention. Linked to brand + angle, with CTR + impression history.",
  },
  concepts: {
    label: "Concepts", singular: "Concept", icon: Lightbulb,
    description: "Repeatable creative concepts — angle + hook + visual direction packaged together. Used as Genie generation seeds.",
  },
  avatars: {
    label: "Avatars", singular: "Avatar", icon: UserRound,
    description: "Avatar identities for UGC video generation. Cross-language profiles with demographic + style.",
  },
  voices: {
    label: "Voices", singular: "Voice", icon: Mic,
    description: "Voice samples across languages and tones. Powers audio-led UGC generations.",
  },
};

export function CatalogueFinder({ type }: { type: CatalogueType }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  const [searchParams] = useSearchParams();
  const isLoading = searchParams.get("loading") === "1";
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (type === "brands") return brands[0]?.id ?? null;
    if (type === "categories") return categories[0]?.id ?? null;
    if (type === "audiences") return audiences[0]?.id ?? null;
    if (type === "angles") return angles[0]?.id ?? null;
    if (type === "hooks") return hooks[0]?.id ?? null;
    if (type === "concepts") return concepts[0]?.id ?? null;
    if (type === "avatars") return avatars[0]?.id ?? null;
    if (type === "voices") return voices[0]?.id ?? null;
    return products[0]?.id ?? null;
  });
  const [section, setSection] = useState<string>("overview");
  const [childId, setChildId] = useState<string | null>(null);

  // Pane 1 list — search field varies per entity type.
  // brands/categories/products: name
  // audiences: label + segment
  // angles: label + description
  // hooks: text
  // concepts: name + tone + visualDirection
  // avatars: name + demographic
  // voices: name + language + description
  const items = useMemo<AnyEntity[]>(() => {
    const base: AnyEntity[] =
      type === "brands"
        ? brands
        : type === "categories"
          ? categories
          : type === "audiences"
            ? audiences
            : type === "angles"
              ? angles
              : type === "hooks"
                ? hooks
                : type === "concepts"
                  ? concepts
                  : type === "avatars"
                    ? avatars
                    : type === "voices"
                      ? voices
                      : products;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((it) => {
      if (type === "angles") {
        const a = it as Angle;
        return a.label.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) ?? false);
      }
      if (type === "hooks") {
        const h = it as Hook;
        return h.text.toLowerCase().includes(q);
      }
      if (type === "concepts") {
        const c = it as Concept;
        return (
          c.name.toLowerCase().includes(q) ||
          c.tone.toLowerCase().includes(q) ||
          c.visualDirection.toLowerCase().includes(q)
        );
      }
      if (type === "avatars") {
        const av = it as Avatar;
        return av.name.toLowerCase().includes(q) || av.demographic.toLowerCase().includes(q);
      }
      if (type === "voices") {
        const v = it as Voice;
        return (
          v.name.toLowerCase().includes(q) ||
          v.language.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
        );
      }
      if ("label" in it && "segment" in it) {
        return (
          it.label.toLowerCase().includes(q) ||
          it.segment.toLowerCase().includes(q)
        );
      }
      if ("name" in it) {
        return it.name.toLowerCase().includes(q);
      }
      return false;
    });
  }, [type, query]);

  const handleSelectEntity = (id: string) => {
    setSelectedId(id);
    setSection("overview");
    setChildId(null);
  };

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
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{cfg.label}</h1>
            <p className="text-[11px] text-muted-foreground">{cfg.description}</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-[1.02] active:scale-[0.99] transition-transform"
        >
          <Plus className="h-3.5 w-3.5" />
          New {cfg.singular}
        </button>
      </header>

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
                placeholder={`Search ${cfg.label.toLowerCase()}…`}
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {isLoading ? (
              <Pane1Skeleton />
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No {cfg.label.toLowerCase()} match "{query}"
              </p>
            ) : (
              items.map((item) => {
                const active = selectedId === item.id;
                return (
                  <Pane1Row key={item.id} item={item} type={type} active={active} onClick={() => handleSelectEntity(item.id)} />
                );
              })
            )}
          </div>
        </aside>

        {/* PANE 2 — sections */}
        {(isLoading || selectedId) && (
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
}: {
  item: AnyEntity;
  type: CatalogueType;
  active: boolean;
  onClick: () => void;
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
    const p = item as Product;
    const brand = brands.find((b) => b.id === p.brandId);
    return { line1: p.name, line2: `${brand?.name ?? ""} · ${p.price}`, logo: brand?.logo, fallbackIcon: Package as React.ElementType };
  })();
  const FallbackIcon = meta.fallbackIcon;
  // Avatar gets a deterministic colored circle instead of plain icon.
  const avatarVis = type === "avatars" ? avatarVisual(item as Avatar) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cnSafe(
        "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted/40"
      )}
    >
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
    </button>
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
  // products
  const product = products.find((p) => p.id === selectedId);
  return [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "landingPages", label: "Landing Pages", icon: Globe, count: product?.landingPages?.length ?? 0 },
    { key: "campaignUrls", label: "Campaign URLs", icon: ExternalLink, count: product?.campaignUrls?.length ?? 0 },
    { key: "kb", label: "Knowledge Base", icon: Layers },
    { key: "generations", label: "Generations", icon: Wand2, count: product?.generatedCount ?? 0 },
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
  // Entity lookup — each type has a different "primary label" field.
  const entityName = (() => {
    if (type === "brands") return brands.find((b) => b.id === selectedId)?.name ?? "—";
    if (type === "categories") return categories.find((c) => c.id === selectedId)?.name ?? "—";
    if (type === "audiences") return audiences.find((a) => a.id === selectedId)?.label ?? "—";
    if (type === "angles") return angles.find((a) => a.id === selectedId)?.label ?? "—";
    if (type === "hooks") return hooks.find((h) => h.id === selectedId)?.text ?? "—";
    if (type === "concepts") return concepts.find((c) => c.id === selectedId)?.name ?? "—";
    if (type === "avatars") return avatars.find((a) => a.id === selectedId)?.name ?? "—";
    if (type === "voices") return voices.find((v) => v.id === selectedId)?.name ?? "—";
    return products.find((p) => p.id === selectedId)?.name ?? "—";
  })();
  const entityKindLabel = TYPE_CONFIG[type].singular;

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
    if (type === "brands" && section === "products") return <ProductDetail productId={childId} />;
    if (type === "brands" && section === "categories") return <CategoryQuickCard categoryId={childId} />;
    if (type === "brands" && section === "audiences") return <AudienceQuickCard audienceId={childId} />;
    if (type === "categories" && section === "brands") return <BrandQuickCard brandId={childId} />;
    if (type === "categories" && section === "products") return <ProductDetail productId={childId} />;
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
  return <ProductSectionView productId={selectedId} section={section} />;
}

/* Brand section views */
function BrandSectionView({ brandId, section }: { brandId: string; section: string }) {
  const brand = brands.find((b) => b.id === brandId);
  if (!brand) return <Empty>Brand not found</Empty>;

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          {brand.logo && <img src={brand.logo} alt="" className="h-12 w-12 rounded-lg bg-muted" />}
          <div>
            <h2 className="text-lg font-semibold text-foreground">{brand.name}</h2>
            <a href={`https://${brand.domain}`} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              {brand.domain} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Section title="Voice"><p className="text-sm text-foreground">{brand.voice}</p></Section>
        <Section title="USPs">
          <div className="flex flex-wrap gap-1.5">
            {brand.usps.map((u) => (<span key={u} className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">{u}</span>))}
          </div>
        </Section>
        <Section title="Brand colors">
          <div className="flex gap-2">
            {brand.colors.map((c) => (<div key={c} className="h-8 w-8 rounded border border-border" style={{ background: c }} title={c} />))}
          </div>
        </Section>
        <Section title="Competitors">
          <div className="flex flex-wrap gap-1.5">
            {brand.competitors.map((cid) => {
              const c = brands.find((bb) => bb.id === cid);
              return c ? (<span key={cid} className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">{c.name}</span>) : null;
            })}
          </div>
        </Section>
      </div>
    );
  }

  if (section === "kb") {
    return <div className="p-6"><Empty>Knowledge Base · stub. Brand-level KB editor ships next sprint.</Empty></div>;
  }
  if (section === "settings") {
    return <div className="p-6"><Empty>Settings · stub. Brand voice, fonts, and identity editor ships next sprint.</Empty></div>;
  }

  // products / categories sections — show prompt to select a child
  return <div className="p-6"><Empty>Pick an item from the list to see details.</Empty></div>;
}

function CategorySectionView({ categoryId, section }: { categoryId: string; section: string }) {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return <Empty>Category not found</Empty>;

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{cat.name}</h2>
            <p className="text-xs text-muted-foreground">{cat.feedbackCount} feedback · {cat.winnerCount} winners</p>
          </div>
        </div>
        <Section title="KB instruction"><p className="text-sm text-foreground">{cat.instruction}</p></Section>
      </div>
    );
  }
  if (section === "kb") {
    return <div className="p-6"><Empty>Knowledge Base · stub. Category-level KB editor ships next sprint.</Empty></div>;
  }
  if (section === "references") {
    return <div className="p-6"><Empty>Reference URLs · stub. Curated reference list ships next sprint.</Empty></div>;
  }
  return <div className="p-6"><Empty>Pick an item from the list to see details.</Empty></div>;
}

function ProductSectionView({ productId, section }: { productId: string; section: string }) {
  const prod = products.find((p) => p.id === productId);
  if (!prod) return <Empty>Product not found</Empty>;

  if (section === "overview") {
    const brand = brands.find((b) => b.id === prod.brandId);
    const cat = categories.find((c) => c.id === prod.categoryId);
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{prod.name}</h2>
            <p className="text-xs text-muted-foreground">
              {brand && (<Link to={`/catalogue/brands/${brand.id}`} className="hover:text-primary">{brand.name}</Link>)}
              {cat && (<> · <Link to={`/catalogue/categories/${cat.id}`} className="hover:text-primary">{cat.name}</Link></>)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-xl font-bold text-foreground font-mono">{prod.price}</p>
            {/* A-10.1: catalogue → generate shortcut. Skips ProductPicker entirely. */}
            <Link
              to={`/iq/genie6/generate/product-ad?product=${prod.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:scale-[1.02] active:scale-[0.99] transition-transform"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate ad
            </Link>
          </div>
        </div>
        {prod.promo && <Section title="Promo"><span className="inline-block rounded bg-primary/15 text-primary px-2 py-1 text-xs">{prod.promo}</span></Section>}
        <Section title="Benefits">
          <ul className="space-y-1 text-sm text-foreground">
            {prod.benefits.map((b) => <li key={b} className="flex gap-2"><span className="text-muted-foreground">·</span> {b}</li>)}
          </ul>
        </Section>
      </div>
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
  if (section === "generations") return <div className="p-6"><Empty>{prod.generatedCount} generations linked. Detail view ships next sprint.</Empty></div>;
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* Audience section views */
function AudienceSectionView({ audienceId, section }: { audienceId: string; section: string }) {
  const audience = audiences.find((a) => a.id === audienceId);
  if (!audience) return <Empty>Audience not found</Empty>;
  const brand = audience.brandId ? brands.find((b) => b.id === audience.brandId) : undefined;

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{audience.label}</h2>
            <p className="text-xs text-muted-foreground truncate">{audience.segment}</p>
          </div>
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
function ProductDetail({ productId }: { productId: string }) {
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

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Crosshair className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{angle.label}</h2>
            {angle.description && <p className="text-xs text-muted-foreground truncate">{angle.description}</p>}
          </div>
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
      </div>
    );
  }
  if (section === "generations") {
    return <div className="p-6"><Empty>No generations yet.</Empty></div>;
  }
  return <div className="p-6"><Empty>Pick an item from the list to see details.</Empty></div>;
}

/* ─── Hook section view ───────────────────────────── */
function HookSectionView({ hookId, section }: { hookId: string; section: string }) {
  const hook = hooks.find((h) => h.id === hookId);
  if (!hook) return <Empty>Hook not found</Empty>;
  const brand = hook.brandId ? brands.find((b) => b.id === hook.brandId) : undefined;
  const angle = hook.angleId ? angles.find((a) => a.id === hook.angleId) : undefined;

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start gap-3">
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
    return <div className="p-6"><Empty>No generations yet.</Empty></div>;
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

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start gap-3">
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
        <Section title="Format"><p className="text-sm text-foreground font-mono">{concept.format}</p></Section>
        <Section title="Visual direction"><p className="text-sm text-foreground">{concept.visualDirection}</p></Section>
        <Section title="Hook copy"><p className="text-sm text-foreground italic">"{concept.hook}"</p></Section>
        <Section title="Generations">
          <div className="flex items-baseline gap-2">
            <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm text-foreground font-mono tabular-nums">{concept.generationCount} runs</p>
          </div>
        </Section>
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
    return <div className="p-6"><Empty>No detailed generation history yet — concept has {concept.generationCount} runs total.</Empty></div>;
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* ─── Avatar section view ───────────────────────────── */
function AvatarSectionView({ avatarId, section }: { avatarId: string; section: string }) {
  const avatar = avatars.find((a) => a.id === avatarId);
  if (!avatar) return <Empty>Avatar not found</Empty>;
  const visual = avatarVisual(avatar);

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-[14px] font-semibold"
            style={{ background: visual.bg, color: visual.fg }}
          >
            {visual.initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{avatar.name}</h2>
            <p className="text-xs text-muted-foreground">{avatar.demographic}</p>
          </div>
        </div>
        <Section title={`Languages · ${avatar.language.length}`}>
          <div className="flex flex-wrap gap-1.5">
            {avatar.language.map((l) => (
              <span key={l} className="text-xs font-mono rounded bg-muted px-2 py-1 text-muted-foreground">{l}</span>
            ))}
          </div>
        </Section>
        <Section title="Generation history">
          <p className="text-sm text-muted-foreground italic">No generations yet.</p>
        </Section>
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
    return <div className="p-6"><Empty>No generations yet.</Empty></div>;
  }
  return <div className="p-6"><Empty>Pick a section to see details.</Empty></div>;
}

/* ─── Voice section view ───────────────────────────── */
function VoiceSectionView({ voiceId, section }: { voiceId: string; section: string }) {
  const voice = voices.find((v) => v.id === voiceId);
  if (!voice) return <Empty>Voice not found</Empty>;

  if (section === "overview") {
    return (
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{voice.name}</h2>
            <p className="text-xs text-muted-foreground font-mono">{voice.language}</p>
          </div>
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
        <Section title="Generation history">
          <p className="text-sm text-muted-foreground italic">No generations yet.</p>
        </Section>
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
    return <div className="p-6"><Empty>No generations yet.</Empty></div>;
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
