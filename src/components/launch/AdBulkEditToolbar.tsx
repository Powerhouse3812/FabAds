import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AdBulkEditDialog } from "./AdBulkEditDialog";
import type { LaunchAd } from "@/hooks/use-launch-data";

interface AdBulkEditToolbarProps {
  selectedCount: number;
  ads: LaunchAd[];
  onApply: (fields: Record<string, any>) => void;
  onDuplicate?: (adId: string) => void;
  onDelete?: (adId: string) => void;
  onAddAd?: () => void;
  onClear?: () => void;
  applying?: boolean;
}

export function AdBulkEditToolbar({ selectedCount, ads, onApply, onDuplicate, onDelete, onAddAd, onClear, applying }: AdBulkEditToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-md border border-border">
      <span className="text-sm font-medium">{selectedCount} ad(s) selected</span>
      <Button size="sm" onClick={() => setOpen(true)}>Bulk Edit</Button>
      {onClear && (
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}

      <AdBulkEditDialog
        open={open}
        onOpenChange={setOpen}
        ads={ads}
        onApply={onApply}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddAd={onAddAd}
        applying={applying}
      />
    </div>
  );
}
