/**
 * My Feeds · Quick filters. Every tag group as ONE horizontal row, most-used first, scrolling sideways.
 * "View more" opens the existing ViewMoreModal (searchable, multi-select). Same union rule as everywhere:
 * a tag never changes another tag's count; the page total is the combined distinct ads.
 * Collapsed by default into a single bar; expanded shows Trending + the first three groups, with an expander for the rest.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import type { SelectedTags, TagGroupKey, TopTenGroup } from "@/lib/insights-v3/types";
import type { TrendingTag } from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { InfoGlyph, fmtInt, fmtPct, useViewMore } from "@/components/insights-v3/shared";

/** Chips per row before the rest live behind "View more". Keeps 50K-option groups out of the DOM. */
export const RAIL_LIMIT = 15;
/** Rows visible before "Show N more filters". */
export const ROWS_FIRST = 4;

interface RowChip {
  groupKey: TagGroupKey;
  id: string;
  label: string;
  count: number;
  /** What the number counts. Trending counts NEW ads this period, every other row counts ads in scope. */
  noun?: string;
  /** Extra spoken context (Trending: the change vs the previous period, as Discover's trending chips say). */
  note?: string;
}

interface Row {
  key: string;
  label: string;
  hint?: string;
  chips: RowChip[];
  /** Total options in the group (the modal lists all of them). Absent = no modal for this row. */
  total?: number;
  modalKey?: TagGroupKey;
}

export interface QuickFiltersProps {
  groups: TopTenGroup[];
  trending: TrendingTag[];
  selected: SelectedTags;
  onToggle: (groupKey: TagGroupKey, id: string) => void;
  onClearAll: () => void;
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  /** Id the toolbar's filter toggle points at (aria-controls). */
  panelId: string;
}

function FilterChip({ chip, on, onToggle }: { chip: RowChip; on: boolean; onToggle: () => void }) {
  const empty = chip.count === 0 && !on;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-disabled={empty || undefined}
      aria-label={`${chip.label}, ${fmtInt(chip.count)} ${chip.noun ?? "ads"}${chip.note ? `, ${chip.note}` : ""}${empty ? ", none in this scope" : ""}`}
      title={empty ? "No ads in this scope" : chip.label.length > 22 ? chip.label : undefined}
      onClick={() => {
        if (!empty) onToggle();
      }}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-1 text-xs font-medium transition-colors max-sm:h-8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        empty
          ? "cursor-not-allowed border border-dashed border-border bg-muted/40 text-muted-foreground"
          : on
            ? "bg-primary/15 text-primary-text ring-1 ring-inset ring-primary/50"
            : "bg-muted text-foreground hover:bg-primary/10",
      )}
    >
      <span className="max-w-[180px] truncate">{chip.label}</span>
      <span
        className={cn(
          "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[11px] tabular-nums",
          empty ? "bg-muted text-muted-foreground" : on ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary-text",
        )}
      >
        {fmtInt(chip.count)}
      </span>
    </button>
  );
}

