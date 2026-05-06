import { Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const ANGLES: { id: string; emoji: string; label: string; desc: string }[] = [
  { id: "hero",         emoji: "🎯", label: "Hero Shot",     desc: "Clean, centered product on minimal background." },
  { id: "lifestyle",    emoji: "🌅", label: "Lifestyle",     desc: "Product in a real-world context with mood." },
  { id: "social-proof", emoji: "💬", label: "Social Proof",  desc: "Testimonials & reviews framed as visuals." },
  { id: "urgency",      emoji: "🔥", label: "Urgency/Sale",  desc: "Limited-time, deal-driven framing." },
  { id: "comparison",   emoji: "⚖️", label: "Comparison",    desc: "Side-by-side comparison vs alternatives." },
  { id: "ugc-style",    emoji: "📱", label: "UGC Style",     desc: "Authentic, phone-shot creator look." },
  { id: "unboxing",     emoji: "📦", label: "Unboxing",      desc: "First-impression reveal & detail shots." },
  { id: "infographic",  emoji: "📊", label: "Infographic",   desc: "Data-driven, label-heavy explainer." },
];

interface AngleSectionProps {
  selectedId: string | null;
  /**
   * Pick contract:
   *   onPick(id)  → select that angle
   *   onPick("")  → clear selection
   * Caller maps this to wizard.set("angleId", id ? id : null).
   */
  onPick: (id: string) => void;
}

export function AngleSection({ selectedId, onPick }: AngleSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Angle
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          single-select
        </span>
        {selectedId && (
          <button
            type="button"
            onClick={() => onPick("")}
            className="ml-auto text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* 4-col grid (2 rows on desktop, responsive) */}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ANGLES.map((a) => {
          const active = selectedId === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(active ? "" : a.id)}
                className={cn(
                  "group relative flex h-full w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <span className="text-2xl leading-none">{a.emoji}</span>
                <p className="text-sm font-bold text-foreground">{a.label}</p>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{a.desc}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
