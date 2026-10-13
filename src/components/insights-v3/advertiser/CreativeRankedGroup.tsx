/**
 * Competitor detail · Creative elements: one "they run this most" card.
 * A ranked list, most-used first: rank, the element chip (opens its overlay),
 * how many of the competitor's ads use it, a slim share bar, a lime "Most run"
 * pill on #1 and a "Rising" pill when it is picking up for this competitor.
 */
import { useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import type { SavableType } from "@/lib/insights-v3/types";
import type { MixBlock, RankedItem, TrendItem } from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { BasedOnNote, DisabledSection, ElementChip, Hint, TruncatedText, fmtInt } from "../shared";
import { TYPE_ICON } from "../shared/typeMeta";

const VISIBLE = 6;

function RisingPill({ trend, versus }: { trend: TrendItem; versus: string }) {
  const tip =
    trend.changePct != null
      ? `Rising for this competitor: ads using it are up ${trend.changePct}% vs ${versus}.`
      : `Rising for this competitor: ${fmtInt(trend.cur)} new ${trend.cur === 1 ? "ad uses" : "ads use"} it, none in ${versus}.`;
  return (
    <Hint content={tip}>
      <span
        tabIndex={0}
        aria-label={tip}
        className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-success-text/30 bg-success-text/10 px-1.5 text-[11px] font-medium text-success-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        Rising{trend.changePct != null ? <span className="font-mono tabular-nums"> +{trend.changePct}%</span> : null}
      </span>
    </Hint>
  );
}

function RankedRow({
  rank,
  item,
  type,
  topShare,
  trend,
  versus,
}: {
  rank: number;
  item: RankedItem;
  type: SavableType | null;
  topShare: number;
  trend?: TrendItem;
  versus: string;
}) {
  const first = rank === 1;
  const tip = `${item.label}: used in ${fmtInt(item.count)} ${item.count === 1 ? "ad" : "ads"} (${item.sharePct}% of the ads we analysed).`;
  return (
    <li
      data-testid="ranked-row"
      data-rank={rank}
      data-top={first ? "true" : undefined}
      className={cn(
        "grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-2 rounded-lg border px-2 py-1.5",
        first ? "border-primary/30 bg-primary/10" : "border-transparent",
      )}
    >
      <span
        aria-label={`Rank ${rank}`}
        className={cn("pt-0.5 text-right font-mono text-xs tabular-nums", first ? "font-semibold text-primary-text" : "text-muted-foreground")}
      >
        {rank}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {type ? (
            <ElementChip type={type} id={item.id} label={item.label} />
          ) : (
            <TruncatedText text={item.label} className="min-w-0 text-xs font-medium text-foreground" />
          )}
          {first && (
            <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/20 px-2 text-[11px] font-semibold text-primary-text">
              Most run
            </span>
          )}
          {trend && <RisingPill trend={trend} versus={versus} />}
          <Hint content={tip}>
            <span
              tabIndex={0}
              aria-label={tip}
              className="ml-auto shrink-0 rounded-sm text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(item.count)}</span>
              <span className="text-muted-foreground"> {item.count === 1 ? "ad" : "ads"}</span>
            </span>
          </Hint>
        </div>
        <div className="mt-1.5 flex items-center gap-2" aria-hidden="true">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15">
            <div
              className={cn("h-full rounded-full", first ? "bg-primary" : "bg-primary/60")}
              style={{ width: `${Math.max(3, (item.sharePct / Math.max(1, topShare)) * 100)}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{item.sharePct}%</span>
        </div>
      </div>
    </li>
  );
}

export interface CreativeRankedGroupProps {
  /** "Hooks they run most". */
  title: string;
  /** Element kind (clickable chips) or null (plain labels, e.g. CTA buttons). */
  type: SavableType | null;
  mix: MixBlock;
  emptyReason: string;
  /** Element id → how it is trending for this competitor (only the rising ones). */
  rising?: Map<string, TrendItem>;
  /** "the previous 30 days": the period a Rising pill compares against. */
  versus?: string;
  /** Extra line under the title (what a bar means). */
  note?: ReactNode;
}

export function CreativeRankedGroup({ title, type, mix, emptyReason, rising, versus = "the previous period", note }: CreativeRankedGroupProps) {
  const [all, setAll] = useState(false);
  const listId = useId();
  if (mix.items.length === 0) return <DisabledSection title={title} reason={emptyReason} minHeight={140} />;

  const Icon = type ? TYPE_ICON[type] : null;
  const shown = all ? mix.items : mix.items.slice(0, VISIBLE);
  const topShare = mix.items[0].sharePct;
  return (
    <section aria-label={title} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary-text" aria-hidden="true" />}
          {title}
        </h3>
        <BasedOnNote ads={mix.basedOn} />
      </header>
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>}
      <ol id={listId} aria-label={title} className="mt-2 space-y-0.5">
        {shown.map((it, i) => (
          <RankedRow key={it.id} rank={i + 1} item={it} type={type} topShare={topShare} trend={rising?.get(it.id)} versus={versus} />
        ))}
      </ol>
      {mix.items.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          aria-controls={listId}
          aria-label={all ? `Show top ${VISIBLE} · ${title}` : `Show all ${mix.items.length} · ${title}`}
          className="mt-2 inline-flex h-8 items-center gap-1 self-start rounded-md px-2 text-xs font-medium text-primary-text hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {all ? `Show top ${VISIBLE}` : `Show all ${mix.items.length}`}
          {all ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      )}
    </section>
  );
}
