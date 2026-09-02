/**
 * WhatToTryNext — "What to try next": the one block on this page that hands
 * the user an action instead of a read.
 *
 * Maalik's own words, verbatim: "ek card, but changable, means carousel ki
 * trah may be. And I think isko horizontal layout me rakhna chahiye" — ONE
 * suggestion visible at a time, a carousel between them, laid out
 * horizontally (kind · claim · evidence · actions read left-to-right in one
 * row, not stacked). No auto-advance: a card that moves while someone reads
 * it is hostile, and nothing else on this page moves on its own.
 *
 * The word "AI" is banned on this block, full stop — no sparkle icon, no
 * "powered by", no author, no model name. Nothing here generates anything;
 * every card is built from real fixture/selector data (`useSuggestions()`),
 * the same way every other block on this page reads its own selector.
 *
 * FOUR KINDS, cycled by the carousel, never colour-coded (design-system rule:
 * meaning never rides on a hue alone) — each kind carries a bordered chip
 * with an icon + its own text label, same visual grammar as `Provenance`'s
 * chip:
 *   - angle  — a copy-angle gap between the market and the user's own mix.
 *   - hook   — a REAL corpus hook (`SuggestionCard.quote`), never authored
 *              copy, with how long it's been running.
 *   - format — the format the longest-running ads in an industry actually use.
 *   - follow — a fast-moving advertiser the user doesn't track yet.
 *
 * ── Honesty on actions — the thing that must not be fudged ─────────────────
 * Maalik's ruling: "tooltip pe dikha dena abhi nahi hai. but add that
 * action." Every action stays clickable — nothing is ever rendered disabled
 * — and the truth about whether its payload actually lands lives in its
 * `InfoTip`, never as a promise the button itself makes. Concretely, per the
 * pinned contract (`SuggestionAction.works` / `.caveat`):
 *   - "Generate a video ad" → Genie `?output=video` — genuinely wired. Genie
 *     DOES read `?output=` (see `StudioBrandAdForm.tsx`), so this is the one
 *     handoff on this block that carries its whole payload today.
 *   - "Use this angle" / "Use hook" → Genie `?brand=`/`?output=` — navigates,
 *     but Genie has no `?angle=`/`?hook=` reader yet, so the angle/hook text
 *     itself is dropped on arrival. "Use hook" additionally copies the real
 *     hook to the clipboard before navigating, so the user isn't left with
 *     nothing — the tooltip still says the link itself can't carry it.
 *   - "Copy" — a real `navigator.clipboard` write + toast. Works, full stop.
 *   - "Save" / "Follow" — local component state only, like every other
 *     session-only action already on this page (`action.save-ad`,
 *     `action.follow-domain`). Resets on reload; the tooltip says so.
 *   - "See ads" / "See their ads" — real `<Link>`s into Discover with a real
 *     query filter (`?angle=` / `?longevity=` / `?domain=`), verified readers
 *     elsewhere on this page (`LongRunnersGallery`, `DomainsTeaser`).
 *
 * Tooltip copy is composed per (kind × intent × href-destination), not per
 * literal card — the "does this actually work" fact is a property of the
 * ACTION TYPE, stable across every card of a kind, never something that
 * varies card to card. These are genuinely one-off, block-local
 * explanations (`InfoTip`'s own doc comment names this as a supported case),
 * so they're built inline as `TooltipCopy` objects rather than added to the
 * shared `tooltipCopy.ts` registry wholesale — the block heading is the one
 * entry that DOES belong there (`block.what-to-try-next`), matching every
 * other block's own convention. When an action's `works` is `false`, its
 * tooltip's final line renders the selector-supplied `action.caveat`
 * verbatim — the contract requires that field to exist precisely so this
 * line is never invented by the component.
 *
 * ── Caption trap ────────────────────────────────────────────────────────
 * Every string this file renders is either (a) fixed, kind-agnostic prose
 * with no "your industries" framing anywhere, or (b) read verbatim off
 * `SuggestionCard` (`claim`, `detail`, `quote`, `quoteMeta`, `sourceNote`) —
 * fields the selector already produces correctly per state (see
 * CONTRACT.md). This component never composes its own "in your industries"
 * sentence, so there is nothing here that can go false in `firstTime`/`empty`.
 *
 * ── Placement ───────────────────────────────────────────────────────────
 * Mounted directly under the hero row (`ChangeFeed` + `AngleMixDonut` /
 * `YouVsMarket`) and above `LongRunnersGallery` — those three blocks are
 * this one's inputs, so the suggestion reads as their conclusion.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Copy,
  Lightbulb,
  Quote,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { InfoTip, type TooltipCopy } from "@/insights-dashboard/components/InfoTip";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useSuggestions,
  type SuggestionAction,
  type SuggestionCard,
  type SuggestionKind,
} from "@/insights-dashboard/lib/selectors";

const MICRO_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70";

const KIND_ICON: Readonly<Record<SuggestionKind, LucideIcon>> = {
  angle: Compass,
  hook: Quote,
  format: Clapperboard,
  follow: UserPlus,
};

/** A Genie handoff — `/iq/genie6/generate/...`. Distinguishes "this button
 * goes to Genie" from a Discover filter without depending on any literal
 * action key the sibling data layer happens to choose. */
