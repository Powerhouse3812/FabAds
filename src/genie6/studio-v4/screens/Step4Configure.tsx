import { useState } from "react";
import { ChevronDown, Plus, Sparkles, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Step4TopBar } from "../components/Step4TopBar";
import { PromptReferenceBar } from "../components/PromptReferenceBar";
import { RightRail } from "../components/RightRail";
import { ConceptColumnDrawer } from "../components/ConceptColumnDrawer";
import { getConceptById } from "../data/concepts";
import type { UseWizardReturn } from "../state/useWizard";

interface Step4Props {
  wizard: UseWizardReturn;
}

const MODELS: { id: string; emoji: string; name: string; hint?: string }[] = [
  { id: "genie-1.0", emoji: "✨", name: "Genie 1.0", hint: "Fast" },
  { id: "genie-2.0-pro", emoji: "🚀", name: "Genie 2.0 Pro", hint: "Higher quality" },
  { id: "genie-flash", emoji: "⚡", name: "Genie Flash", hint: "Ultra-fast" },
  { id: "genie-video", emoji: "🎬", name: "Genie Video" },
  { id: "genie-labs", emoji: "🧪", name: "Genie Labs", hint: "Experimental" },
];

const ANGLES: { id: string; emoji: string; label: string; desc: string }[] = [
  { id: "hero", emoji: "🎯", label: "Hero Shot", desc: "Clean, centered product on minimal background." },
  { id: "lifestyle", emoji: "🌅", label: "Lifestyle", desc: "Product in a real-world context with mood." },
  { id: "social-proof", emoji: "💬", label: "Social Proof", desc: "Testimonials & reviews framed as visuals." },
  { id: "urgency", emoji: "🔥", label: "Urgency/Sale", desc: "Limited-time, deal-driven framing." },
  { id: "comparison", emoji: "⚖️", label: "Comparison", desc: "Side-by-side comparison vs alternatives." },
  { id: "ugc-style", emoji: "📱", label: "UGC Style", desc: "Authentic, phone-shot creator look." },
  { id: "unboxing", emoji: "📦", label: "Unboxing", desc: "First-impression reveal & detail shots." },
  { id: "infographic", emoji: "📊", label: "Infographic", desc: "Data-driven, label-heavy explainer." },
];

const CATEGORY_LABEL: Record<string, string> = {
  asset: "Asset",
  ad: "Ad",
  social: "Social",
};
const FORMAT_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
};

const COUNTS = [1, 2, 4, 8] as const;

export function Step4Configure({ wizard }: Step4Props) {
  const [modelOpen, setModelOpen] = useState(false);
  const [angleOpen, setAngleOpen] = useState(false);
  const [conceptRailOpen, setConceptRailOpen] = useState(false);

  const activeModel =
    MODELS.find((m) => m.id === wizard.state.modelId) ?? MODELS[0];
  const activeAngle = ANGLES.find((a) => a.id === wizard.state.angleId);

  const categoryLabel = wizard.state.category
    ? CATEGORY_LABEL[wizard.state.category]
    : "—";
  const formatLabel = wizard.state.format
    ? FORMAT_LABEL[wizard.state.format]
    : "—";
  const productOrCategoryLabel =
    wizard.state.productId ?? wizard.state.categoryId ?? "—";

  return (
    <>
      {wizard.state.ctaLayout === "inline" && <Step4TopBar wizard={wizard} />}

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 pb-32">
        {/* Header */}
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Configure & generate
          </h1>
          <p className="text-sm text-muted-foreground">
            {categoryLabel} · {formatLabel} · {productOrCategoryLabel}
          </p>
        </header>

        {/* Toolbar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center gap-4">
          {/* Model dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Model
            </span>
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 h-8 text-xs font-medium text-foreground hover:border-primary/40"
                >
                  <span>{activeModel.emoji}</span>
                  <span>{activeModel.name}</span>
                  {activeModel.hint && (
                    <span className="text-muted-foreground">
                      · {activeModel.hint}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-1" align="start">
                <ul className="flex flex-col">
                  {MODELS.map((m) => {
                    const active = m.id === wizard.state.modelId;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => {
                            wizard.set("modelId", m.id);
                            setModelOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors",
                            active
                              ? "bg-primary/10 text-foreground"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span className="text-base">{m.emoji}</span>
                          <span className="font-semibold">{m.name}</span>
                          {m.hint && (
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {m.hint}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </PopoverContent>
            </Popover>
          </div>

          {/* Variations */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Variations
            </span>
            <div className="inline-flex rounded-full border border-border bg-background p-0.5">
              {COUNTS.map((n) => {
                const active = wizard.state.count === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => wizard.set("count", n)}
                    className={cn(
                      "h-6 min-w-[28px] px-2 rounded-full font-mono text-xs font-semibold transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credits */}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
            ⚡ <span className="font-mono">{wizard.state.credits}</span> credits
          </span>

          {/* Angle launcher */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Angle
            </span>
            <Popover open={angleOpen} onOpenChange={setAngleOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 h-8 text-xs font-medium text-foreground hover:border-primary/40"
                >
                  {activeAngle ? (
                    <>
                      <span>{activeAngle.emoji}</span>
                      <span>{activeAngle.label}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Pick an angle</span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <div className="grid grid-cols-2 gap-2">
                  {ANGLES.map((a) => {
                    const active = a.id === wizard.state.angleId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          wizard.set("angleId", a.id);
                          setAngleOpen(false);
                        }}
                        className={cn(
                          "flex flex-col gap-1 rounded-lg border p-2 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <span className="text-base leading-none">
                            {a.emoji}
                          </span>
                          {a.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-snug">
                          {a.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Concepts section — multi-select. Selection happens in right-rail drawer */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Concepts
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              multi-select
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {wizard.state.selectedConceptIds.length} chosen
            </span>
          </div>

          {wizard.state.selectedConceptIds.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-6 text-sm">
              <p className="text-muted-foreground">
                Pick one or more concepts. Each concept generates{" "}
                {wizard.state.count} variation
                {wizard.state.count === 1 ? "" : "s"} on Step 5.
                <br />
                <span className="text-[11px]">Skip to let AI choose.</span>
              </p>
              <button
                type="button"
                onClick={() => setConceptRailOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <Plus className="h-3.5 w-3.5" />
                Pick concepts
              </button>
            </div>
          ) : (
            /* Selected concepts chip row + Edit button */
            <div className="flex flex-wrap items-center gap-1.5">
              {wizard.state.selectedConceptIds.map((id) => {
                const concept = getConceptById(id);
                if (!concept) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <span>{concept.emoji}</span>
                    <span>{concept.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        wizard.set(
                          "selectedConceptIds",
                          wizard.state.selectedConceptIds.filter(
                            (x) => x !== id,
                          ),
                        )
                      }
                      aria-label={`Remove ${concept.name}`}
                      className="rounded-full p-0.5 hover:bg-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setConceptRailOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Edit
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Sticky prompt + reference bar (Track C handles its own positioning) */}
      <PromptReferenceBar wizard={wizard} />

      {/* Concept picker rail */}
      <RightRail
        open={conceptRailOpen}
        onClose={() => setConceptRailOpen(false)}
      >
        <ConceptColumnDrawer
          initialSelected={wizard.state.selectedConceptIds}
          onSave={(ids) => {
            wizard.set("selectedConceptIds", ids);
            setConceptRailOpen(false);
          }}
          onCancel={() => setConceptRailOpen(false)}
        />
      </RightRail>
    </>
  );
}
