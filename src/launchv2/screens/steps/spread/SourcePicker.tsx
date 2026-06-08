/**
 * SourcePicker — 6 source-option tiles for Creative Spread (Step 3).
 *
 * Clicking a tile calls onSelect to let the parent open the Sheet. When the
 * user switches to a DIFFERENT source while creatives are already selected, an
 * inline amber warning bar slides in below the grid asking for confirmation
 * before clearing the selection. Drive and Reports tiles are stubs (opacity-60,
 * cursor-not-allowed) but still callable — the Sheet will show a stub view.
 */
import { useState } from "react";
import { BarChart3, FolderOpen, HardDrive, Hash, Library, Link2, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SOURCES } from "../../../data";
import type { SourceType } from "../../../types";

/* ---- icon map ---- */
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

/** Tiles that are available as stubs only — they still open the sheet. */
const STUB_SOURCES: SourceType[] = ["drive", "reports"];

/* ---- props ---- */
export interface SourcePickerProps {
  /** The currently active source (controls active ring). */
  selectedSource: SourceType | null;
  /** True when plan.creatives.length > 0 — triggers switch confirmation. */
  hasSelections: boolean;
  /** Called when a source is confirmed. Parent is responsible for opening the Sheet. */
  onSelect: (s: SourceType) => void;
}

export default function SourcePicker({
  selectedSource,
  hasSelections,
  onSelect,
}: SourcePickerProps) {
  const [pendingSource, setPendingSource] = useState<SourceType | null>(null);

  function handleTileClick(id: SourceType) {
    if (id === selectedSource) {
      // Same tile — re-open sheet immediately, no confirmation
      onSelect(id);
      return;
    }

    if (hasSelections) {
      // Different source + existing selections → ask for confirmation
      setPendingSource(id);
      return;
    }

    // No existing selections — switch immediately
    onSelect(id);
  }

  function handleCancel() {
    setPendingSource(null);
  }

  function handleClearAndSwitch() {
    if (!pendingSource) return;
    onSelect(pendingSource);
    setPendingSource(null);
  }

  return (
    <div className="space-y-2">
      {/* Tile grid: 3 cols on mobile, 6 on sm+ */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SOURCES.map(({ id, label }) => {
          const Icon = SOURCE_ICONS[id];
          const isActive = selectedSource === id;
          const isStub = STUB_SOURCES.includes(id);

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTileClick(id)}
              aria-pressed={isActive}
              aria-label={label}
              className={cn(
                // Base
                "flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3 px-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                // Active
                isActive
                  ? "border-primary bg-primary/5 text-foreground"
                  : [
                      "border-border text-muted-foreground",
                      !isStub && "hover:border-foreground/30 hover:text-foreground",
                    ],
                // Stub
                isStub && "cursor-not-allowed opacity-60",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Inline switch-confirmation bar */}
      {pendingSource && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border p-3",
            "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20",
          )}
          role="alert"
        >
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Switching source will clear your selected items.
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-7 rounded-full px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAndSwitch}
              className="h-7 rounded-full px-3 text-xs"
            >
              Clear &amp; switch
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
