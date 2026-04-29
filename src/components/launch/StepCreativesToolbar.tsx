import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Grid3X3, Type } from "lucide-react";
import { EditStructureModal } from "./EditStructureModal";
import { EditNomenclatureModal } from "./EditNomenclatureModal";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface Props {
  launchData: LaunchFull;
  search: string;
  onSearchChange: (v: string) => void;
}

export function StepCreativesToolbar({ launchData, search, onSearchChange }: Props) {
  const [structureOpen, setStructureOpen] = useState(false);
  const [nomenclatureOpen, setNomenclatureOpen] = useState(false);

  const campCount = launchData.campaigns.length;
  const adsetCount = launchData.adsets.length;
  const adCount = launchData.ads.length;
  const hasNomenclature = !!(launchData.launch_config as any)?.nomenclature;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ads..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
          <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setStructureOpen(true)}>
          <Grid3X3 className="h-4 w-4" />
          Edit campaign structure [{campCount}:{adsetCount}:{adCount}]
        </Button>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setNomenclatureOpen(true)}>
          <Type className="h-4 w-4" />
          Edit nomenclature
        </Button>

        {hasNomenclature && (
          <Badge variant="secondary" className="text-xs">Custom nomenclature applied</Badge>
        )}
      </div>

      <EditStructureModal
        open={structureOpen}
        onOpenChange={setStructureOpen}
        launchData={launchData}
      />

      <EditNomenclatureModal
        open={nomenclatureOpen}
        onOpenChange={setNomenclatureOpen}
        launchData={launchData}
      />
    </>
  );
}
