import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDraft } from "../stores/draftStore";
import { getModeConfig } from "./modeConfigs";
import { FieldRenderer } from "./fields/FieldRenderer";
import { brands } from "../mocks/brands";
import { products } from "../mocks/products";
import { concepts } from "../mocks/library";
import type { ModeId } from "../types/output";

export function WizardScaffold() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { draft, dispatch } = useDraft();

  if (!mode) return null;

  const config = getModeConfig(mode as ModeId);
  const steps = config.wizardSteps;
  const currentStep = Math.min(Math.max(draft.wizardStep, 1), steps.length);
  const step = steps[currentStep - 1];
  const isLast = currentStep === steps.length;
  const isFirst = currentStep === 1;

  const goBack = () => {
    if (isFirst) {
      navigate("/iq/genie6/generate");
    } else {
      dispatch({ type: "SET_WIZARD_STEP", step: currentStep - 1 });
    }
  };

  const goNext = () => {
    if (isLast) return;
    dispatch({ type: "SET_WIZARD_STEP", step: currentStep + 1 });
  };

  const generate = (testFirst = false) => {
    const count = testFirst ? 4 : draft.count;
    navigate(
      `/iq/genie6/generate/${mode}/progress/demo-batch-${Date.now()}?count=${count}&testFirst=${testFirst}`
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => dispatch({ type: "SET_WIZARD_STEP", step: i + 1 })}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i + 1 === currentStep
                    ? "w-6 bg-g6-primary"
                    : i + 1 < currentStep
                    ? "w-2 bg-g6-primary opacity-50"
                    : "w-2 bg-g6-border"
                )}
                aria-label={`Step ${i + 1}: ${s.title}`}
              />
            ))}
          </div>
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            Step {currentStep} of {steps.length} — {step.title}
          </span>
        </div>

        {/* Step content */}
        {isLast ? (
          <ReviewStep mode={mode as ModeId} onGenerate={generate} />
        ) : (
          <div className="flex flex-col gap-6">
            <h2 className="text-g6-h2 font-bold text-g6-text">{step.title}</h2>
            {step.types.map((type) => (
              <FieldRenderer key={type} type={type} />
            ))}
          </div>
        )}

        {/* Nav */}
        {!isLast && (
          <div className="flex items-center justify-between pt-4 border-t border-g6-border-secondary">
            <button
              type="button"
              onClick={goBack}
              className="rounded-g6-base border border-g6-border bg-g6-bg-container px-4 py-2 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:text-g6-text"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-g6-base bg-g6-primary px-5 py-2 text-g6-sm font-semibold text-g6-text-on-accent transition-opacity hover:opacity-90"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  mode,
  onGenerate,
}: {
  mode: ModeId;
  onGenerate: (testFirst?: boolean) => void;
}) {
  const { draft } = useDraft();

  const brand = draft.brandId ? brands.find((b) => b.id === draft.brandId) : null;
  const selectedProducts = products.filter((p) => draft.productIds.includes(p.id));
  const concept = draft.conceptId ? concepts.find((c) => c.id === draft.conceptId) : null;

  const rows: Array<[string, string]> = [
    ["Mode", mode.replace(/-/g, " ")],
    draft.subMethod ? ["Sub-method", draft.subMethod.replace(/-/g, " ")] : null,
    brand ? ["Brand", brand.name] : null,
    selectedProducts.length ? ["Products", selectedProducts.map((p) => p.name).join(", ")] : null,
    concept ? ["Source winner", concept.name] : null,
    draft.audienceFreeform ? ["Audience", draft.audienceFreeform] : null,
    draft.angle ? ["Angle", draft.angle] : null,
    draft.tone ? ["Tone", draft.tone] : null,
    draft.format ? ["Format", draft.format] : null,
    ["Count", String(draft.count)],
    draft.outputType ? ["Output type", draft.outputType.replace(/-/g, " ")] : null,
    draft.sourceUrl ? ["Landing page", draft.sourceUrl] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-g6-h2 font-bold text-g6-text">Review</h2>

      <div className="rounded-g6-card border border-g6-border bg-g6-bg-container overflow-hidden">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between px-4 py-2.5",
              i !== 0 && "border-t border-g6-border-secondary"
            )}
          >
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wide">
              {label}
            </span>
            <span className="text-g6-sm font-medium text-g6-text capitalize">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-4 py-3">
        <span className="text-g6-sm text-g6-text-secondary">
          Cost preview:{" "}
          <span className="font-g6-mono font-semibold text-g6-text">{draft.count} credits</span>
        </span>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => onGenerate(false)}
          className="flex-1 rounded-g6-base bg-g6-primary py-2.5 text-g6-base font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-opacity hover:opacity-90"
        >
          Generate ▶
        </button>
        <button
          type="button"
          onClick={() => onGenerate(true)}
          className="rounded-g6-base border border-g6-border bg-g6-bg-container px-4 py-2.5 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:text-g6-text"
        >
          Test First (4)
        </button>
      </div>
    </div>
  );
}
