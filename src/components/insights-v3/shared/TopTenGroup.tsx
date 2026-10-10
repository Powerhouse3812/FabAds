import type { SelectedTags, TagGroupKey, TagOption, TopTenGroup as TopTenGroupData } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Hint } from "./Hint";
import { TruncatedText } from "./TruncatedText";
import { fmtInt } from "./format";
import { useViewMore } from "./url";

export const TOP_N = 10;

/** One toggle chip: label + lime count pill. Shared with ViewMoreModal semantics. */
export function TagChip({
  option,
  selected,
  onToggle,
  noun = "ads",
}: {
  option: TagOption;
  selected: boolean;
  onToggle: () => void;
  noun?: string;
}) {
  // A selected tag whose count fell to 0 (scope changed) must stay clickable so it can be removed.
  const empty = option.count === 0 && !selected;
  const chip = (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={empty || undefined}
      aria-label={`${option.label}, ${fmtInt(option.count)} ${noun}${empty ? ", none in this scope" : ""}`}
      onClick={() => {
        if (!empty) onToggle();
      }}
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border pl-2.5 pr-1 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        empty
          ? "cursor-not-allowed border-dashed border-border bg-muted/40 text-muted-foreground"
          : selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      <TruncatedText text={option.label} className="max-w-[160px]" focusable={false} />
      <span
        className={cn(
          "inline-flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[11px] tabular-nums",
          empty
            ? "bg-muted text-muted-foreground"
            : selected
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-primary/15 text-primary-text",
        )}
      >
        {fmtInt(option.count)}
      </span>
    </button>
  );
  return empty ? <Hint content={`No ${noun} in this scope`}>{chip}</Hint> : chip;
}

export interface TopTenGroupProps {
  group: TopTenGroupData;
  /** Selected option ids for this group. */
  selected: string[];
  onToggle: (groupKey: TagGroupKey, id: string) => void;
  /** Defaults to opening the URL-backed ViewMoreModal (`more=<key>`). */
  onViewMore?: (groupKey: TagGroupKey) => void;
  /** What the counts count ("ads", "advertisers", "landing pages"). Used in tooltips + aria. */
  noun?: string;
  /** How many chips before "View more". Default 10. */
  limit?: number;
  className?: string;
}

/**
 * First 10 options as toggle chips (accent at rest). Never re-sorts on click,
 * never changes counts on selection — that is the data layer's job.
 */
export function TopTenGroup({ group, selected, onToggle, onViewMore, noun = "ads", limit = TOP_N, className }: TopTenGroupProps) {
  const viewMore = useViewMore();
  const open = onViewMore ?? viewMore.open;
  const shown = group.options.slice(0, limit);
  const rest = group.options.length - shown.length;
  const hiddenSelected = group.options.slice(limit).filter((o) => selected.includes(o.id)).length;
  const selectedHere = selected.length;

  return (
    <section aria-label={group.label} className={cn("min-w-0 rounded-xl border border-border bg-card p-3", className)}>
      <header className="flex items-center justify-between gap-2">
        <h4 className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
          <TruncatedText text={group.label} />
          {selectedHere > 0 && (
            <span className="shrink-0 rounded-full bg-primary px-1.5 font-mono text-[11px] leading-4 tabular-nums text-primary-foreground">
              {selectedHere}
            </span>
          )}
        </h4>
      </header>
      {group.options.length === 0 ? (
        <p className="mt-2 text-xs italic text-muted-foreground">No tags in this scope.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {shown.map((o) => (
            <TagChip
              key={o.id}
              option={o}
              noun={noun}
              selected={selected.includes(o.id)}
              onToggle={() => onToggle(group.key, o.id)}
            />
          ))}
        </div>
      )}
      {rest > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => open(group.key)}
            className="rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View more ({fmtInt(rest)})
          </button>
          {hiddenSelected > 0 && (
            <span className="text-xs text-muted-foreground">
              · <span className="font-mono tabular-nums">{hiddenSelected}</span> selected beyond the top {limit}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export interface TopTenGroupsProps {
  groups: TopTenGroupData[];
  selected: SelectedTags;
  onToggle: (groupKey: TagGroupKey, id: string) => void;
  onViewMore?: (groupKey: TagGroupKey) => void;
  /** Hide groups, e.g. `["category"]` when a category is scoped, or the tab's own element. */
  hiddenKeys?: TagGroupKey[];
  noun?: string;
  limit?: number;
  className?: string;
}

/** Responsive layout for many groups (2 columns from `md`, 1 below). */
export function TopTenGroups({ groups, selected, onToggle, onViewMore, hiddenKeys, noun, limit, className }: TopTenGroupsProps) {
  const visible = groups.filter((g) => !hiddenKeys?.includes(g.key));
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:grid-cols-2", className)}>
      {visible.map((g) => (
        <TopTenGroup
          key={g.key}
          group={g}
          noun={noun}
          limit={limit}
          selected={selected[g.key] ?? []}
          onToggle={onToggle}
          onViewMore={onViewMore}
        />
      ))}
    </div>
  );
}
