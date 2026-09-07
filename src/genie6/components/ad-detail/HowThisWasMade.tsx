import { useState } from "react";
import { ChevronUp, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODE_LABELS } from "../../types/output";
import type { OutputData } from "../../types/output";
import type { RunBatch } from "../../lib/genieRunTypes";
import { originLabel } from "../../library/originLabels";
import { formatRelativeTime } from "../../library/relativeTime";
import { languageLabel } from "../../lib/languages";
import { angles } from "@/mocks/shared/angles";
import { modelLabel } from "../../studio-v4/components/queue/batchDisplay";

interface HowThisWasMadeProps {
  output: OutputData;
  /** The real batch this output belongs to (§10), when known. Carries the
   *  facts OutputData itself never had a home for: Batch ID, source module,
   *  Created By, provenance, language. */
  batch?: RunBatch;
  /** Default expanded. URL-driven via parent if needed. */
  defaultExpanded?: boolean;
  className?: string;
}

const PROVENANCE_LABEL: Record<RunBatch["provenance"], string> = {
  "fabfunnel-seeded": "FabFunnel-seeded",
  "client-created": "Client-created",
};

/**
 * HowThisWasMade — provenance section for the canonical Ad Detail drawer.
 *
 * Collapsed (42px): mono-caps eyebrow + "view more" lime link.
 * Expanded: 3-col rows — Mode/Format/AI model, Aspect ratio/Approach/Generated,
 * KB/Concepts/Angle, Batch ID/Source module/Created by, Provenance/Language/
 * Credits — plus the Reference and Prompt rows (§8.3's "prompt, angle,
 * reference" trio, alongside Angle above) at the bottom.
 *
 * Pure provenance — never fabricates prompt, reference, or model identity.
 * Every field renders unconditionally: a missing value shows an honest
 * em-dash (or an italic "Not used" / "None" stub for the multi-value KB and
 * Concepts fields) instead of the row silently not existing — so a fully
 * populated generation, a partly-tracked one, and an untracked legacy
 * output all read as deliberate, not broken.
 */
