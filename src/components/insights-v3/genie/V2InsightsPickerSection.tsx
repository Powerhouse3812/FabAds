/**
 * Industry Insights V2 section of Genie Studio's "Industry Insights" right rail
 * (mounted by src/genie6/studio-v4/components/IndustryInsightsPicker.tsx).
 *
 * Lets the user attach V2 ads AND creative elements (frameworks, hooks, angles,
 * concepts) as references. Sources:
 *   1. their V2 boards (items of those five types) + V2 saved ads;
 *   2. the most used elements in the market (all scope) — labelled "most used",
 *      a use count, not a performance claim (non-negotiable #9).
 *
 * Hand-off uses the picker's existing mechanism: `onSave(AttachedRef[])`, which
 * the Configure screen stamps with source "industry-insights". AttachedRef can
 * only carry id + label + thumbnail + context, so an element travels as a TEXT
 * reference: label "Hook · Warning — “…verbatim line…”", the example ad's
 * thumbnail, and a §8.2 context tag (structure / copy / concept).
 */
import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { AttachedRef } from "@/genie6/studio-v4/state/useWizard";
import { ELEMENT_TYPE_LABEL, getAd, getAds } from "@/lib/insights-v3/data";
import { useBoards, useSavedAdIds } from "@/lib/insights-v3/stores";
import { TYPE_ICON } from "@/components/insights-v3/shared/typeMeta";
import { cn } from "@/lib/utils";
import {
  ELEMENT_TYPES,
  FILTER_LABEL,
  MARKET_PER_TYPE,
  PICK_TYPES,
  adItem,
  elementItem,
  isPickType,
  toAttachedRef,
  usageCounts,
  type Filter,
  type V2PickItem,
} from "./pickItems";


export interface V2InsightsPickerSectionProps {
  onSave: (refs: AttachedRef[]) => void;
  onClose: () => void;
}

