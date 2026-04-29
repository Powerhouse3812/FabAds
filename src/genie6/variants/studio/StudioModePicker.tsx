import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { modeConfigs } from "../../generate/modeConfigs";
import { MicroMotif } from "../../components/MicroMotif";
import { DotGridPattern } from "../../components/DotGridPattern";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import type { ModeId } from "../../types/output";

/**
 * Studio variant — Mode picker (Generate index).
 *
 * Centered hero + balanced 4+2 mode grid + tooltip preview on hover.
 * Clean, agency-desk feel.
 */
export function StudioModePicker() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<ModeId | null>(null);
  const [prompt, setPrompt] = useState("");

  const goMode = (mode: ModeId) => navigate(`/iq/genie6/generate/${mode}`);
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad");
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-12 px-8 py-16">
        <header className="g6-fade-up space-y-4">
          <div className="inline-flex items-center gap-2 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-3 py-1">
            <Sparkles className="h-3 w-3 text-g6-primary" />
            <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-secondary">
              new generation
            </span>
          </div>
          <h1 className="font-g6-sans text-g6-display font-black tracking-[-0.03em] text-g6-text">
            What do you want to make?
          </h1>
          <p className="text-g6-lg text-g6-text-secondary max-w-2xl leading-relaxed">
            Describe the ad in one sentence — or paste a URL and let AI auto-categorize the rest.
          </p>
        </header>

        <div className="g6-fade-up" style={{ animationDelay: "120ms" }}>
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            placeholder="paste a URL or describe the generation"
            size="lg"
          />
        </div>

        <section className="g6-fade-up space-y-5" style={{ animationDelay: "240ms" }}>
          <div className="flex items-end justify-between">
            <h2 className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
              Or pick a mode
            </h2>
            <p className="text-g6-xs text-g6-text-tertiary">{modeConfigs.length} modes · hover for details</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modeConfigs.slice(0, 4).map((cfg) => (
              <ModeCard
                key={cfg.id}
                cfg={cfg}
                hovered={hovered === cfg.id}
                onHover={() => setHovered(cfg.id)}
                onLeave={() => setHovered(null)}
                onClick={() => goMode(cfg.id)}
              />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {modeConfigs.slice(4).map((cfg) => (
              <ModeCard
                key={cfg.id}
                cfg={cfg}
                hovered={hovered === cfg.id}
                onHover={() => setHovered(cfg.id)}
                onLeave={() => setHovered(null)}
                onClick={() => goMode(cfg.id)}
              />
            ))}
          </div>
        </section>

        {hovered && <ModeTooltipCard mode={hovered} />}
      </div>
    </div>
  );
}

type ModeCfg = (typeof modeConfigs)[number];

function ModeCard({ cfg, hovered, onHover, onLeave, onClick }: {
  cfg: ModeCfg; hovered: boolean; onHover: () => void; onLeave: () => void; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "g6-lift group relative flex flex-col gap-4 overflow-hidden rounded-g6-xl border bg-g6-bg-container p-5 text-left",
        hovered ? "border-g6-primary-border shadow-g6-glow" : "border-g6-border-secondary"
      )}
    >
      <div className={cn(
        "flex h-16 w-16 items-center justify-center rounded-g6-card transition-colors",
        hovered ? "bg-g6-primary text-g6-text-on-accent" : "bg-g6-bg-spotlight"
      )}>
        <MicroMotif mode={cfg.id} size={36} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-g6-h5 font-bold text-g6-text">{cfg.label}</h3>
        <p className="text-g6-sm text-g6-text-secondary line-clamp-2 leading-relaxed">{cfg.description}</p>
      </div>
      <span className={cn(
        "mt-auto inline-flex items-center gap-1 text-g6-sm font-medium transition-colors",
        hovered ? "text-g6-primary" : "text-g6-text-tertiary"
      )}>
        Start <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}

function ModeTooltipCard({ mode }: { mode: ModeId }) {
  const cfg = modeConfigs.find((c) => c.id === mode);
  if (!cfg) return null;
  return (
    <div className="g6-fade-up rounded-g6-xl border border-g6-primary-border bg-g6-primary-bg p-5 space-y-4">
      <div className="flex items-center gap-3">
        <MicroMotif mode={cfg.id} size={28} />
        <h3 className="text-g6-h4 font-bold text-g6-text">{cfg.label}</h3>
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        <Field label="Mental state" value={cfg.tooltip.mentalState} />
        <Field label="Best when" value={cfg.tooltip.bestWhen} />
        <Field label="Example" value={cfg.tooltip.example} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</dt>
      <dd className="text-g6-sm text-g6-text leading-relaxed">{value}</dd>
    </div>
  );
}
