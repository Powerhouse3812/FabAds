/**
 * Creative Report 2.0 — persistent top filter bar.
 * Rendered by the module layout on every route; daily filters (date range,
 * account, status, platform, format) are always visible, never tucked into
 * a drawer. Every control reads/writes through useReportParams so the URL
 * stays the single source of truth.
 */
import * as React from "react";
import { Calendar as CalendarIcon, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AD_ACCOUNTS, ACCOUNT_BY_ID } from "@/data/accounts";
import { getBrand } from "@/mocks/shared/brands";
import { getDataset } from "@/data/generator";
import {
  AD_STATUSES,
  ADVANCED_FILTERS,
  FORMATS,
  FORMAT_LABELS,
  P,
  PLATFORMS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  toDateParam,
} from "@/creative-report-v2/lib/paramSchema";
import { useReportParams } from "@/creative-report-v2/hooks/useReportParams";
import { AddFilterPopover } from "@/creative-report-v2/components/AddFilterPopover";

const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function presetRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toDateParam(from), to: toDateParam(to) };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/** "Base" for 0 selected, the single label for 1, "Base · N" for N>1. */
function multiLabel(base: string, selected: string[], labels: Record<string, string>): string {
  if (selected.length === 0) return base;
  if (selected.length === 1) return labels[selected[0]] ?? selected[0];
  return `${base} · ${selected.length}`;
}

function accountsLabel(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "All accounts";
  if (selectedIds.length === 1) return ACCOUNT_BY_ID[selectedIds[0]]?.name ?? selectedIds[0];
  return `${selectedIds.length} accounts`;
}

function brandsLabel(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "All brands";
  if (selectedIds.length === 1) return getBrand(selectedIds[0])?.name ?? selectedIds[0];
  return `${selectedIds.length} brands`;
}

const triggerClass = "h-8 text-[13px] font-medium";
const activeTriggerClass = "border-primary/40 text-foreground";

export function FilterBar({
  searchPlaceholder,
  trailing,
}: {
  searchPlaceholder?: string;
  trailing?: React.ReactNode;
}) {
  const { filters, view, setParam, setParams, toggleCsvValue, clearFilters, activeFilterCount } =
    useReportParams();

  const brandIds = React.useMemo(() => {
    const dataset = getDataset();
    return [...new Set(dataset.creatives.map((c) => c.brandId).filter(Boolean))] as string[];
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2">
      {/* Search — leads the row, matching ReportsToolbar / InsightsFilterBar /
          Catalogue. Filters follow it; only `trailing` utilities sit right. */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={view.q}
          onChange={(e) => setParam(P.q, e.target.value || null)}
          placeholder={searchPlaceholder ?? "Search creatives…"}
          className="h-8 w-56 pl-8 text-[13px]"
        />
      </div>

      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn(triggerClass, "gap-1.5")}>
            <CalendarIcon className="h-4 w-4" />
            {formatShortDate(filters.from)} – {formatShortDate(filters.to)}
            {filters.compareEnabled && (
              <span className="text-muted-foreground">vs prev</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <div className="space-y-1">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => {
                  const range = presetRange(preset.days);
                  setParams({ [P.from]: range.from, [P.to]: range.to });
                }}
                className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent hover:text-accent-foreground"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-muted-foreground">From</span>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => setParam(P.from, e.target.value || null)}
                className="h-8 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-muted-foreground">To</span>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => setParam(P.to, e.target.value || null)}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-[13px] text-muted-foreground">Compare vs previous period</span>
            <Switch
              checked={filters.compareEnabled}
              onCheckedChange={(checked) => setParam(P.compare, checked ? null : "none")}
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(triggerClass, filters.accounts.length > 0 && activeTriggerClass)}
          >
            {accountsLabel(filters.accounts)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {AD_ACCOUNTS.map((account) => (
            <DropdownMenuCheckboxItem
              key={account.id}
              checked={filters.accounts.includes(account.id)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggleCsvValue(P.accounts, account.id)}
            >
              {account.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Brand */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(triggerClass, filters.brands.length > 0 && activeTriggerClass)}
          >
            {brandsLabel(filters.brands)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {brandIds.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={filters.brands.includes(id)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggleCsvValue(P.brand, id)}
            >
              {getBrand(id)?.name ?? id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(triggerClass, filters.statuses.length > 0 && activeTriggerClass)}
          >
            {multiLabel("Status", filters.statuses, STATUS_LABELS)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {AD_STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={filters.statuses.includes(status)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggleCsvValue(P.status, status)}
            >
              {STATUS_LABELS[status]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Platform */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(triggerClass, filters.platforms.length > 0 && activeTriggerClass)}
          >
            {multiLabel("Platform", filters.platforms, PLATFORM_LABELS)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {PLATFORMS.map((platform) => (
            <DropdownMenuCheckboxItem
              key={platform}
              checked={filters.platforms.includes(platform)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggleCsvValue(P.platform, platform)}
            >
              {PLATFORM_LABELS[platform]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Format */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(triggerClass, filters.formats.length > 0 && activeTriggerClass)}
          >
            {multiLabel("Format", filters.formats, FORMAT_LABELS)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {FORMATS.map((format) => (
            <DropdownMenuCheckboxItem
              key={format}
              checked={filters.formats.includes(format)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => toggleCsvValue(P.format, format)}
            >
              {FORMAT_LABELS[format]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced filters */}
      <AddFilterPopover />

      {ADVANCED_FILTERS.flatMap((def) => {
        const values = (filters as unknown as Record<string, string[]>)[def.key] ?? [];
        return values.map((value) => (
          <Badge
            key={`${def.key}-${value}`}
            variant="outline"
            className="h-8 gap-1 rounded-md border-primary/40 text-[13px] font-normal text-foreground"
          >
            {def.label}: {value}
            <button
              type="button"
              onClick={() => toggleCsvValue(P[def.key as keyof typeof P], value)}
              className="ml-0.5 rounded-full hover:bg-muted"
              aria-label={`Remove ${def.label} filter: ${value}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ));
      })}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-[13px] font-medium text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}
