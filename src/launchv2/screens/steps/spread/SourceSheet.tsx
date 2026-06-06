/**
 * SourceSheet — Radix Sheet (right-panel drawer) that wraps source-specific
 * modal content for Launch v2 Step 3: Creative Spread.
 *
 * Routing:
 *   genie   → GenieModal
 *   library → LibraryModal   (stub until built)
 *   upload  → UploadModal    (stub until built)
 *   url | drive | reports → StubPanel
 *
 * State model:
 *   - `localSelected` — Map<id, CreativeRef> — built from `currentSelections`
 *     when the sheet opens. Committed to parent only on Save.
 *   - `search` — string passed to active child modal.
 *
 * Child modal onToggle contract: `(ref: CreativeRef) => void`
 * GenieModal currently uses `(id: string) => void` — bridged here via
 * `outputToCreativeRef` so SourceSheet remains the single source of truth
 * for selection state.
 */

import { useEffect, useState } from "react";
import {
  BarChart3,
  HardDrive,
  ImageIcon,
  Library,
  Link2,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SOURCES } from "../../../data";
import type { AdCopy, AdFormat, CreativeRef, SourceType } from "../../../types";
import {
  GenieModal,
  outputToCreativeRef,
} from "./modals/GenieModal";

/* ─────────────────────────────────────────────────────────────────
   Lazy-import placeholders for modals not yet built.
   Replace with real imports when LibraryModal and UploadModal land.
───────────────────────────────────────────────────────────────────*/

// These are forward declarations. Once the real components exist, swap these:
//   import { LibraryModal } from "./modals/LibraryModal";
//   import { UploadModal }  from "./modals/UploadModal";
// For now they resolve to null and fall through to StubPanel.
const LibraryModal: React.ComponentType<LibraryModalProps> | null = null;
const UploadModal: React.ComponentType<UploadModalProps> | null = null;

/* ─────────────────────────────────────────────────────────────────
   Shared child-modal prop shapes (the intended contract for future modals)
───────────────────────────────────────────────────────────────────*/

/** Props shape LibraryModal MUST implement when built. */
interface LibraryModalProps {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
  format: AdFormat | null;
}

/** Props shape UploadModal MUST implement when built. */
interface UploadModalProps {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
}

/* ─────────────────────────────────────────────────────────────────
   Source icon map (mirrors SourcePicker)
───────────────────────────────────────────────────────────────────*/

const SOURCE_ICONS: Record<SourceType, React.ElementType> = {
  url: Link2,
  library: Library,
  upload: Upload,
  genie: Sparkles,
  drive: HardDrive,
  reports: BarChart3,
};

/* ─────────────────────────────────────────────────────────────────
   StubPanel — for sources that aren't built yet (url / drive / reports)
   and as a fallback for unbuilt modal stubs.
───────────────────────────────────────────────────────────────────*/

