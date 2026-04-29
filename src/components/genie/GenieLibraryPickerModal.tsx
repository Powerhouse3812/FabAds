import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ImageIcon } from "lucide-react";
import { useCreativeAssets } from "@/hooks/use-creative-assets";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (urls: string[]) => void;
  maxSelectable: number;
}

export function GenieLibraryPickerModal({ open, onOpenChange, onConfirm, maxSelectable }: Props) {
  const { data: assets = [], isLoading } = useCreativeAssets();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const imageAssets = useMemo(() => {
    const imgs = assets.filter((a) => a.file_type === "image" || a.file_type?.startsWith("image/"));
    if (!search.trim()) return imgs;
    const q = search.toLowerCase();
    return imgs.filter((a) => a.file_name.toLowerCase().includes(q));
  }, [assets, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxSelectable) {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const urls = imageAssets.filter((a) => selected.has(a.id)).map((a) => a.url);
    onConfirm(urls);
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setSelected(new Set());
      setSearch("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Select from Creative Library</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="pl-8 h-8 text-sm"
          />
        </div>

        <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : imageAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-2" />
              <p className="text-sm">No images in your library</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-1">
              {imageAssets.map((asset) => {
                const isSelected = selected.has(asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => toggle(asset.id)}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      isSelected ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                  >
                    <img
                      src={asset.thumbnail_url || asset.url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1">
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                    </div>
                    <p className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-foreground px-1 py-0.5 truncate">
                      {asset.file_name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {selected.size} selected · {maxSelectable} max
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirm} disabled={selected.size === 0}>
              Add {selected.size} image{selected.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
