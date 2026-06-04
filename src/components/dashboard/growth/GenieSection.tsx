import { Link } from "react-router-dom";
import { ArrowUpRight, Wand2 } from "lucide-react";
import { ModeLauncherBar } from "@/components/dashboard/ai-plan/ModeLauncherBar";
import { RecentWorkStrip } from "@/components/dashboard/ai-plan/RecentWorkStrip";

/**
 * GenieSection — Growth dashboard section that surfaces the AI-plan
 * Genie workspace activity. Composed almost entirely of AI-plan
 * components reused as-is (Maalik A-12.194 — "components reuse ho ske,
 * atleast kuchh % hi sahi"). Two reuse blocks under one section header:
 *
 *   1. ModeLauncherBar  — 6 mode pills, click → Studio Alpha preset
 *   2. RecentWorkStrip  — 4 recent-output thumbnails (mode-aware mocks)
 *
 * Avoids the card-in-card anti-pattern: each child carries its own
 * rounded-2xl border, so the section wrapper is just a header bar +
 * a vertical stack. The header is what visually groups them under
 * "Genie" — no outer card, no double border.
 *
 * Why this shape on Growth:
 *   - Growth-plan users still generate ads via Studio. Surfacing the
 *     mode launcher one-click away from the dashboard cuts a nav hop.
 *   - Recent-work thumbnails are the fastest "what did the team make
 *     today" signal — same on AI plan and Growth.
 *   - No upsell strip / queue here — Growth users have full access.
 */
export function GenieSection() {
  return (
    <section
      data-fabads-dash-section="genie"
      aria-label="Genie workspace activity"
      className="flex min-w-0 flex-col gap-3"
    >
      {/* Section header — bar, not a card. Anchors the two child cards
          below under "Genie" without nesting another card. */}
      <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Wand2 className="h-4 w-4 text-foreground" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Genie
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            · live workspace
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
        <ModeLauncherBar />
        <RecentWorkStrip />
      </div>
    </section>
  );
}
