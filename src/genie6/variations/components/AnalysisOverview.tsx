import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { adTypeLabel } from "../data/analyseAd";
import type { AdAnalysis, AnalysedField, FieldProvenance } from "../types";

interface AnalysisOverviewProps {
  analysis: AdAnalysis;
  className?: string;
}

/** "not-found" and an empty value are the same thing to the reader. */
function isEmpty(field: AnalysedField<string> | AnalysedField<string | null>): boolean {
  return (
    field.provenance === "not-found" ||
    field.value === null ||
    field.value === undefined ||
    field.value === ""
  );
}

/** Row 2's label follows whatever the Type row resolved to. */
const ENTITY_LABEL: Record<string, string> = {
  brand: "Brand",
  product: "Product",
  category: "Category",
  "category-product": "Category + Product",
};

/**
 * AnalysisOverview — read-only "here's what we found in your ad" panel for the
 * Generate Variations flow. Mounted by BOTH UI versions (inline screen A and
 * step B), so it carries no layout assumptions beyond `className`.
 *
 * Ten rows in the product-owner-locked order: Type, entity name, Angle+Concept
 * (falling back to Approach), Avatar, Voice, Language, Script, Visual
 * direction, Aspect ratio, Source. Every row renders unconditionally — a
 * missing value shows an honest "N/F", never a fabricated one and never a
 * silently absent row, so a fully-stored ad, a half-detected one and a
 * near-empty upload all read as deliberate.
 *
 * Provenance is the whole point of the screen: a derived value is chipped
 * "Detected" so it can never be mistaken for a stored fact, and the header
 * states the unchipped-means-stored convention plus a per-state tally.
 */
