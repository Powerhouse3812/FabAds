/**
 * DomainsTeaser — "Top domains & pages".
 *
 * Maalik's ask: "Top 5 domains and pages — with follow action, because [it's]
 * not [that] the top-level [advertisers] are already followed — with filter
 * of industry/category." The top advertisers in an industry are NOT
 * necessarily the ones a user already follows, so this block is where that
 * gap gets fixed — a follow action lives on every row, not just a link out.
 *
 * ONE block, TWO entities. A page is the Meta identity that runs the ads; a
 * domain is where those ads point — one advertiser can run more than one
 * page, so ranking by page can read differently from ranking by domain. The
 * entity toggle switches which one is ranked; the shape of the row never
 * changes (`TopAdvertiserRow` covers both).
 *
 * This is also where the deleted "Market movers" block's 30-day change now
 * lives: `newAds30d` / `newAds30dDeltaPct`. NEVER call that "live ads" —
 * `liveAds` is what's running right now, `newAds30d` is what launched in the
 * last 30 days. Conflating the two recreates the exact cross-block
 * contradiction this pass removed.
 *
 * The two actions, exactly as specified:
 *  1. **View ads** — a real `<Link>` to `/insights/discover?domain=<domain>`.
 *     Discover has no page-level filter, so a PAGE row's link is still
 *     domain-scoped — its `InfoTip` (`action.view-ads`) says so rather than
 *     pretending otherwise.
 *  2. **Clicking the name** — opens a `Sheet` that honestly says "Coming
 *     soon" and names what the real detail page will hold (ad history,
 *     tracker, landing pages). It does not pretend to be that page, and it is
 *     never a dead click. The shared `SheetContent` primitive already refuses
 *     outside-click dismissal app-wide, so no extra wiring is needed here.
 *
 * Follow is local `useState` + a `sonner` toast — no store, no Supabase
 * write. An already-followed row renders as a followed state, not as a
 * button, so this can't be mistaken for a live write.
 *
 * PROVENANCE — fixed 2026-08/09: this table used to carry StoreLeads
 * sales/visits columns, and rows still hold `row.provenance === "estimated"`
 * left over from that. Those columns are gone; every number visible today is
 * `liveAds` (observed, Meta Ad Library) or `newAds30d` (derived from observed
 * data). Rendering a per-row `≈` chip off `row.provenance` therefore marked
 * OBSERVED numbers as MODELLED — the exact inversion the provenance system
 * exists to prevent. Fixed by dropping the per-row chip and rendering one
 * block-level pair (`observed` + `derived`) in the header that reflects what
 * the visible columns actually are. Do not resurrect the per-row
 * `row.provenance` chip without first checking whether a StoreLeads-backed
 * column is actually back in this table.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDown, ArrowRight, ArrowUp, Check, Globe, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  ADVERTISER_ENTITY_ORDER,
  useDashboardMeta,
  usePagesAndDomains,
  type AdvertiserEntity,
  type TopAdvertiserRow,
} from "@/insights-dashboard/lib/selectors";

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Icon + text + sign together — never colour alone. Zero is its own state, not a false positive/negative. */
function DeltaMark({ pct }: { pct: number }) {
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-foreground">
        <Minus className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
        0%
      </span>
    );
  }
  const positive = pct > 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 tabular-nums",
        positive ? "text-foreground" : "text-foreground",
      )}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      {positive ? "+" : ""}
      {pct}%
    </span>
  );
}

