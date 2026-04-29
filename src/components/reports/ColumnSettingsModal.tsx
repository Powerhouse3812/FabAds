import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@/lib/reports-dummy-data";

interface ColumnSettingsModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  columns: ColumnDef[];
  visibleKeys: string[];
  onVisibleKeysChange: (keys: string[]) => void;
}

export function ColumnSettingsModal({
  open, onOpenChange, columns, visibleKeys, onVisibleKeysChange,
}: ColumnSettingsModalProps) {
  const toggle = (key: string) => {
    onVisibleKeysChange(
      visibleKeys.includes(key)
        ? visibleKeys.filter((k) => k !== key)
        : [...visibleKeys, key]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {columns.map((col) => (
            <label key={col.key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={visibleKeys.includes(col.key)}
                onCheckedChange={() => toggle(col.key)}
              />
              <span className="text-sm text-foreground">{col.label}</span>
            </label>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onVisibleKeysChange(columns.map((c) => c.key))}
        >
          Reset to default
        </Button>
      </DialogContent>
    </Dialog>
  );
}
