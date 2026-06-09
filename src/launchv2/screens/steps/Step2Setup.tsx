/**
 * Step 2 — Setup. Three stacked sections (matrix §6c):
 *   1. Ad accounts & pages (two-step destination picker + live 250-cap meter)
 *   2. Budget & bidding (surfaced budget + CBO/ABO label; ABO/CBO toggle,
 *      bid strategy + attribution under an Advanced reveal; Advantage+ toggle)
 *   3. Audience (targeting-template dropdown + inline summary + 2 quick-toggles
 *      + Edit modal; special ad category compliance row)
 *
 * The reducer prefilled most of this, so the screen reads LIGHT: surfaced
 * essentials with the rest tucked behind per-field Advanced reveals. Every
 * field's surface (show / advanced / hidden / locked) is decided by
 * fieldPolicy(plan).
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
import type { AttributionWindow, BidStrategy, DestinationType, OptimizationGoal, SpecialAdCategory } from "../../types";
import { AccountsPages } from "./setup/AccountsPages";
import { TemplateModal } from "./setup/TemplateModal";
import { SetupTemplateBar, SetupSectionChip } from "./setup/SetupTemplateBar";

/* ---- small shared bits ---- */

function SectionCard({
  n,
  title,
  hint,
  headerBadge,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  /** Optional badge rendered next to the section title (e.g. template chip). */
  headerBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {n}
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {hint && <span className="text-xs text-muted-foreground">· {hint}</span>}
          {headerBadge && <span className="ml-1">{headerBadge}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function AdvancedReveal({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
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

function Toggle({
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
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {icon}
          {label}
        </Label>
        {desc && <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>}
        {locked && <LockNote reason={reason} />}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={locked} />
    </div>
  );
}

/* ---- screen ---- */

export default function Step2Setup({ flow }: { flow: UseFlowV2 }) {
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
      <div className="space-y-4">
        {/* ── Setup template header bar ─────────────────────────── */}
        <SetupTemplateBar flow={flow} />

        {/* ── 1 · Ad accounts & pages ───────────────────────────── */}
        <SectionCard
          n={1}
          title="Ad accounts & pages"
          hint="pick accounts, then destination pages"
          headerBadge={<SetupSectionChip flow={flow} section="destinations" />}
        >
          <AccountsPages plan={plan} targets={plan.targets} onChange={flow.setTargets} />
        </SectionCard>

        {/* ── 2 · Campaign ──────────────────────────────────────── */}
        <SectionCard
          n={2}
          title="Campaign"
          headerBadge={<SetupSectionChip flow={flow} section="campaign" />}
        >
          <div className="flex flex-wrap items-end gap-4">
            {/* budget amount — surfaced */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {plan.budgetMode === "CBO" ? "Daily campaign budget" : "Daily budget / ad set"}
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-muted-foreground">{currency}</span>
                <Input
                  type="number"
                  min={1}
                  value={plan.budgetAmount}
                  onChange={(e) => patch({ budgetAmount: Number(e.target.value) || 0 })}
                  className="h-9 w-32 font-mono tabular-nums"
                />
              </div>
            </div>

            {/* CBO/ABO toggle — primary altitude, next to budget */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                Campaign Budget Optimization
                {policy.budgetMode.locked && <Lock className="h-3 w-3" />}
              </Label>
              <div className="flex h-9 items-center gap-2 rounded-2xl border border-border bg-card px-3">
                <Switch
                  checked={plan.budgetMode === "CBO"}
                  onCheckedChange={(v) => patch({ budgetMode: v ? "CBO" : "ABO" })}
                  disabled={policy.budgetMode.locked}
                />
                <span className="text-sm font-medium text-foreground">
                  {plan.budgetMode === "CBO" ? "Campaign (CBO)" : "Ad set (ABO)"}
                </span>
              </div>
              {policy.budgetMode.locked && <LockNote reason={policy.budgetMode.reason} />}
            </div>
          </div>

          {/* Advantage+ toggle — surfaced */}
          <Toggle
            checked={plan.advantagePlus}
            onCheckedChange={(v) => patch({ advantagePlus: v })}
            label="Advantage+"
            desc="Recommended — let Meta optimize budget, audience and placements."
            icon={<Sparkles className="h-4 w-4 text-primary" />}
          />
          {asc && (
            <p className="flex items-center gap-1.5 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> Advantage+ active — campaign budget, broad audience and auto
              placements applied.
            </p>
          )}

          {/* A/B Test toggle */}
          <Toggle
            checked={plan.abTest}
            onCheckedChange={(v) => patch({ abTest: v })}
            label="A/B Test"
            desc="Meta runs the test on their side — no extra inputs required."
          />

          {/* Advantage+ Catalogue toggle */}
          <Toggle
            checked={plan.catalogueToggle}
            onCheckedChange={(v) => {
              patch({ catalogueToggle: v });
              // Pre-select Catalogue format in Step 3 when toggled on
              if (v && plan.objective) {
                patch({ catalogueToggle: v, format: "dpa" });
              } else if (!v && plan.format === "dpa") {
                patch({ catalogueToggle: v, format: null });
              }
            }}
            label="Advantage+ Catalogue"
            desc="Pre-selects Catalogue (DPA) in the Ad step."
          />

          {/* Advanced: bid strategy only */}
          <AdvancedReveal label="Advanced — bid strategy">
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
                    <span className="font-mono text-sm text-muted-foreground">{currency}</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Cap / goal"
                      value={plan.bidValue ?? ""}
                      onChange={(e) =>
                        patch({ bidValue: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="h-9 w-32 font-mono tabular-nums"
                    />
                  </div>
                )}
              </div>
            )}
          </AdvancedReveal>
        </SectionCard>

        {/* ── 3 · Ad set ────────────────────────────────────────── */}
        <SectionCard
          n={3}
          title="Ad set"
          headerBadge={<SetupSectionChip flow={flow} section="adset" />}
        >
          {/* Conversion location — only shown when objective supports it */}
          {plan.objective && showsLocationPicker(plan.objective) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Conversion location</Label>
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
                      {d.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Performance goal */}
          {plan.objective && plan.destinationType && (() => {
            const c = cascade(plan.objective, plan.destinationType);
            return (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Performance goal
                  {c.lockedGoal && <Lock className="h-3 w-3" />}
                </Label>
                {c.lockedGoal ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {c.lockedGoal.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase())}
                    <span className="ml-1 text-[10px] opacity-60">(only option for this destination)</span>
                  </p>
                ) : (
                  <Select
                    value={plan.optimizationGoal ?? undefined}
                    onValueChange={(v) => patch({ optimizationGoal: v as OptimizationGoal })}
                  >
                    <SelectTrigger className="h-9 w-full max-w-xs">
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {c.optimizationGoals.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })()}

          {/* Pixel — shown when required */}
          {needsPixel && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3 text-amber-500" />
                Pixel / Dataset required for this goal
              </Label>
              <p className="text-[11px] text-amber-600">
                Select accounts that have a pixel connected — or switch to a different optimization goal.
              </p>
            </div>
          )}

          {/* Attribution */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs text-muted-foreground">
              Attribution window
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>Conversion window used to credit results. 28-day view removed Jan 2026.</TooltipContent>
              </Tooltip>
            </Label>
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
                <SelectItem value="7d_click_1d_view">7-day click + 1-day engage-through + 1-day view (default)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {/* ── 4 · Audience ──────────────────────────────────────── */}
        <SectionCard
          n={4}
          title="Audience"
          hint="targeting template"
          headerBadge={<SetupSectionChip flow={flow} section="audience" />}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Targeting template</Label>
              <Select
                value={plan.targetingTemplateId ?? undefined}
                onValueChange={(v) => patch({ targetingTemplateId: v })}
              >
                <SelectTrigger className="h-9 w-full">
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
            </div>
            {tpl && (
              <Button variant="outline" size="sm" className="h-9" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>

          {/* inline summary chips */}
          {tpl && (
            <div className="flex flex-wrap gap-1.5">
              {tpl.summary.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* 2 quick-toggles */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Toggle
              checked={plan.advantageAudience}
              onCheckedChange={(v) => patch({ advantageAudience: v })}
              label="Advantage+ Audience"
              desc="Start broad; Meta finds buyers."
              locked={policy.advantageAudience.locked}
              reason={policy.advantageAudience.reason}
            />
            <Toggle
              checked={plan.advantageCreative}
              onCheckedChange={(v) => patch({ advantageCreative: v })}
              label="Advantage+ Creative"
              desc="Auto creative enhancements per placement."
            />
          </div>

          {/* Placements */}
          <AdvancedReveal label="Placements">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Placement type</Label>
              <div className="flex flex-wrap gap-2">
                {(["advantage", "manual"] as const).map((mode) => {
                  const on = asc ? mode === "advantage" : (mode === "advantage");
                  const isAdv = mode === "advantage";
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={asc}
                      onClick={() => {/* placements stored in targetingTemplate settings */}}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        isAdv
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {mode === "advantage" ? "Advantage+ (automatic)" : "Manual"}
                    </button>
                  );
                })}
              </div>
              {asc && <p className="text-[11px] text-muted-foreground">Locked to Advantage+ when ASC is active.</p>}
            </div>
          </AdvancedReveal>

          <Separator />

          {/* Special ad category — compliance row */}
          {policy.specialAdCategories.visibility !== "hidden" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> Special ad category
              </Label>
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
                <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
                  <Lock className="h-3 w-3" /> Age, gender and lookalikes are locked for compliance.
                </p>
              )}
            </div>
          )}
        </SectionCard>

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
