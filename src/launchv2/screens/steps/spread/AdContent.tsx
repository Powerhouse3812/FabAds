/**
 * AdContent — the ONE shared copy block (plan.adCopy) plus:
 *  - a "use Genie" affordance (mock fill),
 *  - multiple text-variations behind Advanced (writes adCopy.textVariations),
 *  - a per-creative override affordance (expandable) writing plan.copyOverrides.
 */
import { useState } from "react";
import { ChevronDown, Plus, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdCopy } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { CTA_OPTIONS } from "./meta";

const GENIE_FILL: Partial<AdCopy> = {
  primaryText: "Tired of the same old routine? Meet the upgrade your day's been missing. Free shipping this week only.",
  headline: "Your new daily essential",
  description: "Loved by 12,000+ customers",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function AdContent({ flow, wholeAdMode = false }: { flow: UseFlowV2; wholeAdMode?: boolean }) {
  const { plan } = flow;
  const copy = plan.adCopy;
  const [advanced, setAdvanced] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const hasSavedAds = plan.creatives.some((c) => c.savedAd || c.itemType === "ad");

  const set = (p: Partial<AdCopy>) => flow.patch({ adCopy: { ...copy, ...p } });

  const variations = copy.textVariations ?? [];
  const setVariations = (v: string[]) => set({ textVariations: v });

  const overrideIds = Object.keys(plan.copyOverrides);
  const setOverride = (id: string, p: Partial<AdCopy>) => {
    const next = { ...plan.copyOverrides, [id]: { ...plan.copyOverrides[id], ...p } };
    flow.patch({ copyOverrides: next });
  };
  const clearOverride = (id: string) => {
    const next = { ...plan.copyOverrides };
    delete next[id];
    flow.patch({ copyOverrides: next });
  };

  return (
    <div className="space-y-3">
      {/* Pre-filled banner — only for individual media mode */}
      {!wholeAdMode && hasSavedAds && (
        <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-[11px] text-foreground">
          <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
          Copy pre-filled from selected ads — you can edit or override below.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {wholeAdMode ? "Ad settings" : "Ad content"}
        </h3>
        {/* Use Genie — not relevant for whole ads, copy is baked in */}
        {!wholeAdMode && (
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => set(GENIE_FILL)}>
            <Sparkles className="h-3 w-3" />
            Use Genie
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {wholeAdMode
          ? "Creative copy is part of your selected ads. Set ad-level settings below."
          : "One shared copy block applies to every creative below."}
      </p>

      {/* Primary text — individual media only */}
      {!wholeAdMode && (
        <Field label="Primary text">
          <Textarea
            rows={3}
            value={copy.primaryText}
            onChange={(e) => set({ primaryText: e.target.value })}
            placeholder="What's the hook? Lead with the benefit…"
            className="resize-none text-sm"
          />
        </Field>
      )}

      {/* Headline + Description — individual media only */}
      {!wholeAdMode && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Headline">
            <Input value={copy.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Short, bold promise" className="text-sm" />
          </Field>
          <Field label="Description">
            <Input value={copy.description} onChange={(e) => set({ description: e.target.value })} placeholder="Supporting detail" className="text-sm" />
          </Field>
        </div>
      )}

      {/* CTA + Display link — shown in both modes */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Call to action">
          <Select value={copy.cta} onValueChange={(v) => set({ cta: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-sm">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Display link">
          <Input value={copy.displayLink} onChange={(e) => set({ displayLink: e.target.value })} placeholder="brand.com" className="font-mono text-sm" />
        </Field>
      </div>

      {/* Destination URL — shown in both modes */}
      <Field label="Destination URL">
        <Input
          value={copy.destinationUrl}
          onChange={(e) => set({ destinationUrl: e.target.value })}
          placeholder="https://brand.com/landing"
          className="font-mono text-sm"
        />
      </Field>

      {/* Whole-ad mode: UTM shown directly (not buried in Advanced) */}
      {wholeAdMode ? (
        <Field label="UTM template">
          <Input
            value={copy.utmTemplate}
            onChange={(e) => set({ utmTemplate: e.target.value })}
            placeholder="utm_source={{placement}}&utm_campaign={{campaign.name}}"
            className="font-mono text-[11px]"
          />
        </Field>
      ) : (
        <>
          {/* Individual media: Advanced collapsible — UTM + text variations */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex w-full items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", advanced && "rotate-180")} />
            Advanced — UTM &amp; text variations
          </button>
          {advanced && (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-3">
              <Field label="UTM template">
                <Input
                  value={copy.utmTemplate}
                  onChange={(e) => set({ utmTemplate: e.target.value })}
                  className="font-mono text-[11px]"
                />
              </Field>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Primary-text variations{" "}
                    {variations.length > 0 && <span className="font-mono tabular-nums">({variations.length})</span>}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-[11px]"
                    onClick={() => setVariations([...variations, ""])}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                {variations.map((v, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <Textarea
                      rows={2}
                      value={v}
                      onChange={(e) => setVariations(variations.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Variation ${i + 1}`}
                      className="resize-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setVariations(variations.filter((_, j) => j !== i))}
                      aria-label="Remove variation"
                      className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {variations.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Add variations to test multiple hooks — used by the combination chooser below.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Per-creative overrides — individual media only */}
      {!wholeAdMode && plan.creatives.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOverrideOpen((v) => !v)}
            className="flex w-full items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", overrideOpen && "rotate-180")} />
            Per-creative overrides
            {overrideIds.length > 0 && <span className="font-mono tabular-nums">({overrideIds.length})</span>}
          </button>
          {overrideOpen && (
            <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3">
              {plan.creatives.map((c) => {
                const ov = plan.copyOverrides[c.id];
                const active = !!ov;
                return (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs font-medium text-foreground">{c.name}</span>
                      {active ? (
                        <button
                          type="button"
                          onClick={() => clearOverride(c.id)}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" /> Use shared
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOverride(c.id, { headline: copy.headline, primaryText: copy.primaryText })}
                          className="text-[11px] font-medium text-foreground hover:underline"
                        >
                          Override
                        </button>
                      )}
                    </div>
                    {active && (
                      <div className="mt-2 space-y-1.5">
                        <Input
                          value={ov.headline ?? ""}
                          onChange={(e) => setOverride(c.id, { headline: e.target.value })}
                          placeholder="Headline for this creative"
                          className="h-8 text-xs"
                        />
                        <Textarea
                          rows={2}
                          value={ov.primaryText ?? ""}
                          onChange={(e) => setOverride(c.id, { primaryText: e.target.value })}
                          placeholder="Primary text for this creative"
                          className="resize-none text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
