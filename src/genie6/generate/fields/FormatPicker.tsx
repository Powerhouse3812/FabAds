import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { FORMATS } from "../modeConfigs";

/**
 * FormatPicker — phone-frame mockup tiles (iter-5 enhancement).
 *
 * Was: 4 mono-text pills (1:1 / 4:5 / 9:16 / 16:9). Aspect ratios are abstract;
 * no one thinks in numbers. Now: 4 phone-frame tiles drawn at correct
 * proportion + the platform context where that ratio actually ships
 * (Feed / Portrait / Reels / YouTube). Pattern: Figma format selector,
 * Photoshop new-document presets — show the SHAPE so the user picks by
 * what their ad will look like, not by remembering aspect math.
 */

interface FormatVisual {
  /** Display label. */
  label: string;
  /** Where this format actually ships. */
  context: string;
  /** Tailwind aspect class for the inner frame. */
  aspect: string;
  /** Inner frame width in px (height auto from aspect). */
  width: number;
}

const VISUALS: Record<(typeof FORMATS)[number], FormatVisual> = {
  "1:1": { label: "1:1", context: "Feed · square", aspect: "aspect-square", width: 44 },
  "4:5": { label: "4:5", context: "Feed · portrait", aspect: "aspect-[4/5]", width: 40 },
  "9:16": { label: "9:16", context: "Reels · Stories", aspect: "aspect-[9/16]", width: 30 },
  "16:9": { label: "16:9", context: "YouTube · landscape", aspect: "aspect-video", width: 56 },
};

export function FormatPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">Format</label>
      <div className="grid grid-cols-4 gap-2">
        {FORMATS.map((fmt) => {
          const active = draft.format === fmt;
          const v = VISUALS[fmt];
          return (
            <button
              key={fmt}
              type="button"
              onClick={() => dispatch({ type: "SET_FORMAT", format: fmt })}
              className={cn(
                "g6-lift flex flex-col items-center gap-2 rounded-g6-base border px-2 py-3 transition-all",
                active
                  ? "border-g6-primary bg-g6-primary-bg ring-1 ring-g6-primary/30"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              {/* Phone-frame visualization at correct aspect ratio */}
              <div className="flex h-16 items-center justify-center">
                <div
                  className={cn(
                    "rounded border-[1.5px] transition-colors",
                    v.aspect,
                    active
                      ? "border-g6-primary bg-g6-primary/15"
                      : "border-g6-border bg-g6-bg-spotlight/50"
                  )}
                  style={{ width: `${v.width}px` }}
                />
              </div>
              <div className="text-center space-y-0.5">
                <p
                  className={cn(
                    "font-g6-mono text-g6-sm font-bold tabular-nums leading-none",
                    active ? "text-g6-primary" : "text-g6-text"
                  )}
                >
                  {v.label}
                </p>
                <p className="text-[10px] text-g6-text-tertiary leading-tight">
                  {v.context}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
