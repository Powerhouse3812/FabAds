import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

const MAX_ADS_PER_PAGE = 250;

interface DummyPage {
  id: string;
  name: string;
  pageId: string;
  adsCount: number;
  status: "active" | "full";
}

const dummyPages: DummyPage[] = [
  { id: "1", name: "Brand US — Main Page", pageId: "109283746501", adsCount: 210, status: "active" },
  { id: "2", name: "Brand US — Promo Page", pageId: "109283746502", adsCount: 250, status: "full" },
  { id: "3", name: "Brand EU — Primary", pageId: "209384756601", adsCount: 84, status: "active" },
  { id: "4", name: "Brand UK — Test Page", pageId: "309485867701", adsCount: 0, status: "active" },
];

export function RRMPagesTab() {
  const totalAds = dummyPages.reduce((s, p) => s + p.adsCount, 0);
  const totalCapacity = dummyPages.length * MAX_ADS_PER_PAGE;
  const utilPercent = totalCapacity > 0 ? Math.round((totalAds / totalCapacity) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Page Pool Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pool Utilization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Pool Utilization</span>
            <span className="font-medium">{totalAds} / {totalCapacity} ads ({utilPercent}%)</span>
          </div>
          <Progress value={utilPercent} className="h-2" />
        </div>

        {/* Pages Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>Page ID</TableHead>
                <TableHead>Ads</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyPages.map((page) => {
                const util = Math.round((page.adsCount / MAX_ADS_PER_PAGE) * 100);
                return (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium text-sm">{page.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{page.pageId}</TableCell>
                    <TableCell className="text-sm">{page.adsCount} / {MAX_ADS_PER_PAGE}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={util} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{util}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.status === "full" ? "destructive" : "default"} className="text-xs">
                        {page.status === "full" ? "Full" : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer note */}
        <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Max {MAX_ADS_PER_PAGE} ads per Facebook page. Auto-rotation to the next available page is <strong>coming soon</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
