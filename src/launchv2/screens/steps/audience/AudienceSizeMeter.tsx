/**
 * AudienceSizeMeter — mock estimated reach bar.
 *
 * Shows a horizontal bar (0–100% of "All Adults in India" base = 15M).
 * Reduces by: custom audiences selected, narrow age range, detailed
 * targeting applied, or single-city location.
 *
 * NOTE: All numbers here are approximate mock estimates only.
 * Real reach data requires the Meta Reach Estimate API.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TargetingSpec } from "../../../types";

interface AudienceSizeMeterProps {
  targeting: TargetingSpec;
}

const BASE_REACH = 15_000_000; // All Adults in India (mock)

function calcReach(targeting: TargetingSpec): number {
  let reach = BASE_REACH;

  // Single city location → heavily restricts
  const cityCount = targeting.geoLocations.cities.length;
  const countryCount = targeting.geoLocations.countries.length;
  const hasOnlyOneCity = cityCount === 1 && countryCount === 0 && targeting.geoLocations.regions.length === 0;
  if (hasOnlyOneCity) reach *= 0.1;

  // Custom audiences selected → uses a retargeting slice
  if (targeting.customAudiences.length > 0) reach *= 0.3;

  // Narrow age range (< 20 year span)
  const ageSpan = targeting.ageMax - targeting.ageMin;
  if (ageSpan < 20) reach *= 0.4;

  // Detailed targeting applied
  const hasDetailedTargeting =
    targeting.flexibleSpec.length > 0 &&
    targeting.flexibleSpec.some(
      (g) => g.interests.length > 0 || g.behaviors.length > 0 || g.demographics.length > 0
    );
  if (hasDetailedTargeting) reach *= 0.6;

  return Math.round(reach);
}

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export default function AudienceSizeMeter({ targeting }: AudienceSizeMeterProps) {
  const [displayReach, setDisplayReach] = useState<number | null>(calcReach(targeting));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setUpdating(true);
    setDisplayReach(null);
    const t = setTimeout(() => {
      setDisplayReach(calcReach(targeting));
      setUpdating(false);
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    targeting.geoLocations.countries.length,
    targeting.geoLocations.cities.length,
    targeting.geoLocations.regions.length,
    targeting.customAudiences.length,
    targeting.ageMin,
    targeting.ageMax,
    targeting.flexibleSpec.length,
  ]);

  const pct = displayReach !== null ? Math.min(100, (displayReach / BASE_REACH) * 100) : 0;

  const barColor =
    displayReach === null
      ? "bg-muted"
      : displayReach >= 5_000_000
      ? "bg-green-500"
      : displayReach >= 1_000_000
      ? "bg-yellow-500"
      : "bg-red-500";

  const labelColor =
    displayReach === null
      ? "text-muted-foreground"
      : displayReach >= 5_000_000
      ? "text-green-600 dark:text-green-400"
      : displayReach >= 1_000_000
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          Estimated reach
        </span>
        {updating || displayReach === null ? (
          <span className="h-4 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <span className={cn("text-[13px] font-mono font-semibold tabular-nums", labelColor)}>
            {formatReach(displayReach)} people
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="h-2 w-full rounded-full bg-muted">
        {updating || displayReach === null ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-muted-foreground/20" />
        ) : (
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono text-muted-foreground">Narrow</span>
        <span className="text-[10px] font-mono text-muted-foreground">Broad</span>
      </div>

      <p className="text-[10px] font-mono text-muted-foreground">
        Estimated reach is approximate. Actual reach may vary. Based on mock data — real estimates require Meta Reach API.
      </p>
    </div>
  );
}
