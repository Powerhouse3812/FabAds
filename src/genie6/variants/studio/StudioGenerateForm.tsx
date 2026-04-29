import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig, modeConfigs } from "../../generate/modeConfigs";
import { FieldRenderer } from "../../generate/fields/FieldRenderer";
import { brands } from "../../mocks/brands";
import type { ModeId } from "../../types/output";

/**
 * Studio variant — Generate form.
 *
 * 3-column workspace:
 *   Left   — mode tree (collapsible) with all 6 modes
 *   Middle — form with explicit section headers (Source · Direction · Settings)
 *   Right  — live preview + AI Recommendations strip
 *
 * Mental model: Vidiofy / Regene.ai — agency users see everything at once.
 */

const SOURCE_FIELDS: Array<string> = ["sub-method-picker", "brand-picker", "product-picker", "url-input", "source-image-picker", "source-winner-picker"];
const DIRECTION_FIELDS: Array<string> = ["audience-picker", "angle-picker", "tone-picker", "avatar-picker", "voice-picker", "script-input"];
const SETTINGS_FIELDS: Array<string> = ["output-type-picker", "format-picker", "count-picker"];
const ADVANCED_FIELDS: Array<string> = ["references-panel", "prompt-override"];

export function StudioGenerateForm() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { draft, dispatch } = useDraft();

  useEffect(() => {
    if (mode) dispatch({ type: "SET_MODE", mode: mode as ModeId });
  }, [mode, dispatch]);

  if (!mode) return null;
  const config = getModeConfig(mode as ModeId);
  const brand = draft.brandId ? brands.find((b) => b.id === draft.brandId) : null;

  const fieldsBy = (group: string[]) => config.formFields.filter((f) => group.includes(f));

  const generate = (testFirst = false) => {
    const count = testFirst ? 4 : draft.count;
    navigate(
      `/iq/genie6/generate/${mode}/progress/demo-batch-${Date.now()}?count=${count}&testFirst=${testFirst}`
    );
  };

  return (
    <div className="grid h-full grid-cols-[180px_1.1fr_1fr] gap-3 p-3">
      {/* LEFT — mode tree */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-3">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
          Modes
        </p>
        <ul className="space-y-0.5">
          {modeConfigs.map((cfg) => {
            const isActive = cfg.id === mode;
            return (
              <li key={cfg.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/iq/genie6/generate/${cfg.id}/form`)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-g6-base px-2 py-1.5 text-left text-g6-sm transition-colors",
                    isActive
                      ? "bg-g6-primary-bg font-semibold text-g6-text"
                      : "text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text"
                  )}
                >
                  <span>{cfg.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 text-g6-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* MIDDLE — form with section headers */}
      <main className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5">
        <header className="mb-4 border-b border-g6-border-secondary pb-3">
          <h1 className="text-g6-h4 font-bold text-g6-text">{config.label}</h1>
          <p className="text-g6-sm text-g6-text-secondary mt-1">{config.description}</p>
        </header>

        <Section title="Source">
          {fieldsBy(SOURCE_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
        </Section>

        <Section title="Direction">
          {fieldsBy(DIRECTION_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
        </Section>

        <Section title="Output settings">
          {fieldsBy(SETTINGS_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
        </Section>

        <Section title="Advanced" optional>
          {fieldsBy(ADVANCED_FIELDS).map((f) => <FieldRenderer key={f} type={f as any} />)}
        </Section>

        <div className="mt-6 flex items-center justify-between border-t border-g6-border-secondary pt-4">
          <span className="font-g6-mono text-g6-sm text-g6-text-secondary">
            {draft.count} credits · ~{draft.count * 2}s
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => generate(true)}
              className="rounded-g6-base border border-g6-border bg-g6-bg-base px-4 py-2 text-g6-sm font-medium text-g6-text-secondary hover:text-g6-text"
            >
              Test First
            </button>
            <button
              type="button"
              onClick={() => generate(false)}
              className="rounded-g6-base bg-g6-primary px-5 py-2 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn"
            >
              Generate ▶
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT — live preview + AI recommendations */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-5">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
          Live preview
        </p>
        <div className="rounded-g6-base bg-gradient-to-br from-g6-primary/40 to-g6-primary/10 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-g6-primary mb-2" />
          <p className="text-g6-sm font-semibold text-g6-text">
            {draft.count} {draft.outputType ?? config.defaultOutputType} ads · {draft.format} · {brand?.name ?? "no brand"}
          </p>
          <p className="font-g6-mono text-g6-xs text-g6-text-tertiary mt-1">
            ~{draft.count * 2}s · {draft.count} credits
          </p>
        </div>

        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mt-6 mb-2">
          AI recommendations
        </p>
        <div className="space-y-2">
          {[
            { text: "Aspirational hair journey", reason: "matches your brand voice" },
            { text: "10 reasons your hair gummy isn't working", reason: "comparison angle, +38% CTR avg" },
            { text: "Stop the breakage", reason: "FOMO angle, brand-on-tone" },
          ].map((rec) => (
            <button
              key={rec.text}
              type="button"
              onClick={() => dispatch({ type: "SET_PROMPT", prompt: rec.text })}
              className="w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-base p-2 text-left text-g6-sm hover:border-g6-primary-border hover:bg-g6-primary-bg"
            >
              <p className="font-medium text-g6-text">"{rec.text}"</p>
              <p className="font-g6-mono text-g6-xs text-g6-text-tertiary mt-0.5">{rec.reason}</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, optional, children }: { title: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <section className="g6-studio-section py-4">
      <h2 className="mb-3 flex items-center gap-2 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        {title}
        {optional && <span className="font-normal normal-case text-g6-text-disabled">(optional)</span>}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
