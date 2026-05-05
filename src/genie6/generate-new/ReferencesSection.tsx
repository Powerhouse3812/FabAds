import { useState } from "react";
import { Paperclip, X, ImagePlus, Link as LinkIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PromptBarReference } from "@/components/PromptBar";

/**
 * ReferencesSection — block-level references view.
 *
 * A-11.12 redesign per Maalik's UI feedback ("Reference input is invisible
 * or ignorable"):
 *   - Was a header + chip row + "+ Add reference" button — easy to scan past.
 *   - Now: a clearer visual surface. When empty: full-width drop-zone-style
 *     card with cloud icon + dual-CTA (Upload / Paste URL). When populated:
 *     the same card but the chips appear inside the surface, with a
 *     persistent "+ Add" button.
 *   - Same `PromptBarReference[]` array still drives both this surface and
 *     the PromptBar's quick-attach popover.
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
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const submit = () => {
    const v = urlInput.trim();
    if (!v) return;
    onAddReference({ label: v, value: v });
    setUrlInput("");
    setOpen(false);
  };

  const empty = references.length === 0;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </h2>
        {!empty && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground">
            {references.length}
          </span>
        )}
      </div>

      {empty ? (
        <EmptyDropZone
          open={open}
          setOpen={setOpen}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          submit={submit}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <ul className="flex flex-wrap gap-1.5">
            {references.map((r, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs text-foreground"
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
            <AddReferencePopover
              open={open}
              setOpen={setOpen}
              urlInput={urlInput}
              setUrlInput={setUrlInput}
              submit={submit}
            />
          </ul>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function EmptyDropZone({
  open,
  setOpen,
  urlInput,
  setUrlInput,
  submit,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  urlInput: string;
  setUrlInput: (v: string) => void;
  submit: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed border-border bg-card/40 p-5",
        "flex flex-col items-center justify-center gap-2 text-center",
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UploadCloud className="h-4 w-4" />
      </div>
      <p className="text-sm text-foreground font-medium">Add references</p>
      <p className="text-xs text-muted-foreground max-w-md">
        Winners, mood boards, competitor ads. Anchor what you want — visual style, copy
        cadence, hook structure.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={() =>
            alert(
              "Upload-from-device wiring lands with the assets-storage backend (TODO).",
            )
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <ImagePlus className="h-3 w-3" />
          Upload from device
        </button>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <PasteUrlInline
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          submit={submit}
        />
      </div>
    </div>
  );
}

function PasteUrlInline({
  urlInput,
  setUrlInput,
  submit,
}: {
  urlInput: string;
  setUrlInput: (v: string) => void;
  submit: () => void;
}) {
  return (
    <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-2.5">
      <LinkIcon className="h-3 w-3 text-muted-foreground" />
      <input
        type="url"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Paste URL"
        aria-label="Reference URL"
        className="h-6 w-44 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!urlInput.trim()}
        className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground disabled:opacity-40"
      >
        Add
      </button>
    </div>
  );
}

function AddReferencePopover({
  open,
  setOpen,
  urlInput,
  setUrlInput,
  submit,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  urlInput: string;
  setUrlInput: (v: string) => void;
  submit: () => void;
}) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Add reference"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background/40 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          + Add
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
        <PasteUrlInline urlInput={urlInput} setUrlInput={setUrlInput} submit={submit} />
      </PopoverContent>
    </Popover>
  );
}
