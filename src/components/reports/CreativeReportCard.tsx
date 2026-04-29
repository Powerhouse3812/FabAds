import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, BarChart3, Rocket, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { ReportEntity } from "@/lib/reports-dummy-data";

interface CreativeReportCardProps {
  entity: ReportEntity;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (entity: ReportEntity) => void;
}

const statusColor: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

export function CreativeReportCard({ entity, selected, onSelect, onClick }: CreativeReportCardProps) {
  const c = entity.creative!;
  const m = entity.metrics;

  return (
    <div
      className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(entity)}
    >
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            checked={selected}
            onCheckedChange={(e) => { e; onSelect(entity.id); }}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-xs font-medium text-muted-foreground truncate">{c.adGroupName}</span>
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ${statusColor[entity.status]}`}>
          {entity.status}
        </Badge>
      </div>

      <div className="relative aspect-video bg-muted mx-3 rounded-md overflow-hidden">
        <img
          src={c.thumbnailUrl}
          alt={entity.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
          {c.adType}
        </Badge>
        {c.mediaCount > 1 && (
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
            {c.mediaCount} media
          </Badge>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.primaryText}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>${m.spend.toLocaleString()}</span>
          <span>{m.impressions.toLocaleString()} impr</span>
          <span>{m.clicks} clicks</span>
          <span>{m.ctr}% CTR</span>
          {c.videoEngagement && <span>{c.videoEngagement.hookRate}% hook</span>}
        </div>
      </div>

      <div className="px-3 pb-3 flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toast.success("Variation"); }}>
          <Layers className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toast.success("Analyse"); }}>
          <BarChart3 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toast.success("Launch"); }}>
          <Rocket className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onClick(entity)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Apply Rule")}>Apply Rule</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
