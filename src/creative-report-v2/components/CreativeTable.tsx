/**
 * CreativeTable — Motion-pattern "graph + table" dense view (iter-2 W4).
 * Columns driven by the active column preset; sortable headers reuse the
 * same URL sort param the grid view uses, so switching layouts keeps the
 * same ordering.
 */
import { useMemo } from "react";
import { ArrowDown, ArrowUp, Image as ImageIcon, LayoutGrid, Video } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BucketChip } from "@/creative-report-v2/components/BucketChip";
import { ActionMenu } from "@/creative-report-v2/components/ActionMenu";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import { useCreativeActions } from "@/creative-report-v2/actions/useCreativeActions";
import { useColumnPresets, COLUMN_BY_KEY } from "@/creative-report-v2/lib/columns";
import { getBrand } from "@/mocks/shared/brands";
import { truncate, NAME_MAX } from "@/creative-report-v2/lib/format";
import type { SortField, SortSpec } from "@/creative-report-v2/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";
import { useReportWorkflowsEnabled } from "@/creative-report-v2/state/ReportBasePathContext";
import { useSyncStore } from "@/creative-report-v2/automations/sync/syncStore";
import { summariseCreative } from "@/creative-report-v2/automations/sync/selectors";
import type { CreativeSyncSummary } from "@/creative-report-v2/automations/sync/syncModel";
import { SyncBadge } from "@/creative-report-v2/automations/components/SyncBadge";

const FORMAT_ICON = { video: Video, static: ImageIcon, carousel: LayoutGrid } as const;

/** Only these columns map to an existing sort param — the rest render static. */
const SORTABLE: Partial<Record<string, SortField>> = {
  spend: "spend",
  roas: "roas",
  cpa: "cpa",
  ctr: "ctr",
};

export function CreativeTable({
  rollups,
  sort,
  onSort,
}: {
  rollups: CreativeRollup[];
  sort: SortSpec;
  onSort: (sort: SortSpec) => void;
}) {
  const { active } = useColumnPresets();
  const a = useCreativeActions();
  const workflowsEnabled = useReportWorkflowsEnabled();
  const syncState = useSyncStore();
  // Table-level call only — never per row. One Record built here covers every
  // visible row's badge, keyed by creative id.
  const syncByCreativeId = useMemo(() => {
    const map: Record<string, CreativeSyncSummary> = {};
    if (!workflowsEnabled) return map;
    for (const r of rollups) {
      map[r.creative.id] = summariseCreative(syncState, r.creative.id);
    }
    return map;
  }, [workflowsEnabled, syncState, rollups]);

  const headerClick = (key: string) => {
    const field = SORTABLE[key];
    if (!field) return;
    onSort({ field, dir: sort.field === field && sort.dir === "desc" ? "asc" : "desc" });
  };

  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[280px]">Creative</TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Bucket
                <WhyDot id="grid.bucket" />
              </span>
            </TableHead>
            {workflowsEnabled && <TableHead>Synced</TableHead>}
            {active.columns.map((key) => {
              const col = COLUMN_BY_KEY[key];
              const field = SORTABLE[key];
              const isSorted = field && sort.field === field;
              return (
                <TableHead
                  key={key}
                  className={field ? "cursor-pointer select-none text-right" : "text-right"}
                  onClick={() => headerClick(key)}
                >
                  <span className="inline-flex items-center gap-1 justify-end w-full">
                    {col.label}
                    <WhyDot id={`grid.metric.${key}`} />
                    {isSorted && (sort.dir === "desc" ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUp className="h-3 w-3" />
                    ))}
                  </span>
                </TableHead>
              );
            })}
            <TableHead className="w-[44px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rollups.map((r) => {
            const { creative, metrics, bucket } = r;
            const FmtIcon = FORMAT_ICON[creative.format];
            const name = truncate(creative.name, NAME_MAX);
            const brand = creative.brandId ? getBrand(creative.brandId) : undefined;
            return (
              <TableRow key={creative.id} className="cursor-pointer" onClick={() => a.view(creative.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FmtIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground" title={name.truncated ? creative.name : undefined}>
                        {name.text}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {brand ? `${brand.name} · ${creative.product}` : creative.product}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{bucket && <BucketChip bucket={bucket} size="xs" />}</TableCell>
                {workflowsEnabled && (
                  <TableCell>
                    <SyncBadge size="sm" summary={syncByCreativeId[creative.id]} />
                  </TableCell>
                )}
                {active.columns.map((key) => (
                  <TableCell key={key} className="text-right tabular-nums text-sm">
                    {COLUMN_BY_KEY[key].format(metrics)}
                  </TableCell>
                ))}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ActionMenu rollup={r} showView={false} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
