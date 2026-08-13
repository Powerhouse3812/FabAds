import { useState } from "react";
import { ArrowLeft, Check, Monitor, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DESKTOP_ONLY_SURFACES,
  MOBILE_OPEN_SURFACES,
  TOUR_TABS,
  TOUR_WELCOME_SCREENS,
} from "@/mobile-tour/tourContent";

/**
 * MobileTourWelcome — the three orientation screens of Flow B.
 *
 * WHY THREE SCREENS AND NOT ONE PAGE
 * Each screen answers exactly one question the new mobile user actually has —
 * what is this for / what's missing and why / how do I move around. Stacking all
 * three into one scroll would bury the second answer, which is the one that
 * prevents the support ticket ("half the app is broken on my phone"). One idea
 * per screen also keeps each screen readable without scrolling on a small phone,
 * so the primary action stays visible in the thumb arc (Fitts's law).
 *
 * WHY A PINNED FOOTER, DOTS, AND A SKIP
 * The footer is the last flex child of the column and the body above it is the
 * only scroller (`min-h-0 flex-1 overflow-y-auto`), so the footer stays put
 * without `position: fixed` — it can never float over content, and it owns the
 * safe-area inset exactly once instead of double-counting it. Dots give
 * visibility of system status (NN/g #1) — three dots means three screens, no
 * mystery about how long this takes. Skip gives user control and freedom
 * (NN/g #3) and jumps straight to the checklist, which is the part with lasting
 * value; nobody should be forced through prose to reach it.
 *
 * The parent supplies the close control and the modal shell — this component is
 * just content, so it can be dropped into a sheet, a route, or a story.
 */

export interface MobileTourWelcomeProps {
  /** Called after the last screen's primary action. Parent moves to the checklist. */
  onFinish: () => void;
  /** Called by Skip. Same destination as onFinish; separate so the parent can log the difference. */
  onSkip: () => void;
  /** Screen to open on. Clamped, so an out-of-range value can't blank the flow. */
  initialIndex?: number;
}

const TOTAL = TOUR_WELCOME_SCREENS.length;

export default function MobileTourWelcome({
  onFinish,
  onSkip,
  initialIndex = 0,
}: MobileTourWelcomeProps) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), TOTAL - 1),
  );
  const screen = TOUR_WELCOME_SCREENS[index];
  const isLast = index === TOTAL - 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── scrollable body ─────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {screen.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
          {screen.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {screen.body}
        </p>

        {screen.list === "open" && (
          <ul className="mt-5 space-y-2">
            {MOBILE_OPEN_SURFACES.map((surface) => (
              <li
                key={surface.to}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10"
                  aria-hidden
                >
                  <Smartphone className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {surface.label}
                    {/* Honest qualifier, straight from the policy's `readonly` support
                        level — promising editing where the phone only reads would be
                        the exact mismatch this screen exists to prevent. */}
                    {surface.readOnly && (
                      <span className="ml-1.5 align-middle text-[11px] font-normal text-muted-foreground">
                        · view only
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {surface.blurb}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {screen.list === "desktopOnly" && (
          <ul className="mt-5 space-y-2">
            {DESKTOP_ONLY_SURFACES.map((surface) => (
              <li
                key={surface.to}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted"
                  aria-hidden
                >
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {surface.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {surface.reason}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {screen.list === "tabs" && (
          <ul className="mt-5 space-y-1.5">
            {TOUR_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <li
                  key={tab.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {tab.label}
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      — {tab.what}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          {screen.footnote}
        </p>
      </div>

      {/* ── pinned footer (in flow, not fixed — see header) ─────────────── */}
      <div
        className={cn(
          "shrink-0 border-t border-border bg-background",
          "px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        )}
      >
        {/* Dots are decorative; the eyebrow ("2 of 3 · …") carries the same
            information as text, so screen readers get it without a live region. */}
        <div className="flex items-center justify-center gap-1.5 pb-3" aria-hidden>
          {TOUR_WELCOME_SCREENS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIndex((i) => i - 1)}
              // 44px floor (WCAG 2.5.5). `w-11` keeps the icon-only Back square.
              className="min-h-11 w-11 shrink-0 px-0"
              aria-label="Previous screen"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Button>
          )}
          <Button
            type="button"
            onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
            className="min-h-11 flex-1"
          >
            {isLast ? (
              <>
                <Check className="mr-1.5 h-4 w-4" aria-hidden />
                Show me what to do first
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>

        {!isLast && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="mt-1.5 min-h-11 w-full text-muted-foreground"
          >
            Skip to the checklist
          </Button>
        )}
      </div>
    </div>
  );
}
