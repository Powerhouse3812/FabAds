import type { ElementType } from "react";
import { Boxes, Check, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroHeader } from "../components/HeroHeader";

/**
 * Step0Entity — "step zero," the screen between picking a Mode (Studio
 * home) and Step 1 (Format). It asks exactly one question: is this
 * generation tied to a Brand / Product / Category already on file, or is
 * it a custom one-off with no entity attached?
 *
 * Why this exists: without a declared answer, the wizard's context rail
 * shows "No brand / No product" with a "PICK A BRAND" prompt — which reads
 * identically whether the user deliberately wants an entity-less generation
 * or simply hasn't gotten to it yet. That's a nag, not a choice. Step0Entity
 * makes "nothing attached" something the user said on purpose.
 *
 * Pure presentational: no store, no URL reads, no `useWizard`. Advancing
 * after a choice, persisting `value` across Back/forward, and resolving
 * `suggested` all belong to the caller (step machine + StudioAlpha).
 *
 * ── State coverage ──────────────────────────────────────────────────────
 * Populated  — `suggested` is present: a SuggestionBand is pinned above the
 *              two cards.
 * Partial    — `value` is already set (user came Back to change it): that
 *              card shows the selected ring + check, same idiom as every
 *              other wizard card.
 * Zero-data  — no suggestion, nothing chosen: both cards still render as a
 *              complete, self-explanatory choice — never a bare prompt.
 */
export type EntityMode = "entity" | "custom";

export interface Step0EntityProps {
  /** null = nothing chosen yet. */
  value: EntityMode | null;
  onChoose: (v: EntityMode) => void;
  /** Title of the Mode the user just picked, e.g. "Brand Ad" — for context. */
  modeTitle: string;
  /** Optional SUGGESTION only — see the highlighted-vs-selected rule below. */
  suggested?: { kind: "brand" | "product" | "category"; name: string } | null;
  onBack: () => void;
}

/**
 * ── Highlighted is NOT selected ───────────────────────────────────────────
 * `suggested` is a hint, never a fact about the wizard's state. It renders
 * as an amber "Suggested" band with an explicit "Use this" button (mirrors
 * Step2Product's FlowHighlightBand, §6 Rule 4) — deliberately styled
 * nothing like the cards' selected treatment below. Nothing calls
 * `onChoose` except that button being clicked — never on mount, never as a
 * side effect of rendering. A sibling surface in this app once suggested a
 * competitor's brand; auto-selecting a suggestion here would repeat that
 * mistake — quietly pointing the user at the wrong business.
 *
 * ── Revisitable, never a one-way door ─────────────────────────────────────
 * The footer line under the cards says so out loud, and both cards stay
 * fully clickable regardless of `value`. There's no "don't ask again"
 * checkbox — generation spends credits, and a silently remembered choice
 * that fast-paths someone into spending them against the wrong entity is
 * exactly the failure mode this screen exists to prevent.
 */
interface EntityChoice {
  id: EntityMode;
  Icon: ElementType;
  title: string;
  desc: string;
  pills: [string, string, string];
}

const ENTITY_MODE_OPTIONS: EntityChoice[] = [
  {
    id: "entity",
    Icon: Boxes,
    title: "Existing",
    desc: "Tie it to a Brand, Product or Category already in your Catalogue.",
    pills: ["Brand", "Product", "Category"],
  },
  {
    id: "custom",
    Icon: Wand2,
    title: "Custom",
    desc: "Nothing attached — a standalone, one-off generation.",
    pills: ["No Brand", "No Product", "No Category"],
  },
];

const PILL_CLS =
  "rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground";

function kindLabel(kind: "brand" | "product" | "category"): string {
  if (kind === "brand") return "Brand";
  if (kind === "product") return "Product";
  return "Category";
}

/**
 * SuggestionBand — the populated-state hint. Deliberately styled nothing
 * like a selected card (no ring, no check) — an amber tag + a standalone
 * "Use this" button, so it reads as a proposal. Accepting it only commits
 * the coarse "entity" mode; which specific Brand/Product/Category gets
 * picked is the next screen's job, not this one's.
 */
function SuggestionBand({
  suggested,
  onAccept,
}: {
  suggested: NonNullable<Step0EntityProps["suggested"]>;
  onAccept: () => void;
}) {
  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-warning-text/30 bg-warning-text/10">
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-warning-text/30 bg-card text-xs font-bold text-warning-text">
          {suggested.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-warning-text/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-warning-text">
              Suggested
            </span>
            <span className="truncate text-[10px] text-warning-text">not selected yet</span>
          </div>
          <p
            title={suggested.name}
            className="mt-0.5 truncate text-[13px] font-semibold text-foreground"
          >
            {suggested.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {kindLabel(suggested.kind)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAccept}
          className="fab-focus inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
        >
          Use this
        </button>
      </div>
    </div>
  );
}

export function Step0Entity({ value, onChoose, modeTitle, suggested, onBack }: Step0EntityProps) {
  return (
    // Mirrors AlphaStep1Format's wrapper — the closest analogue, and the
    // step this one sits directly before: centered on mobile (min-h-full +
    // justify-center) so the header/band/cards/footer read as one screen,
    // md: reverts to the original top-aligned block.
    <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-4 px-4 pt-4 pb-4 md:min-h-0 md:justify-start md:gap-6 md:px-6 md:pt-8 md:pb-10">
      {/* Ambient layer — dot grid + top lime wash, matching the other
          big-card choice screens (Format, Approach). Pure CSS, no SVG. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 text-foreground opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,hsl(74_81%_59%/0.08),transparent_70%)]" />
      </div>

      <HeroHeader title="What's this tied to?" meta={modeTitle} onBack={onBack} />

      {suggested && <SuggestionBand suggested={suggested} onAccept={() => onChoose("entity")} />}

      <div
        role="radiogroup"
        aria-label="What this generation is tied to"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
      >
        {ENTITY_MODE_OPTIONS.map((choice) => {
          const selected = value === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChoose(choice.id)}
              className={cn(
                "fab-focus v3-glass-card group relative flex min-h-[180px] flex-col items-center gap-3 overflow-hidden rounded-3xl p-4 text-center transition-all duration-300 ease-out",
                "md:min-h-[220px] md:gap-4 md:p-6",
                selected
                  ? "ring-2 ring-primary/30 shadow-[0_8px_32px_rgba(195,235,66,0.15)]"
                  : "shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:border-foreground/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]",
              )}
            >
              {selected && (
                <span
                  aria-hidden
                  className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-3 w-3" />
                </span>
              )}

              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                  selected
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border/70 bg-foreground/5 text-foreground/70",
                )}
              >
                <choice.Icon className="h-5 w-5" />
              </div>

              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <span className="text-lg font-bold text-foreground">{choice.title}</span>
                <span className="text-[13px] leading-snug text-muted-foreground">
                  {choice.desc}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {choice.pills.map((pill) => (
                  <span key={pill} className={PILL_CLS}>
                    {pill}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center font-mono text-[10px] text-muted-foreground">
        You can switch this later — nothing here is final.
      </p>
    </div>
  );
}
