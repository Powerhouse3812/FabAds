/**
 * Competitor detail · Offers: the offers a competitor's landing pages send people to,
 * one row per offer (grouped from the landing-page rows by `offerDomain`).
 */
import { useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { formatDays, type LandingPageRow } from "@/lib/insights-v3/selectors";
import { BasedOnNote, ElementChip, fmtInt, pluralize } from "../shared";

export const OFFER_PREVIEW = 8;
const MAX_FUNNEL_PILLS = 2;

export interface OfferRow {
  /** The offer domain: also the id the offer overlay opens with. */
  offer: string;
  landingPages: number;
  adsTotal: number;
  adsActive: number;
  winners: number;
  longestRunDays: number | null;
  /** Distinct funnel types, most landing pages first. */
  funnels: string[];
  /** Any of this offer's landing pages is rising. */
  isRising: boolean;
}

export interface OfferGroups {
  offers: OfferRow[];
  /** Landing pages with no traced offer. */
  untracedLandingPages: number;
  /** Ads that lead to a traced offer. */
  adsBehindOffers: number;
}

/** Pure: landing-page rows → offer rows (most ads first) + the untraced count. */
export function groupOffers(rows: LandingPageRow[]): OfferGroups {
  const byOffer = new Map<string, LandingPageRow[]>();
  let untraced = 0;
  for (const r of rows) {
    if (!r.offerDomain) {
      untraced += 1;
      continue;
    }
    const list = byOffer.get(r.offerDomain);
    if (list) list.push(r);
    else byOffer.set(r.offerDomain, [r]);
  }
  const offers: OfferRow[] = [...byOffer.entries()].map(([offer, lps]) => {
    const funnelCount = new Map<string, number>();
    for (const lp of lps) if (lp.funnelLabel) funnelCount.set(lp.funnelLabel, (funnelCount.get(lp.funnelLabel) ?? 0) + 1);
    const runs = lps.map((l) => l.longestRunDays).filter((d): d is number => typeof d === "number");
    return {
      offer,
      landingPages: lps.length,
      adsTotal: lps.reduce((s, l) => s + l.adsTotal, 0),
      adsActive: lps.reduce((s, l) => s + l.adsActive, 0),
      winners: lps.reduce((s, l) => s + l.winners, 0),
      longestRunDays: runs.length ? Math.max(...runs) : null,
      funnels: [...funnelCount.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([label]) => label),
      isRising: lps.some((l) => l.isRising),
    };
  });
  offers.sort((a, b) => b.adsTotal - a.adsTotal || (a.offer < b.offer ? -1 : 1));
  return { offers, untracedLandingPages: untraced, adsBehindOffers: offers.reduce((s, o) => s + o.adsTotal, 0) };
}

function OfferRowView({ row }: { row: OfferRow }) {
  const shownFunnels = row.funnels.slice(0, MAX_FUNNEL_PILLS);
  const moreFunnels = row.funnels.length - shownFunnels.length;
  return (
    <li className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        <ElementChip type="offer" id={row.offer} label={row.offer} />
        {row.isRising && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success-text/30 bg-success-text/10 px-2 py-0.5 text-[11px] font-medium leading-4 text-success-text">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            Rising
          </span>
        )}
        {shownFunnels.map((f) => (
          <span key={f} className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-4 text-primary-text">
            {f}
          </span>
        ))}
        {moreFunnels > 0 && (
          <span
            title={row.funnels.slice(MAX_FUNNEL_PILLS).join(", ")}
            className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] leading-4 tabular-nums text-muted-foreground"
          >
            +{moreFunnels}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums text-foreground">{fmtInt(row.landingPages)}</span>{" "}
          {pluralize(row.landingPages, "landing pages")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span>
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.adsTotal)}</span>{" "}
            {pluralize(row.adsTotal, "ads")}
          </span>
          <span aria-hidden="true">·</span>
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${row.adsActive > 0 ? "bg-success-text" : "bg-muted-foreground/50"}`}
          />
          <span>
            <span className="font-mono tabular-nums text-foreground">{fmtInt(row.adsActive)}</span> active
          </span>
        </span>
        <span className="inline-flex items-center gap-1" aria-label={`${row.winners} ${row.winners === 1 ? "winner" : "winners"}`}>
          <Trophy className={`h-3.5 w-3.5 ${row.winners > 0 ? "text-warning-text" : "text-muted-foreground"}`} aria-hidden="true" />
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{fmtInt(row.winners)}</span>
        </span>
        <span>
          {row.longestRunDays === null ? (
            <span className="italic">Start date unknown</span>
          ) : (
            <>
              Longest run <span className="font-mono tabular-nums text-foreground">{formatDays(row.longestRunDays)}</span>
            </>
          )}
        </span>
      </div>
    </li>
  );
}

export function OffersList({ groups, landingPageCount }: { groups: OfferGroups; landingPageCount: number }) {
  const [all, setAll] = useState(false);
  const { offers, untracedLandingPages, adsBehindOffers } = groups;
  const shown = all ? offers : offers.slice(0, OFFER_PREVIEW);
  return (
    <section aria-label="Offers" className="rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            <span className="font-mono tabular-nums">{fmtInt(offers.length)}</span> {pluralize(offers.length, "offers")} ·{" "}
            <span className="font-mono tabular-nums">{fmtInt(landingPageCount)}</span> {pluralize(landingPageCount, "landing pages")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">The offers this competitor&apos;s landing pages send people to.</p>
        </div>
        <BasedOnNote ads={adsBehindOffers} />
      </header>
      <ul aria-label="Offers" className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
        {shown.map((o) => (
          <OfferRowView key={o.offer} row={o} />
        ))}
      </ul>
      {offers.length > OFFER_PREVIEW && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {all ? "Show fewer" : `Show all ${fmtInt(offers.length)}`}
        </button>
      )}
      {untracedLandingPages > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{fmtInt(untracedLandingPages)}</span>{" "}
          {pluralize(untracedLandingPages, "landing pages")} send to an offer we could not trace
        </p>
      )}
    </section>
  );
}
