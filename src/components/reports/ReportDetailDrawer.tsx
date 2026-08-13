import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOverlaidEntity } from "@/lib/ad-entity-write-store";
import { ReportEntityDetail } from "@/components/reports/ReportEntityDetail";
import { useAdEntityActions } from "@/components/reports/actions/useAdEntityActions";
import type { ReportEntity } from "@/lib/reports-dummy-data";

interface ReportDetailDrawerProps {
  entity: ReportEntity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddAdset?: (entity: ReportEntity) => void;
  onAddAd?: (entity: ReportEntity) => void;
}

export function ReportDetailDrawer({
  entity: rawEntity,
  open,
  onOpenChange,
  onAddAdset,
  onAddAd,
}: ReportDetailDrawerProps) {
  const isMobile = useIsMobile();
  // `entity` is a snapshot the caller captured in page state when the drawer
  // was opened. It goes stale the moment a status/budget write lands (see
  // useOverlaidEntity's doc comment in ad-entity-write-store.ts) — rendering
  // it raw would let this drawer's status badge contradict the row behind it
  // right after the user acts. Overlaying the live write-store state keeps
  // them in sync.
  const entity = useOverlaidEntity(rawEntity);
  const { setStatus, editBudget, duplicate, openSessionChanges } = useAdEntityActions();

  if (!entity) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            // A bottom sheet keeps the list visible behind the drawer, puts
            // the action row in the thumb zone, and reads as "detail on top
            // of this list" — side="right" on a phone-width viewport reads as
            // a page navigation instead, which this isn't.
            ? "flex max-h-[88vh] flex-col rounded-t-2xl p-0"
            : "w-full overflow-y-auto sm:max-w-lg"
        }
      >
        <ReportEntityDetail
          entity={entity}
          layout={isMobile ? "mobile" : "desktop"}
          onClose={() => onOpenChange(false)}
          onAddAdset={onAddAdset}
          onAddAd={onAddAd}
          setStatus={setStatus}
          editBudget={editBudget}
          duplicate={duplicate}
          openSessionChanges={openSessionChanges}
        />
      </SheetContent>
    </Sheet>
  );
}
