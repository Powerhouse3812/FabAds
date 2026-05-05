import { useState, type ReactNode } from "react";
import { Settings2, ChevronDown, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AdvancedSection — replaces the previous "Advanced drawer" pattern.
 *
 * A-11.12 redesign per Maalik's UI feedback ("Advanced ke andar zero UX
 * hai, too long, lengthy, kuchh samajh nahi aa rha"):
 *
 * The old drawer was a wall of fields. Users couldn't navigate it, didn't
 * know what each field did, didn't want to tweak anything. New pattern:
 *
 *   - Header: "Smart defaults applied" badge + 1-line summary.
 *   - 3 visible HIGH-IMPACT fields by default — each form picks its own 3.
 *     These are the only ones a typical user actually touches.
 *   - "More controls →" button reveals everything else, ALSO grouped by
 *     facet so users can navigate ("Audience" / "Tone & voice" / "Format" /
 *     "Compliance") instead of one long scroll.
 *
 * Caller composes via two slot props:
 *   - `essentials` — 3 visible fields (rendered always)
 *   - `more` — full kitchen-sink, hidden until "More controls" clicked
 *
 * The component handles the toggle UI + the "Smart defaults applied" badge.
 */

export interface AdvancedSectionProps {
  /** The 3 highest-impact fields shown by default. */
  essentials: ReactNode;
  /** Everything else, hidden behind "More controls →". */
  more?: ReactNode;
  /** Optional override label for the section title. */
  label?: string;
  /** Optional override for the summary line under the title. */
  summary?: string;
}

export function AdvancedSection({
  essentials,
  more,
  label = "Fine-tune",
  summary = "Smart defaults are applied. Override only what matters.",
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wand2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="text-sm text-foreground leading-snug">{summary}</p>
        </div>
      </div>

      {/* Essentials — always visible */}
      <div className="space-y-3 pt-1">{essentials}</div>

      {/* More controls — progressive disclosure */}
      {more && (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded",
            )}
          >
            <Settings2 className="h-3 w-3" />
            {open ? "Hide more controls" : "More controls"}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && <div className="space-y-3 pt-2">{more}</div>}
        </div>
      )}
    </section>
  );
}

/**
 * AdvancedFacet — visual grouping inside the "More controls" reveal.
 *
 * Each facet ("Audience", "Tone & voice", "Format", "Compliance") gets its
 * own labeled mini-section so the long form is visually navigable instead
 * of one long scroll.
 */
export function AdvancedFacet({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