function FilterRow({ row, selected, onToggle }: { row: Row; selected: SelectedTags; onToggle: QuickFiltersProps["onToggle"] }) {
  const viewMore = useViewMore();
  return (
    <div
      role="group"
      aria-label={row.label}
      className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 border-b border-border py-1 last:border-b-0 sm:grid-cols-[128px_minmax(0,1fr)_auto]"
    >
      <span className="col-span-full flex min-w-0 items-center gap-1 pt-1 text-xs font-semibold text-muted-foreground sm:col-span-1 sm:pt-0">
        <span className="truncate">{row.label}</span>
        {/* Focusable glyph, not a `title`: the Trending number means something different and keyboard/touch must reach that. */}
        {row.hint && <InfoGlyph tip={row.hint} />}
      </span>
      {row.chips.length === 0 ? (
        <span className="min-w-0 truncate text-xs italic text-muted-foreground">No tags in this scope.</span>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-1 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {row.chips.map((c) => (
            <FilterChip
              key={`${c.groupKey}:${c.id}`}
              chip={c}
              on={(selected[c.groupKey] ?? []).includes(c.id)}
              onToggle={() => onToggle(c.groupKey, c.id)}
            />
          ))}
        </div>
      )}
      {row.modalKey && row.total ? (
        <button
          type="button"
          onClick={() => viewMore.open(row.modalKey!)}
          aria-label={`View more ${row.label} tags, ${fmtInt(row.total)} in total`}
          className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-sm text-[11px] font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-8"
        >
          View more ({fmtInt(row.total)})
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}

export function QuickFilters({ groups, trending, selected, onToggle, onClearAll, expanded, onExpandedChange, panelId }: QuickFiltersProps) {
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const trendRow: Row = {
      key: "trending",
      label: "Trending",
      hint: "Keywords and angles with the biggest rise in new ads. The number is new ads this period.",
      chips: [...trending]
        .sort((a, b) => b.count - a.count)
        .map((t) => ({
          groupKey: t.groupKey,
          id: t.id,
          label: t.label,
          count: t.count,
          noun: "new ads this period",
          note: t.changePct === null ? "new this period" : `${fmtPct(t.changePct)} vs previous period`,
        })),
    };
    const groupRows = groups.map<Row>((g) => ({
      key: g.key,
      label: g.label,
      chips: g.options.slice(0, RAIL_LIMIT).map((o) => ({ groupKey: g.key, id: o.id, label: o.label, count: o.count })),
      total: g.options.length,
      modalKey: g.key,
    }));
    return [trendRow, ...groupRows];
  }, [groups, trending]);

  // Only ids the groups actually know: a hand-edited URL must not inflate "N applied".
  const applied = useMemo(
    () =>
      groups.reduce((n, g) => {
        const ids = new Set(g.options.map((o) => o.id));
        return n + (selected[g.key] ?? []).filter((id) => ids.has(id)).length;
      }, 0),
    [groups, selected],
  );

  const visible = showAll ? rows : rows.slice(0, ROWS_FIRST);
  const hiddenRows = rows.length - ROWS_FIRST;
  const summary = `${rows.length} groups · ${rows
    .slice(0, 5)
    .map((r) => r.label)
    .join(", ")}${rows.length > 5 ? "…" : ""}`;

  return (
    <section aria-label="Quick filters" className="min-w-0 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex min-h-11 items-center gap-3 px-3 py-1.5">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onExpandedChange(!expanded)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md py-1 pr-1 text-[13px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-9"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          Quick filters
          <span className="sr-only">{expanded ? " — collapse" : " — expand"}</span>
        </button>
        {!expanded && <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:block">{summary}</span>}
        {/* The summary already fills the row from sm up; a second flex-1 would halve its room ("12 groups · Trendi…"). */}
        <span className={cn("flex-1", !expanded && "sm:hidden")} />
        {applied > 0 ? (
          <span
            aria-live="polite"
            className="inline-flex h-[21px] shrink-0 items-center rounded-full bg-primary/15 px-2 text-[11px] font-medium text-primary-text ring-1 ring-inset ring-primary/40"
          >
            <span className="font-mono tabular-nums">{applied}</span>&nbsp;applied
          </span>
        ) : (
          <span className="inline-flex h-[21px] shrink-0 items-center rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground">
            None applied
          </span>
        )}
        {applied > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 rounded-sm text-[11px] font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-8"
          >
            Clear all
          </button>
        )}
      </div>
      <div id={panelId} hidden={!expanded} className={cn(expanded && "border-t border-border px-3 pb-1")}>
        {expanded && (
          <>
            {visible.map((row) => (
              <FilterRow key={row.key} row={row} selected={selected} onToggle={onToggle} />
            ))}
            {hiddenRows > 0 && (
              <button
                type="button"
                aria-expanded={showAll}
                onClick={() => setShowAll((v) => !v)}
                className="flex min-h-9 items-center gap-1.5 rounded-sm text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showAll ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                {showAll ? "Show fewer filters" : `Show ${hiddenRows} more filters`}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
