import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Info, Pause, Play, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Avatar, Voice } from "@/genie6/types/entities";
import { avatars, voices, brands } from "@/mocks/shared";
import { PreviewVideo } from "@/genie6/studio-v4/components/PreviewVideo";
import { playToneSweep, toneSweepParams } from "@/genie6/lib/voicePreviewTone";
import {
  AVATAR_ENVIRONMENTS,
  AVATAR_PERSONALITIES,
  VOICE_TONES,
  environmentLabel,
  personalityLabel,
  toneDesc,
  toneLabel,
  matchBrandTone,
  type BrandToneMatch,
} from "./avatarTaxonomy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * AvatarVoicePicker — Genie 2.0 §11 / §13.
 *
 * ONE step: avatar, voice and tone are decided together (§13 upgrade 4) using
 * the SAME environment × personality taxonomy `GenieBrain` browses (§11 — "the
 * two must not diverge"). Genie Brain, Studio, and every Other App that needs
 * a face (Avatar Shots, PPT/PDF to Video, Product Placement, Face Swap) mount
 * this ONE implementation — nobody re-forks it.
 *
 * Standalone-safe: `brandId` is optional and additive to the locked contract
 * (every REQUIRED prop below matches the contract exactly). Omit it — as the
 * Apps surface does, since Apps has no brand context — and tone matching
 * simply doesn't render; nothing else in the component depends on it.
 */
export interface AvatarVoicePickerProps {
  avatarId: string | null;
  voiceId: string | null;
  tone: string | null;
  onChange: (v: { avatarId?: string | null; voiceId?: string | null; tone?: string | null }) => void;
  /** Hide the voice column when the host only needs a face (e.g. Face Swap). */
  withVoice?: boolean;
  withTone?: boolean;
  className?: string;
  /** Optional brand context — powers §13's "tied to brand voice" tone match.
   *  Not part of the locked signature; every caller that omits it still gets
   *  a fully working picker. */
  brandId?: string | null;
}

type ProvenanceFilter = "all" | "fabfunnel-seeded" | "client-created";

export function AvatarVoicePicker({
  avatarId,
  voiceId,
  tone,
  onChange,
  withVoice = true,
  withTone = true,
  className,
  brandId = null,
}: AvatarVoicePickerProps) {
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [provFilter, setProvFilter] = useState<ProvenanceFilter>("all");

  const selectedAvatar = useMemo<Avatar | undefined>(
    () => avatars.find((a) => a.id === avatarId),
    [avatarId],
  );

  const brand = useMemo(() => (brandId ? brands.find((b) => b.id === brandId) ?? null : null), [brandId]);
  const brandMatch: BrandToneMatch = useMemo(() => matchBrandTone(brand), [brand]);

  const filteredAvatars = useMemo(() => {
    const q = search.trim().toLowerCase();
    return avatars.filter((a) => {
      if (envFilter !== "all" && a.environmentId !== envFilter) return false;
      if (personaFilter !== "all" && a.personalityId !== personaFilter) return false;
      if (provFilter !== "all" && (a.provenance ?? "fabfunnel-seeded") !== provFilter) return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.demographic.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, envFilter, personaFilter, provFilter]);

  // Voices whose language overlaps the selected avatar surface first — the
  // pairing Genie would actually render together — without hiding the rest.
  const sortedVoices = useMemo<Voice[]>(() => {
    if (!selectedAvatar) return voices;
    const langs = new Set(selectedAvatar.language);
    return [...voices].sort((a, b) => {
      const am = langs.has(a.language) ? 0 : 1;
      const bm = langs.has(b.language) ? 0 : 1;
      return am - bm;
    });
  }, [selectedAvatar]);

  const clearFilters = () => {
    setSearch("");
    setEnvFilter("all");
    setPersonaFilter("all");
    setProvFilter("all");
  };
  const hasActiveFilters = search !== "" || envFilter !== "all" || personaFilter !== "all" || provFilter !== "all";

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* ── Filter row: search + environment + personality + provenance ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search avatars…"
              className="h-9 rounded-full pl-8 text-sm"
              aria-label="Search avatars"
            />
          </div>
          <Select value={envFilter} onValueChange={setEnvFilter}>
            <SelectTrigger className="h-9 w-full rounded-full text-xs sm:w-[168px]" aria-label="Filter by environment">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All environments</SelectItem>
              {AVATAR_ENVIRONMENTS.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={personaFilter} onValueChange={setPersonaFilter}>
            <SelectTrigger className="h-9 w-full rounded-full text-xs sm:w-[168px]" aria-label="Filter by personality">
              <SelectValue placeholder="Personality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All personalities</SelectItem>
              {AVATAR_PERSONALITIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-full border border-border bg-muted/50 p-0.5">
            {([
              { v: "all", l: "All" },
              { v: "fabfunnel-seeded", l: "FabFunnel" },
              { v: "client-created", l: "Yours" },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={provFilter === o.v}
                onClick={() => setProvFilter(o.v)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors",
                  provFilter === o.v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {filteredAvatars.length} of {avatars.length} avatars
          </p>
        </div>

        {/* ── Avatar grid ── */}
        {filteredAvatars.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">No avatars match these filters</p>
            <p className="text-xs text-muted-foreground">Try a different environment, personality, or search term.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[360px] rounded-2xl">
            <div className="grid grid-cols-2 gap-3 pr-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredAvatars.map((a) => (
                <AvatarCard
                  key={a.id}
                  avatar={a}
                  selected={a.id === avatarId}
                  onSelect={() => onChange({ avatarId: a.id })}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* ── Voice + tone — decided together with the avatar, same step ── */}
        {withVoice && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Voice
              </p>
              {selectedAvatar && (
                <p className="truncate text-[11px] text-muted-foreground">
                  Matching languages surface first for {selectedAvatar.name}
                </p>
              )}
            </div>
            {!selectedAvatar && (
              <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
                Pick an avatar above — voices work for any of them, but pairing one first keeps language matched.
              </p>
            )}
            <ScrollArea className="h-[220px] rounded-2xl">
              <div className="flex flex-col gap-2 pr-3">
                {sortedVoices.map((v) => (
                  <VoiceRow
                    key={v.id}
                    voice={v}
                    selected={v.id === voiceId}
                    onSelect={() => onChange({ voiceId: v.id })}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {withVoice && withTone && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Tone
              </p>
              {brand ? (
                <p className="truncate text-[11px] text-muted-foreground">Tied to {brand.name}'s voice</p>
              ) : (
                <p className="truncate text-[11px] text-muted-foreground">No brand in context</p>
              )}
            </div>
            <ToneSelector tone={tone} onSelect={(id) => onChange({ tone: id })} brandMatch={brandMatch} />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ────────────────────────────── Sub-components ────────────────────────────── */

function Tag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "primary" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.05em]",
        variant === "primary"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function ProvenanceTag({ provenance }: { provenance?: Avatar["provenance"] }) {
  const isSeeded = (provenance ?? "fabfunnel-seeded") === "fabfunnel-seeded";
  return <Tag variant={isSeeded ? "default" : "primary"}>{isSeeded ? "FabFunnel" : "Yours"}</Tag>;
}

function AvatarCard({
  avatar,
  selected,
  onSelect,
}: {
  avatar: Avatar;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      title={`${avatar.name} — ${avatar.demographic}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border bg-card hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {avatar.previewVideo ? (
          <PreviewVideo src={avatar.previewVideo} poster={avatar.thumbnail} />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-muted">
            <span className="text-2xl font-bold text-muted-foreground/70">{avatar.name[0]}</span>
            <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1 py-0.5 font-mono text-[8px] uppercase tracking-wide text-muted-foreground">
              No preview
            </span>
          </div>
        )}
        {selected && (
          <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-2">
        <p className="truncate text-[12px] font-semibold leading-tight text-foreground">{avatar.name}</p>
        <p className="truncate font-mono text-[9px] text-muted-foreground">{avatar.demographic}</p>
        <div className="flex flex-wrap gap-1">
          <Tag>{environmentLabel(avatar.environmentId)}</Tag>
          <Tag variant="primary">{personalityLabel(avatar.personalityId)}</Tag>
        </div>
        <ProvenanceTag provenance={avatar.provenance} />
      </div>
    </button>
  );
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `0:${String(s).padStart(2, "0")}`;
}

/**
 * §13 upgrade 2 — audio preview. Honest AND useful: when a real
 * `voice.sample` URL resolves, play/pause is real, visibly playing (icon +
 * elapsed/duration), and stoppable. When it doesn't resolve — true for every
 * seed voice today, since no audio files ship in this repo — pressing play
 * still produces real, audible output: a short tone-sweep synthesised via the
 * Web Audio API, deterministically seeded from the voice id (`voicePreviewTone`)
 * so every voice sounds distinct and replays identically. It's clearly labeled
 * as a placeholder cue, not the real voice — never presented as if it were.
 */
function AudioPreviewControl({ voice }: { voice: Voice }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopSweepRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const hasSample = !!voice.sample;
  const sweep = useMemo(() => toneSweepParams(voice.id), [voice.id]);
  const previewDuration = hasSample ? voice.durationSec ?? 0 : sweep.durationSec;

  useEffect(() => {
    if (!hasSample) return;
    const audio = new Audio(voice.sample);
    audioRef.current = audio;
    const onEnded = () => {
      setPlaying(false);
      setElapsed(0);
    };
    const onTime = () => setElapsed(audio.currentTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.sample]);

  // Stop any in-flight synthesized sweep (and its rAF ticker) on unmount or
  // when the voice changes underneath this control.
  useEffect(() => {
    return () => {
      stopSweepRef.current?.();
      stopSweepRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.id]);

  const tickSweep = () => {
    const elapsedSec = (performance.now() - startedAtRef.current) / 1000;
    setElapsed(Math.min(elapsedSec, previewDuration));
    if (elapsedSec < previewDuration) {
      rafRef.current = requestAnimationFrame(tickSweep);
    }
  };

  const stop = () => {
    if (hasSample) {
      audioRef.current?.pause();
    } else {
      stopSweepRef.current?.();
      stopSweepRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    setPlaying(false);
    setElapsed(0);
  };

  const toggle = () => {
    if (playing) {
      stop();
      return;
    }
    if (hasSample) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      startedAtRef.current = performance.now();
      stopSweepRef.current = playToneSweep(voice.id, () => {
        setPlaying(false);
        setElapsed(0);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      });
      rafRef.current = requestAnimationFrame(tickSweep);
    }
    setPlaying(true);
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        title={!hasSample ? "Placeholder cue, not the real voice" : undefined}
        aria-label={
          playing
            ? `Stop ${hasSample ? "" : "placeholder "}preview for ${voice.name}`
            : `Play ${hasSample ? "" : "placeholder "}preview for ${voice.name}`
        }
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 transition-colors",
          playing ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-foreground hover:bg-foreground/15",
        )}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        <span className="font-mono text-[10px] tabular-nums">
          {formatTime(elapsed)} / {formatTime(previewDuration)}
        </span>
      </button>
      {!hasSample && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              role="note"
              aria-label={`This is a synthesised placeholder cue, not ${voice.name}'s real voice`}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground"
            >
              <Info className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-xs">
            Placeholder cue, synthesised in your browser — not {voice.name}'s real voice. Real samples arrive with
            the production pipeline.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function VoiceRow({
  voice,
  selected,
  onSelect,
}: {
  voice: Voice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card",
      )}
    >
      <AudioPreviewControl voice={voice} />
      <button type="button" aria-pressed={selected} onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{voice.name}</p>
        <p className="truncate text-[11px] leading-snug text-muted-foreground">{voice.description}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(voice.tones ?? []).map((t) => (
            <Tag key={t}>{toneLabel(t)}</Tag>
          ))}
          <ProvenanceTag provenance={voice.provenance} />
        </div>
      </button>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={3} />}
    </div>
  );
}

function ToneSelector({
  tone,
  onSelect,
  brandMatch,
}: {
  tone: string | null;
  onSelect: (id: string) => void;
  brandMatch: BrandToneMatch;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {VOICE_TONES.map((t) => {
        const active = tone === t.id;
        const isMatch = brandMatch.matchedIds.includes(t.id);
        const isConflict = brandMatch.conflictIds.includes(t.id);
        return (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(t.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : isMatch
                      ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                      : isConflict
                        ? "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60"
                        : "border-border bg-card text-foreground hover:border-foreground/30",
                )}
              >
                {!active && isMatch && <Check className="h-3 w-3" />}
                {!active && isConflict && <AlertTriangle className="h-3 w-3" />}
                {t.label}
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">
              <p>{toneDesc(t.id)}</p>
              {isMatch && <p className="mt-1 font-semibold text-primary">Matches this brand's voice</p>}
              {isConflict && <p className="mt-1 font-semibold text-muted-foreground">May clash with this brand's voice</p>}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
