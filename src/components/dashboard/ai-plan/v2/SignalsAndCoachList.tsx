import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalsAndCoachListProps {
  className?: string;
}

/**
 * SignalsAndCoachList — V2's unified "what's happening + what to do next" tile.
 *
 * Replaces V1's bulky SignalTile (~340px) + AiSuggestionsCoach (~220px) duo
 * with a single ~220-240px dense list of 5 actionable rows. Operator-class
 * density inspired by Linear's "What's new" list, Sublime command palette
 * rows, and Cron's "upcoming" list — flat rows, no hero, no wasted space.
 *
 * Each row collapses signal-or-coach + copy + hover action into a single line.
 * Click anywhere on a row → navigate to that item's href.
 *
 * Mocked items for now; wires up to real feeds later.
 */

type ItemKind = "SIGNAL" | "COACH";

interface Item {
  id: string;
  kind: ItemKind;
  copy: string;
  action: string;
  href: string;
}

const ITEMS: Item[] = [
  {
    id: "s1",
    kind: "SIGNAL",
    copy: "Sleepyhead scrapped value props · going lifestyle-first.",
    action: "Open feed",
    href: "/insights-v2/feed",
  },
  {
    id: "c1",
    kind: "COACH",
    copy: "Brand Boat idle 14d · try a fresh angle from saved comps.",
    action: "Open Boat",
    href: "/catalogue/brands/boat",
  },
  {
    id: "s2",
    kind: "SIGNAL",
    copy: "Boat: new hook 'Built for Bharat' running 12 ads.",
    action: "View hook",
    href: "/insights-v2/feed",
  },
  {
    id: "c2",
    kind: "COACH",
    copy: "5 saved ads ready · forge 10 variants of each to test angles.",
    action: "Forge now",
    href: "/iq/genie6/studio-alpha?mode=variation&skipGate=1",
  },
  {
    id: "c3",
    kind: "COACH",
    copy: "Sleepyhead has no competitors tracked · add 3-5 to surface ads.",
    action: "Add comp",
    href: "/insights/competitors",
  },
];

export function SignalsAndCoachList({ className }: SignalsAndCoachListProps) {
  const navigate = useNavigate();

  const go = (href: string) => navigate(href);

  const handleActionClick = (
    e: MouseEvent<HTMLButtonElement>,
    href: string,
  ) => {
    e.stopPropagation();
    go(href);
  };

  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3",
        className,
      )}
    >
      {/* Header row */}
      <header className="flex items-center justify-between px-1">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Next Moves
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
          Refreshes 1h
        </p>
      </header>

      {/* Divider */}
      <div aria-hidden className="h-px bg-border/40" />

      {/* Rows */}
      <ul className="flex flex-col">
        {ITEMS.map((item, index) => {
          const isSignal = item.kind === "SIGNAL";
          const Icon = isSignal ? TrendingUp : Zap;

          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.28,
                ease: [0.32, 0.72, 0, 1],
                delay: index * 0.05,
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => go(item.href)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go(item.href);
                  }
                }}
                className={cn(
                  "group flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5",
                  "transition-colors hover:bg-muted/40",
                )}
              >
                {/* Left chip — kind icon */}
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                    isSignal ? "bg-primary/15" : "bg-muted",
                  )}
                  aria-hidden
                >
                  <Icon
                    className={cn(
                      "h-2.5 w-2.5",
                      isSignal ? "text-primary" : "text-foreground/70",
                    )}
                    strokeWidth={2.5}
                  />
                </span>

                {/* Type chip — mono caps label */}
                <span
                  className={cn(
                    "shrink-0 font-mono text-[8.5px] uppercase tracking-[0.14em]",
                    isSignal ? "text-primary" : "text-foreground/60",
                  )}
                >
                  {item.kind}
                </span>

                {/* Copy — truncate to single line */}
                <p className="min-w-0 flex-1 truncate text-[11.5px] text-foreground">
                  {item.copy}
                </p>

                {/* Action chip — fades in on row hover */}
                <button
                  type="button"
                  onClick={(e) => handleActionClick(e, item.href)}
                  className={cn(
                    "shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                    "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5",
                    "font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-primary",
                    "hover:bg-primary/25",
                  )}
                  tabIndex={-1}
                  aria-label={item.action}
                >
                  {item.action}
                  <ArrowRight className="h-2.5 w-2.5" strokeWidth={2.5} />
                </button>
              </div>
            </motion.li>
          );
        })}
      </ul>

      {/* Footer divider + view all link */}
      <div aria-hidden className="h-px bg-border/40" />
      <button
        type="button"
        onClick={() => go("/insights-v2/feed")}
        className={cn(
          "group flex items-center justify-end gap-1 px-1 pt-0.5",
          "font-mono text-[9.5px] uppercase tracking-[0.16em] text-primary",
          "transition-transform hover:-translate-y-px",
        )}
      >
        View all in feed
        <ArrowRight
          className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </button>
    </section>
  );
}
