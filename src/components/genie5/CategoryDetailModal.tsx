import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateGenieCategory, type GenieCategory } from "@/hooks/use-genie-categories";
import { toast } from "sonner";

const ICON_OPTIONS = ["📁", "🚗", "⚖️", "☀️", "🏥", "💰", "🏠", "🎓", "💊", "🛡️", "📱", "🍔", "🐕", "🎮", "👗", "💄", "🏋️", "✈️", "🍷", "📷"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: GenieCategory | null;
  /** Called after successful save with updated fields */
  onSaved?: (updated: Partial<GenieCategory>) => void;
}

export function CategoryDetailModal({ open, onOpenChange, category, onSaved }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [niche, setNiche] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const updateMutation = useUpdateGenieCategory();

  useEffect(() => {
    if (category && open) {
      setName(category.name);
      setIcon(category.icon || "📁");
      setNiche(category.niche || "");
      setSystemPrompt(category.system_prompt || "");
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!category) return;
    if (!name.trim()) return toast.error("Name is required");
    const vals = {
      id: category.id,
      name: name.trim(),
      icon,
      niche: niche.trim() || null,
      system_prompt: systemPrompt.trim() || null,
    };
    await updateMutation.mutateAsync(vals);
    toast.success("Category updated");
    onSaved?.(vals);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Category Details</DialogTitle></DialogHeader>
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
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Niche / Industry</Label>
            <Input placeholder="e.g. Pet Care, Insurance, Health" value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">System Prompt</Label>
            <Textarea
              placeholder="Custom instructions for AI when generating creatives for this category..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
