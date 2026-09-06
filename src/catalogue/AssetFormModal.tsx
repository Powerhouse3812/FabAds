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
import { SessionScopeNote } from "./CatalogueShared";
import type { AddAssetInput } from "./assetTypes";

/**
 * §9 "Manually add or upload — the user is never dependent on fetched
 * data alone." One modal, reused for every Creative type's Add flow AND
 * for the generic Edit action (§9 "Edit / delete / duplicate — plus
 * Archive"), rather than 11 bespoke add forms. House confirmation policy:
 * edits treat Save as the confirm — there's no separate "are you sure".
 *
 * Field labels come from the registry's `AssetTypeDef.addForm` so the
 * single form still reads correctly per type ("Script title" vs "CTA
 * text" vs "Audience label"). Edit mode only ever touches name + tags —
 * the write-store has no per-field override model beyond that, so a
 * fuller edit surface isn't offered here (see report).
 */
interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  singular: string;
  addForm?: { nameLabel: string; bodyLabel?: string; bodyPlaceholder?: string };
  initialName?: string;
  initialTags?: string[];
  onSubmit: (input: AddAssetInput) => void;
}

export function AssetFormModal({
  open,
  onOpenChange,
  mode,
  singular,
  addForm,
  initialName = "",
  initialTags = [],
  onSubmit,
}: AssetFormModalProps) {
  const [name, setName] = useState(initialName);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName);
      setTags(initialTags.join(", "));
      setBody("");
    }
  }, [open, initialName, initialTags]);

  const nameLabel = addForm?.nameLabel ?? `${singular} name`;
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ name: trimmedName, tags: parsedTags, body: body.trim() || undefined });
    toast.success(mode === "add" ? `${singular} added` : `${singular} updated`, {
      description:
        mode === "add"
          ? `${trimmedName} appears in the list below — local to this session.`
          : `${trimmedName} saved.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? `Add ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? `Appends a new ${singular.toLowerCase()} to the catalogue immediately below.`
              : `Rename this ${singular.toLowerCase()} or update its tags.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">{nameLabel}</Label>
            <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          {mode === "add" && addForm?.bodyLabel && (
            <div className="space-y-1.5">
              <Label htmlFor="asset-body">{addForm.bodyLabel}</Label>
              <Textarea
                id="asset-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={addForm.bodyPlaceholder}
                rows={5}
                className="resize-none leading-relaxed"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="asset-tags">Tags (comma-separated, optional)</Label>
            <Input
              id="asset-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. urgency, festive"
            />
          </div>

          {mode === "add" && <SessionScopeNote />}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {mode === "add" ? `Add ${singular.toLowerCase()}` : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
