import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useInsightQueue } from "@/hooks/use-insight-queue";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void }

export function QueueDrawer({ open, onClose }: Props) {
  const { items, removeFromQueue, clearQueue } = useInsightQueue();

  const getAdInfo = (sourceAdId: string) => DUMMY_ADS.find((a) => a.id === sourceAdId);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-96 flex flex-col">
        <SheetHeader><SheetTitle>Queue ({items.length})</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Queue is empty</p>}
          {items.map((item: any) => {
            const ad = getAdInfo(item.source_ad_id);
            return (
              <div key={item.id} className="flex items-center gap-2 border border-border rounded-md p-2">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs shrink-0">
                  {ad?.pageName?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ad?.pageName ?? item.source_ad_id}</p>
                  <Select defaultValue={item.action_type}>
                    <SelectTrigger className="h-6 text-[10px] w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analyze">Video Analysis</SelectItem>
                      <SelectItem value="generate_similar">Generate Similar</SelectItem>
                      <SelectItem value="extract_hooks">Hook Extraction</SelectItem>
                      <SelectItem value="copy_analysis">Copy Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeFromQueue.mutate(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
        <SheetFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => clearQueue.mutate()} disabled={items.length === 0}>Clear Queue</Button>
          <Button size="sm" onClick={() => toast.info("Processing coming soon")} disabled={items.length === 0}>Process Queue</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
