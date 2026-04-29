import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, X, Globe, Palette, MessageSquare, Tag, Package, Plus, Trash2 } from "lucide-react";
import type { BrandProfile } from "@/lib/genie2-dummy-data";

interface FetchedProduct {
  name: string;
  price?: string;
  image?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: BrandProfile | null;
  products: FetchedProduct[];
  url: string;
  onSave: (edited?: { name: string; category: string; tone: string; colors: string[] }) => void;
  onDismiss: () => void;
  saving?: boolean;
}

export function BrandFetchModal({ open, onOpenChange, brand, products, url, onSave, onDismiss, saving }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("");
  const [colors, setColors] = useState<string[]>([]);

  // Sync local state when brand changes
  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setCategory(brand.category);
      setTone(brand.tone);
      setColors([...brand.colors]);
    }
  }, [brand]);

  if (!brand) return null;

  const handleColorChange = (idx: number, val: string) => {
    setColors((prev) => prev.map((c, i) => (i === idx ? val : c)));
  };

  const handleRemoveColor = (idx: number) => {
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddColor = () => {
    setColors((prev) => [...prev, "#888888"]);
  };

  const handleSave = () => {
    onSave({ name, category, tone, colors });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: colors[0] || brand.colors[0] }}
            >
              {name.charAt(0) || brand.logoPlaceholder}
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-base font-semibold border-border/40"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL (read-only) */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span className="truncate">{url}</span>
          </div>

          {/* Brand Identity — editable */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Tag className="h-3 w-3" />
                Category
              </div>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-7 text-sm border-border/40"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Tone
              </div>
              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-7 text-sm border-border/40"
              />
            </div>
          </div>

          {/* Colors — editable */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Palette className="h-3 w-3" />
              Brand Colors
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 group">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="h-6 w-6 rounded-md border cursor-pointer p-0"
                  />
                  <Input
                    value={c}
                    onChange={(e) => handleColorChange(i, e.target.value)}
                    className="h-6 w-16 text-[11px] font-mono px-1.5 border-border/40"
                  />
                  {colors.length > 1 && (
                    <button
                      onClick={() => handleRemoveColor(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddColor}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Products (read-only) */}
          {products.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Package className="h-3 w-3" />
                  Products Found ({products.length})
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                  {products.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
                      {p.image && (
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        {p.price && <p className="text-[11px] text-muted-foreground">{p.price}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onDismiss} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Dismiss
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
