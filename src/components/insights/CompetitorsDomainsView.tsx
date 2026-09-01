import { useMemo, useState } from "react";
import { Globe2, ExternalLink, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { markCompetitorAdded } from "@/lib/insights-setup";
import { DUMMY_ADS, type InsightAd } from "@/lib/insights-dummy-data";
import { toast } from "sonner";

/* ────────────────────── domain rows (inlined) ──────────────────────────
   `DomainRow` + `useDomainRows` used to live in
   `src/insights-home/lib/homeSelectors.ts`. That module was the older
   Industry Insights "13 blocks" dashboard and was deleted when
   `src/insights-dashboard` replaced it at /insights/overview.

   They are inlined here rather than repointed at the new dashboard's
   same-named exports, which are NOT compatible substitutes:
   `insights-dashboard`'s `DomainRow` is a discriminated union
   (ecom | affiliate | funnel) with variant-specific columns, and its
   `useDomainRows()` takes no arguments and reads `useDashboardState()` —
   a provider that only wraps /insights/overview, so calling it from this
   Competitors tab would throw. This is the only consumer left, so the
   code lives with it. Behaviour is byte-for-byte what it was before.

   Deterministic pseudo-randomness throughout — no Math.random, so a
   domain's mock economics are stable across renders and reloads.        */

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function uniqueDomainAds(): InsightAd[] {
  const seen = new Set<string>();
  const out: InsightAd[] = [];
  for (const ad of DUMMY_ADS) {
    if (seen.has(ad.domain)) continue;
    seen.add(ad.domain);
    out.push(ad);
  }
  return out;
}

function liveAdsForDomain(domain: string): number {
  return DUMMY_ADS.filter((a) => a.domain === domain && a.status === "active").length;
}

function economicsForDomain(domain: string): {
  estSalesPerMonth: string;
  estVisits: string;
  products: number;
} {
  const h = hashString(`econ:${domain}`);
  const salesK = 5 + (h % 495); // $5K..$500K
  const visitsK = 10 + ((h >> 4) % 990); // 10K..1,000K
  const products = 3 + (h % 120);
  return {
    estSalesPerMonth: `$${salesK}K`,
    estVisits: `${visitsK}K`,
    products,
  };
}

export interface DomainRow {
  id: string;
  domain: string;
  industry: string;
  liveAds: number;
  estSalesPerMonth: string;
  estVisits: string;
  products: number;
  platform: string;
  tracked: boolean;
}

/**
 * Tracked domain-type competitors first (mock-backed via
 * useInsightCompetitors), enriched with deterministic mock economics; padded
 * with untracked domains from the dummy ad corpus so the table always has
 * body.
 */
function useDomainRows(limit = 12): { rows: DomainRow[]; loading: boolean } {
  const { competitors, isLoading } = useInsightCompetitors();

  const rows = useMemo(() => {
    if (isLoading) return [];
    const safeLimit = Math.max(0, limit);

    const trackedRows: DomainRow[] = competitors
      .filter((c) => c.competitor_type === "domain")
      .map((c) => {
        const domain: string = c.identifier;
        const matchingAd = DUMMY_ADS.find((a) => a.domain === domain);
        const econ = economicsForDomain(domain);
        return {
          id: `domain-${c.id}`,
          domain,
          industry: matchingAd?.industry ?? "E-commerce",
          liveAds: liveAdsForDomain(domain),
          estSalesPerMonth: econ.estSalesPerMonth,
          estVisits: econ.estVisits,
          products: econ.products,
          platform: matchingAd?.platform ?? "Meta",
          tracked: true,
        };
      });

    const trackedDomainSet = new Set(trackedRows.map((r) => r.domain));
    const remaining = Math.max(0, safeLimit - trackedRows.length);
    const untrackedRows: DomainRow[] = remaining
      ? uniqueDomainAds()
          .filter((ad) => !trackedDomainSet.has(ad.domain))
          .slice(0, remaining)
          .map((ad) => {
            const econ = economicsForDomain(ad.domain);
            return {
              id: `domain-${slug(ad.domain)}`,
              domain: ad.domain,
              industry: ad.industry,
              liveAds: liveAdsForDomain(ad.domain),
              estSalesPerMonth: econ.estSalesPerMonth,
              estVisits: econ.estVisits,
              products: econ.products,
              platform: ad.platform,
              tracked: false,
            };
          })
      : [];

    return [...trackedRows, ...untrackedRows].slice(0, safeLimit);
  }, [competitors, isLoading, limit]);

  return { rows, loading: isLoading };
}

/**
 * CompetitorsDomainsView — the "Domains" tab inside Competitors
 * (src/pages/insights/InsightsCompetitors.tsx, ?view=domains).
 *
 * Maalik's call: domains is a VIEW of Competitors, not a new nav item — our
 * competitor rows already carry competitor_type "domain" with an identifier
 * that IS the domain. This renders the full useDomainRows() table (domain,
 * industry, live ads, est. sales/mo, est. visits, products, platform) plus
 * per-row "View store" (external link, opens the domain) and "Track" /
 * "Tracked" (adds the domain as a domain-type competitor via the existing
 * addCompetitor mutation — same shape TopMoversCard already uses).
 *
 * Table scrolls in its own horizontal container on narrow widths (Table's
 * own wrapper already sets `overflow-auto`) — the page itself never widens.
 * Long domains truncate with a title tooltip for the full value.
 *
 * Zero state invites tracking a competitor rather than showing an empty
 * table shell.
 */
export function CompetitorsDomainsView({
  onAddCompetitor,
}: {
  /** Opens the same AddCompetitorModal the Competitors tab uses. */
  onAddCompetitor: () => void;
}): JSX.Element {
  const { rows, loading } = useDomainRows(40);

  return (
    <div className="space-y-3">
      {loading ? (
        <DomainsTableSkeleton />
      ) : rows.length === 0 ? (
        <DomainsEmptyState onAddCompetitor={onAddCompetitor} />
      ) : (
        <>
          <div className="rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-right">Live ads</TableHead>
                  <TableHead className="text-right">Est. sales/mo</TableHead>
                  <TableHead className="text-right">Est. visits</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <DomainTableRow key={row.id} row={row} />
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="flex items-start gap-1.5 rounded-md bg-muted/40 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>
              Live ad counts are observed from the Meta Ad Library. Estimated monthly sales and
              visits are directional estimates, not measured figures.
            </span>
          </p>
        </>
      )}
    </div>
  );
}

function DomainTableRow({ row }: { row: DomainRow }) {
  const { addCompetitor } = useInsightCompetitors();
  const [tracking, setTracking] = useState(false);
  // Optimistic local flag — the underlying row only flips to tracked=true
  // once the competitors query refetches, which can lag a tick behind the
  // toast. Prevents the button flashing back to "Track" after a click.
  const [justTracked, setJustTracked] = useState(false);
  const isTracked = row.tracked || justTracked;

  async function handleTrack() {
    if (isTracked || tracking) return;
    setTracking(true);
    try {
      await addCompetitor.mutateAsync({
        name: row.domain,
        competitor_type: "domain",
        identifier: row.domain,
      });
      setJustTracked(true);
      markCompetitorAdded();
      toast.success(`${row.domain} added to Competitors`);
    } catch {
      toast.error(`Failed to add ${row.domain}`);
    } finally {
      setTracking(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="max-w-[220px]">
        <div className="flex min-w-0 items-center gap-2">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate font-medium text-foreground" title={row.domain}>
            {row.domain}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[160px]">
        <span className="truncate text-muted-foreground" title={row.industry}>
          {row.industry}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {row.liveAds > 0 ? (
          <span className="font-medium text-foreground">{row.liveAds}</span>
        ) : (
          <span className="text-muted-foreground/70">No live ads</span>
        )}
      </TableCell>
      <TableCell className="text-right font-mono text-xs text-foreground">
        {row.estSalesPerMonth ? `~${row.estSalesPerMonth}` : "No estimate yet"}
      </TableCell>
      <TableCell className="text-right font-mono text-xs text-foreground">
        {row.estVisits ? `~${row.estVisits}` : "No estimate yet"}
      </TableCell>
      <TableCell className="text-right font-mono text-xs text-foreground">{row.products}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{row.platform}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="ghost" className="h-7 shrink-0 text-xs">
            <a
              href={`https://${row.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View store — ${row.domain}`}
            >
              <ExternalLink className="mr-1 h-3 w-3" aria-hidden /> View store
            </a>
          </Button>
          {isTracked ? (
            <span className="inline-flex shrink-0 items-center gap-1 px-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3" aria-hidden /> Tracked
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 text-xs"
              onClick={handleTrack}
              disabled={tracking}
            >
              {tracking ? "Adding…" : "Track"}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function DomainsTableSkeleton() {
  return (
    <div className="space-y-2 rounded-md border border-border/60 p-3" aria-label="Loading domains">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-14" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function DomainsEmptyState({ onAddCompetitor }: { onAddCompetitor: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border/60 py-16 text-center">
      <Globe2 className="h-10 w-10 text-muted-foreground/30" aria-hidden />
      <div className="max-w-sm">
        <h3 className="text-sm font-medium text-foreground">No domains tracked yet</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a competitor with a domain and its live ads, estimated sales, and visits will show
          up here.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onAddCompetitor}>
        Add competitor
      </Button>
    </div>
  );
}

export default CompetitorsDomainsView;
