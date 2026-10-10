/**
 * Creative breakdown, ONE merged view:
 *  1. framework, hook (style + verbatim line), angle, concept as clickable
 *     ElementChips (each opens its detail overlay) with Save, Download and Use in Genie
 *  2. script + storyboard + timeline TOGETHER, one row per beat from
 *     `analysis.beats` (element label, text, visual, start to end for video)
 *  3. transcript (collapsible)
 * Every missing piece is a DisabledSection that says why. Layout never collapses.
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FRAMEWORK_ELEMENT_LABEL, getElement } from "@/lib/insights-v3/data";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import type { Ad, ElementType, SavedItemRef, ScriptBeat } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import {
  DisabledSection,
  ElementActions,
  ElementChip,
  Hint,
  OverlaySection,
} from "@/components/insights-v3/shared";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";

/* ── elements ─────────────────────────────────────────────────────────── */

const ELEMENT_TITLE: Record<ElementType, string> = {
  framework: "Framework",
  hook: "Hook",
  angle: "Angle",
  concept: "Concept",
};

function ElementCard({
  type,
  id,
  detail,
  quote,
}: {
  type: ElementType;
  id: string | null;
  /** Small secondary line (confidence, the ad's own angle sentence). */
  detail?: string | null;
  /** Verbatim line (hook). */
  quote?: string | null;
}) {
  const ref: SavedItemRef = { type, id: id ?? "" };
  const count = useBoardCountForItem(ref);
  const title = ELEMENT_TITLE[type];

  const label = id ? getElement(type, id)?.label ?? null : null;
  if (!id || !label) {
    return (
      <DisabledSection
        title={title}
        reason={`No ${title.toLowerCase()} was identified for this ad.`}
        minHeight={96}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        <ElementActions
          target={ref}
          savedCount={count}
          buildDownload={() => buildDownloads(ref)}
          genieSlot={<UseInGenie target={ref} variant="icon" label={`Use this ${title.toLowerCase()} in Genie`} />}
        />
      </div>
      <div className="min-w-0">
        <ElementChip type={type} id={id} label={label} />
      </div>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      {quote && (
        <blockquote className="break-words border-l-2 border-primary/50 pl-2.5 text-[13px] italic leading-5 text-foreground">
          “{quote}”
        </blockquote>
      )}
    </div>
  );
}

/* ── script / storyboard / timeline ───────────────────────────────────── */

function fmtSec(n: number): string {
  const s = Math.max(0, Math.round(n));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Timeline({ beats }: { beats: ScriptBeat[] }) {
  const timed = beats.filter((b) => b.start !== null && b.end !== null && b.end > b.start);
  if (timed.length < 2) return null;
  const total = Math.max(...timed.map((b) => b.end as number));
  if (total <= 0) return null;
  return (
    <div className="mb-3" role="img" aria-label={`Timeline: ${timed.length} beats over ${fmtSec(total)}`}>
      <div className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-muted">
        {timed.map((b, i) => {
          const w = (((b.end as number) - (b.start as number)) / total) * 100;
          const label = FRAMEWORK_ELEMENT_LABEL[b.element] ?? b.element;
          return (
            <Hint key={i} content={`${label} · ${fmtSec(b.start as number)} to ${fmtSec(b.end as number)}`}>
              <span
                className={cn("h-full", i % 2 === 0 ? "bg-primary" : "bg-primary/50")}
                style={{ width: `${w}%` }}
              />
            </Hint>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>0:00</span>
        <span>{fmtSec(total)}</span>
      </div>
    </div>
  );
}

function ScriptSection({ ad }: { ad: Ad }) {
  const beats = ad.analysis.beats;
  const adRef: SavedItemRef = { type: "ad", id: ad.id };

  if (!beats || beats.length === 0) {
    return (
      <DisabledSection
        title="Script, storyboard and timeline"
        reason={
          ad.mediaKind === "video"
            ? "No script was captured for this video ad, so there are no beats to show."
            : "No script beats were captured for this image ad."
        }
        minHeight={120}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">
          Script, storyboard and timeline{" "}
          <span className="font-mono text-xs font-normal tabular-nums text-muted-foreground">({beats.length} beats)</span>
        </h4>
        <UseInGenie target={adRef} label="Use this script in Genie" />
      </div>
      <Timeline beats={beats} />
      <ol className="divide-y divide-border">
        {beats.map((b, i) => {
          const timed = b.start !== null && b.end !== null;
          return (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 py-2.5 sm:grid-cols-[76px_120px_1fr]">
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  timed ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {timed ? `${fmtSec(b.start as number)}–${fmtSec(b.end as number)}` : `Beat ${i + 1}`}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-text">
                {FRAMEWORK_ELEMENT_LABEL[b.element] ?? b.element}
              </span>
              <div className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
                <p className="break-words text-[13px] leading-5 text-foreground">{b.text}</p>
                {b.visual ? (
                  <p className="flex items-start gap-1.5 break-words text-xs text-muted-foreground">
                    <Eye className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    {b.visual}
                  </p>
                ) : (
                  <p className="text-xs italic text-muted-foreground">No visual note for this beat.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TranscriptSection({ ad }: { ad: Ad }) {
  const [open, setOpen] = useState(false);
  const text = ad.analysis.transcript;
  if (!text) {
    return (
      <DisabledSection
        title="Transcript"
        reason={ad.mediaKind === "video" ? "No transcript was captured for this video ad." : "No transcript: image ad."}
        minHeight={96}
      />
    );
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border bg-background">
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        Transcript
        <span className="font-mono text-xs font-normal tabular-nums text-muted-foreground">
          ({text.split(/\s+/).filter(Boolean).length} words)
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <p className="whitespace-pre-line break-words text-[13px] leading-5 text-foreground/90">{text}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── section ──────────────────────────────────────────────────────────── */

export function CreativeBreakdown({ ad }: { ad: Ad }) {
  const a = ad.analysis;
  const confidence = a.frameworkConfidence != null ? `${Math.round(a.frameworkConfidence * 100)}% match confidence` : null;

  return (
    <OverlaySection title="Creative breakdown" basedOn={1}>
      {a.summary && <p className="mb-3 text-sm leading-5 text-foreground/90">{a.summary}</p>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ElementCard type="framework" id={a.framework} detail={confidence} />
        <ElementCard type="hook" id={a.hookStyle} quote={a.hookText} />
        <ElementCard type="angle" id={a.angle} detail={a.angleText} />
        <ElementCard type="concept" id={a.concept} />
      </div>

      <div className="mt-3 space-y-2">
        <ScriptSection ad={ad} />
        <TranscriptSection ad={ad} />
      </div>
    </OverlaySection>
  );
}
