/**
 * My Feeds · Overview. Collapsed by default into ONE bar: the sources pill ("From 3 competitors · …", merged in
 * from the old identity row) + all 7 KPIs as minimal pills. Expanded: the same pills, then one full-width AI row
 * (summary + suggested action + both CTAs), then three compact blocks: "New Ad launch" · Rising · Scaling.
 * Every number comes from the same selectors the Discover overview uses; nothing is re-derived here.
 */
import { useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Layers, Sparkles, TrendingUp } from "lucide-react";
import type { Ad, AiSummary, ElementType, Kpi, PeriodKey, SelectedTags, TagGroupKey, TopTenGroup, TrendSeries } from "@/lib/insights-v3/types";
import { SAVABLE_LABEL } from "@/lib/insights-v3/types";
import { ELEMENT_GROUP_KEY, comparisonLabel, risingRank, rising, scaling, type TrendItem, type UserPrefs } from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import {
  AiSummaryBlock,
  BasedOnNote,
  ChangeChip,
  Hint,
  bucketRangeLabel,
  fmtInt,
  fmtPct,
  savedRefToDetailTarget,
  useDetailStack,
} from "@/components/insights-v3/shared";
import { bucketTickLabel } from "@/components/insights-v3/shared/format";
import { SourcesPopover } from "./SourcesPopover";
import { sourceCounts } from "./sourceCounts";

const ELEMENT_KINDS: ElementType[] = ["framework", "hook", "angle", "concept"];
const BLOCK_ROWS = 3;

