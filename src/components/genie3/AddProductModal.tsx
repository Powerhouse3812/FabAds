import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAddBrandProduct } from "@/hooks/use-brand-products";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brandId: string;
}

export function AddProductModal({ open, onOpenChange, brandId }: Props) {
  const addProduct = useAddBrandProduct();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");

  const reset = () => { setName(""); setUrl(""); setPrice(""); setSku(""); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    addProduct.mutate(
      { brand_id: brandId, name: name.trim(), url: url.trim() || undefined, price: price.trim() || undefined, sku: sku.trim() || undefined },
      { onSuccess: () => { reset(); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">Add Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Product Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Air Max 270" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Product URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Price</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$99" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="NK-AM270" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || addProduct.isPending}>
            {addProduct.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
