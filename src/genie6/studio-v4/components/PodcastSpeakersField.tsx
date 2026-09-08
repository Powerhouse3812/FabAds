import { useState } from "react";
import { Mic, Pencil, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { avatars, voices } from "@/mocks/shared";
import { AvatarPickerField } from "@/genie6/apps/fields/AvatarPickerField";
import type { AvatarPickerValue } from "@/genie6/apps/lib/fieldHelpers";
import { SectionHeader } from "./SectionHeader";
import type { UseWizardReturn } from "../state/useWizard";

/**
 * PodcastSpeakersField — Studio Alpha Configure, Podcast mode only
 * (§9, Maalik 2026-09-08).
 *
 * Podcast is its own Studio Mode specifically BECAUSE of this field: a
 * speaker count no other Mode has, optional and unbounded — 0 (audio only,
 * no avatar at all), 1 (solo host), 2 (co-hosted), 3+ (panel), no ceiling
 * by design.
 *
 * `wizard.state.podcastSpeakers` (useWizard.ts — owned by another agent in
 * this release, read/written here only through `wizard.patch`, never
 * edited directly) is the ONLY piece of this field that lives on
 * WizardState. Per-speaker avatar/voice/tone picks are kept in LOCAL state
 * (`speakerPicks` below) rather than added to WizardState: an unbounded,
 * per-index set of picks has no flat-field home there, and this task's
 * brief is explicit that WizardState isn't to grow for it. If a later step
 * needs these picks to survive navigation or reload, promote them there
 * deliberately then — don't assume it silently already happened.
 *
 * Count control mirrors `NumberStepper` (PromptReferenceBar.tsx, used there
 * for output count) — same pill, same −/+ buttons — but is DUPLICATED
 * locally below as `SpeakerCountStepper` rather than imported: NumberStepper
 * isn't exported there, and this task is scoped to exactly two files (this
 * one + AlphaStep3Configure.tsx), so exporting it would mean editing a
 * third. Markup/classNames are copied verbatim, not restyled — only the
 * bounds differ (0..unbounded here vs 1..20 there).
 *
 * Avatar + voice picking reuses the one picker every face in Genie shares —
 * `AvatarPickerField` (Apps) wrapping Brain's `AvatarVoicePicker` — one
 * instance per speaker, opened from a compact row trigger rather than
 * rendered N-up inline (N is unbounded; a full picker per row would not
 * scale). Deliberately NOT Studio's own `AvatarVoiceRail` — that rail is
 * bound to the single `wizard.state.avatarId`/`voiceId` pair and has
 * nowhere to put a second, third, or fourth speaker's pick.
 */

interface PodcastSpeakersFieldProps {
  wizard: UseWizardReturn;
}

const MIN_SPEAKERS = 0;

export function PodcastSpeakersField({ wizard }: PodcastSpeakersFieldProps) {
  const count = wizard.state.podcastSpeakers;

  // LOCAL ONLY — see file doc comment above. Keyed by speaker index; sparse
  // on purpose so lowering the count and raising it again doesn't discard an
  // earlier pick for a speaker slot that's still in range.
  const [speakerPicks, setSpeakerPicks] = useState<Record<number, AvatarPickerValue>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const setCount = (n: number) =>
    wizard.patch({ podcastSpeakers: Math.max(MIN_SPEAKERS, n) });

  const updateSpeaker = (index: number, value: AvatarPickerValue) => {
    setSpeakerPicks((prev) => ({ ...prev, [index]: value }));
  };

  return (
    <div className="v3-glass-card shrink-0 overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 px-4 pt-3">
        <SectionHeader title="Speakers" icon={Mic} size="compact" />
        <SpeakerCountStepper value={count} onChange={setCount} />
      </div>

      <div className="px-4 pb-3 pt-2">
        {count === MIN_SPEAKERS ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            No on-screen speaker — this podcast generates as audio only.
          </p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
            {Array.from({ length: count }, (_, index) => (
              <SpeakerRow
                key={index}
                index={index}
                value={speakerPicks[index]}
                open={openIndex === index}
                onOpenChange={(next) => setOpenIndex(next ? index : null)}
                onChange={(value) => updateSpeaker(index, value)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SpeakerRow — one speaker's compact summary + edit trigger.
 *  Popover is excluded from the app-wide "no outside-click dismiss" rule
 *  (same exclusion PromptReferenceBar's Model / Language popovers rely on).
 * ────────────────────────────────────────────────────────── */
function SpeakerRow({
  index,
  value,
  open,
  onOpenChange,
  onChange,
}: {
  index: number;
  value: AvatarPickerValue | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: AvatarPickerValue) => void;
}) {
  // Same "Auto · Auto" / real-name resolution PromptReferenceBar's avatar
  // chip uses, against the SAME catalogue AvatarVoicePicker itself reads
  // from (@/mocks/shared) — not the Studio-only avatarId/voiceId pair on
  // WizardState, which this field never touches.
  const avatarName = value?.avatarId
    ? avatars.find((a) => a.id === value.avatarId)?.name ?? "Auto"
    : "Auto";
  const voiceName = value?.voiceId
    ? (voices.find((v) => v.id === value.voiceId)?.name ?? "Auto").split("—").pop()!.trim()
    : "Auto";

  return (
    <li>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="group flex w-full items-center gap-2.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-left transition-colors hover:border-foreground/20 hover:bg-background/70"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
              <User className="h-3 w-3" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold text-foreground">
                Speaker {index + 1}
              </span>
              <span className="block truncate font-mono text-[10px] text-muted-foreground">
                {avatarName} · {voiceName}
              </span>
            </span>
            <Pencil
              className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
              aria-hidden
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="w-[420px] max-h-[70vh] overflow-y-auto p-3">
          <p className="mb-2 px-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Speaker {index + 1} · Avatar &amp; voice
          </p>
          <AvatarPickerField
            field={{
              kind: "avatar-picker",
              id: `podcast-speaker-${index}`,
              label: `Speaker ${index + 1}`,
              withVoice: true,
              withTone: true,
              required: false,
            }}
            value={value}
            onChange={onChange}
          />
        </PopoverContent>
      </Popover>
    </li>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SpeakerCountStepper — 0..unbounded −/+ pill.
 *  Duplicated from PromptReferenceBar.tsx's NumberStepper (same control,
 *  used there for output count) — see the file doc comment above for why
 *  this is a copy rather than an import. Markup/classNames are unchanged;
 *  only the bounds (0..unbounded vs 1..20) and the a11y labels
 *  (speaker-specific) differ.
 * ────────────────────────────────────────────────────────── */
function SpeakerCountStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(MIN_SPEAKERS, n);
  return (
    <div
      role="group"
      aria-label="Speaker count"
      title="Speakers"
      className="ml-auto inline-flex h-7 items-center gap-0.5 rounded-full border border-border/60 bg-background/50 px-1"
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= MIN_SPEAKERS}
        aria-label="Decrease speaker count"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[14px] leading-none">−</span>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        min={MIN_SPEAKERS}
        aria-label="Number of speakers"
        className="w-7 bg-transparent text-center font-mono text-[11px] font-semibold text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase speaker count"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <span className="text-[12px] leading-none">+</span>
      </button>
      {/* Announced on every change regardless of which control has focus —
          the −/+ buttons move focus to themselves, not the input, so a
          screen reader wouldn't otherwise hear the new value without this. */}
      <span className="sr-only" aria-live="polite">
        {value} speaker{value === 1 ? "" : "s"}
      </span>
    </div>
  );
}
