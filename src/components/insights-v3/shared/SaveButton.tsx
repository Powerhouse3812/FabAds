import { Bookmark } from "lucide-react";
import { SAVABLE_LABEL, type SavedItemRef } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Hint } from "./Hint";
import { fmtInt } from "./format";
import { useSaveModal } from "./url";

export interface SaveButtonProps {
  target: SavedItemRef;
  /** Number of boards this item is on. > 0 → filled state + count. */
  savedCount?: number;
  /** Force the filled state (e.g. an ad in Saved Ads but on no board). Defaults to savedCount > 0. */
  saved?: boolean;
  variant: "icon" | "button";
  className?: string;
}

/** Opens the (separately built) save modal via the URL (`modal=save&target=…`). */
export function SaveButton({ target, savedCount = 0, saved: savedProp, variant, className }: SaveButtonProps) {
  const { open } = useSaveModal();
  const saved = savedProp ?? savedCount > 0;
  const what = SAVABLE_LABEL[target.type].toLowerCase();
  const boardsText = `${savedCount} ${savedCount === 1 ? "board" : "boards"}`;
  const label = saved
    ? savedCount > 0
      ? `Saved to ${boardsText}. Manage boards for this ${what}`
      : `Saved. Add this ${what} to a board`
    : `Save this ${what} to a board`;

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // lives inside clickable cards / rows
    open(target);
  };

  const icon = (
    <Bookmark
      className={cn("h-4 w-4", saved && "fill-current")}
      aria-hidden="true"
    />
  );

  if (variant === "icon") {
    return (
      <Hint content={saved ? (savedCount > 0 ? `Saved · ${boardsText}` : "Saved · add to a board") : "Save to board"}>
        <button
          type="button"
          aria-label={label}
          aria-pressed={saved}
          onClick={onClick}
          className={cn(
            "relative inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border px-1.5 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            saved
              ? "border-primary/40 bg-primary/15 text-primary-text hover:bg-primary/25"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
            className,
          )}
        >
          {icon}
          {saved && savedCount > 0 && <span className="font-mono text-[11px] tabular-nums">{fmtInt(savedCount)}</span>}
        </button>
      </Hint>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={saved}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        saved
          ? "border-primary/40 bg-primary/15 text-primary-text hover:bg-primary/25"
          : "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {icon}
      {saved ? (
        <>
          Saved {savedCount > 0 && <span className="font-mono text-xs tabular-nums">· {fmtInt(savedCount)}</span>}
        </>
      ) : (
        "Save"
      )}
    </button>
  );
}
