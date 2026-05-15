import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brands } from "@/mocks/shared/brands";
import { cn } from "@/lib/utils";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (product: {
    brandId: string;
    name: string;
    price: string;
    benefits: string[];
  }) => void;
}

const MAX_BENEFITS = 5;

export function AddProductModal({ open, onOpenChange, onCreated }: AddProductModalProps) {
  const [brandId, setBrandId] = useState<string>("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [benefitDraft, setBenefitDraft] = useState("");

  const canSubmit =
    brandId.trim().length > 0 && name.trim().length > 0 && price.trim().length > 0;

  const resetForm = () => {
    setBrandId("");
    setName("");
    setPrice("");
    setBenefits([]);
    setBenefitDraft("");
  };

  const handleAddBenefit = () => {
    const v = benefitDraft.trim();
    if (!v) return;
    if (benefits.length >= MAX_BENEFITS) return;
    if (benefits.includes(v)) {
      setBenefitDraft("");
      return;
    }
    setBenefits((prev) => [...prev, v]);
    setBenefitDraft("");
  };

  const handleRemoveBenefit = (b: string) => {
    setBenefits((prev) => prev.filter((x) => x !== b));
  };

  const handleBenefitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBenefit();
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const brandName = brands.find((b) => b.id === brandId)?.name ?? "brand";
    const payload = {
      brandId,
      name: name.trim(),
      price: price.trim(),
      benefits,
    };
    onCreated?.(payload);
    toast.success("Product created", {
      description: `${payload.name} added to ${brandName}`,
    });
    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Quick setup — add benefits, landing URLs later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Brand <span className="text-muted-foreground">(required)</span>
            </label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name + Price row */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Product name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Onion Hair Oil"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div className="col-span-4 space-y-1.5">
              <label className="text-xs font-medium text-foreground">Price</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹1,299"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Key benefits</label>
            <p className="text-xs text-muted-foreground">
              What makes this product worth buying? Add 3–5
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={benefitDraft}
                onChange={(e) => setBenefitDraft(e.target.value)}
                onKeyDown={handleBenefitKeyDown}
                disabled={benefits.length >= MAX_BENEFITS}
                placeholder={
                  benefits.length >= MAX_BENEFITS
                    ? "Max 5 benefits"
                    : "Type a benefit and press Enter"
                }
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                disabled={!benefitDraft.trim() || benefits.length >= MAX_BENEFITS}
                className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {benefits.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(b)}
                      aria-label={`Remove ${b}`}
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Create product
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
