import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useClFolders, useAddToFolder } from "@/hooks/use-cl-folders";

interface MoveToFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: "media" | "adgroup";
}

export function MoveToFolderModal({ open, onOpenChange, itemId, itemType }: MoveToFolderModalProps) {
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { data: folders = [] } = useClFolders();
  const addToFolder = useAddToFolder();

  const filtered = search
    ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : folders;

  const handleConfirm = async () => {
    if (!selectedFolder) return;
    try {
      await addToFolder.mutateAsync({
        folderId: selectedFolder,
        items: [{ itemId, itemType }],
      });
      toast({ title: "Added to folder" });
      onOpenChange(false);
      setSelectedFolder(null);
      setSearch("");
    } catch {
      toast({ title: "Failed to add to folder", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setSelectedFolder(null); setSearch(""); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search folders…" className="pl-8 h-8 text-xs" />
          </div>
          <ScrollArea className="max-h-[240px]">
            <div className="space-y-0.5">
              {filtered.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors text-left ${
                    selectedFolder === folder.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4">
                  {folders.length === 0 ? "No folders yet. Create one first." : "No folders match your search."}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!selectedFolder || addToFolder.isPending} onClick={handleConfirm}>
            {addToFolder.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Add to Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
