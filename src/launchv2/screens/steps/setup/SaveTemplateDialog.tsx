/**
 * SaveTemplateDialog — small reusable modal for "Save as new template" actions
 * across the Launch v2 template bars (Setup at Step 2, Distribution at Step 4).
 *
 * Generic over `kind` so both Setup and Distribution share the same dialog.
 * The host owns persistence — this dialog only collects a name and calls
 * `onSave(name)`. Submit is disabled while the name is empty.
 *
 * Fabfunnel design system: rounded-2xl card, lime primary button (default
 * Button variant), ghost cancel, Geist Mono only for numerics (none here).
 */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SaveTemplateKind = "Setup" | "Distribution";

export function SaveTemplateDialog({
  open,
  onOpenChange,
  onSave,
  kind,
  defaultName = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the trimmed template name when the user submits. */
  onSave: (name: string) => void;
  kind: SaveTemplateKind;
  /** Optional seed value for the name input (e.g. "Q4 scale (copy)"). */
  defaultName?: string;
}) {
  const [name, setName] = useState(defaultName);

  // Reset / re-seed the input each time the dialog opens.
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;

  const handleSubmit = () => {
    if (!canSave) return;
    onSave(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as new {kind} template</DialogTitle>
          <DialogDescription>
            Saved templates are workspace-wide.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="save-template-name" className="text-xs text-muted-foreground">
            Template name
          </Label>
          <Input
            id="save-template-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={kind === "Setup" ? "e.g. Q4 scale — Mensa (US+IN)" : "e.g. 3×3×2 broad rollout"}
            className="h-9"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            Save as new
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
