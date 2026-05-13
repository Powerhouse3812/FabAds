import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditablePillRowProps {
  items: string[];
  onChange: (next: string[]) => void;
  /** Placeholder shown inside the "add pill" input when typing. */
  addPlaceholder?: string;
}

/**
 * Editable list of pills. Each pill renders with X-to-remove; clicking
 * the pill label converts it into an inline input. Bottom of the row
 * carries a dashed "+ Add" pill that toggles into an input for typing
 * a new pill. Enter / blur saves. Empty input on blur is dropped.
 */
export function EditablePillRow({
  items,
  onChange,
  addPlaceholder = "New item",
}: EditablePillRowProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState("");

  const editRef = useRef<HTMLInputElement | null>(null);
  const newRef = useRef<HTMLInputElement | null>(null);

  // Focus the active input on mount.
  useEffect(() => {
    if (editingIdx !== null) editRef.current?.focus();
  }, [editingIdx]);
  useEffect(() => {
    if (addingNew) newRef.current?.focus();
  }, [addingNew]);

  const startEditing = (i: number) => {
    setEditingIdx(i);
    setEditingDraft(items[i]);
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const next = editingDraft.trim();
    if (next && next !== items[editingIdx]) {
      onChange(items.map((it, i) => (i === editingIdx ? next : it)));
    }
    if (!next) {
      // Empty value on commit → remove the pill.
      onChange(items.filter((_, i) => i !== editingIdx));
    }
    setEditingIdx(null);
    setEditingDraft("");
  };

  const removeAt = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
  };

  const commitNew = () => {
    const next = newDraft.trim();
    if (next && !items.includes(next)) {
      onChange([...items, next]);
    }
    setAddingNew(false);
    setNewDraft("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => {
        const isEditing = editingIdx === i;
        if (isEditing) {
          return (
            <input
              key={`edit-${i}`}
              ref={editRef}
              value={editingDraft}
              onChange={(e) => setEditingDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingIdx(null);
                  setEditingDraft("");
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                }
              }}
              className="inline-flex h-6 rounded-full bg-background border border-primary/60 px-2.5 py-0 text-[11px] font-normal outline-none focus:ring-2 focus:ring-primary/60 min-w-[80px]"
              style={{ width: `${Math.max(editingDraft.length, 4)}ch` }}
              aria-label={`Edit pill ${i + 1}`}
            />
          );
        }
        return (
          <span
            key={`pill-${i}`}
            className={cn(
              "group inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground text-[11px] pl-2.5 pr-1 py-0.5 cursor-text",
              "hover:bg-secondary/80 transition-colors",
            )}
          >
            <button
              type="button"
              onClick={() => startEditing(i)}
              className="cursor-text"
            >
              {item}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
              className="h-4 w-4 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-background/60 transition-colors"
              aria-label={`Remove ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      {/* Add-new pill */}
      {addingNew ? (
        <input
          ref={newRef}
          value={newDraft}
          onChange={(e) => setNewDraft(e.target.value)}
          onBlur={commitNew}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setAddingNew(false);
              setNewDraft("");
            }
            if (e.key === "Enter") {
              e.preventDefault();
              commitNew();
            }
          }}
          placeholder={addPlaceholder}
          className="inline-flex h-6 rounded-full bg-background border border-primary/60 px-2.5 py-0 text-[11px] font-normal outline-none focus:ring-2 focus:ring-primary/60 min-w-[100px]"
          style={{
            width: `${Math.max(newDraft.length, addPlaceholder.length)}ch`,
          }}
          aria-label="Add new pill"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      )}
    </div>
  );
}
