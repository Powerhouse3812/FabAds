/**
 * Step 2 — Setup (V1 corrected). Three stacked sections (matrix §6c):
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
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Lock,
  Info,
  Shield,
  DollarSign,
  Target,
  FlaskConical,
  Tag,
  Sparkles,
} from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { UseFlowV2 } from "../../state/useFlowV2";
import {
  fieldPolicy,
  allowedBidStrategies,
  specialCategoryActive,
  requiresPixel,
  cascade,
  showsLocationPicker,
  DESTINATIONS_BY_OBJECTIVE,
} from "../../reducer";
import {
  getTemplate,
} from "../../data";
import type { AttributionWindow, BidStrategy, DestinationType, OptimizationGoal } from "../../types";
import { buildIssues } from "../review/reviewModel";
import { postModeActive } from "../../deriveV2";
import { AccountsPages } from "./setup/AccountsPages";
import { SetupTemplateBar, SetupSectionChip } from "./setup/SetupTemplateBar";
import BidStrategyRow from "./setup/BidStrategyRow";
// SpecialAdCategoryField moved to AccountsPages (regulated toggle at top of §1, lock #18).
import CopyFromRunning, {
  runningCampaignItems,
  applyRunningCampaign,
  runningAdSetItems,
  applyRunningAdSet,
} from "./shared/CopyFromRunning";
import TargetingTemplateSection from "./audience/TargetingTemplateSection";
import SpecialAdCountryPicker from "./setup/SpecialAdCountryPicker";
import { NomenclatureBuilder } from "../review/NomenclatureBuilder";
import RecentLaunchModal from "./shared/RecentLaunchModal";

/* ---- naming pattern input (campaign / adset level) ---- */

function NamingPatternInput({
  label,
  value,
  onChange,
  tokens,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tokens: { key: string; desc: string }[];
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const insertToken = (token: string) => {
    const el = inputRef.current;
    if (!el) { onChange(value + token); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.setSelectionRange(start + token.length, start + token.length);
      el.focus();
    });
  };
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium text-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {tokens.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.desc}
            onClick={() => insertToken(t.key)}
            className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 font-mono text-[11px] cursor-pointer hover:bg-primary/20 transition-colors"
          >
            {t.key}
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 min-w-0 w-full rounded-2xl border border-border bg-background px-3 font-mono text-[12px] outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

/* ---- small shared bits ---- */

function StepSection({
  index,
  title,
  description,
  badge,
  complete,
  isLast,
  sectionRef,
  children,
}: {
  index: number;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  complete: boolean;
  isLast: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={sectionRef} className="flex gap-3 scroll-mt-4">
      {/* Left spine */}
      <div className="flex flex-col items-center pt-1.5">
        <span
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-white transition-colors",
            complete
              ? "bg-primary text-primary-foreground"
              : "border-border bg-muted",
          )}
        >
          {complete && <Check className="h-2.5 w-2.5" />}
        </span>
        {!isLast && <span className={cn("mt-1 w-px flex-1 transition-colors", complete ? "bg-primary/40" : "bg-border")} />}
      </div>

      {/* Right content */}
      <div className="min-w-0 flex-1 pb-8">
        <div className="flex w-full items-start justify-between gap-2 text-left">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-semibold leading-[18px] text-foreground">{title}</span>
              {badge}
            </span>
            {description && (
              <span className="mt-0.5 block text-[13px] leading-[18px] text-muted-foreground/80">{description}</span>
            )}
          </span>
        </div>

        <div className="space-y-4 pt-4">{children}</div>
      </div>
    </div>
  );
}

/* Overview moved to LaunchV2Flow breadcrumb strip — local sticky card removed. */

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

