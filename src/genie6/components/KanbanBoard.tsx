import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { OutputCard } from "./OutputCard";
import type { KanbanColumn, OutputData, EllipsisAction } from "../types/output";

/**
 * Winner / Maybe / Reject Kanban triage.
 * Same OutputCard component as Grid (variant="kanban"), drag-drop via @dnd-kit.
 */

type Assignment = Record<string, KanbanColumn>;

const COLUMNS: { id: KanbanColumn; label: string }[] = [
  { id: "winner", label: "Winner" },
  { id: "maybe", label: "Maybe" },
  { id: "reject", label: "Reject" },
];

type Props = {
  outputs: OutputData[];
  assignment: Assignment;
  onChange: (next: Assignment) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onCardClick?: (id: string) => void;
  onEllipsisAction?: (id: string, action: EllipsisAction) => void;
};

export function KanbanBoard({
  outputs,
  assignment,
  onChange,
  selectedIds,
  onSelect,
  onCardClick,
  onEllipsisAction,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId || !COLUMNS.find((c) => c.id === overId)) return;
    onChange({ ...assignment, [id]: overId as KanbanColumn });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid h-full grid-cols-3 gap-3">
        {COLUMNS.map((col) => {
          const colOutputs = outputs.filter((o) => assignment[o.id] === col.id);
          return (
            <KanbanCol key={col.id} id={col.id} label={col.label} count={colOutputs.length}>
              {colOutputs.map((o) => (
                <KanbanCard
                  key={o.id}
                  output={o}
                  selected={selectedIds?.has(o.id)}
                  onSelect={() => onSelect?.(o.id)}
                  onClick={() => onCardClick?.(o.id)}
                  onEllipsisAction={(a) => onEllipsisAction?.(o.id, a)}
                />
              ))}
            </KanbanCol>
          );
        })}
      </div>
    </DndContext>
  );
}

function KanbanCol({
  id,
  label,
  count,
  children,
}: {
  id: KanbanColumn;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[400px] flex-col rounded-g6-card border border-g6-border-secondary bg-g6-bg-container/40 p-3 transition-colors",
        isOver && "border-g6-primary bg-g6-primary-bg"
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h3 className="font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-text-secondary">
          {label}
        </h3>
        <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{count}</span>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">{children}</div>
    </div>
  );
}

function KanbanCard({
  output,
  selected,
  onSelect,
  onClick,
  onEllipsisAction,
}: {
  output: OutputData;
  selected?: boolean;
  onSelect: () => void;
  onClick: () => void;
  onEllipsisAction: (action: EllipsisAction) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: output.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(isDragging && "opacity-60")}>
      <OutputCard
        {...output}
        variant="kanban"
        selected={selected}
        onSelect={onSelect}
        onClick={onClick}
        onEllipsisAction={onEllipsisAction}
      />
    </div>
  );
}
