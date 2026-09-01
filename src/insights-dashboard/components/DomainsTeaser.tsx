/**
 * DomainsTeaser — the businesses behind the ads.
 *
 * HEADLINE RULE: this block must NOT claim to know who is "making money". Sales
 * and visits here are StoreLeads ESTIMATES — modelled, not measured — and
 * asserting revenue knowledge over a modelled number is the single most-cited
 * complaint against every tool in this category. Describe what the rows ARE
 * (the businesses behind the ads); let the labelled columns carry the numbers.
 *
 * Below-the-fold by design, and the block that most needs discipline, because
 * it is the one place on the dashboard where two structurally different data
 * sources sit in the same table:
 *
 *  1. **Columns SWAP per domain type, they never grey out.** Ecom domains come
 *     from StoreLeads and carry sales/visits/products/platform. Affiliate and
 *     funnel (leadgen/ppc/telehealth collapse into one column set — they are
 *     identical) domains come from a different source and those fields do not
 *     exist for them at all — not missing, never collected. Rendering an
 *     em-dash across a whole column for a business model that structurally
 *     doesn't have that figure would read as "we have no data on these",
 *     which is false. So the segmented control swaps the entire column set
 *     (`DomainGroup.columns`) instead of ever blanking a cell.
 *  2. **Estimated numbers are labelled as estimated.** Sales/visits are
 *     StoreLeads MODELLED figures — directional, not measured — carried on
 *     `DomainColumn.estimated`. Live ads are OBSERVED from the Meta Ad
 *     Library. Both tiers are named plainly in the source footer
 *     (`sampleNote` + `universeNote`, composed into one sentence), which is
 *     what makes the rest of the table believable.
 *
 * Row actions: +Track is local-optimistic only — `useState` + `sonner`
 * toast, nothing touches a shared store. A previous session wrote real rows
 * into the demo Competitors workspace by being careless with a "Track"
 * button; this one never calls any competitor/watchlist mutation. View is a
 * REAL navigation — both it and the domain cell itself route to
 * `/insights/discover?domain=<domain>`, i.e. every ad indexed for that
 * domain. That superseded the local inspect-in-a-dialog affordance this
 * block used to have: once there is a genuine destination that shows more
 * than this row already does, a dialog that only re-states the row's own
 * cells is the weaker, not the safer, choice.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  Globe,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  domainCellNaReason,
  isAffiliateRow,
  isEcomRow,
  isFunnelRow,
  useDashboardMeta,
  useDomainRows,
  type DomainColumn,
  type DomainRow,
  type DomainVariant,
} from "@/insights-dashboard/lib/selectors";

/**
 * A teaser shows a handful of rows, not the whole indexed universe — cap
 * defensively so this still reads as a teaser if the corpus behind it grows
 * from 14 rows to 10,000. Groups already arrive sorted by live ads
 * descending, so a cap keeps the most relevant rows per variant.
 */
const TEASER_ROW_CAP = 8;

// `selectors.ts` doesn't re-export its internal `formatInt` — these are
// display-only formatting, not re-derived data, so they're safe to keep
// local to this file. Mirrors `formatInt` / `formatUsdCompact` in
// `insights-dashboard/lib/fixtures.ts` so numbers read identically elsewhere
// on the dashboard.
function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function formatUsdCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function formatDaysAgo(n: number): string {
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  return `${formatInt(n)}d ago`;
}

/** `/insights/discover?domain=<domain>` — every ad indexed for that domain. */
function domainHref(domain: string): string {
  return `/insights/discover?domain=${encodeURIComponent(domain)}`;
}

/**
 * Render one cell for one column on one row. Narrows via the exported type
 * guards before touching a type-specific field — `DomainRow` is a
 * discriminated union and affiliate/funnel rows genuinely lack
 * `estSalesPerMonth` / `estVisits` at the type level, not just at runtime.
 *
 * `trackedNow` is passed in rather than read off `row.tracked` directly so
 * the "Tracked" column reflects the same local-optimistic state the +Track
 * button just set — the two must never disagree.
 *
 * CALLED BEFORE THE SWITCH: `domainCellNaReason(row, col.key)`. In `error`,
 * an ecom row's `estSalesPerMonth`/`estVisits` are `null` — a generic
 * `format: "usd"` / `"int"` render would coerce that to `0` and print "$0" /
 * "0", which reads as "this store sells nothing" when the truth is
 * "StoreLeads never answered". `domainCellNaReason` is `null` in every other
 * state, so the healthy path below is unchanged.
 */
