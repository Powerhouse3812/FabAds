/**
 * ChangeFeed — "what changed since last time," pre-computed.
 *
 * We scanned 12 ad-intelligence products for this brief and not one of them
 * opens with this question. Meta Ad Library keeps no baseline, so there is
 * nothing to diff against. Foreplay groups by launch date but only inside a
 * single brand — there's no roll-up across everyone you follow. Meanwhile the
 * documented weekly ritual of a performance marketer is exactly: what's new →
 * what's still running → what disappeared → write a brief. This block is that
 * ritual, done for them.
 *
 * ── Rebuilt to Maalik's verdict (KISS pass) ─────────────────────────────────
 * The previous version stacked seven separate horizontal bands — a kind-filter
 * chip row, a "your visit / last scan" toggle, a seen/unseen marker system, an
 * all-caps attribution line — and Maalik's read was blunt: no hierarchy, no
 * plain labels, "are random lines and cards." All of that is gone. This is now
 * exactly three zones, always, no per-user state:
 *
 *  1. Header — one line: `WHAT CHANGED` + the window and count. Nothing else.
 *  2. Lead — the single biggest change, headline + real numbers + the source
 *     line ON the surface (never a tooltip — that was the fix for "kaha se aa
 *     rahi hai, kya hai wo data?").
 *  3. Every remaining change, one row each, inside a fixed-height scroller.
 *     No cap, no "Show all" toggle — scrolling is the affordance.
 *
 * There is no filtering UI, no read/unread concept, and no per-visit state.
 * The block answers exactly one question — what changed since the last scan —
 * the same way for everyone, every time. `seenStore.ts` still exists on disk
 * for whichever surface still wants it; this file no longer imports it.
 *
 * ── Third KISS pass — Maalik rejected the second cut too ──────────────────
 * Verbatim: "Simplify this section, into a simple list, with tags and columns
 * to show the details. and uspe actions only to view there Ads." This is his
 * third pass on this block, after "too complex to understand," "cluttered,"
 * and "bohot bekar... samajh nahi aa rahi." What changed, concretely:
 *
 *  - **Rows are now a real table, matching `DomainsTeaser`'s grammar** — the
 *    other "who did what" block on this same dashboard, which already solved
 *    exactly this problem (header cells, `table-fixed` columns, a "View ads"
 *    action). Two blocks answering a structurally identical question must not
 *    look like two different products. Columns: Change · Advertiser ·
 *    Industry · Detail · Seen · View ads. `table-fixed` + `truncate` on every
 *    text cell is the actual fix for the horizontal scrollbar Maalik's
 *    screenshot showed — every row used to size itself independently, so
 *    "Offer shift" and "Format expansion" pushed the advertiser to different
 *    x-positions and the row overflowed its container. A fixed column grid
 *    can't do either: everything lines up, and nothing can push past 100%
 *    width. Industry gets its own column, so "Health & Wellness" no longer
 *    gets cut to "Health & …" for lack of room.
 *  - **The kind is now a tag, not an icon-plus-loose-text.** `TrendRow`'s
 *    first column renders `CHANGE_KIND_LABELS[kind]` inside a `Badge`
 *    (`variant="outline"`, so it reads on the page's neutral surface without
 *    a new colour token). Kinds are still never colour-coded — the label text
 *    inside the tag carries the distinction, same as before, just packaged as
 *    a chip instead of a bare icon + span.
 *  - **The only row action is View ads**, and it is real: `/insights/discover
 *    ?domain=<signal.domain>` — verified against `InsightsDiscover.tsx`,
 *    which genuinely reads `?domain=` (alongside `?angle=` / `?longevity=`)
 *    as a plain equality filter on `InsightAd.domain`. Reuses the exact
 *    `action.view-ads` tooltip key `DomainsTeaser` already registered — same
 *    action, same copy, no second explanation of one idea.
 *  - **Row-level Dismiss is gone.** The lead card keeps its top-right corner
 *    cross — Maalik asked for that explicitly in the previous round
 *    ("biggest change ko intact rakho") — but a list row's only action now is
 *    View ads, full stop. `dismissedIds` / `handleDismiss` still exist for
 *    the lead card alone.
 *  - **The expand chevron and the evidence disclosure are gone, everywhere —
 *    including the lead card.** Maalik's ask was for the details to be
 *    *visible*, in columns, not behind a per-row toggle; keeping a disclosure
 *    on rows while removing it from the header would have left one
 *    inconsistent leftover control. That orphans `ChangeSignal.evidence`
 *    (the quoted supporting sentences). Decision, stated plainly: **evidence
 *    goes** — it does not become a column. The one genuinely useful part of
 *    it was always a number ("15 ads changed"), and that number already
 *    surfaces on its own, parsed by `extractAdCount` / `shortFact`, as the
 *    Detail column (rows) and the ad-count line (lead). The raw evidence
 *    sentences were restating that same number in prose; once the number has
 *    its own column, the sentence is redundant, not additive. Nothing reads
 *    `signal.evidence` in this file anymore.
 *  - **`advertiserRelationship` becomes a tag, not a floating tick.** The
 *    small unlabelled check mark that used to sit before "Helios Health" is
 *    now a compact `Badge` reading "Tracked" inside the Advertiser cell —
 *    legible on its own, in greyscale, without a hover. Silence still means
 *    market-only, matching the pattern `MarketMovers` and `DomainsTeaser` use
 *    elsewhere on this page.
 *  - **No native `title=` anywhere in this file.** The old build used
 *    `title=` to surface full advertiser/industry names past truncation and
 *    the full freshness range past the short age mark — exactly the "never a
 *    native title=" pattern this dashboard has moved away from. `DomainsTeaser`,
 *    the file this component now mirrors, already omits `title=` on its own
 *    truncated Domain/Industry cells; this file matches that, accepting that
 *    a genuinely 60+ character name truncates with an ellipsis and nothing
 *    more, rather than reaching for a native tooltip substitute.
 *
 * `representativeAdId` is null on withdrawal signals — the ad is gone. That
 * fact doesn't block View ads here, because View ads is domain-scoped (every
 * ad that domain has ever run), not tied to the one withdrawn ad — the same
 * reasoning `DomainsTeaser` uses for its own View ads column.
 *
 * ── The brief moved out ──────────────────────────────────────────────────
 * `DailyBrief` used to be embedded at the top of this card. Maalik: "^ new
 * what ????" — the chips read as an unlabeled mystery bolted onto a feed. This
 * card now contains only changes; `DailyBrief` is not rendered here at all.
 * It still works standalone (unchanged, in its own file) for whichever page
 * mounts it later.
 *
 * ── Loading is not empty ─────────────────────────────────────────────────
 * In `loading` every collection is `[]`, so `isEmpty` is true — exactly as it
 * is in `zero`, and meaning the opposite. `isLoading` is therefore checked
 * BEFORE `isEmpty`: "nothing to compare against yet" is a finding, and we have
 * not earned it until the scan answers. The skeleton below is shaped to the
 * table layout above, not the old one-line-per-row shape.
 */
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  EyeOff,
  Gauge,
  Layers,
  Lightbulb,
  Radar,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { Provenance, PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import {
  CHANGE_KIND_LABELS,
  useChangeFeed,
  useDashboardMeta,
  type ChangeSignal,
  type ChangeSignalKind,
} from "@/insights-dashboard/lib/selectors";

const CHANGE_KIND_ICONS: Readonly<Record<ChangeSignalKind, LucideIcon>> = {
  "new-angle": Lightbulb,
  "offer-shift": Tag,
  "format-expansion": Layers,
  "velocity-change": Gauge,
  "landing-page-change": ArrowRightLeft,
  withdrawal: EyeOff,
};

const MICRO_LABEL =
  "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70";

/** How tall the remaining-changes list gets before it scrolls internally,
 * per Maalik: "fixed height with inside scroll." This is a max, not a fixed
 * box — a short list is shorter, a long one scrolls, but the card never
 * grows past this to fit more rows. */
const LIST_MAX_HEIGHT = "max-h-[264px]";

/** `/insights/discover?domain=…` — every ad this advertiser's domain runs.
 * Verified against `InsightsDiscover.tsx`'s own `searchParams.get("domain")`
 * read — a plain equality match on `InsightAd.domain` — so this link returns
 * exactly what the row promised, not a filter that silently does nothing. */
function discoverHrefFor(signal: ChangeSignal): string {
  return `/insights/discover?domain=${encodeURIComponent(signal.domain)}`;
}

/**
 * ── Lead card number parsing ───────────────────────────────────────────────
 * Maalik's complaint was that the feed was unsourced ("kaha se aa rahi hai,
 * kya hai wo data?"). The lead card fixes that — but its numbers have to be
 * REAL, not decoration invented for the mockup. `ChangeSignal` has no
 * structured `adCount` field; the count lives inside `headline` / `evidence`,
 * the exact strings the selector already assembled (see `SIGNAL_TEMPLATES`
 * in fixtures.ts). This reads that number back out rather than minting a new
 * one. `evidence` is only ever used here as a parsing source, never rendered
 * — see the file doc comment's "evidence goes" decision.
 */
function extractAdCount(signal: ChangeSignal): number | null {
  const text = `${signal.headline} ${signal.evidence.join(" ")}`;
  const match = text.match(/(\d+)\s+(?:new\s+|live\s+)*(?:video\s+|carousel\s+|image\s+)?ads?\b/i);
  return match ? Number(match[1]) : null;
}

/** "in the last N days" / "past N days" — the window the count above covers.
 * Not every kind's evidence states one, so this is honestly nullable rather
 * than guessed. */
function extractWindowDays(signal: ChangeSignal): number | null {
  const text = signal.evidence.join(" ");
  const match = text.match(/(?:last|past|in)\s+(\d+)\s+days?/i);
  return match ? Number(match[1]) : null;
}

/** One short, real fact for the Detail column — e.g. "3 ads changed". Null
 * when this signal's text doesn't carry a countable number; the row falls
 * back to the plain headline in that case. */
function shortFact(signal: ChangeSignal): string | null {
  const n = extractAdCount(signal);
  if (n === null) return null;
  switch (signal.kind) {
    case "withdrawal":
      return `${n} ads stopped running`;
    case "new-angle":
      return `${n} ads on new angle`;
    case "offer-shift":
      return `${n} ads changed`;
    case "format-expansion":
      return `${n} new-format ads`;
    case "velocity-change":
      return `${n} ads this week`;
    case "landing-page-change":
      return `${n} ads redirected`;
    default:
      return null;
  }
}

/** The single biggest change of the week: most ads moved (falling back to
 * `observationCount` when no count parses), ties broken by most recent. */
function pickLeadSignal(trends: readonly ChangeSignal[]): ChangeSignal | null {
  if (trends.length === 0) return null;
  return [...trends].sort((a, b) => {
    const aMag = extractAdCount(a) ?? a.observationCount;
    const bMag = extractAdCount(b) ?? b.observationCount;
    if (bMag !== aMag) return bMag - aMag;
    return a.lastSeenDaysAgo - b.lastSeenDaysAgo;
  })[0];
}

function daysAgoLabel(n: number): string {
  if (n <= 0) return "today";
  if (n === 1) return "1d ago";
  return `${n}d ago`;
}

/** The Seen column's short mark — "today" / "1d" / "6d". No `title=` fallback
 * for the full range anymore (see file doc comment) — this is the whole
 * fact, honestly truncated to what a column this narrow can hold. */
function shortAge(n: number): string {
  if (n <= 0) return "today";
  if (n === 1) return "1d";
  return `${n}d`;
}

/**
 * One table row: a kind tag, advertiser (+ a "Tracked" tag when followed),
 * industry, the one real fact, how recently it was seen, and View ads — the
 * row's only action. `table-fixed` column widths (declared on the header
 * cells) plus `truncate` on every text cell are what keep this row from ever
 * pushing the table wider than its container — the fix for the horizontal
 * scrollbar in Maalik's screenshot.
 *
 * Kinds are still never colour-coded: the tag's text label is what carries
 * the distinction, in greyscale as much as in colour. `withdrawal`'s icon
 * (`EyeOff`) sits inside the same tag as its label, so it is never at risk of
 * being misread as an action glyph the way it could when it stood alone next
 * to a Dismiss `X` in the previous build — there is no `X` on a row anymore.
 */
function TrendRow({ signal }: { signal: ChangeSignal }) {
  const fact = shortFact(signal);

  return (
    <TableRow>
      <TableCell className="overflow-hidden px-2 py-1.5 align-middle">
        {/* No icon on the row-level tag — the row is dense (six columns in
            ~730px), and every kind label already reads on its own as text;
            the icon stayed on the lead card, where there's room to spare. */}
        <Badge
          variant="outline"
          className="inline-flex max-w-full items-center whitespace-nowrap px-1.5 py-0 text-[10px] font-medium normal-case tracking-normal text-foreground"
        >
          <span className="truncate">{CHANGE_KIND_LABELS[signal.kind]}</span>
        </Badge>
      </TableCell>

      <TableCell className="overflow-hidden px-2 py-1.5 align-middle">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {signal.advertiser}
          </span>
          {/* A tracked competitor gets its own tag — answers "who is this"
              for the case that actually matters to act on. Silence means
              market-only, matching `DomainsTeaser` / `MarketMovers`. */}
          {signal.advertiserRelationship === "followed" && (
            <Badge
              variant="outline"
              className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap px-1.5 py-0 text-[9px] font-medium normal-case tracking-normal text-foreground"
            >
              <Check className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              Tracked
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="overflow-hidden truncate px-2 py-1.5 align-middle text-xs text-foreground/70">
        {signal.industry}
      </TableCell>

      <TableCell className="overflow-hidden truncate px-2 py-1.5 align-middle text-xs text-foreground/70">
        {fact ?? signal.headline}
      </TableCell>

      <TableCell className="overflow-hidden px-2 py-1.5 align-middle text-right">
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10px] tabular-nums text-foreground/70">
          {shortAge(signal.lastSeenDaysAgo)}
          {signal.provenance === "estimated" && <Provenance tier="estimated" compact />}
        </span>
      </TableCell>

      <TableCell className="overflow-hidden px-2 py-1.5 align-middle text-right">
        <InfoTip tip="action.view-ads" asChild>
          <Link
            to={discoverHrefFor(signal)}
            className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            View ads
            <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          </Link>
        </InfoTip>
      </TableCell>
    </TableRow>
  );
}

/**
 * The single biggest change of the week: a real plain-language headline, the
 * concrete numbers (ad count + window), the source stated on the surface —
 * never behind a hover, that's the exact fix for "kaha se aa rahi hai" — and
 * View ads, the same real domain-scoped link every row below it carries. The
 * card's only other action is Dismiss, kept in its top-right corner per
 * Maalik's explicit previous-round instruction; dismissing it promotes the
 * next-biggest change on the next render, since `pickLeadSignal` reads off
 * the live (non-dismissed) trend list every time.
 *
 * The Before/Now magnitude bars this card used to carry, and the "Show
 * detail" evidence disclosure, are both gone — the former cut in the previous
 * round ("Remove before and now"), the latter cut in this one (see file doc
 * comment's "evidence goes" decision, which applies here too — a lone
 * disclosure surviving on the lead while every row lost theirs would have
 * been the one inconsistent leftover control).
 */
function LeadChangeCard({
  signal,
  onDismiss,
}: {
  signal: ChangeSignal;
  onDismiss: () => void;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  const provenanceMeta = PROVENANCE_META[signal.provenance];
  const adCount = extractAdCount(signal) ?? signal.observationCount;
  const windowDays = extractWindowDays(signal);
  const windowLabel =
    windowDays !== null ? `over ${windowDays}d` : `since ${daysAgoLabel(signal.firstSeenDaysAgo)}`;
  // The exact fix for "kaha se aa rahi hai" — source and freshness stated on
  // the surface, not left to a hover. The scan count that used to sit here
  // ("6 scans compared") was cut per Maalik: internal telemetry with no
  // action attached to it, and `Provenance` already owns "where's this from."
  const sourceLine = `${provenanceMeta.source} · first seen ${daysAgoLabel(signal.firstSeenDaysAgo)}`;

  return (
    <div className="relative rounded-md border border-border bg-muted/20 p-2.5">
      {/* Dismiss sits in the card's TOP-RIGHT CORNER, per Maalik: "keep the
          cross action but on the top right corner". It is the card's only
          action besides View ads, so cornering it reads as chrome — the way
          a close affordance reads on any card. `pr-7` on the header keeps
          the label clear of it. */}
      <InfoTip tip="action.dismiss-signal" asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onDismiss}
          className="absolute right-1 top-1 h-6 w-6 shrink-0 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </InfoTip>

      <div className="min-w-0 pr-7">
        <div className="flex items-center gap-1.5">
          <span className={MICRO_LABEL}>Biggest change this week</span>
          {/* Kind label always renders as text here too, packaged the same
              tag shape as `TrendRow`'s Change column. */}
          <Badge
            variant="outline"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-1.5 py-0 text-[10px] font-medium normal-case tracking-normal text-foreground"
          >
            <KindIcon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            {CHANGE_KIND_LABELS[signal.kind]}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
          {signal.headline}
        </p>
        {/* Answers "who is this advertiser" directly — the exact context
            Maalik said made the sentence click for him. Now a tag, matching
            the row-level "Tracked" tag, not a floating tick or bare
            sentence. Guarded: the field is optional, and older/edge signals
            may not carry it. */}
        {signal.advertiserRelationship === "followed" && (
          <Badge
            variant="outline"
            className="mt-1 inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap px-1.5 py-0 text-[9px] font-medium normal-case tracking-normal text-foreground"
          >
            <Check className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            Tracked
          </Badge>
        )}
        <p className="mt-0.5 text-sm tabular-nums text-foreground">
          {adCount} {adCount === 1 ? "ad" : "ads"} · {windowLabel}
        </p>
        <p className={cn(MICRO_LABEL, "mt-0.5")}>
          {sourceLine}
        </p>
      </div>

      <div className="mt-1.5">
        <InfoTip tip="action.view-ads" asChild>
          <Link
            to={discoverHrefFor(signal)}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            View ads
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </InfoTip>
      </div>
    </div>
  );
}

/**
 * Placeholder that traces the real feed: the header line, a block shaped like
 * `LeadChangeCard`, then a table shaped like the real one — same column
 * proportions, so nothing jumps when the data lands. A skeleton that doesn't
 * match what replaces it just moves the layout jump to the moment the data
 * arrives, which is worse than showing nothing.
 */
function ChangeFeedSkeleton(): JSX.Element {
  return (
    <div className="space-y-2" aria-hidden="true">
      {/* Lead-card-shaped block, matching `LeadChangeCard`'s box height so
          nothing jumps when it lands. */}
      <div className="rounded-md border border-border bg-muted/20 p-2.5">
        <div className="space-y-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="mt-1.5 h-3 w-16" />
        </div>
      </div>

      {/* Table-shaped rows: same column proportions as the real table
          (Change · Advertiser · Industry · Detail · Seen · View ads). */}
      <div className="space-y-2 py-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-[14%] shrink-0 rounded-full" />
            <Skeleton className="h-4 w-[20%] shrink-0" />
            <Skeleton className="h-3 w-[16%] shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-6 shrink-0" />
            <Skeleton className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChangeFeed({ className }: { className?: string }): JSX.Element {
  // `gated` / `gatedNote` are still computed by the selector but no longer
  // read here — per Maalik's "what is watching list, why it is there," the
  // once-observed group renders nowhere now, not merged into `trends` as if
  // it had already cleared the recurrence gate. See the file doc comment.
  const { trends, sinceLabel, isEmpty, isLoading } = useChangeFeed();
  // `firstTime`/`empty` still show real market-wide changes (`signals` is
  // never scoped to the user's own follow list — see CONTRACT.md's caption
  // trap). "Since {sinceLabel}" implies a personal last-visit baseline that
  // doesn't exist there, so the header reframes to the market and states the
  // honest gap — real changes, and how few industries this user follows to
  // catch them — using the same "industries FabAds tracks" phrasing already
  // used elsewhere on this page (`cadenceScopeNote`, `stateNote`).
  const { isFirstTime, isEmptyState, followedIndustryCount } = useDashboardMeta();
  const isMarketFraming = isFirstTime || isEmptyState;

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  // Deliberately does NOT write anywhere else: a dismissed row is just gone
  // from view, and Undo puts it right back, lossless. Only the lead card can
  // dismiss now — see file doc comment.
  function handleDismiss(signal: ChangeSignal) {
    setDismissedIds((prev) => new Set(prev).add(signal.id));
    toast.success("Dismissed from this feed", {
      description: signal.headline,
      action: {
        label: "Undo",
        onClick: () =>
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.delete(signal.id);
            return next;
          }),
      },
    });
  }

  // Everything still in the feed. Dismissed rows are gone for good (Undo
  // aside).
  const liveTrends = useMemo(
    () => trends.filter((s) => !dismissedIds.has(s.id)),
    [trends, dismissedIds],
  );

  // Zone 2. Dismissing the lead recomputes `liveTrends`, so the next-biggest
  // change is automatically promoted on the next render.
  const leadSignal = pickLeadSignal(liveTrends);
  // Zone 3: every remaining change, no cap — the scroller (see
  // `LIST_MAX_HEIGHT`) is the affordance, not a "Show all N" link.
  const remainingTrends = leadSignal
    ? liveTrends.filter((s) => s.id !== leadSignal.id)
    : liveTrends;

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      {/* Zone 1 — one line, nothing else. `InfoTip` now carries the
          attribution/explanation that used to live in a bare `title=""` on
          this header — kept as one tooltip, not stacked as two. */}
      <header className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <span className="inline-flex items-center gap-1">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            What changed
          </h2>
          <InfoTip tip="block.change-feed" />
        </span>
        {!isLoading && !isEmpty && (
          <span className="text-xs text-foreground/70">
            {isMarketFraming
              ? `Across the industries FabAds tracks · ${liveTrends.length} ${liveTrends.length === 1 ? "change" : "changes"} · you follow ${followedIndustryCount} ${followedIndustryCount === 1 ? "industry" : "industries"}`
              : `Since ${sinceLabel} · ${liveTrends.length} ${liveTrends.length === 1 ? "change" : "changes"}`}
          </span>
        )}
      </header>

      {/* isLoading FIRST: in `loading`, `isEmpty` is true and means "we
          haven't looked yet", not "there is nothing". */}
      {isLoading ? (
        <ChangeFeedSkeleton />
      ) : isEmpty ? (
        <InsightsV2EmptyState
          icon={Radar}
          title="Nothing to compare against yet"
          description="We need at least two scans of the same advertiser before we can call anything a change. That's nothing to compare against yet — not proof that nothing is happening."
        />
      ) : (
        <div className="space-y-2">
          {/* Zone 2 — the lead. */}
          {leadSignal && (
            <LeadChangeCard signal={leadSignal} onDismiss={() => handleDismiss(leadSignal)} />
          )}

          {/* Zone 3 — every remaining change, as a real table: tags for the
              kind and tracked status, fixed columns for the rest, fixed-height
              inner scroll, no cap. `table-fixed` + `truncate` on every text
              cell keeps this from ever overflowing its container sideways. */}
          {remainingTrends.length > 0 ? (
            <div className={cn(LIST_MAX_HEIGHT, "overflow-y-auto overflow-x-hidden")}>
              <Table className="table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-7 w-[18%] px-2 py-1 text-[11px] text-foreground/70">Change</TableHead>
                    <TableHead className="h-7 w-[18%] px-2 py-1 text-[11px] text-foreground/70">Advertiser</TableHead>
                    <TableHead className="h-7 w-[19%] px-2 py-1 text-[11px] text-foreground/70">Industry</TableHead>
                    <TableHead className="h-7 w-[24%] px-2 py-1 text-[11px] text-foreground/70">Detail</TableHead>
                    <TableHead className="h-7 w-[9%] px-2 py-1 text-right text-[11px] text-foreground/70">Seen</TableHead>
                    <TableHead className="h-7 w-[12%] whitespace-nowrap px-2 py-1 text-right text-[11px] text-foreground/70">
                      View ads
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remainingTrends.map((signal) => (
                    <TrendRow key={signal.id} signal={signal} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            !leadSignal && (
              <p className="py-2 text-xs text-foreground/70">
                No signal has cleared the recurrence gate yet.
              </p>
            )
          )}
        </div>
      )}
    </section>
  );
}
