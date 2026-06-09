/**
 * Step 2 — Setup V2 (sidebar-nav redesign).
 *
 * Layout: left-sidebar section nav (Mac System Prefs / Stripe settings style)
 *         + right content panel showing only the active section's fields.
 *
 * This is structurally and visually distinct from V1's stacked-SectionCards
 * approach. V1 = sequential scroll through 4 cards. V2 = click-to-jump with
 * a persistent nav that shows completion state at a glance.
 *
 * Sections:
 *   destinations → AccountsPages
 *   campaign     → Budget + CBO/ABO cluster; Advantage+; Advanced group
 *   adset        → Conversion location + Performance goal + Attribution
 *   audience     → Targeting template + Advantage toggles + Placements + SAC
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Building2,
  Target,
  Layers,
  Users,
  ChevronDown,
  Lock,
  Sparkles,
  Pencil,
  Shield,
  Info,
} from "lucide-react";
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
import { SetupTemplateBar, SetupSectionChip } from "./setup/SetupTemplateBar";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SectionId = "destinations" | "campaign" | "adset" | "audience";

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                               */
/* ------------------------------------------------------------------ */

function LockNote({ reason }: { reason?: string }) {
  if (!reason) return null;
  return (
    <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
      <Lock className="h-3 w-3 shrink-0" /> {reason}
    </span>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-3">
      {children}
    </div>
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
        className="shrink-0 mt-0.5"
      />
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
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------ */
/*  Section panel header                                               */
/* ------------------------------------------------------------------ */

function PanelHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h2 className="text-[18px] font-semibold text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {badge && <div className="shrink-0 pt-0.5">{badge}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section panels                                                      */
/* ------------------------------------------------------------------ */

function DestinationsPanel({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  return (
    <div className="space-y-4">
      <PanelHeader
        title="Destinations"
        description="Which ad accounts, pages and pixels will run these ads"
        badge={<SetupSectionChip flow={flow} section="destinations" />}
      />
      <AccountsPages plan={plan} targets={plan.targets} onChange={flow.setTargets} />
    </div>
  );
}

function CampaignPanel({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const policy = fieldPolicy(plan);
  const asc = isAdvantagePlus(plan);
  const currency = plan.targets[0]?.currency ?? "USD";
  const bidOptions = plan.objective
    ? allowedBidStrategies(plan.objective, plan.optimizationGoal)
    : (["LOWEST_COST_WITHOUT_CAP"] as BidStrategy[]);

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Campaign"
        description="Budget, bidding strategy and campaign-level settings"
        badge={<SetupSectionChip flow={flow} section="campaign" />}
      />

      {/* Budget + CBO/ABO group */}
      <FieldGroup>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            {plan.budgetMode === "CBO" ? "Daily campaign budget" : "Daily budget / ad set"}
          </Label>
          <div className="flex flex-wrap items-center gap-3">
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

            {/* CBO / ABO segmented pill */}
            <div className="flex items-center gap-0 rounded-full border border-border bg-muted/50 p-0.5">
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
              ? "Campaign-level — Meta distributes across ad sets."
              : "Ad-set-level — you control spend per ad set."}
          </p>
        </div>
      </FieldGroup>

      {/* Advantage+ toggle */}
      <FieldGroup>
        <InlineToggle
          checked={plan.advantagePlus}
          onCheckedChange={(v) => patch({ advantagePlus: v })}
          label="Advantage+"
          desc="Let Meta optimize budget, audience and placements automatically."
          icon={<Sparkles className="h-4 w-4 text-primary" />}
        />
        {asc && (
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-primary">
            <Sparkles className="h-3 w-3 shrink-0" />
            Active — campaign budget, broad audience and auto placements applied.
          </p>
        )}
      </FieldGroup>

      {/* Advanced: A/B Test + Catalogue + Bid strategy */}
      <AdvancedReveal label="Advanced — A/B test, catalogue &amp; bid strategy">
        <FieldGroup>
          <InlineToggle
            checked={plan.abTest}
            onCheckedChange={(v) => patch({ abTest: v })}
            label="A/B Test"
            desc="Meta runs the experiment — no extra inputs required."
          />
          <div className="border-t border-border/50 pt-3">
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
          </div>
          {policy.bidStrategy.visibility !== "hidden" && (
            <div className="border-t border-border/50 pt-3 space-y-1.5">
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
                      patch({
                        bidValue: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="h-9 w-32 font-mono tabular-nums"
                  />
                </div>
              )}
            </div>
          )}
        </FieldGroup>
      </AdvancedReveal>
    </div>
  );
}

function AdSetPanel({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const needsPixel = requiresPixel(plan) && plan.targets.some((t) => !t.pixelId);

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Ad Set"
        description="Placement, optimization and delivery settings"
        badge={<SetupSectionChip flow={flow} section="adset" />}
      />

      {/* Conversion location */}
      {plan.objective && showsLocationPicker(plan.objective) && (
        <FieldGroup>
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
        </FieldGroup>
      )}

      {/* Performance goal */}
      {plan.objective && plan.destinationType && (() => {
        const c = cascade(plan.objective, plan.destinationType);
        return (
          <FieldGroup>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                Performance goal
                {c.lockedGoal && <Lock className="h-3 w-3" />}
              </Label>
              {c.lockedGoal ? (
                <div className="space-y-0.5">
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
          </FieldGroup>
        );
      })()}

      {/* Pixel warning */}
      {needsPixel && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="flex items-center gap-1.5 font-mono text-xs text-amber-600">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Select accounts with a pixel connected — or switch to a different optimization goal.
          </p>
        </div>
      )}

      {/* Attribution */}
      <FieldGroup>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Attribution window
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="font-mono text-xs max-w-64">
                Conversion window used to credit results. 28-day view removed Jan 2026.
                Full label: "7-day click + 1-day engage-through + 1-day view."
              </TooltipContent>
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
              <SelectItem value="7d_click_1d_view">7-day click + 1-day view (default)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FieldGroup>
    </div>
  );
}

function AudiencePanel({
  flow,
  onEditTemplate,
}: {
  flow: UseFlowV2;
  onEditTemplate: () => void;
}) {
  const { plan, patch } = flow;
  const policy = fieldPolicy(plan);
  const asc = isAdvantagePlus(plan);
  const special = specialCategoryActive(plan);
  const tpl = getTemplate(plan.targetingTemplateId);

  const toggleSpecial = (id: SpecialAdCategory) => {
    const on = plan.specialAdCategories.includes(id);
    patch({
      specialAdCategories: on
        ? plan.specialAdCategories.filter((c) => c !== id)
        : [...plan.specialAdCategories, id],
    });
  };

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Audience"
        description="Who should see your ads"
        badge={<SetupSectionChip flow={flow} section="audience" />}
      />

      {/* Targeting template */}
      <FieldGroup>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Targeting template</Label>
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
                onClick={onEditTemplate}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
          {tpl && (
            <div className="flex flex-wrap gap-1.5 pt-1">
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
        </div>
      </FieldGroup>

      {/* Advantage+ audience toggles */}
      <FieldGroup>
        <div className="space-y-3">
          <InlineToggle
            checked={plan.advantageAudience}
            onCheckedChange={(v) => patch({ advantageAudience: v })}
            label="Advantage+ Audience"
            desc="Start broad — Meta finds buyers."
            locked={policy.advantageAudience.locked}
            reason={policy.advantageAudience.reason}
          />
          <div className="border-t border-border/50 pt-3">
            <InlineToggle
              checked={plan.advantageCreative}
              onCheckedChange={(v) => patch({ advantageCreative: v })}
              label="Advantage+ Creative"
              desc="Auto creative enhancements per placement."
            />
          </div>
        </div>
      </FieldGroup>

      {/* Placements — advanced */}
      <AdvancedReveal label="Placements">
        <FieldGroup>
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
        </FieldGroup>
      </AdvancedReveal>

      {/* Special ad category — compliance */}
      {policy.specialAdCategories.visibility !== "hidden" && (
        <div className="border-t border-border/50 pt-3 mt-3 space-y-3">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Compliance
            </span>
          </div>
          <FieldGroup>
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
                  <Lock className="h-3 w-3 shrink-0" /> Age, gender and lookalikes locked for
                  compliance.
                </p>
              )}
            </div>
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Left sidebar nav                                                    */
/* ------------------------------------------------------------------ */

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  done: boolean;
}

function SidebarNav({
  sections,
  active,
  onSelect,
}: {
  sections: NavSection[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav className="w-[180px] shrink-0 border-r border-border bg-muted/20 py-4 flex flex-col gap-1">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-left w-full transition-colors mx-1",
            active === s.id
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
          style={{ width: "calc(100% - 8px)" }}
        >
          <span className="shrink-0">{s.icon}</span>
          <span className="flex-1 truncate">{s.label}</span>
          {s.done && (
            <span
              className={cn(
                "ml-auto h-1.5 w-1.5 rounded-full shrink-0",
                active === s.id ? "bg-primary" : "bg-primary/60",
              )}
            />
          )}
        </button>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function Step2SetupV2({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const [activeSection, setActiveSection] = useState<SectionId>("destinations");
  const [editOpen, setEditOpen] = useState(false);

  const tpl = getTemplate(plan.targetingTemplateId);
  const special = specialCategoryActive(plan);

  /* Completion detection */
  const hasDestinations = plan.targets.length > 0;
  const hasCampaign = !!plan.objective && !!plan.budgetAmount;
  const hasAdSet = !!plan.destinationType || !!plan.optimizationGoal;
  const hasAudience = !!plan.targetingTemplateId || plan.advantageAudience;

  const sections: NavSection[] = [
    {
      id: "destinations",
      label: "Destinations",
      icon: <Building2 className="h-4 w-4" />,
      done: hasDestinations,
    },
    {
      id: "campaign",
      label: "Campaign",
      icon: <Target className="h-4 w-4" />,
      done: hasCampaign,
    },
    {
      id: "adset",
      label: "Ad Set",
      icon: <Layers className="h-4 w-4" />,
      done: hasAdSet,
    },
    {
      id: "audience",
      label: "Audience",
      icon: <Users className="h-4 w-4" />,
      done: hasAudience,
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        data-screen="lv2-step2-setup-v2"
        className="h-full min-h-0 flex flex-col"
      >
        {/* ── Template bar — full width, top ─────────────────────── */}
        <div className="shrink-0 px-0 pb-3">
          <SetupTemplateBar flow={flow} />
        </div>

        {/* ── Sidebar + content panel ─────────────────────────────── */}
        <div className="flex flex-1 min-h-0 rounded-2xl border border-border overflow-hidden">
          {/* Left: section nav */}
          <SidebarNav
            sections={sections}
            active={activeSection}
            onSelect={setActiveSection}
          />

          {/* Right: active section content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeSection === "destinations" && (
              <DestinationsPanel flow={flow} />
            )}
            {activeSection === "campaign" && (
              <CampaignPanel flow={flow} />
            )}
            {activeSection === "adset" && (
              <AdSetPanel flow={flow} />
            )}
            {activeSection === "audience" && (
              <AudiencePanel flow={flow} onEditTemplate={() => setEditOpen(true)} />
            )}
          </div>
        </div>

        {/* Template edit modal */}
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