export function AnalysisOverview({ analysis, className }: AnalysisOverviewProps) {
  const { source } = analysis;

  /* Type — resolve the kind to its label here so the row never prints a raw
     enum key. `adTypeLabel` owns the mapping; "not-found" falls through to the
     shared N/F treatment instead of a second label convention. */
  const typeField: AnalysedField = {
    value:
      analysis.type.value && analysis.type.value !== "not-found"
        ? adTypeLabel(analysis.type.value)
        : null,
    provenance: analysis.type.provenance,
  };

  const entityLabel =
    (analysis.type.value && ENTITY_LABEL[analysis.type.value]) ??
    "Brand / Product / Category";

  /* Row 3 is one row with two alternates: angle+concept is primary, approach
     is the fallback. Never both. */
  const hasPair = !isEmpty(analysis.angle) || !isEmpty(analysis.concept);
  const pairProvenance: FieldProvenance =
    analysis.angle.provenance === "detected" || analysis.concept.provenance === "detected"
      ? "detected"
      : analysis.angle.provenance;
  const pairField: AnalysedField = {
    value: isEmpty(analysis.angle) ? null : analysis.angle.value,
    provenance: pairProvenance,
    detail: `Concept · ${isEmpty(analysis.concept) ? "N/F" : analysis.concept.value}`,
  };

  /* The tally covers the nine analysed rows actually on screen — Source is how
     we got here, not something we detected, so it isn't counted. */
  const shown: FieldProvenance[] = [
    typeField.provenance,
    analysis.entityName.provenance,
    hasPair ? pairProvenance : analysis.approach.provenance,
    analysis.avatar.provenance,
    analysis.voice.provenance,
    analysis.language.provenance,
    analysis.script.provenance,
    analysis.visualDirection.provenance,
    analysis.aspectRatio.provenance,
  ];
  const storedCount = shown.filter((p) => p === "stored").length;
  const detectedCount = shown.filter((p) => p === "detected").length;
  const notFoundCount = shown.filter((p) => p === "not-found").length;

  /* Near-empty is a real, expected shape (a competitor ad or a raw upload
     carries no catalogue provenance at all). Say so, rather than letting six
     N/F rows read as a broken panel. */
  const sparse = notFoundCount >= 6;

  return (
    <section
      className={cn(
        "rounded-g6-xl border border-g6-border bg-g6-bg-container",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-6 border-b border-g6-border-secondary px-4 py-3">
        <div className="min-w-0">
          <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
            What we found in this ad
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-g6-text-secondary">
            No chip means we read it off the ad · <span className="text-warning-text">Detected</span>{" "}
            means we derived it — worth a check · N/F means nothing was found
          </p>
        </div>
        <p className="shrink-0 font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
          {storedCount} stored · {detectedCount} detected · {notFoundCount} N/F
        </p>
      </header>

      <div className="space-y-3 px-4 py-3">
        {/* Rows 1-3 */}
        <div className="grid grid-cols-3 gap-6">
          <Field label="Type" field={typeField} />
          <Field label={entityLabel} field={analysis.entityName} />
          {hasPair ? (
            <Field label="Angle + Concept" field={pairField} hasDetailSlot />
          ) : (
            <Field label="Approach" field={analysis.approach} hasDetailSlot />
          )}
        </div>

        {/* Rows 4-6 — avatar and voice carry their personality / tone on the
            second line (that's what AnalysedField.detail is for). */}
        <div className="grid grid-cols-3 gap-6">
          <Field label="Avatar" field={analysis.avatar} hasDetailSlot />
          <Field label="Voice" field={analysis.voice} hasDetailSlot />
          <Field label="Language" field={analysis.language} />
        </div>

        {/* Row 7 — a script body can run many lines, so it gets its own
            scrollable inset instead of stretching the grid. */}
        <ProseField
          label="Script"
          field={analysis.script}
          className="border-t border-g6-border-secondary pt-3"
          scroll
        />

        {/* Row 8 — a full sentence, clamped with the full text on hover. */}
        <ProseField label="Visual direction" field={analysis.visualDirection} clamp />

        {/* Rows 9-10 */}
        <div className="grid grid-cols-3 gap-6 border-t border-g6-border-secondary pt-3">
          <Field label="Aspect ratio" field={analysis.aspectRatio} mono />
          <div className="col-span-2">
            <Field
              label="Source"
              field={{
                value: source.originLabel,
                provenance: "stored",
                detail: source.title,
              }}
              hasDetailSlot
            />
          </div>
        </div>

        {/* §7.2 — a rival's ad. Stated plainly here so nothing downstream can
            imply we'll make an ad for the competitor's brand. */}
        {source.competitorOwned && (
          <Note>
            This ad belongs to a competitor. Its brand is shown for reference only —
            your variations are made for your own brand.
          </Note>
        )}

        {sparse && (
          <Note>
            Little was readable off this ad. The N/F rows aren't guesses — nothing was
            found, and anything chipped Detected is worth checking before you generate.
          </Note>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ pieces */

function Field({
  label,
  field,
  mono,
  hasDetailSlot,
}: {
  label: string;
  field: AnalysedField;
  /** Numeric/technical values (ratios) only — prose stays in Geist Sans. */
  mono?: boolean;
  /** Reserve the second line so slotted rows stay aligned across the grid. */
  hasDetailSlot?: boolean;
}) {
  const empty = isEmpty(field);
  const value = empty ? "N/F" : String(field.value);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
          {label}
        </p>
        <ProvenanceChip provenance={field.provenance} />
      </div>
      <p
        /* Long entity names (60+ chars) truncate rather than reflow the grid;
           the full string stays reachable on hover. */
        title={empty ? "Not found in this ad" : value}
        className={cn(
          "truncate text-g6-sm leading-tight text-g6-text",
          empty && "font-g6-mono uppercase tracking-[0.04em] text-g6-text-tertiary",
          mono && !empty && "font-g6-mono uppercase tracking-[0.04em]",
        )}
      >
        {value}
      </p>
      {(field.detail || hasDetailSlot) && (
        <p
          title={field.detail ?? undefined}
          className="truncate text-[10.5px] leading-tight text-g6-text-secondary"
        >
          {field.detail || "—"}
        </p>
      )}
    </div>
  );
}

function ProseField({
  label,
  field,
  scroll,
  clamp,
  className,
}: {
  label: string;
  field: AnalysedField;
  /** Multi-line bodies: scroll inside a fixed height, never grow unbounded. */
  scroll?: boolean;
  /** Single long sentence: clamp to 3 lines, full text on hover. */
  clamp?: boolean;
  className?: string;
}) {
  const empty = isEmpty(field);
  const value = empty ? "N/F" : String(field.value);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5">
        <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
          {label}
        </p>
        <ProvenanceChip provenance={field.provenance} />
      </div>
      {empty ? (
        <p
          title="Not found in this ad"
          className="font-g6-mono text-g6-sm uppercase tracking-[0.04em] leading-tight text-g6-text-tertiary"
        >
          N/F
        </p>
      ) : (
        <div
          /* Focusable so the scroll region is reachable without a mouse. */
          tabIndex={scroll ? 0 : undefined}
          role={scroll ? "group" : undefined}
          aria-label={scroll ? label : undefined}
          title={clamp ? value : undefined}
          className={cn(
            "min-w-0 text-g6-sm leading-snug text-g6-text",
            scroll &&
              "max-h-32 overflow-y-auto whitespace-pre-line rounded-g6-base border border-g6-border-secondary bg-g6-bg-muted px-2.5 py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-g6-primary",
            clamp && "line-clamp-3",
          )}
        >
          {value}
        </div>
      )}
    </div>
  );
}

/** Only "detected" gets a chip — stored is the unmarked default (stated in the
 *  header) and "not-found" already announces itself as N/F in the value slot. */
function ProvenanceChip({ provenance }: { provenance: FieldProvenance }) {
  if (provenance !== "detected") return null;
  return (
    <span
      title="We derived this — the ad doesn't store it. Worth a check."
      className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill border border-warning-text/40 bg-warning-text/10 px-1.5 py-0.5 font-g6-mono text-[9px] font-semibold uppercase tracking-wider text-warning-text"
    >
      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
      Detected
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-g6-base border border-warning-text/30 bg-warning-text/10 px-2.5 py-2 text-[11px] leading-snug text-warning-text">
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.2} />
      <span>{children}</span>
    </p>
  );
}
