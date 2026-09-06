import { Copy, Download, Archive, Trash2, Wand2, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * §9 "Bulk select with bulk actions" + §21.2 "Multi-select and bulk behave
 * IDENTICALLY everywhere." One bar, mounted wherever 2+ assets are
 * selected — same shape whether that's Products, Scripts, or any other
 * type. Visual pattern follows `src/genie6/components/BulkToolbar.tsx`
 * (read for reference) but rebuilt on shadcn semantic tokens per the
 * Catalogue file's existing token idiom, not g6-* tokens.
 *
 * `bulkProductNotice` is §9's "Bulk product selection" rule made visible:
 * "Selecting N products produces ONE ad containing all of them — not N
 * separate ads." Only Products/Categories pass it; every other type
 * leaves it unset and gets the plain bar.
 */
interface CatalogueBulkBarProps {
  count: number;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onUseInGenie?: () => void;
  useInGenieLabel?: string;
  bulkProductNotice?: string;
  onClear: () => void;
  className?: string;
}

export function CatalogueBulkBar({
  count,
  onDuplicate,
  onArchive,
  onDelete,
  onDownload,
  onUseInGenie,
  useInGenieLabel = "Use in Genie",
  bulkProductNotice,
  onClear,
  className,
}: CatalogueBulkBarProps) {
  if (count < 2) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-muted/40 p-3", className)}>
      {bulkProductNotice && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>{bulkProductNotice}</span>
        </div>
      )}
      <div role="toolbar" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-foreground tabular-nums">{count} selected</span>
        <div className="mx-1 h-5 w-px bg-border" aria-hidden />

        {onUseInGenie && (
          <BulkBtn Icon={Wand2} label={useInGenieLabel} onClick={onUseInGenie} primary />
        )}
        {onDuplicate && <BulkBtn Icon={Copy} label="Duplicate" onClick={onDuplicate} />}
        {onDownload && <BulkBtn Icon={Download} label="Download" onClick={onDownload} />}
        {onArchive && <BulkBtn Icon={Archive} label="Archive" onClick={onArchive} />}
        {onDelete && <BulkBtn Icon={Trash2} label="Delete" onClick={onDelete} destructive />}

        <button
          type="button"
          onClick={onClear}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}

function BulkBtn({
  Icon,
  label,
  onClick,
  primary,
  destructive,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  primary?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        primary
          ? "border-transparent bg-primary text-primary-foreground hover:scale-[1.02]"
          : destructive
            ? "border-destructive/30 bg-background text-destructive hover:bg-destructive/10"
            : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
