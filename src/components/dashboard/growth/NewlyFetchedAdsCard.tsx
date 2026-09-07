import { Link } from "react-router-dom";
import { ArrowUpRight, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendToGenieMenu } from "@/genie6/flows/SendToGenieMenu";

/**
 * NewlyFetchedAdsCard — compact, brand-grouped list of fresh competitor
 * ads pulled by the Industry Insights fetch pipeline. A condensed take on
 * the AI-plan NewAdsFetchedTile, sized for the Growth dashboard's right
 * column (Maalik A-12.198: "add newly fetched Ads card, but compact").
 *
 * Each row: brand monogram + name + source tag + new-ad count. Header
 * carries the total fetched today + a link to the feed. No big thumbnails
 * — the count is the signal at this density.
 *
 * Genie 2.0 §7.7 — Dashboard surfaces the actions of the modules whose data
 * it shows. Each row's wand trigger mounts the existing SendToGenieMenu
 * (never a second menu) with module="dashboard" and this row's `dash-*` ref
 * id — the exact ids flowSources.ts's dashboardRefs() builds from
 * DASHBOARD_PICKS (`dash-${item.id}-f` for the recentlyFetched picks). boAt
 * and Noise are COMPETITOR rows (their refs carry `competitorOwned: true`),
 * so this only ever passes the row's id through — SendToGenieMenu resolves
 * the highlight itself and always lands on the user's own default brand,
 * never the rival's (§7.2). The row's own Link still owns primary
 * navigation to the feed; the wand is a secondary, icon-only affordance
 * (labelled via aria-label, same convention as VideoCard.tsx's kebab).
 */

type SourceType = "brand" | "competitor" | "category";

const FETCHED: Array<{
  id: string;
  name: string;
  newAdCount: number;
  source: SourceType;
  ink: string;
  bg: string;
}> = [
  { id: "mamaearth", name: "Mamaearth", newAdCount: 8, source: "brand", ink: "#5A3320", bg: "#F5C9B8" },
  { id: "boat", name: "Boat", newAdCount: 6, source: "competitor", ink: "#F9FAFB", bg: "#374151" },
  { id: "noise", name: "Noise", newAdCount: 5, source: "competitor", ink: "#5A1F36", bg: "#F7C8DC" },
  { id: "skincare", name: "Skincare Trends", newAdCount: 4, source: "category", ink: "#3A4A1F", bg: "#D2EAB1" },
];

const TOTAL_TODAY = FETCHED.reduce((s, b) => s + b.newAdCount, 0);

const SOURCE_LABEL: Record<SourceType, string> = {
  brand: "Brand",
  competitor: "Competitor",
  category: "Category",
};

export function NewlyFetchedAdsCard() {
  return (
    <section
      data-fabads-dash-card="newly-fetched-ads"
      aria-label="Newly fetched ads"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
            Newly fetched ads
          </h3>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            +{TOTAL_TODAY} today
          </span>
        </div>
        <Link
          to="/insights-v2/feed"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Feed
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <ul className="flex flex-col">
        {FETCHED.map((b) => (
          <li key={b.id}>
            <div className="group flex items-center gap-1 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40">
              <Link
                to="/insights-v2/feed"
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                {/* Monogram */}
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold"
                  style={{ backgroundColor: b.bg, color: b.ink }}
                >
                  {b.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
                  {b.name}
                </span>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {SOURCE_LABEL[b.source]}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5",
                    "font-mono text-[10px] font-semibold tabular-nums text-primary",
                  )}
                >
                  +{b.newAdCount}
                </span>
              </Link>
              {/* Secondary, icon-only affordance — the Link above stays the
                  row's one primary action (into the feed). SendToGenieMenu
                  resolves module="dashboard" + this row's dash-*-f ref
                  itself; boAt/Noise are competitor rows so the resolver
                  always highlights the user's own default brand, never the
                  rival's (§7.2 — see the file header). */}
              <SendToGenieMenu
                module="dashboard"
                refId={`dash-${b.id}-f`}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Send ${b.name} to Genie`}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
