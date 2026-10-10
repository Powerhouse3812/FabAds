import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { Engagement } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { fmtInt } from "./format";

const CELLS = [
  { key: "likes", label: "Likes", Icon: Heart },
  { key: "comments", label: "Comments", Icon: MessageCircle },
  { key: "shares", label: "Shares", Icon: Share2 },
] as const;

/**
 * Likes / comments / shares, grouped. "Not reported" when null.
 * Engagement is secondary data: it lives only here, never as a filter or ordering control.
 */
export function EngagementGroup({ engagement, className }: { engagement: Engagement; className?: string }) {
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
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
        Engagement is reported on a minority of ads and is never used for ranking.
      </p>
    </section>
  );
}
