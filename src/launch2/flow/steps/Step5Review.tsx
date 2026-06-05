import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLaunchFlow } from "@/launch2/store/launchFlowStore";
import {
  accounts,
  creativeAssets,
  savedAudiences,
} from "@/launch2/mocks";
import { computeBudget } from "@/launch2/lib/budget";
import { formatCurrency } from "@/launch2/lib/format";
import { getPreset } from "@/launch2/lib/strategyPresets";
import { mockMetaLaunchService } from "@/launch2/service/mockMetaLaunchService";
import type {
  DispatchItem,
  DispatchRequest,
  DispatchResult,
  EntityLevel,
  PlanEntity,
  PreflightResult,
} from "@/launch2/types";
import { SectionHeader } from "@/launch2/components";
import { LaunchProgress } from "@/launch2/flow/LaunchProgress";

/* ───────────────────────── Plan synthesis ───────────────────────── */

interface PlanNode extends PlanEntity {
  children: PlanNode[];
}

/** Synthesize the entity tree (1 campaign → N ad sets → M ads each). */
function buildPlan(state: ReturnType<typeof useLaunchFlow>["state"]): {
  tree: PlanNode;
  items: DispatchItem[];
  entities: PlanEntity[];
} {
  const preset = getPreset(state.strategy);
  const strategyLabel = preset?.label ?? "Launch";
  const audience = savedAudiences.find((a) => a.id === state.audienceId)?.name ?? "Broad";
  const accountLabel = accounts.find((a) => state.accountIds.includes(a.id))?.name ?? "Account";

  const selectedCreatives = state.useCatalogue
    ? []
    : creativeAssets.filter((c) => state.creativeIds.includes(c.id));

  const items: DispatchItem[] = [];
  const entities: PlanEntity[] = [];

  const campaignId = "cmp_1";
  const campaignName = `${accountLabel.split(" ")[0]} · ${strategyLabel} · ${state.objective ?? "sales"}`;
  const campaign: PlanNode = { id: campaignId, level: "campaign", parentId: null, name: campaignName, children: [] };
  entities.push({ id: campaignId, level: "campaign", parentId: null, name: campaignName });
  items.push({ id: campaignId, level: "campaign", name: campaignName });

  const adsetCount = Math.max(1, state.adsetCount);
  const perSet = Math.max(1, state.creativesPerAdset);

  for (let s = 0; s < adsetCount; s++) {
    const adsetId = `as_${s + 1}`;
    const adsetName = `${audience} — set ${s + 1}`;
    const adset: PlanNode = { id: adsetId, level: "adset", parentId: campaignId, name: adsetName, children: [] };
    entities.push({ id: adsetId, level: "adset", parentId: campaignId, name: adsetName });
    items.push({ id: adsetId, level: "adset", name: adsetName });

    for (let a = 0; a < perSet; a++) {
      const adId = `ad_${s + 1}_${a + 1}`;
      const creative = selectedCreatives[a % Math.max(1, selectedCreatives.length)];
      const base = state.useCatalogue
        ? "Dynamic product ad"
        : creative?.name ?? state.copy.headline ?? "Ad";
      const adName = `${base} — ${s + 1}.${a + 1}`;
      adset.children.push({ id: adId, level: "ad", parentId: adsetId, name: adName, children: [] });
      entities.push({ id: adId, level: "ad", parentId: adsetId, name: adName });
      items.push({ id: adId, level: "ad", name: adName });
    }
    campaign.children.push(adset);
  }

  return { tree: campaign, items, entities };
}

/* ───────────────────────── Level meta ───────────────────────── */

const LEVEL_ICON: Record<EntityLevel, typeof Sparkles> = {
  campaign: Sparkles,
  adset: Layers,
  ad: ImageIcon,
};

const LEVEL_STEP: Record<EntityLevel, number> = {
  campaign: 3, // objective / budget
  adset: 3, // targeting
  ad: 4, // creative
};

/* ───────────────────────── Step 5 ───────────────────────── */

