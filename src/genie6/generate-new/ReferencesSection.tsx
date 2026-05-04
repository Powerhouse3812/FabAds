import { useState } from "react";
import { Paperclip, X, ImagePlus, Link as LinkIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PromptBarReference } from "@/components/PromptBar";

/**
 * ReferencesSection — block-level references view (A-11.3).
 *
 * Per Form Specs §1: "Refs icon in floating prompt bar = quick attach;
 * section here = managed view of attached refs as chips."
 *
 * The same `PromptBarReference[]` array drives both surfaces:
 *   - PromptBar's RefsPopover = quick-attach (popover on the icon)
 *   - This block-level section = managed view (visible chips you can scan)
 *
 * Renders:
 *   - Section header with count
 *   - Chips for each attached reference (label + × remove button)
 *   - "Add reference" button (popover with URL input + upload-from-device stub)
 *
 * Caller-driven state — passes references array + add/remove handlers.
 */

export interface ReferencesSectionProps {
  references: PromptBarReference[];
  onAddReference: (ref: PromptBarReference) => void;
  onRemoveReference: (index: number) => void;
  /** Optional override label */
  label?: string;
}

export function ReferencesSection({
  references,
  onAddReference,
  onRemoveReference,
  label = "References",
}: ReferencesSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </h2>
          {references.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
              {references.length}
            </span>
          )}
        </div>
        <AddReferenceButton onAdd={onAddReference} />
      </div>

      {references.length === 0 ? (
        <p className="text-xs text-muted-foreground/80 italic">
          No references attached. Add winners, mood boards, or competitor ads to anchor the generation.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {references.map((r, i) => (
            <li
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-xs text-foreground"
            >
              <LinkIcon className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[200px] truncate">{r.label}</span>
              <button
                type="button"
                onClick={() => onRemoveReference(i)}
                aria-label={`Remove reference ${r.label}`}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function AddReferenceButton({ onAdd }: { onAdd: (ref: PromptBarReference) => void }) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const submit = () => {
    const v = urlInput.trim();
    if (!v) return;
    onAdd({ label: v, value: v });
    setUrlInput("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Add reference"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1",
            "text-[11px] font-medium text-muted-foreground",
            "hover:border-primary/40 hover:text-foreground hover:bg-card transition-colors",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          )}
        >
          <Plus className="h-3 w-3" />
          Add reference
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Reference media
        </p>
        <button
          type="button"
          onClick={() =>
            alert(
              "Upload-from-device wiring lands with the assets-storage backend (TODO).",
            )
          }
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Upload from device
        </button>
        <div className="flex items-center gap-1.5">
          <LinkIcon className="h-3 w-3 text-muted-foreground" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Paste URL"
            aria-label="Reference URL"
            className="h-7 flex-1 rounded-md border border-border bg-card px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!urlInput.trim()}
            className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