export function DomainsTeaser({ className }: { className?: string }): JSX.Element {
  const {
    topFor,
    industryFilters,
    entityLabels,
    basisNote,
    isEmpty,
    isLoading,
  } = usePagesAndDomains();
  const { isFirstTime } = useDashboardMeta();

  const [activeEntity, setActiveEntity] = useState<AdvertiserEntity>("domain");
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({});
  const [drawerRow, setDrawerRow] = useState<TopAdvertiserRow | null>(null);

  // CHECK isLoading BEFORE isEmpty — loading and zero look identical (both
  // render no rows) and mean opposite things.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Top domains &amp; pages
          </h2>
        </header>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-7 w-40 rounded-md" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        <Skeleton className="mt-2 h-3 w-3/4" />
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Top domains &amp; pages
            <InfoTip tip="block.domains-teaser" />
          </h2>
        </header>
        {/* The `thin` title used to read "No advertisers indexed yet" — the
            retired KPI phrasing ("Advertisers indexed") that exists nowhere
            else in FabAds. This block is called Top domains & pages, so its
            empty state says domains. Unreachable from /insights/overview
            today (the page does not mount this block in `thin`), but the copy
            ships with the component. */}
        <InsightsV2EmptyState
          icon={Globe}
          title={isFirstTime ? "No domains yet" : "Nothing to show yet"}
          description={
            isFirstTime
              ? "Your followed industry hasn't been scanned yet — domains and pages land here once indexing completes."
              : "Follow an industry first to see who's running ads in it."
          }
        />
      </section>
    );
  }

  // Industry filtering was removed from this block: it is a 5-row teaser, and
  // a filter that can only ever narrow 5 rows costs a control and a decision
  // for no reach. Filtering by industry lives on the full Competitors view,
  // which the header links to. `industryFilters[0]` is the unscoped "all"
  // entry, kept only for its domain/page counts on the entity toggle.
  const currentFilter = industryFilters[0];
  const rows = topFor(activeEntity, null);

  const isFollowed = (row: TopAdvertiserRow) => followOverrides[row.key] ?? row.followed;

  const handleFollow = (row: TopAdvertiserRow) => {
    setFollowOverrides((prev) => ({ ...prev, [row.key]: true }));
    toast.success(`Following ${row.label}`);
  };

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Top domains &amp; pages
            <InfoTip tip="block.domains-teaser" />
          </h2>
          {/* Block-level provenance, not per-row: every row shows Live ads
              (observed, Meta Ad Library) and New ads 30d (derived from
              observed data) — never the StoreLeads-estimated tier this table
              used to carry. One chip per tier here is honest; a per-row `≈`
              chip driven by `row.provenance` was not (see file header). */}
          <Provenance tier="observed" compact />
          <Provenance tier="derived" compact />
        </div>
        <Link
          to="/insights/competitors"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-text hover:underline"
        >
          Full Competitors view
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={activeEntity}
          onValueChange={(next) => next && setActiveEntity(next as AdvertiserEntity)}
          className="flex-wrap justify-start"
        >
          {ADVERTISER_ENTITY_ORDER.map((entity) => (
            <ToggleGroupItem key={entity} value={entity} className="h-7 text-[11px]">
              {entityLabels[entity]} (
              {formatInt(entity === "domain" ? currentFilter.domainCount : currentFilter.pageCount)})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <InfoTip tip="metric.domain-vs-page-toggle" />
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-foreground/70">
          No {entityLabels[activeEntity].toLowerCase()} indexed yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 whitespace-nowrap py-1 text-[11px] text-foreground/70">
                  {activeEntity === "page" ? "Page" : "Domain"}
                </TableHead>
                <TableHead className="h-7 whitespace-nowrap py-1 text-[11px] text-foreground/70">Industry</TableHead>
                <TableHead className="h-7 whitespace-nowrap py-1 text-right text-[11px] text-foreground/70">
                  <span className="inline-flex items-center justify-end gap-1">
                    Live ads
                    <InfoTip tip="column.live-ads" />
                  </span>
                </TableHead>
                <TableHead className="h-7 whitespace-nowrap py-1 text-right text-[11px] text-foreground/70">
                  <span className="inline-flex items-center justify-end gap-1">
                    New ads (30d)
                    <InfoTip tip="column.new-ads-30d" />
                  </span>
                </TableHead>
                <TableHead className="h-7 whitespace-nowrap py-1 text-right text-[11px] text-foreground/70">Follow</TableHead>
                <TableHead className="h-7 whitespace-nowrap py-1 text-right text-[11px] text-foreground/70">View ads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const followedNow = isFollowed(row);
                return (
                  <TableRow key={row.key}>
                    <TableCell className="whitespace-nowrap py-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        {row.entity === "page" ? (
                          <Avatar className="h-4 w-4 shrink-0">
                            <AvatarImage src={row.avatarUrl ?? undefined} alt="" />
                            <AvatarFallback className="text-[8px]">
                              {row.label.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        )}
                        <InfoTip tip="action.domain-detail" asChild>
                          <button
                            type="button"
                            onClick={() => setDrawerRow(row)}
                            className="max-w-[130px] truncate text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                          >
                            {row.label}
                          </button>
                        </InfoTip>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[136px] truncate whitespace-nowrap py-1 text-xs text-foreground/70">
                      {row.industry}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1 text-right text-xs tabular-nums text-foreground">
                      {formatInt(row.liveAds)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1 text-right text-xs">
                      <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground">
                        {formatInt(row.newAds30d)}
                        <DeltaMark pct={row.newAds30dDeltaPct} />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1 text-right">
                      {followedNow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/70">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Following
                        </span>
                      ) : (
                        <InfoTip tip="action.follow-domain" asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => handleFollow(row)}
                          >
                            Follow
                          </Button>
                        </InfoTip>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1 text-right">
                      <InfoTip tip="action.view-ads" asChild>
                        <Link
                          to={row.discoverHref}
                          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                        >
                          View ads
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </InfoTip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="mt-2 border-t border-border pt-2 text-[11px] leading-snug text-foreground/70">
        {basisNote}
      </p>

      <Sheet open={drawerRow !== null} onOpenChange={(open) => !open && setDrawerRow(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{drawerRow?.label}</SheetTitle>
            <SheetDescription>
              {drawerRow?.domain}
              {drawerRow?.industry ? ` · ${drawerRow.industry}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">Coming soon</p>
            <p className="mt-1 text-foreground/70">
              A detail page for this {drawerRow?.entity === "page" ? "page" : "domain"} will live here — its
              full ad history, tracker status, and landing pages.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
