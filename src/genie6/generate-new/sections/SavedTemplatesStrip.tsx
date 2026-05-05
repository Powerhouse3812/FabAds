import { LayoutTemplate, Sparkles, Image as ImageIcon, Video, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SavedTemplatesStrip — visual template-card row.
 *
 * A-11.11 redesign per Maalik's UI feedback ("Templates ko visually dikhao"):
 * was plain text chips with name + sub-line. Now a visual horizontal-scroll
 * card row. Each card shows:
 *   - Gradient thumbnail (lime-tinted, mode-specific glyph in the center)
 *   - Template name (1 line) + a tag chip ("Static" / "Carousel" / "Video" /
 *     "Adcopy")
 *   - "Apply" affordance on hover
 *
 * Plus a "New template" tile at the end so the user can stub a save action.
 *
 * Real persistence (per Master Doc §11.10) wires in iter-8+ along with the
 * Concept localStorage store. For Phase B build: 4 mocked default templates.
 */

export type TemplateTag = "static" | "carousel" | "video" | "adcopy" | "ugc";

export interface SavedTemplate {
  id: string;
  label: string;
  /** Optional one-line sub */
  sub?: string;
  /** Optional thumbnail URL. If absent, gradient placeholder renders. */
  thumbnail?: string;
  /** Tag pill drives the icon + color hint */
  tag?: TemplateTag;
  onApply?: () => void;
}

const TAG_META: Record<TemplateTag, { label: string; icon: typeof ImageIcon; gradient: string }> = {
  static: {
    label: "Static",
    icon: ImageIcon,
    gradient: "from-lime-200/40 via-lime-300/30 to-lime-400/40",
  },
  carousel: {
    label: "Carousel",
    icon: ImageIcon,
    gradient: "from-amber-200/40 via-amber-300/30 to-amber-400/40",
  },
  video: {
    label: "Video",
    icon: Video,
    gradient: "from-violet-200/40 via-violet-300/30 to-violet-400/40",
  },
  adcopy: {
    label: "Adcopy",
    icon: FileText,
    gradient: "from-sky-200/40 via-sky-300/30 to-sky-400/40",
  },
  ugc: {
    label: "UGC",
    icon: Video,
    gradient: "from-pink-200/40 via-pink-300/30 to-pink-400/40",
  },
};

const DEFAULT_TEMPLATES: SavedTemplate[] = [
  {
    id: "fomo-launch",
    label: "FOMO launch",
    sub: "Founder + 3-pack benefits + price",
    tag: "static",
  },
  {
    id: "lifestyle-aspirational",
    label: "Lifestyle aspirational",
    sub: "Mood + soft music + social proof",
    tag: "video",
  },
  {
    id: "founder-story",
    label: "Founder story",
    sub: "Talking-head intro + product reveal at 12s",
    tag: "ugc",
  },
  {
    id: "carousel-bundle",
    label: "Carousel bundle",
    sub: "5 SKUs · price overlay · CTA tile",
    tag: "carousel",
  },
];

export interface SavedTemplatesStripProps {
  templates?: SavedTemplate[];
  /** Optional override label */
  label?: string;
  /** Show the "+ New template" stub at end */
  showCreate?: boolean;
}

export function SavedTemplatesStrip({
  templates = DEFAULT_TEMPLATES,
  label = "Saved templates",
  showCreate = true,
}: SavedTemplatesStripProps) {
  if (templates.length === 0 && !showCreate) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </h2>
        {templates.length > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
            {templates.length}
          </span>
        )}
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
        {showCreate && <CreateTemplateTile />}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function TemplateCard({ template }: { template: SavedTemplate }) {
  const meta = template.tag ? TAG_META[template.tag] : TAG_META.static;
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={template.onApply}
      aria-label={`Apply template: ${template.label}`}
      className={cn(
        "group shrink-0 flex flex-col items-stretch gap-0 rounded-xl border border-border bg-card text-left overflow-hidden",
        "w-[180px] transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      {/* Gradient thumbnail */}
      <div className={cn("relative aspect-[4/3] w-full bg-gradient-to-br", meta.gradient)}>
        {template.thumbnail ? (
          <img src={template.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm shadow-sm">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
          </div>
        )}
        {/* Tag chip in corner */}
        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
          {meta.label}
        </span>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-t from-foreground/30 via-transparent to-transparent">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            Apply
          </span>
        </div>
      </div>
      {/* Body */}
      <div className="space-y-0.5 p-2.5">
        <p className="truncate text-xs font-medium text-foreground">{template.label}</p>
        {template.sub && (
          <p className="line-clamp-1 text-[10px] text-muted-foreground">{template.sub}</p>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

function CreateTemplateTile() {
  return (
    <button
      type="button"
      onClick={() =>
        alert("Save-as-Template flow lands with the Concepts store (iter-8+).")
      }
      aria-label="New template"
      className={cn(
        "shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 text-muted-foreground transition-colors",
        "w-[180px] aspect-[4/3.4]",
        "hover:border-primary/40 hover:text-foreground hover:bg-card",
        "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
        <Plus className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-medium">New template</p>
      <p className="text-[10px] text-muted-foreground/70">Save winning settings</p>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

/** Re-export the Sparkles import to keep code readable when other files use this strip. */
export { Sparkles };
