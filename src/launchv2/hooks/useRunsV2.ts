import { useMemo } from "react";
import { useLaunchV2, useLaunchV2Version } from "../state/LaunchV2Context";
import { loadRuns } from "../services/runsService";
import type { LaunchRunV2, RunStatus } from "../types";

export interface RunsKpis {
  totalLaunches: number;
  successRate: number;      // 0–100, NaN if no terminal runs
  adsCreated: number;
  adsFailed: number;
  lastLaunchAt: string | null;   // ISO string or null
  failureBreakdown: Record<string, number>;  // { code → count }
}

export function useRunsV2(): { runs: LaunchRunV2[]; kpis: RunsKpis } {
  const service = useLaunchV2();
  const version = useLaunchV2Version();

  return useMemo(() => {
    // Live in-memory runs (may be empty on fresh page load)
    const live = service.listRuns();
    // Persisted history from localStorage (the multi-run ledger)
    const stored = loadRuns();

    // Merge: prefer in-memory (live) over stored for same id
    const byId = new Map<string, LaunchRunV2>();
    stored.forEach((r) => byId.set(r.id, r));
    live.forEach((r) => byId.set(r.id, r));       // live wins

    const runs = [...byId.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // KPI computation — terminal statuses only (not "launching" or "queued")
    const TERMINAL: RunStatus[] = ["completed", "partial", "failed", "stale"];
    const terminal = runs.filter((r) => TERMINAL.includes(r.status));
    const successful = terminal.filter((r) => r.status === "completed" || r.status === "partial");

    const adsCreated = runs.reduce((sum, r) => sum + r.created, 0);
    const adsFailed = runs.reduce((sum, r) => sum + r.failed, 0);
    const lastLaunchAt = runs[0]?.createdAt ?? null;

    // Failure breakdown by code
    const failureBreakdown: Record<string, number> = {};
    runs.forEach((r) => {
      r.units
        .filter((u) => u.status === "failed" && u.failure?.code)
        .forEach((u) => {
          const code = u.failure!.code;
          failureBreakdown[code] = (failureBreakdown[code] ?? 0) + 1;
        });
    });

    const kpis: RunsKpis = {
      totalLaunches: runs.length,
      successRate: terminal.length === 0 ? NaN : (successful.length / terminal.length) * 100,
      adsCreated,
      adsFailed,
      lastLaunchAt,
      failureBreakdown,
    };

    return { runs, kpis };
  }, [service, version]);
}
