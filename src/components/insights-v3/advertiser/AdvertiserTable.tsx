/**
 * Domain / Page list. Columns: Name · Total + active ads (one line) · Winning
 * ads · Longest run · Launch trend (mini line) · Industry · Category · Landing
 * pages · Offers · Actions. The top framework / hook / concept live only in
 * the detail overlay.
 *
 * Compact rows: fixed column widths (see columns.ts) so every column fits a
 * 1440px screen with the sub-nav open. Industry and Category are tags (max 2
 * + a "+N" tooltip); clicking a tag applies it as the page scope, so each tag
 * carries a small Search icon. Actions are icon-only buttons (tooltip +
 * aria-label) in a sticky-right column.
 */
import { memo, type ReactNode } from "react";
import { Search, Trophy } from "lucide-react";
import type { AdvertiserKind, Scope } from "@/lib/insights-v3/types";
import { formatDays, type AdvertiserRow, type RankedItem } from "@/lib/insights-v3/selectors";
import { Hint, NewBadge, TruncatedText, TrendSpark, fmtInt, fmtPct, useDetailStack } from "../shared";
import { FollowButton, MarkCompetitorButton, SaveDownload } from "./ActionButtons";
import { advertiserColumns } from "./columns";
import { AdvertiserAvatar } from "./parts";
import { Cell, ClickableRow, TableFrame } from "./tableParts";

export type PickScope = (patch: { industry?: string; category?: string }) => void;

/** "12 ads · ● 4 active" on one line (shared with the LP & Offers table). */
export function AdsTotalActive({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(total)}</span>
      <span>{total === 1 ? "ad" : "ads"}</span>
      <span aria-hidden="true">·</span>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${active > 0 ? "bg-success-text" : "bg-muted-foreground/50"}`} />
      <span className="font-mono tabular-nums text-foreground">{fmtInt(active)}</span>
      <span>active</span>
    </div>
  );
}

const TAG_BASE =
  "inline-flex h-5 min-w-0 max-w-full items-center gap-1 rounded-full border border-border bg-muted/60 px-1.5 text-[11px] text-foreground";
const TAG_FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Up to 2 clickable tags (click = search this industry / category) + a "+N" tag listing the rest. */
function ScopeTags({
  items,
  group,
  onPick,
}: {
  items: RankedItem[];
  group: "industry" | "category";
  onPick?: PickScope;
}) {
  if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const rest = items.slice(2);
  const tag = (it: RankedItem) =>
    onPick ? (
      <Hint key={it.id} content={`Filter by ${group} ${it.label}`}>
        <button
          type="button"
          aria-label={`Filter by ${group} ${it.label}`}
          onClick={(e) => {
            e.stopPropagation();
            onPick({ [group]: it.id });
          }}
          className={`${TAG_BASE} ${TAG_FOCUS} hover:border-primary/40 hover:bg-primary/10 hover:text-primary-text`}
        >
          <Search className="h-3 w-3 shrink-0 text-primary-text" aria-hidden="true" />
          <span className="min-w-0 truncate">{it.label}</span>
        </button>
      </Hint>
    ) : (
      <span key={it.id} className={TAG_BASE}>
        <span className="min-w-0 truncate">{it.label}</span>
      </span>
    );
  // Tag 1 on its own line; tag 2 + "+N" share the second line, so every row has the same shape.
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      {tag(items[0])}
      {items[1] && (
        <div className="flex max-w-full min-w-0 items-center gap-1">
          {tag(items[1])}
          {rest.length > 0 && (
            <Hint content={`${group === "industry" ? "More industries" : "More categories"}: ${rest.map((r) => r.label).join(", ")}`}>
              <span
                tabIndex={0}
                aria-label={`${rest.length} more ${group === "industry" ? "industries" : "categories"}: ${rest.map((r) => r.label).join(", ")}`}
                className={`${TAG_BASE} shrink-0 font-mono tabular-nums text-muted-foreground ${TAG_FOCUS}`}
              >
                +{rest.length}
              </span>
            </Hint>
          )}
        </div>
      )}
    </div>
  );
}

const RowView = memo(function RowView({
  row,
  kind,
  scope,
  onPickScope,
}: {
  row: AdvertiserRow;
  kind: AdvertiserKind;
  scope: Scope;
  onPickScope?: PickScope;
}) {
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
        <AdsTotalActive total={row.totalAds} active={row.activeAds} />
      </Cell>
      <Cell>
        <div className="flex items-center gap-1 text-sm">
          <Trophy className={`h-3.5 w-3.5 shrink-0 ${row.winningAds > 0 ? "text-warning-text" : "text-muted-foreground"}`} aria-hidden="true" />
          <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(row.winningAds)}</span>
        </div>
      </Cell>
      <Cell className="text-xs leading-tight">
        {row.longestRunDays === null ? (
          <span className="italic text-muted-foreground">Start date unknown</span>
        ) : (
          <span className="font-mono tabular-nums text-foreground">{formatDays(row.longestRunDays)}</span>
        )}
      </Cell>
      <Cell>
        <div className="flex items-center gap-1.5">
          <TrendSpark series={row.launchTrend} variant="line" width={52} />
          <span className={`font-mono text-xs font-medium tabular-nums ${changeTone}`}>{change}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.launchTrend.unit}</div>
      </Cell>
      <Cell>
        <ScopeTags items={row.industries} group="industry" onPick={onPickScope} />
      </Cell>
      <Cell>
        <ScopeTags items={row.categories} group="category" onPick={onPickScope} />
      </Cell>
      <Cell>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.landingPageCount)}</span>
      </Cell>
      <Cell>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.offerCount)}</span>
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
  onPickScope,
}: {
  kind: AdvertiserKind;
  rows: AdvertiserRow[];
  scope: Scope;
  footer?: ReactNode;
  /** Called when an Industry / Category tag is clicked (applies it as the page scope). */
  onPickScope?: PickScope;
}) {
  return (
    <TableFrame label={kind === "page" ? "Pages" : "Domains"} columns={advertiserColumns(kind)} footer={footer}>
      {rows.map((r) => (
        <RowView key={r.id} row={r} kind={kind} scope={scope} onPickScope={onPickScope} />
      ))}
    </TableFrame>
  );
}
