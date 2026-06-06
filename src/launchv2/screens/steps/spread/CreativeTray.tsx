/**
 * CreativeTray — multi-select grid of creatives for the current format.
 * Toggling writes plan.creatives (CreativeRef[]) via flow.patch. Saved ads
 * (Library/Reports) carry their own copy, flagged with a note.
 */
import { Check, ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativeRef } from "../../../types";
import { creativesForFormat } from "../../../data";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { FORMAT_CHIP, FORMAT_ICON } from "./meta";

export default function CreativeTray({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const pool = creativesForFormat(plan.format);
  const selectedIds = new Set(plan.creatives.map((c) => c.id));

  const toggle = (c: CreativeRef) => {
    const next = selectedIds.has(c.id)
      ? plan.creatives.filter((x) => x.id !== c.id)
      : [...plan.creatives, c];
    flow.patch({ creatives: next });
  };

  const remove = (id: string) => flow.patch({ creatives: plan.creatives.filter((c) => c.id !== id) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Creatives</h3>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {plan.creatives.length}/{pool.length} selected
        </span>
      </div>

      {pool.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No creatives match this format yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pool.map((c) => {
            const on = selectedIds.has(c.id);
            const Icon = FORMAT_ICON[c.format];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c)}
                aria-pressed={on}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-2xl border bg-card p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/80 text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-xs font-medium text-foreground">{c.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {FORMAT_CHIP[c.format]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ImageOff className="h-3 w-3 shrink-0" />
        Saved ads from Library / Reports carry their own copy and apply as-is.
      </p>

      {plan.creatives.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
          {plan.creatives.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2 pr-1 text-[11px] font-medium text-foreground"
            >
              <span className="max-w-[140px] truncate">{c.name}</span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                aria-label={`Remove ${c.name}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
