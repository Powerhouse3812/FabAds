import { useState } from "react";
import { Bell, X, Package, Tag, Wand2, Layers, CheckCircle2, Clock, UploadCloud } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

type ActivityStatus = "done" | "pending" | "syncing";
type ActivityTab = "activity" | "notifications";

interface ActivityItem {
  id: string;
  entityIcon: React.ElementType;
  entityName: string;
  action: string;
  time: string;
  status: ActivityStatus;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    entityIcon: Package,
    entityName: "Mamaearth — Onion Shampoo",
    action: "KB updated · 3 new articles indexed",
    time: "2 min ago",
    status: "done",
  },
  {
    id: "2",
    entityIcon: Wand2,
    entityName: "Brand Ad — Summer Campaign",
    action: "7 generations completed",
    time: "14 min ago",
    status: "done",
  },
  {
    id: "3",
    entityIcon: Tag,
    entityName: "Hair Care (Category)",
    action: "Winner imported from Creative Library",
    time: "1 hr ago",
    status: "done",
  },
  {
    id: "4",
    entityIcon: Package,
    entityName: "Noise ColorFit Pro 5",
    action: "Landing page syncing…",
    time: "Just now",
    status: "syncing",
  },
  {
    id: "5",
    entityIcon: Layers,
    entityName: "Boat Rockerz 450",
    action: "Targeting template applied",
    time: "3 hr ago",
    status: "done",
  },
  {
    id: "6",
    entityIcon: UploadCloud,
    entityName: "Sleepyhead — Orthopedic Mattress",
    action: "Product URL fetch queued",
    time: "5 hr ago",
    status: "pending",
  },
];

const STATUS_ICON: Record<ActivityStatus, React.ElementType> = {
  done: CheckCircle2,
  pending: Clock,
  syncing: UploadCloud,
};

const STATUS_COLOR: Record<ActivityStatus, string> = {
  done: "text-emerald-500",
  pending: "text-amber-500",
  syncing: "text-blue-500",
};

/* ------------------------------------------------------------------ */
/*  NotificationPanel — shared header / tab strip / list               */
/* ------------------------------------------------------------------ */

interface NotificationPanelProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
  onClose: () => void;
  /**
   * True only inside the mobile Sheet. Bumps tap targets to the WCAG 2.5.5
   * 44px minimum (close button, tab strip, activity rows). Desktop keeps its
   * original tighter density untouched — this prop defaults to false so the
   * Popover path renders byte-identical classNames to before.
   */
  mobile?: boolean;
}

/**
 * Header + tab strip + activity/notifications list. Extracted so the desktop
 * Popover and the mobile Sheet render the exact same markup/state — the
 * container is the only thing that differs between the two.
 */
function NotificationPanel({ activeTab, onTabChange, onClose, mobile = false }: NotificationPanelProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        {mobile ? (
          <SheetTitle className="text-sm font-semibold text-foreground">Activity</SheetTitle>
        ) : (
          <p className="text-sm font-semibold text-foreground">Activity</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors",
            mobile && "flex items-center justify-center min-h-11 min-w-11"
          )}
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex border-b border-border bg-background">
        {(["activity", "notifications"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold capitalize transition-colors",
              mobile && "min-h-11",
              activeTab === tab
                ? "text-foreground border-b-2 border-g6-primary-active"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "activity" ? (
        <div
          className={cn(
            "overflow-y-auto divide-y divide-border",
            mobile ? "flex-1" : "max-h-[340px]"
          )}
        >
          {MOCK_ACTIVITY.map((item) => {
            const EntityIcon = item.entityIcon;
            const StatusIcon = STATUS_ICON[item.status];
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer",
                  mobile && "min-h-11"
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                  <EntityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground leading-snug truncate">
                    {item.entityName}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {item.action}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{item.time}</p>
                </div>
                <StatusIcon
                  className={cn("h-3.5 w-3.5 shrink-0 mt-1", STATUS_COLOR[item.status])}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <Bell className="h-7 w-7 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No new notifications</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            System alerts will appear here
          </p>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  NotificationBell Component                                         */
/* ------------------------------------------------------------------ */

interface NotificationBellProps {
  /** compact = icon-only in the collapsed rail */
  compact?: boolean;
}

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>("activity");
  const isMobile = useIsMobile();

  const unreadCount = 2; // mock

  // Shared verbatim between the desktop Popover and the mobile Sheet so the
  // badge/unread-count logic can't drift between the two containers.
  const trigger = (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors",
        compact ? "w-10 h-10" : "w-9 h-9"
      )}
      aria-label="Notifications"
    >
      <Bell className={cn(compact ? "h-5 w-5" : "h-4 w-4")} />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
      )}
    </button>
  );

  const handleClose = () => setOpen(false);

  // Container branch only: a phone viewport is 375px wide, and the popover's
  // fixed 340px width leaves too little room once Radix applies its edge
  // collision padding, so the panel clips. Below `md` we swap the anchored
  // Popover for a full-width bottom Sheet instead of trying to shrink an
  // anchored panel to fit — same trigger, same NotificationPanel content.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 p-0 max-h-[75dvh] rounded-t-2xl [&>button]:hidden"
        >
          {/*
            SheetContent already renders its own absolutely-positioned close
            X (see src/components/ui/sheet.tsx) — `[&>button]:hidden` above
            hides that duplicate so the header's explicit close (below) is
            the single, unambiguous dismiss control. Per the app-wide rule,
            outside-click/swipe never dismisses this sheet.
          */}
          <NotificationPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={handleClose}
            mobile
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-[min(340px,calc(100vw-1.5rem))] p-0 shadow-lg border border-border rounded-xl overflow-hidden"
      >
        <NotificationPanel activeTab={activeTab} onTabChange={setActiveTab} onClose={handleClose} />
      </PopoverContent>
    </Popover>
  );
}