export function HowThisWasMade({
  output,
  batch,
  defaultExpanded = true,
  className,
}: HowThisWasMadeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Chevron = expanded ? ChevronUp : ChevronDown;

  /**
   * AI model — used to read `output.aiModel` ("GPT 5.5"), a value that
   * never matched what credits were actually priced against
   * (`batch.config.model`, a Genie model id like "genie-1.0") and wasn't
   * even shown anywhere. Prefer the batch's own model (resolved to its
   * human label) since that's the model the generation actually used and
   * priced against; fall back to `output.aiModel` only for outputs with no
   * tracked batch, so a legacy item still shows whatever was captured
   * rather than going blank.
   */
  const modelValue =
    (batch?.config?.model && modelLabel(batch.config.model)) || output.aiModel;

  /** Captured on the batch, read by nothing until now (§11 "full generation
   *  detail in properties"). No fallback source on untracked outputs — an
   *  honest "—" there, never a fabricated ratio or approach. */
  const aspectRatioValue = batch?.config?.aspectRatio;
  const approachValue = batch?.config?.approach;

  /**
   * Generated — the mock pool (`sample-outputs.ts`) freezes `generatedAt`
   * at a fixed date while `batch.createdAt` is real `Date.now()`, so a
   * batch header reading "2h ago" and this drawer could otherwise show a
   * date months apart for the same asset. Prefer the batch's real
   * timestamp whenever the asset belongs to a tracked batch — it's the one
   * the rest of the app (batch headers, Library) already renders from —
   * and fall back to the output's own `generatedAt` only when no batch is
   * on record. Same `formatRelativeTime` the batch header uses, so the two
   * can't drift into different formats either.
   */
  const generatedAtValue = formatRelativeTime(batch ? new Date(batch.createdAt) : output.generatedAt);

  /** Reference — §8.3's third promised fact ("prompt, angle, reference").
   *  Not rendered anywhere until now. A flow-sourced batch (Industry
   *  Insights winner ad, Reports top performer, Trends supporting creative,
   *  a Creative Library asset used as a reference, etc) already carries the
   *  referenced ad's title on `RunOrigin` — the authoritative, currently
   *  populated source. `priorConfig.reference` is the fallback for an
   *  output that captures its own reference directly. Neither present →
   *  honest "—", same rule as every other row here. */
  const referenceValue =
    output.priorConfig?.reference ??
    (batch?.origin.kind === "flow" ? batch.origin.refTitle : undefined);

  return (
    <section className={cn("rounded-2xl border border-border/60 bg-card", className)}>
      {/* Header — always visible, click anywhere on the row to toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
        aria-expanded={expanded}
      >
        <Chevron
          className="h-3.5 w-3.5 text-muted-foreground"
          strokeWidth={2.2}
        />
        <span className="flex-1 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          How this was made
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
          {expanded ? "View less" : "View more"}
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-3 space-y-3">
          {/* Row 1 — Mode / Format / AI model */}
          <div className="grid grid-cols-3 gap-6">
            <Field label="Mode" value={MODE_LABELS[output.mode]} />
            <Field label="Format" value={output.format ?? "—"} />
            <Field label="AI model" value={modelValue ?? "—"} />
          </div>

          {/* Row 1b — Aspect ratio / Approach / Generated (§11 "full
              generation detail" — captured on the batch, surfaced nowhere
              until now). */}
          <div className="grid grid-cols-3 gap-6">
            <Field label="Aspect ratio" value={aspectRatioValue ?? "—"} mono />
            <Field label="Approach" value={approachValue ?? "—"} />
            <Field label="Generated" value={generatedAtValue} mono />
          </div>

          {/* Row 2 — Knowledge base / Concepts / Angle */}
          <div className="grid grid-cols-3 gap-6">
            {/* Knowledge base */}
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Knowledge base
              </p>
              {output.knowledgeBaseUsed && output.knowledgeBaseSources?.length ? (
                <div className="flex flex-wrap gap-1">
                  {output.knowledgeBaseSources.map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/85"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">Not used</p>
              )}
            </div>

            {/* Concepts */}
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Concepts
              </p>
              {output.concepts && output.concepts.length > 0 ? (
                <p className="text-[12px] text-foreground/85 leading-tight">
                  <span className="font-semibold">{output.concepts.length}</span>
                  {" concepts "}
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    · {output.concepts[0].variations} variations each
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">None</p>
              )}
            </div>

            {/* Angle tags */}
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Angle
              </p>
              {output.angleTags && output.angleTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {/* Resolve the angle id to its human label. These arrive as
                      slugs ("ang-asp-lifestyle"), and rendering the slug put a
                      database key in front of the user — right next to
                      properly-labelled fields like "Product Ad" and "GPT 5.5",
                      which made it read as a bug rather than an id. Falls back
                      to the raw value so an unknown angle still shows
                      something rather than vanishing. */}
                  {output.angleTags.map((tag) => (
                    <span
                      key={tag}
                      title={tag}
                      className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/85"
                    >
                      {angleLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">—</p>
              )}
            </div>
          </div>

          {/* Row 3 — Batch facts (§10). Only when a real batch is on
              record; otherwise say so honestly rather than fabricate one. */}
          <div className="grid grid-cols-3 gap-6 pt-2 border-t border-border/40">
            <Field label="Batch ID" value={batch?.batchId ?? "Not tracked"} mono />
            <Field label="Source module" value={batch ? originLabel(batch.origin) : "—"} />
            <Field label="Created by" value={batch?.createdBy ?? "—"} />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Field
              label="Provenance"
              value={batch ? PROVENANCE_LABEL[batch.provenance] : "—"}
            />
            <Field
              label="Language"
              value={batch?.config?.language ? languageLabel(batch.config.language) : "—"}
            />
            <Field label="Credits (batch)" value={batch ? `${batch.credits}` : "—"} mono />
          </div>

          {/* Reference — §8.3's third promised fact, alongside Prompt and
              Angle. Always renders (never conditional on presence) so a
              missing value reads as "not captured" rather than the row
              silently not existing. */}
          <div className="flex flex-col gap-1 pt-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              Reference
            </p>
            <p className="text-[12.5px] text-foreground/85 leading-snug">
              {referenceValue ?? "—"}
            </p>
          </div>

          {/* Prompt — used to render only when promptSnippet existed, so a
              missing value made the whole row vanish rather than reading as
              "not captured" like every neighbouring field. Always renders
              now, with the same "—" fallback; the copy button only appears
              when there's real text to copy. Value uses the prose (Geist
              Sans) treatment per the design system — not mono, which is
              reserved for numeric/technical values like ids and ratios. */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center gap-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Prompt
              </p>
              {output.priorConfig?.promptSnippet && (
                <CopyButton text={output.priorConfig.promptSnippet} />
              )}
            </div>
            <p className="text-[12.5px] text-foreground/85 leading-snug italic">
              {output.priorConfig?.promptSnippet ?? "—"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-[12.5px] text-foreground/85 leading-tight",
          mono && "font-mono uppercase tracking-[0.04em]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API can fail in insecure contexts; fail silently —
      // user can still select the prompt text manually.
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Prompt copied" : "Copy prompt"}
      className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
    </button>
  );
}

/** Angle id → label, from the shared canonical angle list. */
function angleLabel(id: string): string {
  return angles.find((a) => a.id === id)?.label ?? id;
}
