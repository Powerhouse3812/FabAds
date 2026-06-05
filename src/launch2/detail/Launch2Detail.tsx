import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Copy,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  KpiTile,
  LAUNCH_STATUS_META,
  SectionHeader,
  StatusPill,
  StrategyBadge,
} from "@/launch2/components";
import { formatCurrency, formatNumber, relativeTime } from "@/launch2/lib/format";
import { launches } from "@/launch2/mocks";
import { useLaunch2Overlay } from "@/launch2/shell/Launch2OverlayProvider";
import type { LaunchProgress, LaunchSummary } from "@/launch2/types";

/* ───────────────────────── per-entity synthesis ───────────────────────── */

type AdStatus = "live" | "failed" | "pending";

interface AdNode {
  id: string;
  name: string;
  status: AdStatus;
  reason?: string;
}
interface AdSetNode {
  id: string;
  name: string;
  ads: AdNode[];
}
interface CampaignNode {
  id: string;
  name: string;
  adsets: AdSetNode[];
}

const FAIL_REASONS = [
  "Transient Graph API error (code 2) — retryable",
  "Rate limit hit during dispatch — retryable",
  "Creative still processing at dispatch — retryable",
];

/**
 * Synthesize a campaign → ad sets → ads tree from `counts`, assigning
 * statuses so the per-ad totals reconcile EXACTLY with `progress`
 * (created live / failed failed / pending pending). This is the
 * failed≠launched contract made visible at the entity level.
 */
function buildTree(launch: LaunchSummary): CampaignNode[] {
  const { counts, progress } = launch;
  const totalAds = Math.max(counts.ads, progress.total);
  const adsetCount = Math.max(1, counts.adsets);

  // Flat ad-status sequence that matches progress totals exactly.
  const statuses: AdStatus[] = [];
  for (let i = 0; i < progress.failed; i++) statuses.push("failed");
  for (let i = 0; i < progress.pending; i++) statuses.push("pending");
  for (let i = 0; i < progress.created; i++) statuses.push("live");
  // Pad (defensive) if counts.ads exceeds progress.total.
  while (statuses.length < totalAds) statuses.push("live");

  const adsPerSet = Math.max(1, Math.ceil(totalAds / adsetCount));
  const campaignName = launch.name;

  const adsets: AdSetNode[] = [];
  let adIdx = 0;
  let failIdx = 0;
  for (let s = 0; s < adsetCount && adIdx < totalAds; s++) {
    const ads: AdNode[] = [];
    for (let a = 0; a < adsPerSet && adIdx < totalAds; a++) {
      const st = statuses[adIdx] ?? "live";
      ads.push({
        id: `${launch.id}_as${s + 1}_ad${a + 1}`,
        name: `Ad ${adIdx + 1}`,
        status: st,
        reason: st === "failed" ? FAIL_REASONS[failIdx++ % FAIL_REASONS.length] : undefined,
      });
      adIdx++;
    }
    adsets.push({ id: `${launch.id}_as${s + 1}`, name: `Ad set ${s + 1}`, ads });
  }

  return [{ id: `${launch.id}_c1`, name: campaignName, adsets }];
}

function tallyProgress(tree: CampaignNode[]): LaunchProgress {
  let created = 0;
  let failed = 0;
  let pending = 0;
  for (const c of tree)
    for (const as of c.adsets)
      for (const ad of as.ads) {
        if (ad.status === "live") created++;
        else if (ad.status === "failed") failed++;
        else pending++;
      }
  return { total: created + failed + pending, created, failed, pending };
}

/* ───────────────────────── tree rows ───────────────────────── */

const AD_DOT: Record<AdStatus, string> = {
  live: "bg-[#52c41a]",
  failed: "bg-[#ff4d4f]",
  pending: "bg-muted-foreground/50",
};

