import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOffers } from "@/hooks/use-offers";
import { useOfferFolders, useAddFolderItemsSkipDuplicates } from "@/hooks/use-offer-folders";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { CreativeAsset } from "@/hooks/use-creative-assets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: CreativeAsset[];
}

export default function AddToFolderModal({ open, onOpenChange, assets }: Props) {
  const workspaceId = useWorkspace();
  const { data: offers } = useOffers(workspaceId);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const { data: folders } = useOfferFolders(selectedOfferId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const addItems = useAddFolderItemsSkipDuplicates();

  const handleConfirm = async () => {
    if (!selectedFolderId || !workspaceId || assets.length === 0) return;

    try {
      const result = await addItems.mutateAsync({
        folder_id: selectedFolderId,
        workspace_id: workspaceId,
        items: assets.map((a) => ({
          asset_id: a.id,
          media_type: a.file_type,
        })),
      });

      toast({
        title: "Add to Folder",
        description: `${result.added} added${result.skipped > 0 ? `, ${result.skipped} already existed` : ""}`,
      });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }

    setSelectedOfferId(null);
    setSelectedFolderId(null);
    onOpenChange(false);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setSelectedOfferId(null);
      setSelectedFolderId(null);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {assets.length} asset{assets.length !== 1 ? "s" : ""} to Folder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Select Campaign URL</Label>
            <Select
              value={selectedOfferId || ""}
              onValueChange={(v) => {
                setSelectedOfferId(v);
                setSelectedFolderId(null);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Choose a campaign URL..." /></SelectTrigger>
              <SelectContent>
                {(offers || []).map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOfferId && (
            <div className="space-y-1.5">
              <Label className="text-sm">Select Folder</Label>
              <Select
                value={selectedFolderId || ""}
                onValueChange={setSelectedFolderId}
              >
                <SelectTrigger><SelectValue placeholder="Choose a folder..." /></SelectTrigger>
                <SelectContent>
                  {(folders || []).length === 0 ? (
                    <SelectItem value="__none__" disabled>No folders in this campaign URL</SelectItem>
                  ) : (
                    (folders || []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.total_items || 0} items)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedFolderId || addItems.isPending}>
            {addItems.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Add to Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
