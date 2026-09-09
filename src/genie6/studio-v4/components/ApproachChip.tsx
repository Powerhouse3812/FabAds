import { cn } from "@/lib/utils";
// MODE_LABEL is the approach-name map exported from useWizard.ts. Three local
// copies of these labels already exist in the codebase — a fourth is not being
// added here.
import { MODE_LABEL } from "../state/useWizard";
import type { Mode } from "../state/useWizard";
// Sub-type ("UGC Video · Talking head") is DATA, read through the shared getter
// rather than re-derived from a `mode === "…"` conditional. Per-Mode rules are
// data, not branches.
import { getSubType } from "../data/approach-subtypes";
// ── Import cycle, deliberately taken and safe ──────────────────────────────
// PromptReferenceBar imports this component; this component imports its
// ANGLE_CHIP_LABEL map back. That is a real ESM cycle, but neither module READS
// the other's bindings at module-evaluation time — both only touch them inside
// render functions. Whichever module is entered first finishes evaluating its
// own `const`s before any render happens, so ANGLE_CHIP_LABEL is never observed
// in TDZ. (useWizard.ts dodged this same edge by keeping a local fallback copy;
// that is the alternative if this map ever moves to module-scope use here.)
import { ANGLE_CHIP_LABEL } from "./PromptReferenceBar";

/* ────────────────────────────────────────────────────────── *
 *  ApproachChip — the Approach reference chip on Configure.
 *
 *  Owner ruling: Concept stops being its own chip and folds into Approach,
 *  "which has angle + concept in it — add a small tag of which is concept and
 *  which is angle, and if multiple angle then show a number also within the
 *  tag."
 *
 *  So this is a RefChip chassis (same h-7 / border / 11px pill DNA) whose
 *  VALUE side carries two smaller nested badges instead of one flat string.
 *  The flat string it replaces read "Custom · Benefit-led · 2 concepts" —
 *  which left the reader to work out which half was the angle.
 * ────────────────────────────────────────────────────────── */

export interface ApproachChipProps {
  /** Wizard mode. `"auto"` means nothing was decided yet — no sub-tags. */
  mode: Mode;
  /** Which Step-3 route produced the current state. */
  approachRoute: "preset" | "custom" | null;
  /** Sub-type id within the preset approach, resolved via `getSubType`. */
  approachSubType: string | null;
  /**
   * The selected angle. Singular TODAY — the sub-tag below is already shaped to
   * render a count the day this becomes a set (see `SubTag.count`).
   */
  angleId: string | null;
  /** Concepts are already multi-select; the Concept sub-tag shows the count. */
  selectedConceptIds: string[];
  /** Opens the Approach edit modal. The whole chip is the one hit target. */
  onClick: () => void;
}

