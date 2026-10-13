/**
 * Create / rename board dialog. Explicit Cancel/Save only: no outside-click close.
 */
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface BoardFormValues {
  name: string;
  description: string;
}

export interface BoardFormDialogProps {
  open: boolean;
  mode: "create" | "rename";
  initial?: Partial<BoardFormValues>;
  onSubmit: (values: BoardFormValues) => void;
  onClose: () => void;
}

export const BOARD_NAME_MAX = 80;

export function BoardFormDialog({ open, mode, initial, onSubmit, onClose }: BoardFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const trimmed = name.trim();
  const valid = trimmed.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ name: trimmed, description: description.trim() });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-5 shadow-2xl outline-none"
        >
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {mode === "create" ? "New board" : "Rename board"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="board-name" className="text-xs font-medium text-foreground">
                Name
              </label>
              <Input
                id="board-name"
                autoFocus
                value={name}
                maxLength={BOARD_NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Winning hooks, health insurance"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="board-desc" className="text-xs font-medium text-foreground">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="board-desc"
                value={description}
                maxLength={240}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this board for?"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!valid}
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mode === "create" ? "Create board" : "Save name"}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
