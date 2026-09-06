import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Clapperboard,
  FileEdit,
  ImageOff,
  LayoutPanelLeft,
  RefreshCw,
  Repeat,
  ScrollText,
  Shuffle,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { sampleOutputs } from "../mocks/sample-outputs";
import { formatCredits, creditsLabel } from "../lib/credits";
import { flowSearchParams, type FlowActionId } from "../flows/flowTypes";
import { wholeVideoBreakdown } from "./editorCredits";
import { startBatch, useBatch } from "../lib/genieRunStore";
import { StageProgress, FailureNotice } from "../progress";
import { resolveEditorFramework } from "./outputFramework";
import type { Framework, FrameworkSection } from "./frameworks";
import { FrameworkEditor } from "./FrameworkEditor";
import { TimelineEditor } from "./TimelineEditor";

/**
 * VideoEditor — the shell §14 describes: "Both models ship: framework-based
 * and timeline." One route (`/iq/genie6/editor/:outputId`), one URL param
 * (`?view=framework|timeline`, framework default because it's the
 * differentiated model — timeline is the escape hatch for control the
 * framework view can't give) so a link always opens the right view.
 *
 * Also wires §14's two remaining editor-level actions:
 *  - "generate or edit the script" — a Sheet seeded from the framework's
 *    per-section dialogue (the same field that makes a Framework double as
 *    a Storyboard, see frameworks.ts).
 *  - "regenerate with an option to edit or add instructions" — the WHOLE
 *    video, as distinct from FrameworkEditor's per-section regenerate.
 * And §14's explicit non-feature: "Reusing an already generated video needs
 * no new feature. Library's three variation actions cover it" — so this
 * renders exactly those three (`vary-script` / `vary-concept` /
 * `vary-whole-video`), not a fourth "reuse" button, navigating via
 * `flowSearchParams("creative-library", outputId, action)` per the brief.
 */

const REGEN_VIDEO_STAGES = ["Queued", "Analysing script", "Rendering", "Compositing", "Finalizing"];

type ViewMode = "framework" | "timeline";

const VARIATION_ACTIONS: { id: FlowActionId; label: string }[] = [
  { id: "vary-script", label: "Vary script" },
  { id: "vary-concept", label: "Vary concept" },
  { id: "vary-whole-video", label: "Vary whole video" },
];

function EditorShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col gap-5 px-6 py-8">{children}</div>;
}

function BackToLibrary() {
  const navigate = useNavigate();
  return (
    <Button type="button" variant="ghost" size="sm" className="w-fit gap-1.5 rounded-full" onClick={() => navigate("/iq/genie6/library")}>
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      Back to Library
    </Button>
  );
}

function LoadingSkeleton() {
  return (
    <EditorShell>
      <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
      <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 flex-1 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
    </EditorShell>
  );
}

/** Shared shape for the three "can't edit this" outcomes — real explanation
 *  + exit, never a crash, never a bare "No data" (§7 anti-pattern). */
function EditorDeadEnd({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <EditorShell>
      <BackToLibrary />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="max-w-sm text-[13px] text-muted-foreground">{detail}</p>
      </div>
    </EditorShell>
  );
}

