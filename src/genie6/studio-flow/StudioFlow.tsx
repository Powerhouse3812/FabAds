import { useMemo, useState } from "react";
import { Users, Target, Lightbulb, Pin } from "lucide-react";
import { toast } from "sonner";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import { useStudioV4Form } from "@/genie6/v4-shared/state/useStudioV4Form";
import { RightColumn } from "@/genie6/v4-shared/components/RightColumn";
import { OverviewPane } from "@/genie6/v4-shared/components/OverviewPane";
import { SubModeChipRow } from "@/genie6/v4-shared/components/SubModeChipRow";
import { ColumnInputShell } from "@/genie6/v4-shared/components/ColumnInputShell";
import {
  audiences as systemAudiences,
  type Audience,
} from "@/genie6/generate-v3/mocks/audiences";
import {
  savedConcepts,
  newConcepts,
} from "@/genie6/generate-v3/mocks/concepts";
import { AudiencePicker } from "@/genie6/generate-v3/forms/components/AudiencePicker";
import { AudienceCreateModal } from "@/genie6/generate-v3/forms/components/AudienceCreateModal";
import { AnglePicker, ANGLES } from "@/genie6/generate-v3/forms/components/AnglePicker";
import {
  ConceptsStrip,
  type ConceptSource,
} from "@/genie6/generate-v3/forms/components/ConceptsStrip";
import { PinterestPanel } from "@/genie6/generate-v3/forms/components/PinterestPanel";
import type {
  PinterestPin,
  PinterestQuery,
} from "@/genie6/generate-v3/mocks/pinterest";
import type { LocalUpload } from "@/genie6/generate-v3/forms/components/UploadsPanel";
import type { PromptBarModel } from "@/components/PromptBar";

import { FauxHeader } from "./components/FauxHeader";
import { PromptBarFooter } from "./components/PromptBarFooter";
import { ProgressiveRows } from "./ProgressiveRows";

/**
 * StudioFlow — Studio v4 Flow shell (progressive single-page form).
 *
 * Single-page sibling to the Wizard variant. Owns the form state via
 * `useStudioV4Form()` and renders:
 *
 *   ┌──────────────────────── FauxHeader ────────────────────────┐
 *   │ SubModeChipRow                                             │
 *   ├──────────────────────────┬─────────────────────────────────┤
 *   │ ProgressiveRows          │ RightColumn (always visible,    │
 *   │ (form column, scrolls)   │  showTabs: Overview / Editing)  │
 *   ├──────────────────────────┴─────────────────────────────────┤
 *   │                     PromptBarFooter                        │
 *   └────────────────────────────────────────────────────────────┘
 *
 * NOT using FormSkeleton because the right column is *persistent* (not
 * an on-demand drawer like v3). The 55/45 grid is built inline so we
 * can control independent column scroll + always-visible RightColumn.
 *
 * Right column tab switcher is enabled (`showTabs`) — Flow gets manual
 * Overview/Editing toggle so the user can flip back to the live recipe
 * without committing the active picker.
 */

const MOCK_MODELS_IMAGE: PromptBarModel[] = [
  { id: "ideogram-2", label: "Ideogram 2", tag: "balanced", costPerUnit: 1 },
  { id: "flux-pro", label: "Flux Pro", tag: "high quality", costPerUnit: 2 },
];
const MOCK_MODELS_VIDEO: PromptBarModel[] = [
  { id: "kling-1.5", label: "Kling 1.5", tag: "balanced", costPerUnit: 6 },
  { id: "veo-2", label: "Veo 2", tag: "high quality", costPerUnit: 10 },
  { id: "luma", label: "Luma Dream", tag: "fast", costPerUnit: 4 },
];

