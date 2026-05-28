import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RecentlyFetchedCard — quick-action card on the AI-plan dashboard.
 *
 * Per Maalik: after the user sees their KPIs (Row 1 + Row 2) and the
 * Generate mode launcher, the next highest-leverage action is "make an
 * ad against something I already have". This card lists the user's
 * MOST RECENT brands, products, and categories — clicking any one of
 * them deep-links into the Ad-create flow with the entity pre-selected,
 * skipping the brand-pick step.
 *
 * Data is mocked at module scope (deterministic). Real wiring lands when
 * the recents selector is plumbed in.
 */

type RecentItemType = "brand" | "product" | "category";

type RecentItem = {
  id: string;
  type: RecentItemType;
  name: string;
  /** Short subtitle, e.g. "3 products · 47 ads" for brands, "Skincare · 8 brands" for categories. */
  meta: string;
  /** ISO timestamp string. */
  fetchedAt: string;
  /** Pre-fill route. */
  href: string;
};

type Filter = "all" | "brands" | "products" | "categories";

const RECENT_ITEMS: RecentItem[] = [
  {
    id: "mamaearth",
    type: "brand",
    name: "Mamaearth",
    meta: "3 products · 47 ads",
    fetchedAt: "2026-05-27T14:30:00",
    href: "/iq/genie6/generate?brand=mamaearth",
  },
  {
    id: "noise",
    type: "brand",
    name: "Noise",
    meta: "5 products · 312 ads",
    fetchedAt: "2026-05-26T10:15:00",
    href: "/iq/genie6/generate?brand=noise",
  },
  {
    id: "vitamin-c-serum",
    type: "product",
    name: "Vitamin C Serum",
    meta: "Mamaearth · Skincare",
    fetchedAt: "2026-05-27T11:20:00",
    href: "/iq/genie6/generate?product=vitamin-c-serum",
  },
  {
    id: "smartwatch-pro",
    type: "product",
    name: "ColorFit Pro Smartwatch",
    meta: "Noise · Wearables",
    fetchedAt: "2026-05-25T16:45:00",
    href: "/iq/genie6/generate?product=smartwatch-pro",
  },
  {
    id: "skincare",
    type: "category",
    name: "Skincare",
    meta: "8 brands · 1,247 ads",
    fetchedAt: "2026-05-26T09:00:00",
    href: "/iq/genie6/generate?category=skincare",
  },
  {
    id: "wearables",
    type: "category",
    name: "Wearables",
    meta: "5 brands · 893 ads",
    fetchedAt: "2026-05-24T13:30:00",
    href: "/iq/genie6/generate?category=wearables",
  },
  {
    id: "boat",
    type: "brand",
    name: "Boat",
    meta: "2 products · 156 ads",
    fetchedAt: "2026-05-23T15:10:00",
    href: "/iq/genie6/generate?brand=boat",
  },
];

interface RecentlyFetchedCardProps {
  className?: string;
}

export function RecentlyFetchedCard({ className }: RecentlyFetchedCardProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const items = useMemo(() => {
    const sorted = [...RECENT_ITEMS].sort(
      (a, b) =>
        new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(),
    );
    if (filter === "all") return sorted;
    if (filter === "brands") return sorted.filter((i) => i.type === "brand");
    if (filter === "products") return sorted.filter((i) => i.type === "product");
    return sorted.filter((i) => i.type === "category");
  }, [filter]);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 flex flex-col gap-3",
        className,
      )}
      aria-label="Recently fetched brands, products, and categories"
    >
      <Header />
      <FilterPills value={filter} onChange={setFilter} />
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
/* Header — eyebrow + title + optional view-all link               */
/* -------------------------------------------------------------- */

function Header() {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Recently fetched
        </span>
        <h3 className="text-[16px] font-medium text-foreground leading-tight">
          Pick up where you left off
        </h3>
      </div>
      <Link
        to="/iq/genie6/workspace"
        className="shrink-0 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        View all
      </Link>
    </header>
  );
}

/* -------------------------------------------------------------- */
/* FilterPills — segmented 4-option control                         */
/* -------------------------------------------------------------- */

const FILTER_OPTIONS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "brands", label: "Brands" },
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
];

function FilterPills({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter recent items by type"
      className="flex items-center gap-1"
    >
      {FILTER_OPTIONS.map((opt) => {
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
      aria-label={`Open ${item.name} in Ad-create flow`}
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
/* TypeTag — pill chip indicating brand/product/category           */
/* -------------------------------------------------------------- */

const TYPE_TAG_STYLES: Record<RecentItemType, string> = {
  brand: "bg-primary/15 text-primary",
  product: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  category: "bg-muted text-muted-foreground",
};

const TYPE_TAG_LABELS: Record<RecentItemType, string> = {
  brand: "Brand",
  product: "Product",
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
