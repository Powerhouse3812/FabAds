import { useMemo, useState } from "react";
import { Check, LayoutTemplate, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TemplateRail — Step 4 picker body for the "Ad templates" rail mode.
 *
 * An ad-TEMPLATE gallery (single-select). Mirrors LibraryColumnDrawer's
 * chassis: sticky header (eyebrow + title + count + close), optional
 * category filter-chip row, scroll body (3-col 4:5 grid with format chip),
 * sticky footer (Cancel + "Use template").
 *
 * Single-select: clicking a selected tile keeps it selected; clicking
 * another replaces the pick. Footer "Use template" → onSelect(templateId).
 *
 * Templates are an inline mock (~10) — pre-built ad layouts the user starts
 * from. brandId is accepted for parity with the other rails (and so the
 * orchestrator can wire it identically) but the mock template pool is
 * brand-agnostic, so it only feeds a small "for <brand>" framing line.
 */

interface TemplateRailProps {
  onSelect: (templateId: string) => void;
  onClose: () => void;
  /** Resolved from wizard.state.brandId. Used only for the framing line. */
  brandId?: string | null;
}

type TemplateFormat = "Static" | "Video" | "Carousel";

interface AdTemplate {
  id: string;
  name: string;
  format: TemplateFormat;
  /** Display aspect, e.g. "1:1" / "4:5" / "9:16" / "16:9". */
  aspect: string;
  thumbnail: string;
  category: string;
}

/** Inline mock — ~10 pre-built ad templates across formats + categories. */
const TEMPLATES: AdTemplate[] = [
  {
    id: "tpl-ugc-testimonial",
    name: "UGC Testimonial",
    format: "Video",
    aspect: "9:16",
    thumbnail:
      "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=240&q=70",
    category: "UGC",
  },
  {
    id: "tpl-product-hero",
    name: "Product Hero",
    format: "Static",
    aspect: "1:1",
    thumbnail:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&q=70",
    category: "Product hero",
  },
  {
    id: "tpl-five-star-review",
    name: "5-Star Review",
    format: "Static",
    aspect: "4:5",
    thumbnail:
      "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=240&q=70",
    category: "Testimonial",
  },
  {
    id: "tpl-flash-sale",
    name: "Flash Sale Promo",
    format: "Static",
    aspect: "1:1",
    thumbnail:
      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=240&q=70",
    category: "Sale",
  },
  {
    id: "tpl-unboxing-reel",
    name: "Unboxing Reel",
    format: "Video",
    aspect: "9:16",
    thumbnail:
      "https://images.unsplash.com/photo-1561069934-eee225952461?auto=format&fit=crop&w=240&q=70",
    category: "UGC",
  },
  {
    id: "tpl-before-after",
    name: "Before / After",
    format: "Carousel",
    aspect: "1:1",
    thumbnail:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=240&q=70",
    category: "Testimonial",
  },
  {
    id: "tpl-feature-grid",
    name: "Feature Grid",
    format: "Carousel",
    aspect: "4:5",
    thumbnail:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=70",
    category: "Product hero",
  },
  {
    id: "tpl-lifestyle-scene",
    name: "Lifestyle Scene",
    format: "Static",
    aspect: "4:5",
    thumbnail:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=240&q=70",
    category: "Product hero",
  },
  {
    id: "tpl-bogo-offer",
    name: "BOGO Offer",
    format: "Static",
    aspect: "1:1",
    thumbnail:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=240&q=70",
    category: "Sale",
  },
  {
    id: "tpl-talking-head",
    name: "Talking Head Ad",
    format: "Video",
    aspect: "9:16",
    thumbnail:
      "https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&w=240&q=70",
    category: "UGC",
  },
];

const ALL = "all" as const;
type CategoryFilter = typeof ALL | string;

export function TemplateRail({ onSelect, onClose, brandId = null }: TemplateRailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(ALL);

  // Distinct categories present in the pool (stable order).
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of TEMPLATES) {
      if (!seen.has(t.category)) {
        seen.add(t.category);
        out.push(t.category);
      }
    }
    return out;
  }, []);

  const filtered = useMemo(
    () =>
      categoryFilter === ALL
        ? TEMPLATES
        : TEMPLATES.filter((t) => t.category === categoryFilter),
    [categoryFilter],
  );

  const handleUse = () => {
    if (selectedId) onSelect(selectedId);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header */}
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Ad templates
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              Templates
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                {filtered.length}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close templates"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          Pre-built layouts to start from
          {brandId ? " — tuned to your brand on generate" : ""}. Pick one, then
          refine in the prompt.
        </p>

        {/* Category filter chips — horizontal scroll, no wrap. */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <Chip active={categoryFilter === ALL} onClick={() => setCategoryFilter(ALL)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c}
              active={categoryFilter === c}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      </header>

      {/* Scroll body — 3-col 4:5 grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {filtered.map((tpl) => {
            const isSelected = selectedId === tpl.id;
            return (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(tpl.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
                    isSelected
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                      : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                  )}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <img
                      src={tpl.thumbnail}
                      alt={tpl.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                      {tpl.format}
                    </span>
                    <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
                      {tpl.aspect}
                    </span>
                    {isSelected && (
                      <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                      {tpl.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {tpl.category}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky footer */}
      <footer className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <LayoutTemplate className="h-3 w-3" />
          {selectedId ? "1 selected" : "None selected"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUse}
            disabled={!selectedId}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Use template
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * Chip — pill toggle. Active = lime-tinted, idle = ghost-outline.
 * (Same baseline as LibraryColumnDrawer's filter chips.)
 * ────────────────────────────────────────────────────────────────────── */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/[0.10] text-primary"
          : "border-border/60 bg-background/50 text-foreground/70 hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
