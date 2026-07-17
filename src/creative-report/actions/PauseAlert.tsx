/**
 * Pause / Kill confirmation — friction on a spend-affecting action (handoff §6,
 * KNOWLEDGE.md "friction as a tool"). AlertDialog, then optimistic pause + toast.
 */
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { setPaused } from "@/creative-report/actions/actionStore";
import { truncate, NAME_MAX } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function PauseAlert({
  rollup,
  open,
  onOpenChange,
}: {
  rollup: CreativeRollup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!rollup) return null;
  const { creative } = rollup;
  const name = truncate(creative.name, NAME_MAX).text;

  const confirm = () => {
    setPaused(creative.id);
    onOpenChange(false);
    toast({
      title: "Creative paused",
      description: `${creative.product} is now paused (simulated).`,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pause this creative?</AlertDialogTitle>
          <AlertDialogDescription>
            Pausing stops delivery and spend for <span className="font-medium text-foreground">{name}</span>.
            You can relaunch it later from Launch. This is a spend-affecting action, so we ask first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep running</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Pause creative</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
