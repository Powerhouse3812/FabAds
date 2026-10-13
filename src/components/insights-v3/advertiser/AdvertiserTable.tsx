/**
 * Domain / Page list. Columns (spec, exactly): Name · Total + Active ads ·
 * Winning ads + Longest run · Launch trend · Top framework / hook / concept ·
 * Industry + Category · Landing pages / offers · Actions.
 *
 * Compact rows: fixed column widths (see columns.ts) so every column fits a
 * 1440px screen with the sub-nav open; the three top elements share one cell
 * with small label-prefixed chips; Actions are icon-only buttons (tooltip +
 * aria-label) in a sticky-right column.
 */
import { memo, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import type { AdvertiserKind, ElementType, Scope } from "@/lib/insights-v3/types";
import { formatDays, type AdvertiserRow } from "@/lib/insights-v3/selectors";
import { ElementChip, Hint, NewBadge, TruncatedText, TrendSpark, fmtInt, fmtPct, useDetailStack } from "../shared";
import { FollowButton, MarkCompetitorButton, SaveDownload } from "./ActionButtons";
import { advertiserColumns } from "./columns";
import { AdvertiserAvatar } from "./parts";
import { Cell, ClickableRow, TableFrame } from "./tableParts";

const TOP_LABEL: Record<"framework" | "hook" | "concept", string> = {
  framework: "Frame",
  hook: "Hook",
  concept: "Concept",
};

function TopElement({ type, item }: { type: Extract<ElementType, "framework" | "hook" | "concept">; item: AdvertiserRow["topFramework"] }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="w-[42px] shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{TOP_LABEL[type]}</span>
      {item ? (
        <ElementChip type={type} id={item.id} label={item.label} className="h-5 min-w-0 flex-1 justify-start text-[11px]" />
      ) : (
        <Hint content={`No ${type} could be identified in this competitor's ads in scope.`}>
          <span tabIndex={0} className="text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            —
          </span>
        </Hint>
      )}
    </div>
  );
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
        <div className="flex min-w-0 items-center gap-2">
          <AdvertiserAvatar name={row.name} url={row.avatarUrl} className="h-7 w-7" />
          <div className="min-w-0 flex-1">
            <TruncatedText text={row.name} className="font-medium text-foreground" focusable={false} />
            {row.isNew && <NewBadge className="mt-0.5" />}
          </div>
        </div>
      </Cell>
      <Cell>
        <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.totalAds)}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.activeAds > 0 ? "bg-success-text" : "bg-muted-foreground/50"}`} />
          <span className="font-mono tabular-nums text-foreground">{fmtInt(row.activeAds)}</span> active
        </div>
      </Cell>
      <Cell>
        <div className="flex items-center gap-1 text-sm">
          <Trophy className={`h-3.5 w-3.5 shrink-0 ${row.winningAds > 0 ? "text-warning-text" : "text-muted-foreground"}`} aria-hidden="true" />
          <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(row.winningAds)}</span>
          <span className="truncate text-xs text-muted-foreground">{row.winningAds === 1 ? "winner" : "winners"}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
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
        <div className="flex items-center gap-1.5">
          <TrendSpark series={row.launchTrend} width={56} />
          <span className={`font-mono text-xs font-medium tabular-nums ${changeTone}`}>{change}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.launchTrend.unit}</div>
      </Cell>
      <Cell>
        <div className="flex flex-col gap-0.5">
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
      <Cell stickyRight>
        <div className="flex items-center gap-1" role="group" aria-label={`Actions for ${row.name}`}>
          <MarkCompetitorButton kind={kind} id={row.id} name={row.name} compact />
          {kind === "page" && <FollowButton id={row.id} name={row.name} compact />}
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
    <TableFrame label={kind === "page" ? "Pages" : "Domains"} columns={advertiserColumns(kind)} footer={footer}>
      {rows.map((r) => (
        <RowView key={r.id} row={r} kind={kind} scope={scope} />
      ))}
    </TableFrame>
  );
}
