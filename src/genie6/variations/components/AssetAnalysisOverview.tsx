import {
  AlertTriangle,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  ImageOff,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysedField, AssetAnalysis, AssetKind, FieldProvenance } from "../types";

interface AssetAnalysisOverviewProps {
  analysis: AssetAnalysis;
  className?: string;
}

/** "not-found" and an empty value are the same thing to the reader. */
function isEmpty(field: AnalysedField<string | number> | undefined): boolean {
  return (
    !field ||
    field.provenance === "not-found" ||
    field.value === null ||
    field.value === undefined ||
    field.value === ""
  );
}

/** The entity row's label follows whatever the Type row resolved to. */
const ENTITY_LABEL: Record<string, string> = {
  brand: "Brand",
  product: "Product",
  category: "Category",
  "category-product": "Category + Product",
};

/**
 * Per-kind identity. `label` duplicates what `assetKindLabel(kind)` in
 * `data/analyseAsset.ts` will expose (that file is being written in parallel) —
 * swap the label lookup for it once it lands; the icon and the produced-output
 * copy stay here because they are presentation, not derivation.
 */
const KIND_META: Record<AssetKind, { label: string; Icon: React.ElementType }> = {
  script: { label: "Script", Icon: FileText },
  concept: { label: "Concept", Icon: Lightbulb },
  storyboard: { label: "Storyboard", Icon: Clapperboard },
};

/**
 * WHICH ROWS EXIST AT ALL, by asset kind. This is the one rule that decides
 * hide-vs-N/F: applicability is a function of `assetKind` ALONE, and provenance
 * only ever chooses between a value and "N/F" inside a row that already
 * rendered. A concept therefore never prints "FRAMEWORK — N/F" (concepts don't
 * have one), while a script whose framework genuinely didn't resolve does.
 * Rows absent from this map are universal.
 */
const KIND_SCOPED_ROWS: Record<string, AssetKind[]> = {
  framework: ["script", "storyboard"],
  duration: ["script", "storyboard"],
  scenes: ["storyboard"],
};

function rowApplies(row: string, kind: AssetKind): boolean {
  const scope = KIND_SCOPED_ROWS[row];
  return !scope || scope.includes(kind);
}

/**
 * `scenes.detail` arrives as one beat summary string. Render it as beats when it
 * carries separators; a paragraph is the fallback, never the goal.
 */
function splitBeats(detail: string): string[] {
  const byLine = detail.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  const byBullet = detail.split(/\s*[·|;]\s*/).map((s) => s.trim()).filter(Boolean);
  if (byBullet.length > 1) return byBullet;
  const byNumber = detail.split(/(?=\b\d{1,2}[.)]\s)/).map((s) => s.trim()).filter(Boolean);
  return byNumber.length > 1 ? byNumber : [detail.trim()];
}

/**
 * AssetAnalysisOverview — read-only "here's what we found in your asset" panel,
 * the Part 2 twin of `AnalysisOverview`. Same grammar throughout: mono-caps
 * labels, unchipped means stored, a "Detected" chip on derived values, "N/F" as
 * the value itself when nothing was found, and a per-state tally in the header.
 *
 * Two things this one owns that the ad overview doesn't:
 *   - the asset KIND, stated in the header, because a Script, a Concept and a
 *     Storyboard are three different things and this is where the user confirms
 *     we read the right one;
 *   - `hasVisuals`, banded directly under the header, because it is what decides
 *     whether the run comes back as storyboards or as scripts.
 */
