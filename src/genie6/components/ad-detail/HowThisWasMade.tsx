import { useState } from "react";
import { ChevronUp, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODE_LABELS } from "../../types/output";
import type { OutputData } from "../../types/output";
import type { RunBatch } from "../../lib/genieRunTypes";
import { originLabel } from "../../library/originLabels";
import { languageLabel } from "../../lib/languages";
import { angles } from "@/mocks/shared/angles";

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
 * Expanded (~220px): two 3-col rows (Mode/Format/AI model and KB/Concepts/Angle)
 * plus an optional prompt snippet at the bottom.
 *
 * Pure provenance — never fabricates prompt content or model identity. If a
 * field is missing from the OutputData snapshot, we render an em-dash or an
 * italic "Not used" / "None" stub so the audit trail is honest.
 */
export function HowThisWasMade({
  output,
  batch,
  defaultExpanded = true,
  className,
}: HowThisWasMadeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Chevron = expanded ? ChevronUp : ChevronDown;

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
            <Field label="AI model" value={output.aiModel ?? "—"} />
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

          {/* Prompt snippet — only if we actually captured one */}
          {output.priorConfig?.promptSnippet && (
            <div className="flex flex-col gap-1 pt-2">
              <div className="flex items-center gap-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Prompt
                </p>
                <CopyButton text={output.priorConfig.promptSnippet} />
              </div>
              <p className="text-[12.5px] text-foreground/85 leading-snug font-mono italic">
                {output.priorConfig.promptSnippet}
              </p>
            </div>
          )}
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
