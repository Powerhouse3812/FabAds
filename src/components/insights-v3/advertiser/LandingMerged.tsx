/**
 * Landing pages + the pages / domains behind them, merged into ONE list (Competitor detail · Landing pages tab).
 * Row anatomy follows LandingPageList (thumb, URL, title, funnel, offer, ads); under each row sits who is
 * connected to it. A last group lists the other-side competitors whose ads here have no captured landing page.
 */
import { useId, useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import type { AdvertiserKind } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { ElementChip, TruncatedText, fmtInt, pluralize, useDetailStack } from "../shared";
import { shortUrl } from "./helpers";
import { LpThumb } from "./parts";
import type { Connected, MergedLanding } from "./LandingMergedModel";

const PREVIEW = 8;
const CHIPS_PER_ROW = 3;
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** "Run by" (page chips under a domain's landing page) or "Sends to" (domain chips under a page's). */
function otherSide(kind: AdvertiserKind) {
  return kind === "domain"
    ? { type: "page" as const, noun: "pages", row: "Run by", group: "Pages" }
    : { type: "domain" as const, noun: "domains", row: "Sends to", group: "Domains" };
}

function ChipRow({ kind, items, label, cap }: { kind: AdvertiserKind; items: Connected[]; label: string; cap: number }) {
  const side = otherSide(kind);
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, cap);
  const hidden = items.length - shown.length;
  return (
    <ul aria-label={label} className="flex min-w-0 flex-wrap items-center gap-1.5">
      {shown.map((c) => (
        <li key={c.id} className="max-w-full">
          <ElementChip type={side.type} id={c.id} label={c.name} count={c.count} />
        </li>
      ))}
      {items.length > cap && (
        <li>
          <button
            type="button"
            aria-expanded={all}
            aria-label={all ? `Show fewer ${side.noun}` : `Show ${hidden} more ${pluralize(hidden, side.noun)}`}
            onClick={() => setAll((v) => !v)}
            className={cn(
              "inline-flex h-6 items-center rounded-full border border-dashed border-primary/40 px-2 text-xs font-medium text-primary-text max-sm:h-8 hover:bg-primary/10",
              FOCUS,
            )}
          >
            {all ? "Show fewer" : `+${fmtInt(hidden)} more`}
          </button>
        </li>
      )}
    </ul>
  );
}

/** Closed by default: why the landing page list and the page / domain list used to disagree. */
function WhyNote({ kind }: { kind: AdvertiserKind }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const side = otherSide(kind);
  return (
    <div className="rounded-lg border border-border bg-background/60">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/5", FOCUS)}
      >
        Why were these two lists different?
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-primary-text transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="space-y-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <p>
            A landing page is a web page we captured: the place an ad sends people to. A {kind === "domain" ? "page" : "domain"} is the{" "}
            {kind === "domain" ? "brand that runs the ad" : "website the ad leads to"}.
          </p>
          <p>
            One {kind === "domain" ? "brand" : "domain"} can send its ads to many landing pages, and many {side.noun} can send to the same one. So the counts do
            not have to match.
          </p>
          <p>Ads whose landing page we could not capture show up only under “No landing page captured”.</p>
        </div>
      )}
    </div>
  );
}

export function LandingMerged({ kind, merged }: { kind: AdvertiserKind; merged: MergedLanding }) {
  const detail = useDetailStack();
  const side = otherSide(kind);
  const [all, setAll] = useState(false);
  const rows = all ? merged.rows : merged.rows.slice(0, PREVIEW);
  const hasLoose = merged.uncaptured.length > 0 || merged.uncapturedAds > 0;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(merged.rows.length)}</span>{" "}
        {pluralize(merged.rows.length, "landing pages")} ·{" "}
        <span className="font-mono font-semibold tabular-nums text-foreground">{fmtInt(merged.otherCount)}</span> {pluralize(merged.otherCount, side.noun)}
      </p>
      <WhyNote kind={kind} />

      {merged.rows.length > 0 && (
        <div>
          <ul className="divide-y divide-border" aria-label="Landing pages">
            {rows.map(({ row: r, connected }) => {
              const label = r.title ?? r.domain;
              return (
                <li key={r.id} className="py-2.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <button
                      type="button"
                      onClick={() => detail.push({ kind: "landing-page", id: r.id })}
                      aria-label={`Open landing page ${label}`}
                      className={cn("flex min-w-0 flex-1 basis-[260px] items-center gap-2.5 rounded-md text-left hover:bg-primary/5", FOCUS)}
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
                    {r.offerDomain ? (
                      <ElementChip type="offer" id={r.offerDomain} label={r.offerDomain} />
                    ) : (
                      <span className="shrink-0 text-xs italic text-muted-foreground">Not traced</span>
                    )}
                    <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">{fmtInt(r.adsTotal)}</span> {pluralize(r.adsTotal, "ads")}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", r.adsActive > 0 ? "bg-success-text" : "bg-muted-foreground/50")} />
                      <span className="text-foreground">{fmtInt(r.adsActive)}</span> active
                      {r.winners > 0 && (
                        <span className="ml-1 inline-flex items-center gap-1 text-warning-text">
                          <Trophy className="h-3 w-3" aria-hidden="true" />
                          <span className="font-semibold">{fmtInt(r.winners)}</span> {pluralize(r.winners, "winners")}
                        </span>
                      )}
                    </span>
                  </div>
                  {connected.length > 0 && (
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1 pl-[38px] max-sm:pl-0">
                      <span className="shrink-0 pt-0.5 text-xs text-muted-foreground max-sm:pt-1.5">{side.row}:</span>
                      <ChipRow kind={kind} items={connected} cap={CHIPS_PER_ROW} label={`${side.row} for ${label}`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {merged.rows.length > PREVIEW && (
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className={cn("mt-2 rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline", FOCUS)}
            >
              {all ? "Show fewer" : `Show all ${fmtInt(merged.rows.length)} landing pages`}
            </button>
          )}
        </div>
      )}

      {hasLoose && (
        <section aria-label="No landing page captured" className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <h4 className="text-xs font-semibold text-foreground">
            No landing page captured
            {merged.uncaptured.length > 0 && (
              <span className="ml-2 font-mono font-normal tabular-nums text-muted-foreground">
                {fmtInt(merged.uncaptured.length)} {pluralize(merged.uncaptured.length, side.noun)}
              </span>
            )}
          </h4>
          {merged.uncaptured.length > 0 ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                These {side.noun} have ads here, but we could not capture where those ads lead. The number is how many ads.
              </p>
              <div className="mt-2">
                <ChipRow kind={kind} items={merged.uncaptured} cap={12} label={`${side.group} with no landing page captured`} />
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {fmtInt(merged.uncapturedAds)} {pluralize(merged.uncapturedAds, "ads")} here {merged.uncapturedAds === 1 ? "has" : "have"} no landing page we could
              capture, so there is no {kind === "domain" ? "page" : "domain"} to list.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