export function Step5Review() {
  const { state, dispatch } = useLaunchFlow();
  const navigate = useNavigate();

  const budget = useMemo(() => computeBudget(state), [state]);
  const plan = useMemo(() => buildPlan(state), [state]);
  const onlyAds = useMemo(() => plan.items.filter((i) => i.level === "ad"), [plan.items]);
  const totalAds = onlyAds.length;

  // Pre-flight
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [pfLoading, setPfLoading] = useState(true);

  const runPreflight = useCallback(async () => {
    setPfLoading(true);
    const res = await mockMetaLaunchService.validate(state);
    setPreflight(res);
    setPfLoading(false);
  }, [state]);

  useEffect(() => {
    void runPreflight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hardBlock = !!preflight && !preflight.ok;
  const blockIssues = preflight?.issues.filter((i) => i.level === "block") ?? [];
  const warnIssues = preflight?.issues.filter((i) => i.level === "warn") ?? [];
  const infoIssues = preflight?.issues.filter((i) => i.level === "info") ?? [];

  /* ── Launch execution state ── */
  const [launching, setLaunching] = useState(false);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<DispatchResult[]>([]);
  const resultsRef = useRef<DispatchResult[]>([]);

  // Merge a result by id (idempotent — latest wins so retry overwrites a fail).
  const mergeResult = useCallback((latest: DispatchResult) => {
    const next = [...resultsRef.current];
    const idx = next.findIndex((r) => r.id === latest.id);
    if (idx >= 0) next[idx] = latest;
    else next.push(latest);
    resultsRef.current = next;
    setResults(next);
  }, []);

  // Counters — only `ok` results count as created (failed ≠ launched).
  const created = results.filter((r) => r.ok).length;
  const failedResults = results.filter((r) => !r.ok);
  const failed = failedResults.length;
  const dispatchTotal = plan.items.length; // campaign + adsets + ads
  const pending = launching ? Math.max(0, dispatchTotal - results.length) : 0;

  const handleLaunch = useCallback(async () => {
    if (hardBlock || launching) return;
    setStarted(true);
    setLaunching(true);
    resultsRef.current = [];
    setResults([]);

    const req: DispatchRequest = { dedupeKey: state.dedupeKey, items: plan.items };
    await mockMetaLaunchService.dispatch(req, (_done, _total, latest) => mergeResult(latest));
    setLaunching(false);
  }, [hardBlock, launching, state.dedupeKey, plan.items, mergeResult]);

  const handleRetry = useCallback(async () => {
    if (launching) return;
    const failedIds = new Set(failedResults.map((r) => r.id));
    const retryItems = plan.items.filter((i) => failedIds.has(i.id));
    if (retryItems.length === 0) return;

    setLaunching(true);
    // SAME dedupeKey, ONLY failed items → idempotent, never double-creates.
    const req: DispatchRequest = { dedupeKey: state.dedupeKey, items: retryItems };
    await mockMetaLaunchService.retryFailed(req, (_done, _total, latest) => mergeResult(latest));
    setLaunching(false);
  }, [launching, failedResults, plan.items, state.dedupeKey, mergeResult]);

  // Progress accounting passed to the presentational surface.
  const progressTotal = started ? dispatchTotal : totalAds;

  /* ── Launch overlay takes over once started ── */
  if (started) {
    return (
      <div className="space-y-6 font-g6-sans">
        <header>
          <h1 className="font-g6-sans text-xl font-semibold text-foreground">
            {launching ? "Launching…" : "Launch complete"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {launching
              ? "Creating campaign, ad sets, and ads in batches. Don't close this — progress is tracked live."
              : "Review the dispatch log below. Only ads that returned a Meta ID are live."}
          </p>
        </header>

        <LaunchProgress
          total={progressTotal}
          created={created}
          failed={failed}
          pending={pending}
          results={results}
          running={launching}
          onRetry={failed > 0 ? handleRetry : undefined}
          onViewDetail={() => navigate("/launch2/ln_01")}
          onClose={() => navigate("/launch2")}
        />
      </div>
    );
  }

  /* ── Review body ── */
  return (
    <div className="space-y-8 font-g6-sans">
      <header>
        <h1 className="font-g6-sans text-xl font-semibold text-foreground">Verify + launch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Final check before anything is created. We pre-flight against Meta's caps and required fields — then launch
          idempotently, so N requested = N created.
        </p>
      </header>

      {/* ── Pre-flight ── */}
      <section>
        <SectionHeader
          title="Pre-flight"
          sub="Authoritative checks — caps, required fields, policy."
          action={
            <Button variant="outline" size="sm" onClick={() => void runPreflight()} disabled={pfLoading}>
              <RefreshCw className={cn("h-3.5 w-3.5", pfLoading && "animate-spin")} />
              Re-run
            </Button>
          }
        />
        {pfLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running pre-flight…
          </div>
        ) : (
          <div className="space-y-2">
            {/* Hard blocks */}
            {blockIssues.map((iss, i) => (
              <div
                key={`block-${i}`}
                className="flex items-start gap-3 rounded-lg border border-[#ff4d4f]/40 bg-[#ff4d4f]/10 px-4 py-3"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4d4f]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[hsl(var(--error-text))]">
                    Hard block · {iss.code === "cap_breach" ? "250-ad Page cap" : iss.code}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{iss.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
                  className="shrink-0 text-xs font-medium text-[hsl(var(--primary-text))] underline-offset-2 hover:underline"
                >
                  Fix in Step 2
                </button>
              </div>
            ))}

            {/* Warnings (non-blocking) */}
            {warnIssues.map((iss, i) => (
              <div
                key={`warn-${i}`}
                className="flex items-start gap-3 rounded-lg border border-[#faad14]/40 bg-[#faad14]/10 px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#faad14]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--warning-text))]">
                    {iss.code === "policy" ? "Policy note" : "Heads up"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{iss.message}</p>
                </div>
              </div>
            ))}

            {/* Info */}
            {infoIssues.map((iss, i) => (
              <div
                key={`info-${i}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{iss.message}</p>
              </div>
            ))}

            {/* All clear */}
            {!hardBlock && warnIssues.length === 0 && infoIssues.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[#52c41a]/40 bg-[#52c41a]/10 px-4 py-3 text-sm text-[hsl(var(--success-text))]">
                <Rocket className="h-4 w-4" />
                All checks passed — clear to launch.
              </div>
            )}
            {!hardBlock && (warnIssues.length > 0 || infoIssues.length > 0) && (
              <p className="px-1 text-xs text-muted-foreground">
                Warnings are non-blocking — you can still launch.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Plan tree ── */}
      <section>
        <SectionHeader
          title="Launch plan"
          sub={`${budget.totalAdsets} ad sets · ${budget.totalAds} ads · rename inline or jump back to edit.`}
        />
        <PlanTree tree={plan.tree} onEdit={(level) => dispatch({ type: "SET_STEP", step: LEVEL_STEP[level] })} />
      </section>

      {/* ── Budget breakdown ── */}
      <section>
        <SectionHeader title="Budget" sub={`${budget.budgetLevel === "campaign" ? "CBO — one campaign pool" : "ABO — per ad set"}.`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BudgetCell label="Ad sets" value={String(budget.totalAdsets)} />
          <BudgetCell label="Total ads" value={String(budget.totalAds)} />
          <BudgetCell label="Daily spend" value={`${formatCurrency(budget.dailyTotal)}/day`} />
          <BudgetCell label="Monthly est." value={formatCurrency(budget.monthlyEstimate)} muted />
        </div>
      </section>

      {/* ── Launch CTA ── */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Ready to launch</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Idempotent dispatch — a double-click or retry never double-creates. Failures stay retryable and are{" "}
              <span className="font-medium text-foreground">never counted as live</span>.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => void handleLaunch()}
            disabled={hardBlock || pfLoading}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Rocket className="h-4 w-4" />
            Launch {totalAds} {totalAds === 1 ? "ad" : "ads"}
          </Button>
        </div>
        {hardBlock && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[hsl(var(--error-text))]">
            <ShieldAlert className="h-3.5 w-3.5" />
            Launch is blocked until the hard block above is resolved.
          </p>
        )}
      </section>
    </div>
  );
}

/* ───────────────────────── Plan tree (collapsible + rename) ───────────────────────── */

function PlanTree({ tree, onEdit }: { tree: PlanNode; onEdit: (level: EntityLevel) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <PlanRow node={tree} depth={0} onEdit={onEdit} defaultOpen />
    </div>
  );
}

function PlanRow({
  node,
  depth,
  onEdit,
  defaultOpen = false,
}: {
  node: PlanNode;
  depth: number;
  onEdit: (level: EntityLevel) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth === 0);
  const [name, setName] = useState(node.name);
  const [editing, setEditing] = useState(false);
  const hasChildren = node.children.length > 0;
  const Icon = LEVEL_ICON[node.level];

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          depth > 0 && "border-t border-border/60"
        )}
        style={{ paddingLeft: 12 + depth * 18 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand"}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted/50"
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
          </button>
        ) : (
          <span className="h-5 w-5" />
        )}

        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        {editing ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setEditing(false);
            }}
            className="h-7 max-w-md flex-1 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground hover:text-[hsl(var(--primary-text))]"
            title="Rename"
          >
            {name}
          </button>
        )}

        <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-g6-mono text-[10px] uppercase text-muted-foreground">
          {node.level}
        </span>

        {hasChildren && (
          <span className="shrink-0 font-g6-mono text-[10px] text-muted-foreground">
            {node.children.length}
          </span>
        )}

        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted/50"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(node.level)}
          className="shrink-0 text-[10px] font-medium text-[hsl(var(--primary-text))] underline-offset-2 hover:underline"
        >
          Edit in step {LEVEL_STEP[node.level]}
        </button>
      </div>

      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <PlanRow key={child.id} node={child} depth={depth + 1} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-g6-mono text-lg font-bold tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