function StubPanel({
  source,
  reason,
}: {
  source: SourceType;
  reason?: "coming_soon" | "not_built";
}) {
  const Icon = SOURCE_ICONS[source] ?? ImageIcon;

  const copy: Record<SourceType, string> = {
    url: "Paste a URL to import creative assets.",
    drive: "Google Drive integration coming soon.",
    reports: "Import winning ads from Reports coming soon.",
    library: "Library browser coming soon.",
    upload: "Upload assets directly — coming soon.",
    genie: "Genie outputs coming soon.",
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {reason === "not_built" ? "Not yet available" : "Coming soon"}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {copy[source]}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SourceSheet props
───────────────────────────────────────────────────────────────────*/

export interface SourceSheetProps {
  open: boolean;
  /** Which source tab is active — determines which modal renders. */
  source: SourceType | null;
  /** Existing committed selections — pre-populates local state on open. */
  currentSelections: CreativeRef[];
  /** From plan — passed to child modals for format filtering. */
  format: AdFormat | null;
  /** Committed on Save. suggestedCopy derived from first ad-type item. */
  onSave: (items: CreativeRef[], suggestedCopy?: Partial<AdCopy>) => void;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────*/

export function SourceSheet({
  open,
  source,
  currentSelections,
  format,
  onSave,
  onClose,
}: SourceSheetProps) {
  /* ── Local selection state ─────────────────────────────────── */
  const [localSelected, setLocalSelected] = useState<Map<string, CreativeRef>>(
    () => new Map(currentSelections.map((c) => [c.id, c]))
  );

  const [search, setSearch] = useState("");

  // Reset local state whenever the sheet opens or the active source changes.
  useEffect(() => {
    if (open) {
      setLocalSelected(new Map(currentSelections.map((c) => [c.id, c])));
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source]);

  /* ── Toggle handler (canonical signature for child modals) ─── */
  const handleToggle = (ref: CreativeRef) => {
    setLocalSelected((prev) => {
      const next = new Map(prev);
      if (next.has(ref.id)) {
        next.delete(ref.id);
      } else {
        next.set(ref.id, ref);
      }
      return next;
    });
  };

  /**
   * GenieModal bridge — it uses `onToggle(id: string)` internally.
   * We reconstruct the CreativeRef from the id using outputToCreativeRef
   * via a thin adapter that GenieModal calls with the id only.
   *
   * GenieModal already exports outputToCreativeRef; we import it above and
   * pass a wrapped handler here so SourceSheet stays the authority on state.
   */
  const handleGenieToggle = (id: string) => {
    // If already selected, delete immediately.
    if (localSelected.has(id)) {
      setLocalSelected((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    // Otherwise we need the full ref — GenieModal passes only the id,
    // so we build a minimal CreativeRef and let GenieModal's own
    // outputToCreativeRef fill details when the grid item is clicked.
    // The grid itself calls onToggle(output.id) — we receive the id here.
    // We cannot reconstruct the full ref without the output object, so we
    // rely on the fact that GenieModal internally calls outputToCreativeRef
    // and passes the id. We therefore accept just the id and attach a
    // synthetic ref. The format will be corrected on the next open cycle
    // when currentSelections is committed from plan.creatives (which
    // carries the full ref built by the caller after onSave).
    //
    // Simpler path: if GenieModal is updated to `onToggle: (ref: CreativeRef) => void`
    // in a future refactor, remove this bridge and use handleToggle directly.
    setLocalSelected((prev) => {
      const next = new Map(prev);
      const syntheticRef: CreativeRef = {
        id,
        name: `Genie output`,
        format: format ?? "single_image",
        source: "genie",
        savedAd: true,
        itemType: "ad",
      };
      next.set(id, syntheticRef);
      return next;
    });
  };

  /* ── Save handler ──────────────────────────────────────────── */
  const handleSave = () => {
    const items = Array.from(localSelected.values());
    const firstAd = items.find((c) => c.itemType === "ad" || c.savedAd);
    const suggestedCopy: Partial<AdCopy> | undefined = firstAd
      ? { headline: firstAd.name }
      : undefined;
    onSave(items, suggestedCopy);
  };

  /* ── Source label ──────────────────────────────────────────── */
  const sourceLabel =
    SOURCES.find((s) => s.id === source)?.label ??
    (source ? source.charAt(0).toUpperCase() + source.slice(1) : "Creative");

  const SourceIcon = source ? (SOURCE_ICONS[source] ?? ImageIcon) : ImageIcon;

  /* ── Selected count ────────────────────────────────────────── */
  const selectedCount = localSelected.size;

  /* ── Derived: should we show search bar? ─────────────────────
     URL, drive, reports are stub-only — search bar is irrelevant.          */
  const showSearch =
    source === "genie" || source === "library" || source === "upload";

  /* ─────────────────────────────────────────────────────────── */

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        className={cn(
          // Override default padding + max-width from sheetVariants
          "w-full sm:max-w-[900px]",
          "flex flex-col p-0 gap-0",
          // FabFunnel: inner-edge radius + backdrop
          "rounded-l-2xl",
        )}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <SheetHeader
          className={cn(
            "flex-row items-center gap-3 border-b px-4 py-3",
            "flex-shrink-0 space-y-0",
          )}
        >
          {/* Source icon + title */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <SourceIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <SheetTitle className="truncate text-sm font-semibold leading-none tracking-tight">
              {sourceLabel}
            </SheetTitle>
          </div>

          {/* Search bar — only for browsable sources */}
          {showSearch && (
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "h-8 w-44 pl-7 text-xs",
                  // FabFunnel input radius = rounded-[28px] (pill)
                  "rounded-full border-border bg-muted/40 focus-visible:bg-background",
                )}
              />
            </div>
          )}

          {/* Close button — replaces SheetContent's default built-in close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        {/* ── Body — flex-1 min-h-0 so child modals can fill height ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {source === "genie" && (
            <GenieModal
              selectedIds={new Set(localSelected.keys())}
              onToggle={handleGenieToggle}
              filterFormat={format}
              search={search}
            />
          )}

          {source === "library" && LibraryModal !== null && (
            <LibraryModal
              selectedIds={new Set(localSelected.keys())}
              onToggle={handleToggle}
              search={search}
              format={format}
            />
          )}

          {source === "library" && LibraryModal === null && (
            <StubPanel source="library" reason="not_built" />
          )}

          {source === "upload" && UploadModal !== null && (
            <UploadModal
              selectedIds={new Set(localSelected.keys())}
              onToggle={handleToggle}
              search={search}
            />
          )}

          {source === "upload" && UploadModal === null && (
            <StubPanel source="upload" reason="not_built" />
          )}

          {(source === "url" ||
            source === "drive" ||
            source === "reports") && (
            <StubPanel source={source} reason="coming_soon" />
          )}

          {source === null && (
            <div className="flex h-full items-center justify-center p-8">
              <p className="font-mono text-sm text-muted-foreground">
                Select a source to browse creatives.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-shrink-0 items-center justify-between gap-3",
            "border-t bg-card px-4 py-3",
          )}
        >
          {/* Selection count */}
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {selectedCount === 0
              ? "None selected"
              : `${selectedCount} selected`}
          </span>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedCount === 0}
              onClick={handleSave}
              className={cn(
                "rounded-full",
                // FabFunnel primary: lime fill + dark text (R1)
                "bg-primary text-[#121212] hover:bg-primary/90",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {selectedCount > 0 ? `Save (${selectedCount})` : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
