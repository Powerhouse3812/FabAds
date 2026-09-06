import { Pencil, Download, Rocket, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CSVExportButton } from "./CSVExportButton";
import type { OutputData } from "../types/output";

/**
 * Slides in from top when 2+ output cards are selected. Same in Generate Results
 * and Library. Edit batch · Bulk download · Bulk launch · Bulk regenerate ·
 * Export CSV. Pushes content down (no overlay).
 *
 * "Add to folder" was dropped (Genie 2.0 §7 lists the "Folders" Other-Flow
 * module as Coming-soon, and Genie's own Library has no folder concept of
 * its own — only the separate Creative Library module has folders) — no
 * honest destination exists yet, so the button isn't offered rather than
 * left as a no-op. See EllipsisMenu.tsx for the same call on the per-card
 * menu.
 */

type Props = {
  selectedOutputs: OutputData[];
  onEditBatch?: () => void;
  onBulkDownload?: () => void;
  onBulkLaunch?: () => void;
  /**
   * Accepted for backward compatibility with existing callers outside this
   * agent's ownership (`studio-v4/screens/Step5Results.tsx` and
   * `Step5ResultsQueue.tsx` both still pass this) — but deliberately NOT
   * rendered as a button here. "Folders" is Coming-soon as an Other-Flow
   * module (§7) and Genie's Library has no folder concept of its own, so
   * there's no honest destination for it; see EllipsisMenu.tsx for the same
   * call on the per-card menu. Left in the type instead of deleting it so
   * this shared component doesn't break a file this agent doesn't own.
   */
  onAddToFolder?: () => void;
  onBulkRegenerate?: () => void;
  onClear: () => void;
  className?: string;
};

export function BulkToolbar({
  selectedOutputs,
  onEditBatch,
  onBulkDownload,
  onBulkLaunch,
  onBulkRegenerate,
  onClear,
  className,
}: Props) {
  if (selectedOutputs.length < 2) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-3",
        className
      )}
    >
      <span className="font-g6-mono text-g6-sm font-semibold text-g6-text">
        {selectedOutputs.length} selected
      </span>
      <div className="mx-2 h-5 w-px bg-g6-border-secondary" aria-hidden />

      <BulkBtn Icon={Pencil} label="Edit batch" onClick={onEditBatch} />
      <BulkBtn Icon={Download} label="Bulk download" onClick={onBulkDownload} />
      <BulkBtn Icon={Rocket} label="Bulk launch" onClick={onBulkLaunch} />
      <BulkBtn Icon={RefreshCw} label="Bulk regenerate" onClick={onBulkRegenerate} />
      <CSVExportButton outputs={selectedOutputs} filename="genie6-selection.csv" />

      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-g6-base px-2 font-g6-sans text-g6-sm text-g6-text-secondary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
      >
        <X className="h-3.5 w-3.5" /> Clear
      </button>
    </div>
  );
}

function BulkBtn({
  Icon,
  label,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-3 font-g6-sans text-g6-sm font-medium text-g6-text transition-colors hover:border-g6-border hover:bg-g6-bg-spotlight"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
