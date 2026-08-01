/**
 * DigestPreview — "what your next digest would contain right now" (iter-2 P4).
 *
 * Always live: useCreativeData() already folds bucketCounts / kpiSummary /
 * topMovers / fatiguingNow into `buckets` / `kpis` / `movers` / `fatiguing` —
 * the exact same values every other screen in this module shows, recomputed
 * on every render. This is NOT a stored/cached snapshot of a sent digest —
 * there is no real send, so there is no history to show. Every number here
 * is a literal readout of existing selector outputs; nothing is synthesized
 * into a new composite score.
 */
import { TrendingUp, AlertTriangle } from "lucide-react";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import { useCreativeData } from "@/creative-report-v2/hooks/useCreativeData";
import { useDigestConfig } from "@/creative-report-v2/automations/digestStore";
import { BUCKET_LABELS, BUCKETS } from "@/creative-report-v2/lib/paramSchema";
import {
  fmtCompactCurrency,
  fmtMultiple,
  fmtDelta,
  truncate,
  NAME_MAX,
} from "@/creative-report-v2/lib/format";

const CADENCE_NOUN: Record<string, string> = {
  daily: "daily",
  weekly: "weekly",
};

function deltaClass(tone: "up" | "down" | "flat"): string {
  if (tone === "up") return "text-emerald-600 dark:text-emerald-400";
  if (tone === "down") return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

export function DigestPreview() {
  const config = useDigestConfig();
  const { rollups, buckets, kpis, movers, fatiguing: attention } = useCreativeData();

  if (rollups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          No creative data yet — your digest will populate once ads are running.
        </p>
      </div>
    );
  }

  const cadenceNoun = CADENCE_NOUN[config.cadence] ?? config.cadence;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div>
        <h3 className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <WhyDot id="automations.digest.preview" />
          Your {cadenceNoun} digest
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Preview — this is what your next digest would contain right now (nothing is
          actually sent).
        </p>
      </div>

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Spend</p>
          <p className="text-sm font-semibold text-foreground">{fmtCompactCurrency(kpis.spend)}</p>
          <p className={`text-[11px] ${deltaClass(fmtDelta(kpis.spendDeltaPct).tone)}`}>
            {fmtDelta(kpis.spendDeltaPct).label}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Revenue</p>
          <p className="text-sm font-semibold text-foreground">{fmtCompactCurrency(kpis.revenue)}</p>
          <p className={`text-[11px] ${deltaClass(fmtDelta(kpis.revenueDeltaPct).tone)}`}>
            {fmtDelta(kpis.revenueDeltaPct).label}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">ROAS</p>
          <p className="text-sm font-semibold text-foreground">{fmtMultiple(kpis.roas)}</p>
          <p className={`text-[11px] ${deltaClass(fmtDelta(kpis.roasDeltaPct).tone)}`}>
            {fmtDelta(kpis.roasDeltaPct).label}
          </p>
        </div>
      </div>

      {/* Bucket-count strip */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {BUCKETS.map((bucket) => (
          <span key={bucket} className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{buckets[bucket]}</span>{" "}
            {BUCKET_LABELS[bucket]}
          </span>
        ))}
      </div>

      {/* Top movers */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          Top movers
        </p>
        {movers.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted-foreground">No 7-day ROAS swings big enough to surface yet.</p>
        ) : (
          <div className="mt-1.5">
            {movers.map((r) => {
              const { text, truncated } = truncate(r.creative.name, NAME_MAX);
              const delta = fmtDelta(r.roasDeltaPct);
              return (
                <div
                  key={r.creative.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0"
                >
                  <span
                    className="min-w-0 truncate text-xs text-foreground"
                    title={truncated ? r.creative.name : undefined}
                  >
                    {text}
                  </span>
                  <span className={`shrink-0 text-xs font-medium ${deltaClass(delta.tone)}`}>
                    {delta.label} ROAS
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Needs attention */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          Needs attention
        </p>
        {attention.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted-foreground">Nothing fatiguing right now.</p>
        ) : (
          <div className="mt-1.5">
            {attention.map((r) => {
              const { text, truncated } = truncate(r.creative.name, NAME_MAX);
              return (
                <div
                  key={r.creative.id}
                  className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0"
                >
                  <span
                    className="min-w-0 truncate text-xs text-foreground"
                    title={truncated ? r.creative.name : undefined}
                  >
                    {text}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtCompactCurrency(r.metrics.spend)} spend
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
