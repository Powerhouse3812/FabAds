import { Users, Target, Lightbulb, Layers, Pin, Image as ImageIcon, Video, Settings2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductHorizontalPicker } from "@/genie6/generate-v3/forms/components/ProductHorizontalPicker";
import { CombinedOutputRow } from "@/genie6/generate-v3/forms/components/CombinedOutputRow";
import type { AspectRatio } from "@/genie6/generate-v3/forms/components/AspectRatioMulti";
import { UploadsPanel, type LocalUpload } from "@/genie6/generate-v3/forms/components/UploadsPanel";
import {
  SUB_MODE_PROFILES,
  type ActiveColumnInput,
  type StudioV4Form,
  type SubModeProfile,
} from "@/genie6/v4-shared/types";
import { ANGLES } from "@/genie6/generate-v3/forms/components/AnglePicker";
import { audiences as systemAudiences } from "@/genie6/generate-v3/mocks/audiences";
import { savedConcepts, newConcepts } from "@/genie6/generate-v3/mocks/concepts";

/**
 * ProgressiveRows — vertical row stack for the Studio v4 Flow shell.
 *
 * Reveals form rows progressively based on the active sub-mode profile
 * (`SUB_MODE_PROFILES[subMode].fields`). When `fields === "all"`
 * (Custom mode), every row renders. Otherwise only the rows declared in
 * the profile show up — the picker stays calm and never asks for
 * inputs the sub-mode doesn't use.
 *
 * Trigger rows (audience / angle / concept / pinterest) are buttons
 * that call `setActiveColumnInput(...)` to surface the matching picker
 * in the persistent right column. Pills inside the trigger button
 * summarise the current selection so the user can scan progress without
 * leaving the form.
 *
 * Phase-1 lock: no animation between row reveals — conditional render
 * is enough. Animation lands once we wire the smart-defaults backend.
 */

export interface ProgressiveRowsProps {
  form: StudioV4Form;
  update: <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => void;
  setActiveColumnInput: (next: ActiveColumnInput) => void;
  uploads: LocalUpload[];
  onUploadsChange: (next: LocalUpload[]) => void;
}

function hasField(profile: SubModeProfile, field: string): boolean {
  return profile.fields === "all" || profile.fields.includes(field);
}

function audienceLabel(id: string): string {
  return systemAudiences.find((a) => a.id === id)?.name ?? id;
}

function angleLabel(id: string): string {
  return ANGLES.find((a) => a.id === id)?.label ?? id;
}

function conceptLabel(id: string): string {
  const all = [...savedConcepts, ...newConcepts];
  return all.find((c) => c.id === id)?.name ?? id;
}

interface TriggerRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  pills?: string[];
  onClick: () => void;
}

function TriggerRow({ icon: Icon, label, hint, pills = [], onClick }: TriggerRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors",
        "border-border hover:border-primary/40",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5 text-left">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {pills.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">— {hint}</span>
        ) : (
          pills.map((p) => (
            <span
              key={p}
              className="inline-flex h-5 items-center rounded-full bg-primary/15 px-2 text-[10px] font-medium text-foreground"
            >
              {p}
            </span>
          ))
        )}
      </div>
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
        {pills.length === 0 ? "Pick →" : `${pills.length} · Edit`}
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </p>
  );
}

