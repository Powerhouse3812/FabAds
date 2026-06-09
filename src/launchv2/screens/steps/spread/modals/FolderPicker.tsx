/**
 * FolderPicker — body-only component for the "folder" creative source.
 *
 * Browses Creative Library folders and surfaces each as a *Creative Bundle*:
 *   ● bundle_ready — folder has media AND a defaultCopy
 *   ◐ media_only   — folder has media but no defaultCopy
 *   ○ empty        — folder has neither
 *
 * Clicking "Apply" on a folder pre-fills BOTH the ad-creative media list AND
 * (when present) the shared ad-copy block across all ads in the plan. The
 * picker is single-shot per folder — committing closes the sheet.
 *
 * Data source (v1, mock):
 *   - Folders come from LIBRARY_FOLDERS / LIBRARY_MEDIA (mocks/shared).
 *   - defaultCopy comes from bundlesService (localStorage).
 *
 * When this moves to Supabase, swap the LIBRARY_* imports for the ClFolder
 * hook and keep the bundlesService API identical.
 */

import { useMemo, useState } from "react";
import { Check, Circle, CircleDashed, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LIBRARY_FOLDERS,
  LIBRARY_MEDIA,
  type LibraryAsset,
} from "@/mocks/shared/library-items";
import type { AdCopy, CreativeRef } from "../../../../types";
import type {
  CreativeBundleFolder,
  CreativeBundleStatus,
} from "../../../../templates/types";
import { bundlesService } from "../../../../templates/bundles";
import { assetToCreativeRef } from "./LibraryModal";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface FolderApplyResult {
  /** All media items from the folder, as CreativeRefs (ready for plan.creatives). */
  creatives: CreativeRef[];
  /**
   * Suggested ad-copy override — present only when the folder is a graduated
   * bundle (`status === 'bundle_ready'`). Caller spreads into plan.adCopy.
   */
  suggestedCopy?: Partial<AdCopy>;
  /** Folder id — propagated for telemetry / future linking. */
  folderId: string;
  /** Folder name — for the post-apply toast / breadcrumb. */
  folderName: string;
}

interface FolderPickerProps {
  search: string;
  /** Called when the user clicks "Apply" on a folder card. */
  onApply: (result: FolderApplyResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status dot — lime filled / lime outline / muted outline
// ─────────────────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: CreativeBundleStatus }) {
  if (status === "bundle_ready") {
    return (
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full bg-primary"
      />
    );
  }
  if (status === "media_only") {
    return (
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full border border-primary bg-transparent"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 rounded-full border border-muted-foreground/40 bg-transparent"
    />
  );
}

const STATUS_LABEL: Record<CreativeBundleStatus, string> = {
  bundle_ready: "Bundle ready",
  media_only: "Media only",
  empty: "Empty",
};

const STATUS_SUB: Record<CreativeBundleStatus, string> = {
  bundle_ready: "Media + text",
  media_only: "Add copy to graduate",
  empty: "—",
};

// ─────────────────────────────────────────────────────────────────────────────
// Build the per-folder view-model — media count + bundle status
// ─────────────────────────────────────────────────────────────────────────────

interface FolderRow extends CreativeBundleFolder {
  /** Concrete media items in this folder — kept here so Apply doesn't re-scan. */
  items: LibraryAsset[];
}

function buildFolderRows(): FolderRow[] {
  // Group media by folder_id (LIBRARY_FOLDERS only includes ids that appear in MEDIA).
  const byFolder = new Map<string, LibraryAsset[]>();
  for (const m of LIBRARY_MEDIA) {
    if (!m.folder_id) continue;
    const arr = byFolder.get(m.folder_id) ?? [];
    arr.push(m);
    byFolder.set(m.folder_id, arr);
  }

  return LIBRARY_FOLDERS.map((f) => {
    const items = byFolder.get(f.id) ?? [];
    const vm = bundlesService.toBundleFolder({
      id: f.id,
      name: f.name,
      mediaCount: items.length,
    });
    return { ...vm, items };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function FolderPicker({ search, onApply }: FolderPickerProps) {
  /**
   * Rebuild rows on each render — cheap (≤ a few dozen folders in the mock).
   * `tick` bumps on local writes (e.g. "Save as bundle" inside the picker)
   * to refresh derived status without a full remount.
   */
  const [tick, setTick] = useState(0);

  const rows = useMemo(() => {
    void tick;
    return buildFolderRows();
  }, [tick]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const handleApply = (row: FolderRow) => {
    const creatives: CreativeRef[] = row.items.map(assetToCreativeRef);
    const suggested: Partial<AdCopy> | undefined =
      row.status === "bundle_ready" && row.defaultCopy
        ? {
            primaryText: row.defaultCopy.primaryText,
            headline: row.defaultCopy.headline,
            description: row.defaultCopy.description,
            ...(row.defaultCopy.utmTemplate
              ? { utmTemplate: row.defaultCopy.utmTemplate }
              : {}),
            ...(row.defaultCopy.textVariations
              ? { textVariations: row.defaultCopy.textVariations }
              : {}),
          }
        : undefined;
    onApply({
      creatives,
      suggestedCopy: suggested,
      folderId: row.id,
      folderName: row.name,
    });
  };

  if (filtered.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <CircleDashed className="h-5 w-5 text-muted-foreground" />
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
          {rows.length === 0 ? "No folders yet" : "No folders matched"}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/60">
          {rows.length === 0
            ? "Create a folder in the Creative Library to see it here."
            : "Try a different search term"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
      {filtered.map((row) => (
        <FolderCard key={row.id} row={row} onApply={handleApply} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Folder card
// ─────────────────────────────────────────────────────────────────────────────

function FolderCard({
  row,
  onApply,
}: {
  row: FolderRow;
  onApply: (row: FolderRow) => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border bg-card p-4",
        "transition-all duration-[220ms] hover:-translate-y-[2px] hover:shadow-md",
        row.status === "bundle_ready"
          ? "border-primary/40 hover:border-primary/60"
          : "border-border hover:border-border/80",
      )}
    >
      {/* Header: folder icon + name */}
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            row.status === "bundle_ready"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <FolderOpen className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-medium text-foreground leading-snug truncate capitalize"
            title={row.name}
          >
            {row.name}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {row.mediaCount} {row.mediaCount === 1 ? "creative" : "creatives"}
          </p>
        </div>
      </div>

      {/* Status row: dot + label + sub */}
      <div className="flex items-center gap-2">
        <StatusDot status={row.status} />
        <span className="text-xs text-muted-foreground">
          {STATUS_LABEL[row.status]}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/70">
          {STATUS_SUB[row.status]}
        </span>
      </div>

      {/* Apply button */}
      <Button
        type="button"
        size="sm"
        variant={row.status === "bundle_ready" ? "default" : "outline"}
        disabled={row.mediaCount === 0}
        onClick={() => onApply(row)}
        className={cn(
          "rounded-full text-xs",
          row.status === "bundle_ready" &&
            "bg-primary text-[#121212] hover:bg-primary/90",
        )}
      >
        {row.status === "bundle_ready" ? (
          <>
            <Check className="mr-1 h-3 w-3" />
            Apply bundle
          </>
        ) : (
          <>
            <Circle className="mr-1 h-3 w-3" />
            Apply media
          </>
        )}
      </Button>
    </div>
  );
}
