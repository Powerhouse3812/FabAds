import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  X,
  Wand2,
  Lightbulb,
  Building2,
  Camera,
  Video,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PickerColumn } from "@/genie6/generate-v3/components/PickerColumn";
import { PinterestPanel, type PinterestPanelProps } from "./PinterestPanel";
import { ANGLES } from "./AnglePicker";
import type { PinterestPin } from "@/genie6/generate-v3/mocks/pinterest";

/**
 * PinterestColumnDrawer — A-11.25.
 *
 * Per Maalik's wireframe: a side column with [Pinterest] title + search
 * bar + REMOVABLE filter chips (auto-applied from form) + a masonry grid
 * of Pinterest-style pin cards (image + caption below) + Cancel/Confirm
 * footer.
 *
 * Snapshots the parent's selected pins on open so Cancel can revert.
 * Confirm just closes (selections already persist live).
 */

type FilterKey = "format" | "brand" | "concepts" | `angle-${string}`;

export interface PinterestColumnDrawerProps {
  open: boolean;
  onClose: () => void;
  query: PinterestPanelProps["query"];
  /** Currently selected pins (parent state). */
  selected: PinterestPin[];
  /** Toggles a pin in the parent state. */
  onToggleSelect: (pin: PinterestPin) => void;
  /**
   * Replace the parent's full selection (used by Cancel to revert to
   * pre-open snapshot).
   */
  onReplaceSelection: (next: PinterestPin[]) => void;
  /** Optional brand name string for the bias chip. */
  brandName?: string | null;
  /** Optional concept count for the bias chip. */
  conceptCount?: number;
}

export function PinterestColumnDrawer({
  open,
  onClose,
  query,
  selected,
  onToggleSelect,
  onReplaceSelection,
  brandName,
  conceptCount = 0,
}: PinterestColumnDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Filters that the user has explicitly removed for this session.
  const [droppedFilters, setDroppedFilters] = useState<Set<FilterKey>>(new Set());
  // Snapshot of selection on open so Cancel can revert.
  const [snapshot, setSnapshot] = useState<PinterestPin[]>([]);

  // Reset session state on every open
  useEffect(() => {
    if (open) {
      setDroppedFilters(new Set());
      setSearchQuery("");
      setSnapshot(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Effective query — strip dropped filter signals
  const effectiveQuery = useMemo(() => {
    return {
      output: droppedFilters.has("format") ? ("image" as const) : query.output,
      productId: query.productId,
      brandId: droppedFilters.has("brand") ? null : query.brandId,
      angleIds: query.angleIds.filter(
        (id) => !droppedFilters.has(`angle-${id}` as FilterKey),
      ),
      conceptIds: droppedFilters.has("concepts") ? [] : query.conceptIds,
    };
  }, [query, droppedFilters]);

  const filterChips = useMemo(() => {
    const chips: { key: FilterKey; label: string; icon: typeof Camera }[] = [];
    if (!droppedFilters.has("format")) {
      chips.push({
        key: "format",
        label: query.output === "video" ? "Video" : "Image",
        icon: query.output === "video" ? Video : Camera,
      });
    }
    if (!droppedFilters.has("brand") && brandName) {
      chips.push({ key: "brand", label: brandName, icon: Building2 });
    }
    query.angleIds.forEach((aid) => {
      const k = `angle-${aid}` as FilterKey;
      if (droppedFilters.has(k)) return;
      const a = ANGLES.find((x) => x.id === aid);
      if (a) chips.push({ key: k, label: a.label, icon: Wand2 });
    });
    if (!droppedFilters.has("concepts") && conceptCount > 0) {
      chips.push({
        key: "concepts",
        label: `${conceptCount} concept${conceptCount === 1 ? "" : "s"}`,
        icon: Lightbulb,
      });
    }
    return chips;
  }, [
    query.output,
    query.angleIds,
    brandName,
    conceptCount,
    droppedFilters,
  ]);

  const dropFilter = (key: FilterKey) =>
    setDroppedFilters((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

  const onCancel = () => {
    onReplaceSelection(snapshot);
    onClose();
  };

  const dirty = useMemo(() => {
    if (selected.length !== snapshot.length) return true;
    const snapIds = new Set(snapshot.map((p) => p.id));
    return selected.some((p) => !snapIds.has(p.id));
  }, [selected, snapshot]);

  return (
    <PickerColumn
      open={open}
      onClose={onCancel}
      icon={Sparkles}
      title="Pinterest"
      sub={
        selected.length > 0
          ? `${selected.length} pin${selected.length === 1 ? "" : "s"} attached`
          : "Auto-fetched references · click pins to attach"
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground",
              "hover:text-foreground hover:border-foreground/30 transition-colors",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground",
              "hover:opacity-90 transition-opacity",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            )}
          >
            <Check className="h-3 w-3" />
            {dirty ? "Confirm" : "Done"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Search bar */}
        <div className="inline-flex h-9 w-full items-center rounded-md border border-border bg-card overflow-hidden">
          <div className="shrink-0 flex h-9 w-9 items-center justify-center text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pins…"
            aria-label="Search Pinterest pins"
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full pr-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="shrink-0 flex h-9 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Removable filter chips */}
        {filterChips.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Auto-applied filters · click X to remove
            </p>
            <div className="flex flex-wrap gap-1">
              {filterChips.map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <span
                    key={chip.key}
                    className="group inline-flex items-center gap-1 rounded-full bg-primary/10 pl-2 pr-1 py-0.5 text-[10px] text-foreground"
                  >
                    <ChipIcon className="h-2.5 w-2.5 text-primary" />
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={() => dropFilter(chip.key)}
                      aria-label={`Remove filter: ${chip.label}`}
                      className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/20 hover:text-foreground transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Pin grid */}
        <PinterestPanel
          query={effectiveQuery}
          selectedIds={selected.map((p) => p.id)}
          onToggleSelect={onToggleSelect}
          searchQuery={searchQuery.trim() || undefined}
        />
      </div>
    </PickerColumn>
  );
}
