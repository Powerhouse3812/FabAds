import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, GripVertical, Plus, RotateCcw, Settings2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  KPI_COLUMNS,
  KPI_COLUMN_BY_KEY,
  MAX_KPI_COLUMNS,
} from "./kpi-catalogue";
import type { DashboardKpiPrefs } from "./useDashboardKpiPrefs";

/**
 * CustomizeKpiPopover — the gear-triggered control for the Performance
 * Overview band (A-12.200). Lets the user pick up to 5 Reports columns to
 * pin and drag-reorder them. Persists via the passed-in prefs hook.
 *
 * Layout (compact, ~280px):
 *   Header: "Customize metrics" + n/5 + Reset
 *   Shown (drag to reorder) — sortable rows: handle + label + remove
 *   Add metric — remaining columns, click to add (disabled at cap)
 *
 * dnd-kit powers the reorder (already a project dep). Pointer + keyboard
 * sensors so it's draggable by mouse AND operable by keyboard.
 *
 * Open state is URL-backed (A-12.201): `?kpi-customize=open`. So refresh
 * keeps the popover open, and the open state can be deep-linked / exported
 * (same pattern as the AdDetailDrawer + BatchDetailsAccordion). Closed =
 * param absent.
 */
export function CustomizeKpiPopover({ prefs }: { prefs: DashboardKpiPrefs }) {
  const { selected, isAtMax, toggle, remove, reorder, reset } = prefs;

  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.get("kpi-customize") === "open";
  const setOpen = useCallback(
    (next: boolean) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next) {
            sp.set("kpi-customize", "open");
            // A-12.202: this band is Growth-plan-only. Plan resolves from
            // URL → sessionStorage → "ai" default, so a copied link WITHOUT
            // ?plan=full lands a fresh tab on the AI dashboard, where this
            // popover doesn't exist. Stamp plan=full when opening so the
            // shareable / exportable URL reconstructs the exact screen.
            sp.set("plan", "full");
          } else {
            sp.delete("kpi-customize");
            // Leave ?plan as-is on close — the user genuinely is on Growth.
          }
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = selected.indexOf(String(active.id));
    const to = selected.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    reorder(arrayMove(selected, from, to));
  };

  const available = KPI_COLUMNS.filter((c) => !selected.includes(c.key));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Customize metrics"
          title="Customize metrics"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full",
            "text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[12px] font-semibold text-foreground">
              Customize metrics
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {selected.length}/{MAX_KPI_COLUMNS}
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset
          </button>
        </div>

        {/* Shown — sortable */}
        <div className="px-2 py-2">
          <p className="px-1 pb-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Shown · drag to reorder
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={selected} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-0.5">
                {selected.map((key) => (
                  <SortableRow
                    key={key}
                    id={key}
                    label={KPI_COLUMN_BY_KEY[key]?.label ?? key}
                    canRemove={selected.length > 1}
                    onRemove={() => remove(key)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>

        {/* Add */}
        {available.length > 0 && (
          <div className="border-t border-border/60 px-2 py-2">
            <p className="px-1 pb-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Add metric {isAtMax && "· remove one first"}
            </p>
            <ul className="flex flex-col gap-0.5">
              {available.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    disabled={isAtMax}
                    onClick={() => toggle(c.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                      isAtMax
                        ? "cursor-not-allowed text-muted-foreground/50"
                        : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SortableRow({
  id,
  label,
  canRemove,
  onRemove,
}: {
  id: string;
  label: string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-1.5 py-1.5 text-[12px]",
        isDragging
          ? "border-primary/40 bg-primary/[0.04] shadow-sm"
          : "border-transparent bg-muted/40",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Check className="h-3 w-3 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </li>
  );
}
