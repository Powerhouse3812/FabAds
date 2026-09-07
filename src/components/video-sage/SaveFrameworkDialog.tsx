import { useState, useSyncExternalStore } from "react";
import { Bookmark, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addAsset } from "@/catalogue/catalogue-write-store";
import type { Framework, FrameworkSection } from "@/genie6/editor/frameworks";
import type { VideoSageAnalysis } from "@/lib/video-sage-dummy-data";
import type { VideoSageVideo } from "@/hooks/use-video-sage";

/**
 * SaveFrameworkDialog — owner ruling (2026-09-08, verbatim): "Analysis is
 * only inside of Video Sage and can be saved in Catalogue also, add a new
 * submenu if needed."
 *
 * No new submenu / Catalogue type needed: §10 of the Genie 2.0 handoff
 * already makes Frameworks a first-class Catalogue asset type — "Frameworks
 * are named, saved, reusable Catalogue objects exactly like every other
 * creative asset" — so this file is purely the ADAPTER between Video
 * Sage's own analysis shape and the locked `Framework` object Catalogue's
 * `frameworksType` (src/catalogue/assetTypes.ts) already knows how to
 * render, resolve and list. Nothing here defines a new asset type.
 *
 * Video Sage's `VideoSageAnalysis.framework` is `{ name, fullName, saved,
 * segments: {label, duration, color}[] }` plus a positionally-paired
 * `storyboard` — NOT the same object as the shared `Framework` /
 * `FrameworkSection` (src/genie6/editor/frameworks.ts, READ-ONLY here,
 * whose own header comment says PAS/AIDA were originally derived from this
 * exact file's durations). `buildFrameworkFromAnalysis` below is the one
 * cumulative-walk + zip that turns one into the other.
 *
 * §15 — Framework is analyse-only, never generated: this file only ever
 * WRITES a Framework whose structure was already detected by
 * `fakeAnalyseVideo()`. There is no path here that invents a framework.
 *
 * Persistence: writes through `catalogue-write-store.ts`'s `addAsset()`,
 * the same generic, session-only mechanism every other Catalogue "Add"
 * flow uses (in-memory, resets on reload — disclosed via the existing
 * `SessionScopeNote` elsewhere in Catalogue). `frameworksType.resolve()`
 * merges seed `FRAMEWORKS` with session-added rows, so a framework saved
 * here shows up in the real /catalogue/frameworks grid immediately —
 * verified by reading that resolver, not assumed.
 */

// ─── roll heuristic ─────────────────────────────────────────────────────
// Video Sage doesn't detect a-roll vs b-roll per section (it isn't asked
// to). Direct-address beats (cold opens, CTAs, offers, resolutions) read as
// a-roll; explanatory/illustrative beats default to b-roll. Checked against
// frameworks.ts's own seeded PAS ({Hook:a, Problem:b, Agitate:b, Solution:a,
// CTA:a}) and AIDA ({Attention:a, Interest:b, Desire:b, Action:a}) — the
// only two frameworks Video Sage's dummy analyser ever detects — this
// heuristic reproduces both exactly, so a Video-Sage-derived Framework
// reads as native next to the seeded ones rather than guessing badly.
const A_ROLL_KEYWORDS = [
  "hook",
  "cta",
  "action",
  "attention",
  "offer",
  "solution",
  "push",
  "promise",
  "transition",
];
function inferRoll(label: string): FrameworkSection["roll"] {
  const l = label.toLowerCase();
  return A_ROLL_KEYWORDS.some((k) => l.includes(k)) ? "a-roll" : "b-roll";
}

// ─── adapter: VideoSageAnalysis → Framework ─────────────────────────────

/** Cumulative walk over Video Sage's segment durations + a positional zip
 *  against the storyboard, into the shared, locked `Framework` shape. */
