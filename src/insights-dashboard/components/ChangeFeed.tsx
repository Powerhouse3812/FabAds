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
 *  3. Every remaining change, one line each, inside a fixed-height scroller.
 *     No cap, no "Show all N" toggle — scrolling is the affordance.
 *
 * There is no filtering UI, no read/unread concept, and no per-visit state.
 * The block answers exactly one question — what changed since the last scan —
 * the same way for everyone, every time. `seenStore.ts` still exists on disk
 * for whichever surface still wants it; this file no longer imports it.
 *
 * ── Second KISS pass — Maalik rejected the first cut too ────────────────
 * Verbatim: "too complex to understand and cluttered also, too much content
 * heavy." Removed, not merged or relabelled:
 *  - **Brief it / Watch.** Two of three row actions, gone. Dismiss is the
 *    only action left — it's the only one with a real, honest outcome (the
 *    row leaves the feed, Undo brings it back). "Queued for a brief that
 *    doesn't exist" and "watching with no real alert" were both inert
 *    prototype state dressed as functionality; cutting them is the fix, not
 *    explaining them better.
 *  - **The "Watching — not yet a trend" group.** A single observation used
 *    to get its own de-emphasised, collapsible section. Maalik: "what is
 *    watching list, why it is there... looking too extra." Gated signals
 *    (`observationCount` below the recurrence gate) now render nowhere —
 *    not merged into the main list as if they were confirmed, just absent
 *    until a second scan actually earns them a row. `useChangeFeed()` still
 *    computes `gated` for whoever else wants it; this file no longer reads
 *    that field.
 *  - **The word "evidence," and the two-line cap.** The disclosure under the
 *    chevron is now "Show detail," plain sentences with no quotation marks,
 *    and `line-clamp-2` as a hard ceiling — not a courtroom transcript.
 *  - **"X scans compared."** Cut from the lead card's source line — internal
 *    scan telemetry, not something a user acts on. `Provenance` already owns
 *    "where did this come from"; the source line now states just the source
 *    and first-seen date, once.
 *  - **The lead card's Before/Now magnitude bars.** Maalik: "Remove before
 *    and now." `LeadChangeCard` itself was briefly slated for a full
 *    replacement and then explicitly un-slated — "biggest change ko intact
 *    rakho" — so it stays as this block's lead, but the bars go regardless;
 *    that cut was never contingent on the card's fate.
 *
 * Added, not just subtracted: a row's advertiser now also carries
 * `ChangeSignal.advertiserRelationship` when the selector has it — a small
 * check mark (`TrendRow`) or a plain-language line (`LeadChangeCard`, "a
 * brand you follow" / "part of the wider market") answering the other half
 * of "who is Mantra Labs??": not just what industry they're in, but whether
 * they're one of yours. Both fields are optional on `ChangeSignal`, so every
 * read here is guarded — a signal without them just renders as it did
 * before.
 *
 * `representativeAdId` is null on withdrawal signals — the ad is gone, so
 * there is nothing to link to. Rather than invent a "View ad" affordance
 * this module has no real destination for (Industry Insights has no ad
 * detail route yet), we simply never build UI off that id.
 *
 * Kinds are never colour-coded — icon + label carries the distinction, per
 * the design system's ban on hue-only meaning, and the kind label now always
 * renders as text (never icon-only, at any width) so a state glyph like
 * `withdrawal`'s `EyeOff` is never left to be misread as another action
 * glyph next to Dismiss's `X` — see `TrendRow` below. Dismiss is local
 * optimistic state only: no store writes, no Supabase, no network. It
 * actually drops the row from view, with an Undo toast.
 *
 * The advertiser name in a row is now always paired with its industry
 * (`Mantra Labs · Skincare`) rather than standing alone. Maalik's complaint
 * was that the bold word in the middle of a row had no identity — "angle
 * hai, category hai kya hai" — pairing a proper noun with a category name
 * is a self-evident, no-hover way to say "this is a company, here's its
 * industry," using a field (`ChangeSignal.industry`) that already existed.
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
 * not earned it until the scan answers.
 */
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
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
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
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

/**
 * ── Lead card number parsing ───────────────────────────────────────────────
 * Maalik's complaint was that the feed was unsourced ("kaha se aa rahi hai,
 * kya hai wo data?"). The lead card fixes that — but its numbers have to be
 * REAL, not decoration invented for the mockup. `ChangeSignal` has no
 * structured `adCount` field; the count lives inside `headline` / `evidence`,
 * the exact strings the selector already assembled (see `SIGNAL_TEMPLATES`
 * in fixtures.ts). This reads that number
 * back out rather than minting a new one.
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

/** One short, real fact for a remaining row — e.g. "3 ads changed" — never
 * the full quoted evidence (that stays behind the row's expander). Null when
 * this signal's text doesn't carry a countable number; the row falls back to
 * the plain headline in that case. */
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

/** The one-line row's age mark — "today" / "1d" / "6d". The full range lives
 * in the row's title attribute so nothing is lost, just demoted. */
function shortAge(n: number): string {
  if (n <= 0) return "today";
  if (n === 1) return "1d";
  return `${n}d`;
}

/** "Seen 2d ago" when first/last collapse to the same day, else a range. */
function freshnessLine(signal: ChangeSignal): string {
  if (signal.firstSeenDaysAgo === signal.lastSeenDaysAgo) {
    return `Seen ${daysAgoLabel(signal.lastSeenDaysAgo)}`;
  }
  return `First seen ${daysAgoLabel(signal.firstSeenDaysAgo)} · last seen ${daysAgoLabel(signal.lastSeenDaysAgo)}`;
}

interface RowActionState {
  onDismiss: () => void;
}

/**
 * One line: kind icon + kind label · advertiser + industry · one short fact
 * · age · Dismiss. Everything beyond that surface is a hover/click away, not
 * gone:
 *
 *  - Evidence lives behind a `Collapsible`, triggered by the chevron. It is
 *    this row's credibility, so the trigger itself stays always-visible,
 *    only the detail text is hidden until asked for.
 *  - The full freshness range and provenance tier live in the age mark's
 *    `title` — a hover away, not gone.
 *  - Dismiss reveals on hover / focus-within, so a mouse user only sees it
 *    over the row they're looking at, and a keyboard user still reaches it
 *    by Tab (opacity, never `hidden`, keeps it in the tab order). It sits
 *    alone at the row's trailing edge — with Brief it and Watch gone, there
 *    is nothing left beside it to compete with, so its corner position now
 *    reads as chrome, not as one of several row-body actions.
 *
 * The kind icon + label is always rendered as text, at every width — never
 * icon-only. That is what keeps a state glyph (`withdrawal`'s `EyeOff`, "went
 * quiet") from ever being mistaken for an action glyph like Dismiss's `X`:
 * one always carries a caption, the other is a single, standard, corner
 * close control. Per Maalik: two remove-shaped icons on one row with nothing
 * telling them apart was the actual defect, not the icons themselves.
 */
function TrendRow({
  signal,
  open,
  onOpenChange,
  actions,
}: {
  signal: ChangeSignal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: RowActionState;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  const hasEvidence = signal.evidence.length > 0;
  const provenanceMeta = PROVENANCE_META[signal.provenance];
  const fact = shortFact(signal);

  return (
    <Collapsible asChild open={open} onOpenChange={onOpenChange}>
      <li className="group/row -mx-1.5 rounded-md px-1.5 hover:bg-muted/30 focus-within:bg-muted/30">
        <div className="flex items-center gap-2 py-1.5">
          <span className="inline-flex shrink-0 items-center gap-1">
            <KindIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-foreground/70">{CHANGE_KIND_LABELS[signal.kind]}</span>
          </span>

          {/* Advertiser paired with its industry — never a bare bold word.
              Fixes "angle hai, category hai kya hai": the proper noun +
              category-name pairing is self-identifying without a hover. */}
          <span
            className="inline-flex max-w-[180px] shrink-0 items-center gap-1 truncate text-sm leading-snug"
            title={
              signal.advertiserRelationshipLabel
                ? `${signal.advertiser} · ${signal.industry} — ${signal.advertiserRelationshipLabel}`
                : `${signal.advertiser} · ${signal.industry}`
            }
          >
            {/* A tracked competitor gets a small check — the same marker
                `MarketMovers` uses for "Tracked" elsewhere on this page —
                answering "who is this" for the case that actually matters to
                act on. Silence means market-only, matching that pattern. */}
            {signal.advertiserRelationship === "followed" && (
              <>
                <Check className="h-3 w-3 shrink-0 text-foreground/70" aria-hidden="true" />
                <span className="sr-only">Tracked competitor</span>
              </>
            )}
            <span className="truncate">
              <span className="font-medium text-foreground">{signal.advertiser}</span>
              <span className="text-foreground/70"> · {signal.industry}</span>
            </span>
          </span>

          <span
            className="min-w-0 flex-1 truncate text-xs text-foreground/70"
            title={signal.headline}
          >
            {fact ?? signal.headline}
          </span>

          <span
            className="shrink-0 font-mono text-[10px] tabular-nums text-foreground/70"
            title={`${freshnessLine(signal)} · ${provenanceMeta.label} · ${provenanceMeta.source}`}
          >
            {shortAge(signal.lastSeenDaysAgo)}
          </span>

          {signal.provenance === "estimated" && <Provenance tier="estimated" compact />}

          {hasEvidence ? (
            <CollapsibleTrigger
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
              aria-label={open ? "Hide detail" : "Show detail"}
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
          ) : (
            <span className="w-6 shrink-0" aria-hidden="true" />
          )}

          <div
            className={cn(
              "shrink-0 opacity-0 transition-opacity",
              "group-hover/row:opacity-100 group-focus-within/row:opacity-100",
            )}
          >
            <InfoTip tip="action.dismiss-signal" asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={actions.onDismiss}
                className="h-6 w-6 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </InfoTip>
          </div>
        </div>

        {hasEvidence && (
          <CollapsibleContent>
            <p className="line-clamp-2 py-1 pb-2 pl-[3.75rem] pr-2 text-xs leading-snug text-foreground/70">
              {signal.evidence.join(" · ")}
            </p>
          </CollapsibleContent>
        )}
      </li>
    </Collapsible>
  );
}

/**
 * The single biggest change of the week: a real plain-language headline, the
 * concrete numbers (ad count + window), and the source stated on the
 * surface — never behind a hover, that's the exact fix for "kaha se aa rahi
 * hai." Same lone Dismiss action as `TrendRow` — dismissing the lead just
 * promotes the next biggest change on the next render, since
 * `pickLeadSignal` reads off the live (non-dismissed) trend list every time.
 *
 * The Before/Now magnitude bars this card used to carry are gone — a
 * deliberate cut ("Remove before and now"), not a casualty of some larger
 * rework. This card stays the block's lead, just decluttered to the same
 * standard as the rows below it.
 *
 * Dismiss renders always-visible rather than hover-gated: this is the hero
 * row, not a dense list line, so there's no "which row am I over" ambiguity
 * hover-gating exists to solve on `TrendRow`.
 */
function LeadChangeCard({
  signal,
  open,
  onOpenChange,
  actions,
}: {
  signal: ChangeSignal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: RowActionState;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  const provenanceMeta = PROVENANCE_META[signal.provenance];
  const hasEvidence = signal.evidence.length > 0;
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
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="relative rounded-md border border-border bg-muted/20 p-2.5">
        {/* Dismiss sits in the card's TOP-RIGHT CORNER, per Maalik: "keep the
            cross action but on the top right corner". It is the card's only
            action now (Brief it / Watch are gone), so cornering it reads as
            chrome — the way a close affordance reads on any card — rather
            than as one option among several in a footer. `pr-7` on the header
            keeps the label clear of it. */}
        <InfoTip tip="action.dismiss-signal" asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={actions.onDismiss}
            className="absolute right-1 top-1 h-6 w-6 shrink-0 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </InfoTip>

        <div className="min-w-0 pr-7">
          <div className="flex items-center gap-1.5">
            <span className={MICRO_LABEL}>Biggest change this week</span>
            {/* Kind label always renders as text here too, same rule as
                `TrendRow`: a state glyph (e.g. `withdrawal`'s `EyeOff`) must
                never be left to an icon-only, hover-only reading. */}
            <span className="inline-flex shrink-0 items-center gap-1">
              <KindIcon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-normal normal-case tracking-normal text-foreground/70">
                {CHANGE_KIND_LABELS[signal.kind]}
              </span>
            </span>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
            {signal.headline}
          </p>
          {/* Answers "who is this advertiser" directly — the exact context
              Maalik said made the sentence click for him. Guarded: the field
              is optional, and older/edge signals may not carry it. */}
          {signal.advertiserRelationshipLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/70">
              {signal.advertiserRelationship === "followed" && (
                <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
              )}
              {signal.advertiserRelationshipLabel}
            </p>
          )}
          <p className="mt-0.5 text-sm tabular-nums text-foreground">
            {adCount} {adCount === 1 ? "ad" : "ads"} · {windowLabel}
          </p>
          <p className={cn(MICRO_LABEL, "mt-0.5")}>
            {sourceLine}
          </p>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          {hasEvidence && (
            <CollapsibleTrigger
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium text-foreground/70",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            >
              {open ? "Hide detail" : "Show detail"}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
          )}
        </div>

        {hasEvidence && (
          <CollapsibleContent>
            <p className="line-clamp-2 mt-1.5 text-xs leading-snug text-foreground/70">
              {signal.evidence.join(" · ")}
            </p>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

/**
 * Placeholder that traces the real feed: the header line, a block shaped
 * like `LeadChangeCard`, then rows shaped like `TrendRow`. Deliberately the
 * same boxes at the same heights — a skeleton that does not match what
 * replaces it just moves the layout jump to the moment the data lands, which
 * is worse than showing nothing.
 */
function ChangeFeedSkeleton(): JSX.Element {
  return (
    <div className="space-y-2" aria-hidden="true">
      {/* Lead-card-shaped block, matching `LeadChangeCard`'s box height so
          nothing jumps when it lands. */}
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/20 p-2.5">
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded" />
      </div>

      {/* One-line rows: icon, fact, age — the same shape `TrendRow` renders,
          so nothing jumps when the feed lands. */}
      <ul className="divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-3 w-20 shrink-0 sm:block" />
            <Skeleton className="h-3 w-5 shrink-0" />
          </li>
        ))}
      </ul>
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
  // Which rows' evidence expander is open. Evidence is a row's credibility —
  // demoted off the surface, not deleted — so this is per-row, not global.
  const [openEvidenceIds, setOpenEvidenceIds] = useState<Set<string>>(() => new Set());

  // Deliberately does NOT write anywhere else: a dismissed row is just gone
  // from view, and Undo puts it right back, lossless.
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

  function setEvidenceOpen(id: string, open: boolean) {
    setOpenEvidenceIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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
            <LeadChangeCard
              signal={leadSignal}
              open={openEvidenceIds.has(leadSignal.id)}
              onOpenChange={(open) => setEvidenceOpen(leadSignal.id, open)}
              actions={{ onDismiss: () => handleDismiss(leadSignal) }}
            />
          )}

          {/* Zone 3 — every remaining change, fixed-height, inside scroll. */}
          {remainingTrends.length > 0 ? (
            <ul className={cn(LIST_MAX_HEIGHT, "divide-y divide-border/60 overflow-y-auto")}>
              {remainingTrends.map((signal) => (
                <TrendRow
                  key={signal.id}
                  signal={signal}
                  open={openEvidenceIds.has(signal.id)}
                  onOpenChange={(open) => setEvidenceOpen(signal.id, open)}
                  actions={{ onDismiss: () => handleDismiss(signal) }}
                />
              ))}
            </ul>
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
