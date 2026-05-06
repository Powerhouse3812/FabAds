import { useState } from "react";
import {
  UploadsPanel,
  type LocalUpload,
} from "@/genie6/generate-v3/forms/components/UploadsPanel";
import { cn } from "@/lib/utils";
import type { StudioV4Form } from "@/genie6/v4-shared/types";

/**
 * IterateConfigure — body of Step 4 when path = "iterate".
 *
 * Reference upload zone + the three "preserve" toggles + a variation
 * intensity segmented row. We reuse v3's UploadsPanel as the upload
 * surface so behaviour matches the rest of Studio. Selection of which
 * uploads count as "the reference" is handled inside the panel.
 */

export interface IterateConfigureProps {
  form: StudioV4Form;
  update: <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => void;
}

const INTENSITY_OPTIONS: {
  id: StudioV4Form["variationIntensity"];
  label: string;
  hint: string;
}[] = [
  { id: "subtle", label: "Subtle", hint: "Light touch — colors and copy edits" },
  { id: "medium", label: "Medium", hint: "Recompose layout, keep the spirit" },
  { id: "bold", label: "Bold", hint: "Reinterpret freely — fresh take" },
];

export function IterateConfigure({ form, update }: IterateConfigureProps) {
  // Local-only upload state for v1 — wizard doesn't track uploads on the
  // form yet. Later iterations will lift this into useStudioV4Form.
  const [uploads, setUploads] = useState<LocalUpload[]>([]);

  const handleAdd = (next: LocalUpload[]) =>
    setUploads((prev) => [...prev, ...next]);
  const handleToggle = (id: string) =>
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, selected: !u.selected } : u)),
    );
  const handleRemove = (id: string) =>
    setUploads((prev) => prev.filter((u) => u.id !== id));

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">
          Iterate on a reference
        </h1>
        <p className="text-sm text-muted-foreground">
          Drop the creative you want to riff on. Pick what to keep and how
          much room the AI gets.
        </p>
      </header>

      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Reference
        </p>
        <UploadsPanel
          uploads={uploads}
          onAdd={handleAdd}
          onToggleSelect={handleToggle}
          onRemove={handleRemove}
        />
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          What should we keep?
        </p>
        <div className="grid grid-cols-3 gap-2">
          <PreserveToggle
            label="Layout"
            sub="Composition + element placement"
            value={form.preserveLayout}
            onChange={(v) => update("preserveLayout", v)}
          />
          <PreserveToggle
            label="Colors"
            sub="Brand palette + tonality"
            value={form.preserveColors}
            onChange={(v) => update("preserveColors", v)}
          />
          <PreserveToggle
            label="Copy"
            sub="Headline + on-image text"
            value={form.preserveCopy}
            onChange={(v) => update("preserveCopy", v)}
          />
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Variation intensity
        </p>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITY_OPTIONS.map((opt) => {
            const active = form.variationIntensity === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => update("variationIntensity", opt.id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all",
                  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  active
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border bg-card/40 hover:border-primary/40",
                )}
              >
                <p className="text-[12px] font-semibold text-foreground">
                  {opt.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  {opt.hint}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function PreserveToggle({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        value
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border bg-card/40 hover:border-primary/40",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <p className="text-[12px] font-semibold text-foreground">{label}</p>
        <span
          className={cn(
            "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border",
            value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card",
          )}
        >
          {value && (
            <svg
              viewBox="0 0 12 12"
              className="h-2 w-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6.5l2.5 2.5L10 3" />
            </svg>
          )}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{sub}</p>
    </button>
  );
}
