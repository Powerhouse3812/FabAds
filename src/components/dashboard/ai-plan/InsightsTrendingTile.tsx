import { Link } from "react-router-dom";
import { ArrowRight, Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TileProps {
  className?: string;
}

interface TrendingItem {
  thumb?: string;
  headline: string;
  context: string;
  tag: string;
  tagKind: "BOARD" | "COMPETITOR";
}

// Inline mock — no /mocks/insights directory exists yet.
const ITEMS: TrendingItem[] = [
  {
    headline: "Boat: launched new hook 'Built for Bharat' — running 12 ads with it",
    context: "Detected across 3 ad accounts in the last 6 days",
    tag: "COMPETITOR",
    tagKind: "COMPETITOR",
  },
  {
    headline: "Sleepyhead: scrapped value props, going lifestyle-first",
    context: "8 of 9 new creatives skip the spec sheet entirely",
    tag: "BOARD",
    tagKind: "BOARD",
  },
  {
    headline: "Mamaearth: 5 new TVC adaptations across 3 ad accounts",
    context: "Same anchor, swapped hook frames per audience segment",
    tag: "COMPETITOR",
    tagKind: "COMPETITOR",
  },
];

export function InsightsTrendingTile({ className }: TileProps) {
  const isEmpty = ITEMS.length === 0;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-none flex flex-col",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Industry Insights
          </p>
          <h3 className="text-base font-semibold text-foreground mt-0.5">
            Trending this week
          </h3>
        </div>
        <Link
          to="/insights-v2/feed"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline whitespace-nowrap"
        >
          Open My Feed <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 mt-4">
          <Pin className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xs text-foreground">
            No boards yet — pin a competitor to start your feed
          </p>
          <Link
            to="/insights/competitors"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline mt-2"
          >
            Pin a competitor <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3 flex-1">
          {ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="h-10 w-8 shrink-0 rounded-md bg-muted"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-snug text-foreground line-clamp-1">
                  {item.headline}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1 mt-0.5">
                  {item.context}
                </p>
                <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                  {item.tag}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
