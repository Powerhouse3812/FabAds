import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Loader2, Upload } from "lucide-react";
import type { TextItemType } from "@/hooks/use-cl-text-items";

const CATEGORY_OPTIONS = ["Insurance", "Debt", "Health", "Finance", "Education", "E-commerce", "Real Estate", "Tech"];
const TAG_OPTIONS = ["Flower", "Rose", "English", "Spanish", "Offer", "Promo", "UGC", "Testimonial", "Urgent", "Holiday"];
const PLATFORM_OPTIONS = ["Facebook", "TikTok", "Instagram", "Google", "YouTube", "Snapchat"];

const LABELS: Record<TextItemType, { title: string; placeholder: string }> = {
  headline: { title: "Add Headline", placeholder: "Enter your headline text…" },
  primary_text: { title: "Add Primary Text", placeholder: "Enter your primary text…" },
  description: { title: "Add Description", placeholder: "Enter your description text…" },
};

interface Props {
  type: TextItemType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { text: string; categories: string[]; tags: string[]; platforms: string[] }) => Promise<unknown>;
  isPending?: boolean;
}

export function AddTextItemModal({ type, open, onOpenChange, onSubmit, isPending }: Props) {
  const [text, setText] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  const label = LABELS[type];

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await onSubmit({ text: text.trim(), categories, tags, platforms });
    setText("");
    setCategories([]);
    setTags([]);
    setPlatforms([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">{type === "headline" ? "Headline" : type === "primary_text" ? "Primary Text" : "Description"}</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={label.placeholder}
              className="mt-1 min-h-[80px] text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <SearchableMultiSelect
              options={CATEGORY_OPTIONS}
              selected={categories}
              onChange={setCategories}
              placeholder="Select categories…"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Tags</Label>
            <SearchableMultiSelect
              options={TAG_OPTIONS}
              selected={tags}
              onChange={setTags}
              placeholder="Add tags…"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Platform</Label>
            <SearchableMultiSelect
              options={PLATFORM_OPTIONS}
              selected={platforms}
              onChange={setPlatforms}
              placeholder="Select platforms…"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!text.trim() || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
