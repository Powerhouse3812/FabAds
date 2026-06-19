/**
 * MediaSourcePicker — swap which creative/media an ad (or many ads) uses.
 *
 * Three sources, mirroring the 2024 design's "Auto / By prompt / library"
 * intent:
 *   • Library  — pick from existing creatives (format-filtered).
 *   • Genie    — mock AI generate (prompt → new creative appended to the plan).
 *   • Upload   — mock file upload (object URL → new creative appended).
 *
 * Mock tool — no real Genie/upload backend. New creatives are appended via
 * onAddAndPick so they persist in plan.creatives and can be reused.
 */
import { useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Sparkles, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdFormat, CreativeRef } from "../../types";

type Tab = "library" | "genie" | "upload";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "library", label: "Library", icon: ImagePlus },
  { id: "genie", label: "Genie", icon: Sparkles },
  { id: "upload", label: "Upload", icon: UploadCloud },
];

/** Format a new creative's format from the active ad format (best-effort). */
function formatForNew(format: AdFormat | null): AdFormat {
  if (format === "single_video") return "single_video";
  if (format === "carousel") return "single_image";
  if (format === "dpa") return "dpa";
  return "single_image";
}

export function MediaSourcePicker({
  open,
  onOpenChange,
  format,
  library,
  currentId,
  bulkCount,
  onPick,
  onAddAndPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active ad format — filters the library grid. */
  format: AdFormat | null;
  /** Creatives available to pick from (already format-filtered by caller). */
  library: CreativeRef[];
  /** Currently selected creative id (highlighted). */
  currentId: string | null;
  /** When > 1, the pick fans out to this many ads (header hint). */
  bulkCount?: number;
  onPick: (creativeId: string) => void;
  onAddAndPick: (creative: CreativeRef) => void;
}) {
  const [tab, setTab] = useState<Tab>("library");
  const [prompt, setPrompt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const grid = useMemo(() => library, [library]);

  const pick = (id: string) => {
    onPick(id);
    onOpenChange(false);
  };

  const genieGenerate = () => {
    const seed = prompt.trim() || "AI creative";
    const id = `gen_${Math.random().toString(36).slice(2, 9)}`;
    onAddAndPick({
      id,
      name: seed.length > 32 ? `${seed.slice(0, 32)}…` : seed,
      format: formatForNew(format),
      source: "genie",
      thumbnail: `https://image.pollinations.ai/prompt/${encodeURIComponent(seed)}?width=240&height=240&nologo=true`,
    });
    setPrompt("");
    onOpenChange(false);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = `upl_${Math.random().toString(36).slice(2, 9)}`;
    onAddAndPick({
      id,
      name: file.name.replace(/\.[^.]+$/, ""),
      format: file.type.startsWith("video") ? "single_video" : formatForNew(format),
      source: "upload",
      thumbnail: URL.createObjectURL(file),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ImagePlus className="h-4 w-4 text-primary" />
            {bulkCount && bulkCount > 1 ? `Change media — ${bulkCount} ads` : "Change media"}
          </DialogTitle>
        </DialogHeader>

        {/* Source tabs — pill segmented */}
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/30 p-0.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Library grid */}
        {tab === "library" && (
          <div className="max-h-[340px] overflow-y-auto">
            {grid.length === 0 ? (
              <p className="py-10 text-center font-mono text-[12px] text-muted-foreground">
                No creatives match this format. Try Genie or Upload.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {grid.map((c) => {
                  const selected = c.id === currentId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pick(c.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border bg-muted/20 text-left transition-colors",
                        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-muted">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <ImagePlus className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[#121212]">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-foreground">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Genie (mock) */}
        {tab === "genie" && (
          <div className="space-y-3 py-2">
            <p className="font-mono text-[11px] text-muted-foreground">
              Describe the creative — Genie generates it (mock).
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Minimal product shot of onion hair oil on a marble surface, soft daylight"
              rows={3}
              className="w-full resize-none rounded-[20px] border border-border bg-background px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-[#8FB821]/20"
            />
            <Button onClick={genieGenerate} className="h-9 w-full gap-1.5">
              <Sparkles className="h-4 w-4" />
              Generate &amp; use
            </Button>
          </div>
        )}

        {/* Upload (mock) */}
        {tab === "upload" && (
          <div className="py-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <UploadCloud className="h-7 w-7 text-muted-foreground/60" />
              <span className="text-[13px] font-medium text-foreground">Click to upload media</span>
              <span className="font-mono text-[11px] text-muted-foreground/60">PNG, JPG, MP4 — used as the ad creative</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onUpload}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
