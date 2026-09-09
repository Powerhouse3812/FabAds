import { FileText, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * ScriptPreviewRow — the script's full-width preview + Edit row, rendered
 * INSIDE the prompt bar's own glass card (PromptReferenceBar.tsx's
 * `v3-glass … rounded-3xl px-5 py-4` container), never as a card of its own.
 *
 * Owner ruling (2026-09-10): "1 entire horizontal row separately for script,
 * to show the preview also, and edit button on it, like in the card below of
 * prompt card, only keeping in prompt card/section." The standalone SCRIPT
 * card (`ScriptCard`, retired in e0639b6) had the right CONTENT — provenance,
 * a readable preview, an Edit affordance — and the wrong CONTAINER. This is
 * that content, re-housed as one row of the prompt card.
 *
 * THE ONE PLACE SCRIPT STATUS LIVES (2026-09-10): this row started out as an
 * addition beside PromptReferenceBar's small "Script" chip. A live critique
 * found the two stating the same fact in different words, two unrelated chip
 * rows apart — read as duplicated, possibly contradictory (NN/g #4,
 * Consistency & Standards). The chip is gone; this row inherited its
 * needs-review signal (`needsReview` below). Do not reintroduce a second
 * script status surface on this card. Nothing here assumes a position — it
 * only needs a full-width column parent (the card's existing
 * `flex w-full flex-col gap-3` already supplies both the width and the gap,
 * so this component adds no outer margin of its own).
 *
 * Deliberately NOT a `SectionHeader`: that component is the PAGE-section label
 * (lime accent stripe, "single source of truth for ALL section labels"), and a
 * second section signal inside the prompt card is exactly what the owner asked
 * to collapse. The eyebrow below uses the quieter mono caption this same card
 * already uses for eyebrows in its own popovers ("Model", "Credit breakdown").
 *
 * ONE script editor, unchanged: `onEdit` opens the ScriptRail modal
 * (`railMode === "script"` in AlphaStep3Configure.tsx) — the same rail the
 * Script chip opens. This row never edits text itself; a second editor is
 * exactly the divergence §6 consolidated away.
 * ───────────────────────────────────────────────────────────────────────── */

export interface ScriptPreviewRowProps {
  /** The current script text. Typed `string | null` to mirror
   *  `WizardState["script"]` (useWizard.ts) so a caller passes
   *  `wizard.state.script` straight in — no cast, no `?? ""`. Null / blank is
   *  a normal resting state (§6: the background effect hasn't filled it yet),
   *  not an error — see the empty guard below. */
  script: string | null;
  /** Mirrors `WizardState["scriptOrigin"]`: null = nothing recorded yet,
   *  "auto" = written by useWizard's background effect, "user" = the human
   *  typed, edited or picked it. */
  scriptOrigin: "auto" | "user" | null;
  /** Module label when this exact text arrived from a flow hand-off (e.g.
   *  "Video Sage"). Wins over `scriptOrigin` — same precedence ScriptRail.tsx
   *  uses, since "same script from X" is both more specific and more true than
   *  "Auto-written". Callers assert it off the TEXT, not off the flow source
   *  (`scriptCarriedFrom`, AlphaStep3Configure.tsx), so it correctly goes null
   *  the moment the user edits the script — at which point it is theirs. */
  carriedFrom?: string | null;
  /** §21.2 script gate — the signal the retired "Script" chip used to own
   *  (`isScriptLedState(state) && !scriptApproved && !skipScriptReview` in
   *  PromptReferenceBar.tsx). A different AXIS from `carriedFrom` /
   *  `scriptOrigin`: those say where the text came from (provenance, always
   *  true of some past event), this says what the user still owes it (status,
   *  actionable, clearable). Both can hold at once — a script carried in from
   *  a flow hand-off still needs a look — so it renders alongside them, never
   *  instead of them. */
  needsReview?: boolean;
  /** Opens the script editor (ScriptRail). */
  onEdit: () => void;
}