function isGenieHref(href?: string): boolean {
  return !!href && href.startsWith("/iq/genie6");
}
/** A Discover filter — `/insights/discover?...`. Every one of these is a
 * real, verified reader elsewhere on this page (`?angle=`, `?longevity=`,
 * `?domain=`), so this branch is always the honest "fully wired" tooltip. */
function isDiscoverHref(href?: string): boolean {
  return !!href && href.startsWith("/insights/discover");
}

/** Per-card local-only state for the two session-only intents (`save`,
 * `follow`). Keyed by card id — a card only ever carries one or the other,
 * never both, but keying by id keeps this correct regardless. Resets on
 * reload, exactly like every other optimistic action on this page. */
interface LocalToggleState {
  saved: boolean;
  followed: boolean;
}

/** `SuggestionAction` is a discriminated union keyed on `works` — `caveat`
 * only exists on the `works: false` member, so every read of it has to be
 * narrowed through this rather than a bare `action.caveat`. Returns
 * `undefined` when the action genuinely works — there is nothing to print. */
function actionCaveat(action: SuggestionAction): string | undefined {
  // `=== false` (not a bare truthy check) — this project runs with
  // `strictNullChecks: false` (see tsconfig.app.json), and TS only narrows a
  // discriminated union on a boolean-literal property through an explicit
  // equality check under that setting, not through a plain `action.works`
  // truthy test.
  if (action.works === false) return action.caveat;
  return undefined;
}

/** Builds this action's tooltip copy and, where `works` is false, folds the
 * selector-supplied `caveat` in verbatim as the final ("what to do") line —
 * see the file header for why this isn't a `tooltipCopy.ts` registry entry. */
function buildActionTooltip(kind: SuggestionKind, action: SuggestionAction): TooltipCopy {
  const label = action.label;

  if (action.intent === "copy") {
    return {
      label,
      what: "Copies this hook's exact wording to your clipboard.",
      gives: "Lets you paste it straight into Genie's prompt, or anywhere else.",
      action: "Copies now — nothing else happens.",
    };
  }

  if (action.intent === "save") {
    return {
      label,
      what: "Marks this hook as saved, for this browser session only.",
      gives: "A quick bookmark while you decide whether to use it.",
      action: actionCaveat(action) ?? "Not written to your real library yet — resets on reload.",
    };
  }

  if (action.intent === "follow") {
    return {
      label,
      what: "Adds this advertiser to your watchlist, for this session only.",
      gives: "Lets you track a fast-shipping advertiser you don't already follow.",
      action:
        actionCaveat(action) ??
        "Session-only — nothing is written to your workspace, and it resets on reload.",
    };
  }

  // intent === "navigate"
  if (isDiscoverHref(action.href)) {
    return {
      label,
      what: "Opens Discover filtered to these exact ads.",
      gives: "See the real creative behind this suggestion before you act on it.",
      action: "Fully wired — this filter works today.",
    };
  }

  if (isGenieHref(action.href)) {
    if (kind === "format") {
      return {
        label,
        what: "Opens Genie's Brand Ad form with this format already selected.",
        gives: "Skips picking an output type — the rest of the form still needs your input.",
        action: "Fully wired — this handoff works today.",
      };
    }
    if (kind === "hook") {
      return {
        label,
        what: "Copies this hook to your clipboard, then opens Genie's Brand Ad form.",
        gives: "The hook is ready to paste in, even though the link itself can't carry it yet.",
        action:
          actionCaveat(action) ??
          "Genie doesn't read hook text from a link yet — paste it in once you land there.",
      };
    }
    return {
      label,
      what: "Opens Genie's Brand Ad form.",
      gives: "A shortcut into Genie starting from this angle.",
      action:
        actionCaveat(action) ?? "Genie doesn't read the angle from a link yet — the form opens blank.",
    };
  }

  // Fallback — a destination this file doesn't specifically recognise.
  // Still routed through InfoTip, still honest about `works`.
  return {
    label,
    what: action.works ? "Opens the linked destination." : "Would open the linked destination.",
    gives: "The next step for this suggestion.",
    action: actionCaveat(action),
  };
}

