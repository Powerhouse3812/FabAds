import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Target,
  Users,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnInputShell } from "@/genie6/v4-shared/components/ColumnInputShell";
import { OverviewPane } from "@/genie6/v4-shared/components/OverviewPane";
import { RightColumn } from "@/genie6/v4-shared/components/RightColumn";
import {
  SUB_MODE_PROFILES,
  type ActiveColumnInput,
  type StudioV4Form,
} from "@/genie6/v4-shared/types";
import { useSmartDefaults } from "@/genie6/v4-shared/state/useSmartDefaults";
import { useStudioV4Form } from "@/genie6/v4-shared/state/useStudioV4Form";

import {
  AudiencePicker,
} from "@/genie6/generate-v3/forms/components/AudiencePicker";
import {
  AnglePicker,
  ANGLES,
} from "@/genie6/generate-v3/forms/components/AnglePicker";
import {
  ConceptsStrip,
  type ConceptSource,
} from "@/genie6/generate-v3/forms/components/ConceptsStrip";
import { PinterestPanel } from "@/genie6/generate-v3/forms/components/PinterestPanel";
import { audiences as allAudiences } from "@/genie6/generate-v3/mocks/audiences";
import {
  savedConcepts,
  newConcepts,
} from "@/genie6/generate-v3/mocks/concepts";
import {
  brands as allBrands,
  products as allProducts,
} from "@/mocks/shared";

import { Step1SubMode } from "./steps/Step1SubMode";
import { Step2Product } from "./steps/Step2Product";
import { Step3Path } from "./steps/Step3Path";
import { Step4Configure } from "./steps/Step4Configure";

/**
 * StudioWizard — the wizard variant of Studio v4.
 *
 * Linear stepper layout:
 *   Step 1 → Sub-mode
 *   Step 2 → Product
 *   Step 3 → Path (auto-skipped when sub-mode profile locks `path`)
 *   Step 4 → Configure (Scratch or Iterate body)
 *
 * State lives in `useStudioV4Form` (the v4 single source of truth).
 * Smart defaults from `useSmartDefaults` apply on mount and whenever
 * the sub-mode flips — only filling fields the user hasn't touched yet.
 *
 * Right column is persistent. It shows the OverviewPane by default and
 * swaps in a ColumnInputShell-wrapped picker when the user taps a
 * trigger row in Step 4. Cancel rolls back to the snapshot taken when
 * the input opened; Save commits the live edits.
 */

const TOTAL_STEPS = 4;

export interface StudioWizardProps {
  onBack?: () => void;
  initial?: Partial<StudioV4Form>;
}

