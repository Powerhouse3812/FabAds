import { LayoutGrid, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type LibraryView = "masonry" | "grouped";

type Props = {
  value: LibraryView;
  onChange: (next: LibraryView) => void;
  className?: string;
};

/**
 * MasonryGroupToggle — 2-option segmented pill matching the Figma final.
 *
 * Replaces the previous GridKanbanToggle in the Generations / Library
 * surface. Kanban is no longer one of the toggled options; the
 * KanbanBoard component is preserved on disk for potential reuse.
 */
export function MasonryGroupToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Library view"
      className={cn(
        "inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container p-0.5",
        className,
      )}
    >
      <ViewBtn
        Icon={LayoutGrid}
        label="Masonry"
        active={value === "masonry"}
        onClick={() => onChange("masonry")}
      />
      <ViewBtn
        Icon={Layers}
        label="Grouped"
        active={value === "grouped"}
        onClick={() => onChange("grouped")}
      />
    </div>
  );
}

function ViewBtn({
  Icon,
  label,
  active,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-g6-pill px-3 transition-colors",
        active
          ? "bg-g6-primary text-g6-text-on-accent shadow-g6-sm"
          : "text-g6-text-secondary hover:text-g6-text",
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-g6-sans text-g6-xs font-medium">{label}</span>
    </button>
  );
}
