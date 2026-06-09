/**
 * SourceSheet — Radix Sheet (right-panel drawer) that wraps source-specific
 * modal content for Launch v2 Step 3: Creative Spread.
 *
 * Routing:
 *   genie   → GenieModal
 *   library → LibraryModal
 *   upload  → UploadModal    (stub until built)
 *   url | drive | reports → StubPanel
 *
 * State model:
 *   - `activeSource` — internal source state; defaults to prop or "genie".
 *     Switching pills changes the view without closing the sheet.
 *   - `localSelected` — Map<id, CreativeRef> — built from `currentSelections`
 *     when the sheet opens. Committed to parent only on Save.
 *   - `search` — string passed to active child modal.
 *
 * Child modal onToggle contract: `(ref: CreativeRef) => void`
 * All modals (GenieModal, LibraryModal) now use this signature directly.
 */

import { useEffect, useState } from "react";
import {
  BarChart3,
  FolderOpen,
  Hash,
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
import type { AdCopy, CreativeRef, SourceType } from "../../../types";
import { GenieModal } from "./modals/GenieModal";
import { LibraryModal } from "./modals/LibraryModal";
import { FolderPicker, type FolderApplyResult } from "./modals/FolderPicker";

/* ─────────────────────────────────────────────────────────────────
   Placeholder for modals not yet built.
───────────────────────────────────────────────────────────────────*/

/** Props shape UploadModal MUST implement when built. */
interface UploadModalProps {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
}

// Replace with real import when UploadModal lands.
const UploadModal: React.ComponentType<UploadModalProps> | null = null;

/* ─────────────────────────────────────────────────────────────────
   Source icon map
───────────────────────────────────────────────────────────────────*/

const SOURCE_ICONS: Record<SourceType, React.ElementType> = {
  url: Link2,
  library: Library,
  upload: Upload,
  genie: Sparkles,
  drive: HardDrive,
  reports: BarChart3,
  post_id: Hash,
  folder: FolderOpen,
};

/** Sources that are stubs (no modal content yet) */
const STUB_SOURCES = new Set<SourceType>(["url", "drive", "reports", "post_id"]);

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
    post_id: "Paste a Post ID to import an existing Facebook post as a creative.",
    folder: "Browse and import from a saved creative folder.",
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
  /** Controls which modal is shown by default: "ads" → genie, "media" → library. */
  creativeMode?: "ads" | "media";
  /** Committed on Save. suggestedCopy derived from first ad-type item. */
  onSave: (items: CreativeRef[], suggestedCopy?: Partial<AdCopy>) => void;
  /**
   * Optional: called when the user applies a Creative Library folder.
   * Caller receives the same media + suggestedCopy contract as `onSave`,
   * PLUS folder identity — used to surface the "Save copy to folder"
   * graduation affordance after apply. If omitted, folder apply falls
   * back to `onSave`.
   */
  onApplyFolder?: (result: FolderApplyResult) => void;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────*/

export function SourceSheet({
  open,
  source,
  currentSelections,
  creativeMode,
  onSave,
  onApplyFolder,
  onClose,
}: SourceSheetProps) {
  /* ── Internal source state — drives which modal renders ──── */
  const [activeSource, setActiveSource] = useState<SourceType>(
    () => source ?? (creativeMode === "media" ? "library" : "genie")
  );

  // Sync when the prop changes (e.g. parent explicitly sets a source).
  useEffect(() => {
    if (source) setActiveSource(source);
  }, [source]);

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

  /* ── Save handler ──────────────────────────────────────────── */
  const handleSave = () => {
    const items = Array.from(localSelected.values());
    const firstAd = items.find((r) => r.itemType === "ad" || r.savedAd);
    const suggestedCopy: Partial<AdCopy> | undefined = firstAd
      ? { headline: firstAd.name, primaryText: "" }
      : undefined;
    onSave(items, suggestedCopy);
  };

  /* ── Source label ──────────────────────────────────────────── */
  const sourceLabel =
    SOURCES.find((s) => s.id === activeSource)?.label ??
    activeSource.charAt(0).toUpperCase() + activeSource.slice(1);

  const SourceIcon = SOURCE_ICONS[activeSource] ?? ImageIcon;

  /* ── Selected count ────────────────────────────────────────── */
  const selectedCount = localSelected.size;

  /* ── Derived: should we show search bar? ─────────────────────
     URL, drive, reports are stub-only — search bar is irrelevant.          */
  const showSearch = !STUB_SOURCES.has(activeSource);

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
            "border-b px-4 pt-3 pb-2",
            "flex-shrink-0 space-y-0",
          )}
        >
          {/* Top row: icon + title + search + close */}
          <div className="flex items-center gap-3">
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
                    "rounded-full border-border bg-muted/40 focus-visible:bg-background",
                  )}
                />
              </div>
            )}

            {/* Close button */}
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
          </div>

          {/* Source selector pills */}
          <div className="flex flex-wrap gap-1 mt-2">
            {SOURCES.map((s) => {
              const Icon = SOURCE_ICONS[s.id] ?? ImageIcon;
              const active = activeSource === s.id;
              const stub = STUB_SOURCES.has(s.id) || (s.id === "upload");
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSource(s.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : stub
                        ? "border-border/50 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        {/* ── Body — flex-1 min-h-0 so child modals can fill height ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeSource === "genie" && (
            <GenieModal
              selectedIds={new Set(localSelected.keys())}
              onToggle={handleToggle}
              search={search}
            />
          )}

          {activeSource === "library" && (
            <LibraryModal
              selectedIds={new Set(localSelected.keys())}
              onToggle={handleToggle}
              search={search}
            />
          )}

          {activeSource === "folder" && (
            <FolderPicker
              search={search}
              onApply={(result: FolderApplyResult) => {
                // Folder apply is single-shot: commits creatives + (optional) copy
                // and closes the sheet immediately. If the caller wants folder
                // identity (e.g. for the "Save copy to folder" graduation
                // affordance) it provides `onApplyFolder`; otherwise we fall
                // back to the generic `onSave` channel.
                if (onApplyFolder) {
                  onApplyFolder(result);
                } else {
                  onSave(result.creatives, result.suggestedCopy);
                }
              }}
            />
          )}

          {activeSource === "upload" && UploadModal !== null && (
            <UploadModal
              selectedIds={new Set(localSelected.keys())}
              onToggle={handleToggle}
              search={search}
            />
          )}

          {activeSource === "upload" && UploadModal === null && (
            <StubPanel source="upload" reason="not_built" />
          )}

          {STUB_SOURCES.has(activeSource) && (
            <StubPanel source={activeSource} reason="coming_soon" />
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        {/* Folder source applies in a single click per card — no batch save. */}
        {activeSource !== "folder" && (
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
        )}
        {activeSource === "folder" && (
          <div
            className={cn(
              "flex flex-shrink-0 items-center justify-between gap-3",
              "border-t bg-card px-4 py-3",
            )}
          >
            <span className="font-mono text-xs text-muted-foreground">
              Apply a folder to pre-fill creatives across all ads.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
