import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { TONES, type ToneLabel } from "../modeConfigs";

/**
 * TonePicker — chip grid + hover-preview showing how this tone rewrites the
 * same brand message.
 *
 * Iter-5 enhancement: tone labels alone (Premium / Casual / Urgent) don't
 * communicate voice. Hover any chip → 1-2 sample headlines that demonstrate
 * how that tone shapes copy. Linear's color picker / Figma's component
 * picker pattern: hover shows USES of the property, not just the value.
 */

interface ToneSample {
  /** Two-line description of the voice character. */
  description: string;
  /** Sample rewrites of the same message in this tone. */
  examples: string[];
}

const SAMPLES: Record<ToneLabel, ToneSample> = {
  Premium: {
    description: "Restrained, elevated, considered. Less is more.",
    examples: [
      "Elevate your skin's narrative.",
      "The shampoo your hair has been waiting for.",
    ],
  },
  Casual: {
    description: "Conversational, friendly, like a recommendation from a friend.",
    examples: [
      "Your hair, but better. Honestly.",
      "Tried it. Worked. Telling you.",
    ],
  },
  Urgent: {
    description: "Direct push to act now. Time-bound, decisive.",
    examples: [
      "Stock running out. Get it before midnight.",
      "Last 24 hours. Then back to MRP.",
    ],
  },
  Playful: {
    description: "Light, witty, sometimes punny. Made to scroll-stop.",
    examples: [
      "Hair fall is real. This is not.",
      "Bad hair days called — they're cancelled.",
    ],
  },
  Direct: {
    description: "No fluff. Says what it does, says what it costs.",
    examples: [
      "Onion shampoo. Reduces hair fall. ₹699.",
      "5,000 mcg biotin. 30-day pack. Vegan.",
    ],
  },
  Empathetic: {
    description: "Meets the user where they are. Acknowledges the pain first.",
    examples: [
      "Hair fall is exhausting. We get it. Here's what worked.",
      "You've tried everything. This is what dermatologists actually use.",
    ],
  },
  Bold: {
    description: "Strong claim, strong visual, strong stance. Polarising on purpose.",
    examples: [
      "The shampoo industry doesn't want you to know this.",
      "Throw out the 5 bottles. Use this one.",
    ],
  },
};

export function TonePicker() {
  const { draft, dispatch } = useDraft();
  const [hovered, setHovered] = useState<ToneLabel | null>(null);
  const previewTone = hovered ?? (draft.tone as ToneLabel | null) ?? null;
  const preview = previewTone ? SAMPLES[previewTone] : null;

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">Tone</label>
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => {
          const active = draft.tone === tone;
          return (
            <button
              key={tone}
              type="button"
              onClick={() => dispatch({ type: "SET_TONE", tone: active ? "" : tone })}
              onMouseEnter={() => setHovered(tone as ToneLabel)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "rounded-g6-pill border px-3 py-1 text-g6-sm font-medium transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              )}
            >
              {tone}
            </button>
          );
        })}
      </div>

      {/* Preview card — text-swatch examples */}
      {preview && (
        <div className="g6-fade-up rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3 space-y-2">
          <p className="text-g6-xs font-medium uppercase tracking-wider text-g6-text-tertiary">
            {previewTone} voice · {preview.description}
          </p>
          <ul className="space-y-1.5">
            {preview.examples.map((line, i) => (
              <li key={i} className="text-g6-sm text-g6-text leading-snug border-l-2 border-g6-border pl-2.5">
                "{line}"
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
