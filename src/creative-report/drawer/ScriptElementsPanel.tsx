/**
 * ScriptElementsPanel — Elements 2.0 (iter-2 W3): the literal ad script broken
 * into sections + copywriting framework, video frame-by-frame tags with a
 * drop-attribution highlight, the audio tag, and an audience-fit hypothesis.
 * Everything here is either a literal fact (script text, framework name,
 * frame list) or an already hypothesis-framed note from the data layer — no
 * composite score, no diagnosis language (handoff §7). Flat hairline-divided
 * rows, one sub-container level max — mirrors ComponentBreakdown.tsx.
 */
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NA_NO_VIDEO, truncate } from "@/creative-report/lib/format";
import { WhyDot } from "@/creative-report/components/WhyDot";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const FRAME_LABEL_MAX = 18;

const AUDIENCE_FIT_META: Record<
  "strong" | "moderate" | "weak",
  { label: string; className: string }
> = {
  strong: {
    label: "Strong fit",
    // Lime = the only "good/active" accent (WCAG-locked), same token ConfidenceChip uses for "high".
    className: "bg-primary/15 text-primary-text border-primary/30",
  },
  moderate: {
    label: "Moderate fit",
    className: "bg-muted text-muted-foreground border-border",
  },
  weak: {
    label: "Weak fit",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
};

/** Small inline marker for a possible (never certain) drop point. Neutral, not a diagnosis. */
function DropMarker() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5" />
      Possible drop point
    </span>
  );
}

export function ScriptElementsPanel({ rollup }: { rollup: CreativeRollup }) {
  const { creative } = rollup;
  const { script, elements } = creative;
  const isVideo = creative.format === "video";
  const drop = creative.likelyDropElement;

  return (
    <div>
      {/* 1. Script */}
      <div className="border-b border-border py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Script</span>
          <div className="flex items-center gap-1.5">
            <WhyDot id="drawer.script.framework" />
            <Badge variant="outline" className="text-[11px] font-medium leading-none">
              {script.framework}
            </Badge>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Hook line</p>
              {drop === "hook" && <DropMarker />}
            </div>
            <p className="text-sm font-medium italic text-foreground">"{script.sections.hookLine}"</p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Body</p>
            <p className="text-sm text-muted-foreground">{script.sections.body}</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">CTA line</p>
              {drop === "cta" && <DropMarker />}
            </div>
            <p className="text-sm font-medium text-foreground">"{script.sections.ctaLine}"</p>
          </div>
        </div>
      </div>

      {/* 2 + 3. Frames + Audio */}
      {!isVideo ? (
        <div className="border-b border-border py-3">
          <span className="text-sm font-medium text-foreground">Frames &amp; audio</span>
          <p className="mt-1 text-sm text-muted-foreground">{NA_NO_VIDEO}</p>
        </div>
      ) : (
        <>
          <div className="border-b border-border py-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Frames{elements.frames.length > 0 ? ` · ${elements.frames.length}` : ""}
              </span>
              <WhyDot id="drawer.script.dropAttribution" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {elements.frames.map((frame) => {
                const label = truncate(frame.label, FRAME_LABEL_MAX);
                return (
                  <span
                    key={frame.index}
                    title={label.truncated ? frame.label : undefined}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                      frame.dropoff
                        ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500 dark:text-amber-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="tabular-nums">{frame.index}</span>
                    {label.text}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="border-b border-border py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Audio</span>
              {drop === "audio" && <DropMarker />}
            </div>
            {elements.audio ? (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-foreground">{elements.audio.label}</p>
                <Badge variant="outline" className="text-[11px] font-medium leading-none">
                  {elements.audio.kind}
                </Badge>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{NA_NO_VIDEO}</p>
            )}
          </div>
        </>
      )}

      {/* 4. Audience fit */}
      <div className="py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">Audience fit</span>
            <WhyDot id="drawer.script.audienceFit" />
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
              AUDIENCE_FIT_META[elements.audienceFit.level].className,
            )}
          >
            {AUDIENCE_FIT_META[elements.audienceFit.level].label}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{elements.audienceFit.bestSegment}</p>
        <p className="text-sm text-muted-foreground">{elements.audienceFit.note}</p>
      </div>
    </div>
  );
}
