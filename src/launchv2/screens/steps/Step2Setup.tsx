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
} from "../../reducer";
import {
  BID_LABELS,
  SPECIAL_CATEGORIES,
  TARGETING_TEMPLATES,
  getTemplate,
} from "../../data";
import type { AttributionWindow, BidStrategy, SpecialAdCategory } from "../../types";
import { AccountsPages } from "./setup/AccountsPages";
import { TemplateModal } from "./setup/TemplateModal";

/* ---- small shared bits ---- */

function SectionCard({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
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
        {/* ── 1 · Ad accounts & pages ───────────────────────────── */}
        <SectionCard n={1} title="Ad accounts & pages" hint="pick accounts, then destination pages">
          <AccountsPages plan={plan} targets={plan.targets} onChange={flow.setTargets} />
        </SectionCard>

        {/* ── 2 · Budget & bidding ──────────────────────────────── */}
        <SectionCard n={2} title="Budget & bidding">
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

          {/* Advanced: bid strategy + attribution */}
          <AdvancedReveal label="Advanced — bid strategy, attribution">
            {/* bid strategy — gated by allowedBidStrategies */}
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

            {/* attribution (light placeholder — kept under advanced) */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                Attribution setting
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>Conversion window used to credit results.</TooltipContent>
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
                  <SelectItem value="7d_click_1d_view">7-day click + 1-day view</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AdvancedReveal>

          {needsPixel && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
              <Info className="h-3 w-3" /> This optimization needs a pixel + conversion event — set it on the
              ad set.
            </p>
          )}
        </SectionCard>

        {/* ── 3 · Audience ──────────────────────────────────────── */}
        <SectionCard n={3} title="Audience" hint="targeting template">
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