function SuggestionActionButton({
  card,
  action,
  toggles,
  onToggle,
}: {
  card: SuggestionCard;
  action: SuggestionAction;
  toggles: LocalToggleState;
  onToggle: (key: "saved" | "followed") => void;
}) {
  const tooltip = buildActionTooltip(card.kind, action);
  const btnClass = "h-7 gap-1 px-2.5 text-xs";

  if (action.intent === "copy") {
    return (
      <InfoTip tip={tooltip} asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={btnClass}
          onClick={() => {
            const text = card.quote ?? card.claim;
            navigator.clipboard?.writeText(text).then(
              () => toast.success("Copied to clipboard", { description: card.quoteMeta }),
              () => toast.error("Couldn't copy — try selecting the text manually."),
            );
          }}
        >
          <Copy className="h-3 w-3" aria-hidden="true" />
          {action.label}
        </Button>
      </InfoTip>
    );
  }

  if (action.intent === "save") {
    const saved = toggles.saved;
    return (
      <InfoTip tip={tooltip} asChild>
        <Button
          type="button"
          size="sm"
          variant={saved ? "secondary" : "outline"}
          className={btnClass}
          onClick={() => {
            onToggle("saved");
            toast.success(saved ? "Removed from saved" : "Saved", { description: card.quoteMeta });
          }}
        >
          <Bookmark className="h-3 w-3" aria-hidden="true" fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : action.label}
        </Button>
      </InfoTip>
    );
  }

  if (action.intent === "follow") {
    const followed = toggles.followed;
    return (
      <InfoTip tip={tooltip} asChild>
        <Button
          type="button"
          size="sm"
          variant={followed ? "secondary" : "outline"}
          className={btnClass}
          onClick={() => {
            onToggle("followed");
            toast.success(followed ? "Unfollowed" : "Followed", { description: card.claim });
          }}
        >
          <UserPlus className="h-3 w-3" aria-hidden="true" />
          {followed ? "Following" : action.label}
        </Button>
      </InfoTip>
    );
  }

  // intent === "navigate"
  const href = action.href ?? "#";
  const copyHookFirst = card.kind === "hook" && isGenieHref(href) && !!card.quote;

  return (
    <InfoTip tip={tooltip} asChild>
      <Link
        to={href}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), btnClass)}
        onClick={() => {
          if (copyHookFirst) {
            navigator.clipboard?.writeText(card.quote!).catch(() => {});
            toast.success("Hook copied — paste it into the prompt", { description: card.quoteMeta });
          }
        }}
      >
        {action.label}
      </Link>
    </InfoTip>
  );
}

