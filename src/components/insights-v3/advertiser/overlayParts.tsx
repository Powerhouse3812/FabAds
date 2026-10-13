/**
 * Building blocks for the advertiser / landing-page / offer overlays.
 * Presentational: data arrives from the detail selectors.
 */
import { useState, type ReactNode } from "react";
import { getAd } from "@/lib/insights-v3/data";
import type { AiSummary, Kpi } from "@/lib/insights-v3/types";
import type { LandingPageRow } from "@/lib/insights-v3/selectors";
import {
  AiSummaryBlock,
  BasedOnNote,
  ElementChip,
  KpiRow,
  OverlaySection,
  TruncatedText,
  fmtInt,
  useAdDrawer,
  useDetailStack,
} from "../shared";
import { AdCard } from "../ad-card/AdCard";
import { shortUrl } from "./helpers";
import { LpThumb } from "./parts";

/** AI summary (lime box, with its own "Based on") + KPI tiles. */
export function SummaryAndKpis({
  summary,
  kpis,
  basedOn,
  title = "AI strategy summary",
  disabledReason,
}: {
  summary: AiSummary;
  kpis: Kpi[];
  basedOn: number;
  title?: string;
  disabledReason?: string;
}) {
  return (
    <div className="space-y-3">
      <AiSummaryBlock summary={summary} title={title} disabledReason={disabledReason} />
      <div className="space-y-1.5">
        <KpiRow kpis={kpis} aria-label={`${title}: key numbers`} />
        <BasedOnNote ads={basedOn} />
      </div>
    </div>
  );
}

/** Horizontal strip of AdCards (winners / longest running). Click opens the ad drawer. */
export function AdStrip({ adIds, label }: { adIds: string[]; label: string }) {
  const drawer = useAdDrawer();
  const ads = adIds.map((id) => getAd(id)).filter((a): a is NonNullable<typeof a> => !!a);
  return (
    <ul aria-label={label} className="-mx-1 flex snap-x items-start gap-3 overflow-x-auto px-1 pb-2">
      {ads.map((ad) => (
        <li key={ad.id} className="w-[280px] shrink-0 snap-start">
          <AdCard ad={ad} onOpen={drawer.open} />
        </li>
      ))}
    </ul>
  );
}

/** One OverlaySection holding an AdStrip, disabled with a reason when empty. */
export function AdStripSection({
  title,
  adIds,
  basedOn,
  emptyReason,
}: {
  title: string;
  adIds: string[];
  basedOn: number;
  emptyReason: string;
}) {
  return (
    <OverlaySection title={title} basedOn={basedOn} disabledReason={adIds.length === 0 ? emptyReason : undefined} minHeight={140}>
      <AdStrip adIds={adIds} label={title} />
    </OverlaySection>
  );
}

const PREVIEW = 8;

/** Landing pages list; each row opens the LP overlay, the offer chip opens the offer overlay. */
export function LandingPageList({ rows, showOffer = true }: { rows: LandingPageRow[]; showOffer?: boolean }) {
  const detail = useDetailStack();
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, PREVIEW);
  return (
    <div>
      <ul className="divide-y divide-border" aria-label="Landing pages">
        {shown.map((r) => {
          const label = r.title ?? r.domain;
          return (
            <li key={r.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <button
                type="button"
                onClick={() => detail.push({ kind: "landing-page", id: r.id })}
                aria-label={`Open landing page ${label}`}
                className="flex min-w-0 flex-1 basis-[260px] items-center gap-2.5 rounded-md text-left hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LpThumb url={r.screenshotUrl} title={label} className="h-10 w-7" />
                <span className="min-w-0 flex-1">
                  <TruncatedText text={shortUrl(r.landingPage.url)} className="text-sm font-medium text-foreground" focusable={false} />
                  <TruncatedText text={r.title ?? "Untitled page"} className="text-xs text-muted-foreground" focusable={false} />
                </span>
              </button>
              {r.funnelLabel && (
                <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">
                  {r.funnelLabel}
                </span>
              )}
              {showOffer &&
                (r.offerDomain ? (
                  <ElementChip type="offer" id={r.offerDomain} label={r.offerDomain} />
                ) : (
                  <span className="shrink-0 text-xs italic text-muted-foreground">Not traced</span>
                ))}
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{fmtInt(r.adsTotal)}</span> ads ·{" "}
                <span className="text-foreground">{fmtInt(r.adsActive)}</span> active
              </span>
            </li>
          );
        })}
      </ul>
      {rows.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {all ? "Show fewer" : `Show all ${fmtInt(rows.length)} landing pages`}
        </button>
      )}
    </div>
  );
}

/** Two-column responsive grid for sub-blocks inside a section. */
export function SubGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>;
}
