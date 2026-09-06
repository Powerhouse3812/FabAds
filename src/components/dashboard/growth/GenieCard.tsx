import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Camera,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Target,
  Video,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/use-credits";
import { InlineMetricRow, type InlineMetric } from "./InlineMetricRow";
import { useBatches } from "@/genie6/lib/genieRunStore";
import { batchStatus, batchDoneCount, type BatchStatus } from "@/genie6/lib/genieRunTypes";

/**
 * GenieCard — self-contained Genie module card for the Growth dashboard
 * (A-12.198). Merges the Genie numeric analytics WITH richer content
 * pulled from the AI-plan dashboard, per Maalik:
 *
 *   Header        — Genie + open-library link
 *   Metrics row   — 5 inline KPIs (InlineMetricRow), mirrors the II card
 *   Credit usage  — compact bar from useCredits() (single source of truth)
 *   Generate      — 6 mode chips → Studio Alpha preset
 *   Recent work   — 3 generations with status pills
 *   Recently synced — brand/product chips
 *
 * Sections separated by hairlines, each compact. Sits in the left half of
 * the dashboard's 2-col Genie | Industry-Insights row.
 */

const GENIE_METRICS: InlineMetric[] = [
  { label: "Total generations", value: "15,004", delta: { value: 4.5 } },
  { label: "Brands synced", value: "18" },
  { label: "Products synced", value: "142" },
  { label: "Categories", value: "12" },
  { label: "On-brand score", value: "87" },
];

const MODES: Array<{ id: string; label: string; icon: LucideIcon; skipGate?: boolean }> = [
  { id: "brand-ad", label: "Brand Ad", icon: Sparkles },
  { id: "product-ad", label: "Product Ad", icon: ShoppingBag },
  { id: "affiliate-ad", label: "Affiliate", icon: Target },
  { id: "product-shoot", label: "Product Shoot", icon: Camera },
  { id: "ugc-video", label: "UGC Video", icon: Video },
  { id: "variation", label: "Variations", icon: RefreshCw, skipGate: true },
];

const RECENTLY_SYNCED: Array<{ name: string; type: "brand" | "product" | "category" }> = [
  { name: "Mamaearth", type: "brand" },
  { name: "Onion Shampoo", type: "product" },
  { name: "Skincare", type: "category" },
  { name: "Noise", type: "brand" },
];

const TYPE_DOT: Record<"brand" | "product" | "category", string> = {
  brand: "bg-primary",
  product: "bg-sky-500",
  category: "bg-amber-500",
};

/** §7.7 — Genie's own card, updating with new data straight from the run
 *  store (the same store Other Flows/Other Apps write to — §8: one store,
 *  per-app history is a view not a fork). Status pill colours per BatchStatus. */
const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  running: "Running",
  done: "Done",
  failed: "Failed",
  partial: "Partial",
  cancelled: "Cancelled",
};

const BATCH_STATUS_CLASS: Record<BatchStatus, string> = {
  running: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  done: "border-primary/30 bg-primary/10 text-foreground/80",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  partial: "border-border bg-muted text-muted-foreground",
  cancelled: "border-border bg-muted text-muted-foreground",
};

export function GenieCard() {
  const { used, limit } = useCredits();
  const remaining = Math.max(limit - used, 0);
  const pct = Math.min(100, Math.round((used / limit) * 100));

  // Newest first (contract) — batches[0] IS "the latest batch". Separately
  // track whether anything is actively running so the card can call that out
  // even when the latest batch itself already finished (e.g. a retry kicked
  // off on an older batch).
  const batches = useBatches();
  const latestBatch = batches[0];
  const latestStatus = latestBatch ? batchStatus(latestBatch) : null;
  const runningBatch = batches.find((b) => batchStatus(b) === "running");
  const firstOutputId = latestBatch?.items.find((i) => i.outputId)?.outputId;

  return (
    <section
      data-fabads-dash-card="genie"
      aria-label="Genie"
      className="flex flex-col gap-3.5 rounded-2xl border border-border/60 bg-card p-4"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
            Genie
          </h3>
        </div>
        <Link
          to="/iq/genie6/library"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open library
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Latest batch — §7.7 "Genie gets its own card/section on the
          Dashboard, which updates with new data": reads live from
          useBatches() (latest batch, status, output count, credits, Created
          By — §17) rather than a static number. State coverage: zero (no
          batches yet), populated (a finished/partial/failed batch), and a
          running indicator layered on top when something is actively
          generating — even if that's a different, older batch than the
          latest one shown. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Latest batch
          </span>
          {runningBatch && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sky-700 dark:text-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" aria-hidden />
              {runningBatch.label} running
            </span>
          )}
        </div>

        {!latestBatch || !latestStatus ? (
          <p className="text-[12px] text-muted-foreground">
            No generations yet — pick a mode below to start your first.
          </p>
        ) : (
          <Link
            to={firstOutputId ? `/iq/genie6/library?ad=${firstOutputId}` : "/iq/genie6/library"}
            className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-2 transition-colors hover:border-primary/40"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  {latestBatch.batchId}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0 font-mono text-[9px] font-medium uppercase tracking-wider",
                    BATCH_STATUS_CLASS[latestStatus],
                  )}
                >
                  {BATCH_STATUS_LABEL[latestStatus]}
                </span>
              </div>
              <p className="truncate text-[11.5px] text-foreground/80">{latestBatch.label}</p>
              {/* §17 — outputs carry "Created By"; shown at the batch level
                  here since that's the grain this card summarises at. */}
              <p className="font-mono text-[10px] text-muted-foreground">
                {batchDoneCount(latestBatch)} outputs · {latestBatch.credits} credits · by{" "}
                {latestBatch.createdBy}
              </p>
            </div>
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              aria-hidden
            />
          </Link>
        )}
      </div>

      {/* Metrics row */}
      <InlineMetricRow metrics={GENIE_METRICS} />

      {/* Credit usage */}
      <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Credit usage
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{used.toLocaleString()}</span>
            {" / "}
            {limit.toLocaleString()} · {remaining.toLocaleString()} left
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Generate — mode chips */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Generate · pick a mode
          </span>
          <Link
            to="/iq/genie6/studio-alpha"
            className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const href = `/iq/genie6/studio-alpha?mode=${m.id}${m.skipGate ? "&skipGate=1" : ""}`;
            return (
              <Link
                key={m.id}
                to={href}
                className={cn(
                  "group inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5",
                  "text-[11.5px] font-medium text-foreground transition-all",
                  "hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.04]",
                )}
              >
                <Icon className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" strokeWidth={1.75} aria-hidden />
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recently synced */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Recently synced
        </span>
        <div className="flex flex-wrap gap-1.5">
          {RECENTLY_SYNCED.map((s) => (
            <Link
              key={s.name}
              to="/catalogue/brands"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2 py-0.5",
                "text-[11px] text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TYPE_DOT[s.type])} />
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
