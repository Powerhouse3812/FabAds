/**
 * LaunchHistory — full run ledger for Launch v2.
 *
 * Layout: page title → 5 KPI tiles → search input → runs table.
 * Covers: populated, partial (in-progress runs), and zero-data states.
 * Both light and dark modes throughout.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRunsV2 } from "../../hooks/useRunsV2";
import { formatRelative } from "@/launch2/utils/time";
import type { RunStatus } from "../../types";

/* ── Status pill colours (mirrors LaunchV2Detail's StatusPill exactly) ─────── */
const STATUS_META: Record<
  RunStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  launching: {
    label: "Launching",
    color: "#5B7611",
    bg: "rgba(143,184,33,0.10)",
    border: "rgba(143,184,33,0.30)",
  },
  completed: {
    label: "Completed",
    color: "#237804",
    bg: "rgba(82,196,26,0.10)",
    border: "rgba(82,196,26,0.30)",
  },
  partial: {
    label: "Partial",
    color: "#874d00",
    bg: "rgba(250,173,20,0.10)",
    border: "rgba(250,173,20,0.30)",
  },
  failed: {
    label: "Failed",
    color: "#cf1322",
    bg: "rgba(255,77,79,0.10)",
    border: "rgba(255,77,79,0.30)",
  },
  scheduled: {
    label: "Scheduled",
    color: "#1554ad",
    bg: "rgba(22,119,255,0.10)",
    border: "rgba(22,119,255,0.30)",
  },
  queued: {
    label: "Queued",
    color: "rgba(15,15,12,0.55)",
    bg: "rgba(15,15,12,0.06)",
    border: "rgba(15,15,12,0.18)",
  },
  stale: {
    label: "Stale",
    color: "rgba(15,15,12,0.45)",
    bg: "rgba(15,15,12,0.06)",
    border: "rgba(15,15,12,0.15)",
  },
};

/* Dark-mode overrides for status text/bg/border */
const STATUS_META_DARK: Partial<
  Record<RunStatus, { color: string; bg: string; border: string }>
> = {
  launching: {
    color: "#C3E165",
    bg: "rgba(143,184,33,0.12)",
    border: "rgba(143,184,33,0.32)",
  },
  completed: {
    color: "#49aa19",
    bg: "rgba(82,196,26,0.10)",
    border: "rgba(82,196,26,0.28)",
  },
  partial: {
    color: "#d89614",
    bg: "rgba(250,173,20,0.10)",
    border: "rgba(250,173,20,0.28)",
  },
  failed: {
    color: "#f37370",
    bg: "rgba(255,77,79,0.10)",
    border: "rgba(255,77,79,0.28)",
  },
  scheduled: {
    color: "#4096ff",
    bg: "rgba(22,119,255,0.10)",
    border: "rgba(22,119,255,0.28)",
  },
  queued: {
    color: "rgba(255,255,255,0.45)",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.15)",
  },
  stale: {
    color: "rgba(255,255,255,0.35)",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.12)",
  },
};

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: RunStatus }) {
  const m = STATUS_META[status];
  const pulse = status === "launching";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.06em]"
      style={{
        color: m.color,
        backgroundColor: m.bg,
        border: `1px solid ${m.border}`,
      }}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          pulse && "animate-pulse"
        )}
        style={{ backgroundColor: m.color }}
      />
      {m.label}
    </span>
  );
}

/* ── KPI tile ────────────────────────────────────────────────────────────── */
interface KpiTileProps {
  label: string;
  value: string;
  valueTone?: "default" | "danger";
  subtext?: string;
}
function KpiTile({ label, value, valueTone = "default", subtext }: KpiTileProps) {
  return (
    <div className="rounded-2xl border border-[#e7e5dc] bg-[#FAFAF7] p-4 dark:border-[#2a2a2a] dark:bg-[#18181B]">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tabular-nums leading-none",
          valueTone === "danger"
            ? "text-[#cf1322] dark:text-[#f37370]"
            : "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
        )}
      >
        {value}
      </p>
      {subtext && (
        <p className="mt-1 font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
          {subtext}
        </p>
      )}
    </div>
  );
}

/* ── Table header cell ───────────────────────────────────────────────────── */
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.08em]",
        "text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]",
        className
      )}
    >
      {children}
    </th>
  );
}

