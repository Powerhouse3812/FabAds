import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";

interface AccountBulkToolbarProps {
  selectedCount: number;
  onBulkEdit: (field: string) => void;
  onBulkDelete: () => void;
  onClose: () => void;
}

const BULK_FIELDS = ["Page", "Pixel", "Strategy structure", "Website URL", "Display link", "URL tags"];

export function AccountBulkToolbar({ selectedCount, onBulkEdit, onBulkDelete, onClose }: AccountBulkToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-md">
      <span className="text-sm font-medium text-foreground mr-2">
        Edit {selectedCount < 10 ? `0${selectedCount}` : selectedCount} ad-account
      </span>
      {BULK_FIELDS.map((field) => (
        <Button
          key={field}
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onBulkEdit(field)}
        >
          {field}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="text-destructive border-destructive hover:bg-destructive/10 gap-1 text-xs ml-auto"
        onClick={onBulkDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
