import { X, Pause, Play, Archive, Copy, Pencil, Zap, Bookmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ReportEntity } from "@/lib/reports-dummy-data";

interface ReportsBulkBarProps {
  selected: ReportEntity[];
  onClearSelection: () => void;
  onExport: () => void;
}

export function ReportsBulkBar({ selected, onClearSelection, onExport }: ReportsBulkBarProps) {
  if (selected.length === 0) return null;

  const act = (label: string) => {
    toast.success(`${label} applied to ${selected.length} item(s)`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card shadow-lg">
      <div className="flex items-center gap-2 px-6 py-3">
        <span className="text-sm font-medium text-foreground">
          {selected.length} selected
        </span>
        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={() => act("Pause")}><Pause className="h-3.5 w-3.5 mr-1" />Pause</Button>
        <Button variant="ghost" size="sm" onClick={() => act("Activate")}><Play className="h-3.5 w-3.5 mr-1" />Activate</Button>
        <Button variant="ghost" size="sm" onClick={() => act("Archive")}><Archive className="h-3.5 w-3.5 mr-1" />Archive</Button>
        <Button variant="ghost" size="sm" onClick={() => act("Edit")}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => act("Duplicate")}><Copy className="h-3.5 w-3.5 mr-1" />Duplicate</Button>
        <Button variant="ghost" size="sm" onClick={() => act("Apply Rule")}><Zap className="h-3.5 w-3.5 mr-1" />Apply Rule</Button>
        <Button variant="ghost" size="sm" onClick={() => act("Add to Board")}><Bookmark className="h-3.5 w-3.5 mr-1" />Add to Board</Button>
        <Button variant="ghost" size="sm" onClick={onExport}><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