/** Section §3 sub-group with ▸ chevron — surfaced (not Advanced). */
function Subsection({
  label,
  icon,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  trailing,
  children,
}: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  complete?: boolean;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function handleToggle() {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header — click to toggle */}
      <div className="flex w-full items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/20">
        <button
          type="button"
          onClick={handleToggle}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          {icon}
          <span className="flex items-baseline gap-1.5 text-[13px] font-semibold text-foreground">{label}</span>
        </button>
        {trailing}
      </div>

      {/* Body */}
      {open && (
        <div className="space-y-4 border-t border-border/50 px-3 pb-3 pt-3">
          {children}
        </div>
      )}
    </div>
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
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked || undefined}
      onClick={() => !locked && onCheckedChange(!checked)}
      onKeyDown={(e) => { if (!locked && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onCheckedChange(!checked); } }}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:border-foreground/20 hover:bg-muted/20",
        locked && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="min-w-0">
        <Label className={cn("flex cursor-pointer items-center gap-1.5 text-sm font-medium", checked ? "text-foreground" : "text-foreground")}>
          {icon}
          {label}
        </Label>
        {desc && <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>}
        {locked && <LockNote reason={reason} />}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={locked}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}


/* CustomAudienceUpload lives in AccountsPages now; removed local dead copy. */

/* Inline placement checkbox-tree (PlacementGroup / PlacementsInline) removed —
   placements now live inside the Edit Targeting modal (TargetingTemplateModal.tsx). */

/* ---- screen ---- */

