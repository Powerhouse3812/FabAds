import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { modeConfigs } from "../../generate-legacy/modeConfigs";
import { MicroMotif } from "../../components/MicroMotif";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import type { ModeId } from "../../types/output";

/**
 * Modular variant — Mode picker (Generate index).
 *
 * Composable workbench mental model: prompt_module + modes_module +
 * suggestions_module on dark cosmic canvas with halo. Code-style headers,
 * grip-handle affordance for future drag-reorder.
 */
export function ModularModePicker() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<ModeId | null>(null);
  const [prompt, setPrompt] = useState("");

  const goMode = (mode: ModeId) => navigate(`/iq/genie6/generate/${mode}`);
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad");
  };

  return (
    <div className="g6-halo relative min-h-full p-6">
      <header className="relative z-10 mb-6">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> generate.new
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          What do you want to make?
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-1">
          Compose a generation — drop a prompt or pick a mode module
        </p>
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* prompt_module — full width on desktop */}
        <ModuleCard title="Prompt" className="lg:col-span-3">
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            placeholder="paste a URL or describe the generation"
            size="lg"
          />
        </ModuleCard>

        {/* modes_module — full width */}
        <ModuleCard title="Modes" className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {modeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => goMode(cfg.id)}
                onMouseEnter={() => setHovered(cfg.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "g6-lift flex flex-col items-center gap-2 rounded-g6-base border bg-g6-bg-base/50 p-3 text-center transition-all",
                  hovered === cfg.id
                    ? "border-g6-primary-border bg-g6-primary-bg/40 shadow-g6-glow"
                    : "border-g6-border-secondary"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-g6-base bg-g6-bg-base/80">
                  <MicroMotif mode={cfg.id} size={26} />
                </div>
                <span className="font-g6-mono text-g6-xs text-g6-text leading-tight">{cfg.label}</span>
              </button>
            ))}
          </div>
        </ModuleCard>

        {/* hovered_mode_module — preview of currently hovered mode */}
        {hovered && (
          <ModuleCard title="Mode preview" className="lg:col-span-2">
            {(() => {
              const cfg = modeConfigs.find((c) => c.id === hovered);
              if (!cfg) return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MicroMotif mode={cfg.id} size={28} />
                    <h3 className="text-g6-h4 font-bold text-g6-text">{cfg.label}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Mental state" value={cfg.tooltip.mentalState} />
                    <Field label="Best when" value={cfg.tooltip.bestWhen} />
                    <Field label="Example" value={cfg.tooltip.example} />
                  </div>
                  <button
                    type="button"
                    onClick={() => goMode(cfg.id)}
                    className="inline-flex items-center gap-1.5 rounded-g6-pill bg-g6-primary px-4 py-2 font-g6-mono text-g6-xs font-bold uppercase tracking-wider text-g6-text-on-accent shadow-g6-glow"
                  >
                    <Sparkles className="h-3 w-3" />
                    open {cfg.label.toLowerCase().replace(/\s/g, "_")}
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })()}
          </ModuleCard>
        )}

        {/* suggestions_module */}
        <ModuleCard title="Suggestions" className={hovered ? "lg:col-span-1" : "lg:col-span-3"}>
          <ul className="space-y-1.5">
            {[
              "12 product ads for Mamaearth Onion Shampoo",
              "UGC video script with Priya for Boat",
              "10 variants from my best winner",
            ].map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="block w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-base/50 p-2 text-left text-g6-sm text-g6-text-secondary hover:border-g6-primary-border hover:text-g6-text transition-colors"
                >
                  "{s}"
                </button>
              </li>
            ))}
          </ul>
        </ModuleCard>
      </div>
    </div>
  );
}

function ModuleCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("g6-glass rounded-g6-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between">
        <p className="text-g6-xs font-medium text-g6-text-tertiary">{title}</p>
        <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
      </header>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-g6-xs font-medium text-g6-text-tertiary">{label}</p>
      <p className="text-g6-sm text-g6-text leading-snug">{value}</p>
    </div>
  );
}