export function StudioFlow() {
  const { form, update, activeColumnInput, setActiveColumnInput } =
    useStudioV4Form();

  // Custom audiences live alongside system ones — same pattern as the
  // v3 ProductFocusedAdForm.
  const [customAudiences, setCustomAudiences] = useState<Audience[]>([]);
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);
  const [conceptSource, setConceptSource] = useState<ConceptSource>("saved");

  // References live alongside form state so they survive picker
  // unmount when the user flips tabs in the right column.
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [pinterestSelected, setPinterestSelected] = useState<PinterestPin[]>([]);

  const allAudiences = [...systemAudiences, ...customAudiences];

  // Resolve product / brand for OverviewPane lookups.
  const product = useMemo(() => {
    if (!form.productId) return null;
    const p = allProducts.find((x) => x.id === form.productId);
    if (!p) return null;
    const brand = allBrands.find((b) => b.id === p.brandId);
    return {
      id: p.id,
      name: p.name,
      thumbUrl: p.thumbnail,
      brandName: brand?.name,
    };
  }, [form.productId]);

  const brand = useMemo(() => {
    if (!product) return null;
    const p = allProducts.find((x) => x.id === product.id);
    if (!p) return null;
    const b = allBrands.find((x) => x.id === p.brandId);
    return b ? { id: b.id, name: b.name, logoUrl: b.logo ?? undefined } : null;
  }, [product]);

  const models = form.output === "video" ? MOCK_MODELS_VIDEO : MOCK_MODELS_IMAGE;
  // Keep promptBarModelId in sync when output flips and the current id
  // is no longer valid for the new output's model list.
  if (
    form.promptBarModelId &&
    !models.find((m) => m.id === form.promptBarModelId)
  ) {
    Promise.resolve().then(() => update("promptBarModelId", models[0]?.id ?? ""));
  }
  if (!form.promptBarModelId && models[0]) {
    Promise.resolve().then(() => update("promptBarModelId", models[0].id));
  }

  const pinterestQuery: PinterestQuery = {
    output: form.output,
    productId: form.productId,
    brandId: brand?.id ?? null,
    angleIds: form.angleIds,
    conceptIds: form.conceptIds,
  };

  // Toggle helpers for column inputs.
  const toggleAudience = (id: string) => {
    update(
      "audienceIds",
      form.audienceIds.includes(id)
        ? form.audienceIds.filter((x) => x !== id)
        : [...form.audienceIds, id],
    );
  };
  const toggleAngle = (id: string) => {
    update(
      "angleIds",
      form.angleIds.includes(id)
        ? form.angleIds.filter((x) => x !== id)
        : [...form.angleIds, id],
    );
  };
  const toggleConcept = (id: string) => {
    update(
      "conceptIds",
      form.conceptIds.includes(id)
        ? form.conceptIds.filter((x) => x !== id)
        : [...form.conceptIds, id],
    );
  };
  const togglePinterest = (pin: PinterestPin) => {
    setPinterestSelected((prev) =>
      prev.find((p) => p.id === pin.id)
        ? prev.filter((p) => p.id !== pin.id)
        : [...prev, pin],
    );
  };

  const onGenerate = (testFirst: boolean) => {
    // eslint-disable-next-line no-console
    console.log("[StudioFlow] generate", {
      testFirst,
      form,
      uploads,
      pinterestSelected,
    });
    toast.success(testFirst ? "Test render queued" : "Render queued", {
      description: `${form.count} × ${form.output} · ${form.subMode}`,
    });
  };

  // Build the active column input pane — wraps the matching v3 picker
  // inside ColumnInputShell so cancel/save chrome is consistent.
  const renderActiveColumnInput = (): React.ReactNode => {
    switch (activeColumnInput) {
      case "audience":
        return (
          <ColumnInputShell
            icon={Users}
            title="Audience"
            sub="Pick one or more personas — multi-select renders parallel variants"
            onCancel={() => setActiveColumnInput(null)}
            onSave={() => setActiveColumnInput(null)}
            saveLabel="Done"
          >
            <AudiencePicker
              audiences={allAudiences}
              selectedIds={form.audienceIds}
              onToggle={toggleAudience}
              onCreate={() => setAudienceModalOpen(true)}
            />
          </ColumnInputShell>
        );
      case "angle":
        return (
          <ColumnInputShell
            icon={Target}
            title="Angle"
            sub="Storytelling angle — multi-select for parallel renders"
            onCancel={() => setActiveColumnInput(null)}
            onSave={() => setActiveColumnInput(null)}
            saveLabel="Done"
          >
            <AnglePicker
              selectedIds={form.angleIds}
              onToggle={toggleAngle}
              angles={ANGLES}
            />
          </ColumnInputShell>
        );
      case "concept":
        return (
          <ColumnInputShell
            icon={Lightbulb}
            title="Concept"
            sub="Saved concepts or freshly generated ideas"
            onCancel={() => setActiveColumnInput(null)}
            onSave={() => setActiveColumnInput(null)}
            saveLabel="Done"
          >
            <ConceptsStrip
              source={conceptSource}
              onSourceChange={setConceptSource}
              selectedIds={form.conceptIds}
              onToggle={toggleConcept}
            />
          </ColumnInputShell>
        );
      case "pinterest":
        return (
          <ColumnInputShell
            icon={Pin}
            title="Pinterest references"
            sub="Auto-fetched pins keyed off your current setup"
            onCancel={() => setActiveColumnInput(null)}
            onSave={() => setActiveColumnInput(null)}
            saveLabel="Done"
          >
            <PinterestPanel
              query={pinterestQuery}
              selectedIds={pinterestSelected.map((p) => p.id)}
              onToggleSelect={togglePinterest}
            />
          </ColumnInputShell>
        );
      default:
        return null;
    }
  };

  // Combined references for the OverviewPane.
  const overviewRefs = useMemo(
    () => [
      ...uploads
        .filter((u) => u.selected)
        .map((u) => ({ id: u.id, thumbUrl: u.thumbnail })),
      ...pinterestSelected.map((p) => ({ id: p.id, thumbUrl: p.thumbnail })),
    ],
    [uploads, pinterestSelected],
  );

  const audienceLookup = (id: string) => {
    const a = allAudiences.find((x) => x.id === id);
    return a ? { id: a.id, name: a.name } : null;
  };
  const angleLookup = (id: string) => {
    const a = ANGLES.find((x) => x.id === id);
    return a ? { id: a.id, name: a.label } : null;
  };
  const conceptLookup = (id: string) => {
    const all = [...savedConcepts, ...newConcepts];
    const c = all.find((x) => x.id === id);
    return c ? { id: c.id, name: c.name } : null;
  };

  return (
    <div className="flex h-full flex-col v3-page-mesh bg-transparent">
      <FauxHeader title="Studio · Flow" />

      {/* Sub-mode chip row — above the columns, full width. */}
      <div className="shrink-0 px-4 sm:px-6 py-2.5 border-b border-border/40 bg-transparent">
        <SubModeChipRow
          value={form.subMode}
          onChange={(next) => update("subMode", next)}
        />
      </div>

      {/* 55/45 grid — form column scrolls independently from the
          persistent right column. Below `lg`, the form column collapses
          and the right column takes full width when an input is active. */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[55fr_45fr]">
        {/* FORM COLUMN */}
        <div className="min-w-0 flex flex-col overflow-hidden">
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-2xl px-4 pt-6 pb-10 sm:px-6 sm:pt-7 sm:pb-12">
              <ProgressiveRows
                form={form}
                update={update}
                setActiveColumnInput={setActiveColumnInput}
                uploads={uploads}
                onUploadsChange={setUploads}
              />
            </div>
          </main>
        </div>

        {/* PERSISTENT RIGHT COLUMN */}
        <RightColumn
          activeInput={activeColumnInput}
          onClose={() => setActiveColumnInput(null)}
          showTabs={true}
          overview={
            <OverviewPane
              form={form}
              product={product}
              brand={brand}
              audienceLookup={audienceLookup}
              angleLookup={angleLookup}
              conceptLookup={conceptLookup}
              references={overviewRefs}
            />
          }
          inputContent={renderActiveColumnInput()}
        />
      </div>

      {/* PAGE-LEVEL PROMPT BAR — spans both columns. */}
      <PromptBarFooter
        prompt={form.prompt}
        onPromptChange={(v) => update("prompt", v)}
        count={form.count}
        onCountChange={(v) => update("count", v)}
        models={models}
        selectedModelId={form.promptBarModelId}
        onModelChange={(id) => update("promptBarModelId", id)}
        onGenerate={onGenerate}
      />

      {/* Audience create modal — lives at the shell level so the right
          column picker can trigger it without unmounting. */}
      <AudienceCreateModal
        open={audienceModalOpen}
        onClose={() => setAudienceModalOpen(false)}
        onCreate={(audience) => {
          setCustomAudiences((prev) => [...prev, audience]);
          update("audienceIds", [...form.audienceIds, audience.id]);
          setAudienceModalOpen(false);
        }}
      />
    </div>
  );
}
