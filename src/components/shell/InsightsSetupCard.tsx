import { useNavigate } from "react-router-dom";
import { Check, Circle, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInsightsSetupState } from "@/lib/insights-setup";

/**
 * InsightsSetupCard — footer-pinned setup-progress card for the Insights
 * sub-nav, shown in place of InsightsExtensionCard until the user has
 * cleared the 3-item onboarding checklist.
 *
 * Same genre as CatalogueFooterCard.tsx ("N of 3 ready" line, thin lime
 * progress bar, 3-item mini checklist with done/pending icons) — kept
 * visually consistent with that card rather than InsightsExtensionCard's
 * illustration-led approach, since this one's job is progress, not a
 * product pitch.
 *
 * Not dismissible: it converts away on its own once `complete` flips true
 * (SecondaryNavigationPanel swaps it for InsightsExtensionCard), so there's
 * no X here — unlike the two dismissible footer cards.
 *
 * Each pending item is a real button that jumps straight to the surface
 * that clears it: Preferences -> the feed's prefs modal, Competitor -> the
 * competitors page's add modal, Save an ad -> the feed itself.
 */

const CHECKLIST_ITEMS: ReadonlyArray<{
  key: "prefsSet" | "competitorAdded" | "adSaved";
  label: string;
  ctaPath: string;
}> = [
  { key: "prefsSet", label: "Set preferences", ctaPath: "/insights-v2/feed?modal=prefs" },
  { key: "competitorAdded", label: "Add a competitor", ctaPath: "/insights/competitors?modal=add" },
  { key: "adSaved", label: "Save an ad", ctaPath: "/insights-v2/feed" },
];

export function InsightsSetupCard() {
  const navigate = useNavigate();
  const state = useInsightsSetupState();

  // Loading (prefs/competitors hooks still resolving) — render nothing
  // rather than flash a 0-of-3 that immediately jumps.
  if (state.loading) return null;

  const progressPct = Math.round((state.doneCount / state.total) * 100);

  return (
    <div className="shrink-0 px-2 py-2">
      <div
        className={cn(
          "group relative flex flex-col gap-2 rounded-md px-2.5 py-2",
          "border border-foreground/[0.06] bg-foreground/[0.03]",
          "transition-[transform,border-color,background-color] duration-200 ease-out",
          "hover:-translate-y-[1px] hover:border-primary/30 hover:bg-foreground/[0.045]",
          "focus-within:border-primary/40",
        )}
      >
        <div className="flex items-center gap-1.5">
          <ListChecks
            className="h-3.5 w-3.5 shrink-0 text-foreground/55"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
            Insights Setup
          </span>
        </div>

        {/* Hero progress line + thin lime bar. */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] leading-none text-muted-foreground">
            <span className="font-mono text-xs font-bold text-foreground">
              {state.doneCount}
            </span>{" "}
            of {state.total} ready
          </p>
          <div
            className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Insights setup progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 3-item mini checklist — pending items are clickable jumps to
            the surface that clears them, done items are static. */}
        <ul className="flex flex-col gap-0.5">
          {CHECKLIST_ITEMS.map((item) => {
            const done = state[item.key];
            return (
              <li key={item.key}>
                {done ? (
                  <div className="flex h-[22px] items-center gap-1.5">
                    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Check
                        className="h-2.5 w-2.5 text-primary"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                    <span className="text-[11px] leading-none text-foreground/70">
                      {item.label}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(item.ctaPath)}
                    className={cn(
                      "flex h-[22px] w-full items-center gap-1.5 rounded-sm text-left",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
                    )}
                  >
                    <Circle
                      className="h-3.5 w-3.5 shrink-0 text-foreground/30"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="text-[11px] leading-none text-foreground">
                      {item.label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-primary/80">
                      Go
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
