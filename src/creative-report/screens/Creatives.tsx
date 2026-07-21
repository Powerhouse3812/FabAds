/**
 * Creatives — the creative-first grid (handoff §5.2).
 * Thumbnail-hero cards with kill/scale/iterate signals, group-by Concept/Angle,
 * inline sort, bucket filtering (from the Overview click-through), bulk select,
 * and a right-side detail drawer opened via ?creative=:id.
 */
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getDataset } from "@/data/generator";
import { getBrand } from "@/mocks/shared/brands";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { CreativeCard } from "@/creative-report/components/CreativeCard";
import { BulkActionBar } from "@/creative-report/components/BulkActionBar";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { CreativeDrawer } from "@/creative-report/drawer/CreativeDrawer";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { GridSkeleton } from "@/creative-report/components/states/Skeletons";
import { pluralize } from "@/creative-report/lib/format";
import {
  GROUP_BYS,
  SORT_FIELDS,
  type GroupBy,
  type SortField,
  P,
} from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const SORT_LABELS: Record<SortField, string> = {
  spend: "Spend",
  roas: "ROAS",
  cpa: "CPA",
  ctr: "CTR",
  fatigue: "Fatigue",
  recency: "Newest",
};

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "No grouping",
  concept: "Concept",
  angle: "Angle",
  brand: "Brand",
};

function sortValue(r: CreativeRollup, field: SortField): number {
  switch (field) {
    case "spend": return r.metrics.spend;
    case "roas": return r.metrics.roas;
    case "cpa": return r.metrics.cpa ?? Number.POSITIVE_INFINITY;
    case "ctr": return r.metrics.ctr;
    case "fatigue": return r.fatigue.freq7;
    case "recency": return -r.ageDays;
  }
}

export function Creatives() {
  const data = useCreativeData();
  const { view, setParam, setSort, clearFilters } = useReportParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const dataset = getDataset();

  const filtered = useMemo(() => {
    let rows = data.rollups;
    if (view.bucket) rows = rows.filter((r) => r.bucket === view.bucket);
    const dir = view.sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => (sortValue(a, view.sort.field) - sortValue(b, view.sort.field)) * dir);
  }, [data.rollups, view.bucket, view.sort]);

  const groups = useMemo(() => {
    if (view.group === "none") return [{ label: "", rows: filtered }];
    const map = new Map<string, CreativeRollup[]>();
    for (const r of filtered) {
      const angle = dataset.angleById[r.creative.angleId];
      let label: string;
      if (view.group === "brand") {
        label = getBrand(r.creative.brandId ?? "")?.name ?? "No brand linked";
      } else if (view.group === "angle") {
        label = angle?.name ?? "Ungrouped";
      } else {
        label = dataset.conceptById[angle?.conceptId ?? ""]?.name ?? "Ungrouped";
      }
      let arr = map.get(label);
      if (!arr) {
        arr = [];
        map.set(label, arr);
      }
      arr.push(r);
    }
    return [...map.entries()].map(([label, rows]) => ({ label, rows }));
  }, [filtered, view.group, dataset]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (data.status === "loading") return <GridSkeleton />;
  if (data.status === "empty") {
    return (
      <StateMessage
        variant="empty"
        title="No ad account connected"
        body="Connect an ad account to populate your creative grid."
        actionLabel="Connect ad account"
        onAction={() => {}}
      />
    );
  }
  if (data.status === "filtered-empty" || filtered.length === 0) {
    return (
      <StateMessage
        variant="filtered"
        title="No creatives match these filters"
        body="Nothing in the current filters. Clear them to see your full book of creatives."
      />
    );
  }

  return (
    <div className="p-6">
      {/* Inline toolbar: count · bucket filter · group · sort */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {pluralize(filtered.length, "creative")}
        </span>
        {view.bucket && (
          <button
            type="button"
            onClick={() => setParam(P.bucket, null)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs hover:bg-accent"
          >
            <BucketChip bucket={view.bucket} size="xs" />
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={view.group} onValueChange={(v) => setParam(P.group, v === "none" ? null : v)}>
            <SelectTrigger className="h-8 w-[150px] text-[13px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BYS.map((g) => (
                <SelectItem key={g} value={g}>
                  Group: {GROUP_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={view.sort.field}
            onValueChange={(v) => setSort({ field: v as SortField, dir: v === "cpa" ? "asc" : "desc" })}
          >
            <SelectTrigger className="h-8 w-[140px] text-[13px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map((f) => (
                <SelectItem key={f} value={f}>
                  Sort: {SORT_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid (grouped or flat) */}
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.label || "all"}>
            {group.label && (
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label} · {pluralize(group.rows.length, "creative")}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {group.rows.map((r) => (
                <CreativeCard
                  key={r.creative.id}
                  rollup={r}
                  selected={selected.has(r.creative.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <BulkActionBar selectedIds={[...selected]} onClear={() => setSelected(new Set())} />

      {/* Detail drawer (URL-driven) */}
      <CreativeDrawer
        rollup={view.creativeId ? data.rollups.find((r) => r.creative.id === view.creativeId) ?? null : null}
      />
    </div>
  );
}
