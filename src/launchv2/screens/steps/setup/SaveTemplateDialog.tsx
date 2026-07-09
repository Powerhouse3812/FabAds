/**
 * SaveTemplateDialog — small reusable modal for "Save as new template" actions
 * across the Launch v2 template bars (Setup at Step 2, Distribution at Step 4).
 *
 * Generic over `kind` so both Setup and Distribution share the same dialog.
 * The host owns persistence — this dialog only collects a name and calls
 * `onSave(name)`. Submit is disabled while the name is empty.
 *
 * Fabfunnel design system v1.2: rounded-2xl card, header row with title + X
 * close, single labeled input (rounded-full pill), divider, footer with
 * outline Cancel + lime pill Save (dark text). Matches Figma node 14717:36282.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="gap-0 rounded-2xl border-[#e7e5dc] bg-white p-0 sm:max-w-md dark:border-[#2a2a2a] dark:bg-[#1E1E23] [&>button.absolute]:hidden">
        <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b border-[#e7e5dc] px-5 py-4 dark:border-[#2a2a2a]">
          <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
            Save Template
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[rgba(15,15,12,0.55)] transition-colors hover:bg-[#F0F0EC] dark:text-[rgba(255,255,255,0.55)] dark:hover:bg-[#2a2a2a]"
          >
            <X size={16} />
          </button>
        </DialogHeader>

        <div className="space-y-2 px-5 py-4">
          <Label htmlFor="save-template-name" className="text-xs text-muted-foreground">
            Name
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
            className="h-11 rounded-[28px] border-[#e7e5dc] px-4 dark:border-[#2a2a2a] dark:bg-[#18181B]"
          />
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-[#e7e5dc] px-5 py-4 sm:space-x-0 dark:border-[#2a2a2a]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-[#e7e5dc] bg-transparent px-5 dark:border-[#2a2a2a] dark:bg-transparent dark:text-[rgba(255,255,255,0.85)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSave}
            className="rounded-full bg-[#8FB821] px-5 text-[#121212] hover:bg-[#AACF32] active:bg-[#5B7611] disabled:opacity-40 dark:bg-[#90BA24]"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
