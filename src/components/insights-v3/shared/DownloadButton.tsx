import { Download } from "lucide-react";
import { toast } from "sonner";
import { normalizeDownloads, triggerDownloads, type DownloadBuild } from "./download";
import { cn } from "@/lib/utils";
import { Hint } from "./Hint";

export interface DownloadButtonProps {
  /**
   * Built lazily on click: the data layer's `buildDownload(ref)` (one file or null)
   * or `buildDownloads(ref)` (several, e.g. media + text). May throw.
   * An array downloads each file in sequence; null / empty → error toast.
   */
  build: () => DownloadBuild;
  /** With a label the button shows text; without, it's an icon button. */
  label?: string;
  /** Accessible name when icon-only. Default "Download". */
  ariaLabel?: string;
  variant?: "icon" | "button";
  disabled?: boolean;
  /** Tooltip explaining why it is disabled. */
  disabledReason?: string;
  className?: string;
}

export function DownloadButton({
  build,
  label,
  ariaLabel = "Download",
  variant,
  disabled,
  disabledReason,
  className,
}: DownloadButtonProps) {
  const asButton = (variant ?? (label ? "button" : "icon")) === "button";

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // lives inside clickable cards / rows
    if (disabled) return;
    try {
      const files = normalizeDownloads(build());
      if (files.length === 0) {
        toast.error("Nothing to download for this item");
        return;
      }
      void triggerDownloads(files);
      toast.success(files.length === 1 ? `Downloaded ${files[0].filename}` : `Downloading ${files.length} files`);
    } catch {
      toast.error("Couldn't prepare that download. Try again.");
    }
  };

  const btn = (
    <button
      type="button"
      aria-label={asButton && label ? undefined : label ?? ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground transition-colors",
        "hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        asButton ? "px-3" : "w-8",
        disabled && "cursor-not-allowed opacity-50 hover:border-border hover:bg-card hover:text-muted-foreground",
        className,
      )}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {asButton && label}
    </button>
  );

  return <Hint content={disabled ? disabledReason : asButton ? undefined : label ?? ariaLabel}>{btn}</Hint>;
}
