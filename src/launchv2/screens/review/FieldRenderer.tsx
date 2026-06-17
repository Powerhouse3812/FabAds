/**
 * FieldRenderer — generic, kind-driven control for one SettingField in the
 * Review master-detail editor. Renders the *effective* value for a node
 * (override if present, else the inherited plan default) and routes edits back
 * through `onChange`. Pure presentation — the host owns override/inherit/reset
 * styling (lime left-border accent) around this control.
 *
 *   text / url   → Input
 *   textarea     → Textarea
 *   number/money → numeric Input (money shows a currency prefix)
 *   select       → shadcn Select
 *   toggle       → Switch
 *   segmented    → pill button row
 *   multitext    → list of inputs with "+ Add" up to field.max
 *   tags         → read-only chips (editing stubbed — demo)
 *   placements   → compact checkbox tree (mock)
 *   crop         → a button that opens the PlacementCropModal (host-supplied)
 *   readonly     → plain text
 */
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { currencySymbol } from "@/launch2/utils/time";
import type { SettingField } from "../../settingsRegistry";

export function FieldRenderer({
  field,
  value,
  currency,
  onChange,
  onOpenCrop,
}: {
  field: SettingField;
  value: unknown;
  currency: string;
  onChange: (next: unknown) => void;
  /** Crop fields call this to open the host-owned PlacementCropModal. */
  onOpenCrop?: () => void;
}) {
  switch (field.kind) {
    case "readonly":
      return (
        <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[13px] text-muted-foreground">
          {strOf(value) || "—"}
        </div>
      );

    case "text":
    case "url":
      return (
        <Input
          value={strOf(value)}
          type={field.kind === "url" ? "url" : "text"}
          placeholder={field.kind === "url" ? "https://…" : field.label}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-[13px]"
        />
      );

    case "textarea":
      return (
        <Textarea
          value={strOf(value)}
          placeholder={field.label}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none text-[13px]"
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={numOf(value)}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="h-9 font-mono tabular-nums text-[13px]"
        />
      );

    case "money":
      return (
        <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40">
          <span className="pl-2.5 pr-1 font-mono text-[13px] text-muted-foreground">
            {field.unitPrefix ?? currencySymbol(currency)}
          </span>
          <input
            type="number"
            value={numOf(value)}
            min={field.min}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-9 w-full bg-transparent pr-2.5 font-mono tabular-nums text-[13px] outline-none"
          />
        </div>
      );

    case "select":
      return (
        <Select value={strOf(value)} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-[13px]">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "toggle":
      return (
        <div className="flex h-9 items-center">
          <Switch checked={boolOf(value)} onCheckedChange={(c) => onChange(c)} />
        </div>
      );

    case "segmented":
      return (
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(field.options ?? []).map((o) => {
            const active = strOf(value) === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-primary text-[#121212] shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );

    case "multitext":
      return <MultiText field={field} value={value} onChange={onChange} />;

    case "tags":
      return <TagsField value={value} />;

    case "placements":
      return <PlacementsField value={value} onChange={onChange} />;

    case "crop":
      return (
        <button
          type="button"
          onClick={onOpenCrop}
          className="fab-focus w-full rounded-lg border border-border bg-background px-2.5 py-2 text-left text-[13px] text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          Customize media per placement…
        </button>
      );

    default:
      return (
        <div className="text-[13px] text-muted-foreground">{strOf(value) || "—"}</div>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  multitext                                                          */
/* ------------------------------------------------------------------ */

function MultiText({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  // Normalize to an array — the override stores the array; the plan default may be a single string.
  const items: string[] = Array.isArray(value)
    ? (value as string[])
    : value != null && value !== ""
      ? [String(value)]
      : [""];
  const max = field.max ?? 5;

  const setAt = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const removeAt = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [""]);
  };

  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={it}
            placeholder={i === 0 ? field.label : `${field.label} variation ${i + 1}`}
            onChange={(e) => setAt(i, e.target.value)}
            className="h-9 text-[13px]"
          />
          {items.length > 1 && (
            <button
              type="button"
              aria-label="Remove variation"
              onClick={() => removeAt(i)}
              className="fab-focus flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
        >
          <Plus className="h-3 w-3" /> Add variation
          <span className="font-mono text-muted-foreground">
            {items.length}/{max}
          </span>
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  tags (read-only chips — editing stubbed for the demo)              */
/* ------------------------------------------------------------------ */

function TagsField({ value }: { value: unknown }) {
  const tags: string[] = Array.isArray(value)
    ? (value as unknown[]).map(String)
    : value
      ? [String(value)]
      : [];
  if (tags.length === 0) {
    return <p className="text-[12px] italic text-muted-foreground">None set — inherits plan default.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-foreground"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  placements (compact mock checkbox tree)                            */
/* ------------------------------------------------------------------ */

const MOCK_PLACEMENTS: { group: string; items: string[] }[] = [
  { group: "Facebook", items: ["Feed", "Stories", "Reels", "In-stream"] },
  { group: "Instagram", items: ["Feed", "Stories", "Reels", "Explore"] },
  { group: "Audience Network", items: ["Native, banner & interstitial"] },
];

function PlacementsField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  // The override stores a flat set of "Group · Item" keys; default = all on.
  const selected: Set<string> = new Set(
    Array.isArray(value) ? (value as string[]) : [],
  );
  const isOn = (key: string) => (selected.size === 0 ? true : selected.has(key));
  const toggle = (key: string) => {
    // Seed from "all on" the first time the user touches a checkbox.
    const base =
      selected.size === 0
        ? new Set(MOCK_PLACEMENTS.flatMap((g) => g.items.map((i) => `${g.group} · ${i}`)))
        : new Set(selected);
    if (base.has(key)) base.delete(key);
    else base.add(key);
    onChange([...base]);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border p-2.5">
      {MOCK_PLACEMENTS.map((g) => (
        <div key={g.group} className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-muted-foreground/70">
            {g.group}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {g.items.map((it) => {
              const key = `${g.group} · ${it}`;
              const on = isOn(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-1.5 text-[12px] text-foreground"
                >
                  <span
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border transition-colors",
                      on ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {on && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path
                          d="M1 3.5L3.2 6L8 1"
                          stroke="#121212"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {it}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  coercion helpers                                                   */
/* ------------------------------------------------------------------ */

function strOf(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}
function numOf(v: unknown): number | "" {
  if (v === "" || v == null) return "";
  const n = Number(v);
  return Number.isNaN(n) ? "" : n;
}
function boolOf(v: unknown): boolean {
  return v === true || v === "true";
}
