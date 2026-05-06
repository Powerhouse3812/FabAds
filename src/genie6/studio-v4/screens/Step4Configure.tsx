import type { UseWizardReturn } from "../state/useWizard";
import { Step4TopBar } from "../components/Step4TopBar";
import { PromptReferenceBar } from "../components/PromptReferenceBar";
import { AngleSection } from "../components/AngleSection";
import { ConceptSection } from "../components/ConceptSection";

interface Step4Props {
  wizard: UseWizardReturn;
}

const CATEGORY_LABEL: Record<string, string> = {
  asset: "Asset",
  ad: "Ad",
  social: "Social",
};
const FORMAT_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
};

export function Step4Configure({ wizard }: Step4Props) {
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

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        {/* Header */}
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Configure & generate
          </h1>
          <p className="text-sm text-muted-foreground">
            {categoryLabel} · {formatLabel} · {productOrCategoryLabel}
          </p>
        </header>

        {/* Angle (single-select) */}
        <AngleSection
          selectedId={wizard.state.angleId}
          onPick={(id) => wizard.set("angleId", id ? id : null)}
        />

        {/* Concepts (multi-select) */}
        <ConceptSection
          selectedIds={wizard.state.selectedConceptIds}
          onChange={(ids) => wizard.set("selectedConceptIds", ids)}
          variations={wizard.state.count}
        />

        {/* Prompt + reference bar — now in-flow as the form's last child */}
        <PromptReferenceBar wizard={wizard} />
      </div>
    </>
  );
}
