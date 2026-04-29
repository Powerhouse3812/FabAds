import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreativeAssets, useCreativeFolders, type CreativeAsset } from "@/hooks/use-creative-assets";
import { Search, Image, Video, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assets: CreativeAsset[]) => void;
  /** Filter by file type: "image" | "video" | "all" */
  filterType?: "image" | "video" | "all";
  /** Already selected asset URLs to show as checked */
  selectedUrls?: string[];
  /** Allow multiple selection */
  multiple?: boolean;
}

export default function CreativeLibraryModal({
  open, onOpenChange, onSelect, filterType = "all", selectedUrls = [], multiple = true,
}: Props) {
  const [search, setSearch] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: assets, isLoading } = useCreativeAssets(folderId);
  const { data: folders } = useCreativeFolders();

  const filtered = useMemo(() => {
    let list = assets || [];
    if (filterType !== "all") list = list.filter((a) => a.file_type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.file_name.toLowerCase().includes(q));
    }
    return list;
  }, [assets, filterType, search]);

  const toggleAsset = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedAssets = (assets || []).filter((a) => selected.has(a.id));
    onSelect(selectedAssets);
    setSelected(new Set());
    onOpenChange(false);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Creative Library</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="pl-9" />
          </div>
          <Select value={folderId || "__all__"} onValueChange={(v) => setFolderId(v === "__all__" ? null : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Folders</SelectItem>
              {(folders || []).map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Image className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No assets found.</p>
              <p className="text-xs text-muted-foreground">Upload media first, then select from here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
              {filtered.map((asset) => {
                const isChecked = selected.has(asset.id) || selectedUrls.includes(asset.url);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAsset(asset.id)}
                    className={`relative group rounded-md border overflow-hidden transition-all text-left ${
                      isChecked ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {asset.file_type === "video" ? (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] font-medium truncate text-foreground">{asset.file_name}</p>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          {asset.file_type}
                        </Badge>
                        {asset.width && asset.height && (
                          <span>{asset.width}×{asset.height}</span>
                        )}
                        {asset.file_size && <span>{formatSize(asset.file_size)}</span>}
                      </div>
                    </div>
                    <div className="absolute top-1.5 left-1.5">
                      <Checkbox checked={isChecked} className="bg-background/80" tabIndex={-1} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Select {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