function renderCell(row: DomainRow, col: DomainColumn, trackedNow: boolean): ReactNode {
  const na = domainCellNaReason(row, col.key);
  if (na) {
    return (
      <span className="text-xs italic text-muted-foreground" title={na}>
        {na}
      </span>
    );
  }

  switch (col.format) {
    case "domain":
      return (
        <Link
          to={domainHref(row.domain)}
          title={`${row.domain} — open in Discover`}
          className="block max-w-[180px] truncate font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        >
          {row.domain}
        </Link>
      );

    case "text": {
      const value =
        col.key === "industry"
          ? row.industry
          : isEcomRow(row) && col.key === "platform"
            ? row.platform
            : isFunnelRow(row) && col.key === "topAngle"
              ? row.topAngle
              : "";
      return <span className="text-muted-foreground">{value}</span>;
    }

    case "int": {
      const value =
        col.key === "liveAds"
          ? row.liveAds
          : isEcomRow(row) && col.key === "estVisits"
            ? row.estVisits
            : isEcomRow(row) && col.key === "productCount"
              ? row.productCount
              : isAffiliateRow(row) && col.key === "offers"
                ? row.offers
                : isFunnelRow(row) && col.key === "landers"
                  ? row.landers
                  : 0;
      return <span className="tabular-nums text-foreground">{formatInt(value)}</span>;
    }

    case "usd": {
      const value = isEcomRow(row) && col.key === "estSalesPerMonth" ? row.estSalesPerMonth : 0;
      return <span className="tabular-nums text-foreground">{formatUsdCompact(value)}</span>;
    }

    case "days-ago": {
      const value = col.key === "firstSeenDaysAgo" ? row.firstSeenDaysAgo : row.lastNewCreativeDaysAgo;
      return <span className="tabular-nums text-muted-foreground">{formatDaysAgo(value)}</span>;
    }

    case "days": {
      const value = isAffiliateRow(row) && col.key === "avgCreativeLifeDays" ? row.avgCreativeLifeDays : 0;
      return <span className="tabular-nums text-foreground">{formatInt(value)}d</span>;
    }

    case "rotation": {
      if (!isAffiliateRow(row)) return null;
      return (
        <span className="inline-flex items-center gap-2 tabular-nums text-muted-foreground">
          <span className="inline-flex items-center gap-0.5" title="Added in the last 7 days">
            <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            {formatInt(row.rotation7d.added)}
          </span>
          <span className="inline-flex items-center gap-0.5" title="Paused in the last 7 days">
            <ArrowDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            {formatInt(row.rotation7d.paused)}
          </span>
        </span>
      );
    }

    case "list": {
      const value = isFunnelRow(row) ? row.markets.join(", ") : "";
      return <span className="text-muted-foreground">{value}</span>;
    }

    case "tracker": {
      const value = isAffiliateRow(row) || isFunnelRow(row) ? row.tracker : "not detected";
      const notDetected = value === "not detected";
      return (
        <span
          className={cn(notDetected ? "italic text-muted-foreground" : "text-foreground")}
          title={notDetected ? col.hint : undefined}
        >
          {value}
        </span>
      );
    }

    case "bool":
      return trackedNow ? (
        <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-medium">
          <Check className="h-2.5 w-2.5" aria-hidden="true" />
          Tracked
        </Badge>
      ) : (
        <span className="text-muted-foreground">Not tracked</span>
      );

    default:
      return null;
  }
}

