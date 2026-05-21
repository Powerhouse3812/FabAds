import type { ComponentType } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Lightbulb,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface KnowledgeBaseEmptyStateProps {
  /** Display label of the parent entity (e.g. "Mamaearth", "Onion Shampoo"). */
  entityLabel: string;
  /** Open the existing create-instruction modal (?create=instruction). */
  onAddInstruction: () => void;
  /** Open the existing save-winner-ad modal (?create=winner-ad). */
  onAddWinnerAd: () => void;
  /** Open the existing save-concept modal (?create=concept). */
  onAddConcept: () => void;
  /** Optional path the "Save from Genie" CTA navigates to. Defaults to /iq/genie6/studio-alpha. */
  studioPath?: string;
}

/**
 * KnowledgeBaseEmptyState — interactive, guiding zero-state for the
 * Brand / Product / Category Knowledge Base. Replaces a generic "No
 * data" placeholder with a hero panel + 4 action cards that show the
 * user exactly what KB is for and let them populate it inline.
 *
 * Design grammar (Fabfunnel A-12.190):
 *  - Hero panel: dot-grid backdrop + lime BookOpen icon disc + Geist
 *    Mono caps eyebrow + Geist Sans h2 title + 13px subtitle + a small
 *    "what KB powers" footer strip (3 outcome chips).
 *  - 4 action cards in a 2×2 grid (1-col on narrow): icon + title +
 *    one-line value prop + lime CTA chip with hover-translated arrow.
 *  - Hover lifts each card -1px and tints its border lime — same
 *    grammar as the InsightsExtensionCard / LibraryQueueStrip pieces
 *    so the visual language stays consistent across surfaces.
 *  - NO illustrations, NO motion stickers, NO emojis. Pure typographic
 *    hierarchy + the lime accent.
 *
 * Each card wires into an existing flow: the first three open the
 * exact same create modals KnowledgeBaseSection uses for the toolbar
 * "Add" buttons, so a click here lands on the same modal a populated
 * KB user reaches. The fourth deep-links to Studio so the user can
 * save generations straight to KB from the source.
 *
 * Personalised by `entityLabel` so brand-detail KB reads "Mamaearth"
 * not "this entity" — small but the difference between guidance and
 * generic copy.
 */
export function KnowledgeBaseEmptyState({
  entityLabel,
  onAddInstruction,
  onAddWinnerAd,
  onAddConcept,
  studioPath = "/iq/genie6/studio-alpha",
}: KnowledgeBaseEmptyStateProps) {
  return (
    <section
      data-fabads-kb-empty-state
      aria-label="Knowledge Base — get started"
      className="flex flex-col gap-4"
    >
      {/* Hero panel — explains KB without being dense */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "border border-primary/25 bg-primary/[0.03]",
          "px-5 py-5 sm:px-6 sm:py-6",
        )}
      >
        {/* Dot-grid backdrop — quiet ambient texture, lime-tinted */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-50",
            "[background-image:radial-gradient(circle,rgba(195,235,66,0.18)_1px,transparent_1px)]",
            "[background-size:14px_14px]",
          )}
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* Lime icon disc */}
          <span
            aria-hidden
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              "bg-primary/15 ring-1 ring-primary/25",
            )}
          >
            <BookOpen className="h-5 w-5 text-foreground" strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Knowledge base · empty
            </p>
            <h3 className="mt-1 text-[18px] font-semibold leading-snug text-foreground">
              Start teaching Genie about {entityLabel}.
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground/70 sm:max-w-[640px]">
              The Knowledge Base is the writing rules, winning ads, and proven
              concepts Genie pulls from every time it generates for this{" "}
              {entityLabel.toLowerCase().includes(" ") ? "entity" : "brand"}.
              The more you add, the sharper every generation gets.
            </p>

            {/* Outcome chips — "what KB powers" footer */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <OutcomeChip>Drives Genie prompts</OutcomeChip>
              <OutcomeChip>Powers concept generation</OutcomeChip>
              <OutcomeChip>Referenced across brand assets</OutcomeChip>
            </div>
          </div>
        </div>
      </div>

      {/* Action grid — 4 distinct entry points, ranked by "first thing
          most users should do" top-left → bottom-right. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ActionCard
          step={1}
          icon={Sparkles}
          title="Add Main Instruction"
          subtitle={`The default writing rules Genie follows for ${entityLabel}.`}
          cta="Add instruction"
          onClick={onAddInstruction}
        />
        <ActionCard
          step={2}
          icon={Bookmark}
          title="Save a Winner Ad"
          subtitle="Pin a high-performing ad so Genie can pattern-match against it."
          cta="Save winner"
          onClick={onAddWinnerAd}
        />
        <ActionCard
          step={3}
          icon={Lightbulb}
          title="Save a Concept"
          subtitle="Bookmark a creative angle (Hero shot, UGC, Social proof…) you want to reuse."
          cta="Save concept"
          onClick={onAddConcept}
        />
        <ActionCard
          step={4}
          icon={Wand2}
          title="Save from Genie"
          subtitle="Generate ads in Studio and one-click save winners straight into this KB."
          cta="Open Studio"
          to={studioPath}
        />
      </div>
    </section>
  );
}

function OutcomeChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/[0.06] px-2 py-0.5",
        "font-mono text-[9.5px] font-medium uppercase tracking-wider text-foreground/75",
      )}
    >
      {children}
    </span>
  );
}

interface ActionCardProps {
  step: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  cta: string;
  onClick?: () => void;
  to?: string;
}

function ActionCard({
  step,
  icon: Icon,
  title,
  subtitle,
  cta,
  onClick,
  to,
}: ActionCardProps) {
  const inner = (
    <>
      {/* Step pill — small numeric anchor in the top-left so cards read
          as a journey, not 4 disconnected entry points. */}
      <span
        aria-hidden
        className={cn(
          "absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full",
          "border border-border bg-background font-mono text-[10px] font-semibold tabular-nums text-foreground/55",
          "transition-colors group-hover:border-primary/40 group-hover:text-primary",
        )}
      >
        {step}
      </span>

      <span
        aria-hidden
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl",
          "bg-foreground/[0.04] ring-1 ring-inset ring-border",
          "transition-colors group-hover:bg-primary/10 group-hover:ring-primary/30",
        )}
      >
        <Icon className="h-4 w-4 text-foreground/70" strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <h4 className="text-[14px] font-semibold leading-tight text-foreground">
          {title}
        </h4>
        <p className="mt-1 text-[12.5px] leading-snug text-foreground/65">
          {subtitle}
        </p>
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider",
            "text-primary transition-transform group-hover:translate-x-0.5",
          )}
        >
          {cta}
          <ArrowUpRight
            className="h-3 w-3 transition-transform group-hover:rotate-[5deg]"
            aria-hidden
          />
        </span>
      </div>
    </>
  );

  const className = cn(
    "group relative flex items-start gap-3 overflow-hidden rounded-xl",
    "border border-border bg-card px-4 py-4 text-left",
    "transition-[border-color,background-color,transform,box-shadow] duration-200",
    "hover:-translate-y-px hover:border-primary/40 hover:bg-card/80 hover:shadow-sm",
    "focus-within:border-primary/40",
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
