import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pause, Play, Archive, Copy, Zap, ExternalLink, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import type { ReportEntity } from "@/lib/reports-dummy-data";

interface ReportDetailDrawerProps {
  entity: ReportEntity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddAdset?: (entity: ReportEntity) => void;
  onAddAd?: (entity: ReportEntity) => void;
}

const statusColor: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

export function ReportDetailDrawer({ entity, open, onOpenChange, onAddAdset, onAddAd }: ReportDetailDrawerProps) {
  if (!entity) return null;

  const m = entity.metrics;
  const metrics = [
    { label: "Spend", value: `$${m.spend.toLocaleString()}` },
    { label: "Revenue", value: `$${m.revenue.toLocaleString()}` },
    { label: "ROAS", value: m.roas.toFixed(2) },
    { label: "Impressions", value: m.impressions.toLocaleString() },
    { label: "Clicks", value: m.clicks.toLocaleString() },
    { label: "CTR", value: `${m.ctr}%` },
    { label: "CPA", value: `$${m.cpa}` },
    { label: "Margin", value: `$${m.margin.toLocaleString()}` },
  ];

  const act = (label: string) => toast.success(`${label} applied to ${entity.name}`);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-lg">{entity.name}</SheetTitle>
            <Badge variant="outline" className={statusColor[entity.status]}>
              {entity.status}
            </Badge>
            <Badge variant="secondary">{entity.platform}</Badge>
          </div>
          {entity.parentName && (
            <p className="text-sm text-muted-foreground mt-1">{entity.parentName}</p>
          )}
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {onAddAdset && (
            <Button variant="default" size="sm" onClick={() => { onOpenChange(false); onAddAdset(entity); }}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" />Add Ad Set
            </Button>
          )}
          {onAddAd && (
            <Button variant="default" size="sm" onClick={() => { onOpenChange(false); onAddAd(entity); }}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" />Add Ad
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => act("Pause")}><Pause className="h-3.5 w-3.5 mr-1" />Pause</Button>
          <Button variant="outline" size="sm" onClick={() => act("Activate")}><Play className="h-3.5 w-3.5 mr-1" />Activate</Button>
          <Button variant="outline" size="sm" onClick={() => act("Archive")}><Archive className="h-3.5 w-3.5 mr-1" />Archive</Button>
          <Button variant="outline" size="sm" onClick={() => act("Duplicate")}><Copy className="h-3.5 w-3.5 mr-1" />Duplicate</Button>
          <Button variant="outline" size="sm" onClick={() => act("Apply Rule")}><Zap className="h-3.5 w-3.5 mr-1" />Apply Rule</Button>
          <Button variant="outline" size="sm" onClick={() => act("Open in New Tab")}><ExternalLink className="h-3.5 w-3.5 mr-1" />New Tab</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