export function VideoEditor() {
  const { outputId } = useParams<{ outputId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [resolving, setResolving] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setResolving(false), 450);
    return () => window.clearTimeout(t);
  }, [outputId]);

  const output = useMemo(() => sampleOutputs.find((o) => o.id === outputId), [outputId]);
  const availability = useMemo(() => resolveEditorFramework(output), [output]);

  const [framework, setFramework] = useState<Framework | null>(null);
  useEffect(() => {
    setFramework(availability.kind === "ready" ? availability.framework : null);
  }, [availability.kind === "ready" ? availability.framework.id : availability.kind]);

  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState("");
  const [regenBatchId, setRegenBatchId] = useState<string | null>(null);
  const regenBatch = useBatch(regenBatchId ?? "");
  const regenItem = regenBatch?.items[0];

  const view: ViewMode = searchParams.get("view") === "timeline" ? "timeline" : "framework";
  const setView = (v: ViewMode) => {
    const next = new URLSearchParams(searchParams);
    if (v === "framework") next.delete("view");
    else next.set("view", v);
    setSearchParams(next, { replace: true });
  };

  const openScriptEditor = () => {
    const lines = (framework?.sections ?? [])
      .map((s: FrameworkSection) => `[${s.name}] ${s.dialogue ?? ""}`.trim())
      .filter(Boolean);
    setScriptDraft(lines.join("\n\n"));
    setScriptOpen(true);
  };

  // §21.2 — derived from the framework's real duration through
  // computeBreakdown(), so this figure and the section figures in
  // FrameworkEditor come out of one formula instead of two literals.
  const wholeVideoCost = framework ? wholeVideoBreakdown(framework).total : 0;

  const startWholeVideoRegen = () => {
    if (!output) return;
    const batchId = startBatch({
      origin: { kind: "studio" },
      label: `${output.brand?.name ?? "Output"} · Regenerate whole video`,
      stages: REGEN_VIDEO_STAGES,
      count: 1,
      creditsPerItem: wholeVideoCost,
      ...(regenInstructions.trim() ? { config: { promptSnippet: regenInstructions.trim() } } : {}),
    });
    setRegenBatchId(batchId);
  };

  const goToVariation = (action: FlowActionId) => {
    if (!outputId) return;
    const sp = flowSearchParams("creative-library", outputId, action);
    // An explicit step slug is required. Bare `/studio-alpha` is the Home
    // phase (StudioAlpha derives its phase from the presence of :step), so
    // the flow params arrived on a screen that never reads them — the user
    // got the mode picker instead of a pre-filled variation. All three
    // actions offered here are Rule-1 variations, so they land on Configure.
    navigate(`/iq/genie6/studio-alpha/configure?${sp.toString()}`);
  };

  if (resolving) return <LoadingSkeleton />;

  if (availability.kind === "unknown") {
    return (
      <EditorDeadEnd
        icon={ImageOff}
        title="We couldn't find this generation"
        detail="This link may be old or the output may have been deleted. Head back to the Library to find it, or start a new one."
      />
    );
  }

  if (availability.kind === "no-video") {
    return (
      <EditorDeadEnd
        icon={ImageOff}
        title="This output has no video to edit"
        detail={
          output?.mediaType === "image"
            ? "This generation is a static image, not a video — the video editor only opens on video outputs. Use Resize or Create Variations from the Library instead."
            : "This generation has no video component — there's nothing here for the video editor to break into sections."
        }
      />
    );
  }

  if (availability.kind === "no-framework") {
    return (
      <EditorDeadEnd
        icon={Clapperboard}
        title="No structure detected on this video"
        detail="Genie couldn't identify a Hook / Problem / Solution / CTA breakdown for this generation, so there's nothing to edit section-by-section. Try Timeline-only tools from the Library, or regenerate this ad to get a structured version."
      />
    );
  }

  if (!output || !framework) return <LoadingSkeleton />;

  return (
    <EditorShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackToLibrary />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={openScriptEditor}>
            <ScrollText className="h-3.5 w-3.5" aria-hidden />
            Edit script
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => setRegenOpen(true)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Regenerate whole video ({creditsLabel(wholeVideoCost)})
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground" title={output.headline}>
            {output.headline || `${output.brand?.name ?? "Untitled"} generation`}
          </span>
          <span className="truncate text-[12px] text-muted-foreground">
            {output.brand?.name}
            {output.product?.name ? ` · ${output.product.name}` : ""}
          </span>
        </div>

        {/* Variation actions — §14: "Library's three variation actions cover
            it." Exact FlowActionId wording, no fourth "reuse" button. */}
        <div className="flex flex-wrap items-center gap-2">
          <Shuffle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {VARIATION_ACTIONS.map((a) => (
            <Button key={a.id} type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => goToVariation(a.id)}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* View switch — framework default, in the URL */}
      <div className="flex items-center gap-1 self-start rounded-full border border-border bg-muted/40 p-0.5">
        <button
          type="button"
          aria-pressed={view === "framework"}
          onClick={() => setView("framework")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
            view === "framework" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          <LayoutPanelLeft className="h-3.5 w-3.5" aria-hidden />
          Framework
        </button>
        <button
          type="button"
          aria-pressed={view === "timeline"}
          onClick={() => setView("timeline")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
            view === "timeline" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          Timeline
        </button>
      </div>

      {view === "framework" ? (
        <FrameworkEditor
          output={output}
          framework={framework}
          onSectionChange={(sectionId, patch) =>
            setFramework((prev) =>
              prev
                ? { ...prev, sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)) }
                : prev,
            )
          }
        />
      ) : (
        // Timeline seeds from the SAME framework instance but edits it as an
        // independent local model (see TimelineEditor's file header) — it
        // remounts (and re-seeds) each time the view switches to it.
        <TimelineEditor key={`${framework.id}`} output={output} framework={framework} />
      )}

      {/* Edit script sheet */}
      <Sheet open={scriptOpen} onOpenChange={setScriptOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Script</SheetTitle>
            <SheetDescription>
              One line per beat, in framework order. Edit directly, or generate a fresh pass.
            </SheetDescription>
          </SheetHeader>
          <Textarea
            value={scriptDraft}
            onChange={(e) => setScriptDraft(e.target.value)}
            rows={16}
            className="flex-1 resize-none font-mono text-[12px]"
            aria-label="Script draft"
          />
          <SheetFooter className="flex-row justify-between gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 rounded-full"
              onClick={() => {
                setScriptDraft((d) => `${d}\n\n[Regenerated pass]\nMake every line 20% shorter and lead with the number.`);
              }}
            >
              <Wand2 className="h-3.5 w-3.5" aria-hidden />
              Regenerate with AI
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setScriptOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-1.5 rounded-full"
                onClick={() => {
                  // Save is the confirm (house policy) — folds the edited
                  // lines back onto the framework's per-section dialogue.
                  const byName = new Map<string, string>();
                  for (const block of scriptDraft.split("\n\n")) {
                    const m = block.match(/^\[(.+?)\]\s*([\s\S]*)$/);
                    if (m) byName.set(m[1], m[2].trim());
                  }
                  setFramework((prev) =>
                    prev
                      ? {
                          ...prev,
                          sections: prev.sections.map((s) =>
                            byName.has(s.name) ? { ...s, dialogue: byName.get(s.name) } : s,
                          ),
                        }
                      : prev,
                  );
                  setScriptOpen(false);
                }}
              >
                <FileEdit className="h-3.5 w-3.5" aria-hidden />
                Save
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Regenerate whole video */}
      <Dialog
        open={regenOpen}
        onOpenChange={(next) => {
          setRegenOpen(next);
          if (!next) setRegenBatchId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate whole video</DialogTitle>
            <DialogDescription>
              Add instructions (optional), or leave blank to regenerate with the current settings.
            </DialogDescription>
          </DialogHeader>

          {regenBatchId && regenItem ? (
            regenItem.status === "failed" ? (
              <FailureNotice
                reason={regenItem.failure ?? "render-error"}
                onRetry={() => startWholeVideoRegen()}
                retryCredits={{ "this-item": regenItem.credits }}
              />
            ) : regenItem.status === "done" ? (
              <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">New version is ready.</p>
                <Button
                  type="button"
                  variant="link"
                  className="w-fit p-0 text-primary-text"
                  onClick={() => navigate("/iq/genie6/library")}
                >
                  View in Library
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {regenBatch?.batchId}
                </p>
                <StageProgress
                  stages={REGEN_VIDEO_STAGES}
                  stageIndex={regenItem.stageIndex}
                  progress={regenItem.progress}
                  etaSeconds={regenItem.etaSeconds}
                />
              </div>
            )
          ) : (
            <Textarea
              value={regenInstructions}
              onChange={(e) => setRegenInstructions(e.target.value)}
              rows={4}
              placeholder="e.g. Make the hook punchier, keep the CTA the same"
              aria-label="Regeneration instructions"
            />
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setRegenOpen(false)}>
              Cancel
            </Button>
            {!regenBatchId && (
              <Button type="button" className="gap-1.5 rounded-full" onClick={startWholeVideoRegen}>
                <Repeat className="h-3.5 w-3.5" aria-hidden />
                Regenerate ({creditsLabel(wholeVideoCost)})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EditorShell>
  );
}
