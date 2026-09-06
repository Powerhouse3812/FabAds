/**
 * "Made in Genie" badge (§7.3) — provenance, not promotion. Mono uppercase
 * pill, ~10% alpha lime fill + ~30% alpha border, Wand2 icon. Clicking it
 * opens the original generation (prompt / angle / reference) via the
 * existing Ad Detail drawer in Genie's Library — `?ad=<outputId>` is the
 * param that drawer already reads (see AdDetailDrawerContent.tsx), so this
 * badge deliberately does not build any new detail view.
 */
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface MadeInGenieBadgeProps {
  /** Joins to `sample-outputs.ts`'s `OutputData.id` via `?ad=`. */
  outputId: string;
  className?: string;
}

export function MadeInGenieBadge({ outputId, className }: MadeInGenieBadgeProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={(e) => {
        // Rows this sits inside are themselves click targets (opens the
        // report's own detail drawer) — this badge's click must win.
        e.stopPropagation();
        navigate(`/iq/genie6/library?ad=${encodeURIComponent(outputId)}`);
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border",
        "border-primary/30 bg-primary/10 px-1.5 py-0.5",
        "font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-foreground/80",
        "transition-colors hover:bg-primary/15 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      title="Made in Genie — open the original generation"
      aria-label="Made in Genie — open the original generation"
    >
      <Wand2 className="h-2.5 w-2.5" aria-hidden="true" />
      Made in Genie
    </button>
  );
}
