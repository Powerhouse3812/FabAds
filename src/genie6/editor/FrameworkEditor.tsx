import { useEffect, useRef, useState } from "react";
import { Clapperboard, Film, RefreshCw, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCredits, creditsLabel } from "../lib/credits";
import type { Provenance } from "../lib/genieRunTypes";
import { StageProgress, FailureNotice } from "../progress";
import { startBatch, useBatch, retry } from "../lib/genieRunStore";
import type { Framework, FrameworkSection } from "./frameworks";
import { frameworkDuration } from "./frameworks";
import type { OutputData } from "../types/output";
import { SwapFromCatalogueDialog, type SwapResult } from "./SwapPicker";
import { sectionBreakdown } from "./editorCredits";

/**
 * FrameworkEditor — §14's FIRST model. "The generated video breaks into its
 * structural sections... The user selects a section and swaps it from the
 * Catalogue's saved assets, or regenerates just that section." A-roll/B-roll
 * replacement rides the SAME swap affordance (§21.2) — see SwapPicker.
 *
 * §22 BACKEND-GATE ASSUMPTION (open question 1, still unanswered by Pranav):
 * "Can the pipeline return per-section time ranges, and regenerate one
 * section without re-rendering the whole video? If not, the editor becomes
 * queue-and-notify rather than edit-and-see." This component builds the
 * edit-and-see interaction (inline StageProgress, live-updating section
 * thumbnail on completion) — but "Regenerate this section" is wired through
 * `startBatch()` / the shared progress pattern EXACTLY like a full render
 * would be, not a fake instant swap. If the real answer turns out to be
 * "no, only a full re-render," this same call just takes longer and the
 * same BatchProgressHeader-class UI (here: inline StageProgress +
 * FailureNotice) already degrades to queue-and-notify with zero rework —
 * the assumption is in the WIRING, not in a shortcut that would need
 * unwinding later.
 */

const PROVENANCE_META: Record<Provenance, { label: string; className: string }> = {
  "fabfunnel-seeded": { label: "FabFunnel", className: "border-border bg-muted text-muted-foreground" },
  "client-created": { label: "Your framework", className: "border-primary/30 bg-primary/10 text-primary-text" },
};

const REGEN_STAGES = ["Queued", "Re-rendering beat", "Compositing", "Finalizing"];

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * §21.2 — was a literal `a-roll ? 4 : 2`, unrelated to the whole-video price
 * and blind to how long the section actually is. Now derived from the
 * section's own duration through computeBreakdown(), the same path
 * VideoEditor's whole-video figure takes, so five section regenerations and
 * one whole-video regeneration can no longer quote unrelated numbers.
 */
function regenCost(section: FrameworkSection): number {
  return sectionBreakdown(section).total;
}

export interface FrameworkEditorProps {
  output: OutputData;
  framework: Framework;
  onSectionChange: (sectionId: string, patch: Partial<FrameworkSection>) => void;
  className?: string;
}

