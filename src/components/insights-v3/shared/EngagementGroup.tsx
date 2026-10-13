import { useId, useState } from "react";
import { ChevronDown, Heart, MessageCircle, Share2, TriangleAlert } from "lucide-react";
import type { Engagement } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { fmtInt } from "./format";

const CELLS = [
  { key: "likes", label: "Likes", Icon: Heart },
  { key: "comments", label: "Comments", Icon: MessageCircle },
  { key: "shares", label: "Shares", Icon: Share2 },
] as const;

function per100(part: number | null, whole: number | null): string | null {
  if (part == null || whole == null || whole <= 0) return null;
  const v = (part / whole) * 100;
  return v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, "");
}

/**
 * Likes / comments / shares, grouped, plus the numbers derived from them. Collapsible: starts open when the ad
 * reports any engagement. An ad that reports none gets a disabled header and a warning instead: never empty cells.
 * A partially reported ad shows only the metrics it has (a reported 0 is a number and stays).
 * Cards only SIGNAL that an ad reports engagement; the full counts and these KPIs live here.
 * My Feeds may sort by it, with a warning that not every ad has it.
 */
export function EngagementGroup({
  engagement,
  daysLive,
  className,
}: {
  engagement: Engagement;
  /** Enables "per day live". Null/0 hides it (a start date we don't have is never invented). */
  daysLive?: number | null;
  className?: string;
}) {
  const bodyId = useId();
  const warnId = useId();
  const [open, setOpen] = useState(true);
  const reported = [engagement.likes, engagement.comments, engagement.shares].filter((v): v is number => v != null);
  const hasData = reported.length > 0;
  const expanded = hasData && open;
  const total = hasData ? reported.reduce((a, b) => a + b, 0) : null;
  const perDay = total != null && daysLive && daysLive > 0 ? total / daysLive : null;
  const kpis = [
    { label: "Total engagements", value: total != null ? fmtInt(total) : null, tip: "Likes + comments + shares that this ad reports." },
    {
      label: "Per day live",
      value: perDay != null ? (perDay >= 10 ? fmtInt(Math.round(perDay)) : perDay.toFixed(1)) : null,
      tip: "Total engagements divided by days live.",
    },
    { label: "Comments per 100 likes", value: per100(engagement.comments, engagement.likes), tip: "How much conversation each 100 likes starts." },
    { label: "Shares per 100 likes", value: per100(engagement.shares, engagement.likes), tip: "How often people share it compared with liking it." },
  ].filter((k) => k.value != null);
  const cells = CELLS.filter(({ key }) => engagement[key] != null);
  return (
    <section aria-label="Engagement" className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <button
        type="button"
        disabled={!hasData}
        aria-expanded={expanded}
        aria-controls={hasData ? bodyId : undefined}
        aria-describedby={hasData ? undefined : warnId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "-mx-1 flex min-h-[32px] w-[calc(100%+0.5rem)] items-center gap-1.5 rounded-md px-1 text-left text-xs font-semibold sm:min-h-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hasData ? "cursor-pointer text-foreground hover:bg-accent" : "cursor-default text-muted-foreground",
        )}
      >
        {hasData && (
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-primary-text transition-transform", !expanded && "-rotate-90")}
            aria-hidden="true"
          />
        )}
        Engagement
        {hasData && <span className="sr-only">{expanded ? " — collapse" : " — expand"}</span>}
      </button>

      {!hasData && (
        <p id={warnId} className="mt-1 flex items-start gap-1.5 text-xs leading-4 text-warning-text">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>No engagement data for this ad.</span>
        </p>
      )}

      {hasData && (
        <div id={bodyId} hidden={!expanded}>
          <dl className="mt-2 grid grid-cols-3 gap-2">
            {cells.map(({ key, label, Icon }) => (
              <div key={key} className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </dt>
                <dd className="mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-foreground">
                  {fmtInt(engagement[key] as number)}
                </dd>
              </div>
            ))}
          </dl>
          {kpis.length > 0 && (
            <dl aria-label="Engagement KPIs" className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 sm:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} title={k.tip} className="min-w-0">
                  <dt className="truncate text-xs text-muted-foreground">{k.label}</dt>
                  <dd className="mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-foreground">{k.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Only some ads report engagement.</p>
        </div>
      )}
    </section>
  );
}
