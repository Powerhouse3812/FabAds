/** Trending tags: real keyword + angle data, one click selects the tag as a filter (union, like any other tag). */
import { Flame } from "lucide-react";
import type { SelectedTags, TagGroupKey } from "@/lib/insights-v3/types";
import type { TrendingTag } from "@/lib/insights-v3/selectors";
import { BasedOnNote, TruncatedText, fmtInt, fmtPct } from "@/components/insights-v3/shared";
import { cn } from "@/lib/utils";

export interface TrendingTagsProps {
  tags: TrendingTag[];
  selected: SelectedTags;
  onToggle: (group: TagGroupKey, id: string) => void;
  basedOn: number;
}

export function TrendingTags({ tags, selected, onToggle, basedOn }: TrendingTagsProps) {
  return (
    <section aria-label="Trending tags" className="min-w-0 rounded-xl border border-border bg-card p-3">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Flame className="h-4 w-4 text-primary-text" aria-hidden="true" />
          Trending tags
        </h3>
        <BasedOnNote ads={basedOn} />
      </header>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Keywords and angles with the biggest rise in new ads launched. The number is new ads this period. Click one to filter the ads below.
      </p>
      {tags.length === 0 ? (
        <p className="mt-2 text-xs italic text-muted-foreground">No keyword or angle launched new ads in this period.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const on = (selected[t.groupKey] ?? []).includes(t.id);
            const change = t.changePct === null ? "new this period" : `${fmtPct(t.changePct)} vs previous period`;
            return (
              <li key={`${t.groupKey}:${t.id}`} className="max-w-full">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${t.groupKey === "angle" ? "Angle" : "Keyword"} ${t.label}, ${t.count} new ads, ${change}`}
                  onClick={() => onToggle(t.groupKey, t.id)}
                  className={cn(
                    "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border pl-2.5 pr-1 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/30 bg-primary/10 text-primary-text hover:bg-primary/20",
                  )}
                >
                  <TruncatedText text={t.label} className="max-w-[180px]" focusable={false} />
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[11px] tabular-nums",
                      on ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/15 text-primary-text",
                    )}
                  >
                    {fmtInt(t.count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
