/**
 * BriefBlock — one editable brief section (Hook / Body / CTA / Visual
 * direction / Offer) for the Brief Builder (P5 rollups & loop).
 *
 * Reference-first means honest about the source: the pre-fill is always
 * captioned with which past creative it came from, so a buyer never mistakes
 * a borrowed line for their own original copy — they're expected to rewrite
 * it, not ship it as-is.
 */
import { Textarea } from "@/components/ui/textarea";

export function BriefBlock({
  label,
  value,
  onChange,
  fromLabel,
  hint,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** e.g. "From: Bluestone_Necklace_Video_003" */
  fromLabel: string;
  /** Optional "also seen in" line surfaced when 2-3 references are picked. */
  hint?: string;
  rows?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{fromLabel}</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-2 resize-none text-sm"
      />
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
