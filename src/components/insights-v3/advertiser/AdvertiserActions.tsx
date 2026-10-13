/**
 * "Suggested actions" for a Competitor: same block as the ad drawer's AiScoreActions (icon tile,
 * what we see, suggestion, lime Genie button), but the rows come from the pure helper in
 * ./advertiserActionsModel (max 3). Accent is visible at rest: the CTA is the filled lime
 * UseInGenie button. Nothing to suggest → one muted row.
 */
import { useMemo } from "react";
import { Info, Lightbulb, Timer, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import type { Ad } from "@/lib/insights-v3/types";
import type { AdvertiserDetail } from "@/lib/insights-v3/selectors";
import { cn } from "@/lib/utils";
import { UseInGenie } from "../genie/UseInGenie";
import { deriveAdvertiserActions, type AdvertiserActionKey } from "./advertiserActionsModel";

const ICON: Record<AdvertiserActionKey, LucideIcon> = {
  rising: TrendingUp,
  element: Lightbulb,
  winner: Trophy,
  longest: Timer,
  none: Info,
};

const SECONDARY_CTA = "border border-border bg-background text-foreground shadow-none hover:bg-muted";

export function AdvertiserActions({ detail, ads }: { detail: AdvertiserDetail; ads: Ad[] }) {
  const actions = useMemo(() => deriveAdvertiserActions(detail, ads), [detail, ads]);
  const empty = actions[0]?.key === "none";

  return (
    <section aria-label="Suggested actions" className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Suggested actions</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {empty ? "Suggestions appear when this competitor has enough ads in scope." : "What to try in Genie, based on this competitor's ads."}
      </p>

      <ul className="mt-3 space-y-2">
        {actions.map((a) => {
          const Icon = ICON[a.key];
          const muted = a.key === "none";
          return (
            <li key={a.key} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                    muted ? "border-border bg-muted text-muted-foreground" : "border-warning-text/30 bg-warning-text/10 text-warning-text",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={cn("break-words text-sm font-medium leading-5", muted ? "text-muted-foreground" : "text-foreground")}>{a.seen}</p>
                  {!muted && <p className="break-words text-xs leading-5 text-muted-foreground">{a.suggestion}</p>}
                  {a.cta && (
                    <div className="flex flex-wrap items-center gap-2 pt-1.5">
                      <div className="min-w-0 max-w-full [&_.inline-flex]:max-w-full">
                        <UseInGenie target={a.cta.target} action={a.cta.action} label={a.cta.label} className="max-w-full" />
                      </div>
                      {a.secondary && (
                        <UseInGenie target={a.secondary.target} action={a.secondary.action} label={a.secondary.label} className={SECONDARY_CTA} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
