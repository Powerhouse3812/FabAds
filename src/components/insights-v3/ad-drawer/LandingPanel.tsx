/**
 * Landing page + offer + funnel: page capture thumbnail, title, funnel type,
 * offer domain ("Not traced"), redirect path. Click opens the landing page or
 * offer overlay (detail stack). The ad transcript lives here too: it is simply
 * what the landing page says, written as a paragraph, so it renders at the
 * bottom of this section in a fixed-height scroll box.
 *
 * States: no page AND no transcript → a DisabledSection. Page without
 * transcript, or transcript without page → the section with a one-line note.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, FileText, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** Muted one-liner for a half-empty section. Never a big disabled box. */
function MissingNote({ children, divided }: { children: React.ReactNode; divided?: boolean }) {
  return (
    <p className={cn("text-xs text-muted-foreground", divided && "mt-3 border-t border-border pt-3")}>{children}</p>
  );
}

/**
 * The transcript: fixed-height box with its own vertical scroll so a very long
 * script never stretches the drawer. Keyboard reachable (tab stop + focus ring)
 * and a bottom fade shows there is more below until the reader hits the end.
 */
function TranscriptBlock({ text, divided }: { text: string; divided?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const words = text.split(/\s+/).filter(Boolean).length;

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [text, update]);

  return (
    <div className={cn(divided && "mt-4 border-t border-border pt-3")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <FileText className="h-4 w-4 shrink-0 text-primary-text" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-foreground">Transcript</h4>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-primary-text">
          {words.toLocaleString("en-US")} {words === 1 ? "word" : "words"}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">What the landing page says</p>
      <div className="relative mt-2">
        <div
          ref={ref}
          role="region"
          aria-label="Transcript"
          tabIndex={0}
          onScroll={update}
          className="h-40 overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-muted/30 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="whitespace-pre-line break-words text-[13px] leading-5 text-foreground/90">{text}</p>
        </div>
        {moreBelow && (
          <div
            aria-hidden="true"
            data-testid="transcript-fade"
            className="pointer-events-none absolute inset-x-px bottom-px h-8 rounded-b-lg bg-gradient-to-t from-muted to-transparent"
          />
        )}
      </div>
    </div>
  );
}

export function LandingPanel({ ad }: { ad: Ad }) {
  const detail = useDetailStack();
  const lp = ad.landingPageId ? getLandingPage(ad.landingPageId) : undefined;
  const lpRef = { type: "landing-page" as const, id: ad.landingPageId ?? "" };
  const saved = useBoardCountForItem(lpRef);
  const transcript = ad.analysis.transcript?.trim() ? ad.analysis.transcript : null;

  if (!lp && !transcript) {
    return (
      <DisabledSection
        title="Landing page, offer and funnel"
        reason="No landing page was captured for this ad, so the offer and funnel path aren't known."
        minHeight={140}
      />
    );
  }

  if (!lp) {
    // Transcript only: nothing to save or open, so no basedOn note or element actions.
    return (
      <OverlaySection title="Landing page, offer and funnel">
        <MissingNote>No landing page was captured for this ad.</MissingNote>
        <TranscriptBlock text={transcript!} divided />
      </OverlaySection>
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

      {transcript ? (
        <TranscriptBlock text={transcript} divided />
      ) : (
        <MissingNote divided>No transcript was captured for this ad.</MissingNote>
      )}
    </OverlaySection>
  );
}