export function FrameworkEditor({ output, framework, onSectionChange, className }: FrameworkEditorProps) {
  const sections = framework.sections;
  const total = frameworkDuration(framework);
  const [selectedId, setSelectedId] = useState(sections[0]?.id);
  const [playhead, setPlayhead] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const [regenBatchId, setRegenBatchId] = useState<string | null>(null);

  const selected = sections.find((s) => s.id === selectedId) ?? sections[0];
  const selectedIndex = sections.findIndex((s) => s.id === selected?.id);
  const regenBatch = useBatch(regenBatchId ?? "");
  const regenItem = regenBatch?.items[0];
  const isImageSequence = framework.mediaKind === "image-sequence";
  const [imageDisplayMode, setImageDisplayMode] = useState<"carousel" | "separate-ads">(
    framework.imageOutputMode ?? "carousel",
  );

  const provMeta = PROVENANCE_META[framework.provenance];

  // Roving tabindex needs DOM focus to actually follow the selection, or a
  // screen-reader user pressing ArrowRight again never hears the next tab's
  // label — only the visual highlight would move.
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const select = (id: string, index: number) => {
    setSelectedId(id);
    setPlayhead(sections[index]?.startSec ?? 0);
    tabRefs.current[index]?.focus();
  };

  const onStripKeyDown = (e: React.KeyboardEvent) => {
    if (sections.length === 0) return;
    let next = selectedIndex;
    if (e.key === "ArrowRight") next = Math.min(selectedIndex + 1, sections.length - 1);
    else if (e.key === "ArrowLeft") next = Math.max(selectedIndex - 1, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = sections.length - 1;
    else return;
    e.preventDefault();
    select(sections[next].id, next);
  };

  const startRegenerate = () => {
    if (!selected) return;
    const batchId = startBatch({
      origin: { kind: "studio" },
      label: `${output.brand?.name ?? "Output"} · Regenerate ${selected.name}`,
      stages: REGEN_STAGES,
      count: 1,
      creditsPerItem: regenCost(selected),
    });
    setRegenBatchId(batchId);
  };

  const handleSwap = (result: SwapResult) => {
    if (!selected) return;
    onSectionChange(selected.id, {
      ...(result.thumbnail ? { thumbnail: result.thumbnail } : {}),
      ...(result.roll ? { roll: result.roll } : {}),
      note: result.source === "media" ? `Swapped in — ${result.label}` : `Line swapped from ${result.source} — ${result.label}`,
      ...(result.dialogue ? { dialogue: result.dialogue } : {}),
    });
  };

  // Regeneration reached a terminal state — fold the result back into the
  // section and stop tracking the batch (does NOT auto-clear a failure —
  // §18: a failure stays visible with Retry, it never just disappears).
  useEffect(() => {
    if (regenItem?.status === "done" && selected) {
      onSectionChange(selected.id, {
        thumbnail: `https://picsum.photos/seed/regen-${selected.id}-${Date.now()}/400/225`,
        note: undefined,
      });
      setRegenBatchId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenItem?.status]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Framework identity */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{framework.name}</span>
            {framework.fullName && (
              <span className="truncate text-[12px] text-muted-foreground">{framework.fullName}</span>
            )}
          </div>
          {framework.description && (
            <p className="line-clamp-1 text-[11px] text-muted-foreground">{framework.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em]",
              provMeta.className,
            )}
          >
            {provMeta.label}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {formatCredits(framework.usageCount)} runs
          </span>
        </div>
      </div>

      {/* §22 item 3 — still open. This framework doesn't answer it; the
          toggle below just picks a READING to render, nothing is hardcoded. */}
      {isImageSequence && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-border bg-muted/30 p-3">
          <p className="text-[11px] text-muted-foreground">
            Storyboard-for-image output shape is still open with Pranav — showing this as:
          </p>
          <div className="flex shrink-0 gap-1 rounded-full border border-border bg-background p-0.5">
            {(["carousel", "separate-ads"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={imageDisplayMode === mode}
                onClick={() => setImageDisplayMode(mode)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] transition-colors",
                  imageDisplayMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {mode === "carousel" ? "1 carousel" : `${sections.length} separate ads`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ruler + playhead — simulated (no real video file backs this demo),
          but keyboard-operable: focus the slider, Left/Right = 1s, PageUp/
          PageDown handled natively by range inputs as larger jumps. */}
      <div className="flex flex-col gap-1.5 px-1">
        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={playhead}
          onChange={(e) => setPlayhead(Number(e.target.value))}
          aria-label="Playhead position"
          aria-valuetext={`${formatTime(playhead)} of ${formatTime(total)}`}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground" aria-live="polite">
          <span>{formatTime(playhead)}</span>
          <span>{formatTime(total)} total</span>
        </div>
      </div>

      {/* Section strip — role=tablist, proportional widths, full keyboard nav. */}
      <div
        role="tablist"
        aria-label="Framework sections"
        onKeyDown={onStripKeyDown}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {sections.map((s, i) => {
          const isSel = s.id === selected?.id;
          const missing = !s.thumbnail;
          return (
            <button
              key={s.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              aria-selected={isSel}
              aria-label={`${s.name}, ${formatTime(s.startSec)} to ${formatTime(s.endSec)}, ${s.roll === "a-roll" ? "A-roll" : "B-roll"}${missing ? ", not generated yet" : ""}`}
              tabIndex={isSel ? 0 : -1}
              onClick={() => select(s.id, i)}
              style={{ flexGrow: Math.max(s.endSec - s.startSec, 1), minWidth: 108 }}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border text-left transition-all",
                isSel ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-foreground/25",
              )}
            >
              <span className="relative block aspect-video w-full overflow-hidden bg-muted">
                {s.thumbnail ? (
                  <img src={s.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                    <RefreshCw className="h-4 w-4" />
                  </span>
                )}
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.05em] text-white">
                  {s.roll === "a-roll" ? <Clapperboard className="h-2.5 w-2.5" /> : <Film className="h-2.5 w-2.5" />}
                  {s.roll === "a-roll" ? "A-roll" : "B-roll"}
                </span>
              </span>
              <span className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-[11px] font-semibold text-foreground">{s.name}</span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(s.startSec)}–{formatTime(s.endSec)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel for the selected section */}
      {selected && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{selected.name}</h3>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {formatTime(selected.startSec)}–{formatTime(selected.endSec)} ({selected.endSec - selected.startSec}s)
                </span>
              </div>
              {selected.visualDirection && (
                <p className="text-[12px] text-muted-foreground">{selected.visualDirection}</p>
              )}
              {selected.dialogue && (
                <p className="text-[12px] italic text-foreground/80">&ldquo;{selected.dialogue}&rdquo;</p>
              )}
              {selected.note && (
                <p className="text-[11px] font-medium text-warning-text">{selected.note}</p>
              )}
            </div>
          </div>

          {regenBatchId && regenItem ? (
            regenItem.status === "failed" ? (
              <FailureNotice
                reason={regenItem.failure ?? "render-error"}
                onRetry={(scope) => {
                  retry(regenBatchId, scope, { itemId: regenItem.id });
                }}
                retryCredits={{ "this-item": regenItem.credits, "different-model": regenItem.credits }}
              />
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {regenBatch?.batchId}
                </p>
                <StageProgress
                  stages={REGEN_STAGES}
                  stageIndex={regenItem.stageIndex}
                  progress={regenItem.progress}
                  etaSeconds={regenItem.etaSeconds}
                />
              </div>
            )
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setSwapOpen(true)}>
                <Repeat2 className="h-3.5 w-3.5" aria-hidden />
                Swap from Catalogue
              </Button>
              <Button type="button" variant="outline" className="rounded-full" onClick={startRegenerate}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Regenerate this section ({creditsLabel(regenCost(selected))})
              </Button>
            </div>
          )}
        </div>
      )}

      {selected && (
        <SwapFromCatalogueDialog
          open={swapOpen}
          onOpenChange={setSwapOpen}
          sectionName={selected.name}
          onPick={handleSwap}
        />
      )}
    </div>
  );
}
