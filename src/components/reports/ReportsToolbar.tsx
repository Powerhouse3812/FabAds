import { Search, RefreshCw, Download, Settings2, X, Pause, Play, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdEntityActions } from "@/components/reports/actions/useAdEntityActions";
import type {
  GroupingOption,
  LaunchFilterOptions,
  ReportEntity,
} from "@/lib/reports-dummy-data";

interface ReportsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  platforms: string[];
  onPlatformsChange: (v: string[]) => void;
  statuses: string[];
  onStatusesChange: (v: string[]) => void;
  groupingOptions: GroupingOption[];
  primaryGroupBy: string;
  onPrimaryGroupByChange: (v: string) => void;
  secondaryGroupBy: string;
  onSecondaryGroupByChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onColumnSettings: () => void;
  // ── Bulk Launch Distribution provenance filters (optional) ───────
  // When `launchFilters` is provided the toolbar renders Launch Strategy
  // chips + Launch Batch / Destination Page / Destination Account / Source Ad
  // dropdowns. Omitted on reports that have no provenance dimension.
  launchFilters?: LaunchFilterOptions;
  launchStrategies?: string[];
  onLaunchStrategiesChange?: (v: string[]) => void;
  launchBatchId?: string;
  onLaunchBatchIdChange?: (v: string) => void;
  destinationFbPageId?: string;
  onDestinationFbPageIdChange?: (v: string) => void;
  destinationAdAccountName?: string;
  onDestinationAdAccountNameChange?: (v: string) => void;
  sourceAdName?: string;
  onSourceAdNameChange?: (v: string) => void;
  // ── Selection / bulk-action props (optional) ────────────────────
  selectionCount?: number;
  onClearSelection?: () => void;
  onBulkExport?: () => void;
  /**
   * The actual selected rows, needed because bulk Pause / Activate / Archive
   * are real writes now and the store takes entities, not ids. Every report
   * page already derives exactly this list (`allFiltered.filter(selected)`),
   * so wiring it is one prop per page.
   *
   * Optional only so the page pass can land separately; when it is absent the
   * three status buttons render DISABLED rather than firing a fake success
   * toast — a dead control is honest, a lying one is not (NN/g #1, visibility
   * of system status).
   */
  selectedEntities?: ReportEntity[];
}

const ALL_PLATFORMS = ["Meta", "Google", "TikTok"];
const ALL_STATUSES = ["Active", "Paused", "Archived"];

function toggleChip(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// Sentinel for "no filter" in single-select dropdowns (Radix Select forbids "").
const ALL = "__all__";

export function ReportsToolbar({
  search, onSearchChange,
  platforms, onPlatformsChange,
  statuses, onStatusesChange,
  groupingOptions,
  primaryGroupBy, onPrimaryGroupByChange,
  secondaryGroupBy, onSecondaryGroupByChange,
  onRefresh, onExport, onColumnSettings,
  launchFilters,
  launchStrategies = [], onLaunchStrategiesChange,
  launchBatchId = ALL, onLaunchBatchIdChange,
  destinationFbPageId = ALL, onDestinationFbPageIdChange,
  destinationAdAccountName = ALL, onDestinationAdAccountNameChange,
  sourceAdName = ALL, onSourceAdNameChange,
  selectionCount = 0,
  onClearSelection,
  onBulkExport,
  selectedEntities,
}: ReportsToolbarProps) {
  // The provider owns the bulk confirm dialog (a bulk status change ALWAYS
  // confirms) and the undo toast, mounted once per surface.
  const { setStatus: bulkStatus } = useAdEntityActions();
  // No entities → nothing truthful to write. Disable instead of pretending.
  const canBulkStatus = selectedEntities !== undefined && selectedEntities.length > 0;

  return (
    <div className="relative overflow-hidden">
      {/* Default state */}
      <div className={`flex flex-wrap items-center gap-2 transition-all duration-200 ease-out${selectionCount > 0 ? " opacity-0 pointer-events-none absolute inset-0" : ""}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-56"
          />
        </div>

        <div className="flex items-center gap-1">
          {ALL_PLATFORMS.map((p) => (
            <Badge
              key={p}
              variant={platforms.includes(p) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => onPlatformsChange(toggleChip(platforms, p))}
            >
              {p}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {ALL_STATUSES.map((s) => (
            <Badge
              key={s}
              variant={statuses.includes(s) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => onStatusesChange(toggleChip(statuses, s))}
            >
              {s}
            </Badge>
          ))}
        </div>

        <Select value={primaryGroupBy} onValueChange={onPrimaryGroupByChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            {groupingOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {primaryGroupBy !== "none" && (
          <Select value={secondaryGroupBy} onValueChange={onSecondaryGroupByChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Then by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {groupingOptions
                .filter((o) => o.value !== primaryGroupBy)
                .map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {launchFilters && (
          <>
            {/* Launch Strategy — chips */}
            <div className="flex items-center gap-1">
              {launchFilters.strategies.map((s) => (
                <Badge
                  key={s.value}
                  variant={launchStrategies.includes(s.value) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => onLaunchStrategiesChange?.(toggleChip(launchStrategies, s.value))}
                >
                  {s.label}
                </Badge>
              ))}
            </div>

            {/* Launch Batch */}
            <Select value={launchBatchId} onValueChange={onLaunchBatchIdChange}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Launch Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All batches</SelectItem>
                {launchFilters.batches.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Destination Page */}
            <Select value={destinationFbPageId} onValueChange={onDestinationFbPageIdChange}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Destination Page" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All pages</SelectItem>
                {launchFilters.destinationPages.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Destination Account */}
            <Select value={destinationAdAccountName} onValueChange={onDestinationAdAccountNameChange}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Destination Account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All accounts</SelectItem>
                {launchFilters.destinationAccounts.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source Ad */}
            <Select value={sourceAdName} onValueChange={onSourceAdNameChange}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Source Ad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All source ads</SelectItem>
                {launchFilters.sourceAds.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onColumnSettings} title="Column settings">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selection state */}
      <div className={`flex items-center gap-2 py-2 transition-all duration-200 ease-out${selectionCount === 0 ? " opacity-0 pointer-events-none absolute inset-0 h-0" : ""}`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium shrink-0">{selectionCount} selected</span>
        <div className="flex-1" />
        <Button
          variant="ghost" size="sm"
          disabled={!canBulkStatus}
          onClick={() => selectedEntities && bulkStatus(selectedEntities, "Paused")}
        >
          <Pause className="h-3.5 w-3.5 mr-1" />Pause
        </Button>
        <Button
          variant="ghost" size="sm"
          disabled={!canBulkStatus}
          onClick={() => selectedEntities && bulkStatus(selectedEntities, "Active")}
        >
          <Play className="h-3.5 w-3.5 mr-1" />Activate
        </Button>
        <Button
          variant="ghost" size="sm"
          disabled={!canBulkStatus}
          onClick={() => selectedEntities && bulkStatus(selectedEntities, "Archived")}
        >
          <Archive className="h-3.5 w-3.5 mr-1" />Archive
        </Button>
        <Button variant="ghost" size="sm" onClick={onBulkExport ?? onExport}>
          <Download className="h-3.5 w-3.5 mr-1" />Export
        </Button>
      </div>
    </div>
  );
}
