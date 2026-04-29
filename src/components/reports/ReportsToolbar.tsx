import { Search, RefreshCw, Download, Settings2 } from "lucide-react";
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
import type { GroupingOption } from "@/lib/reports-dummy-data";

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
}

const ALL_PLATFORMS = ["Meta", "Google", "TikTok"];
const ALL_STATUSES = ["Active", "Paused", "Archived"];

function toggleChip(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function ReportsToolbar({
  search, onSearchChange,
  platforms, onPlatformsChange,
  statuses, onStatusesChange,
  groupingOptions,
  primaryGroupBy, onPrimaryGroupByChange,
  secondaryGroupBy, onSecondaryGroupByChange,
  onRefresh, onExport, onColumnSettings,
}: ReportsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
  );
}
