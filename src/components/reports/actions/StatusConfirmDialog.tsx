/**
 * Status confirmation — Reports (desktop table + mobile list).
 *
 * WHAT THIS IS FOR
 * The confirm step is not a speed bump, it is the only place where the user
 * actually SEES the set they are about to change. That is why the bulk copy
 * enumerates sample rows instead of just counting them: mis-selection (a stale
 * checkbox from a previous filter, a select-all that spanned more than the user
 * thought) is the real failure mode of a bulk status write, and a bare "Change
 * 12 items?" cannot surface it.
 *
 * WHY IT DOES NOT CONFIRM EVERYTHING
 * The provider (useAdEntityActions.tsx) decides WHEN to open this. Single Pause
 * never reaches here — see the confirmation-policy comment there.
 *
 * IDENTITY RULE
 * Never identify an entity by name alone. Seeded names repeat across accounts
 * and a duplicate shares its source's base name, so a name-only line can point
 * at the wrong row with total confidence. Every reference carries the level and
 * a short id tail (`describeEntity`).
 *
 * TWO CHROMES, ONE COMPONENT
 * Desktop gets Radix `AlertDialog` (modal, no outside-click dismiss by
 * construction). Mobile gets a bottom `Sheet` — same copy, thumb-reachable, ≥44px
 * targets. Standing app-wide rule: overlays never dismiss on outside click, so
 * the Sheet keeps an explicit Cancel plus its close control. Escape maps to
 * Cancel, which is the correct default for a confirm (it abandons, never applies).
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type {
  EntityLevel,
  EntityStatus,
  ReportEntity,
} from "@/lib/reports-dummy-data";

/** How many rows a bulk confirm names before it falls back to "and N others". */
export const SAMPLE_LIMIT = 3;

const NAME_MAX = 44;

const LEVEL_LABEL: Record<EntityLevel, string> = {
  account: "Ad account",
  campaign: "Campaign",
  adset: "Ad set",
  ad: "Ad",
};

export function levelLabel(level: EntityLevel): string {
  return LEVEL_LABEL[level];
}

function truncateName(name: string): string {
  return name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name;
}

/**
 * "Campaign · Summer Sale — Copy · …f_3_1"
 *
 * Level + truncated name + id tail. Exported because the undo toasts in
 * useAdEntityActions.tsx must identify entities exactly the same way — a toast
 * that names the row differently from the dialog reads as a different row.
 */
export function describeEntity(entity: ReportEntity): string {
  const tail = entity.id.length > 6 ? `…${entity.id.slice(-6)}` : entity.id;
  return `${levelLabel(entity.level)} · ${truncateName(entity.name)} · ${tail}`;
}

export interface StatusConfirmRequest {
  entities: ReportEntity[];
  next: EntityStatus;
}

interface Copy {
  title: string;
  /** Plain-text description — also the a11y description for both chromes. */
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
}

function buildCopy(request: StatusConfirmRequest): Copy {
  const { entities, next } = request;
  const bulk = entities.length > 1;
  const allArchived = entities.every((e) => e.status === "Archived");
  const subject = bulk ? `${entities.length} items` : levelLabel(entities[0].level).toLowerCase();

  if (next === "Active") {
    // Archive → Active is an unarchive as well as an activation. Saying only
    // "Activate" hides half of what happens to the row.
    const unarchive = allArchived;
    return {
      title: unarchive
        ? `Unarchive and set Active — ${subject}?`
        : `Set ${subject} to Active?`,
      body: unarchive
        ? "This returns the selection to your active views and starts delivery and spend immediately."
        : "Delivery and spend start immediately at the current budget.",
      confirmLabel: unarchive ? "Unarchive and set Active" : "Set Active",
      cancelLabel: "Cancel",
      // Starting spend is not "destructive", but it is the one status change
      // money cannot be un-spent out of, so it is not styled as a neutral OK.
      destructive: false,
    };
  }

  if (next === "Archived") {
    return {
      title: `Archive ${subject}?`,
      body: "Archiving stops delivery and removes the selection from your active views. Historical metrics stay intact and you can unarchive later.",
      confirmLabel: bulk ? `Archive ${entities.length} items` : "Archive",
      cancelLabel: "Cancel",
      destructive: true,
    };
  }

  return {
    title: `Pause ${subject}?`,
    body: "Pausing stops delivery and spend. Metrics already recorded are kept, and you can set it back to Active at any time.",
    confirmLabel: bulk ? `Pause ${entities.length} items` : "Pause",
    cancelLabel: "Cancel",
    destructive: true,
  };
}

/** The set the user is about to change, spelled out. */
function SelectionList({ entities }: { entities: ReportEntity[] }) {
  const sample = entities.slice(0, SAMPLE_LIMIT);
  const rest = entities.length - sample.length;

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs font-medium text-foreground">
        {entities.length === 1 ? "1 item selected" : `${entities.length} items selected`}
      </p>
      <ul className="mt-2 space-y-1">
        {sample.map((e) => (
          <li key={e.id} className="text-xs text-muted-foreground">
            <span className="text-foreground">{levelLabel(e.level)}</span>
            {" · "}
            {truncateName(e.name)}
            {" · "}
            <span className="font-mono">
              {e.id.length > 6 ? `…${e.id.slice(-6)}` : e.id}
            </span>
            {" · now "}
            {e.status}
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          and {rest} {rest === 1 ? "other" : "others"}
        </p>
      )}
    </div>
  );
}

export function StatusConfirmDialog({
  request,
  open,
  onOpenChange,
  onConfirm,
}: {
  request: StatusConfirmRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (request: StatusConfirmRequest) => void;
}) {
  const isMobile = useIsMobile();

  // Guarding on the request (not just `open`) keeps the dialog out of the tree
  // between opens, so it never renders a stale selection for one frame.
  if (!request || request.entities.length === 0) return null;

  const copy = buildCopy(request);

  const confirm = () => {
    onConfirm(request);
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* Built-in X suppressed — the two explicit min-h-[44px] buttons below
            (confirm + cancel) are the only close controls, matching the desktop
            AlertDialog branch, which has no built-in X either. */}
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] [&>button]:hidden"
          role="alertdialog"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">{copy.title}</SheetTitle>
            <SheetDescription>{copy.body}</SheetDescription>
          </SheetHeader>
          <SelectionList entities={request.entities} />
          {/* Explicit controls only — outside click cannot dismiss this sheet
              (see src/components/ui/sheet.tsx). Escape = Cancel. */}
          <div className="mt-5 flex flex-col gap-2">
            <Button
              variant={copy.destructive ? "destructive" : "default"}
              className="min-h-[44px] w-full"
              onClick={confirm}
            >
              {copy.confirmLabel}
            </Button>
            <Button
              variant="outline"
              className="min-h-[44px] w-full"
              onClick={() => onOpenChange(false)}
            >
              {copy.cancelLabel}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <SelectionList entities={request.entities} />
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              copy.destructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={confirm}
          >
            {copy.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
