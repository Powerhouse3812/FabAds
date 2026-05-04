import { LayoutTemplate, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SavedTemplatesStrip — first body section on Brand/Product/Affiliate forms.
 *
 * Per Form Specs §1, §2, §3: "Saved Templates / Concepts strip" — at the top
 * of form body. Visual layout designed to appear / disappear cleanly when a
 * user has zero saved templates yet.
 *
 * For Phase B build: 3 mocked default templates. Real persistence (per
 * Section 11.10 "Concept = saved settings preset") is wired in iter-8+
 * along with the localStorage-backed Concept store.
 *
 * TODO (backport):
 *   - Real saved templates / concepts from per-user store
 *   - "Apply" action that pushes the template's settings into the form's
 *     draft state
 *   - Save-as-Concept flow on the Results screen feeds this strip
 */

export interface SavedTemplate {
  id: string;
  label: string;
  /** Short description of what the template captures */
  sub?: string;
  /** Optional thumbnail URL */
  thumbnail?: string;
  onApply?: () => void;
}

export interface SavedTemplatesStripProps {
  templates?: SavedTemplate[];
  /** Optional override label */
  label?: string;
}

const DEFAULT_TEMPLATES: SavedTemplate[] = [
  {
    id: "fomo-launch",
    label: "FOMO launch",
    sub: "Founder voice + 3-pack benefits + price emphasis",
  },
  {
    id: "lifestyle-aspirational",
    label: "Lifestyle aspirational",
    sub: "Mood-driven · soft music · social proof",
  },
  {
    id: "founder-story",
    label: "Founder story",
    sub: "Talking-head intro · product reveal at 12s",
  },
];

export function SavedTemplatesStrip({
  templates = DEFAULT_TEMPLATES,
  label = "Saved templates",
}: SavedTemplatesStripProps) {
  if (templates.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </h2>
        <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
          {templates.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {templates.map((t) => (
          <TemplateChip key={t.id} template={t} />
        ))}
      </div>
    </section>
  );
}

function TemplateChip({ template }: { template: SavedTemplate }) {
  return (
    <button
      type="button"
      onClick={template.onApply}
      aria-label={`Apply template: ${template.label}`}
      className={cn(
        "shrink-0 group flex flex-col items-start gap-1 rounded-md border border-border bg-card px-3 py-2 text-left",
        "min-w-[180px] max-w-[220px] transition-colors",
        "hover:border-primary/40 hover:bg-card/80",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      )}
    >
      <p className="text-xs font-medium text-foreground truncate w-full">{template.label}</p>
      {template.sub && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{template.sub}</p>
      )}
      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
        Apply
        <ChevronRight className="h-2.5 w-2.5" />
      </span>
    </button>
  );
}
