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
  Sparkles,
  Pencil,
  Info,
  Search,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  TARGETING_TEMPLATES,
  getTemplate,
} from "../../data";
import type { AttributionWindow, BidStrategy, DestinationType, OptimizationGoal } from "../../types";
import { buildIssues } from "../review/reviewModel";
import { AccountsPages } from "./setup/AccountsPages";
import { TemplateModal } from "./setup/TemplateModal";
import { SetupTemplateBar, SetupSectionChip } from "./setup/SetupTemplateBar";
import BidStrategyRow from "./setup/BidStrategyRow";
import AccountCatalogPicker from "./shared/AccountCatalogPicker";
import CatalogueStructurePreview from "./shared/CatalogueStructurePreview";
// SpecialAdCategoryField moved to AccountsPages (regulated toggle at top of §1, lock #18).
import CopyFromRunning, {
  runningCampaignItems,
  applyRunningCampaign,
  runningAdSetItems,
  applyRunningAdSet,
} from "./shared/CopyFromRunning";
import AudienceEditor from "./audience/AudienceEditor";

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
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            complete
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted",
          )}
        >
          {complete && <Check className="h-2.5 w-2.5" />}
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Right content */}
      <div className="min-w-0 flex-1 pb-6">
        <div className="flex w-full items-start justify-between gap-2 text-left">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {badge}
            </span>
            {description && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
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
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header — click to toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/20"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <span className="text-[13px] font-semibold text-foreground">{label}</span>
      </button>

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

/* ---- Filter chip (used in template picker) ---- */

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-6 rounded-full border px-2 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ---- Manual placement group ---- */

const PLACEMENT_LABELS: Record<string, Record<string, string>> = {
  facebook: {
    feeds: "Feeds",
    inStreamVideos: "In-stream videos",
    stories: "Stories",
    reels: "Reels",
    searchResults: "Search results",
    marketplace: "Marketplace",
  },
  instagram: {
    feed: "Feed",
    profileFeed: "Profile feed",
    stories: "Stories",
    reels: "Reels",
    explore: "Explore",
  },
  audienceNetwork: {
    nativeBannerInterstitial: "Native, banner & interstitial",
    rewardedVideos: "Rewarded videos",
  },
  messenger: {
    inbox: "Messenger inbox",
    stories: "Stories",
  },
};

function PlacementGroup({
  title,
  platform,
  placements,
  onToggle,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  platform: string;
  placements: Record<string, boolean>;
  onToggle: (key: string) => void;
  defaultOpen?: boolean;
}) {
  const labels = PLACEMENT_LABELS[platform] ?? {};
  const [open, setOpen] = useState(defaultOpen);
  const checkedCount = Object.values(placements).filter(Boolean).length;
  const totalCount = Object.keys(placements).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Platform header row — click to toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-muted/20 transition-colors"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <span className="flex-1 text-left text-xs font-semibold text-foreground">{title}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {checkedCount}/{totalCount}
        </span>
      </button>

      {/* Placement checkboxes */}
      {open && (
        <div className="divide-y divide-border/30 border-t border-border/50">
          {Object.entries(placements).map(([key, val]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted/20 transition-colors"
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-all",
                  val ? "border-primary bg-primary" : "border-border",
                )}
              >
                {val && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L2.8 5L7 1" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-foreground">{labels[key] ?? key}</span>
              <input type="checkbox" checked={val} onChange={() => onToggle(key)} className="sr-only" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const asc = isAdvantagePlus(plan);
  const special = specialCategoryActive(plan);
  const needsPixel = requiresPixel(plan) && plan.targets.some((t) => !t.pixelId);
  const currency = plan.targets[0]?.currency ?? "USD";

  const bidOptions = plan.objective
    ? allowedBidStrategies(plan.objective, plan.optimizationGoal)
    : (["LOWEST_COST_WITHOUT_CAP"] as BidStrategy[]);

  const tpl = getTemplate(plan.targetingTemplateId);
  const [editOpen, setEditOpen] = useState(false);

  // Template picker popover state
  const [tplPickerOpen, setTplPickerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");

  // Filter chip state
  const [objFilter, setObjFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [locFilter, setLocFilter] = useState<string>("all");
  const [intFilter, setIntFilter] = useState<string>("all");

  // Filtered template list
  const filteredTemplates = TARGETING_TEMPLATES.filter((t) => {
    if (templateSearch && !t.name.toLowerCase().includes(templateSearch.toLowerCase())) return false;
    if (objFilter !== "all" && t.objective && t.objective !== objFilter) return false;
    if (ageFilter !== "all" && t.ageRange && t.ageRange !== ageFilter) return false;
    if (genderFilter !== "all" && t.gender && t.gender !== "all" && t.gender !== genderFilter) return false;
    if (locFilter !== "all" && t.locationType && t.locationType !== locFilter) return false;
    if (intFilter !== "all" && t.interestCategory && t.interestCategory !== intFilter) return false;
    return true;
  });

  // ── Ant-style vertical Steps: scrollspy + expand/collapse ──────────────
  const sectionRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualIndex, setManualIndex] = useState<number | null>(null);

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
  ];

  // Non-USD account → show single muted FX hint (currency lock #5)
  const hasNonUsdAccount = plan.targets.some((t) => t.currency && t.currency !== "USD");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── Setup template one-liner ──────────────────────────── */}
        <SetupTemplateBar flow={flow} />

        {/* Overview moved to LaunchV2Flow breadcrumb strip — sticky card + progress strip removed. */}

        {/* ── Ant-style vertical Steps spine ────────────────────── */}
        <div className="space-y-0">
        {/* ── 1 · Ad accounts & pages ───────────────────────────── */}
        <StepSection
          index={0}
          title="Ad accounts & Pages"
          badge={<SetupSectionChip flow={flow} section="destinations" />}
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
          {/* Budget model lock #16: ONE input. Per-account budget split UI deleted.
              Currency lock #5: $ symbol only, USD as workspace currency. */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-foreground">
                {plan.budgetMode === "CBO" ? "Daily budget — campaign" : "Daily budget — ad set"}
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min={1}
                  placeholder="200"
                  value={plan.budgetAmount || ""}
                  onChange={(e) => patch({ budgetAmount: Number(e.target.value) || 0 })}
                  className="h-9 w-32 font-mono tabular-nums"
                />
              </div>
            </div>

            {/* CBO/ABO pill — 2px foreground border on selected (lock #6).
                Tooltip on hover spells out (lock #15). */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-[13px] font-medium text-foreground">
                Budget optimization
                {policy.budgetMode.locked && <Lock className="h-3 w-3" />}
              </Label>
              <div className="flex gap-1.5">
                {(["CBO", "ABO"] as const).map((mode) => (
                  <Tooltip key={mode}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={policy.budgetMode.locked}
                        onClick={() => patch({ budgetMode: mode })}
                        className={cn(
                          "fab-focus rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          plan.budgetMode === mode
                            ? "border-2 border-foreground bg-foreground/[0.03] text-foreground"
                            : "border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          policy.budgetMode.locked && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {mode === "CBO" ? "Campaign (CBO)" : "Ad set (ABO)"}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {mode === "CBO"
                        ? "Campaign Budget Optimization — Meta splits budget across ad sets."
                        : "Ad Set Budget Optimization — you set a budget per ad set."}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              {policy.budgetMode.locked && <LockNote reason={policy.budgetMode.reason} />}
            </div>
          </div>

          {/* N× projection — shown when 2+ accounts selected */}
          {accountCount >= 2 && plan.budgetAmount > 0 && (
            <p className="text-[12px] text-muted-foreground">
              Running in {accountCount} accounts → $
              <span className="font-mono tabular-nums text-foreground">{plan.budgetAmount.toLocaleString("en-US")}</span>
              {" × "}
              <span className="tabular-nums">{accountCount}</span>
              {" = $"}
              <span className="font-mono tabular-nums text-foreground">
                {(plan.budgetAmount * accountCount).toLocaleString("en-US")}
              </span>
              /day total
            </p>
          )}

          {/* Currency hint — only when a selected account is non-USD */}
          {hasNonUsdAccount && (
            <p className="text-[11px] text-muted-foreground">
              Budget in $. Meta charges in local currency at runtime FX.
            </p>
          )}

          {/* ── Advantage+, A/B Test — individual feature cards ────── */}
          <div className="space-y-2">
            <Toggle
              checked={plan.advantagePlus}
              onCheckedChange={(v) => patch({ advantagePlus: v })}
              label="Advantage+"
              desc="Meta optimizes budget, audience and placements automatically."
              icon={<Sparkles className={cn("h-4 w-4", plan.advantagePlus ? "text-primary" : "text-muted-foreground")} />}
            />
            {asc && (
              <p className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-primary">
                <Sparkles className="h-3 w-3 shrink-0" /> Advantage+ active — campaign budget, broad audience and auto placements applied.
              </p>
            )}
            <Toggle
              checked={plan.abTest}
              onCheckedChange={(v) => patch({ abTest: v })}
              label="A/B Test"
              desc="Meta auto-splits traffic 50/50 between two variants. No extra setup."
            />
          </div>

          {/* Advanced: bid strategy only */}
          <AdvancedReveal label="Advanced — bid strategy">
            {policy.bidStrategy.visibility !== "hidden" && (
              <BidStrategyRow
                objective={plan.objective}
                optimizationGoal={plan.optimizationGoal}
                bidStrategy={plan.bidStrategy}
                bidValue={plan.bidValue ?? null}
                onChangeBidStrategy={(v) => patch({ bidStrategy: v })}
                onChangeBidValue={(v) => patch({ bidValue: v ?? undefined })}
              />
            )}
          </AdvancedReveal>

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

          {/* ── Catalogue picker + structure preview (B8) ── */}
          {plan.catalogueToggle && plan.targets.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground px-1">
                Select catalogue per account
              </p>
              {plan.targets.map((target) => (
                <AccountCatalogPicker
                  key={target.accountId}
                  flow={flow}
                  accountId={target.accountId}
                />
              ))}
              <CatalogueStructurePreview flow={flow} />
            </div>
          )}
        </StepSection>

        {/* ── 3 · Ad set & Audience ──────────────────────────────── */}
        <StepSection
          index={2}
          title="Ad set & Audience"
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
          isLast={true}
          sectionRef={sectionRefs[2]}
        >
          {/* Regulated category lives in §1 (top of Ad accounts & Pages, lock #18). */}

          {/* ── Subsection ▸ Optimization (conv location + perf goal + attribution SURFACED) ── */}
          <Subsection label="Optimization" defaultOpen>
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
                This goal needs a pixel. Choose accounts with a connected pixel, or change the performance goal.
              </p>
            </div>
          )}

          {/* Attribution — SURFACED (not Advanced) per restructure */}
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
              <SelectTrigger className="h-9 w-full max-w-xs">
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
          </Subsection>
          {/* ── /Subsection ▸ Optimization ─────────────────────────── */}

          {/* ── Subsection ▸ Audience & Placement (SURFACED) ────────── */}
          <Subsection label="Audience & Placement" defaultOpen>
          {/* ── Targeting Template ─────────────────────────────────── */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-[13px] font-medium text-foreground">Targeting Template</Label>

              {/* Popover picker with search + filter chips */}
              <Popover
                open={tplPickerOpen}
                onOpenChange={(o) => {
                  setTplPickerOpen(o);
                  if (!o) {
                    setTemplateSearch("");
                    setObjFilter("all");
                    setAgeFilter("all");
                    setGenderFilter("all");
                    setLocFilter("all");
                    setIntFilter("all");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      !tpl && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">{tpl ? tpl.name : "Pick a Targeting Template"}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-80 p-0">
                  {/* Search */}
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search templates…"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </div>

                  {/* Filter rows */}
                  <div className="border-b border-border px-3 pb-2 space-y-2 pt-1">
                    {/* Objective */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 w-16 shrink-0">Goal</span>
                      {(["all", "OUTCOME_SALES", "OUTCOME_TRAFFIC", "OUTCOME_LEADS", "OUTCOME_AWARENESS"] as const).map((obj) => (
                        <FilterChip key={obj} active={objFilter === obj} onClick={() => setObjFilter(obj === objFilter ? "all" : obj)}>
                          {obj === "all" ? "All" : obj === "OUTCOME_SALES" ? "Sales" : obj === "OUTCOME_TRAFFIC" ? "Traffic" : obj === "OUTCOME_LEADS" ? "Leads" : "Awareness"}
                        </FilterChip>
                      ))}
                    </div>

                    {/* Age range */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 w-16 shrink-0">Age</span>
                      {(["all", "18-24", "25-34", "35-44", "45+"] as const).map((age) => (
                        <FilterChip key={age} active={ageFilter === age} onClick={() => setAgeFilter(age === ageFilter ? "all" : age)}>
                          {age}
                        </FilterChip>
                      ))}
                    </div>

                    {/* Gender */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 w-16 shrink-0">Gender</span>
                      {(["all", "male", "female"] as const).map((g) => (
                        <FilterChip key={g} active={genderFilter === g} onClick={() => setGenderFilter(g === genderFilter ? "all" : g)}>
                          {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
                        </FilterChip>
                      ))}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 w-16 shrink-0">Location</span>
                      {(["all", "national", "city-level", "tier1", "tier2"] as const).map((loc) => (
                        <FilterChip key={loc} active={locFilter === loc} onClick={() => setLocFilter(loc === locFilter ? "all" : loc)}>
                          {loc === "all" ? "All" : loc === "national" ? "National" : loc === "city-level" ? "City" : loc === "tier1" ? "Tier 1" : "Tier 2"}
                        </FilterChip>
                      ))}
                    </div>

                    {/* Interest */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 w-16 shrink-0">Interest</span>
                      {(["all", "fashion", "tech", "health", "beauty", "fitness"] as const).map((int) => (
                        <FilterChip key={int} active={intFilter === int} onClick={() => setIntFilter(int === intFilter ? "all" : int)}>
                          {int === "all" ? "All" : int.charAt(0).toUpperCase() + int.slice(1)}
                        </FilterChip>
                      ))}
                    </div>
                  </div>

                  {/* Template list */}
                  <div className="max-h-48 overflow-y-auto py-1">
                    {filteredTemplates.length === 0 ? (
                      <div className="px-3 py-3 text-center text-[11px] font-mono text-muted-foreground">
                        No templates match
                      </div>
                    ) : (
                      filteredTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            patch({ targetingTemplateId: t.id });
                            setTplPickerOpen(false);
                            setTemplateSearch("");
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-muted/50",
                            plan.targetingTemplateId === t.id && "bg-primary/5 font-medium",
                          )}
                        >
                          {t.name}
                        </button>
                      ))
                    )}
                    {/* Custom option */}
                    <button
                      type="button"
                      onClick={() => {
                        patch({ targetingTemplateId: "custom" });
                        setTplPickerOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted/50 border-t border-border/50 mt-1 pt-2",
                        plan.targetingTemplateId === "custom" && "text-foreground font-medium",
                      )}
                    >
                      Custom (advanced settings)
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {tpl && (
              <Button variant="outline" size="sm" className="h-9" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>

          {/* Inline summary chips + metadata overview chips */}
          {tpl && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {/* Summary chips */}
              {tpl.summary.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  {c}
                </span>
              ))}
              {/* Metadata overview chips */}
              {tpl.objective && (
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  {tpl.objective === "OUTCOME_SALES"
                    ? "Sales"
                    : tpl.objective === "OUTCOME_TRAFFIC"
                    ? "Traffic"
                    : tpl.objective === "OUTCOME_LEADS"
                    ? "Leads"
                    : "Awareness"}
                </span>
              )}
              {tpl.ageRange && (
                <span className="rounded-full bg-muted/60 border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                  {tpl.ageRange}
                </span>
              )}
              {tpl.gender && tpl.gender !== "all" && (
                <span className="rounded-full bg-muted/60 border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
                  {tpl.gender}
                </span>
              )}
              {tpl.locationType && (
                <span className="rounded-full bg-muted/60 border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {tpl.locationType === "national"
                    ? "National"
                    : tpl.locationType === "city-level"
                    ? "City-level"
                    : tpl.locationType === "tier1"
                    ? "Tier 1"
                    : "Tier 2"}
                </span>
              )}
              {tpl.interestCategory && (
                <span className="rounded-full bg-muted/60 border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
                  {tpl.interestCategory}
                </span>
              )}
            </div>
          )}

          {/* ── AudienceEditor ─────────────────────────────────────── */}
          {/* Edits the actual targeting values (locations, age/gender,
              custom/lookalike audiences, size meter). The template picker
              above loads presets; this section lets the user fine-tune them. */}
          <AudienceEditor
            targeting={plan.targeting}
            onChange={(t) => patch({ targeting: t })}
            specialAdCategoryActive={special}
            compact
          />

          {/* Advantage+ Features — single toggle controls both audience + creative */}
          <div className="rounded-2xl border border-border bg-background px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">Advantage+ Features</p>
                <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                  Enable both Advantage+ Audience and Advantage+ Creative automatically.
                </p>
                {policy.advantageAudience.locked && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                    <Lock className="h-3 w-3" /> {policy.advantageAudience.reason}
                  </span>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={plan.advantageAudience && plan.advantageCreative}
                disabled={policy.advantageAudience.locked}
                onClick={() => {
                  const on = !(plan.advantageAudience && plan.advantageCreative);
                  patch({ advantageAudience: on, advantageCreative: on });
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#8FB821]/30",
                  (plan.advantageAudience && plan.advantageCreative)
                    ? "border-[#8FB821] bg-[#8FB821]"
                    : "border-border bg-muted",
                  policy.advantageAudience.locked && "pointer-events-none opacity-50",
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  (plan.advantageAudience && plan.advantageCreative) ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>
          </div>

          {/* Placements — accordion (Facebook expanded default kept) */}
          <AdvancedReveal label="Placements">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Placement type</Label>
              <div className="flex flex-wrap gap-2">
                {(["advantage", "manual"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={asc && mode === "manual"}
                    onClick={() => patch({ placementMode: mode })}
                    className={cn(
                      "fab-focus rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      plan.placementMode === mode
                        ? "border-2 border-foreground bg-foreground/[0.03] text-foreground"
                        : "border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      asc && mode === "manual" && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {mode === "advantage" ? "Advantage+ (automatic)" : "Manual"}
                  </button>
                ))}
              </div>
              {asc && <p className="text-[11px] text-muted-foreground">Locked to Advantage+ when ASC is active.</p>}

              {/* Manual placement checklist */}
              {plan.placementMode === "manual" && !asc && (
                <div className="space-y-3 pt-1">
                  <PlacementGroup
                    title="Facebook"
                    icon="fb"
                    platform="facebook"
                    defaultOpen={true}
                    placements={plan.placements.facebook}
                    onToggle={(key) =>
                      patch({
                        placements: {
                          ...plan.placements,
                          facebook: {
                            ...plan.placements.facebook,
                            [key]: !plan.placements.facebook[key as keyof typeof plan.placements.facebook],
                          },
                        },
                      })
                    }
                  />
                  <PlacementGroup
                    title="Instagram"
                    icon="ig"
                    platform="instagram"
                    placements={plan.placements.instagram}
                    onToggle={(key) =>
                      patch({
                        placements: {
                          ...plan.placements,
                          instagram: {
                            ...plan.placements.instagram,
                            [key]: !plan.placements.instagram[key as keyof typeof plan.placements.instagram],
                          },
                        },
                      })
                    }
                  />
                  <PlacementGroup
                    title="Audience Network"
                    icon="an"
                    platform="audienceNetwork"
                    placements={plan.placements.audienceNetwork}
                    onToggle={(key) =>
                      patch({
                        placements: {
                          ...plan.placements,
                          audienceNetwork: {
                            ...plan.placements.audienceNetwork,
                            [key]: !plan.placements.audienceNetwork[key as keyof typeof plan.placements.audienceNetwork],
                          },
                        },
                      })
                    }
                  />
                  <PlacementGroup
                    title="Messenger"
                    icon="msg"
                    platform="messenger"
                    placements={plan.placements.messenger}
                    onToggle={(key) =>
                      patch({
                        placements: {
                          ...plan.placements,
                          messenger: {
                            ...plan.placements.messenger,
                            [key]: !plan.placements.messenger[key as keyof typeof plan.placements.messenger],
                          },
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          </AdvancedReveal>
          </Subsection>
          {/* ── /Subsection ▸ Audience & Placement ─────────────────── */}

          {/* Regulated category toggle lives in §1 (lock #18). The legacy
              SpecialAdCategoryField field is no longer rendered here — its
              state is still patched via plan.specialAdDeclared / .specialAdCategories
              from AccountsPages. */}
        </StepSection>
        </div>

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