export function ApproachChip({
  mode,
  approachRoute,
  approachSubType,
  angleId,
  selectedConceptIds,
  onClick,
}: ApproachChipProps) {
  // Same three branches, in the same priority order, as the flat
  // `approachValue` string this chip replaces:
  //   1. mode === "auto"        → "Auto", nothing else. Nothing was asked, so
  //      an Angle/Concept tag here would be asserting a decision that has not
  //      been made.
  //   2. approachRoute "custom" → no approach name; just the two sub-tags.
  //   3. a real preset approach → "<Approach>[ · <sub-type>]" AND the two
  //      sub-tags — a preset still auto-fills a real angle + concept
  //      (`autoFillForApproach`), so the tags are exactly as true here.
  const isAuto = mode === "auto";
  const isCustom = approachRoute === "custom";

  const subTypeLabel = getSubType(mode, approachSubType)?.label ?? null;

  // Branch 3's primary label. `?? mode` mirrors the wizard's own defensive
  // read — a stale mode id off a historical run must render its slug, not a
  // blank chip. (`strict` is off in this project; a bad string can reach here.)
  const approachName = isCustom ? "Custom" : MODE_LABEL[mode] ?? mode;
  const primaryLabel = subTypeLabel
    ? `${approachName} · ${subTypeLabel}`
    : approachName;

  const angleLabel = angleId ? ANGLE_CHIP_LABEL[angleId] ?? angleId : "Auto";

  // The Concept tag's VALUE is the count itself — that is what the owner asked
  // for ("2 concepts" becomes a tag reading Concept 2). Zero selected is not
  // "0", it is "Auto": Genie will pick.
  const conceptCount = selectedConceptIds.length;
  const conceptLabel = conceptCount === 0 ? "Auto" : String(conceptCount);

  // Plain-language title for hover. Visible DOM text already reads correctly
  // for a screen reader (the sub-tag kinds are written lowercase and uppercased
  // in CSS, so they are announced as words, not spelled out), so no aria-label
  // is layered on top of it to drift out of sync.
  const title = isAuto
    ? "Approach · Auto — Genie decides. Click to choose."
    : `Approach · ${primaryLabel} · Angle ${angleLabel} · Concept ${conceptLabel}. Click to edit.`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        // RefChip's chassis, echoed exactly — 11px medium, border, background,
        // hover. Two deliberate deltas, both about the extra content:
        //  · `min-h-7` + `py-1` instead of a hard `h-7`, and `flex-wrap`, so
        //    the longest case (preset + sub-type + both tags ≈ 460px) wraps its
        //    sub-tags to a second line instead of overflowing the prompt-bar
        //    column, which is ~380–420px at a narrow desktop. Nothing
        //    truncates. On one line the box is still exactly 28px tall, so it
        //    sits flush with the RefChips beside it in the same wrap row.
        //  · `rounded-[14px]` instead of `rounded-full`: at the 28px
        //    single-line height these are pixel-identical, but when the chip
        //    wraps to two lines `rounded-full` would balloon into a 48px
        //    lozenge. This degrades to a rounded card instead.
        "inline-flex min-h-7 flex-wrap items-center gap-x-1.5 gap-y-1 rounded-[14px] border px-3 py-1 text-left text-[11px] font-medium transition-colors",
        "border-border/60 bg-background/50 hover:border-foreground/20 hover:bg-background/70",
        // House keyboard focus ring — custom <button>s get no ring from the
        // Tailwind reset (WCAG 2.4.7). The sub-tags are non-interactive
        // decoration inside this one button, so this is the only focus stop.
        "fab-focus",
      )}
    >
      <span className="text-muted-foreground">Approach</span>
      <span aria-hidden className="text-muted-foreground/40">
        ·
      </span>

      {isAuto ? (
        <span className="text-foreground">Auto</span>
      ) : (
        <>
          <span className="text-foreground">{primaryLabel}</span>
          {/* `count` is omitted for Angle today because `angleId` is singular.
              The day it becomes a set, the caller passes the total and the tag
              renders "Angle Hero +2" — no shape change needed here. */}
          <SubTag kind="Angle" value={angleLabel} />
          <SubTag kind="Concept" value={conceptLabel} />
        </>
      )}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SubTag — a small labelled badge nested INSIDE the chip.
 *
 *  Deliberately not a second full-size pill: shorter (18px vs 28px), tinted
 *  rather than bordered, and mono/10px so the value reads as data rather than
 *  prose — matching the count-badge convention already used in StudioAlpha and
 *  AngleRow. The distinction from the outer bordered pill is what makes these
 *  read as contents of the chip rather than siblings of it.
 * ────────────────────────────────────────────────────────── */
function SubTag({
  kind,
  value,
  count,
}: {
  /** Which dimension this is — "Angle" or "Concept". Written in sentence case
   *  and uppercased in CSS so screen readers announce a word, not letters. */
  kind: string;
  /** The resolved name, or "Auto" when nothing is chosen. */
  value: string;
  /**
   * Total number of items this tag stands for, when that total is more than
   * the one named in `value`. Omitted (or 1) renders no number — which is
   * every call today. This is the multi-select hook: Angle passes nothing now,
   * and passes `angleIds.length` the day angle goes multi, without this
   * component changing shape.
   */
  count?: number;
}) {
  const overflow = typeof count === "number" && count > 1 ? count - 1 : 0;

  return (
    <span className="inline-flex h-[18px] shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 font-mono text-[10px] leading-none">
      <span className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {kind}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
      {overflow > 0 && (
        // Primary-tinted bold mono, same treatment as the codebase's other
        // count badges — but without their own pill wrapper. Three nested
        // rounded surfaces (chip → sub-tag → count) is one too many.
        <span className="font-bold text-primary">+{overflow}</span>
      )}
    </span>
  );
}
