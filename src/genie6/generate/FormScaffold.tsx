import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../stores/draftStore";
import { getModeConfig } from "./modeConfigs";
import { FieldRenderer } from "./fields/FieldRenderer";
import { brands } from "../mocks/brands";
import type { ModeId } from "../types/output";

const ADVANCED_TYPES = new Set(["references-panel", "prompt-override"]);

export function FormScaffold() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { draft, dispatch } = useDraft();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (mode) dispatch({ type: "SET_MODE", mode: mode as ModeId });
  }, [mode, dispatch]);

  if (!mode) return null;

  const config = getModeConfig(mode as ModeId);
  const primaryFields = config.formFields.filter((f) => !ADVANCED_TYPES.has(f));
  const advancedFields = config.formFields.filter((f) => ADVANCED_TYPES.has(f));

  const brand = draft.brandId ? brands.find((b) => b.id === draft.brandId) : null;
  const inferredPrompt = [
    draft.angle ? `${draft.angle} angle` : "",
    brand ? brand.name : "",
    draft.audienceFreeform ? draft.audienceFreeform : "",
    draft.tone ? `${draft.tone} tone` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const generate = (testFirst = false) => {
    const count = testFirst ? 4 : draft.count;
    navigate(
      `/iq/genie6/generate/${mode}/progress/demo-batch-${Date.now()}?count=${count}&testFirst=${testFirst}`
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-4xl gap-8 px-6 py-10">
        {/* Left: form fields */}
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-3">
            <h1 className="text-g6-lg font-semibold text-g6-text capitalize">
              {config.label}
            </h1>
          </div>

          {primaryFields.map((type) => (
            <FieldRenderer key={type} type={type} />
          ))}

          {/* Advanced accordion */}
          {advancedFields.length > 0 && (
            <div className="rounded-g6-base border border-g6-border-secondary">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:text-g6-text"
              >
                Advanced
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    advancedOpen && "rotate-180"
                  )}
                />
              </button>
              {advancedOpen && (
                <div className="flex flex-col gap-4 border-t border-g6-border-secondary px-4 pb-4 pt-4">
                  {advancedFields.map((type) => (
                    <FieldRenderer key={type} type={type} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cost + generate row */}
          <div className="flex items-center justify-between border-t border-g6-border-secondary pt-4">
            <span className="text-g6-sm text-g6-text-secondary">
              Cost preview:{" "}
              <span className="font-g6-mono font-semibold text-g6-text">
                {draft.count} credits
              </span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => generate(true)}
                className="rounded-g6-base border border-g6-border bg-g6-bg-container px-4 py-2 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:text-g6-text"
              >
                Test First
              </button>
              <button
                type="button"
                onClick={() => generate(false)}
                className="rounded-g6-base bg-g6-primary px-5 py-2 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-opacity hover:opacity-90"
              >
                Generate ▶
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI suggestions rail */}
        <div className="hidden w-64 shrink-0 lg:flex flex-col gap-4">
          <div className="rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 space-y-3">
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
              Inferred prompt
            </p>
            <p className="font-g6-mono text-g6-sm text-g6-text-secondary leading-relaxed">
              {inferredPrompt || "Fill in the fields to see the inferred prompt."}
            </p>
          </div>

          <div className="rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 space-y-3">
            <p className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
              AI suggestions
            </p>
            <div className="flex flex-col gap-2">
              {[
                "Hair fall is real. This is not.",
                "Stop the breakage.",
                "Real ingredients, real results.",
              ].map((hook) => (
                <button
                  key={hook}
                  type="button"
                  onClick={() => dispatch({ type: "SET_PROMPT", prompt: hook })}
                  className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-elevated px-3 py-2 text-left text-g6-sm text-g6-text-secondary transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
                >
                  "{hook}"
                  <span className="block text-g6-xs text-g6-text-tertiary mt-0.5">Apply →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
