import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { ANGLES, type AngleLabel } from "../modeConfigs";

/**
 * AnglePicker — visual strategy-card grid (iter-5 P-2, ports G5 Strategy Cards).
 *
 * Was: pill-grid + hover-only preview card. Now: horizontal-scroll row of
 * always-visible cards — each card carries the real-ad sample image, the
 * angle name, the 1-line hook example, and a 1-line "what this angle does"
 * label below. Click selects, click again deselects. No hover dependence
 * (touch-friendly + fully scannable at a glance).
 *
 * Pattern: G5 Genie5StrategyCards.tsx adapted to G6 tokens. Extends
 * Krea/Midjourney's visual-card-picker philosophy that we already use on
 * BrandPicker/ProductPicker.
 */

interface AngleSample {
  imageUrl: string;
  headline: string;
  description: string;
}

const SAMPLES: Record<AngleLabel, AngleSample> = {
  FOMO: {
    imageUrl:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=70",
    headline: "Last 24 hours. 8,000 already gone.",
    description: "Scarcity + deadline. Fear of missing out drives clicks.",
  },
  Aspirational: {
    imageUrl:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=70",
    headline: "The hair you'd post about.",
    description: "Sell the better life — show the future-you.",
  },
  Comparison: {
    imageUrl:
      "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=400&q=70",
    headline: "Tested 3 smartwatches. This one stayed.",
    description: "Side-by-side with alternative. Let the math sell it.",
  },
  "Social proof": {
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=70",
    headline: "12,840 5-star reviews. They're sleeping on it.",
    description: "The crowd already chose. Numbers are the trust signal.",
  },
  Urgency: {
    imageUrl:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=70",
    headline: "Mid-month sale ends Friday.",
    description: "Time-bound offer. Removes 'I'll think about it'.",
  },
  Authority: {
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=70",
    headline: "Dermatologists recommend 5,000 mcg.",
    description: "Expert + credential. Anchor the message in proof.",
  },
  Bundle: {
    imageUrl:
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=400&q=70",
    headline: "Buy the shampoo. Get the conditioner free.",
    description: "Two for one — full kit cheaper than parts.",
  },
  Retargeting: {
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70",
    headline: "Still thinking about the Rockerz 450?",
    description: "You looked, didn't buy. Bring the user back.",
  },
};

export function AnglePicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Angle</label>
      <p className="text-g6-xs text-g6-text-tertiary">
        The hook that sells. Pick the lever your audience will respond to.
      </p>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {ANGLES.map((angle) => {
          const sample = SAMPLES[angle as AngleLabel];
          const active = draft.angle === angle;
          return (
            <button
              key={angle}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_ANGLE", angle: active ? null : angle })
              }
              className={cn(
                "g6-lift relative flex w-[200px] shrink-0 snap-start flex-col overflow-hidden rounded-g6-base text-left transition-all",
                active
                  ? "border border-g6-primary bg-g6-primary-bg ring-1 ring-g6-primary/30"
                  : "border border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              {active && (
                <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-g6-primary text-g6-text-on-accent shadow-g6-sm">
                  <Check className="h-3 w-3" />
                </span>
              )}

              {/* Visual */}
              <div className="relative aspect-[5/3] w-full overflow-hidden bg-g6-bg-spotlight">
                <img
                  src={sample.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Sample headline overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-2">
                  <p className="text-g6-xs font-bold leading-tight text-white line-clamp-2">
                    {sample.headline}
                  </p>
                </div>
              </div>

              {/* Name + description */}
              <div className="space-y-0.5 p-2.5">
                <p
                  className={cn(
                    "text-g6-sm font-semibold leading-none",
                    active ? "text-g6-primary" : "text-g6-text"
                  )}
                >
                  {angle}
                </p>
                <p className="text-[11px] text-g6-text-tertiary leading-snug line-clamp-2">
                  {sample.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
