/**
 * WhyDot — the dev-only "why?" affordance for the annotation overlay.
 *
 * Renders NOTHING unless Annotate mode is on AND an annotation exists for the
 * given id (so it's safe to sprinkle liberally — an un-authored id is inert).
 * Click opens the payload popover (touch + keyboard safe); hover previews it
 * on desktop via the popover's own hover handling. Pure presentation — reads
 * the static registry, computes nothing.
 */
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAnnotateMode } from "@/creative-report/annotations/store";
import { getAnnotation } from "@/creative-report/annotations";
import type { BackendCost, Provenance } from "@/creative-report/annotations/types";

const PROVENANCE_LABEL: Record<Provenance, string> = {
  "meta-direct": "Meta-direct",
  "derived-from-meta": "derived · from Meta",
  "ours-only": "ours-only",
};

const PROVENANCE_STYLE: Record<Provenance, string> = {
  "meta-direct": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "derived-from-meta": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "ours-only": "bg-primary/10 text-primary-text border-primary/30",
};

const BACKEND_LABEL: Record<BackendCost, string> = {
  "read-time": "read-time",
  "daily-series": "daily series",
  "batch-rollup": "batch rollup",
  "meta-breakdown-call": "meta breakdown call",
};

const BACKEND_STYLE: Record<BackendCost, string> = {
  "read-time": "text-sky-700 dark:text-sky-300",
  "daily-series": "text-emerald-700 dark:text-emerald-300",
  "batch-rollup": "text-amber-700 dark:text-amber-400",
  "meta-breakdown-call": "text-purple-700 dark:text-purple-300",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-[12px] leading-relaxed">
      <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

export function WhyDot({ id, className }: { id: string; className?: string }) {
  const on = useAnnotateMode();
  if (!on) return null;
  const spec = getAnnotation(id);
  if (!spec) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Why: ${id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-primary-text/70 hover:text-primary-text",
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 space-y-2 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {spec.importance} · {spec.personas.join(", ")}
          </span>
          {spec.provenance && (
            <span
              className={cn(
                "ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                PROVENANCE_STYLE[spec.provenance],
              )}
            >
              {PROVENANCE_LABEL[spec.provenance]}
            </span>
          )}
        </div>
        <Field label="Reason">{spec.reason}</Field>
        <Field label="Impact">{spec.impact}</Field>
        <Field label="When">{spec.whenToAct}</Field>
        <div className="border-t border-border pt-2">
          <Field label="How-to">
            {spec.howTo}
            {spec.backend && (
              <>
                {" "}
                <span className={cn("font-medium", BACKEND_STYLE[spec.backend])}>
                  [{BACKEND_LABEL[spec.backend]}]
                </span>
              </>
            )}
          </Field>
        </div>
      </PopoverContent>
    </Popover>
  );
}
