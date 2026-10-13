/** A ranked list with a lime share bar at rest. Used by "Where it works". */
import type { ReactNode } from "react";
import type { RankedItem } from "@/lib/insights-v3/selectors";
import { Hint, TruncatedText, fmtInt } from "@/components/insights-v3/shared";

export function MixList({
  title,
  items,
  basedOn,
  renderLabel,
  emptyText,
  unit,
}: {
  title: string;
  items: RankedItem[];
  basedOn: number;
  renderLabel?: (item: RankedItem) => ReactNode;
  emptyText: string;
  /** Visible unit line under the title, e.g. "share of ads using this hook". */
  unit: string;
}) {
  return (
    <div className="min-w-0">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <p className="text-[11px] text-muted-foreground">Unit: {unit}</p>
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
              <Hint
                content={
                  <>
                    {it.label}: <span className="font-mono tabular-nums">{fmtInt(it.count)}</span> of{" "}
                    <span className="font-mono tabular-nums">{fmtInt(basedOn)}</span> ads (
                    <span className="font-mono tabular-nums">{it.sharePct}%</span>)
                  </>
                }
              >
                <div
                  role="img"
                  tabIndex={0}
                  aria-label={`${it.label}: ${fmtInt(it.count)} of ${fmtInt(basedOn)} ads, ${it.sharePct}%`}
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(2, it.sharePct))}%` }} />
                </div>
              </Hint>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
