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
  ExternalLink,
  Lock,
  Sparkles,
  Pencil,
  Info,
  Upload,
  Users,
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
  CUSTOM_AUDIENCES,
  TARGETING_TEMPLATES,
  getTemplate,
} from "../../data";
import type { AttributionWindow, BidStrategy, DestinationType, OptimizationGoal, PlanV2 } from "../../types";
import { buildIssues } from "../review/reviewModel";
import { AccountsPages } from "./setup/AccountsPages";
import { TemplateModal } from "./setup/TemplateModal";
import { SetupTemplateBar, SetupSectionChip } from "./setup/SetupTemplateBar";
import SpecialAdCategoryField from "./shared/SpecialAdCategoryField";
import CopyFromRunning, {
  runningCampaignItems,
  applyRunningCampaign,
  runningAdSetItems,
  applyRunningAdSet,
} from "./shared/CopyFromRunning";

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

/* ---- Sticky overview card ---- */

function SetupOverviewCard({
  meta,
  plan,
}: {
  meta: { label: string; complete: boolean; summary: string }[];
  plan: PlanV2;
}) {
  const EMPTY_LABELS = new Set(["Not set yet", "Not set", "Defaults applied"]);
  const [detailOpen, setDetailOpen] = useState(false);

  const humanizeGoal = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const formatAttribution = (a: string): string => {
    if (a === "1d_click") return "1d click";
    if (a === "7d_click") return "7d click";
    if (a === "7d_click_1d_view") return "7d + 1d view";
    return a;
  };

  const tplDetail = getTemplate(plan.targetingTemplateId);

  // Row A — Campaign chips
  const campaignChips: React.ReactNode[] = [];
  if (plan.budgetAmount > 0) {
    campaignChips.push(
      <span key="budgetMode" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {plan.budgetMode}
      </span>,
    );
  }
  if (plan.advantagePlus === true) {
    campaignChips.push(
      <span key="advantagePlus" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        Advantage+
      </span>,
    );
  }
  if (plan.abTest === true) {
    campaignChips.push(
      <span key="abTest" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        A/B Test
      </span>,
    );
  }
  if (plan.bidStrategy && plan.bidStrategy !== "LOWEST_COST_WITHOUT_CAP") {
    campaignChips.push(
      <span key="bidStrategy" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {BID_LABELS[plan.bidStrategy]}
      </span>,
    );
  }

  // Row B — Ad set chips
  const adSetChips: React.ReactNode[] = [];
  if (plan.optimizationGoal) {
    adSetChips.push(
      <span key="optGoal" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {humanizeGoal(plan.optimizationGoal)}
      </span>,
    );
  }
  if (plan.attribution) {
    adSetChips.push(
      <span key="attribution" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {formatAttribution(plan.attribution)}
      </span>,
    );
  }
  if (plan.placementMode) {
    adSetChips.push(
      <span key="placement" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {plan.placementMode === "advantage" ? "Auto placement" : "Manual placement"}
      </span>,
    );
  }
  if (plan.advantageAudience === true) {
    adSetChips.push(
      <span key="advAudience" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        Adv+ Audience
      </span>,
    );
  }

  // Row C — Audience chips
  const audienceChips: React.ReactNode[] = [];
  if (plan.targetingTemplateId && tplDetail) {
    audienceChips.push(
      <span key="tplName" className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {tplDetail.name}
      </span>,
    );
  }

  const hasDetailRows = campaignChips.length > 0 || adSetChips.length > 0 || audienceChips.length > 0;

  return (
    <div className="sticky top-0 z-20 pb-2 bg-background">
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex divide-x divide-border/50">
          {meta.map((item, i) => (
            <div
              key={i}
              className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-1.5">
                {/* Status dot */}
                <span
                  className={cn(
                    "flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    item.complete
                      ? "border-primary bg-primary"
                      : "border-border bg-muted",
                  )}
                >
                  {item.complete && (
                    <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                      <path d="M0.75 2.5L2.25 4L5.25 1" stroke="#121212" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <span
                className={cn(
                  "truncate pl-4 text-[11px] font-medium leading-tight",
                  item.complete ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                {EMPTY_LABELS.has(item.summary) ? "—" : item.summary}
              </span>
            </div>
          ))}

          {/* Expand/collapse toggle button */}
          {hasDetailRows && (
            <button
              type="button"
              onClick={() => setDetailOpen((v) => !v)}
              className="flex h-full shrink-0 items-center border-l border-border/50 px-2 text-muted-foreground hover:text-foreground transition-colors"
              title={detailOpen ? "Collapse" : "Expand overview"}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", detailOpen && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Collapsible detail rows */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out",
            detailOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border/50 px-3 py-2.5 space-y-2">
              {/* Row A — Campaign */}
              {campaignChips.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50 shrink-0 w-20">Campaign</span>
                  {campaignChips}
                </div>
              )}
              {/* Row B — Ad set */}
              {adSetChips.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50 shrink-0 w-20">Ad set</span>
                  {adSetChips}
                </div>
              )}
              {/* Row C — Audience */}
              {audienceChips.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50 shrink-0 w-20">Audience</span>
                  {audienceChips}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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
  noBorder,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  desc?: string;
  locked?: boolean;
  reason?: string;
  icon?: React.ReactNode;
  /** When true, suppresses the outer card border (used when Toggle is inside a grouped card container). */
  noBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 bg-card px-3 py-2.5",
        noBorder ? "first:rounded-t-2xl last:rounded-b-2xl" : "rounded-2xl border border-border",
      )}
    >
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

/* ---- custom audience upload ---- */

function CustomAudienceUpload() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-4 text-center hover:border-primary/40 transition-colors">
      <Upload className="h-5 w-5 text-muted-foreground/50" />
      {file ? (
        <span className="text-xs font-medium text-foreground">{file.name}</span>
      ) : (
        <>
          <span className="text-xs font-medium text-foreground">Drop CSV here or click to browse</span>
          <span className="text-[11px] text-muted-foreground">Columns: email, phone or MADID</span>
        </>
      )}
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── Setup template header bar ─────────────────────────── */}
        <SetupTemplateBar flow={flow} />

        {/* ── Sticky section overview card ──────────────────────── */}
        <SetupOverviewCard
          meta={sectionMeta}
          plan={plan}
        />

        {/* ── Section progress strip ────────────────────────────── */}
        {(() => {
          const completeCount = sectionMeta.filter((s) => s.complete).length;
          const remainingCount = sectionMeta.length - completeCount;
          const firstIncomplete = sectionMeta.findIndex((s) => !s.complete);
          const pct = (completeCount / sectionMeta.length) * 100;
          return (
            <button
              type="button"
              onClick={() => {
                if (firstIncomplete !== -1) openSection(firstIncomplete);
              }}
              disabled={firstIncomplete === -1}
              className={cn(
                "group w-full rounded-xl border border-border bg-card px-3 py-2 text-left transition-colors",
                firstIncomplete !== -1 && "hover:border-foreground/30 cursor-pointer",
                firstIncomplete === -1 && "cursor-default",
              )}
              aria-label="Jump to next incomplete section"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  <span className="text-foreground font-semibold tabular-nums">{completeCount}</span>
                  {" of "}
                  <span className="tabular-nums">{sectionMeta.length}</span>
                  {" sections complete"}
                  {remainingCount > 0 && (
                    <>
                      {" · "}
                      <span className="tabular-nums">{remainingCount}</span> remaining
                    </>
                  )}
                </span>
                {firstIncomplete === -1 && (
                  <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                )}
              </div>
              <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })()}

        {/* ── Ant-style vertical Steps spine ────────────────────── */}
        <div className="space-y-0">
        {/* ── 1 · Ad accounts & pages ───────────────────────────── */}
        <StepSection
          index={0}
          title="Ad accounts & pages"
          description="Pick ad accounts and the pages that'll run the ads"
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
          description="Budget, bidding and delivery"
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

            {/* CBO/ABO selection — radio pill buttons */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                Budget optimization
                {policy.budgetMode.locked && <Lock className="h-3 w-3" />}
              </Label>
              <div className="flex gap-1.5">
                {(["CBO", "ABO"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={policy.budgetMode.locked}
                    onClick={() => patch({ budgetMode: mode })}
                    className={cn(
                      "fab-focus rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      plan.budgetMode === mode
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      policy.budgetMode.locked && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {mode === "CBO" ? "Campaign (CBO)" : "Ad set (ABO)"}
                  </button>
                ))}
              </div>
              {policy.budgetMode.locked && <LockNote reason={policy.budgetMode.reason} />}
            </div>
          </div>

          {/* ── Advantage+, A/B Test — grouped card ────── */}
          <div className="rounded-2xl border border-border divide-y divide-border">
            {/* Advantage+ toggle — surfaced */}
            <Toggle
              checked={plan.advantagePlus}
              onCheckedChange={(v) => patch({ advantagePlus: v })}
              label="Advantage+"
              desc="Meta optimizes budget, audience and placements automatically."
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              noBorder
            />
            {asc && (
              <p className="flex items-center gap-1.5 px-3 pb-2 text-[11px] text-primary">
                <Sparkles className="h-3 w-3" /> Advantage+ active — campaign budget, broad audience and auto
                placements applied.
              </p>
            )}

            {/* A/B Test toggle */}
            <Toggle
              checked={plan.abTest}
              onCheckedChange={(v) => patch({ abTest: v })}
              label="A/B Test"
              desc="Meta auto-splits traffic 50/50 between two variants. No extra setup."
              noBorder
            />
          </div>

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
        </StepSection>

        {/* ── 3 · Ad set & Audience ──────────────────────────────── */}
        <StepSection
          index={2}
          title="Ad set & Audience"
          description="Optimization, attribution and audience"
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
          {/* Special-category compliance note (lives at the top so it's seen
              before targeting decisions; the actual toggle is at the section's
              bottom — moving it disrupts existing functionality). */}
          <p className="text-[11px] text-muted-foreground italic">
            If your ads relate to credit, employment, housing, or social issues, set Special Ad Category below before configuring targeting.
          </p>

          {/* ── Sub-group A · Conversion goal ─────────────────────────── */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-3">
              Conversion goal
            </h4>
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

          {/* Attribution — tucked under Advanced reveal to declutter */}
          <AdvancedReveal label="Advanced — attribution">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                Attribution window
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {/* 7.4: keep only the technical full-label here — the policy
                       fact about 28-day removal now lives inline below the Select
                       so keyboard/touch users don't lose critical info. */}
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
              {/* 7.4: policy fact promoted out of the tooltip — applies to all users. */}
              <p className="text-[11px] text-muted-foreground">
                Note: 28-day view was removed by Meta in Jan 2026.
              </p>
            </div>
          </AdvancedReveal>
          </div>
          {/* ── /Sub-group A · Conversion goal ─────────────────────── */}

          {/* ── Sub-group B · Targeting ───────────────────────────── */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-3">
              Targeting
            </h4>
          {/* ── Targeting template ─────────────────────────────────── */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Targeting template</Label>

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
                    <span className="truncate">{tpl ? tpl.name : "Choose a template"}</span>
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
          </div>
          {/* ── /Sub-group B · Targeting ──────────────────────────── */}

          {/* ── Sub-group C · Optimization ────────────────────────── */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-3">
              Optimization
            </h4>
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
          </div>
          {/* ── /Sub-group C · Optimization ───────────────────────── */}

          {/* ── Sub-group D · Placements ──────────────────────────── */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-3">
              Placements
            </h4>
          {/* Placements */}
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
                      "fab-focus rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      plan.placementMode === mode
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
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
          </div>
          {/* ── /Sub-group D · Placements ─────────────────────────── */}

          {/* ── Sub-group E · Special ad category ─────────────────── */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-3">
              Special ad category
            </h4>
            {/* Special ad category — master toggle + picker */}
            <SpecialAdCategoryField flow={flow} />
          </div>
          {/* ── /Sub-group E · Special ad category ────────────────── */}
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