function SuggestionBody({ card }: { card: SuggestionCard }) {
  const [toggles, setToggles] = useState<Record<string, LocalToggleState>>({});
  const cardToggles = toggles[card.id] ?? { saved: false, followed: false };
  const KindIcon = KIND_ICON[card.kind];

  function handleToggle(key: "saved" | "followed") {
    setToggles((prev) => {
      const current = prev[card.id] ?? { saved: false, followed: false };
      return { ...prev, [card.id]: { ...current, [key]: !current[key] } };
    });
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Kind — icon + text label only, never colour. Same bordered-chip
          grammar `Provenance` already established for this page. */}
      <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-border/70 bg-muted/40 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-foreground/70 sm:self-center">
        <KindIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        {card.kindLabel}
      </span>

      {/* Claim + evidence — the read. */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {card.claim}
        </p>
        {card.quote ? (
          <p className="mt-0.5 line-clamp-1 text-xs italic leading-snug text-foreground/70">
            &ldquo;{card.quote}&rdquo;
            {card.quoteMeta ? ` — ${card.quoteMeta}` : ""}
          </p>
        ) : (
          card.detail && (
            <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-foreground/70">
              {card.detail}
            </p>
          )
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {/* NOT `compact`. `Provenance compact` is an icon-only marker built
              for dense rows (a gallery tile's corner, a table cell); this
              block is ONE card at a time across the page's full width, so
              there is room for the word. It matters here specifically: the
              compact marker's glyph is an Eye, and sitting it unlabelled
              beside the equally unlabelled `ShieldAlert` caveat reproduced
              exactly the reading Maalik rejected on the sibling block ("cross
              icon and eye wala icon... why two?"). With the label rendered,
              one glyph on this row carries words and only the caveat is a
              bare icon — the same ratio `LongRunnersGallery` already ships. */}
          <Provenance tier={card.provenance} />
          {card.caveatNote && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    aria-label="Caveat"
                    className="inline-flex cursor-help rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                  </span>
                </TooltipTrigger>
                <TooltipPrimitive.Portal>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="text-xs leading-snug">{card.caveatNote}</p>
                  </TooltipContent>
                </TooltipPrimitive.Portal>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Actions — 1-3, always clickable, never disabled. Honesty lives in
          each action's own InfoTip, per Maalik's ruling. */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
        {card.actions.map((action) => (
          <SuggestionActionButton
            key={action.key}
            card={card}
            action={action}
            toggles={cardToggles}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}

function WhatToTryNextSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center" aria-hidden="true">
      <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Skeleton className="h-7 w-24 rounded-md" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function WhatToTryNext({ className }: { className?: string }): JSX.Element {
  const { cards, isEmpty, isLoading, sourceNote } = useSuggestions();
  const [index, setIndex] = useState(0);

  // Guard against a stale index if the card list ever shrinks (e.g. a
  // state switch mid-session) — never let the carousel point past the end.
  useEffect(() => {
    if (index > cards.length - 1) setIndex(0);
  }, [cards.length, index]);

  const hasMultiple = !isLoading && !isEmpty && cards.length > 1;
  const current = !isLoading && !isEmpty ? cards[Math.min(index, cards.length - 1)] : undefined;

  function goPrev() {
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }
  function goNext() {
    setIndex((i) => (i + 1) % cards.length);
  }
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!hasMultiple) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-4", className)}
      aria-label="What to try next"
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1">
          <h2 className={MICRO_LABEL}>What to try next</h2>
          <InfoTip tip="block.what-to-try-next" />
        </span>
        {!isLoading && !isEmpty && (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-foreground/70 sm:inline">{sourceNote}</span>
            {hasMultiple && (
              <div
                className="flex items-center gap-1"
                role="group"
                aria-roledescription="carousel"
                aria-label="Suggestions"
                onKeyDown={handleKeyDown}
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
                  onClick={goPrev}
                  aria-label="Show previous suggestion"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <span
                  className="min-w-[3.5rem] text-center font-mono text-[10px] tabular-nums text-foreground/70"
                  aria-live="polite"
                >
                  {index + 1} of {cards.length}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
                  onClick={goNext}
                  aria-label="Show next suggestion"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* isLoading FIRST — a skeleton must never leak suggestion copy. */}
      {isLoading ? (
        <WhatToTryNextSkeleton />
      ) : isEmpty || !current ? (
        <InsightsV2EmptyState
          icon={Lightbulb}
          title="Nothing to suggest yet"
          description="Once there's enough signal — from what changed, the angle mix, or the long-running creative — a next move will show up here."
        />
      ) : (
        <SuggestionBody card={current} />
      )}
    </section>
  );
}
