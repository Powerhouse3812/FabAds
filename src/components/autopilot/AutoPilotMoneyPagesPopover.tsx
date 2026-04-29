import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Link2 } from "lucide-react";
import { DUMMY_PAGES } from "./autopilot-dummy-data";

interface Props {
  pageIds: string[];
  onChange: (pageIds: string[]) => void;
}

export function AutoPilotMoneyPagesPopover({ pageIds, onChange }: Props) {
  const available = DUMMY_PAGES.filter((p) => !pageIds.includes(p.id));

  const add = (id: string) => {
    onChange([...pageIds, id]);
  };

  const remove = (id: string) => onChange(pageIds.filter((p) => p !== id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          <Badge variant="secondary" className="px-1.5 text-xs">{pageIds.length}</Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <p className="text-sm font-medium mb-2">Pages</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
          {pageIds.length === 0 && <p className="text-xs text-muted-foreground">No pages assigned yet.</p>}
          {pageIds.map((id) => {
            const pg = DUMMY_PAGES.find((p) => p.id === id);
            if (!pg) return null;
            return (
              <div key={id} className="flex items-center gap-2 text-xs group">
                <span className="truncate flex-1 font-medium text-foreground">{pg.name}</span>
                <span className="text-muted-foreground shrink-0">{pg.activeAds} active · {pg.rejectedAds} rejected</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
        {available.length > 0 && (
          <Select onValueChange={add}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Add a page…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((pg) => (
                <SelectItem key={pg.id} value={pg.id}>
                  <div className="flex items-center gap-2">
                    <span>{pg.name}</span>
                    <span className="text-muted-foreground text-[10px]">{pg.activeAds} active · {pg.rejectedAds} rejected</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PopoverContent>
    </Popover>
  );
}
