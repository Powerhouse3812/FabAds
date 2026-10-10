/**
 * Landing page + offer + funnel: page capture thumbnail, title, funnel type,
 * offer domain ("Not traced"), redirect path. Click opens the landing page or
 * offer overlay (detail stack). No landing page → a DisabledSection.
 */
import { ChevronRight, ImageOff } from "lucide-react";
import { getLandingPage } from "@/lib/insights-v3/data";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import { FUNNEL_TYPE_LABEL, type Ad } from "@/lib/insights-v3/types";
import {
  DisabledSection,
  ElementActions,
  ElementChip,
  OverlaySection,
  TruncatedText,
  useDetailStack,
} from "@/components/insights-v3/shared";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-start gap-2">
      <dt className="pt-0.5 text-[11px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function LandingPanel({ ad }: { ad: Ad }) {
  const detail = useDetailStack();
  const lp = ad.landingPageId ? getLandingPage(ad.landingPageId) : undefined;
  const lpRef = { type: "landing-page" as const, id: ad.landingPageId ?? "" };
  const saved = useBoardCountForItem(lpRef);

  if (!lp) {
    return (
      <DisabledSection
        title="Landing page, offer and funnel"
        reason="No landing page was captured for this ad, so the offer and funnel path aren't known."
        minHeight={140}
      />
    );
  }

  const title = lp.title ?? lp.domain;
  const open = () => detail.push({ kind: "landing-page", id: lp.id });
  const hops = lp.redirectPath ?? [];

  return (
    <OverlaySection
      title="Landing page, offer and funnel"
      basedOn={1}
      action={
        <ElementActions target={lpRef} savedCount={saved} buildDownload={() => buildDownloads(lpRef)} />
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr]">
        <button
          type="button"
          onClick={open}
          aria-label={`Open landing page details: ${title}`}
          className="group relative flex h-[110px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {lp.screenshotUrl ? (
            <img src={lp.screenshotUrl} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
          ) : (
            <span className="flex flex-col items-center gap-1 px-2 text-center text-[11px]">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
              No page capture
            </span>
          )}
        </button>

        <dl className="min-w-0 space-y-2">
          <Row label="Landing page">
            <button
              type="button"
              onClick={open}
              className="block max-w-full rounded-sm text-left font-medium hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TruncatedText text={title} focusable={false} />
            </button>
            <TruncatedText text={lp.domain} className="font-mono text-[11px] text-muted-foreground" />
          </Row>
          <Row label="Funnel type">
            {lp.funnelType ? (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text">
                {FUNNEL_TYPE_LABEL[lp.funnelType]}
              </span>
            ) : (
              <span className="text-xs italic text-muted-foreground">Not identified</span>
            )}
          </Row>
          <Row label="Offer domain">
            {lp.offerDomain ? (
              <ElementChip type="offer" id={lp.offerDomain} label={lp.offerDomain} />
            ) : (
              <span className="text-xs italic text-muted-foreground">Not traced</span>
            )}
          </Row>
          <Row label="Redirect path">
            {hops.length > 0 ? (
              <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 font-mono text-[11px] text-muted-foreground">
                {hops.map((h, i) => (
                  <li key={i} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    <TruncatedText text={h.replace(/^https?:\/\//, "")} className="max-w-[200px]" />
                  </li>
                ))}
              </ol>
            ) : (
              <span className="text-xs italic text-muted-foreground">No redirect hops recorded</span>
            )}
          </Row>
        </dl>
      </div>
    </OverlaySection>
  );
}