const PILL_BASE = "inline-flex h-[26px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11px]";

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function SourcesPill({ prefs }: { prefs: UserPrefs }) {
  const c = sourceCounts(prefs);
  const Num = ({ n }: { n: number }) => <b className="font-mono text-xs font-semibold tabular-nums">{fmtInt(n)}</b>;
  return (
    <SourcesPopover prefs={prefs}>
      <button
        type="button"
        aria-label={`From ${c.competitors} ${plural(c.competitors, "competitor", "competitors")}, ${c.pages} followed ${plural(c.pages, "page", "pages")}, ${c.industries} followed ${plural(c.industries, "industry", "industries")}. See what feeds My Feeds`}
        className={cn(
          PILL_BASE,
          "bg-primary/10 text-primary-text ring-1 ring-inset ring-primary/40 transition-colors hover:bg-primary/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          From <Num n={c.competitors} /> {plural(c.competitors, "competitor", "competitors")}
          <span aria-hidden="true"> · </span>
          <Num n={c.pages} /> followed {plural(c.pages, "page", "pages")}
          <span aria-hidden="true"> · </span>
          <Num n={c.industries} /> followed {plural(c.industries, "industry", "industries")}
        </span>
      </button>
    </SourcesPopover>
  );
}

function KpiPill({ kpi }: { kpi: Kpi }) {
  const disabled = !!kpi.disabledReason;
  const tip = disabled ? kpi.disabledReason : [kpi.tooltip, kpi.sub].filter(Boolean).join(" · ");
  const pill = (
    <span
      aria-disabled={disabled || undefined}
      // Focusable so keyboard and touch users can open the definition + trend line the tooltip carries.
      tabIndex={0}
      className={cn(
        PILL_BASE,
        "text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled ? "border border-dashed border-border bg-muted/40 opacity-70" : "bg-muted",
      )}
    >
      <b className="max-w-[160px] truncate font-mono text-xs font-semibold tabular-nums text-foreground">{disabled ? "—" : kpi.display}</b>
      {/* "98 days" + "Avg days live" would read "days days": the value already carries the unit. */}
      {/days/i.test(kpi.display) ? kpi.label.replace(/\bdays\s+/i, "") : kpi.label}
      {disabled ? (
        <span className="sr-only">: unavailable. {kpi.disabledReason}</span>
      ) : (
        kpi.sub && <span className="sr-only">. {kpi.sub}</span>
      )}
    </span>
  );
  return <Hint content={tip}>{pill}</Hint>;
}

function Pills({ kpis, prefs, wrap }: { kpis: Kpi[]; prefs: UserPrefs; wrap?: boolean }) {
  return (
    <div
      aria-label="Sources and key metrics"
      role="group"
      className={cn(
        "flex min-w-0 gap-1.5",
        wrap
          ? "flex-wrap"
          : "flex-1 overflow-x-auto py-0.5 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      <SourcesPill prefs={prefs} />
      {kpis.map((k) => (
        <KpiPill key={k.key} kpi={k} />
      ))}
    </div>
  );
}

function Toggle({ expanded, onToggle, id }: { expanded: boolean; onToggle: () => void; id: string }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={id}
      onClick={onToggle}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md py-1 pr-1 text-[13px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-9"
    >
      {expanded ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      )}
      Overview
      <span className="sr-only">{expanded ? " — collapse" : " — expand"}</span>
    </button>
  );
}

/* ── expanded body ─────────────────────────────────────────────────────── */

function Block({ title, unit, aside, children }: { title: string; unit?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-background p-2.5">
      <h4 className="flex min-w-0 items-center justify-between gap-2 text-xs font-semibold text-foreground">
        <span className="flex min-w-0 items-center gap-1.5 truncate">{title}</span>
        {aside}
      </h4>
      {unit && <p className="text-[11px] leading-4 text-muted-foreground">{unit}</p>}
      {children}
    </section>
  );
}

function Delta({ changePct, label }: { changePct: number | null; label: string }) {
  const up = changePct !== null && changePct > 0;
  const down = changePct !== null && changePct < 0;
  const text = changePct === null ? "New" : fmtPct(changePct);
  return (
    <Hint content={label}>
      <span
        tabIndex={0}
        aria-label={label}
        className={cn(
          "inline-flex h-[18px] shrink-0 items-center whitespace-nowrap rounded-full border px-1.5 font-mono text-[10px] font-medium tabular-nums",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          changePct === null && "border-primary/30 bg-primary/10 text-primary-text",
          up && "border-success-text/30 bg-success-text/10 text-success-text",
          down && "border-error-text/30 bg-error-text/10 text-error-text",
          changePct === 0 && "border-border bg-muted text-muted-foreground",
        )}
      >
        {text}
      </span>
    </Hint>
  );
}

function MiniTrend({ series }: { series: TrendSeries }) {
  const pts = series.points;
  const empty = pts.length === 0 || pts.every((p) => p.count === 0);
  const max = Math.max(1, ...pts.map((p) => p.count));
  const last = pts[pts.length - 1];
  const change = series.changePct === null ? "New this period" : `${fmtPct(series.changePct)} vs previous period`;
  return (
    <Block
      title="New Ad launch"
      aside={empty ? null : <ChangeChip changePct={series.changePct} />}
    >
      {empty ? (
        <p className="text-xs italic text-muted-foreground">No ads launched in this period, so there is nothing to chart.</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`New Ad launch: ${series.unit}. ${pts.length} ${series.bucket} buckets, latest ${last.count}. ${change}.`}
            className="flex h-14 items-end gap-1"
          >
            {pts.map((p, i) => (
              <span
                key={p.start}
                title={`${bucketRangeLabel(p.start, series.bucket)}: ${fmtInt(p.count)} ${series.unit}`}
                style={{ height: `${Math.max(p.count > 0 ? 8 : 3, Math.round((p.count / max) * 100))}%` }}
                className={cn("min-w-[2px] flex-1 rounded-t-sm", i === pts.length - 1 ? "bg-primary" : "bg-primary/40")}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              Unit: <span className="font-medium text-foreground">{series.unit}</span>
            </span>
            <span className="font-mono text-[10px]">
              {bucketTickLabel(pts[0].start, series.bucket)} – {bucketTickLabel(last.start, series.bucket)}
            </span>
          </div>
        </>
      )}
    </Block>
  );
}

function NameButton({ type, id, label }: { type: "page" | ElementType; id: string; label: string }) {
  const detail = useDetailStack();
  return (
    <button
      type="button"
      title={label}
      aria-label={`${SAVABLE_LABEL[type]}: ${label}. Open details`}
      onClick={() => detail.push(savedRefToDetailTarget({ type, id }))}
      className="min-w-0 flex-1 truncate rounded-sm text-left text-xs text-foreground hover:text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </button>
  );
}

function RisingBlock({ items, vs }: { items: TrendItem[]; vs: string }) {
  return (
    <Block title="Rising" aside={<TrendingUp className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />} unit={`New ads launched vs ${vs}`}>
      {items.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">Nothing is rising in this scope: no framework, hook, angle or concept launched more new ads than before.</p>
      ) : (
        <ol className="space-y-1">
          {items.map((it) => (
            <li key={`${it.kind}:${it.id}`} className="flex min-h-6 min-w-0 items-center gap-2">
              {/* 72px: "FRAMEWORK" at this size + tracking needs ~65px, so 64px let it spill out of its own pill. */}
              <span className="w-[72px] shrink-0 rounded-md bg-muted px-1 py-px text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {SAVABLE_LABEL[it.kind as ElementType]}
              </span>
              <NameButton type={it.kind as ElementType} id={it.id} label={it.label} />
              <Delta
                changePct={it.changePct}
                label={it.changePct === null ? "New this period" : `${fmtPct(it.changePct)} new ads vs ${vs}`}
              />
              <Hint content={`${fmtInt(it.cur)} new ads this period, ${fmtInt(it.prev)} before`}>
                <span tabIndex={0} className="shrink-0 rounded-sm font-mono text-[10px] tabular-nums text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {fmtInt(it.cur)} new
                </span>
              </Hint>
            </li>
          ))}
        </ol>
      )}
    </Block>
  );
}

function ScalingBlock({ items, vs }: { items: TrendItem[]; vs: string }) {
  return (
    <Block title="Scaling" aside={<TrendingUp className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />} unit={`Live ads now vs ${vs}`}>
      {items.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">No page is running more live ads than before while holding a winner.</p>
      ) : (
        <ol className="space-y-1">
          {items.map((it) => (
            <li key={it.id} className="flex min-h-6 min-w-0 items-center gap-2">
              <NameButton type="page" id={it.id} label={it.label} />
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-success-text">
                {fmtInt(it.activePrev)} → {fmtInt(it.activeNow)} live
              </span>
              <span className="shrink-0 rounded-full border border-warning-text/30 bg-warning-text/10 px-1.5 text-[10px] font-medium leading-[18px] text-warning-text">
                <span className="font-mono tabular-nums">{fmtInt(it.winners)}</span> {it.winners === 1 ? "winner" : "winners"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Block>
  );
}

function AiRow({
  summary,
  basedOn,
  top,
  vs,
  adsWithTop,
  topOn,
  onFilterTop,
}: {
  summary: AiSummary | null;
  basedOn: number;
  top: TrendItem | undefined;
  vs: string;
  adsWithTop: number;
  topOn: boolean;
  onFilterTop: () => void;
}) {
  if (!summary) {
    return (
      <AiSummaryBlock
        summary={{ text: "", ads: basedOn }}
        disabledReason="No ads in this scope, so there is nothing to summarise."
      />
    );
  }
  const kind = top ? (SAVABLE_LABEL[top.kind as ElementType] ?? top.kind).toLowerCase() : "";
  const change = top ? (top.changePct === null ? "new this period" : `${fmtPct(top.changePct)} new ads vs ${vs}`) : "";
  return (
    <section
      aria-label="AI summary and suggested action"
      className="grid min-w-0 rounded-xl border border-primary/30 bg-primary/10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
    >
      <div className="min-w-0 px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          AI summary
        </h3>
        <p className="mt-1 whitespace-pre-line text-xs leading-[19px] text-foreground">{summary.text}</p>
      </div>
      <div className="min-w-0 border-t border-dashed border-primary/30 px-4 py-3 lg:border-l lg:border-t-0">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          Suggested action
        </h3>
        {top ? (
          <>
            <p className="mt-1 text-xs leading-[19px] text-foreground">
              Rising now: the {kind} “{top.label}” ({change}). Brief a new ad built on it.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <UseInGenie
                target={{ type: top.kind as ElementType, id: top.id }}
                label="Use in Genie"
                className="h-[30px] rounded-full px-3.5 font-medium"
              />
              {adsWithTop > 0 && (
                <button
                  type="button"
                  aria-pressed={topOn}
                  onClick={onFilterTop}
                  className="rounded-sm text-xs font-medium text-primary-text underline underline-offset-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-8"
                >
                  {topOn ? "Filter applied · Clear" : `Show ${fmtInt(adsWithTop)} ${adsWithTop === 1 ? "ad" : "ads"}`}
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="mt-1 text-xs leading-[19px] text-muted-foreground">
            Nothing is rising in this scope yet, so there is no suggested action. Widen the period to look for a trend.
          </p>
        )}
      </div>
    </section>
  );
}

export interface FeedOverviewProps {
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  panelId: string;
  prefs: UserPrefs;
  kpis: Kpi[];
  summary: AiSummary | null;
  series: TrendSeries;
  /** Ads in the base scope (industry, category; NOT the period): trends compare periods. */
  baseAds: Ad[];
  period: PeriodKey;
  now: number;
  /** Ads in the current scope: the "Based on" figure for the pills and the AI summary. */
  basedOn: number;
  /** Ads the trend blocks use (industry + category, BOTH periods). Differs from `basedOn` once a period is picked. */
  trendBasedOn: number;
  groups: TopTenGroup[];
  selected: SelectedTags;
  onToggleTag: (groupKey: TagGroupKey, id: string) => void;
}

function ExpandedBody({ prefs, kpis, summary, series, baseAds, period, now, basedOn, trendBasedOn, groups, selected, onToggleTag }: Omit<FeedOverviewProps, "expanded" | "onExpandedChange" | "panelId">) {
  const risingItems = useMemo<TrendItem[]>(
    () =>
      ELEMENT_KINDS.flatMap((k) => rising(k, baseAds, period, now, { limit: BLOCK_ROWS }))
        .sort((a, b) => risingRank(b) - risingRank(a) || b.cur - a.cur || (a.id < b.id ? -1 : 1))
        .slice(0, BLOCK_ROWS),
    [baseAds, period, now],
  );
  const scalingItems = useMemo(() => scaling("page", baseAds, period, now, { limit: BLOCK_ROWS }), [baseAds, period, now]);
  // "the 30 days before (last 30 days vs prior 30)" is too long for a block caption: the parenthetical is the same fact twice.
  const vs = comparisonLabel(period).replace(/\s*\([^)]*\)\s*$/, "");
  const top = risingItems[0];
  const topGroup = top ? ELEMENT_GROUP_KEY[top.kind as ElementType] : undefined;
  const adsWithTop = top && topGroup ? groups.find((g) => g.key === topGroup)?.options.find((o) => o.id === top.id)?.count ?? 0 : 0;
  const topOn = !!top && !!topGroup && (selected[topGroup] ?? []).includes(top.id);

  return (
    <div className="space-y-2.5">
      <Pills kpis={kpis} prefs={prefs} wrap />
      <AiRow
        summary={summary}
        basedOn={basedOn}
        top={top}
        vs={vs}
        adsWithTop={adsWithTop}
        topOn={topOn}
        onFilterTop={() => top && topGroup && onToggleTag(topGroup, top.id)}
      />
      {/* Three across only from xl: with the sidebar open, lg (1024) leaves each list ~200px and names read "prot…".
          lg puts the chart on its own row and Rising | Scaling side by side under it. */}
      <div className="grid min-w-0 gap-2.5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 lg:col-span-2 xl:col-span-1">
          <MiniTrend series={series} />
        </div>
        <RisingBlock items={risingItems} vs={vs} />
        <ScalingBlock items={scalingItems} vs={vs} />
      </div>
      {trendBasedOn !== basedOn && (
        <p className="text-[11px] text-muted-foreground">
          New Ad launch, Rising and Scaling compare periods, so they use all{" "}
          <span className="font-mono tabular-nums text-foreground">{fmtInt(trendBasedOn)}</span> ads in this industry and category.
        </p>
      )}
    </div>
  );
}

export function FeedOverview(props: FeedOverviewProps) {
  const { expanded, onExpandedChange, panelId, prefs, kpis, basedOn } = props;
  return (
    <section aria-label="Overview" className="min-w-0 rounded-xl border border-border bg-card shadow-sm">
      {expanded ? (
        <div id={panelId} className="space-y-2.5 p-3">
          <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <Toggle expanded onToggle={() => onExpandedChange(false)} id={panelId} />
            <BasedOnNote ads={basedOn} />
          </header>
          <ExpandedBody {...props} />
        </div>
      ) : (
        <div id={panelId} className="flex min-h-11 items-center gap-3 px-3 py-1.5">
          <Toggle expanded={false} onToggle={() => onExpandedChange(true)} id={panelId} />
          <Pills kpis={kpis} prefs={prefs} />
        </div>
      )}
    </section>
  );
}
