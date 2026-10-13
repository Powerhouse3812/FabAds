/**
 * "Suggested actions" block at the bottom of the AI score breakdown. The rows
 * come from the pure helper in ./scoreActionsModel (weakest scoring parts, worst
 * first, max 3); each names real replacement elements and hands them to Genie.
 * Nothing weak → one positive row. Accent is visible at rest: the CTA is the
 * filled lime UseInGenie button.
 */
import { useMemo } from "react";
import { BadgeAlert, CheckCircle2, Copy, Lightbulb, Timer, type LucideIcon } from "lucide-react";
import { MODULE_NOW } from "@/lib/insights-v3/data";
import type { Ad } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import { deriveAiScoreActions, type ActionKey } from "./scoreActionsModel";

const ICON: Record<ActionKey, LucideIcon> = {
  longevity: Timer,
  clones: Copy,
  craft: Lightbulb,
  "branded-penalty": BadgeAlert,
  strong: CheckCircle2,
};

const SECONDARY_CTA = "border border-border bg-background text-foreground shadow-none hover:bg-muted";

export function AiScoreActions({ ad }: { ad: Ad }) {
  const actions = useMemo(() => deriveAiScoreActions(ad, { now: MODULE_NOW }), [ad]);

  return (
    <section aria-label="Suggested actions" className="mt-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold text-foreground">Suggested actions</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {actions[0]?.key === "strong" ? "Nothing in the score needs fixing." : "From the weakest parts of this score, worst first."}
      </p>

      <ul className="mt-3 space-y-2">
        {actions.map((a, i) => {
          const Icon = ICON[a.key];
          const good = a.key === "strong";
          const first = a.elements[0];
          return (
            <li key={a.key} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                    good ? "border-success-text/30 bg-success-text/10 text-success-text" : "border-warning-text/30 bg-warning-text/10 text-warning-text",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-words text-sm font-medium leading-5 text-foreground">{a.problem}</p>
                  <p className="break-words text-xs leading-5 text-muted-foreground">{a.suggestion}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    {first ? (
                      <div className="min-w-0 max-w-full [&_.inline-flex]:max-w-full">
                        <UseInGenie
                          target={{ type: first.type, id: first.id }}
                          label={`Try “${first.label}” in Genie`}
                          className="max-w-full"
                        />
                      </div>
                    ) : (
                      <UseInGenie
                        target={{ type: "ad", id: ad.id }}
                        action={good ? undefined : "generate-variation"}
                        label={good ? "Use in Genie" : "Create a variation"}
                      />
                    )}
                    {first && i === 0 && (
                      <UseInGenie
                        target={{ type: "ad", id: ad.id }}
                        action="generate-variation"
                        label="Create a variation"
                        className={SECONDARY_CTA}
                      />
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
