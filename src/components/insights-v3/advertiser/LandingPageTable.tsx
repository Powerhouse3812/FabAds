/**
 * LP & Offers list. One row = one landing page. Columns (spec): Page
 * (thumbnail, domain, title) · Offer · Funnel type · Ads (total + active, one
 * line: "12 ads · ● 4 active") · Competitors · Winners. A last Actions column carries Save + Download,
 * because landing pages are elements too (Q9).
 */
import { memo, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import type { Scope } from "@/lib/insights-v3/types";
import type { LandingPageRow } from "@/lib/insights-v3/selectors";
import { ElementChip, Hint, NewBadge, TruncatedText, fmtInt, useDetailStack } from "../shared";
import { SaveDownload } from "./ActionButtons";
import { LpThumb } from "./parts";
import { AdsTotalActive } from "./AdvertiserTable";
import { LP_COLUMNS } from "./columns";
import { Cell, ClickableRow, TableFrame } from "./tableParts";

const RowView = memo(function RowView({ row, scope }: { row: LandingPageRow; scope: Scope }) {
  const detail = useDetailStack();
  const label = row.title ?? row.domain;
  return (
    <ClickableRow onOpen={() => detail.push({ kind: "landing-page", id: row.id })} label={`Open landing page ${label}`}>
      <Cell sticky>
        <div className="flex min-w-0 items-center gap-3">
          <LpThumb url={row.screenshotUrl} title={label} className="h-14 w-10" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <TruncatedText text={row.domain} className="font-medium text-foreground" focusable={false} />
              {row.isNew && <NewBadge />}
            </div>
            {row.title ? (
              <TruncatedText text={row.title} className="mt-0.5 text-xs text-muted-foreground" focusable={false} />
            ) : (
              <span className="mt-0.5 block text-xs italic text-muted-foreground">Untitled page</span>
            )}
          </div>
        </div>
      </Cell>
      <Cell>
        {row.offerDomain ? (
          <ElementChip type="offer" id={row.offerDomain} label={row.offerDomain} />
        ) : (
          <Hint content="We couldn't trace where this page sends people, so there is no offer to show.">
            <span tabIndex={0} className="inline-flex h-6 items-center rounded-full border border-dashed border-border px-2 text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Not traced
            </span>
          </Hint>
        )}
      </Cell>
      <Cell className="text-xs">
        {row.funnelLabel ? (
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">
            {row.funnelLabel}
          </span>
        ) : (
          <Hint content="The funnel type couldn't be identified for this page.">
            <span tabIndex={0} className="text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              —
            </span>
          </Hint>
        )}
      </Cell>
      <Cell>
        <AdsTotalActive total={row.adsTotal} active={row.adsActive} />
      </Cell>
      <Cell>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.advertiserCount)}</span>
      </Cell>
      <Cell>
        <span className="inline-flex items-center gap-1 text-sm">
          <Trophy className={`h-3.5 w-3.5 ${row.winners > 0 ? "text-warning-text" : "text-muted-foreground"}`} aria-hidden="true" />
          <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(row.winners)}</span>
        </span>
      </Cell>
      <Cell stickyRight>
        <div className="flex items-center gap-1.5">
          <SaveDownload target={{ type: "landing-page", id: row.id }} scope={scope} />
        </div>
      </Cell>
    </ClickableRow>
  );
});

export function LandingPageTable({ rows, scope, footer }: { rows: LandingPageRow[]; scope: Scope; footer?: ReactNode }) {
  return (
    <TableFrame label="Landing pages" columns={LP_COLUMNS} footer={footer}>
      {rows.map((r) => (
        <RowView key={r.id} row={r} scope={scope} />
      ))}
    </TableFrame>
  );
}
