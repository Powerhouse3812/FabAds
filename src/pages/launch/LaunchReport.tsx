import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ReportsTable } from "@/components/reports/ReportsTable";
import type { GroupedRow } from "@/hooks/use-reports-data";
import type { ColumnDef, ReportEntity, ReportMetrics } from "@/lib/reports-dummy-data";
import { useLaunchReport, type CreatedAdRow, type SourceAdGroup } from "@/hooks/use-launch-report";
import type { LaunchStrategy } from "@/lib/launch-distribution";

const STRATEGY_LABEL: Record<LaunchStrategy, string> = {
  fill_first: "Fill First",
  equal: "Equal Distribution",
  duplicate: "Duplicate to Each",
};

const statusBadge: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
};

function fmtMoney(currency: string, v: number | null): string {
  if (v == null) return "—";
  return `${currency} ${v.toLocaleString()}`;
}

// Empty metrics object so created-ad rows satisfy ReportEntity. We never read
// the standard performance metrics in this report — budget lives in custom
// ColumnDefs that read budget keys off the same metrics bag via cast.
const ZERO_METRICS: ReportMetrics = {
  spend: 0, revenue: 0, roas: 0, impressions: 0, clicks: 0,
  ctr: 0, cpa: 0, cpc: 0, cpm: 0, conversions: 0, margin: 0, marginPercent: 0,
};

// ── Source-Ads view: map domain types -> ReportsTable's GroupedRow ────────────
// We reuse ReportsTable's hierarchical grouped/expand rendering (chevron +
// expanded Set<string>) by shaping created ads as ReportEntity leaves and each
// source ad (Duplicate => copy_group_id) as a GroupedRow.

function createdAdToEntity(row: CreatedAdRow): ReportEntity {
  return {
    id: row.id,
    name: `${row.destination_account_name} · ${row.destination_page_name}`,
    parentId: row.source_ad_id,
    level: "ad",
    status: row.status,
    platform: "Meta",
    country: "—",
    metrics: {
      ...ZERO_METRICS,
      // budget fields read by the custom ColumnDefs below.
      budget_before: row.budget_before ?? 0,
      budget_after: row.budget_after ?? 0,
      budget_multiplier: row.budget_multiplier,
    } as unknown as ReportMetrics,
  };
}

function sourceGroupToRow(group: SourceAdGroup): GroupedRow {
  const children = group.children.map(createdAdToEntity);
  const before = group.children.reduce((s, c) => s + (c.budget_before ?? 0), 0);
  const after = group.children.reduce((s, c) => s + (c.budget_after ?? 0), 0);
  return {
    isGroup: true,
    groupKey: group.copy_group_id || group.source_ad_id,
    groupLabel: group.source_ad_name,
    depth: 0,
    count: group.created_count,
    metrics: {
      ...ZERO_METRICS,
      budget_before: before,
      budget_after: after,
      budget_multiplier: 0,
    } as unknown as ReportMetrics,
    children,
  };
}

const SOURCE_VIEW_COLUMNS: ColumnDef[] = [
  { key: "budget_before", label: "Budget Before", numeric: true, format: (v) => v.toLocaleString() },
  { key: "budget_after", label: "Budget After", numeric: true, format: (v) => v.toLocaleString() },
  { key: "budget_multiplier", label: "×", numeric: true, format: (v) => (v ? `${v}×` : "—") },
];

export default function LaunchReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useLaunchReport(id);

  // ReportsTable is a controlled component — supply no-op-ish state for the
  // pieces we don't use in the read-only Source-Ads view.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groupedRows = useMemo<GroupedRow[]>(
    () => (data ? data.sourceGroups.map(sourceGroupToRow) : []),
    [data],
  );

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-40 w-full rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  const { summary, createdAds } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/launch")} title="Back to Launch History">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Launch Report</h1>
          <p className="text-xs text-muted-foreground">Distribution outcome for this launch batch</p>
        </div>
        {summary.isDemo && (
          <Badge variant="outline" className="ml-2 text-[10px]">Demo data</Badge>
        )}
      </div>

      {/* Summary card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Summary
            <Badge variant="default">{STRATEGY_LABEL[summary.strategy]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Selected → Created">
              <span className="text-lg font-semibold text-foreground">
                {summary.selectedAdsCount} → {summary.createdAdsCount}
              </span>
            </Stat>
            <Stat label="Target Pairs">
              <span className="text-lg font-semibold text-foreground">{summary.targetPairsCount}</span>
            </Stat>
            <Stat label="Unique Pages">
              <span className="text-lg font-semibold text-foreground">{summary.uniquePagesCount}</span>
            </Stat>
            <Stat label="Active">
              <span className="text-lg font-semibold text-chart-1">{summary.activeCount}</span>
            </Stat>
            <Stat label="Paused">
              <span className="text-lg font-semibold text-muted-foreground">{summary.pausedCount}</span>
            </Stat>
          </div>

          {/* Per-currency budget before -> after + multiplier */}
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Budget by currency</div>
            <div className="space-y-1">
              {summary.perCurrencyBudget.length === 0 ? (
                <span className="text-sm text-muted-foreground">No budgeted ad sets</span>
              ) : (
                summary.perCurrencyBudget.map((b) => (
                  <div key={b.currency} className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground w-12">{b.currency}</span>
                    <span className="text-muted-foreground">{fmtMoney(b.currency, b.before)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-foreground">{fmtMoney(b.currency, b.after)}</span>
                    <Badge variant="secondary" className="text-[10px]">{b.multiplier}×</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Created Ads (flat) + Source Ads (grouped) */}
      <Tabs defaultValue="created">
        <TabsList>
          <TabsTrigger value="created">Created Ads View</TabsTrigger>
          <TabsTrigger value="source">Source Ads View</TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[180px]">Created Ad</TableHead>
                    <TableHead>Source Ad</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Destination Page</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Budget Before</TableHead>
                    <TableHead className="text-right">Budget After</TableHead>
                    <TableHead className="text-right w-16">×</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {createdAds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No created ads
                      </TableCell>
                    </TableRow>
                  ) : (
                    createdAds.map((ad) => (
                      <TableRow key={ad.id} className="h-10">
                        <TableCell className="text-sm font-medium text-foreground">{ad.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ad.source_ad_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusBadge[ad.status]}`}>{ad.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ad.destination_page_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ad.destination_account_name}</TableCell>
                        <TableCell className="text-right text-sm">{fmtMoney(ad.currency, ad.budget_before)}</TableCell>
                        <TableCell className="text-right text-sm">{fmtMoney(ad.currency, ad.budget_after)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {ad.budget_multiplier > 1 ? `${ad.budget_multiplier}×` : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="source">
          {/* Reuse ReportsTable's grouped/expand rendering. Each group is a
              source ad (Duplicate => keyed by copy_group_id); leaves are the
              created ads. Read-only: sort/drilldown/kebab are inert here. */}
          <ReportsTable
            rows={groupedRows}
            columns={SOURCE_VIEW_COLUMNS}
            visibleColumns={SOURCE_VIEW_COLUMNS.map((c) => c.key)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onRowClick={() => {}}
            sortColumn="budget_after"
            sortDirection="desc"
            onSortChange={() => {}}
            totalCount={createdAds.length}
            page={1}
            pageSize={createdAds.length || 1}
            onPageChange={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
