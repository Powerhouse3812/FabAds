import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Plus, History, FolderOpen, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { modeConfigs } from "../../generate-legacy/modeConfigs";
import { MicroMotif } from "../../components/MicroMotif";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import type { ModeId } from "../../types/output";

/**
 * Canvas variant — Mode picker (Generate index).
 *
 * Editor mental model: vertical mode rail (left), center canvas with hero
 * prompt + selected-mode preview, right utility rail. Bottom action bar with
 * generate. The "canvas" feels like a workspace where you compose the
 * generation by picking tools (modes) from the rail.
 */
export function CanvasModePicker() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<ModeId | null>(null);
  const [prompt, setPrompt] = useState("");

  const goMode = (mode: ModeId) => navigate(`/iq/genie6/generate/${mode}`);
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad");
  };

  const previewMode = hovered ?? modeConfigs[0]?.id ?? null;
  const previewCfg = previewMode ? modeConfigs.find((c) => c.id === previewMode) : null;

  return (
    <div className="grid h-full grid-cols-[56px_1fr_56px]">
      {/* LEFT — mode tool rail */}
      <aside className="flex flex-col items-center gap-1 border-r border-g6-border-secondary py-3 bg-g6-bg-base">
        <button
          type="button"
          onClick={handlePromptSubmit}
          title="Submit prompt"
          className="flex h-10 w-10 items-center justify-center rounded-g6-base bg-g6-primary text-g6-text-on-accent shadow-g6-glow mb-2"
        >
          <Plus className="h-5 w-5" />
        </button>
        {modeConfigs.map((cfg) => (
          <button
            key={cfg.id}
            type="button"
            onClick={() => goMode(cfg.id)}
            onMouseEnter={() => setHovered(cfg.id)}
            onMouseLeave={() => setHovered(null)}
            title={cfg.label}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-g6-base transition-colors",
              hovered === cfg.id
                ? "bg-g6-primary-bg text-g6-primary"
                : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
            )}
          >
            <MicroMotif mode={cfg.id} size={18} />
          </button>
        ))}
      </aside>

      {/* CENTER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 g6-canvas-floor opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-g6-bg-base" />

        <div className="absolute left-4 top-4 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          canvas · new generation · {modeConfigs.length} modes
        </div>

        {/* Center stage: hovered mode preview OR hero prompt */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] w-full max-w-2xl px-6">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-2.5 py-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-primary">
                <Sparkles className="h-2.5 w-2.5" /> {previewCfg?.label ?? "new generation"}
              </span>
              <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
                {hovered ? previewCfg?.label : "What do you want to make?"}
              </h1>
              <p className="text-g6-sm text-g6-text-secondary max-w-md mx-auto">
                {hovered ? previewCfg?.description : "Hover a mode on the left, or type a prompt. AI auto-categorizes."}
              </p>
            </div>

            <HeroPromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={handlePromptSubmit}
              placeholder="paste a URL or describe the generation"
              size="lg"
            />

            {/* Mode preview chip */}
            {hovered && previewCfg && (
              <div className="rounded-g6-card border border-g6-primary-border bg-g6-bg-container/90 backdrop-blur-md p-4 shadow-g6-md">
                <div className="grid grid-cols-3 gap-3 text-g6-xs">
                  <Field label="Mental state" value={previewCfg.tooltip.mentalState} />
                  <Field label="Best when" value={previewCfg.tooltip.bestWhen} />
                  <Field label="Example" value={previewCfg.tooltip.example} />
                </div>
                <button
                  type="button"
                  onClick={() => goMode(previewCfg.id)}
                  className="mt-4 w-full rounded-g6-base bg-g6-primary px-4 py-2 text-g6-sm font-bold text-g6-text-on-accent"
                >
                  Open {previewCfg.label} ▶
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom floating action bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-g6-pill bg-g6-bg-container/95 px-4 py-2 shadow-g6-lg backdrop-blur-md border border-g6-border-secondary">
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
              ⌘↵ to submit · or pick a mode from the rail
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — utility rail */}
      <aside className="flex flex-col items-center gap-1 border-l border-g6-border-secondary py-3 bg-g6-bg-base">
        {[
          { Icon: History, label: "History", to: "/iq/genie6/library" },
          { Icon: FolderOpen, label: "Workspace", to: "/iq/genie6/workspace" },
          { Icon: Layers, label: "Library", to: "/iq/genie6/library" },
          { Icon: Settings, label: "Settings", to: "/iq/genie6/settings" },
        ].map(({ Icon, label, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            title={label}
            className="flex h-10 w-10 items-center justify-center rounded-g6-base text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text transition-colors"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</p>
      <p className="text-g6-sm text-g6-text leading-snug">{value}</p>
    </div>
  );
}