export function V2InsightsPickerSection({ onSave, onClose }: V2InsightsPickerSectionProps) {
  const boards = useBoards();
  const savedAdIds = useSavedAdIds();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Map<string, V2PickItem>>(new Map());

  const counts = useMemo(() => usageCounts(getAds()), []);

  // 1) The user's own: board items of the five types + saved ads, deduped.
  const mine = useMemo<V2PickItem[]>(() => {
    const seen = new Set<string>();
    const out: V2PickItem[] = [];
    for (const b of boards) {
      for (const it of b.items) {
        if (!isPickType(it.ref.type)) continue;
        const key = `${it.ref.type}:${it.ref.id}`;
        if (seen.has(key)) continue;
        let item: V2PickItem | null = null;
        if (it.ref.type === "ad") {
          const ad = getAd(it.ref.id);
          item = ad ? adItem(ad, `Board · ${b.name}`) : null;
        } else {
          item = elementItem(it.ref.type, it.ref.id, `Board · ${b.name}`, counts);
        }
        if (item) {
          seen.add(key);
          out.push(item);
        }
      }
    }
    for (const id of savedAdIds) {
      const key = `ad:${id}`;
      if (seen.has(key)) continue;
      const ad = getAd(id);
      if (!ad) continue;
      seen.add(key);
      out.push(adItem(ad, "Saved ad"));
    }
    return out;
  }, [boards, savedAdIds, counts]);

  // 2) Most used in the market (all scope), per element type.
  const market = useMemo<V2PickItem[]>(() => {
    const mineKeys = new Set(mine.map((m) => m.key));
    const out: V2PickItem[] = [];
    for (const t of ELEMENT_TYPES) {
      const ranked = [...counts[t].entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MARKET_PER_TYPE);
      for (const [id] of ranked) {
        if (mineKeys.has(`${t}:${id}`)) continue;
        const item = elementItem(t, id, "Most used in the market", counts);
        if (item) out.push(item);
      }
    }
    return out;
  }, [counts, mine]);

  const filterCounts = useMemo(() => {
    const all = [...mine, ...market];
    const c = { all: all.length } as Record<Filter, number>;
    for (const t of PICK_TYPES) c[t] = all.filter((i) => i.type === t).length;
    return c;
  }, [mine, market]);

  const show = (list: V2PickItem[]) => (filter === "all" ? list : list.filter((i) => i.type === filter));
  const mineShown = show(mine);
  const marketShown = show(market);

  const toggle = (item: V2PickItem) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.set(item.key, item);
      return next;
    });

  const n = selected.size;

  return (
    <div className="flex h-full min-h-0 flex-auto flex-col" data-testid="v2-insights-picker">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Boards · saved ads · market</p>
          <h3 className="text-sm font-semibold text-foreground">
            Industry Insights V2
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-px font-mono text-[11px] font-semibold tabular-nums text-primary-text">
              {filterCounts.all}
            </span>
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Industry Insights V2"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div role="group" aria-label="Filter by type" className="flex shrink-0 flex-wrap gap-1.5 border-b border-border/60 px-3 py-2">
        {(["all", ...PICK_TYPES] as Filter[]).map((f) => {
          const count = filterCounts[f] ?? 0;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              disabled={count === 0}
              aria-pressed={active}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-primary/30 bg-primary/10 text-foreground hover:bg-primary/20",
              )}
            >
              {FILTER_LABEL[f]}
              <span className="font-mono tabular-nums opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <Group
          title="From your boards & saved ads"
          items={mineShown}
          selected={selected}
          onToggle={toggle}
          empty={
            mine.length === 0
              ? "Nothing saved yet. Save ads, hooks, angles, frameworks or concepts to a board in Industry Insights V2 and they show up here."
              : `No ${FILTER_LABEL[filter].toLowerCase()} on your boards.`
          }
        />
        <Group
          title="Most used in the market"
          hint="Ranked by how many ads use it, across all industries. A use count, not a performance ranking."
          items={marketShown}
          selected={selected}
          onToggle={toggle}
          empty={`No ${FILTER_LABEL[filter].toLowerCase()} here.`}
        />
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave([...selected.values()].map(toAttachedRef))}
          disabled={n === 0}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save{n > 0 && <span className="font-mono opacity-90">· {n}</span>}
        </button>
      </footer>
    </div>
  );
}

function Group({
  title,
  hint,
  items,
  selected,
  onToggle,
  empty,
}: {
  title: string;
  hint?: string;
  items: V2PickItem[];
  selected: Map<string, V2PickItem>;
  onToggle: (i: V2PickItem) => void;
  empty: string;
}) {
  return (
    <section className="mb-4 last:mb-0" aria-label={title}>
      <h4 className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
        <span className="rounded-full bg-primary/10 px-1.5 font-mono tabular-nums text-primary-text">{items.length}</span>
      </h4>
      {hint && <p className="mb-2 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
      {items.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />
          <p className="text-[11px] leading-snug text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.key}>
              <PickRow item={item} selected={selected.has(item.key)} onClick={() => onToggle(item)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PickRow({ item, selected, onClick }: { item: V2PickItem; selected: boolean; onClick: () => void }) {
  const Icon = TYPE_ICON[item.type];
  const typeLabel = item.type === "ad" ? "Ad" : ELEMENT_TYPE_LABEL[item.type];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
      )}
    >
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-primary-text">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary-text">
            <Icon className="h-2.5 w-2.5" aria-hidden="true" />
            {typeLabel}
          </span>
          <span className="truncate text-[12px] font-semibold text-foreground" title={item.title}>
            {item.title}
          </span>
        </span>
        {item.quote && (
          <span className="mt-0.5 block truncate text-[11px] italic text-foreground/80" title={item.quote}>
            “{item.quote}”
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="truncate" title={item.meta}>{item.meta}</span>
          {typeof item.adsUsing === "number" && (
            <span className="shrink-0 font-mono tabular-nums">· {item.adsUsing} ads</span>
          )}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>
  );
}
