import { Heart, MessageCircle, Share2 } from "lucide-react";
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
 * Likes / comments / shares, grouped, plus the numbers derived from them. "Not reported" when null.
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
  const reported = [engagement.likes, engagement.comments, engagement.shares].filter((v): v is number => v != null);
  const total = reported.length ? reported.reduce((a, b) => a + b, 0) : null;
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
  return (
    <section aria-label="Engagement" className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <h4 className="text-xs font-semibold text-foreground">Engagement</h4>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        {CELLS.map(({ key, label, Icon }) => {
          const v = engagement[key];
          return (
            <div key={key} className="min-w-0">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </dt>
              <dd
                className={cn(
                  "mt-0.5 truncate text-sm",
                  v === null ? "italic text-muted-foreground" : "font-mono font-semibold tabular-nums text-foreground",
                )}
              >
                {v === null ? "Not reported" : fmtInt(v)}
              </dd>
            </div>
          );
        })}
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
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
        Only some ads report engagement. A missing number means “not reported”, not zero.
      </p>
    </section>
  );
}
