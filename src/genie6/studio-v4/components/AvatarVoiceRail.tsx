import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Mic, Pause, Play, Shuffle, Sparkles, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatars, voices } from "../../mocks/library";

interface AvatarVoiceRailProps {
  selectedAvatarId: string | null;
  selectedVoiceId: string | null;
  onAvatarChange: (id: string | null) => void;
  onVoiceChange: (id: string | null) => void;
  onClose: () => void;
  /**
   * Display name of the currently-selected brand or product (resolved by the
   * caller from wizard.state.brandId / productId). Drives the "Suggested for
   * [Name]" banner on both tabs. When null/empty the suggestion UI hides.
   */
  contextLabel?: string | null;
  /**
   * Readable label of the selected angle (caller resolves wizard.state.angleId
   * → ANGLE_CHIP_LABEL[angleId]). Used only in the Auto card's audit reasoning
   * line ("… · {label} angle"). When absent the angle clause is omitted.
   */
  auditAngleLabel?: string;
}

type Tab = "avatar" | "voice";
type Mode = "presets" | "manual" | "browse";
type GenderChoice = "any" | "female" | "male";

/** Stable hash → hue (0-359) from an id, so gallery colors never shuffle. */
function hashHue(id: string, offset = 0): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h + offset) % 360;
}
/** Deterministic conic-gradient HSL pair for an avatar gallery card. */
function avatarGradient(id: string): { c1: string; c2: string } {
  const h1 = hashHue(id);
  const h2 = (h1 + 48) % 360;
  return { c1: `${h1} 72% 58%`, c2: `${h2} 80% 62%` };
}
/** Deterministic radial-glow HSL for a voice gallery card. */
function voiceGlow(id: string): string {
  return `${hashHue(id, 17)} 85% 60%`;
}

/** Stable index into a preset list of length `len`, derived from a string
 *  (brand/product name). Deterministic so the AI "suggestion" never shuffles
 *  for the same brand. Mock stand-in for backend persona matching. */
function presetIndexFor(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return len > 0 ? h % len : 0;
}

/** How long a mock voice preview "plays" before auto-stopping (ms). */
const PREVIEW_DURATION_MS = 3000;

