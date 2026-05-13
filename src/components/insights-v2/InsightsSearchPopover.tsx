import { useEffect, useMemo, useRef } from "react";
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

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

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

  const rows: ScopeRow[] = [
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
  ];

  return (
    <div
      ref={containerRef}
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
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.key}>
              <button
                type="button"
                onClick={row.onSelect}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted focus:bg-muted focus:outline-none",
                  row.isCurrent && "bg-muted/60",
                )}
                role="option"
                aria-selected={row.isCurrent}
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
      <div className="border-t border-border/60">
        <button
          type="button"
          onClick={() => {
            navigate(`/insights-v2/search?q=${encodeURIComponent(query)}`);
            onOpenChange(false);
          }}
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
            "hover:bg-muted focus:bg-muted focus:outline-none",
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Search everywhere</span>
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {counts.total}
          </span>
        </button>
      </div>
    </div>
  );
}
