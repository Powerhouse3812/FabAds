/**
 * MetadataGrid — the drawer's dense fact grid, styled after Ref A's ad-detail
 * metadata block (Category / Ad creation / Active duration / CTA button / …):
 * small muted uppercase label above a larger, heavier value, tight vertical
 * rhythm, four-per-row so the block reads as one continuous grid rather than
 * stacked rows.
 *
 * Deliberately FACTS only — never a metric that already appears in KpiStrip
 * or FunnelStrip (spend/impressions/reach live there, not here) so no number
 * is shown twice in two different treatments. Every value is a real field
 * already folded onto CreativeRollup/Creative — nothing invented. Ref A's
 * "EU reach" / "BR reach" rows have no honest equivalent here (this dataset
 * has no per-region reach split) so they're simply not reproduced, rather
 * than padded out with fake fields to hit a row count.
 *
 * Renders as bare content (no self-wrapped card/border) — the drawer shell
 * owns whatever card/band wrapping surrounds this component.
 */
import { cn } from "@/lib/utils";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { getCategory } from "@/mocks/shared/categories";
import { FORMAT_LABELS, PLATFORM_LABELS } from "@/creative-report/lib/paramSchema";
import { fmtDate, pluralize, truncate } from "@/creative-report/lib/format";
import type { AdStatus } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const ACCOUNT_LABEL_MAX = 24;

type Tone = "success" | "warning";
const TONE_CLASS: Record<Tone, string> = {
  success: "text-success-text",
  warning: "text-warning-text",
};

/**
 * Combines status + age into ONE fact — Ref A's own "Active duration: Active,
 * since 5 days" field pairs the two, rather than spending two grid cells to
 * say overlapping things. Tinted with a semantic role token only when
 * there's one real verdict to tint — "Mixed" (surviving instances disagree)
 * never gets a colour, since it isn't a single true state.
 *
 * Age is a compact "12d" suffix, not "since 12 days" — this cell lives in a
 * dense 4-per-row grid, and at that column width "since 46 days" ellipsizes
 * mid-word ("Active, since 4…"), which reads as broken rather than tinted.
 * The full "Active, 46d" always fits; the tooltip still carries the exact
 * per-instance breakdown for "Mixed".
 */
function activeDurationCell(rollup: CreativeRollup): { value: string; title?: string; tone?: Tone } {
  const distinct = [...new Set(rollup.instances.map((i) => i.status))] as AdStatus[];
  const age = rollup.ageDays <= 0 ? "today" : `${rollup.ageDays}d`;

  if (distinct.length === 1) {
    const status = distinct[0];
    const label = status === "active" ? "Active" : status === "paused" ? "Paused" : "Archived";
    return {
      value: `${label}, ${age}`,
      tone: status === "active" ? "success" : status === "paused" ? "warning" : undefined,
    };
  }
  const counts = distinct
    .map((s) => {
      const label = s === "active" ? "Active" : s === "paused" ? "Paused" : "Archived";
      return `${label} (${rollup.instances.filter((i) => i.status === s).length})`;
    })
    .join(", ");
  return { value: `Mixed, ${age}`, title: counts };
}

function accountsLabel(rollup: CreativeRollup): { label: string; title?: string } {
  const names = rollup.accountIds.map((id) => ACCOUNT_BY_ID[id]?.name ?? id);
  if (names.length === 1) {
    const t = truncate(names[0], ACCOUNT_LABEL_MAX);
    return { label: t.text, title: t.truncated ? names[0] : undefined };
  }
  return { label: pluralize(names.length, "account"), title: names.join(", ") };
}

function Cell({
  label,
  value,
  title,
  tone,
}: {
  label: string;
  value: string;
  title?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-1" title={title ?? value}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={cn(
          "truncate text-[13px] font-semibold",
          tone ? TONE_CLASS[tone] : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function MetadataGrid({ rollup }: { rollup: CreativeRollup }) {
  const { creative } = rollup;
  const category = creative.categoryId ? getCategory(creative.categoryId) : undefined;
  const active = activeDurationCell(rollup);
  const accounts = accountsLabel(rollup);

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      <Cell label="Category" value={category?.name ?? "Uncategorized"} />
      <Cell label="Format" value={FORMAT_LABELS[creative.format]} />
      <Cell label="CTA button" value={creative.components.cta} />
      <Cell label="Active duration" value={active.value} title={active.title} tone={active.tone} />
      <Cell label="First seen" value={fmtDate(creative.createdAt)} />
      <Cell
        label="Platform"
        value={rollup.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
      />
      <Cell label="Account" value={accounts.label} title={accounts.title} />
      <Cell label="Placements" value={pluralize(rollup.instanceCount, "placement")} />
    </div>
  );
}
