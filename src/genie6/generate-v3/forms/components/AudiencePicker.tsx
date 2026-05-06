import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Audience, Gender } from "@/genie6/generate-v3/mocks/audiences";
import { formatAge } from "@/genie6/generate-v3/mocks/audiences";

/**
 * AudiencePicker — horizontal scroll of persona cards (A-11.21).
 *
 * Per Maalik: "audinence ko bi best UX ke according bna skte hai ki kuchh
 * bhi padhna na pde, just scan kre and choose kre konsa". Translation:
 * card UX is icon-led trait viz, no paragraphs.
 *
 * Layout per card:
 *   - Top: persona name (small, single line)
 *   - Line 1: age range · geo chip · gender glyph · role chip
 *   - Line 2: 2–3 lifestyle/intent chips (lime-tinted dots)
 *   - Selected: lime ring + lime-tinted bg
 *
 * Last card = dashed `+ Create audience` tile → opens AudienceCreateModal.
 *
 * Per fabfunnel-design-system §6/§7: no flag emoji, no gender emoji. Inline
 * SVG glyph + 2-letter geo code.
 */

export interface AudiencePickerProps {
  audiences: Audience[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: () => void;
}

export function AudiencePicker({
  audiences,
  selectedIds,
  onToggle,
  onCreate,
}: AudiencePickerProps) {
  return (
    <div className="space-y-1.5">
      {selectedIds.length > 0 && (
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {selectedIds.length} selected · click again to deselect
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {audiences.map((a) => (
          <AudienceCard
            key={a.id}
            audience={a}
            selected={selectedIds.includes(a.id)}
            onToggle={() => onToggle(a.id)}
          />
        ))}
        <CreateAudienceTile onClick={onCreate} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function AudienceCard({
  audience,
  selected,
  onToggle,
}: {
  audience: Audience;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} audience: ${audience.name}`}
      className={cn(
        "shrink-0 w-[200px] rounded-xl border bg-card text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="space-y-2 p-3">
        <p className="truncate text-xs font-semibold text-foreground">
          {audience.name}
        </p>

        {/* Line 1: traits */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <TraitChip>{formatAge(audience)}</TraitChip>
          <TraitChip mono>{audience.geo}</TraitChip>
          <GenderGlyph gender={audience.gender} />
          {audience.role && <TraitChip>{audience.role}</TraitChip>}
        </div>

        {/* Line 2: lifestyle/intent dots */}
        <div className="flex flex-wrap items-center gap-1">
          {audience.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-foreground"
            >
              <span className="h-1 w-1 rounded-full bg-primary" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

function TraitChip({
  children,
  mono = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded bg-muted/70 px-1 py-0.5 text-[9px] text-foreground",
        mono && "font-mono uppercase tracking-wider",
      )}
    >
      {children}
    </span>
  );
}

/** Small inline SVG glyph for gender. No emoji per fabfunnel-design-system §7. */
function GenderGlyph({ gender }: { gender: Gender | "any" }) {
  if (gender === "any") {
    return (
      <span className="inline-flex h-3.5 items-center rounded bg-muted/70 px-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
        ⚤
      </span>
    );
  }
  if (gender === "f") {
    return (
      <svg
        viewBox="0 0 12 12"
        className="h-3.5 w-3.5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Female"
        role="img"
      >
        <circle cx="6" cy="4.5" r="2.5" />
        <path d="M6 7v4M4 9.5h4" />
      </svg>
    );
  }
  if (gender === "m") {
    return (
      <svg
        viewBox="0 0 12 12"
        className="h-3.5 w-3.5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Male"
        role="img"
      >
        <circle cx="5" cy="7" r="2.5" />
        <path d="M7 5l3-3M8 2h2v2" />
      </svg>
    );
  }
  return null;
}

/* ─────────────────────────────────────────────────────── */

function CreateAudienceTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create custom audience"
      className={cn(
        "shrink-0 w-[140px] rounded-xl border-2 border-dashed border-border bg-card/40 text-muted-foreground",
        "flex flex-col items-center justify-center gap-1 transition-colors",
        "hover:border-primary/40 hover:text-foreground hover:bg-card",
        "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
      )}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
        <Plus className="h-3.5 w-3.5" />
      </div>
      <p className="text-[10px] font-medium">Create audience</p>
      <p className="text-[9px] text-muted-foreground/80 flex items-center gap-1">
        <Users className="h-2.5 w-2.5" /> custom
      </p>
    </button>
  );
}
