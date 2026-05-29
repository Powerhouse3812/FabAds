import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RecentlyFetchedCard — quick-action card on the AI-plan dashboard.
 *
 * Two top-level tabs:
 *   Fetched — items scraped via the Industry Insights Chrome extension.
 *             Click → navigates to /insights-v2/feed
 *   Created — brands/products the user created in their workspace.
 *             Click → navigates to /iq/genie6/generate with pre-fill
 *
 * Data is mocked at module scope (deterministic). Real wiring lands when
 * the recents selector is plumbed in.
 */

/* -------------------------------------------------------------- */
/* Types                                                           */
/* -------------------------------------------------------------- */

type Tab = "fetched" | "created";

/** Item types that can appear in the Fetched tab */
type FetchedItemType = "brand" | "competitor" | "category";

/** Item types that can appear in the Created tab */
type CreatedItemType = "brand" | "product";

type RecentItemType = FetchedItemType | CreatedItemType;

type RecentItem = {
  id: string;
  type: RecentItemType;
  name: string;
  meta: string;
  fetchedAt: string;
  href: string;
};

type Filter = "all" | "brands" | "products" | "competitors" | "categories";

/* -------------------------------------------------------------- */
/* Mock data — Fetched                                             */
/* -------------------------------------------------------------- */

const FETCHED_ITEMS: RecentItem[] = [
  {
    id: "mamaearth-f",
    type: "brand",
    name: "Mamaearth",
    meta: "8 new ads · Facebook, Instagram",
    fetchedAt: "2026-05-28T14:30:00",
    href: "/insights-v2/feed?brand=mamaearth",
  },
  {
    id: "boat-f",
    type: "competitor",
    name: "Boat",
    meta: "6 new ads · Instagram, TikTok",
    fetchedAt: "2026-05-27T10:15:00",
    href: "/insights-v2/feed?brand=boat",
  },
  {
    id: "noise-f",
    type: "competitor",
    name: "Noise",
    meta: "5 new ads · Facebook",
    fetchedAt: "2026-05-27T08:20:00",
    href: "/insights-v2/feed?brand=noise",
  },
  {
    id: "skincare-f",
    type: "category",
    name: "Skincare",
    meta: "4 new ads · Instagram",
    fetchedAt: "2026-05-26T09:00:00",
    href: "/insights-v2/feed?category=skincare",
  },
  {
    id: "wearables-f",
    type: "category",
    name: "Wearables",
    meta: "2 new ads · Google",
    fetchedAt: "2026-05-25T13:30:00",
    href: "/insights-v2/feed?category=wearables",
  },
];

/* -------------------------------------------------------------- */
/* Mock data — Created                                             */
/* -------------------------------------------------------------- */

const CREATED_ITEMS: RecentItem[] = [
  {
    id: "mamaearth-c",
    type: "brand",
    name: "Mamaearth",
    meta: "3 products · 47 ads generated",
    fetchedAt: "2026-05-28T11:20:00",
    href: "/iq/genie6/generate?brand=mamaearth",
  },
  {
    id: "noise-c",
    type: "brand",
    name: "Noise",
    meta: "5 products · 312 ads generated",
    fetchedAt: "2026-05-27T16:45:00",
    href: "/iq/genie6/generate?brand=noise",
  },
  {
    id: "vitamin-c",
    type: "product",
    name: "Vitamin C Serum",
    meta: "Mamaearth · Skincare",
    fetchedAt: "2026-05-28T09:10:00",
    href: "/iq/genie6/generate?product=vitamin-c-serum",
  },
  {
    id: "smartwatch",
    type: "product",
    name: "ColorFit Pro Smartwatch",
    meta: "Noise · Wearables",
    fetchedAt: "2026-05-26T14:30:00",
    href: "/iq/genie6/generate?product=smartwatch-pro",
  },
];

/* -------------------------------------------------------------- */
/* Filter option sets per tab                                       */
/* -------------------------------------------------------------- */

const FILTER_OPTIONS_FETCHED: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "brands", label: "Brands" },
  { value: "competitors", label: "Competitors" },
  { value: "categories", label: "Categories" },
];

const FILTER_OPTIONS_CREATED: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "brands", label: "Brands" },
  { value: "products", label: "Products" },
];

/* -------------------------------------------------------------- */
/* Root component                                                   */
/* -------------------------------------------------------------- */

interface RecentlyFetchedCardProps {
  className?: string;
}

export function RecentlyFetchedCard({ className }: RecentlyFetchedCardProps) {
  const [tab, setTab] = useState<Tab>("fetched");
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  // Reset filter when switching tabs to avoid stale/invalid filter state
  function handleTabChange(nextTab: Tab) {
    setTab(nextTab);
    setFilter("all");
  }

  const pool = tab === "fetched" ? FETCHED_ITEMS : CREATED_ITEMS;

  const items = useMemo(() => {
    const sorted = [...pool].sort(
      (a, b) =>
        new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(),
    );
    if (filter === "all") return sorted;
    if (filter === "brands") return sorted.filter((i) => i.type === "brand");
    if (filter === "products") return sorted.filter((i) => i.type === "product");
    if (filter === "competitors") return sorted.filter((i) => i.type === "competitor");
    return sorted.filter((i) => i.type === "category");
  }, [pool, filter]);

  const filterOptions =
    tab === "fetched" ? FILTER_OPTIONS_FETCHED : FILTER_OPTIONS_CREATED;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 flex flex-col gap-3",
        className,
      )}
      aria-label="Recently fetched or created brands, products, and categories"
    >
      <Header tab={tab} />
      <TabToggle value={tab} onChange={handleTabChange} />
      <FilterPills
        value={filter}
        onChange={setFilter}
        options={filterOptions}
      />
      <ItemsGrid
        items={items}
        filter={filter}
        onItemClick={(href) => navigate(href)}
      />
    </section>
  );
}

