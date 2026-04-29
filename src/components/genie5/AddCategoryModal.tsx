import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGenieCategory } from "@/hooks/use-genie-categories";
import { toast } from "sonner";

const ICON_OPTIONS = ["📁", "🚗", "⚖️", "☀️", "🏥", "💰", "🏠", "🎓", "💊", "🛡️", "📱", "🍔"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddCategoryModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [niche, setNiche] = useState("");
  const createMutation = useCreateGenieCategory();

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    await createMutation.mutateAsync({ name: name.trim(), icon, niche: niche.trim() || undefined });
    toast.success("Category created");
    setName(""); setIcon("📁"); setNiche("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Icon</Label>
            <div className="flex gap-1.5 flex-wrap">
              {ICON_OPTIONS.map((i) => (
                <button key={i} onClick={() => setIcon(i)} className={`h-8 w-8 rounded-md border text-base flex items-center justify-center transition-colors ${icon === i ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input placeholder="e.g. Auto Insurance" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Niche (optional)</Label>
            <Input placeholder="e.g. Insurance, Health" value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
