import { AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthDot } from "@/launch2/components";
import { CapMeter } from "@/launch2/components";
import type { AdAccount, Page } from "@/launch2/types";

/**
 * Account-health strip — one horizontal card summarizing account health
 * counts (healthy / review / restricted) plus the tightest cap headroom
 * across Pages. Whole strip is clickable → Account-Health.
 *
 * Reliability spine: account survival is a first-class signal. If anything
 * is restricted we surface a warning line rather than burying it.
 */
export function AccountHealthStrip({
  accounts,
  pages,
  onClick,
  className,
}: {
  accounts: AdAccount[];
  pages: Page[];
  onClick?: () => void;
  className?: string;
}) {
  const counts = accounts.reduce(
    (acc, a) => {
      acc[a.health] += 1;
      return acc;
    },
    { healthy: 0, review: 0, restricted: 0 } as Record<AdAccount["health"], number>,
  );

  // Tightest cap headroom: the Page with the least (capLimit - adCount).
  const tightest = pages.reduce<Page | null>((min, p) => {
    if (!min) return p;
    return p.capLimit - p.adCount < min.capLimit - min.adCount ? p : min;
  }, null);

  const restricted = accounts.filter((a) => a.health === "restricted");
  const hasRestricted = restricted.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        {/* Account health counts */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Account health
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <HealthCount status="healthy" n={counts.healthy} label="healthy" />
            {counts.review > 0 && <HealthCount status="review" n={counts.review} label="in review" />}
            {counts.restricted > 0 && (
              <HealthCount status="restricted" n={counts.restricted} label="restricted" />
            )}
          </div>
        </div>
      </div>

        {/* Tightest cap headroom */}
        {tightest && (
          <div className="w-full shrink-0 border-t border-border pt-3 sm:w-56 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tightest cap
              </p>
              <span className="truncate pl-2 text-[11px] text-muted-foreground" title={tightest.name}>
                {tightest.name}
              </span>
            </div>
            <CapMeter current={tightest.adCount} limit={tightest.capLimit} className="mt-2" />
          </div>
        )}

        <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
      </div>

      {/* Restriction warning — surfaced, never buried */}
      {hasRestricted && (
        <div className="flex items-start gap-2 rounded-md bg-[#ff4d4f]/10 px-3 py-2 text-xs text-[hsl(var(--error-text))]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {restricted.length} account{restricted.length > 1 ? "s" : ""} restricted — recover before
            launching. {restricted[0]?.note}
          </span>
        </div>
      )}
    </button>
  );
}

function HealthCount({
  status,
  n,
  label,
}: {
  status: AdAccount["health"];
  n: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <HealthDot status={status} />
      <span className="font-g6-mono text-sm font-semibold tabular-nums text-foreground">{n}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
