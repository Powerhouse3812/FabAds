import { useState, useRef } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  useOfferFolderItems, useAddFolderItems, useRemoveFolderItem, useUpdateOfferFolder,
} from "@/hooks/use-offer-folders";
import { useUploadCreativeAsset, type CreativeAsset } from "@/hooks/use-creative-assets";
import CreativeLibraryModal from "./CreativeLibraryModal";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FolderOpen, Trash2, Image, Video, Pencil, Check, X, Info, Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  folderName: string;
  folderDescription?: string;
  offerId: string;
  offerName: string;
  workspaceId: string;
}

export default function ManageFolderDrawer({
  open, onOpenChange, folderId, folderName, folderDescription = "", offerId, offerName, workspaceId,
}: Props) {
  const { data: items, isLoading } = useOfferFolderItems(folderId);
  const addItems = useAddFolderItems();
  const removeItem = useRemoveFolderItem();
  const updateFolder = useUpdateOfferFolder();
  const { upload, uploading, progress } = useUploadCreativeAsset();
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(folderName);

  // Description editing
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(folderDescription);

  // Sync props when drawer opens with new folder
  useState(() => {
    setNameValue(folderName);
    setDescValue(folderDescription);
  });

  const isDuplicateError = (msg: string) =>
    msg.includes("23505") || msg.includes("duplicate") || msg.includes("already in this folder");

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length || !folderId) return;
    try {
      const uploaded = await upload({ files: Array.from(fileList) });
      await addItems.mutateAsync({
        folder_id: folderId,
        workspace_id: workspaceId,
        items: uploaded.map((a: CreativeAsset) => ({
          asset_id: a.id,
          media_type: a.file_type,
          metadata: { file_name: a.file_name, url: a.url },
        })),
      });
      toast({ title: `${uploaded.length} file(s) added` });
    } catch (err: any) {
      const msg = err.message || "";
      if (isDuplicateError(msg)) {
        toast({ title: "Asset already in this folder", description: "Some assets were already linked.", variant: "destructive" });
      } else {
        toast({ title: "Upload failed", description: msg, variant: "destructive" });
      }
    }
  };

  const handleLibrarySelect = async (selected: CreativeAsset[]) => {
    if (!folderId) return;
    try {
      await addItems.mutateAsync({
        folder_id: folderId,
        workspace_id: workspaceId,
        items: selected.map((a) => ({
          asset_id: a.id,
          media_type: a.file_type,
          metadata: { file_name: a.file_name, url: a.url },
        })),
      });
      toast({ title: `${selected.length} asset(s) added` });
    } catch (err: any) {
      const msg = err.message || "";
      if (isDuplicateError(msg)) {
        toast({ title: "Asset already in this folder", description: "Some assets were already linked.", variant: "destructive" });
      } else {
        toast({ title: "Failed to add", description: msg, variant: "destructive" });
      }
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!folderId) return;
    try {
      await removeItem.mutateAsync({ id: itemId, folder_id: folderId });
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    }
  };

  const handleRename = async () => {
    if (!folderId || !nameValue.trim()) return;
    try {
      await updateFolder.mutateAsync({ id: folderId, name: nameValue.trim(), offer_id: offerId });
      setEditingName(false);
    } catch (err: any) {
      toast({ title: "Rename failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDescSave = async () => {
    if (!folderId) return;
    try {
      await updateFolder.mutateAsync({ id: folderId, description: descValue.trim(), offer_id: offerId });
      setEditingDesc(false);
    } catch (err: any) {
      toast({ title: "Description update failed", description: err.message, variant: "destructive" });
    }
  };

  const imageCount = (items || []).filter((i) => i.file_type === "image").length;
  const videoCount = (items || []).filter((i) => i.file_type === "video").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          {/* Name editing */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRename}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingName(false); setNameValue(folderName); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <SheetTitle className="flex-1">{folderName}</SheetTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setNameValue(folderName); setEditingName(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Description editing */}
          <div className="mt-1">
            {editingDesc ? (
              <div className="space-y-1">
                <Textarea
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  className="text-xs min-h-[60px]"
                  placeholder="Optional description..."
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleDescSave}>
                    <Check className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setEditingDesc(false); setDescValue(folderDescription); }}>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1">
                <p className="text-xs text-muted-foreground flex-1">
                  {folderDescription || "No description"}
                </p>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => { setDescValue(folderDescription); setEditingDesc(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <SheetDescription>
            {imageCount} images · {videoCount} videos
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="media" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="adgroups">Adgroups</TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-4 pt-4">
            {/* Action bar */}
            <div className="flex gap-2">
              <input ref={inputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="text-xs">
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload Media
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)} className="text-xs">
                <FolderOpen className="h-3.5 w-3.5 mr-1" /> Creative Library
              </Button>
            </div>

            {uploading && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uploading...</p>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Media grid */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading items...</p>
            ) : !items?.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Image className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No media in this folder yet.</p>
                <p className="text-xs text-muted-foreground">Upload or choose from Creative Library.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {items.map((item) => (
                  <div key={item.id} className="relative group border border-border rounded-md overflow-hidden bg-muted">
                    <div className="aspect-square flex items-center justify-center">
                      {item.file_type === "video" ? (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      ) : item.url ? (
                        <img src={item.url} alt={item.file_name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="px-1.5 py-1 space-y-0.5">
                      <p className="text-[9px] font-medium truncate text-foreground">{item.file_name || "Asset"}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{item.file_type || item.item_type || "media"}</Badge>
                        {item.width && item.height && <span className="text-[8px] text-muted-foreground">{item.width}×{item.height}</span>}
                      </div>
                      <p className="text-[8px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-1 right-1 h-5 w-5 rounded bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Auto-launch tag info */}
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Auto-launched ads will be tagged: <span className="font-medium text-foreground">Auto: Dilution</span> + <span className="font-medium text-foreground">Campaign URL: {offerName}</span> + <span className="font-medium text-foreground">Folder: {folderName}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Recently used exclusion window: <span className="font-medium text-foreground">7 days (default)</span>
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="adgroups" className="pt-4">
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-1">
                <Info className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adgroups Coming Soon</p>
                <p className="text-xs text-muted-foreground mt-1">Available when Genie / Industry Insights launches</p>
              </div>
              <TooltipProvider>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled className="text-xs">
                        <Upload className="h-3.5 w-3.5 mr-1" /> Upload Media
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Available when Genie / Industry Insights is enabled</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" disabled className="text-xs">
                        <FolderOpen className="h-3.5 w-3.5 mr-1" /> Creative Library
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Available when Genie / Industry Insights is enabled</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </TabsContent>
        </Tabs>

        <CreativeLibraryModal
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          onSelect={handleLibrarySelect}
          filterType="all"
          multiple
        />
      </SheetContent>
    </Sheet>
  );
}
