import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Loader2 } from "lucide-react";
import type { ClFolder } from "@/hooks/use-cl-folders";

const TAG_SUGGESTIONS = ["Facebook", "TikTok", "Instagram", "YouTube", "Google", "Brand", "Promo", "UGC", "Seasonal", "Q1", "Q2", "Q3", "Q4"];

interface FolderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: ClFolder | null;
  onSave: (data: { name: string; tags: string[]; description: string }) => Promise<void>;
}

export function FolderFormModal({ open, onOpenChange, folder, onSave }: FolderFormModalProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(folder?.name || "");
      setTags(folder?.tags || []);
      setDescription(folder?.description || "");
    }
  }, [open, folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), tags, description: description.trim() });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create Folder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Name *</Label>
            <Input id="folder-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Campaign" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <SearchableMultiSelect
              options={TAG_SUGGESTIONS}
              selected={tags}
              onChange={setTags}
              placeholder="Add tags…"
              chipVariant="secondary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="folder-desc">Description</Label>
            <Textarea id="folder-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description…" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {folder ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
