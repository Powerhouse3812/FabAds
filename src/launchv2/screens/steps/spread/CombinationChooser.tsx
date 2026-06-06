/**
 * CombinationChooser — only shown when there's loose multi-media AND multi-text
 * (>1 creative + >1 primary-text variant, where the shared text counts as one).
 * Offers All-combo vs Paired, each with the resulting ad-count, 250-cap headroom
 * delta, and a mini example of how it builds — before committing.
 */
import { GitMerge, Grid2x2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CombinationMode } from "../../../types";
import { MAX_ADS_PER_PAGE } from "../../../types";
import { perPageDemand } from "../../../deriveV2";
import type { UseFlowV2 } from "../../../state/useFlowV2";

/** The text-variant count: shared primary (1) + each non-empty variation. */
export function textVariantCount(flow: UseFlowV2): number {
  const v = (flow.plan.adCopy.textVariations ?? []).filter((t) => t.trim().length > 0);
  return 1 + v.length;
}

/** When the chooser is relevant: loose creatives (>1) AND multi-text (>1). */
export function showCombination(flow: UseFlowV2): boolean {
  return flow.plan.creatives.length > 1 && textVariantCount(flow) > 1;
}

export default function CombinationChooser({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const media = plan.creatives.length;
  const texts = textVariantCount(flow);

  // Worst-case page headroom (max current across pages), to show a realistic delta.
  const pages = perPageDemand(plan);
  const worstCurrent = pages.reduce((m, p) => Math.max(m, p.current), 0);

  const options: { id: CombinationMode; label: string; icon: typeof GitMerge; ads: number; blurb: string; example: string }[] = [
    {
      id: "all",
      label: "All combinations",
      icon: Grid2x2,
      ads: media * texts,
      blurb: "Every creative paired with every text.",
      example: `${media} media × ${texts} text`,
    },
    {
      id: "paired",
      label: "Paired",
      icon: GitMerge,
      ads: Math.max(media, texts),
      blurb: "Zip media to text 1:1 (cycles the shorter list).",
      example: `${media} media ↔ ${texts} text`,
    },
  ];

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">How media × text combine</h3>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {media} media · {texts} text
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = plan.combination === o.id;
          const Icon = o.icon;
          const projected = worstCurrent + o.ads;
          const over = projected > MAX_ADS_PER_PAGE;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => flow.patch({ combination: o.id })}
              aria-pressed={on}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon className={cn("h-4 w-4", on ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-medium text-foreground">{o.label}</span>
              </span>
              <p className="text-[11px] leading-snug text-muted-foreground">{o.blurb}</p>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{o.example}</span>
              <div className="mt-0.5 flex items-center justify-between border-t border-border pt-1.5">
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{o.ads} ads</span>
                <span className={cn("font-mono text-[10px] tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>
                  {projected}/{MAX_ADS_PER_PAGE}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
