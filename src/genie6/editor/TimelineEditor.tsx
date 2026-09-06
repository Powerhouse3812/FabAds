import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clapperboard, Film, GripVertical, Minus, Plus, Repeat2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Framework } from "./frameworks";
import type { OutputData } from "../types/output";
import { SwapFromCatalogueDialog, type SwapResult } from "./SwapPicker";
import { MUSIC_TRACKS, getMusicTrack } from "./musicTracks";

/**
 * TimelineEditor — §14's SECOND model. "The conventional editor with clips
 * and audio track, for control the framework view cannot give." Seeded from
 * the SAME Framework instance FrameworkEditor uses (one video, two lenses —
 * neither editor forks the underlying data), then edited independently:
 * clip order/trim/replace here doesn't rewrite the Framework's section
 * labels, same way a real NLE's timeline diverges from a script breakdown
 * once someone starts cutting.
 *
 * §19 — music ships in V1, so the audio lane is two real lanes: Voiceover
 * (read-only — baked into the A-roll clips, per the framework) and Music
 * (pick a real track, set its level, mute it).
 *
 * Reorder uses @dnd-kit (already a dependency) with BOTH pointer and
 * keyboard sensors — Tab to a clip's grip handle, Space to pick up, Left/
 * Right to move, Space to drop. No mouse-only gesture ships without this
 * keyboard equivalent.
 */

