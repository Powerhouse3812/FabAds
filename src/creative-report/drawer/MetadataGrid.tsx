/**
 * MetadataGrid — the 1100px overlay's top-right "small uppercase label over
 * value" fact grid, styled after Ref A's ad-detail metadata block (Category /
 * Ad creation / Active duration / CTA button / …).
 *
 * Deliberately FACTS only — never a metric that already appears in KpiStrip
 * or FunnelStrip (spend/impressions/reach live there, not here) so no number
 * is shown twice in two different treatments. Every value is a real field
 * already folded onto CreativeRollup/Creative — nothing invented.
 */
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { getCategory } from "@/mocks/shared/categories";
import { FORMAT_LABELS, PLATFORM_LABELS, STATUS_LABELS } from "@/creative-report/lib/paramSchema";
import { fmtDate, pluralize, truncate } from "@/creative-report/lib/format";
import type { AdStatus } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const ACCOUNT_LABEL_MAX = 24;

/** One overall status from the surviving instances — "Mixed" (with a
 *  tooltip) when they disagree, never a fabricated single verdict. */
function summarizeStatus(rollup: CreativeRollup): { label: string; title?: string } {
  const distinct = [...new Set(rollup.instances.map((i) => i.status))] as AdStatus[];
  if (distinct.length === 1) return { label: STATUS_LABELS[distinct[0]] };
  const counts = distinct
    .map((s) => `${STATUS_LABELS[s]} (${rollup.instances.filter((i) => i.status === s).length})`)
    .join(", ");
  return { label: "Mixed", title: counts };
}

function accountsLabel(rollup: CreativeRollup): { label: string; title?: string } {
  const names = rollup.accountIds.map((id) => ACCOUNT_BY_ID[id]?.name ?? id);
  if (names.length === 1) {
    const t = truncate(names[0], ACCOUNT_LABEL_MAX);
    return { label: t.text, title: t.truncated ? names[0] : undefined };
  }
  return { label: pluralize(names.length, "account"), title: names.join(", ") };
}

function Cell({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex flex-col gap-0.5" title={title}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function MetadataGrid({ rollup }: { rollup: CreativeRollup }) {
  const { creative } = rollup;
  const category = creative.categoryId ? getCategory(creative.categoryId) : undefined;
  const status = summarizeStatus(rollup);
  const accounts = accountsLabel(rollup);

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Cell label="Category" value={category?.name ?? "Uncategorized"} />
        <Cell label="Format" value={FORMAT_LABELS[creative.format]} />
        <Cell label="CTA button" value={creative.components.cta} />
        <Cell label="Status" value={status.label} title={status.title} />
        <Cell label="First seen" value={fmtDate(creative.createdAt)} />
        <Cell label="Active duration" value={pluralize(rollup.ageDays, "day")} />
        <Cell
          label="Platform"
          value={rollup.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
        />
        <Cell label="Account" value={accounts.label} title={accounts.title} />
      </div>
    </div>
  );
}
