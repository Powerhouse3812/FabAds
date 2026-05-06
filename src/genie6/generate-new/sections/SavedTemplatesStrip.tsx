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
 * A-11.21 polish per Maalik:
 *   - Compact: card width 180→140, body padding tightened, smaller body text
 *     so the strip occupies ~30% less vertical space without losing visual ID.
 *   - Selectable: optional `selectedId` + `onSelect(id)` props. Selected card
 *     gets lime ring + lime tint. Click toggles selection (re-click deselects).
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

// Real creative imagery — Unsplash source URLs return curated stock images
// matching the term. Used in scope=A as stand-in for actual saved-template
// thumbnails until the Concepts persistence + creative-export pipeline lands.
const DEFAULT_TEMPLATES: SavedTemplate[] = [
  {
    id: "fomo-launch",
    label: "FOMO launch",
    sub: "Founder + 3-pack benefits + price",
    tag: "static",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=320&h=240&q=70",
  },
  {
    id: "lifestyle-aspirational",
    label: "Lifestyle aspirational",
    sub: "Mood + soft music + social proof",
    tag: "video",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=320&h=240&q=70",
  },
  {
    id: "founder-story",
    label: "Founder story",
    sub: "Talking-head intro + product reveal at 12s",
    tag: "ugc",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=320&h=240&q=70",
  },
  {
    id: "carousel-bundle",
    label: "Carousel bundle",
    sub: "5 SKUs · price overlay · CTA tile",
    tag: "carousel",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=320&h=240&q=70",
  },
];

export interface SavedTemplatesStripProps {
  templates?: SavedTemplate[];
  /** Optional override label */
  label?: string;
  /** Show the "+ New template" stub at end */
  showCreate?: boolean;
  /** Currently selected template id (controlled). */
  selectedId?: string | null;
  /** Selection handler. If provided, cards become selectable; otherwise they
   *  fall back to template.onApply (legacy). Click on selected = deselect. */
  onSelect?: (id: string | null) => void;
}

export function SavedTemplatesStrip({
  templates = DEFAULT_TEMPLATES,
  label = "Saved templates",
  showCreate = true,
  selectedId = null,
  onSelect,
}: SavedTemplatesStripProps) {
  if (templates.length === 0 && !showCreate) return null;

  return (
    <section className="space-y-1.5">
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
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selectedId === t.id}
            onSelect={onSelect}
          />
        ))}
        {showCreate && <CreateTemplateTile />}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: SavedTemplate;
  selected?: boolean;
  onSelect?: (id: string | null) => void;
}) {
  const meta = template.tag ? TAG_META[template.tag] : TAG_META.static;
  const Icon = meta.icon;
  const handleClick = () => {
    if (onSelect) {
      onSelect(selected ? null : template.id);
    } else {
      template.onApply?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        onSelect
          ? `${selected ? "Deselect" : "Select"} template: ${template.label}`
          : `Apply template: ${template.label}`
      }
      aria-pressed={onSelect ? selected : undefined}
      className={cn(
        "group shrink-0 flex flex-col items-stretch gap-0 rounded-xl border text-left overflow-hidden",
        "w-[140px] transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      {/* Gradient thumbnail — compact aspect for tighter strip */}
      <div className={cn("relative aspect-[5/3] w-full bg-gradient-to-br", meta.gradient)}>
        {template.thumbnail ? (
          <img src={template.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm shadow-sm">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
          </div>
        )}
        {/* Tag chip in corner */}
        <span className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
          {meta.label}
        </span>
        {/* Selected state badge */}
        {selected && (
          <span className="absolute top-1 left-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6.5l2.5 2.5L10 3" />
            </svg>
          </span>
        )}
        {/* Hover overlay (legacy "Apply" affordance — only when no onSelect) */}
        {!onSelect && (
          <div className="absolute inset-0 flex items-end justify-end p-1.5 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-t from-foreground/30 via-transparent to-transparent">
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
              Apply
            </span>
          </div>
        )}
      </div>
      {/* Body — tighter padding + smaller text */}
      <div className="px-1.5 py-1">
        <p className="truncate text-[11px] font-medium text-foreground leading-tight">
          {template.label}
        </p>
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
        "shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-card/40 text-muted-foreground transition-colors",
        "w-[140px] aspect-[5/3.5]",
        "hover:border-primary/40 hover:text-foreground hover:bg-card",
        "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
      )}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
        <Plus className="h-3.5 w-3.5" />
      </div>
      <p className="text-[10px] font-medium">New template</p>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

/** Re-export the Sparkles import to keep code readable when other files use this strip. */
export { Sparkles };
