import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, History, Layers, FolderOpen, Download, Settings, RefreshCcw, Wand2, Image as ImageIcon, Film, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig, getFields, modeConfigs } from "../../generate-legacy/modeConfigs";
import { FieldRenderer } from "../../generate-legacy/fields/FieldRenderer";
import { MicroMotif } from "../../components/MicroMotif";
import { useFormMode } from "../../stores/formModeStore";
import { FormModeToggle } from "../../components/FormModeToggle";
import { CanvasPromptBar } from "../../components/PromptBar/CanvasPromptBar";
import type { ModeId } from "../../types/output";

/**
 * Canvas variant — Generate form.
 *
 * Editor-first: massive central viewport, vertical tool rails on both sides,
 * floating mini-panel with mode params, bottom action bar. Photoshop mental model.
 *
 * Tools rail (left):  one icon per mode (Brand, Product, UGC, Affiliate, Variants, Image)
 * Tools rail (right): History, References, Brand-kit, Exports
 * Center:             empty canvas with grid floor + sample object
 * Floating panel:     current mode's params (slides in from left)
 * Bottom strip:       summary + Generate
 */
export function CanvasGenerateForm({ mode: modeProp }: { mode?: string } = {}) {
  // A-10.1: mode comes via prop from FormScaffold; useParams fallback for legacy deep-links.
  const params = useParams<{ mode: string }>();
  const mode = modeProp ?? params.mode;
  const navigate = useNavigate();
  const { draft, dispatch } = useDraft();
  const [panelOpen, setPanelOpen] = useState(true);
  const [formMode] = useFormMode();

  useEffect(() => {
    if (mode) dispatch({ type: "SET_MODE", mode: mode as ModeId });
  }, [mode, dispatch]);

  if (!mode) return null;
  const config = getModeConfig(mode as ModeId);
  const activeFields = getFields(config, formMode);

  return (
    <div className="grid h-full grid-cols-[56px_1fr_56px]">
      {/* LEFT TOOL RAIL — mode buttons */}
      <aside className="flex flex-col items-center gap-1 border-r border-g6-border-secondary py-3">
        {modeConfigs.map((cfg) => {
          const active = cfg.id === mode;
          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
              title={cfg.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-g6-base transition-colors",
                active
                  ? "bg-g6-primary text-g6-text-on-accent"
                  : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
              )}
            >
              <MicroMotif mode={cfg.id} size={18} />
            </button>
          );
        })}
      </aside>

      {/* CENTER CANVAS */}
      <div className="relative overflow-hidden">
        {/* Grid floor backdrop */}
        <div className="absolute inset-0 g6-canvas-floor opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-g6-bg-base" />

        {/* Top-left label */}
        <div className="absolute left-4 top-4 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          canvas · {config.label} · {draft.format} · {draft.count} ads
        </div>

        {/* Center — sample object placeholder OR generated result */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-64 w-80 items-center justify-center rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-container/40">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-10 w-10 text-g6-text-tertiary" />
              <p className="text-g6-sm text-g6-text-secondary max-w-xs">
                Empty canvas — fill the panel and Generate to see results here
              </p>
            </div>
          </div>
        </div>

        {/* Floating param panel */}
        {panelOpen && (
          <aside className="absolute bottom-20 left-4 top-12 w-[280px] overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container/90 p-4 shadow-g6-lg backdrop-blur-md">
            <header className="mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                  {config.label} → params
                </h2>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="text-g6-text-tertiary hover:text-g6-text text-g6-xs"
                >
                  ✕
                </button>
              </div>
              <FormModeToggle />
            </header>
            <div className="space-y-3">
              {activeFields.map((f) => <FieldRenderer key={f} type={f} />)}
            </div>
          </aside>
        )}

        {!panelOpen && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="absolute bottom-20 left-4 inline-flex items-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-3 py-2 text-g6-sm font-medium text-g6-text shadow-g6-md hover:border-g6-border"
          >
            <Wand2 className="h-3.5 w-3.5" /> Open params
          </button>
        )}

        {/* Floating prompt bar — replaces the previous bottom action bar */}
        <CanvasPromptBar />
      </div>

      {/* RIGHT TOOL RAIL — utility actions */}
      <aside className="flex flex-col items-center gap-1 border-l border-g6-border-secondary py-3">
        {[
          { Icon: History, label: "History" },
          { Icon: Layers, label: "Layers" },
          { Icon: FolderOpen, label: "References" },
          { Icon: ImageIcon, label: "Brand kit" },
          { Icon: RefreshCcw, label: "Regenerate" },
          { Icon: Download, label: "Export" },
          { Icon: Settings, label: "Settings" },
        ].map(({ Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            className="flex h-10 w-10 items-center justify-center rounded-g6-base text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </aside>
    </div>
  );
}
