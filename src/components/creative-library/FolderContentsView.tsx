import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClFolderItems, useRemoveFromFolder, useDeleteClFolder, useFolderLinkedCampaignUrls, type ClFolder } from "@/hooks/use-cl-folders";
import { useCreativeAssets, type CreativeAsset } from "@/hooks/use-creative-assets";
import { useClAdgroups } from "@/hooks/use-cl-adgroups";
import { useTextItems } from "@/hooks/use-cl-text-items";
import { toast } from "@/hooks/use-toast";
import {
  Edit, Trash2, X, Play, FolderOpen, Plus, Rocket, Bookmark, Download,
  Shuffle, Sparkles, MoreVertical, BookmarkCheck, FolderMinus,
} from "lucide-react";
import { AddItemsToFolderDrawer } from "./AddItemsToFolderModal";
import { FolderLinkedOffersSection } from "./FolderLinkedOffersSection";
import { FolderLaunchModal } from "./FolderLaunchModal";
import { AdgroupLaunchModal } from "./AdgroupLaunchModal";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";

interface FolderContentsViewProps {
  folder: ClFolder;
  onEdit: () => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function FolderContentsView({ folder, onEdit, onClose, isReadOnly }: FolderContentsViewProps) {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<"media" | "adgroups" | "linked-cus">("media");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);

  const { data: folderItems = [] } = useClFolderItems(folder.id);
  const { data: linkedCus = [] } = useFolderLinkedCampaignUrls(folder.id);
  const { data: allAssets = [] } = useCreativeAssets();
  const { data: allAdgroups = [] } = useClAdgroups();
  const { data: realPrimaryTexts } = useTextItems("primary_text");
  const { data: realDescs } = useTextItems("description");
  const { data: realHeadlines } = useTextItems("headline");
  const removeFromFolder = useRemoveFromFolder();
  const deleteFolder = useDeleteClFolder();
  const [adgroupBookmarks, setAdgroupBookmarks] = useState<Set<string>>(new Set());
  const [agLaunchOpen, setAgLaunchOpen] = useState(false);
  const [agLaunchItems, setAgLaunchItems] = useState<AdgroupLaunchItem[]>([]);

  const mediaItemIds = useMemo(() => new Set(folderItems.filter((fi) => fi.item_type === "media").map((fi) => fi.item_id)), [folderItems]);
  const adgroupItemIds = useMemo(() => new Set(folderItems.filter((fi) => fi.item_type === "adgroup").map((fi) => fi.item_id)), [folderItems]);

  const mediaInFolder = useMemo(() => allAssets.filter((a) => mediaItemIds.has(a.id)), [allAssets, mediaItemIds]);
  const adgroupsInFolder = useMemo(() => allAdgroups.filter((a) => adgroupItemIds.has(a.id)), [allAdgroups, adgroupItemIds]);

  const displayAdgroups = useMemo(() => {
    return adgroupsInFolder.map((ag) => {
      const primaryText = realPrimaryTexts?.find((p) => p.id === ag.primary_text_id);
      const desc = realDescs?.find((d) => d.id === ag.description_id);
      const firstMediaId = ag.media_ids?.[0];
      const mediaAsset = allAssets.find((m) => m.id === firstMediaId);
      return {
        id: ag.id,
        pageName: ag.page_name || "My Page",
        pageAvatar: ag.page_avatar_url || "",
        type: ag.ad_type as "Static",
        primaryText: primaryText?.text || "",
        media: { url: mediaAsset?.url || "https://picsum.photos/seed/placeholder/500/500", type: (mediaAsset?.file_type === "video" ? "video" : "image") as "image" | "video" },
        secondaryText: desc?.text || "",
      };
    });
  }, [adgroupsInFolder, realPrimaryTexts, realDescs, allAssets]);

