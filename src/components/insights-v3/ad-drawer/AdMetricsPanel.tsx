/**
 * Chips + metrics + stats grid.
 *  - Industry + Category chips, New tag, Winner badge (with the engagement mark)
 *  - Metrics: days live, clones, status, and the grouped engagement block
 *  - Stats grid (kept from the old drawer): Category, Spend till now, Ad creation,
 *    Active duration, CTA button, Est. audience size, Impressions, Total reach,
 *    BR reach, EU reach. Missing values read "—" with a "Not reported" tooltip.
 */
import { Building2, Tag } from "lucide-react";
import { getCategory, getIndustry } from "@/lib/insights-v3/data";
import type { Ad } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import {
  ClonesPill,
  DaysLive,
  EngagementGroup,
  Hint,
  NewBadge,
  OverlaySection,
  StatusPill,
  TruncatedText,
  WinnerBadge,
} from "@/components/insights-v3/shared";
import { fmtDate } from "./drawerUtils";

export function AdChipsRow({
  ad,
  isNewAd,
  winner,
  engagementStandout,
}: {
  ad: Ad;
  isNewAd: boolean;
  winner: boolean;
  engagementStandout: boolean;
}) {
  const industry = getIndustry(ad.industryId)?.label ?? ad.industryId;
  const category = getCategory(ad.categoryId)?.label ?? ad.categoryId;
  const chip = "inline-flex max-w-full items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-text";
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Industry, category and badges">
      <span className={chip}>
        <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">Industry: </span>
        <TruncatedText text={industry} className="max-w-[160px]" />
      </span>
      <span className={chip}>
        <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">Category: </span>
        <TruncatedText text={category} className="max-w-[200px]" />
      </span>
      {isNewAd && <NewBadge />}
      {winner && <WinnerBadge engagementStandout={engagementStandout} />}
    </div>
  );
}

export function AdMetricsSection({ ad }: { ad: Ad }) {
  return (
    <OverlaySection title="Metrics">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <DaysLive days={ad.daysLive} />
        <ClonesPill clones={ad.clones} />
        <StatusPill status={ad.status} />
      </div>
      <EngagementGroup engagement={ad.engagement} daysLive={ad.daysLive} className="mt-3" />
    </OverlaySection>
  );
}

function Stat({
  label,
  value,
  emphasis,
  mono,
  chip,
  missingTip = "Not reported",
}: {
  label: string;
  value: string | null;
  emphasis?: boolean;
  mono?: boolean;
  chip?: boolean;
  missingTip?: string;
}) {
  const missing = value === null || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 min-w-0">
        {missing ? (
          <Hint content={missingTip}>
            <span
              tabIndex={0}
              aria-label={`${label}: ${missingTip}`}
              className="inline-block rounded-sm text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              —
            </span>
          </Hint>
        ) : chip ? (
          <span className="inline-flex h-7 max-w-full items-center rounded-md border border-border bg-background px-2.5 text-xs text-foreground">
            <TruncatedText text={value} />
          </span>
        ) : (
          <TruncatedText
            text={value}
            className={cn("text-sm font-medium", mono && "font-mono tabular-nums", emphasis ? "text-primary-text" : "text-foreground")}
          />
        )}
      </dd>
    </div>
  );
}

export function AdStatsGrid({ ad }: { ad: Ad }) {
  const category = getCategory(ad.categoryId)?.label ?? null;
  const created = fmtDate(ad.startedAt);
  const duration = ad.daysLive === null ? null : `${ad.daysLive} ${ad.daysLive === 1 ? "day" : "days"}`;
  const d = ad.delivery;

  return (
    <OverlaySection title="Ad details">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Category" value={category} emphasis />
        <Stat label="Spend till now" value={d.spendTillNow} mono />
        <Stat label="Ad creation" value={created} missingTip="Start date unknown" />
        <Stat label="Active duration" value={duration} mono missingTip="Start date unknown" />
        <Stat label="CTA button" value={ad.ctaLabel} chip />
        <Stat label="Est. audience size" value={d.estAudienceSize} mono />
        <Stat label="Impressions" value={d.impressions} mono />
        <Stat label="Total reach" value={d.totalReach} mono />
        <Stat label="BR reach" value={d.brReach} mono />
        <Stat label="EU reach" value={d.euReach} mono />
      </dl>
    </OverlaySection>
  );
}
