/**
 * Creative breakdown, ONE merged view:
 *  1. framework, hook (style + verbatim line), angle, concept as clickable
 *     ElementChips (each opens its detail overlay) with Save, Download and Use in Genie
 *  2. script + framework row + storyboard TOGETHER: a Video Sage style segmented
 *     row of framework elements (in beat order, plain text, not interactive) and one
 *     row per beat from `analysis.beats` (element label, text, visual, start to end)
 * The transcript lives in the Landing page section, not here.
 * Every missing piece is a DisabledSection that says why. Layout never collapses.
 */
import { Eye } from "lucide-react";
import { FRAMEWORK_ELEMENT_LABEL, getElement } from "@/lib/insights-v3/data";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import { useBoardCountForItem } from "@/lib/insights-v3/stores";
import type { Ad, ElementType, SavedItemRef, ScriptBeat } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import {
  DisabledSection,
  ElementActions,
  ElementChip,
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

/** Neighbouring segments step through three tints so each one reads on its own. */
const SEGMENT_FILL = ["bg-primary/15", "bg-primary/25", "bg-primary/35"] as const;

/**
 * Video Sage style segmented row (see components/video-sage/FrameworkTimeline): one
 * segment per beat, in order. Width follows duration when every beat is timed, else
 * equal. Not interactive: order, label and timing are plain visible text. Segments
 * wrap onto a new line rather than hiding a label on a narrow drawer.
 */
function FrameworkRow({ beats }: { beats: ScriptBeat[] }) {
  const allTimed = beats.every((b) => b.start !== null && b.end !== null && (b.end as number) > (b.start as number));
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Framework elements, in order
      </p>
      <ol className="flex flex-wrap gap-0.5">
        {beats.map((b, i) => {
          const label = FRAMEWORK_ELEMENT_LABEL[b.element] ?? b.element;
          const weight = allTimed ? (b.end as number) - (b.start as number) : 1;
          const timed = b.start !== null && b.end !== null;
          return (
            <li
              key={i}
              data-testid="framework-segment"
              className={cn(
                "flex min-w-[76px] flex-col justify-between gap-1 rounded-md px-2 py-1.5",
                SEGMENT_FILL[i % SEGMENT_FILL.length],
              )}
              style={{ flex: `${weight} 1 0%` }}
            >
              <span className="font-mono text-[10px] font-semibold tabular-nums text-primary-text">{i + 1}</span>
              <span className="break-words text-[11px] font-semibold leading-tight text-foreground">{label}</span>
              {timed && (
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {fmtSec(b.start as number)}–{fmtSec(b.end as number)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
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
      <FrameworkRow beats={beats} />
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
      </div>
    </OverlaySection>
  );
}