export function ScriptPreviewRow({
  script,
  scriptOrigin,
  carriedFrom = null,
  needsReview = false,
  onEdit,
}: ScriptPreviewRowProps) {
  // Nothing to preview yet → render nothing. The prompt bar's own two-phase
  // Generate button (label "Generate script", PromptReferenceBar.tsx) is the
  // entry point for an empty script; a row saying "no script yet" would be a
  // second, competing CTA for the same action, and would put a permanent band
  // of chrome on the most common state of the card.
  if (!script?.trim()) return null;

  const hasProvenance = Boolean(carriedFrom) || Boolean(scriptOrigin);

  return (
    // One full-width horizontal row. Non-interactive container, so it takes
    // the quieter of the two material pairs already on this card — the same
    // `border-border/40 bg-background/30` as the static credits readout in
    // the chip row — leaving `border-border/60 bg-background/50` (the chips'
    // pair) to mean "you can click this", which here is only the Edit button.
    //
    // needsReview swaps that pair for the primary family the retired chip used
    // (`border-primary/50 bg-primary/[0.08]`, RefChip), at roughly HALF the
    // strength. Same hue, so the two read as one language; weaker, because a
    // chip's tint covers ~90px and this covers the full card width — carrying
    // the pill's alpha across that area is the loud, garish outcome the owner
    // ruled out. The legible signal is the "Needs review" label; the surface
    // only has to stop reading as the neutral resting state.
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3",
        needsReview
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-border/40 bg-background/30",
      )}
    >
      <div className="min-w-0 flex-1">
        {/* Eyebrow + provenance. `flex-wrap` so a long module label drops to
            its own line instead of squeezing the eyebrow — module names are
            short today ("Video Sage"), but nothing in flowRegistry enforces
            that. */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <FileText
            className="h-3 w-3 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Script
          </span>
          {/* STATUS before PROVENANCE. "Needs review" is the only actionable
              token in the row, so it takes the first slot after the eyebrow
              and the provenance badge below is left exactly as it was —
              "Needs review · Same script · Video Sage" reads as one sentence,
              and with needsReview false both of these render nothing, leaving
              the original markup untouched. `shrink-0` keeps the status whole
              when a long module label wraps the line. */}
          {needsReview && (
            <>
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
              <span
                className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-text"
                title="This script hasn't been reviewed yet — open Edit to read it through and approve it."
              >
                Needs review
              </span>
            </>
          )}
          {hasProvenance && (
            <span aria-hidden className="text-muted-foreground/40">
              ·
            </span>
          )}
          {/* Three-way provenance — same precedence, same copy and the same
              classes as ScriptRail.tsx's review header, so the row and the
              rail can never describe one script two different ways. */}
          {carriedFrom ? (
            <span
              className="min-w-0 truncate font-mono text-[10px] uppercase tracking-wider text-primary"
              title={`Same script that arrived from ${carriedFrom} — not a fresh Auto draft.`}
            >
              Same script · {carriedFrom}
            </span>
          ) : (
            scriptOrigin && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {scriptOrigin === "user" ? "Edited by you" : "Auto-written"}
              </span>
            )
          )}
        </div>

        {/* Preview — two lines, then clipped. No `whitespace-pre-wrap` on
            purpose: letting the browser collapse the script's own newlines is
            what makes a 2-line clamp land predictably (the same reasoning as
            ScriptRail's `previewText` helper, which pre-flattens for its own
            3-line clamp). `break-words` + the parent's `min-w-0` keep a long
            unbroken string — a pasted URL, a 400-character single line —
            inside the row instead of widening the whole prompt card. */}
        <p className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">
          {script}
        </p>
      </div>

      {/* Trailing edge on sm+; below the preview once the column is narrow —
          squeezing a button against clamped text at ~320px costs both of them.
          `self-start` keeps it button-sized rather than stretching full width
          in the stacked state, and top-aligned beside the text in the row
          state. Accessible name is "Edit script" and contains the visible
          "Edit" (WCAG 2.5.3), so the label still makes sense out of context. */}
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit script"
        title="Edit script"
        className="fab-focus inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
      >
        <Pencil className="h-3 w-3" aria-hidden />
        Edit
      </button>
    </div>
  );
}
