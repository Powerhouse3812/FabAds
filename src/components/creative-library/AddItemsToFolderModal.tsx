import { useState, useMemo } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCreativeAssets, type CreativeAsset } from "@/hooks/use-creative-assets";
import { useClAdgroups, type ClAdgroup } from "@/hooks/use-cl-adgroups";
import { useAddToFolder, useClFolderItems } from "@/hooks/use-cl-folders";
import { useTextItems } from "@/hooks/use-cl-text-items";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Play } from "lucide-react";

interface AddItemsToFolderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
}

export function AddItemsToFolderDrawer({ open, onOpenChange, folderId }: AddItemsToFolderDrawerProps) {
  const [tab, setTab] = useState<"media" | "adgroups">("media");
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [selectedAdgroups, setSelectedAdgroups] = useState<Set<string>>(new Set());

  const { data: allAssets = [] } = useCreativeAssets();
  const { data: allAdgroups = [] } = useClAdgroups();
  const { data: folderItems = [] } = useClFolderItems(folderId);
  const { data: primaryTexts = [] } = useTextItems("primary_text");
  const { data: descriptions = [] } = useTextItems("description");
  const addToFolder = useAddToFolder();

  const existingMediaIds = useMemo(
    () => new Set(folderItems.filter((fi) => fi.item_type === "media").map((fi) => fi.item_id)),
    [folderItems]
  );
  const existingAdgroupIds = useMemo(
    () => new Set(folderItems.filter((fi) => fi.item_type === "adgroup").map((fi) => fi.item_id)),
    [folderItems]
  );

  const filteredAssets = useMemo(() => {
    if (!search) return allAssets;
    const q = search.toLowerCase();
    return allAssets.filter((a) => a.file_name.toLowerCase().includes(q));
  }, [allAssets, search]);

  const filteredAdgroups = useMemo(() => {
    if (!search) return allAdgroups;
    const q = search.toLowerCase();
    return allAdgroups.filter((a) => a.name.toLowerCase().includes(q) || a.page_name.toLowerCase().includes(q));
  }, [allAdgroups, search]);

  const toggleMedia = (id: string) => {
    setSelectedMedia((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAdgroup = (id: string) => {
    setSelectedAdgroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalSelected = selectedMedia.size + selectedAdgroups.size;

  const handleAdd = async () => {
    const items: { itemId: string; itemType: "media" | "adgroup" }[] = [];
    selectedMedia.forEach((id) => items.push({ itemId: id, itemType: "media" }));
    selectedAdgroups.forEach((id) => items.push({ itemId: id, itemType: "adgroup" }));

    if (items.length === 0) return;

    try {
      await addToFolder.mutateAsync({ folderId, items });
      toast({ title: `Added ${items.length} item(s) to folder` });
      setSelectedMedia(new Set());
      setSelectedAdgroups(new Set());
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to add items", variant: "destructive" });
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedMedia(new Set());
      setSelectedAdgroups(new Set());
      setSearch("");
    }
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-5xl w-full flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base">Add Items to Folder</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative px-6 py-3 shrink-0">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9 h-8 text-xs"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-border shrink-0">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-1.5 text-xs">
                Media ({allAssets.length})
              </TabsTrigger>
              <TabsTrigger value="adgroups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-1.5 text-xs">
                Adgroups ({allAdgroups.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="media" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
               <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 p-3">
                {filteredAssets.map((asset) => {
                  const alreadyIn = existingMediaIds.has(asset.id);
                  const checked = alreadyIn || selectedMedia.has(asset.id);
                  return (
                    <label
                      key={asset.id}
                      className={`relative block break-inside-avoid mb-3 rounded-xl border overflow-hidden cursor-pointer transition-all ${
                        checked ? "border-primary ring-1 ring-primary" : "border-border/60 hover:border-muted-foreground/40"
                      } ${alreadyIn ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="relative bg-muted">
                        <img src={asset.url} alt={asset.file_name} className="w-full h-auto block" loading="lazy" />
                        {asset.file_type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center">
                              <Play className="h-3.5 w-3.5 text-foreground fill-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <p className="text-[10px] text-white truncate">{asset.file_name}</p>
                        </div>
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        <Checkbox
                          checked={checked}
                          disabled={alreadyIn}
                          onCheckedChange={() => !alreadyIn && toggleMedia(asset.id)}
                          className="h-4 w-4 bg-background/80"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
              {filteredAssets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No media found</p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="adgroups" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
               <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 p-3">
                {filteredAdgroups.map((ag) => {
                  const alreadyIn = existingAdgroupIds.has(ag.id);
                  const checked = alreadyIn || selectedAdgroups.has(ag.id);
                  const pt = primaryTexts.find((t) => t.id === ag.primary_text_id);
                  const desc = descriptions.find((d) => d.id === ag.description_id);
                  const mediaAsset = allAssets.find((m) => ag.media_ids?.includes(m.id));
                  return (
                    <label
                      key={ag.id}
                      className={`relative block break-inside-avoid mb-3 rounded-xl border overflow-hidden cursor-pointer transition-all bg-card ${
                        checked ? "border-primary ring-1 ring-primary" : "border-border/60 hover:border-muted-foreground/40"
                      } ${alreadyIn ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Avatar className="h-6 w-6">
                          {ag.page_avatar_url ? (
                            <AvatarImage src={ag.page_avatar_url} alt={ag.page_name} />
                          ) : null}
                          <AvatarFallback className="text-[9px]">
                            {(ag.page_name || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-medium text-foreground truncate flex-1">
                          {ag.page_name || "Untitled"}
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                          {ag.ad_type}
                        </Badge>
                      </div>

                      {pt?.text && (
                        <p className="text-[11px] text-foreground px-3 pb-1.5 line-clamp-2">{pt.text}</p>
                      )}

                      {mediaAsset?.url && (
                        <div className="relative w-full bg-muted">
                          <img
                            src={mediaAsset.url}
                            alt={ag.name}
                            className="w-full h-auto block"
                            loading="lazy"
                          />
                          {mediaAsset.file_type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-7 w-7 rounded-full bg-background/80 flex items-center justify-center">
                                <Play className="h-3.5 w-3.5 text-foreground fill-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {desc?.text && (
                        <p className="text-[10px] text-muted-foreground px-3 py-1.5 line-clamp-2">{desc.text}</p>
                      )}

                      <p className="text-[10px] text-muted-foreground truncate px-3 py-1.5 border-t border-border">
                        {ag.name || "Untitled Adgroup"}
                      </p>

                      <div className="absolute top-1.5 left-1.5">
                        <Checkbox
                          checked={checked}
                          disabled={alreadyIn}
                          onCheckedChange={() => !alreadyIn && toggleAdgroup(ag.id)}
                          className="h-4 w-4 bg-background/80"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
              {filteredAdgroups.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No adgroups found</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-border shrink-0 flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={totalSelected === 0 || addToFolder.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add {totalSelected > 0 ? `(${totalSelected})` : "Selected"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** @deprecated Use AddItemsToFolderDrawer instead */
export const AddItemsToFolderModal = AddItemsToFolderDrawer;