export function ProgressiveRows({
  form,
  update,
  setActiveColumnInput,
  uploads,
  onUploadsChange,
}: ProgressiveRowsProps) {
  const profile = SUB_MODE_PROFILES[form.subMode];

  // Reveal gates — product unlocks the rest. Custom mode bypasses the
  // gate so the user can experiment freely.
  const productPicked = !!form.productId;
  const showAfterProduct = profile.fields === "all" || productPicked;

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [refTab, setRefTab] = useState<"uploads" | "pinterest">("uploads");

  const audiencePills = form.audienceIds.map(audienceLabel);
  const anglePills = form.angleIds.map(angleLabel);
  const conceptPills = form.conceptIds.map(conceptLabel);

  const isVideo = form.output === "video";
  const showAdvanced =
    showAfterProduct &&
    (hasField(profile, "brandIntensity") ||
      hasField(profile, "voiceTone") ||
      hasField(profile, "script"));

  return (
    <div className="space-y-5">
      {/* 1. Product row — always visible when profile uses product. */}
      {hasField(profile, "product") && (
        <section className="space-y-2">
          <SectionLabel>Product</SectionLabel>
          <ProductHorizontalPicker
            value={form.productId}
            onChange={(id) => update("productId", id)}
          />
        </section>
      )}

      {/* 2. Format + Aspect — reveals after product picked (or in Custom). */}
      {hasField(profile, "output") && hasField(profile, "aspect") && showAfterProduct && (
        <section className="space-y-2">
          <SectionLabel>Output</SectionLabel>
          <CombinedOutputRow
            output={form.output}
            onOutputChange={(next) => {
              if (profile.lockOutput && next !== profile.lockOutput) return;
              update("output", next);
            }}
            aspectRatios={form.aspectRatios as AspectRatio[]}
            onAspectRatiosChange={(next) =>
              update("aspectRatios", next as string[])
            }
            useAiModel={!!form.modelId}
            onUseAiModelChange={(next) => update("modelId", next ? "default" : null)}
          />
        </section>
      )}

      {/* Output-only row when aspect not in profile — rare but covers
          UGC-style sub-modes that lock output but still need format. */}
      {hasField(profile, "output") && !hasField(profile, "aspect") && showAfterProduct && (
        <section className="space-y-2">
          <SectionLabel>Output</SectionLabel>
          <div
            role="radiogroup"
            aria-label="Output format"
            className="inline-flex rounded-md border border-border bg-card p-0.5"
          >
            {(["image", "video"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={form.output === opt}
                onClick={() => {
                  if (profile.lockOutput && opt !== profile.lockOutput) return;
                  update("output", opt);
                }}
                disabled={!!profile.lockOutput && opt !== profile.lockOutput}
                className={cn(
                  "inline-flex items-center gap-1 h-7 rounded px-2.5 text-[11px] font-medium transition-colors",
                  form.output === opt
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  !!profile.lockOutput &&
                    opt !== profile.lockOutput &&
                    "opacity-40 cursor-not-allowed",
                )}
              >
                {opt === "image" ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <Video className="h-3 w-3" />
                )}
                {opt === "image" ? "Image" : "Video"}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. Audience trigger row — profile-gated. */}
      {hasField(profile, "audience") && showAfterProduct && (
        <section className="space-y-2">
          <SectionLabel>Audience</SectionLabel>
          <TriggerRow
            icon={Users}
            label="Audience"
            hint="who is this for?"
            pills={audiencePills}
            onClick={() => setActiveColumnInput("audience")}
          />
        </section>
      )}

      {/* 4. Angle trigger row — profile-gated. */}
      {hasField(profile, "angle") && showAfterProduct && (
        <section className="space-y-2">
          <SectionLabel>Angle</SectionLabel>
          <TriggerRow
            icon={Target}
            label="Angle"
            hint="which storytelling angle?"
            pills={anglePills}
            onClick={() => setActiveColumnInput("angle")}
          />
        </section>
      )}

      {/* 5. Concept trigger row — profile-gated. */}
      {hasField(profile, "concept") && showAfterProduct && (
        <section className="space-y-2">
          <SectionLabel>Concept</SectionLabel>
          <TriggerRow
            icon={Lightbulb}
            label="Concept"
            hint="saved or AI-fresh"
            pills={conceptPills}
            onClick={() => setActiveColumnInput("concept")}
          />
        </section>
      )}

      {/* 6. References row — Uploads inline, Pinterest opens in column. */}
      {hasField(profile, "references") && showAfterProduct && (
        <section className="space-y-2">
          <SectionLabel>References</SectionLabel>
          <div className="rounded-lg border border-border bg-card">
            <div role="tablist" aria-label="References" className="flex items-center gap-1 border-b border-border px-2 py-1.5">
              <button
                type="button"
                role="tab"
                aria-selected={refTab === "uploads"}
                onClick={() => setRefTab("uploads")}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors",
                  refTab === "uploads"
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="h-3 w-3" />
                Uploads
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={refTab === "pinterest"}
                onClick={() => {
                  setRefTab("pinterest");
                  setActiveColumnInput("pinterest");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors",
                  refTab === "pinterest"
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Pin className="h-3 w-3" />
                Pinterest
              </button>
            </div>
            <div className="p-3">
              {refTab === "uploads" ? (
                <UploadsPanel
                  uploads={uploads}
                  onAdd={(next) => onUploadsChange([...uploads, ...next])}
                  onToggleSelect={(id) =>
                    onUploadsChange(
                      uploads.map((u) =>
                        u.id === id ? { ...u, selected: !u.selected } : u,
                      ),
                    )
                  }
                  onRemove={(id) =>
                    onUploadsChange(uploads.filter((u) => u.id !== id))
                  }
                />
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  Pinterest grid is open in the right column →
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 7. Advanced — collapsible, hosts brand intensity / voice tone /
          script when the sub-mode profile asks for them. */}
      {showAdvanced && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors",
              "hover:border-primary/40",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            )}
            aria-expanded={advancedOpen}
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Advanced</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {advancedOpen ? "Hide" : "Show"}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                advancedOpen && "rotate-180",
              )}
            />
          </button>

          {advancedOpen && (
            <div className="space-y-4 rounded-lg border border-border bg-card/50 p-3">
              {hasField(profile, "brandIntensity") && (
                <div className="space-y-1.5">
                  <SectionLabel>Brand intensity</SectionLabel>
                  <div role="radiogroup" aria-label="Brand intensity" className="flex flex-wrap gap-1.5">
                    {(["minimal", "moderate", "strong"] as const).map((opt) => {
                      const active = form.brandIntensity === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => update("brandIntensity", opt)}
                          className={cn(
                            "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            active
                              ? "border-primary bg-primary/15 text-foreground"
                              : "border-border bg-card text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {opt[0].toUpperCase() + opt.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasField(profile, "voiceTone") && isVideo && (
                <div className="space-y-1.5">
                  <SectionLabel>Voice tone</SectionLabel>
                  <input
                    type="text"
                    value={form.voiceTone ?? ""}
                    onChange={(e) => update("voiceTone", e.target.value || null)}
                    placeholder="e.g. Warm, Punchy, Founder-led"
                    className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                  />
                </div>
              )}

              {hasField(profile, "script") && isVideo && (
                <div className="space-y-1.5">
                  <SectionLabel>Script</SectionLabel>
                  <textarea
                    value={form.scriptText}
                    onChange={(e) => update("scriptText", e.target.value)}
                    placeholder="Leave blank for AI to draft, or paste your own."
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