  const toggleAdgroupBookmark = (id: string) => {
    setAdgroupBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast({ title: "Removed from favourites" }); }
      else { next.add(id); toast({ title: "Saved to favourites" }); }
      return next;
    });
  };

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.target = "_blank"; a.click();
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromFolder.mutateAsync({ folderId: folder.id, itemId });
      toast({ title: "Removed from folder" });
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  const handleDeleteFolder = async () => {
    try {
      await deleteFolder.mutateAsync(folder.id);
      toast({ title: "Folder deleted" });
      onClose();
    } catch {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    }
  };

  const handleLaunch = () => {
    setLaunchModalOpen(true);
  };

  const handleAdgroupLaunch = (agId: string) => {
    const ag = adgroupsInFolder.find((a) => a.id === agId);
    if (!ag) return;
    const primaryText = realPrimaryTexts?.find((p) => p.id === ag.primary_text_id);
    const desc = realDescs?.find((d) => d.id === ag.description_id);
    const headline = realHeadlines?.find((h) => h.id === ag.headline_id);
    const mediaUrls: string[] = (ag.media_ids || []).map((mid) => allAssets.find((a) => a.id === mid)?.url).filter(Boolean) as string[];
    const item: AdgroupLaunchItem = {
      id: ag.id,
      type: "adgroup",
      primaryText: primaryText?.text || "",
      headline: headline?.text || "",
      description: desc?.text || "",
      cta: ag.cta || "",
      destinationUrl: ag.destination_url || "",
      displayLink: ag.display_link || "",
      mediaUrls,
      mediaType: mediaUrls.length > 0 ? (allAssets.find((a) => a.url === mediaUrls[0])?.file_type || "image") : "image",
    };
    setAgLaunchItems([item]);
    setAgLaunchOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border space-y-1">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground flex-1 truncate">{folder.name}</h2>
          {!isReadOnly && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => setAddItemsOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Add Items
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={handleLaunch}>
                <Rocket className="h-3 w-3 mr-1" />
                Launch
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {folder.description && <p className="text-xs text-muted-foreground">{folder.description}</p>}
        {folder.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {folder.tags.map((t) => <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0">{t}</Badge>)}
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-1.5 text-xs">
              Media ({mediaInFolder.length})
            </TabsTrigger>
            <TabsTrigger value="adgroups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-1.5 text-xs">
              Adgroups ({adgroupsInFolder.length})
            </TabsTrigger>
            <TabsTrigger value="linked-cus" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-1.5 text-xs">
              Linked CUs ({linkedCus.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="media" className="flex-1 overflow-y-auto p-4 mt-0">
          {mediaInFolder.length === 0 ? (
            <EmptyState text="No media in this folder yet" />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-0">
              {mediaInFolder.map((asset) => (
                <MediaCard key={asset.id} asset={asset} onRemove={() => handleRemove(asset.id)} isReadOnly={isReadOnly} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="adgroups" className="flex-1 overflow-y-auto p-4 mt-0">
          {displayAdgroups.length === 0 ? (
            <EmptyState text="No adgroups in this folder yet" />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-0">
              {displayAdgroups.map((ag) => (
                <FolderAdgroupCard
                  key={ag.id}
                  ag={ag}
                  isBookmarked={adgroupBookmarks.has(ag.id)}
                  onToggleBookmark={() => toggleAdgroupBookmark(ag.id)}
                  onRemove={() => handleRemove(ag.id)}
                  onDownload={() => handleDownload(ag.media.url, `${ag.pageName}-ad.jpg`)}
                  isReadOnly={isReadOnly}
                  onLaunch={() => handleAdgroupLaunch(ag.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="linked-cus" className="flex-1 overflow-y-auto mt-0">
          <FolderLinkedOffersSection folderId={folder.id} folderName={folder.name} isReadOnly={isReadOnly} />
        </TabsContent>
      </Tabs>

      {/* Add Items Modal */}
      <AddItemsToFolderDrawer open={addItemsOpen} onOpenChange={setAddItemsOpen} folderId={folder.id} />

      {/* Adgroup Launch Modal */}
      <AdgroupLaunchModal open={agLaunchOpen} onOpenChange={setAgLaunchOpen} items={agLaunchItems} />

      {/* Launch Modal */}
      <FolderLaunchModal
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
        folderId={folder.id}
        folderName={folder.name}
      />

      {/* Delete folder dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{folder.name}"? Items inside won't be deleted — only the folder and its associations will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function MediaCard({ asset, onRemove, isReadOnly }: { asset: CreativeAsset; onRemove: () => void; isReadOnly?: boolean }) {
  const isVideo = asset.file_type === "video";
  return (
    <div className="break-inside-avoid mb-3 group relative rounded-xl border border-border/60 overflow-hidden hover:shadow-sm transition-all">
      <div className="relative">
        <img src={asset.url} alt={asset.file_name} className="w-full h-auto block bg-muted" loading="lazy" />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
              <Play className="h-5 w-5 text-foreground fill-foreground" />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-2.5 pb-2 pt-6">
          <p className="text-[11px] text-white truncate font-medium">{asset.file_name}</p>
        </div>
      </div>
      {!isReadOnly && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="destructive" size="sm" className="h-6 text-[10px] px-2" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

interface DisplayAdgroup {
  id: string;
  pageName: string;
  pageAvatar: string;
  type: string;
  primaryText: string;
  media: { url: string; type: "image" | "video" };
  secondaryText: string;
}

function FolderAdgroupCard({ ag, isBookmarked, onToggleBookmark, onRemove, onDownload, isReadOnly, onLaunch }: {
  ag: DisplayAdgroup;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onRemove: () => void;
  onDownload: () => void;
  isReadOnly?: boolean;
  onLaunch?: () => void;
}) {
  const isVideo = ag.media.type === "video";

  return (
    <div className="break-inside-avoid mb-3 rounded-xl border border-border/60 overflow-hidden bg-card hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <Avatar className="h-6 w-6">
          <AvatarImage src={ag.pageAvatar} alt={ag.pageName} />
          <AvatarFallback className="text-[10px]">{ag.pageName[0]}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-foreground truncate flex-1">{ag.pageName}</span>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0 h-4">{ag.type}</Badge>
        <button onClick={onToggleBookmark} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0">
          <Bookmark className={`h-3 w-3 ${isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0">
              <MoreVertical className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onToggleBookmark}>
              <BookmarkCheck className="h-4 w-4 mr-2" /> {isBookmarked ? "Remove favourite" : "Save to favourites"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </DropdownMenuItem>
            {onLaunch && (
              <DropdownMenuItem onClick={onLaunch}>
                <Rocket className="h-4 w-4 mr-2" /> Launch Adgroup
              </DropdownMenuItem>
            )}
            {!isReadOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onRemove}>
                  <FolderMinus className="h-4 w-4 mr-2" /> Remove from folder
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Primary text */}
      <div className="px-2.5 pb-1.5">
        <p className="text-xs text-foreground line-clamp-2">{ag.primaryText}</p>
      </div>

      {/* Media */}
      <div className="relative">
        <img src={ag.media.url} alt="" className="w-full h-auto block bg-muted" loading="lazy" />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
              <Play className="h-5 w-5 text-foreground fill-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Secondary text */}
      <div className="px-2.5 py-1.5">
        <p className="text-[11px] text-muted-foreground line-clamp-2">{ag.secondaryText}</p>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between px-1.5 py-1 border-t border-border/60">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleBookmark}>
          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span><Button variant="ghost" size="icon" className="h-7 w-7" disabled><Shuffle className="h-3.5 w-3.5" /></Button></span>
          </TooltipTrigger>
          <TooltipContent><p>Coming Soon</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span><Button variant="ghost" size="icon" className="h-7 w-7" disabled><Sparkles className="h-3.5 w-3.5" /></Button></span>
          </TooltipTrigger>
          <TooltipContent><p>Coming Soon</p></TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onToggleBookmark}>
              <BookmarkCheck className="h-4 w-4 mr-2" /> {isBookmarked ? "Remove favourite" : "Save to favourites"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </DropdownMenuItem>
            {onLaunch && (
              <DropdownMenuItem onClick={onLaunch}>
                <Rocket className="h-4 w-4 mr-2" /> Launch Adgroup
              </DropdownMenuItem>
            )}
            {!isReadOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onRemove}>
                  <FolderMinus className="h-4 w-4 mr-2" /> Remove from folder
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-2" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
