import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import type { LaunchWithCounts } from "@/hooks/use-launch";

interface Props {
  launch: LaunchWithCounts | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LaunchDetailDrawer({ launch, open, onOpenChange }: Props) {
  if (!launch) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{launch.name}</SheetTitle>
          <SheetDescription>Read-only launch summary</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Row label="Platform">
            <Badge variant="outline">Facebook</Badge>
          </Row>
          <Row label="Status">
            <Badge>{launch.status.replace("_", " ")}</Badge>
          </Row>
          <Row label="Campaigns">{launch.campaign_count}</Row>
          <Row label="Adsets">{launch.adset_count}</Row>
          <Row label="Ads">{launch.ad_count}</Row>
          <Row label="Created">{format(new Date(launch.created_at), "PPpp")}</Row>
          <Row label="Last Updated">{format(new Date(launch.updated_at), "PPpp")}</Row>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}