interface Clip {
  id: string;
  name: string;
  durationSec: number;
  roll: "a-roll" | "b-roll";
  thumbnail?: string;
  dialogue?: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function cumulativeStarts(clips: Clip[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (const c of clips) {
    out.push(t);
    t += c.durationSec;
  }
  return out;
}

function SortableClip({
  clip,
  index,
  start,
  selected,
  onSelect,
}: {
  clip: Clip;
  index: number;
  start: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: clip.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    flexGrow: Math.max(clip.durationSec, 1),
    minWidth: 88,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex h-9 shrink-0 items-center overflow-hidden rounded-md border",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${clip.name} clip — clip ${index + 1}`}
        className="flex h-full w-5 shrink-0 cursor-grab items-center justify-center bg-muted text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${clip.name} clip, ${formatTime(start)} to ${formatTime(start + clip.durationSec)}, ${clip.roll === "a-roll" ? "A-roll" : "B-roll"}`}
        className="relative flex h-full flex-1 items-center overflow-hidden bg-muted text-left"
      >
        {clip.thumbnail && (
          <img src={clip.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <span className="relative z-10 flex items-center gap-1 truncate px-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-white drop-shadow">
          {clip.roll === "a-roll" ? <Clapperboard className="h-2.5 w-2.5 shrink-0" /> : <Film className="h-2.5 w-2.5 shrink-0" />}
          <span className="truncate">{clip.name}</span>
        </span>
      </button>
    </div>
  );
}

export interface TimelineEditorProps {
  output: OutputData;
  framework: Framework;
  className?: string;
}

export function TimelineEditor({ output, framework, className }: TimelineEditorProps) {
  const [clips, setClips] = useState<Clip[]>(() =>
    framework.sections.map((s) => ({
      id: s.id,
      name: s.name,
      durationSec: Math.max(s.endSec - s.startSec, 1),
      roll: s.roll,
      thumbnail: s.thumbnail,
      dialogue: s.dialogue,
    })),
  );
  const [selectedId, setSelectedId] = useState(clips[0]?.id);
  const [swapOpen, setSwapOpen] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [musicId, setMusicId] = useState(MUSIC_TRACKS[0]?.id ?? "mus-none");
  const [musicLevel, setMusicLevel] = useState(68);
  const [musicMuted, setMusicMuted] = useState(false);

  const starts = useMemo(() => cumulativeStarts(clips), [clips]);
  const total = starts.length ? starts[starts.length - 1] + clips[starts.length - 1].durationSec : 0;
  const selectedIndex = clips.findIndex((c) => c.id === selectedId);
  const selected = clips[selectedIndex];
  const musicTrack = getMusicTrack(musicId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setClips((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const trim = (delta: number) => {
    if (!selected) return;
    setClips((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, durationSec: Math.max(1, c.durationSec + delta) } : c)),
    );
  };

  const handleReplace = (result: SwapResult) => {
    if (!selected) return;
    setClips((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              ...(result.thumbnail ? { thumbnail: result.thumbnail } : {}),
              ...(result.roll ? { roll: result.roll } : {}),
              ...(result.dialogue ? { dialogue: result.dialogue } : {}),
            }
          : c,
      ),
    );
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Ruler + playhead */}
      <div className="flex flex-col gap-1.5 px-1">
        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          step={1}
          value={playhead}
          onChange={(e) => setPlayhead(Number(e.target.value))}
          aria-label="Playhead position"
          aria-valuetext={`${formatTime(playhead)} of ${formatTime(total)}`}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground" aria-live="polite">
          <span>{formatTime(playhead)}</span>
          <span>{formatTime(total)} total · {clips.length} clips</span>
        </div>
      </div>

      {/* Timeline surface — dense data: no texture, compact lanes, its own
          horizontal scroller so the page body never scrolls sideways. */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-3">
        <div className="flex min-w-[640px] flex-col gap-2">
          {/* Video/clip lane */}
          <div className="flex items-center gap-1.5">
            <span className="w-14 shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Video
            </span>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={clips.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                <div role="list" aria-label="Video clips" className="flex flex-1 gap-1">
                  {clips.map((c, i) => (
                    <SortableClip
                      key={c.id}
                      clip={c}
                      index={i}
                      start={starts[i]}
                      selected={c.id === selectedId}
                      onSelect={() => {
                        setSelectedId(c.id);
                        setPlayhead(starts[i]);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Voiceover lane — read-only, aligned to clip widths */}
          <div className="flex items-center gap-1.5">
            <span className="w-14 shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Voiceover
            </span>
            <div role="list" aria-label="Voiceover, baked into A-roll clips" className="flex flex-1 gap-1">
              {clips.map((c) => (
                <div
                  key={c.id}
                  role="listitem"
                  aria-label={c.dialogue ? `Voiceover for ${c.name}: ${c.dialogue}` : `No voiceover for ${c.name}`}
                  style={{ flexGrow: Math.max(c.durationSec, 1), minWidth: 88 }}
                  className={cn(
                    "h-8 shrink-0 rounded-md border border-border",
                    c.dialogue
                      ? "bg-[repeating-linear-gradient(90deg,hsl(var(--muted-foreground)/0.18)_0px,hsl(var(--muted-foreground)/0.18)_2px,transparent_2px,transparent_5px)] bg-muted/40"
                      : "bg-muted/20",
                  )}
                  title={c.dialogue}
                />
              ))}
            </div>
          </div>

          {/* Music lane — one editable track across the whole video */}
          <div className="flex items-center gap-1.5">
            <span className="w-14 shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Music
            </span>
            <div
              className={cn(
                "flex h-8 flex-1 items-center justify-between rounded-md border border-border px-2",
                musicMuted || musicTrack?.id === "mus-none" ? "bg-muted/20" : "bg-primary/10",
              )}
            >
              <span className="truncate text-[11px] font-medium text-foreground">
                {musicMuted ? `${musicTrack?.title ?? "No track"} (muted)` : musicTrack?.title ?? "No track"}
              </span>
              {musicTrack && musicTrack.bpm > 0 && (
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {musicTrack.bpm} bpm
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected clip detail — trim + replace (replace reuses the SAME
          swap mechanism as FrameworkEditor, per §21.2). */}
      {selected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{selected.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatTime(starts[selectedIndex])}–{formatTime(starts[selectedIndex] + selected.durationSec)} ·{" "}
              {selected.durationSec}s · {selected.roll === "a-roll" ? "A-roll" : "B-roll"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => trim(-1)}
                aria-label={`Shorten ${selected.name} by 1 second (currently ${selected.durationSec}s)`}
                disabled={selected.durationSec <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[2.5ch] text-center font-mono text-[11px] tabular-nums text-foreground">
                {selected.durationSec}s
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => trim(1)}
                aria-label={`Extend ${selected.name} by 1 second (currently ${selected.durationSec}s)`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setSwapOpen(true)}>
              <Repeat2 className="h-3.5 w-3.5" aria-hidden />
              Replace
            </Button>
          </div>
        </div>
      )}

      {/* Music controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Music track
          </span>
          <Select value={musicId} onValueChange={setMusicId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Pick a track" />
            </SelectTrigger>
            <SelectContent>
              {MUSIC_TRACKS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                  {t.artist !== "—" ? ` · ${t.artist}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <span className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            <span>Level</span>
            <span className="tabular-nums">{musicLevel}%</span>
          </span>
          <Slider
            value={[musicLevel]}
            onValueChange={([v]) => setMusicLevel(v)}
            max={100}
            step={1}
            disabled={musicMuted}
            aria-label="Music level"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {musicMuted ? (
            <VolumeX className="h-4 w-4 text-muted-foreground" aria-hidden />
          ) : (
            <Volume2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
          <Switch checked={musicMuted} onCheckedChange={setMusicMuted} aria-label="Mute music track" />
        </div>
      </div>

      {selected && (
        <SwapFromCatalogueDialog
          open={swapOpen}
          onOpenChange={setSwapOpen}
          sectionName={selected.name}
          onPick={handleReplace}
        />
      )}
    </div>
  );
}
