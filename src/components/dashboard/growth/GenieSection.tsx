import { Link } from "react-router-dom";
import { ArrowUpRight, Wand2 } from "lucide-react";
import { AnalyticsHeroGenieRow } from "@/components/dashboard/ai-plan/AnalyticsHero";
import { ModeLauncherBar } from "@/components/dashboard/ai-plan/ModeLauncherBar";

/**
 * GenieSection — Growth dashboard section that surfaces the AI-plan
 * Genie workspace. Composed almost entirely of AI-plan components reused
 * as-is (Maalik A-12.195 — numeric analytics are the more important
 * data than recent generations).
 *
 * Order is deliberate (most-important → least):
 *
 *   1. AnalyticsHeroGenieRow — 4 KPI cards (Generations / Brands /
 *      Products / Categories) with sparkline + delta chips. This is
 *      what the dashboard exists for: at-a-glance state of the Genie
 *      side of the business.
 *
 *   2. ModeLauncherBar — 6 mode pills, click → Studio Alpha preset.
 *      Stays second because "what's happening" beats "start something"
 *      on a dashboard glance.
 *
 * Dropped from the previous version:
 *   - RecentWorkStrip (browse-y; Library already serves this)
 *
 * Avoids the card-in-card anti-pattern: each child is already a
 * self-contained card; the section wrapper is a header bar + a
 * vertical stack only.
 */
export function GenieSection() {
  return (
    <section
      data-fabads-dash-section="genie"
      aria-label="Genie workspace analytics"
      className="flex min-w-0 flex-col gap-3"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Wand2 className="h-4 w-4 text-foreground" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Genie
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            · workspace at a glance
          </span>
        </div>
        <Link
          to="/iq/genie6/library"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open library
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="flex flex-col gap-3">
        <AnalyticsHeroGenieRow />
        <ModeLauncherBar />
      </div>
    </section>
  );
}
