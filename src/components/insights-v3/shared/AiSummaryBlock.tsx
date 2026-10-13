import { Sparkles } from "lucide-react";
import type { AiSummary } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { BasedOnNote } from "./BasedOnNote";
import { DisabledSection } from "./DisabledSection";

export interface AiSummaryBlockProps {
  summary: AiSummary;
  title?: string;
  /** When set the block renders as a DisabledSection with this reason. */
  disabledReason?: string;
  className?: string;
}

/**
 * Lime-tinted at rest (like the live app's "AI Strategy Summary").
 * Always ends with "Based on {n} ads". Copy must never present "most common" as "best".
 */
export function AiSummaryBlock({ summary, title = "AI summary", disabledReason, className }: AiSummaryBlockProps) {
  if (disabledReason) {
    return <DisabledSection title={title} reason={disabledReason} className={className} />;
  }
  return (
    <section
      aria-label={title}
      className={cn("flex h-full flex-col rounded-xl border border-primary/30 bg-primary/10 p-4", className)}
    >
      <header className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </header>
      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{summary.text}</p>
      <BasedOnNote ads={summary.ads} className="mt-auto pt-3" />
    </section>
  );
}
