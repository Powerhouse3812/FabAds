import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/mocks/shared/categories";

interface AddBrandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (brand: {
    name: string;
    domain: string;
    categoryId?: string;
    voice: string;
  }) => void;
}

export function AddBrandModal({ open, onOpenChange, onCreated }: AddBrandModalProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [voice, setVoice] = useState("");

  const reset = () => {
    setName("");
    setDomain("");
    setCategoryId(undefined);
    setVoice("");
  };

  const canSubmit = name.trim().length > 0 && domain.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      domain: domain.trim(),
      categoryId,
      voice: voice.trim(),
    };
    onCreated?.(payload);
    toast.success("Brand created", {
      description: `${payload.name} added to catalogue`,
    });
    onOpenChange(false);
    reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="tracking-tight">Add brand</DialogTitle>
          <DialogDescription>
            Quick setup — refine later in brand details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="brand-name"
                className="text-[11px] font-medium text-muted-foreground"
              >
                Brand name
              </label>
              <input
                id="brand-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Boldfit"
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="brand-domain"
                className="text-[11px] font-medium text-muted-foreground"
              >
                Domain
              </label>
              <input
                id="brand-domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="yourbrand.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              Category
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="brand-voice"
              className="text-[11px] font-medium text-muted-foreground"
            >
              Voice
            </label>
            <textarea
              id="brand-voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              rows={3}
              placeholder="Confident, witty, slightly irreverent — speaks to busy founders..."
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create brand
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
