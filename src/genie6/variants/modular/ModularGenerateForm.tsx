import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { GripVertical, Plus } from "lucide-react";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig, getFields } from "../../generate/modeConfigs";
import { FieldRenderer } from "../../generate/fields/FieldRenderer";
import { useFormMode } from "../../stores/formModeStore";
import { FormModeToggle } from "../../components/FormModeToggle";
import { ModularPromptBar } from "../../components/PromptBar/ModularPromptBar";
import type { ModeId } from "../../types/output";

/**
 * Modular variant — Generate form.
 *
 * Composable workbench mental model. Form = stack of self-contained module cards
 * on a dark cosmic canvas. Each module has a code-style header (`> module_name`),
 * is independent, can be reordered (visual affordance only for now — drag is a
 * future enhancement). Mood-image grids replace text dropdowns where possible.
 */

const MODULE_GROUPS: Array<{
  id: string;
  title: string;
  fieldTypes: string[];
}> = [
  { id: "brand_module", title: "Brand", fieldTypes: ["brand-picker", "product-picker"] },
  { id: "source_module", title: "Source", fieldTypes: ["url-input", "source-image-picker", "source-winner-picker"] },
  { id: "talent_module", title: "Talent", fieldTypes: ["avatar-picker", "voice-picker", "script-input"] },
  { id: "direction_module", title: "Direction", fieldTypes: ["audience-picker", "angle-picker", "tone-picker"] },
  { id: "output_module", title: "Output", fieldTypes: ["sub-method-picker", "output-type-picker", "format-picker", "count-picker"] },
  { id: "advanced_module", title: "Advanced", fieldTypes: ["references-panel", "prompt-override"] },
];

export function ModularGenerateForm() {
  const { mode } = useParams<{ mode: string }>();
  const { dispatch } = useDraft();
  const [formMode] = useFormMode();

  useEffect(() => {
    if (mode) dispatch({ type: "SET_MODE", mode: mode as ModeId });
  }, [mode, dispatch]);

  if (!mode) return null;
  const config = getModeConfig(mode as ModeId);
  const activeFields = getFields(config, formMode);

  // Filter modules to only those whose fieldTypes overlap the active fields
  const visibleModules = MODULE_GROUPS.filter((g) =>
    g.fieldTypes.some((f) => activeFields.includes(f as any))
  );

  return (
    <div className="g6-halo relative min-h-full p-6">
      <header className="relative z-10 mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            <span className="text-g6-primary">&gt;</span> generate.{mode.replace(/-/g, "_")}
          </p>
          <h1 className="text-g6-h2 font-bold tracking-tight text-g6-text mt-1">
            {config.label}
          </h1>
          <p className="text-g6-sm text-g6-text-secondary mt-1">{config.description}</p>
        </div>
        <FormModeToggle />
      </header>

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleModules.map((module) => {
          const fields = module.fieldTypes.filter((f) => activeFields.includes(f as any));
          if (fields.length === 0) return null;

          return (
            <ModuleCard key={module.id} title={module.title}>
              <div className="space-y-3">
                {fields.map((f) => (
                  <FieldRenderer key={f} type={f as any} />
                ))}
              </div>
            </ModuleCard>
          );
        })}

        {/* Add module CTA */}
        <button
          type="button"
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-g6-card border-2 border-dashed border-g6-border bg-transparent text-g6-text-tertiary hover:border-g6-primary-border hover:bg-g6-primary-bg/20 hover:text-g6-text transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="font-g6-mono text-g6-xs uppercase tracking-wider">add module</span>
        </button>

        {/* Prompt bar — spans full width */}
        <div className="lg:col-span-2">
          <ModularPromptBar />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="g6-glass rounded-g6-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <p className="text-g6-xs font-medium text-g6-text-tertiary">{title}</p>
        <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
      </header>
      {children}
    </div>
  );
}
