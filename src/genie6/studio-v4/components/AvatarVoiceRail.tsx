import { useMemo, useState } from "react";
import { Check, Mic, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatars, voices } from "../../mocks/library";

interface AvatarVoiceRailProps {
  selectedAvatarId: string | null;
  selectedVoiceId: string | null;
  onAvatarChange: (id: string | null) => void;
  onVoiceChange: (id: string | null) => void;
  onClose: () => void;
}

type Tab = "avatar" | "voice";
type GenderFilter = "all" | "female" | "male";

/** Derive gender from voice id/name — first names in our mock data. */
const FEMALE_NAMES = new Set([
  "priya", "naina", "meera", "zoya", "ananya", "divya", "kavya", "nila",
  "rohini", "tara", "sanya", "priti", "emily",
]);
function inferGender(voice: { id: string; name: string }): "female" | "male" {
  const first = voice.name.split(/[\s—-]/)[0]?.toLowerCase().trim() ?? "";
  return FEMALE_NAMES.has(first) ? "female" : "male";
}

/** Pretty language label from BCP-47 code. */
const LANG_LABEL: Record<string, string> = {
  "hi-IN": "Hindi",
  "en-IN": "Hinglish",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "ml-IN": "Malayalam",
  "kn-IN": "Kannada",
  "mr-IN": "Marathi",
  "bn-IN": "Bengali",
  "pa-IN": "Punjabi",
  "gu-IN": "Gujarati",
  "en-US": "English",
};
function langLabel(code: string): string {
  return LANG_LABEL[code] ?? code;
}

/** Extract the leading tone keyword from a voice description.
 *  e.g. "Warm, motherly, conversational. Best for…" → "Warm" */
function extractTone(description: string): string {
  const first = description.split(/[,.]/)[0]?.trim() ?? "";
  const word = first.split(/\s+/)[0] ?? "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * AvatarVoiceRail — combined picker for the merged "Avatar · Voice"
 * chip in PromptReferenceBar (UGC Video mode only). Tabbed —
 * Avatar (single-select) + Voice (single-select).
 *
 * Real avatar images don't exist in the mock data — we render
 * deterministic colored circles with name initials. Voice list
 * shows name + language + 1-line description.
 */
export function AvatarVoiceRail({
  selectedAvatarId,
  selectedVoiceId,
  onAvatarChange,
  onVoiceChange,
  onClose,
}: AvatarVoiceRailProps) {
  const [tab, setTab] = useState<Tab>("avatar");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");

  /** Voice presets — derive gender + tone, optionally filter by gender. */
  const voicePresets = useMemo(() => {
    return voices.slice(0, 24).map((v) => ({
      ...v,
      gender: inferGender(v),
      tone: extractTone(v.description),
      lang: langLabel(v.language),
      shortName: v.name.split(/[\s—-]/)[0]?.trim() ?? v.name,
    }));
  }, []);

  const filteredVoices = useMemo(() => {
    if (genderFilter === "all") return voicePresets;
    return voicePresets.filter((v) => v.gender === genderFilter);
  }, [voicePresets, genderFilter]);

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            UGC Video
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Avatar · Voice
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="shrink-0 flex border-b border-border bg-muted/20 px-2 py-1">
        <TabBtn
          active={tab === "avatar"}
          onClick={() => setTab("avatar")}
          icon={User}
        >
          Avatar
        </TabBtn>
        <TabBtn
          active={tab === "voice"}
          onClick={() => setTab("voice")}
          icon={Mic}
        >
          Voice
        </TabBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "avatar" && (
          <ul className="space-y-1">
            <PickRow
              active={selectedAvatarId === null}
              label="Auto"
              sub="Genie picks the best avatar for your script."
              onClick={() => onAvatarChange(null)}
              avatarText="A"
              avatarBg="hsl(0, 0%, 60%)"
            />
            {avatars.slice(0, 12).map((a) => (
              <PickRow
                key={a.id}
                active={selectedAvatarId === a.id}
                label={a.name}
                sub={a.demographic}
                onClick={() => onAvatarChange(a.id)}
                avatarText={a.name.charAt(0).toUpperCase()}
                avatarBg={stringToHsl(a.name)}
              />
            ))}
          </ul>
        )}

        {tab === "voice" && (
          <div className="space-y-3">
            {/* Gender filter pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Gender
              </span>
              <div className="inline-flex rounded-full border border-border/60 bg-background/40 p-0.5">
                {(["all", "female", "male"] as const).map((g) => {
                  const active = genderFilter === g;
                  const label = g === "all" ? "All" : g === "female" ? "Female" : "Male";
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenderFilter(g)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                        active
                          ? "bg-foreground/[0.08] text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                {filteredVoices.length} preset{filteredVoices.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Auto card — full-width */}
            <button
              type="button"
              onClick={() => onVoiceChange(null)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border bg-card/60 p-3 text-left backdrop-blur-sm transition-colors",
                selectedVoiceId === null
                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                  : "border-border/40 hover:border-foreground/20",
              )}
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.08]">
                <Mic className="h-3.5 w-3.5 text-foreground/70" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-foreground">Auto</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  Genie matches voice to brand + avatar
                </p>
              </div>
              {selectedVoiceId === null && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
              )}
            </button>

            {/* Voice presets — minimal cards with gender · language · tone */}
            {filteredVoices.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-muted-foreground">
                No {genderFilter} voices available
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredVoices.map((v) => {
                  const active = selectedVoiceId === v.id;
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => onVoiceChange(v.id)}
                        className={cn(
                          "group flex h-full w-full flex-col gap-2 rounded-xl border p-3 text-left backdrop-blur-sm transition-all",
                          active
                            ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                            : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                        )}
                      >
                        {/* Attributes row: gender · language · tone */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground"
                            title={v.gender === "female" ? "Female" : "Male"}
                          >
                            {v.gender === "female" ? "♀ F" : "♂ M"}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground">
                            {v.lang}
                          </span>
                          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                            {v.tone}
                          </span>
                        </div>

                        {/* Voice name */}
                        <p className="text-[13px] font-bold leading-tight text-foreground">
                          {v.shortName}
                        </p>

                        {/* Description */}
                        <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                          {v.description}
                        </p>

                        {active && (
                          <span className="absolute right-2 top-2">
                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <footer className="shrink-0 flex items-center justify-end border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Done
        </button>
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function PickRow({
  active,
  label,
  sub,
  onClick,
  avatarText,
  avatarBg,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  avatarText: string;
  avatarBg: string;
  icon?: React.ElementType;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border bg-background p-2 text-left transition-colors",
          active
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "border-border hover:border-primary/40",
        )}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: avatarBg }}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : avatarText}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">
            {label}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
        </div>
        {active && (
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
        )}
      </button>
    </li>
  );
}

function stringToHsl(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}
