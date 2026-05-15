import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (category: { name: string; instruction: string }) => void;
}

const MIN_INSTRUCTION_CHARS = 20;

export function AddCategoryModal({ open, onOpenChange, onCreated }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState("");

  // Reset whenever the modal closes so the next open starts blank.
  useEffect(() => {
    if (!open) {
      setName("");
      setInstruction("");
    }
  }, [open]);

  const trimmedName = name.trim();
  const trimmedInstruction = instruction.trim();
  const canSubmit =
    trimmedName.length > 0 && trimmedInstruction.length >= MIN_INSTRUCTION_CHARS;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = { name: trimmedName, instruction: trimmedInstruction };
    onCreated?.(payload);
    toast.success("Category created", {
      description: `${payload.name} added to catalogue`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>
            Categories teach the AI how to write for a buyer type — reusable across brands
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Eg. Sleep & Recovery, Pet Wellness, Skincare"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category-instruction">AI instruction</Label>
            <Textarea
              id="category-instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe what this category covers, who buys it, what the buying psychology is. The AI uses this to generate on-brief creatives. Example: 'Premium memory foam pillows for back-sleepers with neck pain. Buyers care about pressure relief and cooling — most have tried 2-3 other pillows before. Lead with the orthopedist endorsement.'"
              rows={6}
              className="resize-none leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              The AI uses this context for every creative generated against this category. The richer this is, the better the outputs.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