export default function Step2Setup({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;

  // Inline issue detection — drives warning blocks in each section
  const issues = buildIssues(plan);
  const capErrors = issues.filter((i) => i.id.startsWith("cap:"));
  const campaignWarnings = issues.filter((i) =>
    ["warn:CBO_70", "warn:ADSET_200", "warn:FRAGMENT"].includes(i.id),
  );

  const policy = fieldPolicy(plan);
  const special = specialCategoryActive(plan);
  const needsPixel = requiresPixel(plan) && plan.targets.some((t) => !t.pixelId);
  const currency = plan.targets[0]?.currency ?? "USD";

  // Advantage+ Creative is incompatible with existing-post ads on Meta's API —
  // lock the toggle and force it off whenever post-mode is active for any account.
  const postActive = postModeActive(plan);
  useEffect(() => {
    if (postActive && plan.advantageCreative) {
      patch({ advantageCreative: false });
    }
  }, [postActive, plan.advantageCreative, patch]);

  const bidOptions = plan.objective
    ? allowedBidStrategies(plan.objective, plan.optimizationGoal)
    : (["LOWEST_COST_WITHOUT_CAP"] as BidStrategy[]);

  const tpl = getTemplate(plan.targetingTemplateId);

  // ── Ant-style vertical Steps: scrollspy + expand/collapse ──────────────
  const sectionRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const [recentLaunchOpen, setRecentLaunchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  // §3 sub-sections — multi-open (Set)
  const [s3Sub, setS3Sub] = useState<Set<string>>(() => new Set(["optimization", "audience"]));

  // active section = manual override (if set) else the scroll-driven one
  const expandedIndex = manualIndex ?? activeIndex;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const idx = sectionRefs.findIndex((r) => r.current === visible[0].target);
          if (idx !== -1) {
            setActiveIndex(idx);
            setManualIndex(null);
          }
        }
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sectionRefs.forEach((r) => r.current && observer.observe(r.current));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSection = (i: number) => {
    setManualIndex(i);
    sectionRefs[i].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Per-section completion + summary (derived from plan) ───────────────
  const humanize = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const accountCount = new Set(plan.targets.map((t) => t.accountId)).size;
  const pageCount = plan.targets.length;
  const sectionMeta: { label: string; complete: boolean; summary: string }[] = [
    {
      label: "Accounts",
      complete: plan.targets.length > 0,
      summary:
        plan.targets.length > 0
          ? `${accountCount} acct${accountCount === 1 ? "" : "s"} · ${pageCount} page${pageCount === 1 ? "" : "s"}`
          : "Not set yet",
    },
    {
      label: "Campaign",
      complete: plan.budgetAmount > 0,
      summary:
        plan.budgetAmount > 0
          ? `${currency} ${plan.budgetAmount.toLocaleString("en-IN")}/day · ${plan.budgetMode}${plan.advantagePlus ? " · A+" : ""}`
          : "Not set yet",
    },
    {
      label: "Ad set & Audience",
      complete: (!!plan.optimizationGoal || !!plan.destinationType) || !!plan.targetingTemplateId,
      summary: tpl
        ? tpl.name
        : plan.optimizationGoal
          ? humanize(plan.optimizationGoal)
          : "Defaults applied",
    },
    {
      label: "Ad",
      complete: true,
      summary: plan.advantageCreative ? "Advantage+ creative on" : "Standard creative",
    },
  ];

  // Non-USD account → show single muted FX hint (currency lock #5)
  const hasNonUsdAccount = plan.targets.some((t) => t.currency && t.currency !== "USD");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── Fill from recent launch — top shortcut ─────────────── */}
        <button
          type="button"
          onClick={() => setRecentLaunchOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#8FB821]/40 bg-[#F5FBE2]/60 px-4 py-2.5 text-[12px] font-semibold text-[#5B7611] transition-colors hover:bg-[#F5FBE2] hover:border-[#8FB821]/70 dark:border-[#8FB821]/30 dark:bg-[#1D2A09]/60 dark:text-[#C3E165] dark:hover:bg-[#1D2A09]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1v4.5m0 0L5 3.5M7 5.5l2-2M2.5 9A4.5 4.5 0 0 0 7 13a4.5 4.5 0 0 0 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Fill from recent launch
        </button>

        {/* ── Ant-style vertical Steps spine ────────────────────── */}
        <div className="space-y-0">
        {/* ── 1 · Ad accounts & pages ───────────────────────────── */}
        <StepSection
          index={0}
          title="Ad accounts & Pages"
          description="Pick ad accounts and destination pages"
          badge={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecentLaunchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 1v4.5m0 0L5 3.5M7 5.5l2-2M2.5 9A4.5 4.5 0 0 0 7 13a4.5 4.5 0 0 0 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Recent launch
              </button>
              <SetupSectionChip flow={flow} section="destinations" />
            </div>
          }
          complete={sectionMeta[0].complete}
          isLast={false}
          sectionRef={sectionRefs[0]}
        >
          <AccountsPages plan={plan} targets={plan.targets} onChange={flow.setTargets} flow={flow} onPatch={patch} />

          {/* ── Cap-check error warnings ── */}
          {capErrors.length > 0 && (
            <div className="space-y-2">
              {capErrors.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{issue.title}</p>
                    <p className="text-[11px] text-muted-foreground">{issue.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </StepSection>

        {/* ── 2 · Campaign ──────────────────────────────────────── */}
        <StepSection
          index={1}
          title="Campaign"
          description="Budget and delivery"
          badge={
            <div className="flex items-center gap-2">
              <CopyFromRunning
                triggerLabel="Copy from running campaign"
                items={runningCampaignItems()}
                onPick={(id) => applyRunningCampaign(flow, id)}
                pickerType="campaign"
              />
              <SetupSectionChip flow={flow} section="campaign" />
            </div>
          }
          complete={sectionMeta[1].complete}
          isLast={false}
          sectionRef={sectionRefs[1]}
        >
          {/* Budget & Bid — two cards side by side (Figma: Campaign Budget & Bid Optimization | Bid strategy) */}
          <div className={cn("grid gap-4", policy.bidStrategy.visibility !== "hidden" ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
            {/* Left card — Campaign Budget & Bid Optimization */}
            <div className="space-y-3 rounded-2xl border border-border bg-card px-3.5 py-3">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[13px] font-medium text-foreground">Campaign Budget & Bid Optimization</p>
              </div>

              {/* CBO/ABO pills */}
              <div className="flex flex-wrap items-center gap-2">
                {(["ABO", "CBO"] as const).map((mode) => (
                  <Tooltip key={mode}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={policy.budgetMode.locked}
                        onClick={() => patch({ budgetMode: mode })}
                        className={cn(
                          "fab-focus rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                          plan.budgetMode === mode
                            ? "border border-[#8FB821] bg-[#8FB821]/10 text-[#5B7611] dark:text-[#C3E165]"
                            : "border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          policy.budgetMode.locked && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {mode}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {mode === "CBO"
                        ? "Campaign Budget Optimization — Meta splits budget across ad sets."
                        : "Ad Set Budget Optimization — you set a budget per ad set."}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {policy.budgetMode.locked && <LockNote reason={policy.budgetMode.reason} />}
              </div>

              {/* Budget period + amount */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-[12px] font-normal text-foreground">
                  {plan.budgetPeriod === "lifetime" ? "Lifetime" : "Daily"} budget / {plan.budgetMode === "ABO" ? "ad set" : "campaign"}
                  {policy.budgetMode.locked && <Lock className="h-3 w-3" />}
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={plan.budgetPeriod ?? "daily"}
                    onValueChange={(v) => patch({ budgetPeriod: v as "daily" | "lifetime" })}
                  >
                    <SelectTrigger className="h-8 w-[92px] shrink-0 rounded-full text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-border bg-background pr-3">
                    <span className="h-full shrink-0 border-r border-border bg-muted/30 px-2.5 font-mono text-[11px] leading-8 text-muted-foreground">
                      {currency}
                    </span>
                    <span className="pl-2 font-mono text-[12px] text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="200"
                      value={plan.budgetAmount || ""}
                      onChange={(e) => patch({ budgetAmount: Number(e.target.value) || 0 })}
                      className="h-full flex-1 border-none bg-transparent px-1 font-mono tabular-nums text-[12px] shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* N× projection — shown when 2+ accounts selected */}
                {accountCount >= 2 && plan.budgetAmount > 0 && (
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Running in {accountCount} accounts → $
                    <span className="tabular-nums text-foreground">{plan.budgetAmount.toLocaleString("en-US")}</span>
                    {" × "}
                    <span className="tabular-nums">{accountCount}</span>
                    {" = $"}
                    <span className="tabular-nums text-foreground">
                      {(plan.budgetAmount * accountCount).toLocaleString("en-US")}
                    </span>
                    /{plan.budgetPeriod === "lifetime" ? "lifetime" : "day"} total
                  </p>
                )}

                {/* Currency hint — only when a selected account is non-USD */}
                {hasNonUsdAccount && (
                  <p className="text-[11px] text-muted-foreground">
                    Budget in $. Meta charges in local currency at runtime FX.
                  </p>
                )}
              </div>
            </div>

            {/* Right card — Bid strategy */}
            {policy.bidStrategy.visibility !== "hidden" && (
              <div className="space-y-3 rounded-2xl border border-border bg-card px-3.5 py-3">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[13px] font-medium text-foreground">Bid strategy</p>
                </div>
                <BidStrategyRow
                  objective={plan.objective}
                  optimizationGoal={plan.optimizationGoal}
                  bidStrategy={plan.bidStrategy}
                  bidValue={plan.bidValue ?? null}
                  onChangeBidStrategy={(v) => patch({ bidStrategy: v })}
                  onChangeBidValue={(v) => patch({ bidValue: v ?? undefined })}
                />
              </div>
            )}
          </div>

          {/* ── Campaign soft warnings ── */}
          {campaignWarnings.length > 0 && (
            <div className="space-y-2">
              {campaignWarnings.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">{issue.title}</p>
                    <p className="text-[11px] text-muted-foreground">{issue.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* A/B Test — slim inline toggle */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                A/B Test
              </p>
              <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                Meta runs the test on their side — no extra inputs required.
              </p>
            </div>
            <Switch
              checked={plan.abTest}
              onCheckedChange={(v) => patch({ abTest: v })}
            />
          </div>

          {/* ── Regulated category? (moved up from Ad set — matches Figma IA) ── */}
          <div className="space-y-4 rounded-2xl border border-border bg-card px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-start gap-2.5">
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Regulated category?</p>
                  <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                    Credit, employment, housing, or social/political. Off by default — turn on only if it applies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={plan.specialAdDeclared}
                onClick={() => patch({ specialAdDeclared: !plan.specialAdDeclared })}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#8FB821]/30",
                  plan.specialAdDeclared
                    ? "border-[#8FB821] bg-[#8FB821]"
                    : "border-border bg-muted"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  plan.specialAdDeclared ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>

            {plan.specialAdDeclared && (
              <div className="space-y-4">
                {/* Category type chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(["FINANCIAL_PRODUCTS_SERVICES", "EMPLOYMENT", "HOUSING", "ISSUES_ELECTIONS_POLITICS"] as const).map((cat) => {
                    const isSelected = plan.specialAdCategories?.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = plan.specialAdCategories ?? [];
                          const next = isSelected
                            ? current.filter((c) => c !== cat)
                            : [...current, cat];
                          patch({ specialAdCategories: next });
                        }}
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors",
                          isSelected
                            ? "border-[#8FB821] bg-[#1D2A09] text-[#C3E165]"
                            : "border-border bg-muted text-muted-foreground hover:border-[#8FB821]/50"
                        )}
                      >
                        {cat === "FINANCIAL_PRODUCTS_SERVICES" ? "Credit / Finance" : cat === "EMPLOYMENT" ? "Employment" : cat === "HOUSING" ? "Housing" : "Social/Political"}
                      </button>
                    );
                  })}
                </div>

                {/* Special ad category — applicable countries / regions */}
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-foreground">Special ad category — applicable countries / regions</p>
                  <p className="text-[11px] text-muted-foreground">
                    Meta requires you to declare the countries where this special ad category applies.
                  </p>
                  <SpecialAdCountryPicker
                    selected={plan.specialAdCountries ?? []}
                    onChange={(codes) => patch({ specialAdCountries: codes })}
                  />
                </div>

                {/* Beneficiary + Payor — only for ISSUES_ELECTIONS_POLITICS */}
                {plan.specialAdCategories?.includes("ISSUES_ELECTIONS_POLITICS") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-foreground">
                        Beneficiary <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter beneficiary"
                        value={plan.beneficiary ?? ""}
                        onChange={(e) => patch({ beneficiary: e.target.value })}
                        className="h-9 w-full font-mono text-[12px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-foreground">
                        Payor <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter payor"
                        value={plan.payor ?? ""}
                        onChange={(e) => patch({ payor: e.target.value })}
                        className="h-9 w-full font-mono text-[12px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Naming (nomenclature) — campaign-level, expanded by default ── */}
          <Subsection
            label={<>Naming <span className="text-[11px] font-normal text-muted-foreground">(nomenclature)</span></>}
            icon={<Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
            defaultOpen={true}
          >
            <NamingPatternInput
              label="Campaign name"
              value={plan.namingPatterns?.campaign ?? ""}
              onChange={(v) => patch({ namingPatterns: { ...(plan.namingPatterns ?? {}), campaign: v, adset: plan.namingPatterns?.adset ?? "", ad: plan.namingPatterns?.ad ?? "" } })}
              tokens={[
                { key: "{brand}", desc: "account brand prefix" },
                { key: "{intent}", desc: "test / scale / custom" },
                { key: "{objective}", desc: "e.g. sales" },
                { key: "{date}", desc: "launch date YYYY-MM-DD" },
              ]}
              placeholder="{brand}_{intent}_{objective}"
            />
          </Subsection>
        </StepSection>

        {/* ── 3 · Ad set ──────────────────────────────────────────── */}
        <StepSection
          index={2}
          title="Ad set"
          description="Set audience, placement and optimisation"
          badge={
            <div className="flex items-center gap-2">
              <CopyFromRunning
                triggerLabel="Copy from running ad set"
                items={runningAdSetItems()}
                onPick={(id) => applyRunningAdSet(flow, id)}
                pickerType="adset"
              />
              <SetupSectionChip flow={flow} section="adset" />
            </div>
          }
          complete={sectionMeta[2].complete}
          isLast={false}
          sectionRef={sectionRefs[2]}
        >
          {/* ── Subsection ▸ Optimization ────────────────────────────── */}
          <Subsection
            label="Optimization"
            open={s3Sub.has("optimization")}
            onOpenChange={(v) => setS3Sub((prev) => { const next = new Set(prev); v ? next.add("optimization") : next.delete("optimization"); return next; })}
          >
          {/* Row 1: Conversion location + Performance goal side by side */}
          <div className="grid grid-cols-2 gap-4">
            {plan.objective && showsLocationPicker(plan.objective) ? (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Conversion location</Label>
                <Select
                  value={plan.destinationType ?? undefined}
                  onValueChange={(v) => patch({ destinationType: v as DestinationType })}
                >
                  <SelectTrigger className="h-9 w-full">
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
            ) : (
              <div />
            )}

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
                      <SelectTrigger className="h-9 w-full">
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
          </div>

          {/* Row 2: Attribution window — full width */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-[13px] font-medium text-foreground">
              Attribution window
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Full label: 7-day click + 1-day engage-through + 1-day view.
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              value={plan.attribution}
              onValueChange={(v) => patch({ attribution: v as AttributionWindow })}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d_click">1-day click</SelectItem>
                <SelectItem value="7d_click">7-day click</SelectItem>
                <SelectItem value="7d_click_1d_view">7-day click + 1-day view (default)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Note: 28-day view was removed by Meta in Jan 2026.
            </p>
          </div>

          {needsPixel && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3 text-amber-500" />
                Pixel / Dataset required for this goal
              </Label>
              <p className="text-[11px] text-amber-600">
                This goal needs a pixel. Choose accounts with a connected pixel, or change the performance goal.
              </p>
            </div>
          )}
          </Subsection>
          {/* ── /Subsection ▸ Optimization ─────────────────────────── */}

          {/* ── Subsection ▸ Targeting ───────────────────────────────── */}
          <Subsection
            label="Targeting"
            open={s3Sub.has("audience")}
            onOpenChange={(v) => setS3Sub((prev) => { const next = new Set(prev); v ? next.add("audience") : next.delete("audience"); return next; })}
          >
          {/* Targeting template + audience editor — placements now live inside
              the Edit Targeting modal (TargetingTemplateModal.tsx), not inline here. */}
          <TargetingTemplateSection
            plan={plan}
            onPatch={patch}
            specialAdCategoryActive={special}
          />
          </Subsection>
          {/* ── /Subsection ▸ Targeting ──────────────────────────────── */}

          {/* ── Naming (nomenclature) — ad set-level, collapsed by default ── */}
          <Subsection
            label={<>Naming <span className="text-[11px] font-normal text-muted-foreground">(nomenclature)</span></>}
            icon={<Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
            defaultOpen={false}
          >
            <NamingPatternInput
              label="Ad set name"
              value={plan.namingPatterns?.adset ?? ""}
              onChange={(v) => patch({ namingPatterns: { ...(plan.namingPatterns ?? {}), campaign: plan.namingPatterns?.campaign ?? "", adset: v, ad: plan.namingPatterns?.ad ?? "" } })}
              tokens={[
                { key: "{brand}", desc: "account brand prefix" },
                { key: "{intent}", desc: "test / scale / custom" },
                { key: "{adset}", desc: "ad set number (01, 02…)" },
                { key: "{date}", desc: "launch date YYYY-MM-DD" },
              ]}
              placeholder="{brand}_{adset}"
            />
          </Subsection>
        </StepSection>

        {/* ── 4 · Ad ────────────────────────────────────────────────── */}
        <StepSection
          index={3}
          title="Ad"
          description="Set audience, placement and optimisation"
          complete={sectionMeta[3].complete}
          isLast={true}
          sectionRef={sectionRefs[3]}
        >
          {/* Advantage+ creative toggle — locked + forced off while post-mode is active (not
              compatible with existing-post ads on Meta's API) */}
          <Toggle
            checked={plan.advantageCreative}
            onCheckedChange={(v) => patch({ advantageCreative: v })}
            label="Advantage+ Creative"
            desc="Drive sales using your product information by showing relevant products to the right people."
            icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
            locked={postActive}
            reason={postActive ? "Not available for existing-post ads" : undefined}
          />

          {/* ── Naming (nomenclature) — ad-level, collapsed by default ── */}
          <Subsection
            label={<>Naming <span className="text-[11px] font-normal text-muted-foreground">(nomenclature)</span></>}
            icon={<Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
            defaultOpen={false}
          >
            <NomenclatureBuilder flow={flow} />
          </Subsection>
        </StepSection>
        </div>


      </div>

      <RecentLaunchModal
        open={recentLaunchOpen}
        onClose={() => setRecentLaunchOpen(false)}
        mode="setup"
        onImport={(patch) => {
          // Exclude objective/intent — those are Step 1 scope; import setup fields only
          const { objective: _obj, intent: _intent, ...setupPatch } = patch;
          flow.patch(setupPatch);
        }}
      />
    </TooltipProvider>
  );
}
