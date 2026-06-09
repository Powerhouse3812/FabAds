/**
 * Step 2 — Setup V2 (complete redesign).
 *
 * Design philosophy:
 *   - Control panel, not a form. Strategy from Step 1 pre-filled most fields.
 *     The user's job is VERIFY and tweak, not fill from scratch.
 *   - 2-column layout: sticky left labels, scrollable right content.
 *     Like Mac System Preferences or Stripe's settings form.
 *   - Template bar = prominent lime banner, not a subtle card.
 *   - Campaign section: Budget cluster + CBO/ABO inline.
 *     A/B Test and Catalogue = advanced, collapsed by default.
 *   - Audience: targeting template inline at section level.
 *     SAC = "Compliance" subsection with Shield header.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Lock,
  Sparkles,
  Pencil,
  Shield,
  Info,
  Zap,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { UseFlowV2 } from "../../state/useFlowV2";
import {
  fieldPolicy,
  allowedBidStrategies,
  isAdvantagePlus,
  specialCategoryActive,
  requiresPixel,
  cascade,
  showsLocationPicker,
  DESTINATIONS_BY_OBJECTIVE,
} from "../../reducer";
import {
  BID_LABELS,
  SPECIAL_CATEGORIES,
  TARGETING_TEMPLATES,
  getTemplate,
} from "../../data";
import type {
  AttributionWindow,
  BidStrategy,
  DestinationType,
  OptimizationGoal,
  SpecialAdCategory,
} from "../../types";
import { AccountsPages } from "./setup/AccountsPages";
import { TemplateModal } from "./setup/TemplateModal";
import { SaveTemplateDialog } from "./setup/SaveTemplateDialog";
import { diffSetupTemplate, isSetupEdited } from "../../templates/edits";
import { templatesService } from "../../templates/service";
import type { SetupTemplate } from "../../templates/types";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SectionRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-6 py-5 border-b border-border/50 last:border-b-0">
      {/* Left: sticky label column */}
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground leading-snug">
            {hint}
          </p>
        )}
      </div>
      {/* Right: content column */}
      <div>{children}</div>
    </div>
  );
}

