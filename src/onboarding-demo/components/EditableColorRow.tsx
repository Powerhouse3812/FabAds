import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BrandColor {
  hex: string;
  /** Optional display name — not editable here, kept for compatibility. */
  name?: string;
}

interface EditableColorRowProps {
  items: BrandColor[];
  onChange: (next: BrandColor[]) => void;
}

const HEX_RE = /^#?[0-9a-fA-F]{0,6}$/;

function normaliseHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.toLowerCase()}`;
}

/**
 * Editable row of brand-colour swatches. Each swatch shows the colour
 * + its hex code beneath. Click the hex code → input appears, type a
 * new 6-digit hex (with or without `#`), blur / Enter saves. ⌫ X icon
 * appears on hover to remove. Trailing "+ Add" button appends a new
 * neutral swatch the user can then click-to-edit.
 *
 * Per Maalik's call: "Click swatch → hex input field" (not the OS
 * colour picker).
 */
export function EditableColorRow({ items, onChange }: EditableColorRowProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingIdx !== null) inputRef.current?.focus();
  }, [editingIdx]);

  const startEditing = (i: number) => {
    setEditingIdx(i);
    setDraft(items[i].hex);
  };

  const commit = () => {
    if (editingIdx === null) return;
    const next = normaliseHex(draft);
    if (next && next !== items[editingIdx].hex) {
      onChange(
        items.map((c, i) => (i === editingIdx ? { ...c, hex: next } : c)),
      );
    }
    setEditingIdx(null);
    setDraft("");
  };

  const removeAt = (i: number) => {
    onChange(items.filter((_, j) => j !== i));
  };

  const addSwatch = () => {
    onChange([...items, { hex: "#cccccc" }]);
    // Immediately enter edit mode on the newly-added swatch.
    requestAnimationFrame(() => startEditing(items.length));
  };

  return (
    <div className="flex flex-wrap items-start gap-3">
      {items.map((c, i) => {
        const isEditing = editingIdx === i;
        return (
          <div
            key={`color-${i}`}
            className="group relative flex flex-col items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => startEditing(i)}
              className="h-7 w-7 rounded-md border border-border shadow-sm transition-transform hover:scale-105"
              style={{ background: c.hex }}
              aria-label={`Edit colour ${c.hex}`}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background border border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity inline-flex items-center justify-center"
              aria-label={`Remove ${c.hex}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
            {isEditing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  const v = e.target.value;
                  if (HEX_RE.test(v) || HEX_RE.test(`#${v}`)) setDraft(v);
                }}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingIdx(null);
                    setDraft("");
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  }
                }}
                className="w-[70px] h-5 rounded-sm border border-primary/60 bg-background px-1 text-[10px] font-mono text-center outline-none focus:ring-2 focus:ring-primary/60"
                placeholder="#aabbcc"
                aria-label="Hex colour"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEditing(i)}
                className={cn(
                  "text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors",
                  "rounded-sm px-1 -mx-1 hover:bg-muted/60",
                )}
              >
                {c.hex}
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSwatch}
        className="flex flex-col items-center gap-1.5"
        aria-label="Add colour"
      >
        <span className="h-7 w-7 rounded-md border-2 border-dashed border-border text-muted-foreground inline-flex items-center justify-center hover:border-foreground/40 hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          add
        </span>
      </button>
    </div>
  );
}
