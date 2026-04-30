import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig, getFields } from "../../generate/modeConfigs";
import { FieldRenderer } from "../../generate/fields/FieldRenderer";
import { brands } from "../../mocks/brands";
import { useFormMode } from "../../stores/formModeStore";
import { FormModeToggle } from "../../components/FormModeToggle";
import { StudioPromptBar } from "../../components/PromptBar/StudioPromptBar";
import type { ModeId } from "../../types/output";

/**
 * Studio variant — Generate form.
 *
 * 2-column workspace (iter-5 IA):
 *   Left  — form with explicit section headers (Source · Direction · Settings)
 *   Right — live preview pane
 *
 * Was 3-column with a 180px mode-tree on the left and a hardcoded 'AI
 * recommendations' rail on the right. Both removed:
 *   - Mode tree was unnecessary mid-form (mode is picked BEFORE entering
 *     form via the sub-nav New gen button + landing flow).
 *   - 'AI recommendations' was seeded mock data, not real AI signal.
 *
 * Mental model: clean agency-desk form with a real-time preview of what's
 * about to be generated.
 */

const SOURCE_FIELDS: Array<string> = ["sub-method-picker", "brand-picker", "product-picker", "url-input", "source-image-picker", "source-winner-picker"];
const DIRECTION_FIELDS: Array<string> = ["audience-picker", "angle-picker", "tone-picker", "avatar-picker", "voice-picker", "script-input"];
const SETTINGS_FIELDS: Array<string> = ["output-type-picker", "format-picker", "count-picker"];
const ADVANCED_FIELDS: Array<string> = ["references-panel", "prompt-override"];

export function StudioGenerateForm() {
  const { mode } = useParams<{ mode: string }>();
  const { draft, dispatch } = useDraft();
  const [formMode] = useFormMode();

  useEffect(() => {
    if (mode) dispatch({ type: "SET_MODE", mode: mode as ModeId });
  }, [mode, dispatch]);

  if (!mode) return null;
  const config = getModeConfig(mode as ModeId);
  const brand = draft.brandId ? brands.find((b) => b.id === draft.brandId) : null;
  const activeFields = getFields(config, formMode);
  const fieldsBy = (group: string[]) => activeFields.filter((f) => group.includes(f));

  return (
    <div className="grid h-full grid-cols-[1.4fr_1fr] gap-3 p-3">
      {/* MAIN — form with section headers */}
      <main className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5">
        <header className="mb-4 flex items-start justify-between gap-3 border-b border-g6-border-secondary pb-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-g6-h4 font-bold text-g6-text">{config.label}</h1>
            <p className="text-g6-sm text-g6-text-secondary mt-1">{config.description}</p>
          </div>
          <FormModeToggle />
        </header>

        {fieldsBy(SOURCE_FIELDS).length > 0 && (
          <Section title="Source">
            {fieldsBy(SOURCE_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
          </Section>
        )}

        {fieldsBy(DIRECTION_FIELDS).length > 0 && (
          <Section title="Direction">
            {fieldsBy(DIRECTION_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
          </Section>
        )}

        {fieldsBy(SETTINGS_FIELDS).length > 0 && (
          <Section title="Output settings">
            {fieldsBy(SETTINGS_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
          </Section>
        )}

        {fieldsBy(ADVANCED_FIELDS).length > 0 && (
          <Section title="Advanced" optional>
            {fieldsBy(ADVANCED_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
          </Section>
        )}

        <StudioPromptBar />
      </main>

      {/* RIGHT — live preview only (AI recommendations rail removed iter-5) */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5">
        <p className="text-g6-xs font-medium uppercase tracking-wider text-g6-text-tertiary mb-3">
          Live preview
        </p>
        <div className="rounded-g6-base bg-gradient-to-br from-g6-primary/15 to-g6-primary/5 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-g6-text-tertiary mb-2" />
          <p className="text-g6-sm font-semibold text-g6-text">
            {draft.count} {draft.outputType ?? config.defaultOutputType} ads · {draft.format} · {brand?.name ?? "no brand"}
          </p>
          <p className="font-g6-mono text-g6-xs text-g6-text-tertiary mt-1">
            ~{draft.count * 2}s · {draft.count} credits
          </p>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <section className="g6-studio-section py-4">
      <h2 className="mb-3 flex items-center gap-2 text-g6-xs font-medium uppercase tracking-wider text-g6-text-tertiary">
        {title}
        {optional && <span className="font-normal normal-case text-g6-text-disabled">(optional)</span>}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
