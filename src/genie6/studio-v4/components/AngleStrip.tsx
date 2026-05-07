import { Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AngleMockup,
  type AngleVariant,
} from "../../generate-v3/forms/components/AngleMockup";

const ANGLES: {
  id: string;
  label: string;
  desc: string;
  mockup: AngleVariant;
}[] = [
  { id: "hero",         label: "Hero Shot",     desc: "Clean, centered product on minimal background.",    mockup: "founder-quote" },
  { id: "lifestyle",    label: "Lifestyle",     desc: "Product in a real-world context with mood.",         mockup: "lifestyle" },
  { id: "social-proof", label: "Social Proof",  desc: "Testimonials & reviews framed as visuals.",          mockup: "social-proof" },
  { id: "urgency",      label: "Urgency/Sale",  desc: "Limited-time, deal-driven framing.",                 mockup: "fomo" },
  { id: "comparison",   label: "Comparison",    desc: "Side-by-side comparison vs alternatives.",           mockup: "problem-solution" },
  { id: "ugc-style",    label: "UGC Style",     desc: "Authentic, phone-shot creator look.",                mockup: "before-after" },
  { id: "unboxing",     label: "Unboxing",      desc: "First-impression reveal & detail shots.",            mockup: "unboxing" },
  { id: "infographic",  label: "Infographic",   desc: "Data-driven, label-heavy explainer.",                mockup: "bold-claim" },
];

interface AngleStripProps {
  selectedId: string | null;
  /**
   * Pick contract:
   *   onPick(id)  → select that angle
   *   onPick("")  → clear selection
   * Caller maps this to wizard.set("angleId", id ? id : null).
   */
  onPick: (id: string) => void;
}

export function AngleStrip({ selectedId, onPick }: AngleStripProps) {
  const selected = ANGLES.find((a) => a.id === selectedId);
  return (
    <section className="space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Angle
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          single-select
        </span>
        {selected && (
          <button
            type="button"
            onClick={() => onPick("")}
            className="ml-auto text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Horizontal scroll-snap strip — AngleMockup SVG per card (semantic
          visualization, no random Unsplash photos) */}
      <div className="-mx-1 flex items-stretch gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
        {ANGLES.map((a) => {
          const active = selectedId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(active ? "" : a.id)}
              className={cn(
                "snap-start shrink-0 flex w-[140px] flex-col gap-1 overflow-hidden rounded-lg border bg-card text-left transition-all",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:-translate-y-0.5",
              )}
            >
              <div className="relative w-full">
                <AngleMockup variant={a.mockup} selected={active} />
                {active && (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="px-2 pb-2 pt-0.5 text-[12px] font-bold leading-tight text-foreground">
                {a.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected-angle desc — recognition-on-demand */}
      {selected && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">{selected.label}</span> · {selected.desc}
        </p>
      )}
    </section>
  );
}
