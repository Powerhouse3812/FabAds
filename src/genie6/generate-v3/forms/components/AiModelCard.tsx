import { useState } from "react";
import { Sparkles, ChevronDown, Mic, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TONE_OPTIONS, type Tone } from "./UGCConfig";

/**
 * AiModelCard — A-11.24 (Maalik's "Use AI model" inline integrated card).
 *
 * Renders only when the parent form has `output === "video"` AND
 * `useAiModel === true`. Shows model thumbnail + name + status dot, "Pick
 * model" popover trigger, and tone chip-row inline. Avatar + tone are ONE
 * unit, not two separated rows.
 *
 * The `Pick model` popover uses a static avatar list for v1. A real model
 * browser ships separately.
 */

export interface AiModel {
  id: string;
  name: string;
  /** "Indian · F · warm" — short meta line under the name. */
  meta: string;
  /** Optional thumbnail URL. If missing, gradient + glyph placeholder. */
  thumbnail?: string;
}

const MOCK_MODELS: AiModel[] = [
  { id: "model-aanya-25-pro", name: "Aanya · 25 · Pro", meta: "Indian · F · warm" },
  { id: "model-rohan-30-casual", name: "Rohan · 30 · Casual", meta: "Indian · M · grounded" },
  { id: "model-sara-22-cheerful", name: "Sara · 22 · Cheerful", meta: "Indian · F · upbeat" },
  { id: "model-kai-28-pro", name: "Kai · 28 · Pro", meta: "Global · M · clean" },
  { id: "model-mira-32-warm", name: "Mira · 32 · Warm", meta: "Global · F · soft" },
];

export interface AiModelCardProps {
  modelId: string | null;
  onModelChange: (id: string | null) => void;
  tone: Tone;
  onToneChange: (next: Tone) => void;
  /** Optional source label shown next to tone — "from {brand} KB" / "default". */
  toneSource?: string;
}

export function AiModelCard({
  modelId,
  onModelChange,
  tone,
  onToneChange,
  toneSource,
}: AiModelCardProps) {
  const selected = modelId
    ? MOCK_MODELS.find((m) => m.id === modelId) ?? null
    : null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5 space-y-2">
      {/* Top row — thumb + name + Pick model */}
      <div className="flex items-center gap-2.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-200/60 via-amber-300/40 to-amber-400/30 flex items-center justify-center">
          {selected?.thumbnail ? (
            <img
              src={selected.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Sparkles className="h-4 w-4 text-amber-700" />
          )}
          {selected && (
            <span
              aria-label="Model active"
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">
            {selected?.name ?? "System default"}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground truncate">
            {selected?.meta ?? "auto-pick at generation"}
          </p>
        </div>
        <ModelPicker selectedId={modelId} onChange={onModelChange} />
      </div>

      {/* Tone row */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-primary/15">
        <Mic className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
          tone
        </span>
        {toneSource && (
          <span className="font-mono text-[9px] text-muted-foreground/80 italic shrink-0">
            · {toneSource}
          </span>
        )}
        <div className="flex flex-wrap gap-1 ml-1">
          {TONE_OPTIONS.map((t) => {
            const active = tone === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onToneChange(t)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-[11px] transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function ModelPicker({
  selectedId,
  onChange,
}: {
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick AI model"
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors",
            "hover:border-primary/40 hover:text-foreground",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          )}
        >
          Pick model
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-64 p-1">
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            !selectedId
              ? "bg-primary/10 text-foreground"
              : "text-foreground hover:bg-muted/40",
          )}
        >
          <div className="h-6 w-6 shrink-0 rounded bg-muted/60 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="flex-1 truncate font-medium">System default</span>
          {!selectedId && <Check className="h-3 w-3 text-primary shrink-0" />}
        </button>
        {MOCK_MODELS.map((m) => {
          const active = selectedId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/40",
              )}
            >
              <div className="h-6 w-6 shrink-0 rounded bg-gradient-to-br from-amber-200/60 to-amber-400/30 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-tight">{m.name}</p>
                <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {m.meta}
                </p>
              </div>
              {active && <Check className="h-3 w-3 text-primary shrink-0" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