export function StudioWizard({ onBack, initial }: StudioWizardProps) {
  const { form, update, activeColumnInput, setActiveColumnInput } =
    useStudioV4Form(initial);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Track which fields the user has manually touched so smart defaults
  // never overwrite intentional picks. Always considered touched once
  // user advances past a step that owns the field.
  const touchedRef = useRef<Set<keyof StudioV4Form>>(new Set());
  const markTouched = (key: keyof StudioV4Form) => {
    touchedRef.current.add(key);
  };

  // Wrap `update` to also mark the field as touched.
  const trackedUpdate = useMemo(
    () =>
      <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => {
        markTouched(key);
        update(key, value);
      },
    [update],
  );

  // Smart defaults: re-run when brand / product / sub-mode change.
  const defaults = useSmartDefaults(
    form.brandId,
    form.productId,
    form.subMode,
  );

  useEffect(() => {
    // Apply each default key only if user hasn't touched it.
    (Object.keys(defaults) as (keyof StudioV4Form)[]).forEach((key) => {
      if (touchedRef.current.has(key)) return;
      const next = defaults[key];
      if (next === undefined) return;
      update(key, next as StudioV4Form[typeof key]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subMode, form.brandId, form.productId]);

  // If the active sub-mode locks a path, force-set it and never show
  // Step 3. We auto-skip if user lands on Step 3 with a locked profile.
  const profile = SUB_MODE_PROFILES[form.subMode];
  useEffect(() => {
    if (profile.lockPath && form.path !== profile.lockPath) {
      update("path", profile.lockPath);
    }
    if (profile.lockOutput && form.output !== profile.lockOutput) {
      update("output", profile.lockOutput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subMode]);

  const skipStep3 = !!profile.lockPath;

  // Right-column snapshot — for Cancel rollback.
  const snapshotRef = useRef<{
    audienceIds: string[];
    angleIds: string[];
    conceptIds: string[];
  } | null>(null);

  const openColumn = (next: ActiveColumnInput) => {
    snapshotRef.current = {
      audienceIds: [...form.audienceIds],
      angleIds: [...form.angleIds],
      conceptIds: [...form.conceptIds],
    };
    setActiveColumnInput(next);
  };

  const closeColumn = () => setActiveColumnInput(null);

  const cancelColumn = () => {
    const snap = snapshotRef.current;
    if (snap) {
      update("audienceIds", snap.audienceIds);
      update("angleIds", snap.angleIds);
      update("conceptIds", snap.conceptIds);
    }
    snapshotRef.current = null;
    setActiveColumnInput(null);
  };

  const saveColumn = () => {
    snapshotRef.current = null;
    setActiveColumnInput(null);
  };

  // Lookups for the OverviewPane.
  const product = form.productId
    ? allProducts.find((p) => p.id === form.productId)
    : null;
  const brand = form.brandId
    ? allBrands.find((b) => b.id === form.brandId)
    : null;

  const audienceLookup = (id: string) => {
    const a = allAudiences.find((x) => x.id === id);
    return a ? { id, name: a.name } : null;
  };
  const angleLookup = (id: string) => {
    const a = ANGLES.find((x) => x.id === id);
    return a ? { id, name: a.label } : null;
  };
  const conceptLookup = (id: string) => {
    const all = [...savedConcepts, ...newConcepts];
    const c = all.find((x) => x.id === id);
    return c ? { id, name: c.name } : null;
  };

  // Concept source toggle local to the wizard — saved/new view inside
  // ColumnInputShell. Doesn't live on the form because v3 handles the
  // generation locally too.
  const [conceptSource, setConceptSource] = useState<ConceptSource>("saved");

  // Step navigation — auto-skip Step 3 when path is locked.
  const canAdvance = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return !!form.productId;
    if (step === 3) return !!form.path;
    return false;
  }, [step, form.productId, form.path]);

  const goNext = () => {
    if (step === 4) return;
    if (step === 2 && skipStep3) {
      setStep(4);
      return;
    }
    setStep(((step as number) + 1) as 1 | 2 | 3 | 4);
  };

  const goBack = () => {
    if (step === 1) {
      onBack?.();
      return;
    }
    if (step === 4 && skipStep3) {
      setStep(2);
      return;
    }
    setStep(((step as number) - 1) as 1 | 2 | 3 | 4);
  };

  const handleGenerate = () => {
    // eslint-disable-next-line no-console
    console.log("[StudioWizard] generate", form);
    if (typeof window !== "undefined") {
      window.alert(`Submitted! ${form.count} renders queued.`);
    }
  };

  // ─── Right-column input bodies ───────────────────────────
  let inputContent: React.ReactNode = null;
  if (activeColumnInput === "audience") {
    inputContent = (
      <ColumnInputShell
        icon={Users}
        title="Browse audiences"
        sub="Pick who this ad is for. Multi-select is fine."
        onCancel={cancelColumn}
        onSave={saveColumn}
        saveLabel="Save"
      >
        <AudiencePicker
          audiences={allAudiences}
          selectedIds={form.audienceIds}
          onToggle={(id) =>
            update(
              "audienceIds",
              form.audienceIds.includes(id)
                ? form.audienceIds.filter((x) => x !== id)
                : [...form.audienceIds, id],
            )
          }
          onCreate={() => {
            // Modal flow lives in v3. For wizard v1 we no-op the create
            // affordance — full integration lands in a follow-up.
          }}
        />
      </ColumnInputShell>
    );
  } else if (activeColumnInput === "angle") {
    inputContent = (
      <ColumnInputShell
        icon={Target}
        title="Pick angles"
        sub="What story does this ad tell?"
        onCancel={cancelColumn}
        onSave={saveColumn}
      >
        <AnglePicker
          selectedIds={form.angleIds}
          onToggle={(id) =>
            update(
              "angleIds",
              form.angleIds.includes(id)
                ? form.angleIds.filter((x) => x !== id)
                : [...form.angleIds, id],
            )
          }
        />
      </ColumnInputShell>
    );
  } else if (activeColumnInput === "concept") {
    inputContent = (
      <ColumnInputShell
        icon={Lightbulb}
        title="Concepts"
        sub="Specific ideas to anchor the render."
        onCancel={cancelColumn}
        onSave={saveColumn}
      >
        <ConceptsStrip
          source={conceptSource}
          onSourceChange={setConceptSource}
          selectedIds={form.conceptIds}
          onToggle={(id) =>
            update(
              "conceptIds",
              form.conceptIds.includes(id)
                ? form.conceptIds.filter((x) => x !== id)
                : [...form.conceptIds, id],
            )
          }
        />
      </ColumnInputShell>
    );
  } else if (activeColumnInput === "pinterest") {
    inputContent = (
      <ColumnInputShell
        icon={Layers}
        title="Pinterest references"
        sub="Auto-fetched based on your product, angle, and output."
        onCancel={cancelColumn}
        onSave={saveColumn}
      >
        <PinterestPanel
          query={{
            output: form.output,
            productId: form.productId,
            brandId: form.brandId,
            angleIds: form.angleIds,
            conceptIds: form.conceptIds,
          }}
          selectedIds={[]}
          onToggleSelect={() => {
            /* Wizard v1: pin-attach state lives below; integrate with
               form.references when that field lands. */
          }}
        />
      </ColumnInputShell>
    );
  }

  // ─── Step body ───────────────────────────────────────────
  let body: React.ReactNode = null;
  if (step === 1) {
    body = (
      <Step1SubMode
        value={form.subMode}
        onChange={(s) => {
          markTouched("subMode");
          update("subMode", s);
        }}
      />
    );
  } else if (step === 2) {
    body = (
      <Step2Product
        productId={form.productId}
        onProductChange={(id) => trackedUpdate("productId", id)}
        onBrandChange={(id) => trackedUpdate("brandId", id)}
      />
    );
  } else if (step === 3) {
    body = (
      <Step3Path
        value={form.path}
        onChange={(p) => trackedUpdate("path", p)}
      />
    );
  } else {
    body = (
      <Step4Configure
        form={form}
        update={trackedUpdate}
        setActiveColumnInput={openColumn}
      />
    );
  }

  // Visual step index (collapses when Step 3 is skipped).
  const totalVisible = skipStep3 ? TOTAL_STEPS - 1 : TOTAL_STEPS;
  const visibleIndex =
    step <= 2 ? step : skipStep3 ? step - 1 : step;

  const credits = form.count * 5;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ─── Header ─── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-[12px] text-foreground hover:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Studio · Wizard
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Step {visibleIndex} / {totalVisible}
          </p>
          <StepDots total={totalVisible} active={visibleIndex} />
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="grid flex-1 min-h-0 grid-cols-[1fr_360px]">
        <section className="min-h-0 overflow-hidden">{body}</section>
        <RightColumn
          activeInput={activeColumnInput}
          onClose={closeColumn}
          showTabs={false}
          overview={
            <OverviewPane
              form={form}
              product={
                product
                  ? {
                      id: product.id,
                      name: product.name,
                      thumbUrl: product.thumbnail,
                      brandName: brand?.name,
                    }
                  : null
              }
              brand={
                brand
                  ? { id: brand.id, name: brand.name, logoUrl: brand.logo ?? undefined }
                  : null
              }
              audienceLookup={audienceLookup}
              angleLookup={angleLookup}
              conceptLookup={conceptLookup}
            />
          }
          inputContent={inputContent}
        />
      </main>

      {/* ─── Footer ─── */}
      <footer className="shrink-0 border-t border-border bg-card/40 px-4 py-2.5">
        {step === 4 ? (
          <PromptBarFooter
            value={form.prompt}
            onChange={(v) => trackedUpdate("prompt", v)}
            onGenerate={handleGenerate}
            credits={credits}
            onBack={goBack}
          />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/60",
                step === 1 && "opacity-50 cursor-not-allowed hover:bg-transparent",
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance}
              className={cn(
                "inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90",
                !canAdvance && "opacity-50 cursor-not-allowed hover:opacity-50",
              )}
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function StepDots({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= active;
        return (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              filled ? "bg-primary" : "bg-muted",
            )}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function PromptBarFooter({
  value,
  onChange,
  onGenerate,
  credits,
  onBack,
}: {
  value: string;
  onChange: (next: string) => void;
  onGenerate: () => void;
  credits: number;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-xs text-foreground hover:bg-muted/60 transition-colors shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        placeholder="Describe what you want to generate…"
        className={cn(
          "flex-1 min-h-[36px] max-h-[80px] resize-none rounded-md border border-border bg-background px-3 py-2",
          "text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/40",
        )}
      />
      <button
        type="button"
        onClick={onGenerate}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 shrink-0"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate · {credits} credits
      </button>
    </div>
  );
}
