import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { SelectedTags, TagGroupKey, TopTenGroup } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { InfoGlyph } from "./Hint";
import { TruncatedText } from "./TruncatedText";
import { fmtInt, pluralize } from "./format";

export interface SelectedChipsProps {
  selected: SelectedTags;
  /** Used only to resolve group + option labels. Unknown ids fall back to the raw id. */
  groups: TopTenGroup[];
  onRemove: (groupKey: TagGroupKey, id: string) => void;
  onClearAll: () => void;
  /** Combined total of everything picked (each item counted once) — or the unfiltered total when nothing is picked. */
  total: number;
  /** Plural noun: "ads", "advertisers", "landing pages", … */
  noun: string;
  nounSingular?: string;
  /** Sits at the right edge — put the SortControl here. */
  rightSlot?: ReactNode;
  className?: string;
}

/** "Group: Label ×" chips, Clear all, and the result total with its union note. */
export function SelectedChips({
  selected,
  groups,
  onRemove,
  onClearAll,
  total,
  noun,
  nounSingular,
  rightSlot,
  className,
}: SelectedChipsProps) {
  // Never show a chip for an id the group doesn't know (hand-edited / stale URL): it would read as a raw
  // slug and filter to nothing. "Clear all" still shows while ANY raw selection exists, so it can be undone.
  const hasSelection = Object.values(selected).some((ids) => (ids?.length ?? 0) > 0);
  const chips = Object.entries(selected).flatMap(([key, ids]) => {
    const g = groups.find((x) => x.key === key);
    return (ids ?? []).flatMap((id) => {
      const opt = g?.options.find((o) => o.id === id);
      if (g && !opt) return [];
      return [{ groupKey: key as TagGroupKey, groupLabel: g?.label ?? key, id, label: opt?.label ?? id }];
    });
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="text-sm text-foreground" aria-live="polite">
          <span className="font-mono text-base font-semibold tabular-nums">{fmtInt(total)}</span>{" "}
          <span className="text-muted-foreground">{pluralize(total, noun, nounSingular)}</span>
        </p>
        {hasSelection && (
          <>
            <InfoGlyph tip="Showing items that match any selected tag. Each item is counted once." />
            <ul className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="Selected tags">
              {chips.map((c) => (
                <li key={`${c.groupKey}:${c.id}`} className="max-w-full">
                  <button
                    type="button"
                    onClick={() => onRemove(c.groupKey, c.id)}
                    aria-label={`Remove ${c.groupLabel}: ${c.label}`}
                    className="group inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-2.5 pr-1.5 text-xs text-primary-text hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="shrink-0 text-muted-foreground">{c.groupLabel}:</span>
                    <TruncatedText text={c.label} className="max-w-[140px] font-medium" focusable={false} />
                    <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-sm text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear all
            </button>
            <span className="hidden text-xs text-muted-foreground lg:inline">showing items that match any selected tag</span>
          </>
        )}
      </div>
      {rightSlot && <div className="ml-auto flex shrink-0 items-center">{rightSlot}</div>}
    </div>
  );
}
