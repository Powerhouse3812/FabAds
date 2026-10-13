/** Delete confirmation. Irreversible, so it asks. No outside-click close (Radix AlertDialog default). */
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Board } from "@/lib/insights-v3/types";

export function DeleteBoardDialog({
  board,
  onConfirm,
  onClose,
}: {
  board: Pick<Board, "name" | "items"> | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const n = board?.items.length ?? 0;
  return (
    <AlertDialog open={!!board} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="z-50 max-w-md rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words text-base">Delete “{board?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {n === 0
              ? "This board is empty. It will be removed."
              : `This removes the board and its ${n} saved ${n === 1 ? "item" : "items"} from it. The items themselves stay in Discover and your other boards.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Delete board
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