export function AssetAnalysisOverview({ analysis, className }: AssetAnalysisOverviewProps) {
  const { source, assetKind, hasVisuals } = analysis;
  const kind = KIND_META[assetKind];

  /* Type — resolve the enum to a label here so the row never prints a raw key.
     "not-found" falls through to the shared N/F treatment. */
  const typeField: AnalysedField = {
    value:
      analysis.type.value && analysis.type.value !== "not-found"
        ? (ENTITY_LABEL[analysis.type.value] ?? "Other")
        : null,
    provenance: analysis.type.provenance,
  };

  const entityLabel =
    (analysis.type.value && ENTITY_LABEL[analysis.type.value]) ?? "Brand / Product / Category";

  const showScenes = rowApplies("scenes", assetKind);

  /* The compact grid, built as a list so a kind that drops a row leaves no hole
     in the 3-column flow. */
  const compact: Array<{ key: string; label: string; field: AnalysedField; mono?: boolean }> = [
    { key: "type", label: "Type", field: typeField },
    { key: "entityName", label: entityLabel, field: analysis.entityName },
    { key: "angle", label: "Angle", field: analysis.angle },
    { key: "concept", label: "Concept", field: analysis.concept },
    { key: "framework", label: "Framework", field: analysis.framework },
    { key: "language", label: "Language", field: analysis.language },
    { key: "duration", label: "Duration", field: analysis.duration, mono: true },
  ].filter((r) => rowApplies(r.key, assetKind));

  /* The tally covers exactly the analysed rows ON SCREEN — a concept's tally
     can't include a framework it never showed. Source is how we got here, not
     something we detected, so it isn't counted. */
  const shown: FieldProvenance[] = [
    ...compact.map((r) => r.field.provenance),
    analysis.visualDirection.provenance,
    ...(showScenes ? [analysis.scenes.provenance] : []),
    analysis.body.provenance,
  ];
  const storedCount = shown.filter((p) => p === "stored").length;
  const detectedCount = shown.filter((p) => p === "detected").length;
  const notFoundCount = shown.filter((p) => p === "not-found").length;

  /* A pasted asset is a real, expected shape — only language, duration and the
     body derive from raw text. Say so, rather than letting six N/F rows read as
     a broken panel. Ratio, not a fixed count, because the row count varies. */
  const sparse = notFoundCount >= Math.ceil(shown.length * 0.6);

  const beats =
    showScenes && analysis.scenes.detail ? splitBeats(analysis.scenes.detail) : [];

  return (
    <section
      className={cn("rounded-g6-xl border border-g6-border bg-g6-bg-container", className)}
    >
      <header className="flex items-start justify-between gap-6 border-b border-g6-border-secondary px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-2 py-0.5 font-g6-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-g6-primary">
              <kind.Icon className="h-3 w-3" strokeWidth={2.2} />
              {kind.label}
            </span>
            <p className="truncate font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
              What we found in this {kind.label.toLowerCase()}
            </p>
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-g6-text-secondary">
            No chip means we read it off the asset ·{" "}
            <span className="text-warning-text">Detected</span> means we derived it — worth a
            check · N/F means nothing was found
          </p>
        </div>
        <p className="shrink-0 font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
          {/* Only the STORED tally is accented: those are the facts read straight
              off the asset. "detected" stays neutral because the Detected chip
              owns that colour, and N/F must never look significant. */}
          <span className="text-g6-primary-active">{storedCount} stored</span> ·{" "}
          {detectedCount} detected · {notFoundCount} N/F
        </p>
      </header>

      <VisualsBand assetKind={assetKind} hasVisuals={hasVisuals} />

      <div className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {compact.map((r) => (
            <Field
              key={r.key}
              label={r.label}
              field={r.field}
              mono={r.mono}
              /* Type is the headline answer to the panel's question, so it is
                 the one accented value row. Deliberately NOT the entity row:
                 on a competitor-owned source that name is a rival's (§7.2). */
              accent={r.key === "type"}
            />
          ))}
        </div>

        {/* Universal — a concept can carry a look too, and on a script this is
            the row whose emptiness is the "no visuals yet" fact. */}
        <ProseField
          label="Visual direction"
          field={analysis.visualDirection}
          emptyHint={
            hasVisuals ? "Not found in this asset" : "No visual directions on this asset yet"
          }
          className="border-t border-g6-border-secondary pt-3"
          clamp
        />

        {showScenes && (
          <div className="flex flex-col gap-1 border-t border-g6-border-secondary pt-3">
            <div className="flex items-center gap-1.5">
              <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
                Scenes
              </p>
              <ProvenanceChip provenance={analysis.scenes.provenance} />
              {!isEmpty(analysis.scenes) && (
                <p className="font-g6-mono text-[10px] uppercase tracking-[0.04em] text-g6-text-secondary">
                  {analysis.scenes.value} {analysis.scenes.value === 1 ? "beat" : "beats"}
                </p>
              )}
            </div>
            {isEmpty(analysis.scenes) && beats.length === 0 ? (
              <p
                title="No scene breakdown was found on this storyboard"
                className="font-g6-mono text-g6-sm uppercase leading-tight tracking-[0.04em] text-g6-text-tertiary"
              >
                N/F
              </p>
            ) : (
              <ol
                tabIndex={0}
                aria-label="Scene beats"
                className="max-h-32 min-w-0 space-y-1 overflow-y-auto rounded-g6-base border border-g6-border-secondary bg-g6-bg-muted px-2.5 py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-g6-primary"
              >
                {beats.map((beat, i) => (
                  <li key={i} className="flex min-w-0 gap-2">
                    <span className="shrink-0 font-g6-mono text-[10px] leading-5 text-g6-text-tertiary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 text-g6-sm leading-snug text-g6-text">{beat}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* The asset's own words — a full script runs many lines, so it scrolls
            inside a fixed height instead of stretching the panel. */}
        <ProseField
          label={`${kind.label} text`}
          field={analysis.body}
          className="border-t border-g6-border-secondary pt-3"
          scroll
        />

        <div className="border-t border-g6-border-secondary pt-3">
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

        {/* §7.2 — a rival's asset. Stated plainly so nothing downstream can
            imply we'll write for the competitor's brand. */}
        {source.competitorOwned && (
          <Note>
            This asset belongs to a competitor. Its brand is shown for reference only — your
            variations are made for your own brand.
          </Note>
        )}

        {sparse && (
          <Note>
            Little was readable off this {kind.label.toLowerCase()}. The N/F rows aren't guesses —
            nothing was found, and anything chipped Detected is worth checking before you
            generate.
          </Note>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ pieces */

/**
 * `hasVisuals` decides what the run PRODUCES, so it gets a band of its own
 * rather than a row: a script with no visuals reads as "no visuals yet" plus
 * the consequence, never as a missing field.
 */
function VisualsBand({
  assetKind,
  hasVisuals,
}: {
  assetKind: AssetKind;
  hasVisuals: boolean;
}) {
  /* A storyboard without visuals contradicts its own kind. Don't paper over it. */
  if (assetKind === "storyboard" && !hasVisuals) {
    return (
      <Band
        tone="warning"
        Icon={ImageOff}
        title="Marked as a storyboard, but no visual directions were found"
        // `resolveOutputKind` returns "storyboard" for a storyboard source
        // whatever its visuals, so promising scripts here would misstate the
        // run. The honest read is that the look is missing, not the kind.
        body="These still come back as storyboards — set a visual direction so every beat has a look."
      />
    );
  }

  if (hasVisuals) {
    return (
      <Band
        tone="on"
        Icon={ImageIcon}
        title="Visual directions present"
        /* Same rule as the no-visuals band below: visuals only promote a SCRIPT
           to a storyboard. A concept with a look is still a concept. */
        body={
          assetKind === "concept"
            ? "Your variations come back as concepts — each with its own look carried over."
            : "Your variations come back as storyboards — words plus a look for every beat."
        }
      />
    );
  }

  return (
    <Band
      tone="off"
      Icon={ImageOff}
      title="No visuals yet"
      /* The storyboard consequence is script-only: `resolveOutputKind` returns
         "concept" for a concept no matter what visuals it gains, so promising
         storyboards here would contradict both the run and the stage-4 band. */
      body={
        assetKind === "concept"
          ? "Your variations come back as concepts. A visual direction shapes the look, but a concept stays a concept."
          : "Your variations come back as scripts. Add a visual direction and they come back as storyboards instead."
      }
    />
  );
}

function Band({
  tone,
  Icon,
  title,
  body,
}: {
  tone: "on" | "off" | "warning";
  Icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b px-4 py-2.5",
        tone === "on" && "border-g6-primary-border bg-g6-primary-bg",
        tone === "off" && "border-g6-border-secondary bg-g6-bg-muted",
        tone === "warning" && "border-warning-text/30 bg-warning-text/10",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-3.5 w-3.5 shrink-0",
          tone === "on" && "text-g6-primary",
          tone === "off" && "text-g6-text-tertiary",
          tone === "warning" && "text-warning-text",
        )}
        strokeWidth={2.2}
      />
      <div className="min-w-0">
        <p
          className={cn(
            /* Both non-warning tones accent the TITLE: this band states what the
               run will produce, which is the single most consequential fact on
               the screen, and at rest it was indistinguishable from body copy.
               The surface still separates them — lime tint when visuals are
               present, muted when they aren't — so accenting both titles marks
               the band as a consequence without claiming "no visuals" is good.
               The warning tone keeps `warning-text` untouched. */
            "text-[11px] font-semibold leading-4",
            tone === "warning" ? "text-warning-text" : "text-g6-primary-active",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "text-[10.5px] leading-snug",
            tone === "warning" ? "text-warning-text" : "text-g6-text-secondary",
          )}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  field,
  mono,
  hasDetailSlot,
  accent,
}: {
  label: string;
  field: AnalysedField;
  /** Numeric/technical values (durations) only — prose stays in Geist Sans. */
  mono?: boolean;
  /** Reserve the second line so slotted rows stay aligned. */
  hasDetailSlot?: boolean;
  /** The row that answers the panel's question. Never on an empty value. */
  accent?: boolean;
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
        /* Long names (60+ chars) truncate rather than reflow the grid; the full
           string stays reachable on hover. */
        title={empty ? "Not found in this asset" : value}
        className={cn(
          /* `text-[12px]` and not the `text-g6-sm` token (same 12px) ON PURPOSE:
             tailwind-merge can't tell a custom `text-g6-*` key is a size, files
             it under text-COLOR, and the colour classes below then win and
             delete it — the value silently renders at 16px. An arbitrary length
             is classified correctly. */
          "truncate text-[12px] leading-tight text-g6-text",
          empty && "font-g6-mono uppercase tracking-[0.04em] text-g6-text-tertiary",
          mono && !empty && "font-g6-mono uppercase tracking-[0.04em]",
          /* N/F stays neutral — an accent there would imply a finding. */
          accent && !empty && "font-medium text-g6-primary-active",
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
  emptyHint,
  className,
}: {
  label: string;
  field: AnalysedField;
  /** Multi-line bodies: scroll inside a fixed height, never grow unbounded. */
  scroll?: boolean;
  /** Single long sentence: clamp to 3 lines, full text on hover. */
  clamp?: boolean;
  emptyHint?: string;
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
          title={emptyHint ?? "Not found in this asset"}
          className="font-g6-mono text-g6-sm uppercase leading-tight tracking-[0.04em] text-g6-text-tertiary"
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
            /* `text-[12px]` not `text-g6-sm` — see the note in Field above. */
            "min-w-0 text-[12px] leading-snug text-g6-text",
            scroll &&
              "max-h-40 overflow-y-auto whitespace-pre-line rounded-g6-base border border-g6-border-secondary bg-g6-bg-muted px-2.5 py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-g6-primary",
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
      title="We derived this — the asset doesn't store it. Worth a check."
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
