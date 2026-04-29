import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { ReportEntity } from "@/lib/reports-dummy-data";

interface CreativeDetailDrawerProps {
  entity: ReportEntity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const statusColor: Record<string, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

export function CreativeDetailDrawer({ entity, open, onOpenChange }: CreativeDetailDrawerProps) {
  if (!entity || !entity.creative) return null;
  const c = entity.creative;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-lg">{entity.name}</SheetTitle>
            <Badge variant="outline" className={statusColor[entity.status]}>
              {entity.status}
            </Badge>
            <Badge variant="secondary">{c.adType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{c.adGroupName}</p>
        </SheetHeader>

        <div className="mt-4">
          <img
            src={c.thumbnailUrl}
            alt={entity.name}
            className="w-full aspect-video object-cover rounded-md"
          />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm text-foreground font-medium">{c.headline}</p>
          <p className="text-sm text-muted-foreground">{c.primaryText}</p>
          <p className="text-xs text-muted-foreground">{c.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-md border bg-card p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {c.videoEngagement && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-foreground mb-3">Video Engagement</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border bg-card p-3">
                <p className="text-xs text-muted-foreground">Hook Rate</p>
                <p className="text-lg font-semibold text-foreground">{c.videoEngagement.hookRate}%</p>
              </div>
              <div className="rounded-md border bg-card p-3">
                <p className="text-xs text-muted-foreground">Play Rate</p>
                <p className="text-lg font-semibold text-foreground">{c.videoEngagement.playRate}%</p>
              </div>
              <div className="rounded-md border bg-card p-3">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-lg font-semibold text-foreground">{c.videoEngagement.completionRate}%</p>
              </div>
              <div className="rounded-md border bg-card p-3">
                <p className="text-xs text-muted-foreground">Avg Play Time</p>
                <p className="text-lg font-semibold text-foreground">{c.videoEngagement.avgPlayTime}s</p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
