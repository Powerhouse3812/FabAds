import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ConfirmActionDialog — house confirmation policy for money-adjacent actions
 * (Launch / Bulk launch) on Library cards. "Destructive actions confirm" —
 * Launch spends nothing here (no Meta account wiring exists in this
 * prototype), so the copy says so plainly rather than pretending real ad
 * delivery, the same disclosure discipline as the ad-entity-write-store's
 * fabricated duplicate row.
 *
 * `DialogContent` (src/components/ui/dialog.tsx) already prevents outside-
 * click dismissal app-wide — no extra wiring needed here, just an explicit
 * Cancel/Confirm pair.
 */
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
};

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="g6-root sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
