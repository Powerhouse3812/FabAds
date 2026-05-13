import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Compass, Eye, Globe, Telescope } from "lucide-react";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";

export type InsightsSearchScope =
  | "feed"
  | "discovery"
  | "boards"
  | "competitors";

interface InsightsSearchPopoverProps {
  query: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Applies the query to the current page (My feeds). */
  onApplyHere: (query: string) => void;
  /** Ref to the search input — used to detect click-outside correctly. */
  anchorRef: React.RefObject<HTMLInputElement>;
  /** Current page key — drives which scope is highlighted as "this page". */
  currentScope: InsightsSearchScope;
}

interface ScopeRow {
  key: InsightsSearchScope | "everywhere";
  label: string;
  icon: typeof Compass;
  count: number;
  onSelect: () => void;
  isCurrent?: boolean;
}

export function InsightsSearchPopover({
  query,
  open,
  onOpenChange,
  onApplyHere,
  anchorRef,
  currentScope,
}: InsightsSearchPopoverProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trimmed = query.trim();
  const [activeIndex, setActiveIndex] = useState(0);

  const counts = useMemo(() => {
    if (trimmed.length === 0) {
      return { feed: 0, discovery: 0, boards: 0, competitors: 0, total: 0 };
    }
    const needle = trimmed.toLowerCase();
    const matches = DUMMY_ADS.filter((ad) => {
      return (
        ad.brand.toLowerCase().includes(needle) ||
        ad.headline.toLowerCase().includes(needle) ||
        ad.description.toLowerCase().includes(needle) ||
        ad.primaryText.toLowerCase().includes(needle) ||
        ad.domain.toLowerCase().includes(needle) ||
        ad.pageName.toLowerCase().includes(needle)
      );
    });
    const feedCount = matches.length;
    const discoveryCount = matches.length;
    const boardsCount = matches.filter((_, idx) => idx % 6 === 0).length;
    const competitorsCount = matches.filter((ad) => {
      const rest = ad.brand.slice(1).toLowerCase();
      return /[aeiou]/.test(rest);
    }).length;
    return {
      feed: feedCount,
      discovery: discoveryCount,
      boards: boardsCount,
      competitors: competitorsCount,
      total: matches.length,
    };
  }, [trimmed]);

  // Rows are computed up front (before keyboard effects + early return) so
  // keyboard handlers can address them by index even if trimmed === "".
  const rows: ScopeRow[] = useMemo(() => [
    {
      key: "feed",
      label: "My feeds",
      icon: Compass,
      count: counts.feed,
      isCurrent: currentScope === "feed",
      onSelect: () => {
        onApplyHere(query);
        onOpenChange(false);
      },
    },
    {
      key: "discovery",
      label: "Discovery",
      icon: Telescope,
      count: counts.discovery,
      isCurrent: currentScope === "discovery",
      onSelect: () => {
        navigate(`/insights/discover?search=${encodeURIComponent(query)}`);
        onOpenChange(false);
      },
    },
    {
      key: "boards",
      label: "Boards",
      icon: Bookmark,
      count: counts.boards,
      isCurrent: currentScope === "boards",
      onSelect: () => {
        navigate(`/insights/boards?search=${encodeURIComponent(query)}`);
        onOpenChange(false);
      },
    },
    {
      key: "competitors",
      label: "Competitors",
      icon: Eye,
      count: counts.competitors,
      isCurrent: currentScope === "competitors",
      onSelect: () => {
        navigate(`/insights/competitors?search=${encodeURIComponent(query)}`);
        onOpenChange(false);
      },
    },
    {
      key: "everywhere",
      label: "Search everywhere",
      icon: Globe,
      count: counts.total,
      onSelect: () => {
        navigate(`/insights-v2/search?q=${encodeURIComponent(query)}`);
        onOpenChange(false);
      },
    },
  ], [counts, currentScope, navigate, onApplyHere, onOpenChange, query]);

  // Reset active row whenever the popover (re)opens or rows change.
  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, rows.length]);

  // Keyboard nav — Escape closes, Arrow keys move highlight, Enter activates,
  // Tab falls through (default behavior exits the popover).
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % rows.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + rows.length) % rows.length);
        return;
      }
      if (e.key === "Enter") {
        // Only intercept Enter when the anchor input is focused — leaves
        // Enter inside other inputs / focused buttons alone.
        if (document.activeElement === anchorRef.current) {
          e.preventDefault();
          rows[activeIndex]?.onSelect();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange, rows, activeIndex, anchorRef]);

  // Mirror activeIndex onto the anchor input as aria-activedescendant so AT
  // announces the highlighted option even though focus stays in the input.
  useEffect(() => {
    if (!open) return;
    const input = anchorRef.current;
    if (!input) return;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", "insights-search-listbox");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-activedescendant", `scope-row-${activeIndex}`);
    return () => {
      input.removeAttribute("aria-activedescendant");
      input.setAttribute("aria-expanded", "false");
    };
  }, [open, activeIndex, anchorRef]);

  // Click outside (but not on anchor) to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange, anchorRef]);

  if (!open || trimmed.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="insights-search-listbox"
      role="listbox"
      aria-label="Search scope"
      className={cn(
        "absolute left-0 right-0 top-full z-30 mt-1",
        "rounded-md border border-border bg-popover text-popover-foreground shadow-md",
        "overflow-hidden",
      )}
    >
      <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-mono text-muted-foreground border-b border-border/60">
        Search <span className="text-foreground normal-case font-sans font-medium">&ldquo;{trimmed}&rdquo;</span> in&hellip;
      </div>
      <ul className="py-1">
        {rows.map((row, idx) => {
          const Icon = row.icon;
          const isActive = idx === activeIndex;
          const isLast = idx === rows.length - 1;
          return (
            <li
              key={row.key}
              id={`scope-row-${idx}`}
              role="option"
              aria-selected={isActive}
              className={cn(isLast && "mt-1 border-t border-border/60 pt-1")}
            >
              <button
                type="button"
                onClick={row.onSelect}
                onMouseEnter={() => setActiveIndex(idx)}
                tabIndex={-1}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                  "focus:outline-none",
                  isActive && "bg-muted",
                  !isActive && row.isCurrent && "bg-muted/60",
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {row.label}
                    {row.isCurrent && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                        this page
                      </span>
                    )}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {row.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