/** Derive gender from voice id/name — first names in our mock data. */
const FEMALE_NAMES = new Set([
  "priya", "naina", "meera", "zoya", "ananya", "divya", "kavya", "nila",
  "rohini", "tara", "sanya", "priti", "emily", "sarah", "jessica", "olivia",
  "charlotte", "isabella", "sofia", "yuki", "mei", "ji-eun", "anya", "rina",
  "mai", "zara", "marie", "margaret", "amara", "thandi", "leila", "ava",
  "jieun", "ji",
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
  "en-GB": "British",
  "en-AU": "Australian",
  "es": "Spanish",
  "es-ES": "Castilian",
  "ja": "Japanese",
  "zh-CN": "Mandarin",
  "ko": "Korean",
  "th": "Thai",
  "fil": "Filipino",
  "id": "Bahasa",
  "vi": "Vietnamese",
  "ar": "Arabic",
  "fr": "French",
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

/** Parse "F · 28-34 · South Asian · mom" into compact bits. */
function parseDemographic(d: string): { genderAge: string; tag: string } {
  const parts = d.split("·").map((s) => s.trim()).filter(Boolean);
  const genderAge = parts.slice(0, 2).join(" · ");
  const last = parts[parts.length - 1] ?? "";
  const isLastEthnicity =
    parts.length <= 3 ||
    /asian|caucasian|mena|african|latin|european/i.test(last);
  const rawTag = isLastEthnicity ? parts[2] ?? "Auto" : last;
  const tag = rawTag.charAt(0).toUpperCase() + rawTag.slice(1);
  return { genderAge, tag };
}

/** "F · 28-34 · …" → gender "female"|"male" + age "28-34" + style "mom"/"gen-z"/etc. */
function parseAvatarParts(d: string): {
  gender: "female" | "male";
  age: string;
  style: string;
} {
  const parts = d.split("·").map((s) => s.trim()).filter(Boolean);
  const genderRaw = parts[0]?.toUpperCase() ?? "";
  const gender: "female" | "male" =
    genderRaw.startsWith("F") ? "female" : "male";
  const age = parts[1] ?? "";
  const last = parts[parts.length - 1] ?? "";
  const isLastEthnicity =
    parts.length <= 3 ||
    /asian|caucasian|mena|african|latin|european/i.test(last);
  const style = isLastEthnicity ? "general" : last.toLowerCase();
  return { gender, age, style };
}

/* ======================================================================
 *  Curated presets — Maalik wants personality, not the underlying real names.
 *  Each preset wraps an existing voice/avatar id with a label + tagline.
 * ====================================================================== */
type VoicePreset = {
  voiceId: string;
  label: string;
  tagline: string;
  /** HSL trio for the radial glow behind the waveform (h s% l%). */
  glow: string;
};

const VOICE_PRESETS: VoicePreset[] = [
  {
    voiceId: "voice-priya-warm",
    label: "The Confidant",
    tagline: "Warm friend you'd trust with a secret",
    glow: "12 92% 60%", // warm coral
  },
  {
    voiceId: "voice-aarav-energetic",
    label: "The Hype",
    tagline: "Pulls attention in two seconds flat",
    glow: "74 81% 59%", // electric lime
  },
  {
    voiceId: "voice-naina-confident",
    label: "The Authority",
    tagline: "Direct. No fluff. Closes the deal",
    glow: "262 70% 62%", // royal purple
  },
  {
    voiceId: "voice-vikram-authority",
    label: "The Voice of Reason",
    tagline: "Deep, deliberate, impossible to ignore",
    glow: "218 80% 55%", // deep blue
  },
  {
    voiceId: "voice-zoya-fashion",
    label: "The Trendsetter",
    tagline: "Urban, fashion-savvy, scroll-stopping",
    glow: "330 85% 65%", // hot pink
  },
  {
    voiceId: "voice-arjun-genz",
    label: "The Friend",
    tagline: "Casual Gen Z energy you can vibe with",
    glow: "168 70% 50%", // teal
  },
];

type AvatarPreset = {
  avatarId: string;
  label: string;
  tagline: string;
  /** HSL pair for the conic gradient. */
  c1: string;
  c2: string;
};

const AVATAR_PRESETS: AvatarPreset[] = [
  {
    avatarId: "ava-priya",
    label: "The Storyteller",
    tagline: "Soft eyes, warm presence — leans in",
    c1: "12 92% 60%",
    c2: "330 85% 65%",
  },
  {
    avatarId: "ava-arjun",
    label: "The Friend",
    tagline: "Gen Z mate, hangs out on your feed",
    c1: "168 70% 50%",
    c2: "74 81% 59%",
  },
  {
    avatarId: "ava-meera",
    label: "The Coach",
    tagline: "Mom-energy, gives you the real talk",
    c1: "32 90% 60%",
    c2: "12 92% 60%",
  },
  {
    avatarId: "ava-vikram",
    label: "The Authority",
    tagline: "Sharp suit, sharper opinions",
    c1: "218 80% 55%",
    c2: "262 70% 62%",
  },
  {
    avatarId: "ava-zoya",
    label: "The Trendsetter",
    tagline: "Lives in fashion week, drops drip",
    c1: "330 85% 65%",
    c2: "262 70% 62%",
  },
  {
    avatarId: "ava-rohan",
    label: "The Insider",
    tagline: "Knows the brand. Speaks like a regular",
    c1: "200 85% 55%",
    c2: "168 70% 50%",
  },
];

const VOICE_PRESET_IDS = new Set(VOICE_PRESETS.map((p) => p.voiceId));
const AVATAR_PRESET_IDS = new Set(AVATAR_PRESETS.map((p) => p.avatarId));

/**
 * AvatarVoiceRail — combined picker for the merged "Avatar · Voice"
 * chip in PromptReferenceBar (UGC Video mode only).
 *
 * Two modes per tab:
 *   - Presets (default): 6 curated personas with a unique name/tagline +
 *     stylized visual (waveform for voice, gradient portrait for avatar).
 *   - Manual: 3 attribute pickers (voice = gender/lang/tone, avatar =
 *     gender/age/style). When all three are set, surface the first match.
 */
export function AvatarVoiceRail({
  selectedAvatarId,
  selectedVoiceId,
  onAvatarChange,
  onVoiceChange,
  onClose,
  contextLabel,
  auditAngleLabel,
}: AvatarVoiceRailProps) {
  const [tab, setTab] = useState<Tab>("avatar");
  const [mode, setMode] = useState<Mode>("presets");

  // Only one voice preview plays at a time across the whole rail. Lifted here
  // so switching cards / tabs / modes stops any in-flight preview. Mock only —
  // real audio is wired backend-side.
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Voice manual selections
  const [manualVoiceGender, setManualVoiceGender] = useState<GenderChoice>("any");
  const [manualVoiceLang, setManualVoiceLang] = useState<string>("any");
  const [manualVoiceTone, setManualVoiceTone] = useState<string>("any");

  // Avatar manual selections
  const [manualAvatarGender, setManualAvatarGender] = useState<GenderChoice>("any");
  const [manualAvatarAge, setManualAvatarAge] = useState<string>("any");
  const [manualAvatarStyle, setManualAvatarStyle] = useState<string>("any");

  /** All voices, decorated with derived attributes (gender, tone, lang label). */
  const decoratedVoices = useMemo(() => {
    return voices.map((v) => ({
      ...v,
      gender: inferGender(v),
      tone: extractTone(v.description),
      lang: langLabel(v.language),
      shortName: v.name.split(/[\s—-]/)[0]?.trim() ?? v.name,
    }));
  }, []);

  /** All avatars, decorated. */
  const decoratedAvatars = useMemo(() => {
    return avatars.map((a) => ({
      ...a,
      ...parseAvatarParts(a.demographic),
    }));
  }, []);

  // Stop any in-flight voice preview when the user switches tab or mode — the
  // card that owns the timer may unmount, so kill the "playing" id centrally.
  useEffect(() => {
    setPlayingVoiceId(null);
  }, [tab, mode]);

  /* ── Suggested-for-brand (deterministic mock for backend AI matching) ──
   * Hash the brand/product display name → stable index into each preset list.
   * Same label across the two lists is NOT required here; each tab suggests
   * from its own preset array. Hidden entirely when no context. */
  const hasContext = !!contextLabel && contextLabel.trim().length > 0;
  const suggestedAvatarPreset = useMemo(() => {
    if (!hasContext) return null;
    return AVATAR_PRESETS[presetIndexFor(contextLabel!, AVATAR_PRESETS.length)] ?? null;
  }, [hasContext, contextLabel]);
  const suggestedVoicePreset = useMemo(() => {
    if (!hasContext) return null;
    return VOICE_PRESETS[presetIndexFor(contextLabel!, VOICE_PRESETS.length)] ?? null;
  }, [hasContext, contextLabel]);

  /* ── Auto-card "would-be" picks (mock AI Review & Audit) ──
   * When Auto is the ACTIVE selection, the Auto card expands to review the
   * avatar/voice the AI *would* use. The pick is the context-matched preset
   * (suggestedAvatar/VoicePreset) when there's context, else a STABLE default
   * (first preset) so the audit never shows empty. Resolve each to its real,
   * decorated record so the card can reuse the standard name + chip rendering.
   * Deterministic — same context always yields the same pick. */
  const autoAvatarPick = useMemo(() => {
    const preset = suggestedAvatarPreset ?? AVATAR_PRESETS[0];
    return decoratedAvatars.find((a) => a.id === preset.avatarId) ?? null;
  }, [suggestedAvatarPreset, decoratedAvatars]);
  const autoVoicePick = useMemo(() => {
    const preset = suggestedVoicePreset ?? VOICE_PRESETS[0];
    return decoratedVoices.find((v) => v.id === preset.voiceId) ?? null;
  }, [suggestedVoicePreset, decoratedVoices]);

  /* ── Avatar ↔ voice persona pairing (mock; shared persona `label`) ──
   * When the selected avatar is a PRESET whose label also names a voice preset
   * (e.g. "The Authority" exists in both lists), surface a one-tap hint on the
   * Voice tab to select that matching voice. */
  const selectedAvatarPreset = useMemo(
    () => AVATAR_PRESETS.find((p) => p.avatarId === selectedAvatarId) ?? null,
    [selectedAvatarId],
  );
  const pairedVoicePreset = useMemo(() => {
    if (!selectedAvatarPreset) return null;
    return (
      VOICE_PRESETS.find((v) => v.label === selectedAvatarPreset.label) ?? null
    );
  }, [selectedAvatarPreset]);

  /** Distinct values for Voice manual dropdowns — derived from data. */
  const voiceLangOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const v of voices) set.set(v.language, langLabel(v.language));
    return Array.from(set.entries()).map(([v, l]) => ({ v, l }));
  }, []);
  const voiceToneOptions = useMemo(() => {
    const set = new Set<string>();
    for (const v of decoratedVoices) set.add(v.tone);
    return Array.from(set).sort().map((t) => ({ v: t, l: t }));
  }, [decoratedVoices]);

  /** Distinct values for Avatar manual dropdowns. */
  const avatarAgeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of decoratedAvatars) if (a.age) set.add(a.age);
    return Array.from(set).sort().map((a) => ({ v: a, l: a }));
  }, [decoratedAvatars]);
  const avatarStyleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of decoratedAvatars) set.add(a.style);
    return Array.from(set)
      .sort()
      .map((s) => ({
        v: s,
        l: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "),
      }));
  }, [decoratedAvatars]);

  /** First voice that matches all 3 manual selections. */
  const matchedVoice = useMemo(() => {
    return decoratedVoices.find((v) => {
      if (manualVoiceGender !== "any" && v.gender !== manualVoiceGender) return false;
      if (manualVoiceLang !== "any" && v.language !== manualVoiceLang) return false;
      if (manualVoiceTone !== "any" && v.tone !== manualVoiceTone) return false;
      return true;
    });
  }, [decoratedVoices, manualVoiceGender, manualVoiceLang, manualVoiceTone]);

  /** First avatar that matches all 3 manual selections. */
  const matchedAvatar = useMemo(() => {
    return decoratedAvatars.find((a) => {
      if (manualAvatarGender !== "any" && a.gender !== manualAvatarGender) return false;
      if (manualAvatarAge !== "any" && a.age !== manualAvatarAge) return false;
      if (manualAvatarStyle !== "any" && a.style !== manualAvatarStyle) return false;
      return true;
    });
  }, [decoratedAvatars, manualAvatarGender, manualAvatarAge, manualAvatarStyle]);

  /** Auto-apply once all 3 manual filters are set (≠ "any"). */
  const allVoiceManualSet =
    manualVoiceGender !== "any" &&
    manualVoiceLang !== "any" &&
    manualVoiceTone !== "any";
  const allAvatarManualSet =
    manualAvatarGender !== "any" &&
    manualAvatarAge !== "any" &&
    manualAvatarStyle !== "any";

  useEffect(() => {
    if (
      mode === "manual" &&
      tab === "voice" &&
      allVoiceManualSet &&
      matchedVoice &&
      matchedVoice.id !== selectedVoiceId
    ) {
      onVoiceChange(matchedVoice.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tab, allVoiceManualSet, matchedVoice?.id]);

  useEffect(() => {
    if (
      mode === "manual" &&
      tab === "avatar" &&
      allAvatarManualSet &&
      matchedAvatar &&
      matchedAvatar.id !== selectedAvatarId
    ) {
      onAvatarChange(matchedAvatar.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tab, allAvatarManualSet, matchedAvatar?.id]);

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
        {/* Mode toggle — same UX on both tabs */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Choose by
          </span>
          <div className="inline-flex rounded-full border border-border/60 bg-background/40 p-0.5">
            {([
              { v: "presets", l: "Presets" },
              { v: "manual", l: "Manual" },
              { v: "browse", l: "Browse all" },
            ] as const).map((m) => {
              const active = mode === m.v;
              return (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setMode(m.v)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                    active
                      ? "bg-foreground/[0.08] text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.l}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "avatar" && (
          <div className="space-y-3">
            {suggestedAvatarPreset && (
              <SuggestionBanner
                contextLabel={contextLabel!}
                presetLabel={suggestedAvatarPreset.label}
                isSelected={selectedAvatarId === suggestedAvatarPreset.avatarId}
                onUse={() => onAvatarChange(suggestedAvatarPreset.avatarId)}
              />
            )}

            <AutoCard
              kind="avatar"
              active={selectedAvatarId === null}
              onSelect={() => onAvatarChange(null)}
              pick={autoAvatarPick}
              contextLabel={contextLabel}
              auditAngleLabel={auditAngleLabel}
              onUsePick={(id) => onAvatarChange(id)}
              onSwap={() => setMode("browse")}
            />

            {mode === "presets" && (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {AVATAR_PRESETS.map((preset) => {
                  const av = decoratedAvatars.find((a) => a.id === preset.avatarId);
                  if (!av) return null;
                  const active = selectedAvatarId === av.id;
                  return (
                    <li key={preset.avatarId}>
                      <AvatarPresetCard
                        preset={preset}
                        avatar={av}
                        active={active}
                        onSelect={() => onAvatarChange(av.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            {mode === "manual" && (
              <div className="space-y-2">
                <AttributePicker
                  label="Gender"
                  options={[
                    { v: "any", l: "Any" },
                    { v: "female", l: "Female" },
                    { v: "male", l: "Male" },
                  ]}
                  value={manualAvatarGender}
                  onChange={(v) => setManualAvatarGender(v as GenderChoice)}
                />
                <AttributePicker
                  label="Age"
                  options={[{ v: "any", l: "Any" }, ...avatarAgeOptions]}
                  value={manualAvatarAge}
                  onChange={setManualAvatarAge}
                />
                <AttributePicker
                  label="Style"
                  options={[{ v: "any", l: "Any" }, ...avatarStyleOptions]}
                  value={manualAvatarStyle}
                  onChange={setManualAvatarStyle}
                />

                <ManualMatchRow
                  kind="avatar"
                  ready={allAvatarManualSet}
                  match={
                    matchedAvatar
                      ? {
                          id: matchedAvatar.id,
                          title: matchedAvatar.name,
                          subtitle: matchedAvatar.demographic,
                        }
                      : null
                  }
                  selected={selectedAvatarId}
                  onUse={(id) => onAvatarChange(id)}
                />
              </div>
            )}

            {mode === "browse" && (
              <>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {decoratedAvatars.length} avatars
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {decoratedAvatars.map((av) => (
                    <li key={av.id}>
                      <AvatarGalleryCard
                        avatar={av}
                        active={selectedAvatarId === av.id}
                        onSelect={() => onAvatarChange(av.id)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {tab === "voice" && (
          <div className="space-y-3">
            {suggestedVoicePreset && (
              <SuggestionBanner
                contextLabel={contextLabel!}
                presetLabel={suggestedVoicePreset.label}
                isSelected={selectedVoiceId === suggestedVoicePreset.voiceId}
                onUse={() => onVoiceChange(suggestedVoicePreset.voiceId)}
              />
            )}

            {/* Avatar↔voice persona pairing — only when the chosen avatar preset
                shares a persona label with a voice preset and that voice isn't
                already selected. Subtle inline row, one-tap to match. */}
            {pairedVoicePreset && selectedVoiceId !== pairedVoicePreset.voiceId && (
              <PairingHint
                personaLabel={pairedVoicePreset.label}
                onUse={() => onVoiceChange(pairedVoicePreset.voiceId)}
              />
            )}

            <AutoCard
              kind="voice"
              active={selectedVoiceId === null}
              onSelect={() => onVoiceChange(null)}
              pick={autoVoicePick}
              contextLabel={contextLabel}
              auditAngleLabel={auditAngleLabel}
              onUsePick={(id) => onVoiceChange(id)}
              onSwap={() => setMode("browse")}
            />

            {mode === "presets" && (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {VOICE_PRESETS.map((preset) => {
                  const v = decoratedVoices.find((x) => x.id === preset.voiceId);
                  if (!v) return null;
                  const active = selectedVoiceId === v.id;
                  return (
                    <li key={preset.voiceId}>
                      <VoicePresetCard
                        preset={preset}
                        voice={v}
                        active={active}
                        playing={playingVoiceId === v.id}
                        onTogglePlay={() =>
                          setPlayingVoiceId((cur) => (cur === v.id ? null : v.id))
                        }
                        onSelect={() => onVoiceChange(v.id)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            {mode === "manual" && (
              <div className="space-y-2">
                <AttributePicker
                  label="Gender"
                  options={[
                    { v: "any", l: "Any" },
                    { v: "female", l: "Female" },
                    { v: "male", l: "Male" },
                  ]}
                  value={manualVoiceGender}
                  onChange={(v) => setManualVoiceGender(v as GenderChoice)}
                />
                <AttributePicker
                  label="Language"
                  options={[{ v: "any", l: "Any" }, ...voiceLangOptions]}
                  value={manualVoiceLang}
                  onChange={setManualVoiceLang}
                />
                <AttributePicker
                  label="Tone"
                  options={[{ v: "any", l: "Any" }, ...voiceToneOptions]}
                  value={manualVoiceTone}
                  onChange={setManualVoiceTone}
                />

                <ManualMatchRow
                  kind="voice"
                  ready={allVoiceManualSet}
                  match={
                    matchedVoice
                      ? {
                          id: matchedVoice.id,
                          title: matchedVoice.shortName,
                          subtitle: matchedVoice.description,
                        }
                      : null
                  }
                  selected={selectedVoiceId}
                  onUse={(id) => onVoiceChange(id)}
                />
              </div>
            )}

            {mode === "browse" && (
              <>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {decoratedVoices.length} voices
                </p>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {decoratedVoices.map((v) => (
                    <li key={v.id}>
                      <VoiceGalleryCard
                        voice={v}
                        active={selectedVoiceId === v.id}
                        playing={playingVoiceId === v.id}
                        onTogglePlay={() =>
                          setPlayingVoiceId((cur) => (cur === v.id ? null : v.id))
                        }
                        onSelect={() => onVoiceChange(v.id)}
                      />
                    </li>
                  ))}
                </ul>
              </>
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

/* ======================================================================
 *  Sub-components
 * ====================================================================== */

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

/** Decorated avatar shape the Auto card renders (name + parsed chip parts). */
type AutoAvatarPick = {
  id: string;
  name: string;
  demographic: string;
  gender: "female" | "male";
  age: string;
  style: string;
};
/** Decorated voice shape the Auto card renders (shortName + chip parts). */
type AutoVoicePick = {
  id: string;
  shortName: string;
  description: string;
  gender: "female" | "male";
  lang: string;
  tone: string;
};

/**
 * AutoCard — "Genie picks for you" card.
 *
 * Two visual states (Maalik-confirmed):
 *  - INACTIVE: the original compact button. Clicking it selects Auto (null).
 *  - ACTIVE (this kind's selection is Auto/null): EXPANDS inline into an
 *    "Avatar/Voice Review & Audit" panel — the AI's would-be pick (name +
 *    chips), a muted audit/reasoning line, and two actions: commit the shown
 *    pick ("Use this avatar/voice") or "Swap" (jump to Browse-all to choose
 *    another). Mock only; the pick is deterministic (see autoAvatarPick /
 *    autoVoicePick in the parent).
 *
 * Nested-button safety: the active state is a <div> (buttons can't nest) so
 * the "Use this…" / "Swap" actions are real buttons. No explicit "keep Auto"
 * affordance is needed — Auto is already the active selection (ring + check).
 */
function AutoCard({
  kind,
  active,
  onSelect,
  pick,
  contextLabel,
  auditAngleLabel,
  onUsePick,
  onSwap,
}: {
  kind: "avatar" | "voice";
  active: boolean;
  onSelect: () => void;
  /** The AI's would-be pick (decorated avatar OR voice depending on kind). */
  pick?: AutoAvatarPick | AutoVoicePick | null;
  contextLabel?: string | null;
  auditAngleLabel?: string;
  onUsePick?: (id: string) => void;
  onSwap?: () => void;
}) {
  const Icon = kind === "avatar" ? User : Mic;
  const description =
    kind === "avatar"
      ? "Genie picks the best avatar for your script"
      : "Genie matches voice to brand + avatar";

  // INACTIVE — original compact button, unchanged. Clicking selects Auto.
  if (!active) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-2 rounded-xl border border-border/40 bg-card/60 p-3 text-left backdrop-blur-sm transition-colors hover:border-foreground/20"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.08]">
          <Icon className="h-3.5 w-3.5 text-foreground/70" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-foreground">Auto</p>
          <p className="truncate text-[10px] text-muted-foreground">{description}</p>
        </div>
      </button>
    );
  }

  // ACTIVE — expanded Review & Audit panel.
  const hasCtx = !!contextLabel && contextLabel.trim().length > 0;
  const reasoning = `Matched to ${hasCtx ? contextLabel : "your audience"}${
    auditAngleLabel ? ` · ${auditAngleLabel} angle` : ""
  }`;

  return (
    <div className="rounded-xl border border-primary/50 bg-primary/5 p-3 ring-2 ring-primary/30 backdrop-blur-sm">
      {/* Header row — Auto label + active check (mirrors the compact card). */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-foreground">Auto</p>
          <p className="truncate text-[10px] text-muted-foreground">{description}</p>
        </div>
        <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
      </div>

      {pick && (
        <>
          {/* Review panel — the AI's would-be pick. */}
          <div className="mt-2.5 rounded-lg border border-border/50 bg-background/40 p-2.5">
            <p className="flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-2.5 w-2.5 text-primary" />
              AI will use
            </p>
            <p className="mt-1 truncate text-[13px] font-bold leading-tight text-foreground">
              {kind === "avatar"
                ? (pick as AutoAvatarPick).name
                : (pick as AutoVoicePick).shortName}
            </p>

            {/* Attribute chips — same rendering as the preset/gallery cards. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {kind === "avatar" ? (
                <AutoAvatarChips pick={pick as AutoAvatarPick} />
              ) : (
                <AutoVoiceChips pick={pick as AutoVoicePick} />
              )}
            </div>

            {/* Audit / reasoning line — muted, with a subtle AI marker. */}
            <p className="mt-2 flex items-start gap-1 text-[10px] leading-snug text-muted-foreground">
              <Sparkles className="mt-px h-2.5 w-2.5 shrink-0 text-primary/70" />
              <span className="min-w-0">{reasoning}</span>
            </p>
          </div>

          {/* Actions — commit the shown pick, or swap to choose another. */}
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUsePick?.(pick.id)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground transition-colors hover:opacity-90"
            >
              <Check className="h-3 w-3" strokeWidth={3} />
              {kind === "avatar" ? "Use this avatar" : "Use this voice"}
            </button>
            <button
              type="button"
              onClick={() => onSwap?.()}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Shuffle className="h-3 w-3" />
              Swap
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Avatar chips for the Auto review panel — gender · age · style. Mirrors
 *  AvatarPresetCard / AvatarGalleryCard chip logic ("general" → "Auto"). */
function AutoAvatarChips({ pick }: { pick: AutoAvatarPick }) {
  const styleLabel =
    pick.style === "general"
      ? "Auto"
      : pick.style.charAt(0).toUpperCase() + pick.style.slice(1).replace(/-/g, " ");
  return (
    <>
      <Chip>{pick.gender === "female" ? "♀ F" : "♂ M"}</Chip>
      {pick.age && <Chip>{pick.age}</Chip>}
      <Chip variant="primary">{styleLabel}</Chip>
    </>
  );
}

/** Voice chips for the Auto review panel — gender · language · tone. Mirrors
 *  VoicePresetCard / VoiceGalleryCard chip logic. */
function AutoVoiceChips({ pick }: { pick: AutoVoicePick }) {
  return (
    <>
      <Chip>{pick.gender === "female" ? "♀ F" : "♂ M"}</Chip>
      <Chip>{pick.lang}</Chip>
      <Chip variant="primary">{pick.tone}</Chip>
    </>
  );
}

/** Label on the left, scrollable segmented pills on the right. */
function AttributePicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="-mx-0.5 flex min-w-0 flex-1 items-center overflow-x-auto px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex shrink-0 rounded-full border border-border/60 bg-background/40 p-0.5">
          {options.map((o) => {
            const active = value === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => onChange(o.v)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                  active
                    ? "bg-foreground/[0.08] text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Full-width row shown below the manual pickers — match found or empty state. */
function ManualMatchRow({
  kind,
  ready,
  match,
  selected,
  onUse,
}: {
  kind: "avatar" | "voice";
  ready: boolean;
  match: { id: string; title: string; subtitle: string } | null;
  selected: string | null;
  onUse: (id: string) => void;
}) {
  if (!ready) {
    return (
      <p className="rounded-xl border border-dashed border-border/50 bg-card/30 px-3 py-4 text-center text-[11px] text-muted-foreground">
        Pick all three to see your match
      </p>
    );
  }
  if (!match) {
    return (
      <p className="rounded-xl border border-dashed border-border/50 bg-card/30 px-3 py-4 text-center text-[11px] text-muted-foreground">
        No match — try different criteria
      </p>
    );
  }
  const isSelected = selected === match.id;
  return (
    <div
      className={cn(
        "rounded-xl border p-3 backdrop-blur-sm transition-colors",
        isSelected
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 bg-card/60",
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Match
      </p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{match.title}</p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
        {match.subtitle}
      </p>
      <button
        type="button"
        onClick={() => onUse(match.id)}
        className={cn(
          "mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
          isSelected
            ? "bg-primary/15 text-primary"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        {isSelected ? (
          <>
            <Check className="h-3 w-3" strokeWidth={3} />
            Selected
          </>
        ) : (
          `Use this ${kind}`
        )}
      </button>
    </div>
  );
}

/* ======================================================================
 *  Voice preset card — animated waveform + tinted glow
 * ====================================================================== */
function VoicePresetCard({
  preset,
  voice,
  active,
  playing,
  onTogglePlay,
  onSelect,
}: {
  preset: VoicePreset;
  voice: {
    id: string;
    gender: "female" | "male";
    lang: string;
    tone: string;
    description: string;
  };
  active: boolean;
  playing: boolean;
  onTogglePlay: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-full w-full flex-col gap-2 rounded-xl border p-3 text-left backdrop-blur-sm transition-all",
        active
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      {/* Visual: tinted radial glow + animated waveform + preview play control */}
      <VoiceWaveform
        glow={preset.glow}
        active={active}
        playing={playing}
        onTogglePlay={onTogglePlay}
      />

      {/* Name + tagline */}
      <div className="space-y-0.5">
        <p className="text-[13px] font-bold leading-tight text-foreground">
          {preset.label}
        </p>
        <p className="line-clamp-1 text-[11px] italic leading-snug text-muted-foreground">
          {preset.tagline}
        </p>
      </div>

      {/* Attribute chips: gender · language · tone */}
      <div className="flex flex-wrap items-center gap-1">
        <Chip>{voice.gender === "female" ? "♀ F" : "♂ M"}</Chip>
        <Chip>{voice.lang}</Chip>
        <Chip variant="primary">{voice.tone}</Chip>
      </div>

      {active && (
        <span className="absolute right-2 top-2">
          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/* ======================================================================
 *  Avatar preset card — gradient portrait + monogram + decorative shapes
 * ====================================================================== */
function AvatarPresetCard({
  preset,
  avatar,
  active,
  onSelect,
}: {
  preset: AvatarPreset;
  avatar: {
    id: string;
    name: string;
    demographic: string;
    language: string[];
    gender: "female" | "male";
    age: string;
    style: string;
  };
  active: boolean;
  onSelect: () => void;
}) {
  const initial = avatar.name.charAt(0).toUpperCase();
  const styleLabel =
    avatar.style === "general"
      ? "Auto"
      : avatar.style.charAt(0).toUpperCase() + avatar.style.slice(1).replace(/-/g, " ");
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-full w-full flex-col gap-2 rounded-xl border p-3 text-left backdrop-blur-sm transition-all",
        active
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      {/* Visual: stylized portrait — conic gradient circle + monogram + decoration */}
      <div className="relative h-16 overflow-hidden rounded-lg bg-foreground/[0.04]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              className="h-12 w-12 rounded-full transition-transform duration-500 group-hover:rotate-[18deg]"
              style={{
                background: `conic-gradient(from 90deg, hsl(${preset.c1}), hsl(${preset.c2}), hsl(${preset.c1}))`,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center text-base font-bold text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
            >
              {initial}
            </span>
            {/* Decorative dot top-right */}
            <span
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-card"
              style={{ background: `hsl(${preset.c2})` }}
            />
            {/* Decorative ring bottom-left */}
            <span className="absolute -left-2 bottom-0 h-3 w-3 rounded-full border border-foreground/20" />
          </div>
        </div>
      </div>

      {/* Name + tagline */}
      <div className="space-y-0.5">
        <p className="text-[13px] font-bold leading-tight text-foreground">
          {preset.label}
        </p>
        <p className="line-clamp-1 text-[11px] italic leading-snug text-muted-foreground">
          {preset.tagline}
        </p>
      </div>

      {/* Attribute chips: gender · age · style */}
      <div className="flex flex-wrap items-center gap-1">
        <Chip>{avatar.gender === "female" ? "♀ F" : "♂ M"}</Chip>
        {avatar.age && <Chip>{avatar.age}</Chip>}
        <Chip variant="primary">{styleLabel}</Chip>
      </div>

      {active && (
        <span className="absolute right-2 top-2">
          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/* ======================================================================
 *  Gallery cards — "Browse all" mode. Same VISUAL language as the preset
 *  cards above, but every field is driven by a real avatar/voice record and
 *  colors are hashed off the id (stable, no persona label/tagline).
 * ====================================================================== */
function AvatarGalleryCard({
  avatar,
  active,
  onSelect,
}: {
  avatar: {
    id: string;
    name: string;
    demographic: string;
    language: string[];
    gender: "female" | "male";
    age: string;
    style: string;
  };
  active: boolean;
  onSelect: () => void;
}) {
  const initial = avatar.name.charAt(0).toUpperCase();
  const { c1, c2 } = avatarGradient(avatar.id);
  const styleLabel =
    avatar.style === "general"
      ? "Auto"
      : avatar.style.charAt(0).toUpperCase() +
        avatar.style.slice(1).replace(/-/g, " ");
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-full w-full flex-col gap-2 rounded-xl border p-3 text-left backdrop-blur-sm transition-all",
        active
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      {/* Visual: stylized portrait — conic gradient circle + monogram + decoration */}
      <div className="relative h-16 overflow-hidden rounded-lg bg-foreground/[0.04]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              className="h-12 w-12 rounded-full transition-transform duration-500 group-hover:rotate-[18deg]"
              style={{
                background: `conic-gradient(from 90deg, hsl(${c1}), hsl(${c2}), hsl(${c1}))`,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center text-base font-bold text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
            >
              {initial}
            </span>
            <span
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-card"
              style={{ background: `hsl(${c2})` }}
            />
            <span className="absolute -left-2 bottom-0 h-3 w-3 rounded-full border border-foreground/20" />
          </div>
        </div>
      </div>

      {/* Real name + demographic line */}
      <div className="space-y-0.5">
        <p className="truncate text-[13px] font-bold leading-tight text-foreground">
          {avatar.name}
        </p>
        <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground">
          {avatar.demographic}
        </p>
      </div>

      {/* Attribute chips: gender · age · style */}
      <div className="flex flex-wrap items-center gap-1">
        <Chip>{avatar.gender === "female" ? "♀ F" : "♂ M"}</Chip>
        {avatar.age && <Chip>{avatar.age}</Chip>}
        <Chip variant="primary">{styleLabel}</Chip>
      </div>

      {active && (
        <span className="absolute right-2 top-2">
          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function VoiceGalleryCard({
  voice,
  active,
  playing,
  onTogglePlay,
  onSelect,
}: {
  voice: {
    id: string;
    name: string;
    shortName: string;
    gender: "female" | "male";
    lang: string;
    tone: string;
    description: string;
  };
  active: boolean;
  playing: boolean;
  onTogglePlay: () => void;
  onSelect: () => void;
}) {
  const glow = voiceGlow(voice.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-full w-full flex-col gap-2 rounded-xl border p-3 text-left backdrop-blur-sm transition-all",
        active
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      {/* Visual: tinted radial glow + animated waveform + preview play control */}
      <VoiceWaveform
        glow={glow}
        active={active}
        playing={playing}
        onTogglePlay={onTogglePlay}
      />

      {/* Real name + description line */}
      <div className="space-y-0.5">
        <p className="truncate text-[13px] font-bold leading-tight text-foreground">
          {voice.shortName}
        </p>
        <p className="line-clamp-1 text-[11px] leading-snug text-muted-foreground">
          {voice.description}
        </p>
      </div>

      {/* Attribute chips: gender · language · tone */}
      <div className="flex flex-wrap items-center gap-1">
        <Chip>{voice.gender === "female" ? "♀ F" : "♂ M"}</Chip>
        <Chip>{voice.lang}</Chip>
        <Chip variant="primary">{voice.tone}</Chip>
      </div>

      {active && (
        <span className="absolute right-2 top-2">
          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function Chip({
  children,
  variant = "muted",
}: {
  children: React.ReactNode;
  variant?: "muted" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
        variant === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-muted/60 text-foreground",
      )}
    >
      {children}
    </span>
  );
}

/* ======================================================================
 *  VoiceWaveform — shared visual for both voice cards.
 *  Tinted radial glow + 5 animated bars + a preview Play/Pause control.
 *  "Playing" is controlled by the parent (only one voice plays at a time);
 *  this component owns the ~3s auto-stop timer and stops it on unmount.
 *  The play control stops propagation so previewing never selects the card.
 * ====================================================================== */
function VoiceWaveform({
  glow,
  active,
  playing,
  onTogglePlay,
}: {
  glow: string;
  active: boolean;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  // Resting bars are short + staggered. While playing they go taller/livelier.
  const restHeights = [40, 70, 100, 70, 40];
  const playHeights = [55, 92, 100, 88, 60];
  const delays = [0, 100, 200, 300, 400];

  // Auto-stop the mock preview after ~3s. Cleared on unmount and whenever the
  // playing state flips (e.g. user toggles another card → parent clears this).
  const stopRef = useRef(onTogglePlay);
  stopRef.current = onTogglePlay;
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => stopRef.current(), PREVIEW_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [playing]);

  return (
    <div className="relative h-16 overflow-hidden rounded-lg bg-foreground/[0.04]">
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          background: `radial-gradient(circle at center, hsl(${glow} / ${
            playing ? "0.4" : "0.22"
          }), transparent 70%)`,
          opacity: playing ? 1 : active ? 1 : 0.7,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-1">
        {restHeights.map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full transition-[colors,height] duration-300",
              playing
                ? "bg-primary animate-pulse motion-reduce:animate-none"
                : "bg-foreground/40 animate-pulse motion-reduce:animate-none group-hover:bg-foreground/70",
            )}
            style={{
              height: `${playing ? playHeights[i] : h}%`,
              animationDelay: `${delays[i]}ms`,
              // Livelier (faster) pulse while playing.
              animationDuration: playing ? "0.6s" : "1.2s",
            }}
          />
        ))}
      </div>

      {/* Preview Play/Pause control — separate from card select. */}
      <span
        role="button"
        tabIndex={0}
        aria-label={playing ? "Pause preview" : "Play preview"}
        aria-pressed={playing}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onTogglePlay();
          }
        }}
        className={cn(
          "absolute left-1.5 top-1.5 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm transition-colors",
          playing
            ? "border-primary/50 bg-primary text-primary-foreground"
            : "border-border/60 bg-background/80 text-foreground/80 hover:border-primary/40 hover:text-primary",
        )}
      >
        {playing ? (
          <Pause className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <Play className="h-3 w-3 translate-x-px" strokeWidth={2.5} />
        )}
      </span>

      {/* Tiny affordance label — makes it read clearly as a sample. */}
      <span className="absolute bottom-1 right-1.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
        {playing ? "Playing…" : "Preview"}
      </span>
    </div>
  );
}

/* ======================================================================
 *  SuggestionBanner — compact "Suggested for [Name]" row (NOT a card).
 *  Deterministic AI-mock pick; one-tap "Use" selects the preset. Hidden by
 *  the caller when there's no brand/product context.
 * ====================================================================== */
function SuggestionBanner({
  contextLabel,
  presetLabel,
  isSelected,
  onUse,
}: {
  contextLabel: string;
  presetLabel: string;
  isSelected: boolean;
  onUse: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-2.5 py-2">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-3 w-3 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary">
          AI · Suggested for {contextLabel}
        </p>
        <p className="truncate text-[12px] font-bold leading-tight text-foreground">
          {presetLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onUse}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
          isSelected
            ? "bg-primary/15 text-primary"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        {isSelected ? (
          <>
            <Check className="h-3 w-3" strokeWidth={3} />
            Selected
          </>
        ) : (
          "Use"
        )}
      </button>
    </div>
  );
}

/* ======================================================================
 *  PairingHint — subtle inline "Pair with the [Persona] voice →" row, shown
 *  on the Voice tab when the chosen avatar preset shares a persona label with
 *  a voice preset. One-tap selects the matching voice. Mock pairing.
 * ====================================================================== */
function PairingHint({
  personaLabel,
  onUse,
}: {
  personaLabel: string;
  onUse: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onUse}
      className="group flex w-full items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/[0.04] px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/[0.07]"
    >
      <Sparkles className="h-3 w-3 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate">
        Pair with the{" "}
        <span className="font-semibold text-foreground">{personaLabel}</span>{" "}
        voice
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

// Suppress unused warnings for helpers preserved for future use / consistency.
void parseDemographic;
void VOICE_PRESET_IDS;
void AVATAR_PRESET_IDS;
