import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  /** Optional small icon to the left of the title (lucide icon component). */
  icon?: ElementType;
  /** Optional count badge after the title. */
  count?: number;
  /** Optional italic hint text after count. */
  hint?: string;
  /** Optional trailing element (e.g., a button or chevron for accordions). */
  trailing?: ReactNode;
  /** Compact spacing variant. */
  size?: "default" | "compact";
}

/**
 * SectionHeader — single source of truth for ALL section labels.
 * Pattern: vertical lime accent stripe + mono uppercase tracking-wider title
 * + optional count badge + italic hint + optional trailing widget.
 */
export function SectionHeader({
  title,
  icon: Icon,
  count,
  hint,
  trailing,
  size = "default",
}: SectionHeaderProps) {
  const compact = size === "compact";
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2",
        compact ? "py-1" : "py-1.5",
      )}
    >
      {/* Lime accent stripe — strongest section signal */}
      <span
        aria-hidden
        className={cn(
          "block shrink-0 rounded-full bg-primary",
          compact ? "h-3 w-[2px]" : "h-3.5 w-[2.5px]",
        )}
      />
      {Icon && <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />}
      <span
        className={cn(
          "font-mono font-semibold uppercase tracking-[0.18em] text-foreground",
          compact ? "text-[9px]" : "text-[10px]",
        )}
      >
        {title}
      </span>
      {typeof count === "number" && (
        <span className="inline-flex items-center justify-center rounded-full bg-foreground/[0.08] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
          {count}
        </span>
      )}
      {hint && (
        <span className="line-clamp-1 text-[10px] italic text-muted-foreground/80">
          {hint}
        </span>
      )}
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}
