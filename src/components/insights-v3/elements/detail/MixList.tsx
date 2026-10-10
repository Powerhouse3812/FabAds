/** A ranked list with a lime share bar at rest. Used by "Where it works". */
import type { ReactNode } from "react";
import type { RankedItem } from "@/lib/insights-v3/selectors";
import { TruncatedText, fmtInt } from "@/components/insights-v3/shared";

export function MixList({
  title,
  items,
  basedOn,
  renderLabel,
  emptyText,
}: {
  title: string;
  items: RankedItem[];
  basedOn: number;
  renderLabel?: (item: RankedItem) => ReactNode;
  emptyText: string;
}) {
  return (
    <div className="min-w-0">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="min-w-0">
              <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  {renderLabel ? renderLabel(it) : <TruncatedText text={it.label} className="text-xs text-foreground" />}
                </div>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                  <span className="text-foreground">{fmtInt(it.count)}</span> · {it.sharePct}%
                </span>
              </div>
              <div
                role="img"
                aria-label={`${it.label}: ${it.sharePct}% of ${fmtInt(basedOn)} ads`}
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/15"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(2, it.sharePct))}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