export function DomainsTeaser({ className }: { className?: string }): JSX.Element {
  const { groups, filters, isEmpty, isLoading, universeNote, sampleNote, degradedNote, unavailableColumnKeys } =
    useDomainRows();
  const { isThin } = useDashboardMeta();

  const firstNonEmpty = groups.find((g) => g.count > 0) ?? groups[0];
  const [activeVariant, setActiveVariant] = useState<DomainVariant>(firstNonEmpty.variant);
  const [trackedOverrides, setTrackedOverrides] = useState<Record<string, boolean>>({});

  // CHECK isLoading BEFORE `isEmpty`. `rows` is `[]` in both `loading` and a
  // genuinely empty domain table — a skeleton keeps first paint from claiming
  // "follow an industry first" while we're still fetching the businesses
  // behind the ads.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            The businesses behind these ads
          </h2>
        </header>
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-md" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        <Skeleton className="mt-3 h-3 w-full" />
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            The businesses behind these ads
          </h2>
        </header>
        <InsightsV2EmptyState
          icon={Globe}
          title={isThin ? "No domains indexed yet" : "Nothing to show yet"}
          description={
            isThin
              ? "Your followed industry hasn't been scanned yet — the domains behind its ads land here once indexing completes."
              : "Follow an industry first. Once we index its ads, the domains running them show up here."
          }
        />
      </section>
    );
  }

  const activeGroup = groups.find((g) => g.variant === activeVariant) ?? firstNonEmpty;
  const rows = activeGroup.rows.slice(0, TEASER_ROW_CAP);
  const hiddenCount = activeGroup.count - rows.length;

  // Only Ecom carries `estSalesPerMonth`/`estVisits` — Affiliate and Funnel
  // don't have those columns at all, so a StoreLeads-down note would be
  // pointing at columns the reader can't even see on those tabs. Scope the
  // banner to whichever variant it's actually about.
  const activeGroupAffected = activeGroup.columns.some((col) => unavailableColumnKeys.includes(col.key));

  const isTracked = (row: DomainRow) => trackedOverrides[row.domain] ?? row.tracked;

  const handleTrack = (row: DomainRow) => {
    const next = !isTracked(row);
    setTrackedOverrides((prev) => ({ ...prev, [row.domain]: next }));
    toast.success(next ? `Tracking ${row.domain}` : `Stopped tracking ${row.domain}`);
  };

  const footerSentence = `${sampleNote} Domain universe: ${universeNote}. Live ads are observed in the Meta Ad Library; monthly sales and visits are StoreLeads estimates — directional, not measured.`;

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          The businesses behind these ads
        </h2>
        <Link
          to="/insights/competitors"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-text hover:underline"
        >
          Full Competitors view
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={activeVariant}
        onValueChange={(next) => next && setActiveVariant(next as DomainVariant)}
        className="mb-3 flex-wrap justify-start"
      >
        {filters.map((f) => (
          <ToggleGroupItem key={f.variant} value={f.variant} disabled={f.count === 0} className="text-xs">
            {f.label} ({formatInt(f.count)})
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* StoreLeads-down disclosure. Above the table, not buried in the
          footer sentence — every row in the affected columns prints its own
          na-reason text via `renderCell`, but the reader needs the "why" once,
          not fourteen times. Icon + text carries this, never colour alone. */}
      {degradedNote && activeGroupAffected && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs leading-snug text-muted-foreground">{degradedNote}</p>
        </div>
      )}

      {activeGroup.count === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No {activeGroup.label.toLowerCase()} domains in this sample.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {activeGroup.columns.map((col) => {
                const columnDown = unavailableColumnKeys.includes(col.key);
                return (
                  <TableHead
                    key={col.key}
                    title={columnDown ? degradedNote ?? col.hint : col.hint}
                    className={cn("h-8 whitespace-nowrap py-1.5 text-[11px]", col.align === "right" && "text-right")}
                  >
                    <span className={cn("inline-flex items-center gap-1", col.align === "right" && "justify-end")}>
                      {col.label}
                      {columnDown ? (
                        <TriangleAlert className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        col.estimated && <Provenance tier="estimated" compact />
                      )}
                    </span>
                  </TableHead>
                );
              })}
              <TableHead className="h-8 whitespace-nowrap py-1.5 text-right text-[11px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const trackedNow = isTracked(row);
              return (
                <TableRow key={row.domain}>
                  {activeGroup.columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn("whitespace-nowrap py-2 text-xs", col.align === "right" && "text-right")}
                    >
                      {renderCell(row, col, trackedNow)}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap py-2 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Link to={domainHref(row.domain)}>
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={trackedNow ? "secondary" : "outline"}
                        className="h-7 px-2 text-xs"
                        onClick={() => handleTrack(row)}
                      >
                        {trackedNow ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {trackedNow ? "Tracking" : "Track"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          +{formatInt(hiddenCount)} more {activeGroup.label.toLowerCase()} domains in the full view.
        </p>
      )}

      <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
        {footerSentence}
      </p>
    </section>
  );
}
