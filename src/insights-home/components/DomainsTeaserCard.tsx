import { Link } from "react-router-dom";
import { ArrowRight, Globe2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDomainRows, type DomainRow } from "@/insights-home/lib/homeSelectors";

/**
 * DomainsTeaserCard — "Domains" teaser block for the Industry Insights
 * Home page (src/pages/insights/InsightsOverview.tsx).
 *
 * Shows the top 3 rows from useDomainRows(3) — domain, industry, live ads,
 * estimated monthly sales — with a link out to the full domains table,
 * which lives inside Competitors (a separate wiring agent owns that tab;
 * this card only links to it, it does not render it).
 *
 * The SOURCE + ESTIMATE FOOTER is its own deliberate block (Maalik's call):
 * live-ad counts are OBSERVED from the Meta Ad Library, sales/visits are
 * DIRECTIONAL ESTIMATES, not measured. It sits directly under the numbers
 * because that's what makes the numbers believable — never demoted to a
 * page-level footnote.
 *
 * Card chrome matches the other Home page cards (Card > CardContent
 * space-y-3 p-4, text-sm font-semibold h2, border-border/60 rounded-md
 * rows) — see ModuleRouterCard.tsx / InsightsOverview.tsx's DigestCard.
 *
 * No design tokens invented: every className below is an existing
 * Tailwind/shadcn token already used elsewhere in src/pages/insights/.
 *
 * States: loading (skeleton rows, no footer yet — nothing to back up),
 * zero-data (invitation to track a domain, no footer — no numbers to
 * source), populated (3 rows + footer).
 *
 * A missing per-row metric never renders a bare dash — it says why it's
 * absent (e.g. "No live ads found" instead of "0" read as an error, or a
 * named reason if a sales estimate can't be computed yet).
 */

const DOMAINS_TAB_PATH = "/insights/competitors?view=domains";

export function DomainsTeaserCard(): JSX.Element {
  const { rows, loading } = useDomainRows(3);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Domains</h2>
          <Link
            to={DOMAINS_TAB_PATH}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View all domains
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <DomainsTeaserSkeleton />
        ) : rows.length === 0 ? (
          <DomainsTeaserEmpty />
        ) : (
          <>
            <ul className="flex flex-col gap-1.5">
              {rows.map((row) => (
                <DomainsTeaserRow key={row.id} row={row} />
              ))}
            </ul>

            <p className="flex items-start gap-1.5 rounded-md bg-muted/40 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>
                Live ad counts are observed from the Meta Ad Library. Estimated monthly sales and
                visits are directional estimates, not measured figures.
              </span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DomainsTeaserRow({ row }: { row: DomainRow }) {
  const hasLiveAds = row.liveAds > 0;
  const salesLabel = row.estSalesPerMonth?.trim()
    ? `~${row.estSalesPerMonth}/mo`
    : "No reliable sales estimate yet";

  return (
    <li className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5 text-sm">
      <Globe2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground" title={row.domain}>
          {row.domain}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={row.industry}>
          {row.industry}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={
            hasLiveAds
              ? "font-mono text-xs font-medium text-foreground"
              : "font-mono text-xs text-muted-foreground/70"
          }
        >
          {hasLiveAds ? `${row.liveAds} live ad${row.liveAds === 1 ? "" : "s"}` : "No live ads found"}
        </p>
        <p className="text-xs text-muted-foreground">{salesLabel}</p>
      </div>
    </li>
  );
}

function DomainsTeaserSkeleton() {
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Loading domains">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5"
        >
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="shrink-0 space-y-1 text-right">
            <Skeleton className="ml-auto h-3.5 w-16 rounded" />
            <Skeleton className="ml-auto h-3 w-12 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DomainsTeaserEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <Globe2 className="h-8 w-8 text-muted-foreground/40" aria-hidden />
      <div className="max-w-sm">
        <h3 className="text-sm font-medium text-foreground">No domains tracked yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Track a competitor's domain and its live ads, estimated sales, and visits will show up
          here.
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/insights/competitors?modal=add">Track a domain</Link>
      </Button>
    </div>
  );
}

export default DomainsTeaserCard;