function AdRow({ ad, onRetry }: { ad: AdNode; onRetry: (ad: AdNode) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md px-3 py-1.5 hover:bg-muted/50">
      <div className="flex min-w-0 items-start gap-2">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${AD_DOT[ad.status]}`} />
        <div className="min-w-0">
          <span className="font-g6-mono text-xs text-foreground">{ad.name}</span>
          {ad.status === "failed" && ad.reason && (
            <p className="mt-0.5 text-xs text-[hsl(var(--error-text))]">{ad.reason}</p>
          )}
        </div>
      </div>
      {ad.status === "failed" && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 shrink-0 px-2 text-[11px]"
          onClick={() => onRetry(ad)}
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

function AdSetRow({ adset, onRetry }: { adset: AdSetNode; onRetry: (ad: AdNode) => void }) {
  const [open, setOpen] = useState(true);
  const failed = adset.ads.filter((a) => a.status === "failed").length;
  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">{adset.name}</span>
          <span className="font-g6-mono text-[10px] text-muted-foreground">
            {adset.ads.length} ads
          </span>
        </span>
        {failed > 0 && (
          <span className="font-g6-mono text-[10px] text-[hsl(var(--error-text))]">
            {failed} failed
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-border px-1 py-1">
          {adset.ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} onRetry={onRetry} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── progress bar ───────────────────────── */

function ProgressBar({ progress }: { progress: LaunchProgress }) {
  const total = Math.max(1, progress.total);
  const pc = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-[#52c41a]" style={{ width: pc(progress.created) }} />
      <div className="h-full bg-[#ff4d4f]" style={{ width: pc(progress.failed) }} />
      <div className="h-full bg-muted-foreground/30" style={{ width: pc(progress.pending) }} />
    </div>
  );
}

/* ───────────────────────── screen ───────────────────────── */

export function Launch2Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { open } = useLaunch2Overlay();

  const launch = useMemo(
    () => launches.find((l) => l.id === id) ?? launches[0],
    [id],
  );

  // Local, retryable tree — failed≠launched made interactive.
  const [tree, setTree] = useState<CampaignNode[]>(() => buildTree(launch));
  const [retrying, setRetrying] = useState(false);

  // Rebuild when the matched launch changes (route param change).
  const treeKey = launch.id;
  const [seenKey, setSeenKey] = useState(treeKey);
  if (seenKey !== treeKey) {
    setSeenKey(treeKey);
    setTree(buildTree(launch));
  }

  const live = tallyProgress(tree);
  const allGreen = live.failed === 0 && live.pending === 0;
  const dailyEstimate = launch.counts.adsets * 5; // $5/ad-set/day placeholder estimate

  function retryAds(ids: Set<string>) {
    setRetrying(true);
    // Same dedupeKey story: identical request, only failed items re-dispatched.
    window.setTimeout(() => {
      let recovered = 0;
      setTree((prev) =>
        prev.map((c) => ({
          ...c,
          adsets: c.adsets.map((as) => ({
            ...as,
            ads: as.ads.map((ad) => {
              if (ad.status === "failed" && ids.has(ad.id)) {
                recovered++;
                return { ...ad, status: "live" as AdStatus, reason: undefined };
              }
              return ad;
            }),
          })),
        })),
      );
      setRetrying(false);
      toast.success(`Retried ${ids.size} failed — ${recovered} recovered`, {
        description: "Same idempotency key reused — no duplicates, N=N holds.",
      });
    }, 700);
  }

  function retryAll() {
    const ids = new Set<string>();
    for (const c of tree)
      for (const as of c.adsets)
        for (const ad of as.ads) if (ad.status === "failed") ids.add(ad.id);
    if (ids.size) retryAds(ids);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 font-g6-sans">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => navigate("/launch2")}
            className="font-g6-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Launch 2.0
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-g6-sans text-xl font-bold tracking-tight text-foreground">
              {launch.name}
            </h1>
            <StatusPill status={launch.status} />
            <StrategyBadge strategy={launch.strategy} showVerified />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="capitalize">{launch.objective}</span> · {launch.counts.campaigns}{" "}
            campaign · {launch.counts.adsets} ad sets · {launch.counts.ads} ads · spans{" "}
            {launch.accountSpan} account{launch.accountSpan > 1 ? "s" : ""}
            <span className="mx-1">·</span>
            {launch.createdBy} · {relativeTime(launch.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {live.failed > 0 && (
            <Button variant="outline" onClick={retryAll} disabled={retrying}>
              <RotateCcw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
              Retry failed only
            </Button>
          )}
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => open("quick")}
          >
            <Copy className="h-4 w-4" />
            Relaunch / clone
          </Button>
        </div>
      </header>

      {/* Rejected → Recovery banner */}
      {launch.status === "rejected" && (
        <div className="flex flex-col gap-2 rounded-lg border border-[#ff4d4f]/40 bg-[#ff4d4f]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--error-text))]" />
            <div>
              <p className="text-sm font-semibold text-foreground">Launch rejected</p>
              <p className="text-xs text-muted-foreground">
                The destination Page/account was restricted. Recover the surface, then clean-relaunch
                into a healthy account — no forced swap of policy-flagged ads.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => navigate("/launch2/health")}
          >
            Open Account-Health
          </Button>
        </div>
      )}

      {/* Progress summary */}
      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            label="Live"
            value={formatNumber(live.created)}
            sub="created — counts as launched"
            tone="success"
          />
          <KpiTile
            label="Failed"
            value={formatNumber(live.failed)}
            sub="not counted — failed≠launched"
            tone={live.failed > 0 ? "error" : "default"}
          />
          <KpiTile
            label="Pending"
            value={formatNumber(live.pending)}
            sub="still dispatching"
            tone={live.pending > 0 ? "warning" : "default"}
          />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dispatch progress
            </span>
            <span className="font-g6-mono text-xs text-muted-foreground">
              {live.created}/{live.total} live
            </span>
          </div>
          <ProgressBar progress={live} />
          {launch.status === "launching" && live.pending > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--warning-text))]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#faad14]" />
              Launching — {live.pending} ad{live.pending > 1 ? "s" : ""} still in flight.
            </p>
          )}
          {allGreen && (
            <p className="mt-2 text-xs text-[hsl(var(--success-text))]">
              Complete — every requested ad created. N=N reconciled.
            </p>
          )}
        </div>
      </section>

      {/* Per-entity status tree */}
      <section>
        <SectionHeader
          title="Per-entity status"
          sub="Campaign → ad sets → ads. Failed rows show an attributable reason and retry inline."
          action={
            live.failed > 0 ? (
              <Button variant="outline" size="sm" onClick={retryAll} disabled={retrying}>
                <RotateCcw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
                Retry failed only
              </Button>
            ) : undefined
          }
        />
        {live.failed > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-[#faad14]/40 bg-[#faad14]/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--warning-text))]" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Retry re-dispatches only the failed items</span>{" "}
              under the same idempotency key — the server dedupes, so successful ads are never
              recreated and N stays equal to N. Failures never silently count as launched.
            </p>
          </div>
        )}
        <div className="space-y-3">
          {tree.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="font-g6-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Campaign
                </span>
                <span className="truncate text-sm font-semibold text-foreground">
                  {campaign.name}
                </span>
              </div>
              <div className="space-y-2">
                {campaign.adsets.map((adset) => (
                  <AdSetRow
                    key={adset.id}
                    adset={adset}
                    onRetry={(ad) => retryAds(new Set([ad.id]))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spend rollup — estimate, NO ROAS */}
      <section>
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Daily spend estimate
              </p>
              <p className="text-xs text-muted-foreground">
                {launch.counts.adsets} ad sets × est. {formatCurrency(5)}/day — an estimate, not
                actuals. No performance metrics here by design.
              </p>
            </div>
          </div>
          <span className="font-g6-mono text-lg font-bold tabular-nums text-foreground">
            {formatCurrency(dailyEstimate)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/day est.</span>
          </span>
        </div>
      </section>
    </div>
  );
}
