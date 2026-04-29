import { LayoutGrid, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type GridKanbanView = "grid" | "kanban";

type Props = {
  value: GridKanbanView;
  onChange: (next: GridKanbanView) => void;
  className?: string;
};

export function GridKanbanToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Output triage view"
      className={cn(
        "inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container p-0.5",
        className
      )}
    >
      <ViewBtn
        Icon={LayoutGrid}
        label="Grid"
        active={value === "grid"}
        onClick={() => onChange("grid")}
      />
      <ViewBtn
        Icon={Columns3}
        label="Kanban"
        active={value === "kanban"}
        onClick={() => onChange("kanban")}
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
        "inline-flex h-7 items-center gap-1.5 rounded-g6-pill px-3 text-g6-sm font-medium transition-colors",
        active
          ? "bg-g6-primary text-g6-text-on-accent"
          : "text-g6-text-secondary hover:text-g6-text"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
