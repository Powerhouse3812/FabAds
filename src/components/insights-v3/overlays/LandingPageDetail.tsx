/**
 * Landing page detail overlay (spec: LP & Offers detail).
 *   Page capture (screenshot, final URL, status, words, searchable text) ·
 *   Funnel (type, redirect path, offer) · Ads + advertisers · Creative mix.
 * The capture and funnel come from the page itself, so they stay visible even
 * when no ad in the current scope sends traffic here.
 */
import { useMemo, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { buildDownloads, landingPageDetail } from "@/lib/insights-v3/selectors";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import { cn } from "@/lib/utils";
import {
  DetailOverlay,
  ElementActions,
  ElementChip,
  Hint,
  NewBadge,
  OverlaySection,
  TrendBars,
  TruncatedText,
  fmtInt,
} from "../shared";
import { shortUrl } from "../advertiser/helpers";
import { CopyValue, LpThumb, MixGroup, OverlayEmpty } from "../advertiser/parts";
import { AdStripSection, SubGrid, SummaryAndKpis } from "../advertiser/overlayParts";
import { PageTextSearch } from "../advertiser/PageTextSearch";
import { useAdvertiserCtx } from "../advertiser/useAdvertiserCtx";
import type { OverlayNav } from "./overlayNav";

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function StatusPill({ status }: { status: number | null }) {
  if (status === null) {
    return (
      <Hint content="We didn't record an HTTP status when this page was captured.">
        <span tabIndex={0} className="text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Not recorded
        </span>
      </Hint>
    );
  }
  const ok = status >= 200 && status < 300;
  const bad = status >= 400;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums",
        ok && "border-success-text/30 bg-success-text/10 text-success-text",
        bad && "border-error-text/30 bg-error-text/10 text-error-text",
        !ok && !bad && "border-warning-text/30 bg-warning-text/10 text-warning-text",
      )}
    >
      {status}
      {ok ? " OK" : bad ? " Error" : ""}
    </span>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-2 border-b border-border py-2 last:border-b-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function LandingPageDetail({ id, nav }: { id: string; nav: OverlayNav }) {
  const { scope, ctx, baseAds } = useAdvertiserCtx();
  const detail = useMemo(() => landingPageDetail(id, baseAds, scope, ctx), [id, baseAds, scope, ctx]);
  const savedCount = useBoardCountForItem({ type: "landing-page", id });
  const frame = { open: nav.open, backLabel: nav.backLabel, onBack: nav.onBack, onClose: nav.onClose, typeLabel: "Landing page" };

  if (!detail) {
    return (
      <DetailOverlay {...frame} title={id} subtitle="Not found">
        <OverlayEmpty
          title="This landing page isn't in the current scope"
          body="It may not exist, or it was removed from the index."
          onClose={nav.onClose}
        />
      </DetailOverlay>
    );
  }

  const { capture, funnel } = detail;
  const label = capture.title ?? detail.landingPage.domain;
  const noAds = detail.basedOn === 0;
  const hops = funnel.redirectPath;

  return (
    <DetailOverlay
      {...frame}
      title={label}
      avatar={<LpThumb url={capture.screenshotUrl} title={label} className="h-14 w-10" />}
      subtitle={
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {detail.isNew && <NewBadge />}
          <TruncatedText text={shortUrl(capture.url)} className="max-w-[420px] font-mono text-xs" />
          {funnel.label && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">{funnel.label}</span>
          )}
        </span>
      }
      actions={
        <ElementActions
          target={{ type: "landing-page", id }}
          savedCount={savedCount}
          buildDownload={() => buildDownloads({ type: "landing-page", id }, { scope, now: MODULE_NOW })}
        />
      }
    >
      <SummaryAndKpis
        summary={detail.summary}
        kpis={detail.kpis}
        basedOn={detail.basedOn}
        title="AI summary"
        disabledReason={noAds ? "No ad in the current scope sends traffic to this page, so there is nothing to summarise." : undefined}
      />

      {/* 1 · Page capture */}
      <OverlaySection title="Page capture">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <LpThumb
              url={capture.screenshotUrl}
              title={label}
              className={capture.screenshotUrl ? "aspect-[2/3] w-full max-w-[220px]" : "aspect-[4/3] w-full max-w-[220px]"}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {capture.screenshotUrl
                ? `Captured ${capture.capturedAt ? DATE.format(new Date(capture.capturedAt)) : "(date not recorded)"}`
                : "No screenshot was captured for this page."}
            </p>
          </div>
          <div className="min-w-0 space-y-3">
            <dl className="rounded-lg border border-border bg-background/60 px-3">
              <Fact label="Page URL">
                <CopyValue value={capture.url} label="Page URL" />
              </Fact>
              <Fact label="Final URL">
                {capture.finalUrl ? (
                  <CopyValue value={capture.finalUrl} label="Final URL" />
                ) : (
                  <Hint content="The page didn't resolve to a final URL when we captured it.">
                    <span tabIndex={0} className="text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Not recorded
                    </span>
                  </Hint>
                )}
              </Fact>
              <Fact label="HTTP status">
                <StatusPill status={capture.httpStatus} />
              </Fact>
              <Fact label="Word count">
                {capture.wordCount === null ? (
                  <Hint content="No page text was captured, so words can't be counted.">
                    <span tabIndex={0} className="text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Not recorded
                    </span>
                  </Hint>
                ) : (
                  <span className="font-mono tabular-nums">{fmtInt(capture.wordCount)}</span>
                )}
              </Fact>
            </dl>
            <PageTextSearch text={capture.pageText} />
          </div>
        </div>
      </OverlaySection>

      {/* 2 · Funnel */}
      <OverlaySection title="Funnel">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted-foreground">Type</span>
              {funnel.label ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-text">{funnel.label}</span>
              ) : (
                <Hint content="The funnel type couldn't be identified for this page.">
                  <span tabIndex={0} className="text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Not identified
                  </span>
                </Hint>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="text-xs text-muted-foreground">Offer page</span>
              {funnel.offerDomain ? (
                <ElementChip type="offer" id={funnel.offerDomain} label={funnel.offerDomain} />
              ) : (
                <Hint content="We couldn't trace where this page sends people, so there is no offer to open.">
                  <span tabIndex={0} className="text-xs italic text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Not traced
                  </span>
                </Hint>
              )}
            </div>
          </div>
          {hops.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Redirect path · <span className="font-mono tabular-nums text-foreground">{hops.length}</span> {hops.length === 1 ? "hop" : "hops"}, tracker hops removed
              </p>
              <ol className="flex flex-wrap items-center gap-1.5" aria-label="Redirect path">
                {hops.map((h, i) => (
                  <li key={`${i}-${h}`} className="flex min-w-0 items-center gap-1.5">
                    <span className="inline-flex h-7 min-w-0 max-w-[240px] items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs">
                      <span className="font-mono text-[11px] tabular-nums text-primary-text">{i + 1}</span>
                      <TruncatedText text={shortUrl(h)} tooltip={h} />
                    </span>
                    {i < hops.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="then" role="img" />}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">No redirect path was recorded for this page.</p>
          )}
        </div>
      </OverlaySection>

      {/* 3 · Ads + advertisers */}
      <AdStripSection
        title="Ads sending traffic here"
        adIds={detail.ads.adIds.slice(0, 12)}
        basedOn={detail.ads.basedOn}
        emptyReason="No ad in the current scope sends traffic to this page."
      />
      <OverlaySection
        title="Competitors using this page"
        basedOn={detail.advertisers.basedOn}
        disabledReason={noAds ? "No competitor in the current scope sends traffic to this page." : undefined}
        minHeight={110}
      >
        <SubGrid>
          <MixGroup title="Pages (brands)" type="page" mix={{ basedOn: detail.advertisers.basedOn, items: detail.advertisers.pages.slice(0, 12) }} emptyReason="No page runs ads to it in this scope." />
          <MixGroup title="Domains" type="domain" mix={{ basedOn: detail.advertisers.basedOn, items: detail.advertisers.domains.slice(0, 12) }} emptyReason="None of these ads belong to a known domain." />
        </SubGrid>
      </OverlaySection>

      <TrendBars
        className="h-auto"
        series={detail.trend}
        title="Ads launched to this page"
        basedOn={detail.trend.basedOn}
        emptyReason="No ad launched to this page in the picked period, so there is nothing to chart."
      />

      {/* 4 · Creative mix */}
      <OverlaySection
        title="Creative mix: what sends traffic here"
        basedOn={detail.basedOn}
        disabledReason={noAds ? "No ad in the current scope sends traffic to this page, so there is no creative mix." : undefined}
        minHeight={140}
      >
        <SubGrid>
          <MixGroup title="Hooks" type="hook" mix={detail.creativeMix.hooks} emptyReason="No hook style was identified in these ads." />
          <MixGroup title="Angles" type="angle" mix={detail.creativeMix.angles} emptyReason="No angle was identified in these ads." />
          <MixGroup title="Frameworks" type="framework" mix={detail.creativeMix.frameworks} emptyReason="No framework was identified in these ads." />
          <MixGroup title="Concepts" type="concept" mix={detail.creativeMix.concepts} emptyReason="No concept was identified in these ads." />
        </SubGrid>
      </OverlaySection>
    </DetailOverlay>
  );
}
