import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X, ChevronDown, Plus, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EditEventPlacementModal } from "./bulk-modals/EditEventPlacementModal";
import { EditLocationModal } from "./bulk-modals/EditLocationModal";
import { EditDemographicModal } from "./bulk-modals/EditDemographicModal";
import { EditDeviceModal } from "./bulk-modals/EditDeviceModal";
import { EditBiddingBudgetModal } from "./bulk-modals/EditBiddingBudgetModal";
import { EditScheduleModal } from "./bulk-modals/EditScheduleModal";
import { SelectCustomAudienceModal } from "./bulk-modals/SelectCustomAudienceModal";

interface Props {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  onBulkUpdate: (data: any, applyToAll: boolean) => void;
}

export function AdGroupBulkToolbar({ selectedCount, totalCount, onClear, onBulkUpdate }: Props) {
  const [modal, setModal] = useState<string | null>(null);
  const comingSoon = () => toast({ title: "Coming soon" });

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-md flex-wrap">
        <span className="text-sm font-medium">{selectedCount} selected</span>
        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setModal("placement")}>Edit Event & Placement</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setModal("location")}>Edit Location</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setModal("demographic")}>Edit Demographic</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Edit more targeting <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setModal("device")}>Edit Device</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModal("bidding")}>Edit Bidding & Budget</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModal("schedule")}>Edit Schedule</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModal("audience")}>Custom Audiences</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={comingSoon}>
          <Plus className="h-3 w-3 mr-1" />Add New Ads
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={comingSoon}>
          <Filter className="h-3 w-3 mr-1" />Filter Table
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <EditEventPlacementModal open={modal === "placement"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
      <EditLocationModal open={modal === "location"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
      <EditDemographicModal open={modal === "demographic"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
      <EditDeviceModal open={modal === "device"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
      <EditBiddingBudgetModal open={modal === "bidding"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
      <EditScheduleModal open={modal === "schedule"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
      <SelectCustomAudienceModal open={modal === "audience"} onOpenChange={(o) => !o && setModal(null)} selectedCount={selectedCount} totalCount={totalCount} onSave={onBulkUpdate} />
    </>
  );
}
