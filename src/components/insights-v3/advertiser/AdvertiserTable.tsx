/**
 * Domain / Page list. Columns (spec, exactly): Name · Total + Active ads ·
 * Winning ads + Longest run · Launch trend · Top framework / hook / concept ·
 * Industry + Category · Landing pages / offers · Actions.
 */
import { memo, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import type { AdvertiserKind, ElementType, Scope } from "@/lib/insights-v3/types";
import { formatDays, type AdvertiserRow } from "@/lib/insights-v3/selectors";
import { ElementChip, Hint, NewBadge, TruncatedText, TrendSpark, fmtInt, fmtPct, useDetailStack } from "../shared";
import { FollowButton, MarkCompetitorButton, SaveDownload } from "./ActionButtons";
import { AdvertiserAvatar } from "./parts";
import { Cell, ClickableRow, TableFrame, type Column } from "./tableParts";

const COLUMNS = (kind: AdvertiserKind): Column[] => [
  { key: "name", label: kind === "page" ? "Page" : "Domain", sticky: true, className: "min-w-[220px]" },
  { key: "ads", label: "Total + active ads", className: "min-w-[110px]" },
  { key: "winners", label: "Winning ads + longest run", className: "min-w-[150px]" },
  { key: "trend", label: "Launch trend", className: "min-w-[140px]" },
  { key: "top", label: "Top framework / hook / concept", className: "min-w-[210px]" },
  { key: "where", label: "Industry + category", className: "min-w-[170px]" },
  { key: "lps", label: "Landing pages / offers", className: "min-w-[120px]" },
  { key: "actions", label: "Actions", className: "min-w-[220px]" },
];

function TopElement({ type, item }: { type: ElementType; item: AdvertiserRow["topFramework"] }) {
  if (!item) {
    return (
      <Hint content={`No ${type} could be identified in this advertiser's ads in scope.`}>
        <span tabIndex={0} className="inline-flex h-6 items-center rounded-sm px-1 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          —
        </span>
      </Hint>
    );
  }
  return <ElementChip type={type} id={item.id} label={item.label} />;
}

function SecondLine({ first, rest, noun }: { first: string | undefined; rest: string[]; noun: string }) {
  if (!first) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-1">
      <TruncatedText text={first} className="min-w-0" />
      {rest.length > 0 && (
        <Hint content={`All ${noun}: ${[first, ...rest].join(", ")}`}>
          <span tabIndex={0} className="shrink-0 rounded-full bg-muted px-1.5 font-mono text-[11px] tabular-nums text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            +{rest.length}
          </span>
        </Hint>
      )}
    </span>
  );
}

const RowView = memo(function RowView({ row, kind, scope }: { row: AdvertiserRow; kind: AdvertiserKind; scope: Scope }) {
  const detail = useDetailStack();
  const open = () => detail.push({ kind: "advertiser", advertiserKind: kind, id: row.id });
  const change = row.changePct === null ? (row.launchesThisPeriod > 0 ? "New" : "—") : fmtPct(row.changePct);
  const changeTone =
    row.changePct === null
      ? "text-primary-text"
      : row.changePct > 0
        ? "text-success-text"
        : row.changePct < 0
          ? "text-error-text"
          : "text-muted-foreground";
  return (
    <ClickableRow onOpen={open} label={`Open ${row.name}`}>
      <Cell sticky>
        <div className="flex min-w-0 items-center gap-2.5">
          <AdvertiserAvatar name={row.name} url={row.avatarUrl} />
          <div className="min-w-0 flex-1">
            <TruncatedText text={row.name} className="max-w-[200px] font-medium text-foreground" focusable={false} />
            {row.isNew && <NewBadge className="mt-1" />}
          </div>
        </div>
      </Cell>
      <Cell>
        <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.totalAds)}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${row.activeAds > 0 ? "bg-success-text" : "bg-muted-foreground/50"}`} />
          <span className="font-mono tabular-nums text-foreground">{fmtInt(row.activeAds)}</span> active
        </div>
      </Cell>
      <Cell>
        <div className="flex items-center gap-1 text-sm">
          <Trophy className={`h-3.5 w-3.5 ${row.winningAds > 0 ? "text-warning-text" : "text-muted-foreground"}`} aria-hidden="true" />
          <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(row.winningAds)}</span>
          <span className="text-xs text-muted-foreground">{row.winningAds === 1 ? "winner" : "winners"}</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {row.longestRunDays === null ? (
            <span className="italic">Start date unknown</span>
          ) : (
            <>
              Longest <span className="font-mono tabular-nums text-foreground">{formatDays(row.longestRunDays)}</span>
            </>
          )}
        </div>
      </Cell>
      <Cell>
        <div className="flex items-center gap-2">
          <TrendSpark series={row.launchTrend} />
          <span className={`font-mono text-xs font-medium tabular-nums ${changeTone}`}>{change}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{row.launchTrend.unit}</div>
      </Cell>
      <Cell>
        <div className="flex flex-col items-start gap-1">
          <TopElement type="framework" item={row.topFramework} />
          <TopElement type="hook" item={row.topHook} />
          <TopElement type="concept" item={row.topConcept} />
        </div>
      </Cell>
      <Cell className="text-xs">
        <SecondLine first={row.industries[0]?.label} rest={row.industries.slice(1).map((i) => i.label)} noun="industries" />
        <div className="mt-0.5 text-muted-foreground">
          <SecondLine first={row.categories[0]?.label} rest={row.categories.slice(1).map((i) => i.label)} noun="categories" />
        </div>
      </Cell>
      <Cell>
        <div className="text-xs text-muted-foreground">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.landingPageCount)}</span>{" "}
          {row.landingPageCount === 1 ? "page" : "pages"}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{fmtInt(row.offerCount)}</span> {row.offerCount === 1 ? "offer" : "offers"}
        </div>
      </Cell>
      <Cell>
        <div className="flex flex-wrap items-center gap-1.5">
          <MarkCompetitorButton kind={kind} id={row.id} name={row.name} />
          {kind === "page" && <FollowButton id={row.id} name={row.name} />}
          <SaveDownload target={{ type: kind, id: row.id }} scope={scope} />
        </div>
      </Cell>
    </ClickableRow>
  );
});

export function AdvertiserTable({
  kind,
  rows,
  scope,
  footer,
}: {
  kind: AdvertiserKind;
  rows: AdvertiserRow[];
  scope: Scope;
  footer?: ReactNode;
}) {
  return (
    <TableFrame label={kind === "page" ? "Pages" : "Domains"} columns={COLUMNS(kind)} minWidth={1240} footer={footer}>
      {rows.map((r) => (
        <RowView key={r.id} row={r} kind={kind} scope={scope} />
      ))}
    </TableFrame>
  );
}