export default RecentlyFetchedCard;

/* -------------------------------------------------------------- */
/* Header — eyebrow + title + tab-aware "View all" link            */
/* -------------------------------------------------------------- */

function Header({ tab }: { tab: Tab }) {
  const eyebrow = tab === "fetched" ? "Recently fetched" : "Recently created";
  const title =
    tab === "fetched"
      ? "What your extension found"
      : "Pick up where you left off";
  const viewAllHref =
    tab === "fetched" ? "/insights-v2/feed" : "/iq/genie6/workspace";

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </span>
        <h3 className="text-[16px] font-medium text-foreground leading-tight">
          {title}
        </h3>
      </div>
      <Link
        to={viewAllHref}
        className="shrink-0 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        View all
      </Link>
    </header>
  );
}

/* -------------------------------------------------------------- */
/* TabToggle — top-level Fetched / Created 2-pill toggle           */
/* -------------------------------------------------------------- */

const TAB_OPTIONS: Array<{ value: Tab; label: string }> = [
  { value: "fetched", label: "Fetched" },
  { value: "created", label: "Created" },
];

function TabToggle({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Switch between fetched and created items"
      className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 w-fit"
    >
      {TAB_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-7 px-4 rounded-md text-[12px] font-medium leading-none",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* FilterPills — segmented filter control (options vary by tab)    */
/* -------------------------------------------------------------- */

function FilterPills({
  value,
  onChange,
  options,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
  options: Array<{ value: Filter; label: string }>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter recent items by type"
      className="flex items-center gap-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-7 px-3 rounded-full text-[12px] font-medium leading-none",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* ItemsGrid — responsive grid of compact item cards               */
/* -------------------------------------------------------------- */

function ItemsGrid({
  items,
  filter,
  onItemClick,
}: {
  items: RecentItem[];
  filter: Filter;
  onItemClick: (href: string) => void;
}) {
  if (items.length === 0) {
    const label =
      filter === "all"
        ? "items"
        : filter === "brands"
          ? "brands"
          : filter === "products"
            ? "products"
            : filter === "competitors"
              ? "competitors"
              : "categories";
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div className="col-span-full py-8 text-center text-[12px] text-muted-foreground">
          No recent {label} yet
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onClick={() => onItemClick(item.href)}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* ItemCard — single clickable recent item                         */
/* -------------------------------------------------------------- */

function ItemCard({
  item,
  onClick,
}: {
  item: RecentItem;
  onClick: () => void;
}) {
  const initial = item.name.charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${item.name}`}
      className={cn(
        "group cursor-pointer text-left",
        "border border-border/60 rounded-xl p-3",
        "hover:border-primary/40 hover:bg-primary/[0.03] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "flex flex-col gap-2",
      )}
    >
      {/* Top row — avatar + name + type chip */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            "bg-muted text-foreground/70 text-[13px] font-semibold",
          )}
        >
          {initial}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
            {item.name}
          </p>
          <p className="text-[11px] text-muted-foreground leading-none">
            Fetched {relativeTime(item.fetchedAt)}
          </p>
        </div>
        <TypeTag type={item.type} />
      </div>

      {/* Divider */}
      <div aria-hidden className="h-px w-full bg-border/60" />

      {/* Bottom row — meta + arrow */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11.5px] text-muted-foreground truncate min-w-0">
          {item.meta}
        </p>
        <ArrowRight
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors"
          strokeWidth={2}
        />
      </div>
    </button>
  );
}

/* -------------------------------------------------------------- */
/* TypeTag — pill chip per item type                               */
/* -------------------------------------------------------------- */

const TYPE_TAG_STYLES: Record<RecentItemType, string> = {
  brand: "bg-primary/15 text-primary",
  product: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  competitor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  category: "bg-muted text-muted-foreground",
};

const TYPE_TAG_LABELS: Record<RecentItemType, string> = {
  brand: "Brand",
  product: "Product",
  competitor: "Competitor",
  category: "Category",
};

function TypeTag({ type }: { type: RecentItemType }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5",
        "font-mono text-[9px] uppercase tracking-[0.12em]",
        TYPE_TAG_STYLES[type],
      )}
    >
      {TYPE_TAG_LABELS[type]}
    </span>
  );
}

/* -------------------------------------------------------------- */
/* relativeTime — tiny "Xm/h/d ago" formatter                      */
/* -------------------------------------------------------------- */

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMin = (Date.now() - date.getTime()) / 60000;
  if (diffMin < 60) return `${Math.round(diffMin)}m ago`;
  const diffH = diffMin / 60;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  const diffD = diffH / 24;
  return `${Math.round(diffD)}d ago`;
}