function AdvancedReveal({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function LockNote({ reason }: { reason?: string }) {
  if (!reason) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Lock className="h-3 w-3" /> {reason}
    </span>
  );
}

function InlineToggle({
  checked,
  onCheckedChange,
  label,
  desc,
  locked,
  reason,
  icon,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  desc?: string;
  locked?: boolean;
  reason?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground cursor-pointer">
          {icon}
          {label}
        </Label>
        {desc && (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{desc}</p>
        )}
        {locked && <LockNote reason={reason} />}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={locked}
        className="shrink-0"
      />
    </div>
  );
}

/* Compact section-level chip for template status */
function SectionChip({ flow, section }: { flow: UseFlowV2; section: "destinations" | "campaign" | "adset" | "audience" }) {
  const { plan } = flow;
  if (!plan.appliedSetupTemplateId) return null;
  const tpl = templatesService.getSetup(plan.appliedSetupTemplateId);
  if (!tpl) return null;
  const diff = diffSetupTemplate(plan, tpl.payload);
  const isEdited = diff[section];
  if (isEdited) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-500 uppercase tracking-wide">
        Edited
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary uppercase tracking-wide">
      From template
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Template Banner (V2 — prominent lime banner)                        */
/* ------------------------------------------------------------------ */

function TemplateBanner({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [saveOpen, setSaveOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const templates = (() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void version; // dependency tracking
    return templatesService.listSetup();
  })();

  const linked: SetupTemplate | null = plan.appliedSetupTemplateId
    ? templates.find((t) => t.id === plan.appliedSetupTemplateId) ?? null
    : null;

  const diff = linked ? diffSetupTemplate(plan, linked.payload) : null;
  const edited = diff ? isSetupEdited(diff) : false;

  const handleSave = (name: string) => {
    flow.saveCurrentSetupAsTemplate(name);
    setVersion((v) => v + 1);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border px-5 py-4 transition-colors",
          linked
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-muted/30",
        )}
      >
        {linked ? (
          /* Linked state */
          <div className="flex flex-wrap items-center gap-3">
            <Zap className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Setup template
              </span>
              <span className="text-sm font-semibold text-foreground">
                {linked.name}
              </span>
              {edited ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-500 uppercase tracking-wide">
                  Edited
                </span>
              ) : (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase tracking-wide">
                  Linked
                </span>
              )}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => setSaveOpen(true)}
              >
                Fork &amp; save
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => flow.unlinkSetupTemplate()}
                aria-label="Unlink template"
                title="Unlink (keeps current values)"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          /* Unlinked state */
          <div className="flex flex-wrap items-center gap-3">
            <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-mono text-[11px] text-muted-foreground">
              Setup template
            </span>
            {templates.length > 0 ? (
              <Select value={undefined} onValueChange={(id) => flow.applySetupTemplate(id)}>
                <SelectTrigger className="h-8 w-auto min-w-[12rem] rounded-full border-border bg-card text-xs">
                  <SelectValue placeholder="Apply a saved template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="font-mono text-xs text-muted-foreground/60">
                No templates yet — configure below and save.
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 rounded-full px-3 text-xs"
              onClick={() => setSaveOpen(true)}
            >
              Save current
            </Button>
          </div>
        )}
      </div>

      <SaveTemplateDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={handleSave}
        kind="Setup"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function Step2SetupV2({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const policy = fieldPolicy(plan);
  const asc = isAdvantagePlus(plan);
  const special = specialCategoryActive(plan);
  const needsPixel = requiresPixel(plan) && plan.targets.some((t) => !t.pixelId);
  const currency = plan.targets[0]?.currency ?? "USD";

  const bidOptions = plan.objective
    ? allowedBidStrategies(plan.objective, plan.optimizationGoal)
    : (["LOWEST_COST_WITHOUT_CAP"] as BidStrategy[]);

  const tpl = getTemplate(plan.targetingTemplateId);
  const [editOpen, setEditOpen] = useState(false);

  const toggleSpecial = (id: SpecialAdCategory) => {
    const on = plan.specialAdCategories.includes(id);
    patch({
      specialAdCategories: on
        ? plan.specialAdCategories.filter((c) => c !== id)
        : [...plan.specialAdCategories, id],
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div data-screen="lv2-step2-setup-v2" className="space-y-4">

        {/* ── Template banner ─────────────────────────────────── */}
        <TemplateBanner flow={flow} />

        {/* ── Section 1: Accounts & Pages ─────────────────────── */}
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            {/* Section header */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                1
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Ad accounts &amp; pages
              </h3>
              <span className="font-mono text-xs text-muted-foreground ml-0.5">
                · pick accounts, then pages
              </span>
              <span className="ml-auto">
                <SectionChip flow={flow} section="destinations" />
              </span>
            </div>
            <div className="px-5 py-4">
              <AccountsPages
                plan={plan}
                targets={plan.targets}
                onChange={flow.setTargets}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Campaign ─────────────────────────────── */}
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                2
              </span>
              <h3 className="text-sm font-semibold text-foreground">Campaign</h3>
              <span className="ml-auto">
                <SectionChip flow={flow} section="campaign" />
              </span>
            </div>
            <div className="divide-y divide-border/50">

              {/* Budget cluster */}
              <SectionRow label="Budget" hint="Daily spend">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Budget amount */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm text-muted-foreground">{currency}</span>
                    <Input
                      type="number"
                      min={1}
                      value={plan.budgetAmount}
                      onChange={(e) => patch({ budgetAmount: Number(e.target.value) || 0 })}
                      className="h-9 w-28 font-mono tabular-nums"
                    />
                    <span className="font-mono text-xs text-muted-foreground">/day</span>
                  </div>

                  {/* CBO / ABO inline segmented */}
                  <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 p-0.5">
                    {(["ABO", "CBO"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        disabled={policy.budgetMode.locked}
                        onClick={() => patch({ budgetMode: mode })}
                        className={cn(
                          "rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors",
                          plan.budgetMode === mode
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                          policy.budgetMode.locked && "cursor-not-allowed opacity-40",
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {policy.budgetMode.locked && (
                    <LockNote reason={policy.budgetMode.reason} />
                  )}
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  {plan.budgetMode === "CBO"
                    ? "Campaign-level budget — Meta distributes across ad sets."
                    : "Ad-set-level budget — you control per ad set."}
                </p>
              </SectionRow>

              {/* Advantage+ toggle */}
              <SectionRow
                label="Advantage+"
                hint="Meta full automation"
              >
                <InlineToggle
                  checked={plan.advantagePlus}
                  onCheckedChange={(v) => patch({ advantagePlus: v })}
                  label="Enable Advantage+"
                  desc="Let Meta optimize budget, audience and placements automatically."
                  icon={<Sparkles className="h-4 w-4 text-primary" />}
                />
                {asc && (
                  <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-primary">
                    <Sparkles className="h-3 w-3" />
                    Active — campaign budget, broad audience and auto placements applied.
                  </p>
                )}
              </SectionRow>

              {/* Advanced: A/B Test + Catalogue + Bid strategy */}
              <div className="px-5 py-3.5">
                <AdvancedReveal label="Advanced — A/B test, catalogue &amp; bid strategy">
                  <div className="space-y-4 pl-1">
                    <InlineToggle
                      checked={plan.abTest}
                      onCheckedChange={(v) => patch({ abTest: v })}
                      label="A/B Test"
                      desc="Meta runs the experiment — no extra inputs required."
                    />
                    <InlineToggle
                      checked={plan.catalogueToggle}
                      onCheckedChange={(v) => {
                        patch({ catalogueToggle: v });
                        if (v && plan.objective) {
                          patch({ catalogueToggle: v, format: "dpa" });
                        } else if (!v && plan.format === "dpa") {
                          patch({ catalogueToggle: v, format: null });
                        }
                      }}
                      label="Advantage+ Catalogue"
                      desc="Pre-selects Catalogue (DPA) in the Ad step."
                    />

                    {/* Bid strategy */}
                    {policy.bidStrategy.visibility !== "hidden" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Bid strategy</Label>
                        <Select
                          value={plan.bidStrategy}
                          onValueChange={(v) => patch({ bidStrategy: v as BidStrategy })}
                        >
                          <SelectTrigger className="h-9 w-full max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {bidOptions.map((b) => (
                              <SelectItem key={b} value={b}>
                                {BID_LABELS[b]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {plan.bidStrategy !== "LOWEST_COST_WITHOUT_CAP" && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="font-mono text-sm text-muted-foreground">
                              {currency}
                            </span>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Cap / goal"
                              value={plan.bidValue ?? ""}
                              onChange={(e) =>
                                patch({
                                  bidValue:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                              className="h-9 w-32 font-mono tabular-nums"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AdvancedReveal>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Ad set ───────────────────────────────── */}
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                3
              </span>
              <h3 className="text-sm font-semibold text-foreground">Ad set</h3>
              <span className="ml-auto">
                <SectionChip flow={flow} section="adset" />
              </span>
            </div>
            <div className="divide-y divide-border/50">

              {/* Conversion location */}
              {plan.objective && showsLocationPicker(plan.objective) && (
                <SectionRow label="Conversion location" hint="Where results happen">
                  <Select
                    value={plan.destinationType ?? undefined}
                    onValueChange={(v) => patch({ destinationType: v as DestinationType })}
                  >
                    <SelectTrigger className="h-9 w-full max-w-xs">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {(DESTINATIONS_BY_OBJECTIVE[plan.objective] ?? []).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SectionRow>
              )}

              {/* Performance goal */}
              {plan.objective && plan.destinationType && (() => {
                const c = cascade(plan.objective, plan.destinationType);
                return (
                  <SectionRow label="Performance goal" hint="Optimization target">
                    {c.lockedGoal ? (
                      <div className="space-y-1">
                        <p className="font-mono text-xs text-foreground">
                          {c.lockedGoal
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (x) => x.toUpperCase())}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground/60">
                          Only option for this destination
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={plan.optimizationGoal ?? undefined}
                        onValueChange={(v) =>
                          patch({ optimizationGoal: v as OptimizationGoal })
                        }
                      >
                        <SelectTrigger className="h-9 w-full max-w-xs">
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {c.optimizationGoals.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (x) => x.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </SectionRow>
                );
              })()}

              {/* Pixel warning */}
              {needsPixel && (
                <SectionRow label="Pixel" hint="Required for this goal">
                  <p className="font-mono text-xs text-amber-600">
                    Select accounts with a pixel connected — or switch to a different optimization
                    goal.
                  </p>
                </SectionRow>
              )}

              {/* Attribution */}
              <SectionRow label="Attribution" hint="Conversion window">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Attribution window</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="font-mono text-xs max-w-64">
                        Conversion window used to credit results. 28-day view removed Jan 2026.
                        Full label: "7-day click + 1-day engage-through + 1-day view."
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={plan.attribution}
                    onValueChange={(v) => patch({ attribution: v as AttributionWindow })}
                  >
                    <SelectTrigger className="h-9 w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d_click">1-day click</SelectItem>
                      <SelectItem value="7d_click">7-day click</SelectItem>
                      <SelectItem value="7d_click_1d_view">
                        7-day click + 1-day view (default)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SectionRow>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Audience ─────────────────────────────── */}
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                4
              </span>
              <h3 className="text-sm font-semibold text-foreground">Audience</h3>
              <span className="ml-auto">
                <SectionChip flow={flow} section="audience" />
              </span>
            </div>
            <div className="divide-y divide-border/50">

              {/* Targeting template — inline at section level */}
              <SectionRow label="Targeting template" hint="Audience preset">
                <div className="flex items-center gap-2">
                  <Select
                    value={plan.targetingTemplateId ?? undefined}
                    onValueChange={(v) => patch({ targetingTemplateId: v })}
                  >
                    <SelectTrigger className="h-9 flex-1 max-w-xs">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGETING_TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom (advanced settings)</SelectItem>
                    </SelectContent>
                  </Select>
                  {tpl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-full"
                      onClick={() => setEditOpen(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>

                {/* Summary chips */}
                {tpl && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tpl.summary.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </SectionRow>

              {/* Advantage+ toggles */}
              <SectionRow label="Automation" hint="Meta AI optimizations">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InlineToggle
                    checked={plan.advantageAudience}
                    onCheckedChange={(v) => patch({ advantageAudience: v })}
                    label="Advantage+ Audience"
                    desc="Start broad; Meta finds buyers."
                    locked={policy.advantageAudience.locked}
                    reason={policy.advantageAudience.reason}
                  />
                  <InlineToggle
                    checked={plan.advantageCreative}
                    onCheckedChange={(v) => patch({ advantageCreative: v })}
                    label="Advantage+ Creative"
                    desc="Auto enhancements per placement."
                  />
                </div>
              </SectionRow>

              {/* Placements — collapsed */}
              <div className="px-5 py-3.5">
                <AdvancedReveal label="Placements">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Placement type</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["advantage", "manual"] as const).map((mode) => {
                        const isAdv = mode === "advantage";
                        return (
                          <button
                            key={mode}
                            type="button"
                            disabled={asc}
                            onClick={() => {
                              /* placements stored in targetingTemplate settings */
                            }}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              isAdv
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-accent",
                              asc && "cursor-not-allowed opacity-40",
                            )}
                          >
                            {mode === "advantage" ? "Advantage+ (automatic)" : "Manual"}
                          </button>
                        );
                      })}
                    </div>
                    {asc && (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Locked to Advantage+ when ASC is active.
                      </p>
                    )}
                  </div>
                </AdvancedReveal>
              </div>

              {/* Compliance subsection — Special Ad Category */}
              {policy.specialAdCategories.visibility !== "hidden" && (
                <div className="px-5 py-4">
                  {/* Compliance header */}
                  <div className="mb-3 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Compliance
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Special ad category</Label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIAL_CATEGORIES.map((c) => {
                        const on = plan.specialAdCategories.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleSpecial(c.id)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              on
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-accent",
                            )}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                    {special && (
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-amber-600">
                        <Lock className="h-3 w-3" /> Age, gender and lookalikes locked for
                        compliance.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {tpl && (
          <TemplateModal
            open={editOpen}
            onOpenChange={setEditOpen}
            template={tpl}
            specialActive={special}
            flow={flow}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