export function buildFrameworkFromAnalysis(
  analysis: VideoSageAnalysis,
  video: Pick<VideoSageVideo, "id" | "title">,
  name: string,
): Framework {
  const { framework, storyboard } = analysis;
  let t = 0;
  const sections: FrameworkSection[] = framework.segments.map((seg, i) => {
    const startSec = t;
    t += seg.duration;
    const board = storyboard[i];
    return {
      id: `vs-${video.id}-sec-${i + 1}`,
      name: seg.label,
      startSec,
      endSec: t,
      roll: inferRoll(seg.label),
      // Deliberately no `thumbnail` — no per-section shot was ever
      // generated for this analysis, only detected structure. Leaving it
      // unset is the honest read per frameworks.ts's own convention
      // ("Absent = not generated yet"), not a fabricated still.
      ...(board ? { visualDirection: board.visuals, dialogue: board.dialogue } : {}),
    };
  });

  return {
    id: `framework-vs-${video.id}-${Date.now().toString(36)}`,
    name: framework.name,
    fullName: framework.fullName,
    description: `Detected on "${video.title}" — Video Sage analysis.`,
    provenance: "client-created",
    usageCount: 0,
    sourceVideoId: video.id,
    sections,
  };
}

function defaultFrameworkName(
  analysis: VideoSageAnalysis,
  video: Pick<VideoSageVideo, "title">,
): string {
  return `${analysis.framework.name} — ${video.title}`;
}

// ─── session-local "already saved" tracking, keyed by video id ─────────
// Same useSyncExternalStore pattern as catalogue-write-store.ts and
// GenieAddToFolderModal.tsx's membership store. This only tracks WHICH
// video's framework has been saved this session (so both the Summary tab's
// and the Framework tab's Save buttons agree) — the actual Catalogue row
// lives in catalogue-write-store, this is not a second source of truth for
// the asset itself.

interface SavedFrameworkRecord {
  catalogueId: string;
  name: string;
}

let savedByVideoId: Record<string, SavedFrameworkRecord> = {};
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot() {
  return savedByVideoId;
}
function markFrameworkSaved(videoId: string, record: SavedFrameworkRecord) {
  savedByVideoId = { ...savedByVideoId, [videoId]: record };
  emit();
}

/** Reactive read of whether (and under what name) this video's detected
 *  framework has been saved to Catalogue this session. */
export function useSavedFrameworkForVideo(videoId: string): SavedFrameworkRecord | undefined {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snap[videoId];
}

// ─── Save button + naming dialog ────────────────────────────────────────

interface SaveFrameworkButtonProps {
  analysis: VideoSageAnalysis;
  video: Pick<VideoSageVideo, "id" | "title">;
  /** Both call sites (Summary tab's inline row, Framework tab's action bar)
   *  open the exact same dialog and write to the exact same session
   *  record — this only changes the trigger's label/size. */
  variant?: "compact" | "full";
}

export default function SaveFrameworkButton({
  analysis,
  video,
  variant = "full",
}: SaveFrameworkButtonProps) {
  const saved = useSavedFrameworkForVideo(video.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => saved?.name ?? defaultFrameworkName(analysis, video));

  const canSave = analysis.framework.segments.length > 0;

  const handleOpen = (next: boolean) => {
    if (next) setName(saved?.name ?? defaultFrameworkName(analysis, video));
    setOpen(next);
  };

  const handleSave = () => {
    const finalName = name.trim() || defaultFrameworkName(analysis, video);
    const fw = buildFrameworkFromAnalysis(analysis, video, finalName);
    addAsset("frameworks", fw);
    markFrameworkSaved(video.id, { catalogueId: fw.id, name: finalName });
    toast({
      title: `Saved "${finalName}" to Catalogue`,
      description: "Frameworks · Creative",
    });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={saved ? "default" : "outline"}
        size="sm"
        className="gap-1.5"
        disabled={!canSave}
        onClick={() => handleOpen(true)}
      >
        {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        {saved ? "Saved to Catalogue" : variant === "compact" ? "Save" : "Save framework"}
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {saved ? "Saved to Catalogue" : "Save framework to Catalogue"}
            </DialogTitle>
          </DialogHeader>

          <p className="-mt-2 text-xs text-muted-foreground">
            Saves the {analysis.framework.name} structure detected on this video as a reusable
            Framework asset — findable later under Catalogue → Frameworks.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Framework name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultFrameworkName(analysis, video)}
              maxLength={80}
              disabled={!!saved}
              className="h-10 rounded-[28px] focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {analysis.framework.segments.map((seg) => (
              <span
                key={seg.label}
                className="rounded-full bg-muted-foreground/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
              >
                {seg.label}
              </span>
            ))}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">
                {saved ? "Close" : "Cancel"}
              </Button>
            </DialogClose>
            {!saved && (
              <Button onClick={handleSave} disabled={!name.trim()} className="rounded-full">
                <Bookmark className="w-3.5 h-3.5 mr-1.5" /> Save to Catalogue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
