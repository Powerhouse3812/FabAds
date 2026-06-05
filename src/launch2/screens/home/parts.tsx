/**
 * Home hub — shared presentational parts.
 *
 * Small, dumb building blocks used only by Launch2Home: a section header with
 * the FabFunnel lime accent bar, the inferred "[I] Est." provenance tag, a thin
 * cap meter, and a composed empty-state. Keeping them here keeps the screen file
 * readable while honouring the design system (semantic tokens, mono numerics,
 * no raw slate/blue, status colours via the shared hex tokens that runViz uses).
 */
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { capColor } from "./tokens";

/* ------------------------------------------------------------------ */
/*  Section header — lime accent bar + title, optional right slot      */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  caption,
  right,
  id,
}: {
  title: string;
  caption?: string;
  right?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2
          id={id}
          className="flex items-center gap-2 text-[13px] font-semibold leading-none tracking-tight text-foreground"
        >
          <span className="h-3 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden />
          {title}
        </h2>
        {caption && <p className="mt-1.5 pl-[11px] text-xs text-muted-foreground">{caption}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  "[I] Est." provenance tag — for the 6 inferred strategies          */
/* ------------------------------------------------------------------ */

export function InferredTag({ note, className }: { note?: string; className?: string }) {
  const tag = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground",
        className,
      )}
    >
      <Info className="h-3 w-3" aria-hidden />
      Est.
    </span>
  );
  if (!note) return tag;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help" aria-label={note} onClick={(e) => e.stopPropagation()}>
          {tag}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs leading-relaxed">{note}</TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Thin cap meter — activeAds / capacity, tints near/over the 250 cap */
/* ------------------------------------------------------------------ */

export function CapMeter({
  active,
  capacity,
  restricted = false,
  className,
}: {
  active: number;
  capacity: number;
  restricted?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((active / Math.max(capacity, 1)) * 100));
  const color = capColor(active, capacity, restricted);
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-foreground/[0.07]", className)}
      role="meter"
      aria-valuenow={active}
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-label={`${active} of ${capacity} active ads`}
    >
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composed empty state — never a bare "No data"                      */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-center",
        className,
      )}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
