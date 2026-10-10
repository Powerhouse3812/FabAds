/**
 * "Works well with": elements of OTHER types that show up in the same ads,
 * with counts and lift. This is co-occurrence, not performance, so the copy
 * never ranks a pairing above another.
 */
import type { ElementType } from "@/lib/insights-v3/types";
import type { WorksWellWithGroup } from "@/lib/insights-v3/selectors";
import { ElementChip, Hint, fmtInt } from "@/components/insights-v3/shared";
import { cn } from "@/lib/utils";
import { ELEMENT_NOUN_SINGULAR } from "../constants";

function liftTip(lift: number, thisType: ElementType): string {
  const what = ELEMENT_NOUN_SINGULAR[thisType];
  const how =
    lift >= 1
      ? `Appears together with this ${what} ${lift}× as often as chance alone would predict.`
      : `Appears together with this ${what} only ${lift}× as often as chance alone would predict.`;
  return `${how} Lift compares its share among ads using this ${what} with its share across all ads in scope. It shows co-occurrence, not results.`;
}

function LiftTag({ lift, thisType }: { lift: number; thisType: ElementType }) {
  const high = lift >= 1.2;
  return (
    <Hint content={liftTip(lift, thisType)}>
      <span
        tabIndex={0}
        aria-label={`Lift ${lift} times. ${liftTip(lift, thisType)}`}
        className={cn(
          "inline-flex h-5 cursor-help items-center rounded-full border px-1.5 font-mono text-[11px] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          high ? "border-primary/40 bg-primary/15 text-primary-text" : "border-border bg-muted text-muted-foreground",
        )}
      >
        {lift}× lift
      </span>
    </Hint>
  );
}

export function WorksWellWith({ groups, thisType }: { groups: WorksWellWithGroup[]; thisType: ElementType }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {groups.map((g) => (
        <div key={g.type} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-semibold text-foreground">{g.label}</h4>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{fmtInt(g.basedOn)} ads</span>
          </div>
          {g.items.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
              No ad using this has a {ELEMENT_NOUN_SINGULAR[g.type]} identified.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {g.items.map((it) => (
                <li key={it.id} className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <ElementChip type={g.type} id={it.id} label={it.label} count={it.count} />
                  <LiftTag lift={it.lift} thisType={thisType} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