/* ── Zero-data state ─────────────────────────────────────────────────────── */
function EmptyState() {
  const navigate = useNavigate();
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-[#e7e5dc] px-8 py-20 text-center dark:border-[#2a2a2a]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(143,184,33,0.06) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09]">
        <Rocket className="h-5 w-5 text-[#5B7611] dark:text-[#C3E165]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
          No launches yet
        </h3>
        <p className="mx-auto max-w-xs font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          Your launch history will appear here after your first campaign goes live.
        </p>
      </div>
      <button
        onClick={() => navigate("/launchv2/new")}
        className={cn(
          "rounded-full bg-[#8FB821] px-5 py-2 text-[13px] font-medium text-[#121212]",
          "transition-all duration-150 hover:bg-[#AACF32] active:translate-y-px",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(143,184,33,0.35)]"
        )}
      >
        Start a launch
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function LaunchHistory() {
  const navigate = useNavigate();
  const { runs, kpis } = useRunsV2();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? runs.filter((r) =>
        r.name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : runs;

  /* Formatted KPI values */
  const successRateStr = isNaN(kpis.successRate)
    ? "—"
    : `${kpis.successRate.toFixed(1)}%`;

  const lastLaunchStr = kpis.lastLaunchAt
    ? formatRelative(kpis.lastLaunchAt)
    : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-6">
      {/* ── Page title row ─────────────────────────────────────────────── */}
      <div className="space-y-0.5">
        <h1 className="text-[29px] font-bold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
          Launch History
        </h1>
        <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          All runs — live, completed, scheduled, and archived
        </p>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <KpiTile label="Total launches" value={String(kpis.totalLaunches)} />
        <KpiTile
          label="Success rate"
          value={successRateStr}
          subtext={
            !isNaN(kpis.successRate)
              ? `${runs.filter((r) => r.status === "completed" || r.status === "partial").length} of ${runs.filter((r) => ["completed", "partial", "failed", "stale"].includes(r.status)).length} terminal`
              : undefined
          }
        />
        <KpiTile
          label="Ads created"
          value={kpis.adsCreated.toLocaleString()}
          subtext="across all runs"
        />
        <KpiTile
          label="Ads failed"
          value={kpis.adsFailed.toLocaleString()}
          valueTone={kpis.adsFailed > 0 ? "danger" : "default"}
          subtext={kpis.adsFailed > 0 ? "not launched on Meta" : undefined}
        />
        <KpiTile label="Last launch" value={lastLaunchStr} />
      </div>

      {/* ── Runs table card ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#e7e5dc] bg-[#FAFAF7] dark:border-[#2a2a2a] dark:bg-[#18181B]">
        {/* Search bar */}
        <div className="border-b border-[#efeee7] px-4 py-3 dark:border-[#1f1f1f]">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.35)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search launches…"
              className={cn(
                "w-full rounded-full border border-[#e7e5dc] bg-transparent pl-9 pr-4 py-2",
                "font-mono text-[12px] text-[rgba(15,15,12,0.92)] placeholder:text-[rgba(15,15,12,0.35)]",
                "outline-none transition-all duration-150",
                "hover:border-[#8FB821]",
                "focus:border-[#8FB821] focus:ring-4 focus:ring-[rgba(143,184,33,0.18)]",
                "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.92)]",
                "dark:placeholder:text-[rgba(255,255,255,0.30)]",
                "dark:hover:border-[#90BA24] dark:focus:border-[#90BA24]",
                "dark:focus:ring-[rgba(144,186,36,0.20)]"
              )}
            />
          </div>
        </div>

        {/* Table or empty */}
        {filtered.length === 0 ? (
          <div className="p-6">
            {runs.length === 0 ? (
              <EmptyState />
            ) : (
              /* Search produced no results */
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-[13px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                  No launches match <span className="font-medium">"{query}"</span>
                </p>
                <button
                  onClick={() => setQuery("")}
                  className="font-mono text-[11px] text-[#5B7611] underline underline-offset-2 dark:text-[#C3E165]"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#efeee7] bg-[#F0F0EC] dark:border-[#1f1f1f] dark:bg-[#1B1B1F]">
                  <Th className="pl-5">Launch</Th>
                  <Th>Status</Th>
                  <Th>Ads</Th>
                  <Th>Budget / day</Th>
                  <Th className="pr-5">When</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((run, i) => {
                  const isLast = i === filtered.length - 1;
                  const fullDate = new Date(run.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                  const budgetStr = `$${run.budgetPerDay.toFixed(2)}`;

                  return (
                    <tr
                      key={run.id}
                      onClick={() => navigate(`/launchv2/${run.id}`)}
                      className={cn(
                        "group cursor-pointer transition-colors duration-100",
                        "hover:bg-[#f7f7f4] dark:hover:bg-[#1f1f23]",
                        !isLast &&
                          "border-b border-[#efeee7] dark:border-[#1f1f1f]"
                      )}
                    >
                      {/* Launch name */}
                      <td className="max-w-[240px] truncate py-3 pl-5 pr-3">
                        <span
                          className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] group-hover:text-[#5B7611] dark:text-[rgba(255,255,255,0.92)] dark:group-hover:text-[#C3E165] transition-colors duration-100"
                          title={run.name}
                        >
                          {run.name}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-3 pr-4">
                        <StatusBadge status={run.status} />
                      </td>

                      {/* Ads: created / requested */}
                      <td className="py-3 pr-4">
                        <span className="font-mono text-[12px] tabular-nums">
                          <span
                            className={
                              run.created > 0
                                ? "text-[#237804] dark:text-[#49aa19]"
                                : "text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.35)]"
                            }
                          >
                            {run.created}
                          </span>
                          <span className="text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.25)]">
                            {" / "}
                          </span>
                          <span className="text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.55)]">
                            {run.requested}
                          </span>
                        </span>
                      </td>

                      {/* Budget per day */}
                      <td className="py-3 pr-4">
                        <span className="font-mono text-[12px] tabular-nums text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.55)]">
                          {budgetStr}
                        </span>
                      </td>

                      {/* When — relative + full date tooltip */}
                      <td className="py-3 pr-5">
                        <span
                          title={fullDate}
                          className="cursor-default font-mono text-[12px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.35)]"
                        >
                          {formatRelative(run.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Row count footer */}
            <div className="border-t border-[#efeee7] px-5 py-2.5 dark:border-[#1f1f1f]">
              <p className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.35)]">
                {filtered.length === runs.length
                  ? `${runs.length} launch${runs.length !== 1 ? "es" : ""} total`
                  : `${filtered.length} of ${runs.length} launches`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
