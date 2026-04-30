import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { ANGLES, type AngleLabel } from "../modeConfigs";

/**
 * AnglePicker — pill grid + hover-preview card showing a real ad example.
 *
 * Iter-5 enhancement: Angles are abstract — "FOMO" / "Aspirational" / "Authority"
 * tell users nothing about what a finished ad in that angle LOOKS like. Hover any
 * pill → floating preview card shows a sample ad image + headline + a 1-line
 * explanation of the angle's psychological lever (Krea / Midjourney pattern).
 *
 * Sample data lives inline; production would tie to user's library of saved
 * winners tagged by angle.
 */

interface AngleSample {
  description: string;
  /** Real-ad example image (Unsplash product photography matched to angle). */
  imageUrl: string;
  /** Sample headline that uses this angle. */
  headline: string;
  /** Sub-line / body. */
  body: string;
}

const SAMPLES: Record<AngleLabel, AngleSample> = {
  FOMO: {
    description: "Scarcity + deadline = act now. Fear of missing out drives clicks.",
    imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=70",
    headline: "Last 24 hours. 8,000 already gone.",
    body: "Boat Airdopes 161 — once stock runs out, festival pricing is gone too.",
  },
  Aspirational: {
    description: "Sell the better life. The ad shows the future-you.",
    imageUrl: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=70",
    headline: "The hair you'd post about.",
    body: "Mamaearth Onion Shampoo — soft, shiny, salon-finish. From your shower.",
  },
  Comparison: {
    description: "Side-by-side with competitor or alternative. Let the math sell it.",
    imageUrl: "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=400&q=70",
    headline: "Tested 3 smartwatches. This one stayed.",
    body: "Noise ColorFit Pro 5 vs the ₹6k options — better display, half the price.",
  },
  "Social proof": {
    description: "The crowd already chose. Numbers + reviews are the trust signal.",
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=70",
    headline: "12,840 5-star reviews. They're sleeping on it.",
    body: "Sleepyhead — India's most-reviewed mattress on Amazon.",
  },
  Urgency: {
    description: "Time-bound offer + countdown. Removes the 'I'll think about it' option.",
    imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=70",
    headline: "Mid-month sale ends Friday.",
    body: "Mamaearth Vitamin C Face Wash — 25% off until 11:59 PM, no extension.",
  },
  Authority: {
    description: "Expert / credential / claim. Anchor the message in proof.",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=70",
    headline: "Dermatologists recommend 5,000 mcg.",
    body: "Plum Biotin Hair Gummies — exact clinical dose, vegan, dermat-formulated.",
  },
  Bundle: {
    description: "Two for the price of one — or full kit cheaper than parts.",
    imageUrl: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=400&q=70",
    headline: "Buy the shampoo. Get the conditioner free.",
    body: "Mamaearth Onion duo — pay ₹699, save ₹449 vs separate purchase.",
  },
  Retargeting: {
    description: "You looked but didn't buy. Bring the user back with the same item.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70",
    headline: "Still thinking about the Rockerz 450?",
    body: "Boat Rockerz 450 — the pair you saved last week is still in stock.",
  },
};

export function AnglePicker() {
  const { draft, dispatch } = useDraft();
  const [hovered, setHovered] = useState<AngleLabel | null>(null);
  const previewAngle = hovered ?? draft.angle as AngleLabel | null ?? null;
  const preview = previewAngle ? SAMPLES[previewAngle] : null;

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">Angle</label>
      <div className="flex flex-wrap gap-2">
        {ANGLES.map((angle) => {
          const active = draft.angle === angle;
          return (
            <button
              key={angle}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_ANGLE", angle: active ? null : angle })
              }
              onMouseEnter={() => setHovered(angle as AngleLabel)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "rounded-g6-pill border px-3 py-1 text-g6-sm font-medium transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              )}
            >
              {angle}
            </button>
          );
        })}
      </div>

      {/* Preview card — shows on hover or for selected angle */}
      {preview && (
        <div className="g6-fade-up overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
          <div className="flex gap-3 p-3">
            <img
              src={preview.imageUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-g6-base bg-g6-bg-spotlight object-cover"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-g6-xs font-medium uppercase tracking-wider text-g6-text-tertiary">
                {previewAngle} angle · example
              </p>
              <p className="text-g6-sm font-bold text-g6-text leading-tight">
                {preview.headline}
              </p>
              <p className="text-g6-xs text-g6-text-secondary leading-snug">
                {preview.body}
              </p>
            </div>
          </div>
          <div className="border-t border-g6-border-secondary bg-g6-bg-base px-3 py-2">
            <p className="text-g6-xs text-g6-text-secondary leading-snug">
              <span className="font-medium text-g6-text">Why this angle:</span> {preview.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
