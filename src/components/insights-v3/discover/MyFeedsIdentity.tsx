/**
 * My Feeds identity row: "From N competitors · N followed pages · N followed industries".
 * The popover lists every source with an inline unmark / unfollow, and links to Advertiser
 * to add more. Names truncate with a tooltip (60+ char page names are real).
 */
import { ChevronDown, Layers, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdvertiser, getIndustry } from "@/lib/insights-v3/data";
import { toggleCompetitor, toggleFollowIndustry, toggleFollowPage, type CompetitorKind } from "@/lib/insights-v3/stores";
import type { UserPrefs } from "@/lib/insights-v3/selectors";
import { INSIGHTS_ROUTES } from "@/lib/insights-v3/types";
import { TruncatedText, fmtInt } from "@/components/insights-v3/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function Count({ n, one, many }: { n: number; one: string; many: string }) {
  return (
    <span>
      <span className="font-mono font-semibold tabular-nums text-primary-text">{fmtInt(n)}</span> {n === 1 ? one : many}
    </span>
  );
}

function SourceRow({ label, actionLabel, onRemove }: { label: string; actionLabel: string; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-2 py-1">
      <TruncatedText text={label} className="flex-1 text-sm text-foreground" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${actionLabel} ${label}`}
        className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" aria-hidden="true" />
        {actionLabel}
      </button>
    </li>
  );
}

function Group({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="py-1.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {empty ? <p className="py-1 text-xs italic text-muted-foreground">None yet</p> : <ul>{children}</ul>}
    </section>
  );
}

/**
 * `empty` = the page is showing its "nothing feeds My Feeds" state (nothing followed or marked, or `?state=empty`).
 * The row then says so instead of quoting counts that contradict the screen below it.
 */
export function MyFeedsIdentity({ prefs, empty = false }: { prefs: UserPrefs; empty?: boolean }) {
  if (empty) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/30 bg-primary/5 px-2.5 py-1 text-foreground">
          <Layers className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
          Nothing followed yet
        </span>
        <Link
          to={INSIGHTS_ROUTES.advertiser}
          className="rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Mark competitors or follow pages
        </Link>
      </div>
    );
  }
  const competitors: { kind: CompetitorKind; id: string }[] = [
    ...prefs.competitorPageIds.map((id) => ({ kind: "page" as const, id })),
    ...prefs.competitorDomainIds.map((id) => ({ kind: "domain" as const, id })),
  ];
  const nameOf = (id: string) => getAdvertiser(id)?.name ?? id;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`From ${competitors.length} ${competitors.length === 1 ? "competitor" : "competitors"}, ${prefs.followedPageIds.length} followed ${prefs.followedPageIds.length === 1 ? "page" : "pages"}, ${prefs.followedIndustryIds.length} followed ${prefs.followedIndustryIds.length === 1 ? "industry" : "industries"}. See what feeds My Feeds`}
            className="group inline-flex flex-wrap items-center gap-x-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-left text-sm text-foreground hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Layers className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
            <span className="text-muted-foreground">From</span>{" "}
            <Count n={competitors.length} one="competitor" many="competitors" />
            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <Count n={prefs.followedPageIds.length} one="followed page" many="followed pages" />
            <span aria-hidden="true" className="text-muted-foreground">·</span>
            <Count n={prefs.followedIndustryIds.length} one="followed industry" many="followed industries" />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px] p-3">
          <div className="max-h-[320px] divide-y divide-border overflow-y-auto pr-1">
            <Group title="Competitors" empty={competitors.length === 0}>
              {competitors.map((c) => (
                <SourceRow
                  key={`${c.kind}:${c.id}`}
                  label={`${nameOf(c.id)}${c.kind === "domain" ? " (domain)" : ""}`}
                  actionLabel="Unmark"
                  onRemove={() => toggleCompetitor(c.kind, c.id)}
                />
              ))}
            </Group>
            <Group title="Followed pages" empty={prefs.followedPageIds.length === 0}>
              {prefs.followedPageIds.map((id) => (
                <SourceRow key={id} label={nameOf(id)} actionLabel="Unfollow" onRemove={() => toggleFollowPage(id)} />
              ))}
            </Group>
            <Group title="Followed industries" empty={prefs.followedIndustryIds.length === 0}>
              {prefs.followedIndustryIds.map((id) => (
                <SourceRow key={id} label={getIndustry(id)?.label ?? id} actionLabel="Unfollow" onRemove={() => toggleFollowIndustry(id)} />
              ))}
            </Group>
          </div>
          <Link
            to={INSIGHTS_ROUTES.advertiser}
            className="mt-2 inline-flex rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Mark competitors or follow pages
          </Link>
        </PopoverContent>
      </Popover>
      <Link
        to={INSIGHTS_ROUTES.advertiser}
        className="rounded-sm text-xs font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Mark competitors or follow pages
      </Link>
    </div>
  );
}
