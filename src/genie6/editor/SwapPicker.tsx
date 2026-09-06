import { useMemo, useState } from "react";
import { Film, Image as ImageIcon, MessageSquare, ScrollText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LIBRARY_MEDIA } from "@/mocks/shared/library-items";
import { hooks } from "@/mocks/shared/hooks";
import { concepts } from "@/mocks/shared/concepts";
import { scripts } from "@/mocks/shared/scripts";

/**
 * SwapFromCatalogueDialog — the ONE swap mechanism, used by both
 * FrameworkEditor (swap a section) and TimelineEditor (replace a clip).
 *
 * Genie 2.0 §21.2: "A-roll/B-roll replacement is part of the framework-based
 * editor — the same mechanism, not a separate feature." So there is no
 * separate a-roll/b-roll toggle anywhere in this editor — picking a video
 * from the Media tab asks "use as A-roll or B-roll" as the LAST STEP of this
 * one swap action, and that answer becomes the section/clip's roll. Picking
 * a Hook, Concept or Script instead swaps the WORDS (on-screen line /
 * dialogue), not the shot, and leaves roll untouched.
 */

export interface SwapResult {
  source: "media" | "hook" | "concept" | "script";
  /** Short label for the toast-free confirmation line under the section. */
  label: string;
  thumbnail?: string;
  roll?: "a-roll" | "b-roll";
  dialogue?: string;
}

/** One item per brand, capped — a picker with 150 rows is a worse picker. */
function spread<T extends { brand_id: string | null }>(items: T[], perBrand: number, cap: number): T[] {
  const seen = new Map<string, number>();
  const out: T[] = [];
  for (const item of items) {
    if (out.length >= cap) break;
    const key = item.brand_id ?? "__orphan";
    const n = seen.get(key) ?? 0;
    if (n < perBrand) {
      out.push(item);
      seen.set(key, n + 1);
    }
  }
  return out;
}

export function SwapFromCatalogueDialog({
  open,
  onOpenChange,
  sectionName,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionName: string;
  onPick: (result: SwapResult) => void;
}) {
  const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);

  const mediaRows = useMemo(() => spread(LIBRARY_MEDIA, 3, 24), []);
  const hookRows = useMemo(() => hooks.slice(0, 24), []);
  const conceptRows = useMemo(() => concepts.slice(0, 24), []);
  const scriptRowsSlice = useMemo(() => scripts.slice(0, 24), []);

  const pendingMedia = mediaRows.find((m) => m.id === pendingMediaId);

  const commit = (result: SwapResult) => {
    onPick(result);
    setPendingMediaId(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setPendingMediaId(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl gap-4">
        <DialogHeader>
          <DialogTitle>Swap &ldquo;{sectionName}&rdquo;</DialogTitle>
          <DialogDescription>
            Pick a replacement from the Catalogue. Media also decides A-roll or B-roll for this beat.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="media" onValueChange={() => setPendingMediaId(null)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="media" className="gap-1.5">
              <Film className="h-3.5 w-3.5" aria-hidden />
              Media
            </TabsTrigger>
            <TabsTrigger value="hooks" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Hooks
            </TabsTrigger>
            <TabsTrigger value="concepts" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Concepts
            </TabsTrigger>
            <TabsTrigger value="scripts" className="gap-1.5">
              <ScrollText className="h-3.5 w-3.5" aria-hidden />
              Scripts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media">
            <ScrollArea className="h-72 rounded-xl border border-border">
              <ul className="grid grid-cols-3 gap-2 p-2">
                {mediaRows.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setPendingMediaId(m.id)}
                      aria-pressed={pendingMediaId === m.id}
                      className={cn(
                        "flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors",
                        pendingMediaId === m.id
                          ? "border-primary ring-1 ring-primary/40"
                          : "border-border hover:border-foreground/30",
                      )}
                    >
                      <span className="relative block aspect-video w-full overflow-hidden bg-muted">
                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white">
                          {m.file_type === "video" ? (
                            <Film className="h-2.5 w-2.5" />
                          ) : (
                            <ImageIcon className="h-2.5 w-2.5" />
                          )}
                        </span>
                      </span>
                      <span className="truncate px-1.5 py-1 text-[10px] font-mono text-muted-foreground" title={m.file_name}>
                        {m.file_name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            {pendingMedia && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 p-3">
                <p className="min-w-0 truncate text-[12px] text-muted-foreground">
                  Use <span className="font-medium text-foreground">{pendingMedia.file_name}</span> as
                </p>
                {pendingMedia.file_type === "video" ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        commit({
                          source: "media",
                          label: pendingMedia.file_name,
                          thumbnail: pendingMedia.url,
                          roll: "a-roll",
                        })
                      }
                    >
                      A-roll
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        commit({
                          source: "media",
                          label: pendingMedia.file_name,
                          thumbnail: pendingMedia.url,
                          roll: "b-roll",
                        })
                      }
                    >
                      B-roll
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() =>
                      commit({
                        source: "media",
                        label: pendingMedia.file_name,
                        thumbnail: pendingMedia.url,
                        roll: "b-roll",
                      })
                    }
                  >
                    Use as B-roll insert
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hooks">
            <ScrollArea className="h-72 rounded-xl border border-border">
              <ul className="divide-y divide-border">
                {hookRows.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => commit({ source: "hook", label: h.text, dialogue: h.text })}
                      className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
                    >
                      <span className="text-[12px] text-foreground">{h.text}</span>
                      {h.performance && (
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {h.performance.ctr.toFixed(2)}% CTR · {h.performance.impressions.toLocaleString("en-IN")} impr
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="concepts">
            <ScrollArea className="h-72 rounded-xl border border-border">
              <ul className="divide-y divide-border">
                {conceptRows.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => commit({ source: "concept", label: c.name, dialogue: c.hook })}
                      className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
                    >
                      <span className="text-[12px] font-medium text-foreground">{c.name}</span>
                      <span className="line-clamp-1 text-[11px] text-muted-foreground">{c.visualDirection}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="scripts">
            <ScrollArea className="h-72 rounded-xl border border-border">
              {scriptRowsSlice.length > 0 ? (
                <ul className="divide-y divide-border">
                  {scriptRowsSlice.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => commit({ source: "script", label: s.title, dialogue: s.body })}
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
                      >
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                          {s.title}
                          <span className="rounded-full border border-border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.04em] text-muted-foreground">
                            {s.framework}
                          </span>
                        </span>
                        <span className="line-clamp-1 text-[11px] text-muted-foreground">{s.body}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
                  <p className="text-[12px] text-muted-foreground">No saved scripts yet.</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Scripts you approve in Studio will show up here.
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
