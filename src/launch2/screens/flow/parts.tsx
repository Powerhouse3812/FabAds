/**
 * Shared flow primitives — small building blocks reused across the 5 steps so
 * the section labels, provenance tags, selectable tiles and inline-error rows
 * look identical everywhere. Pure presentational; no flow logic lives here.
 */
import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Lime bar + uppercase tracking label that heads every card section. */
export function SectionLabel({
  children,
  className,
  trailing,
}: {
  children: ReactNode;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn("mb-3 flex items-center gap-2", className)}>
      <span className="h-3 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {children}
      </span>
      {trailing}
    </div>
  );
}

/**
 * Provenance tag. Bruno is verified; the other 6 playbooks (and catalogue
 * prereqs) are inferred — never present inferred numbers as locked.
 */
export function ProvenanceTag({
  verified,
  note,
  className,
}: {
  verified: boolean;
  /** Inferred note surfaced on hover when not verified. */
  note?: string;
  className?: string;
}) {
  if (verified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
          className,
        )}
        style={{ color: "#237804", backgroundColor: "rgba(82,196,26,0.14)" }}
      >
        Verified
      </span>
    );
  }
  const tag = (
    <span
      className={cn(
        "inline-flex cursor-help items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground",
        className,
      )}
    >
      [I] Est.
      {note ? <Info className="h-3 w-3" /> : null}
    </span>
  );
  if (!note) return tag;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{tag}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{note}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Inline validation errors, rendered near the field/section they belong to
 * (never toast-only). Renders nothing when there are no errors.
 */
export function InlineErrors({
  errors,
  className,
}: {
  errors: string[];
  className?: string;
}) {
  if (errors.length === 0) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed",
        className,
      )}
      style={{ color: "#cf1322", backgroundColor: "rgba(255,77,79,0.06)", borderColor: "rgba(255,77,79,0.4)" }}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <ul className="space-y-0.5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

/** A generic selectable tile (mode / strategy / source). Lime fill when selected. */
export function SelectTile({
  selected,
  onClick,
  disabled,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border bg-card p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary bg-primary/[0.08] ring-1 ring-primary"
          : "border-border",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Small inline chip/pill — for objective, distribution, source choices. */
export function ChoicePill({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary bg-primary/[0.12] text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
