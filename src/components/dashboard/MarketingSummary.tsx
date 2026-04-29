import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketingStatusBreakdown } from "@/lib/dashboard-selectors";
import type { EntityLevel } from "@/lib/reports-dummy-data";

const TABS: { key: EntityLevel; label: string }[] = [
  { key: "campaign", label: "Campaigns" },
  { key: "adset", label: "Ad Sets" },
  { key: "ad", label: "Ads" },
];

interface MarketingSummaryProps {
  dateSeed: number;
}

export function MarketingSummary({ dateSeed }: MarketingSummaryProps) {
  const [tab, setTab] = useState<EntityLevel>("campaign");
  const data = marketingStatusBreakdown(dateSeed, tab);

  const segments: { label: string; count: number; color: string; dotColor: string }[] = [
    { label: "Active", count: data.active, color: "bg-emerald-500", dotColor: "bg-emerald-500" },
    { label: "Paused", count: data.paused, color: "bg-amber-500", dotColor: "bg-amber-500" },
    { label: "Archived", count: data.archived, color: "bg-muted-foreground/40", dotColor: "bg-muted-foreground/40" },
  ];

  const tabLabel = TABS.find((t) => t.key === tab)?.label.toLowerCase() ?? "";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-red-500 text-red-500">LIVE</Badge>
            <CardTitle className="text-sm font-semibold">Marketing summary</CardTitle>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex border rounded-lg p-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium rounded-md transition-colors",
                  tab === t.key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          <span className="font-semibold">{data.total}</span>{" "}
          <span className="text-muted-foreground">Total live {tabLabel}</span>
        </p>

        {/* Stacked bar */}
        <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]">
          {segments.map((seg) =>
            seg.count > 0 ? (
              <div
                key={seg.label}
                className={cn("transition-all", seg.color, 
                  seg.label === "Active" && "rounded-l-full",
                  seg.label === "Archived" && "rounded-r-full"
                )}
                style={{ width: `${(seg.count / data.total) * 100}%` }}
              />
            ) : null
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5 text-xs">
              <span className={cn("h-2 w-2 rounded-full", seg.dotColor)} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="font-medium">{seg.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
