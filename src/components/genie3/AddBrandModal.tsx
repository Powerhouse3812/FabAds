import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Globe, Check } from "lucide-react";
import { BRAND_CATEGORIES, BRAND_INDUSTRIES, detectBrandFromWebsite } from "@/lib/genie3-data";
import { useCreateBrand } from "@/hooks/use-brands";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId?: string | null;
}

export function AddBrandModal({ open, onOpenChange, clientId }: Props) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [tone, setTone] = useState("");

  const createBrand = useCreateBrand();

  const handleWebsiteBlur = useCallback(() => {
    if (!website || website.length < 5) return;
    setDetecting(true);
    setDetected(false);
    setTimeout(() => {
      try {
        const urlStr = website.startsWith("http") ? website : `https://${website}`;
        const info = detectBrandFromWebsite(urlStr);
        if (info.name && !name) setName(info.name);
        if (info.category && !category) setCategory(info.category);
        if (info.colors) setColors(info.colors);
        if (info.tone) setTone(info.tone);
        setDetected(true);
      } catch { /* ignore */ }
      setDetecting(false);
    }, 2000);
  }, [website, name, category]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    createBrand.mutate({
      name: name.trim(),
      website: website || undefined,
      category: category || undefined,
      industry: industry || undefined,
      colors,
      tone: tone || undefined,
      client_id: clientId || undefined,
    }, {
      onSuccess: () => {
        setName(""); setWebsite(""); setCategory(""); setIndustry("");
        setColors([]); setTone(""); setDetected(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Website URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://brand.com"
                value={website}
                onChange={(e) => { setWebsite(e.target.value); setDetected(false); }}
                onBlur={handleWebsiteBlur}
                className="pl-9"
              />
              {detecting && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
              {detected && !detecting && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
            </div>
            {detected && <p className="text-[11px] text-muted-foreground">Auto-detected brand details</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Brand Name *</Label>
            <Input placeholder="Brand name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {BRAND_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {BRAND_INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {colors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Colors:</span>
              {colors.map((c) => (
                <div key={c} className="h-5 w-5 rounded-sm border" style={{ backgroundColor: c }} />
              ))}
              {tone && <span className="text-xs text-muted-foreground ml-2">• {tone}</span>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || createBrand.isPending}>
            {createBrand.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Add Brand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
