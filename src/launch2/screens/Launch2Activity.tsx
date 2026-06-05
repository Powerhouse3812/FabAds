/**
 * Launch 2.0 — Activity.
 *
 * A reverse-chron timeline of service.listActivity(), grouped by day. Each
 * event type maps to a lucide icon + a subtle status tint (launch / retry /
 * draft / schedule / failure / recovery / settings). Rows that carry a
 * launchId link to that run's detail. Zero-data → composed empty state.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  ChevronRight,
  FileText,
  Inbox,
  Rocket,
  RotateCcw,
  Settings2,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLaunch2 } from "../state/Launch2Context";
import { formatRelative } from "../utils/time";
import type { ActivityEvent, ActivityType } from "../types";
import { EmptyState } from "./detail/parts";

interface TypeMeta {
  icon: LucideIcon;
  /** icon color */
  color: string;
  /** subtle tinted bg for the icon chip */
  bg: string;
}

const TYPE_META: Record<ActivityType, TypeMeta> = {
  launch: { icon: Rocket, color: "#5B7611", bg: "rgba(143,184,33,0.14)" },
  retry: { icon: RotateCcw, color: "#874d00", bg: "rgba(250,173,20,0.14)" },
  draft: { icon: FileText, color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" },
  schedule: { icon: CalendarClock, color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" },
  failure: { icon: TriangleAlert, color: "#cf1322", bg: "rgba(255,77,79,0.12)" },
  recovery: { icon: ShieldAlert, color: "#874d00", bg: "rgba(250,173,20,0.14)" },
  settings: { icon: Settings2, color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" },
};

/** Calendar-day bucket label for grouping (Today / Yesterday / explicit date). */
function dayLabel(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 86_400_000;
  if (startOfDay === startOfToday) return "Today";
  if (startOfDay === startOfToday - dayMs) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ActivityRow({
  event,
  onOpen,
}: {
  event: ActivityEvent;
  onOpen?: (launchId: string) => void;
}) {
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  const linkable = !!event.launchId;

  const inner = (
    <>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug">{event.title}</div>
        {event.detail && (
          <div className="text-xs leading-snug text-muted-foreground">{event.detail}</div>
        )}
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatRelative(event.at)}
      </span>
      {linkable && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </>
  );

  if (linkable) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.(event.launchId!)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">{inner}</div>;
}

export default function Launch2Activity() {
  const service = useLaunch2();
  const navigate = useNavigate();
  const events = service.listActivity();

  // Group into day buckets, preserving the service's reverse-chron order.
  const groups = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const ev of events) {
      const label = dayLabel(ev.at);
      const arr = map.get(label);
      if (arr) arr.push(ev);
      else map.set(label, [ev]);
    }
    return [...map.entries()];
  }, [events]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Launches, retries, recoveries and changes across your Launch 2.0 workspace.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No activity yet"
          description="Launches, retries and schedule changes will show up here as you use Launch 2.0."
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([label, items]) => (
            <section key={label} className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </h2>
              <div className={cn("divide-y rounded-2xl border bg-card")}>
                {items.map((ev) => (
                  <ActivityRow key={ev.id} event={ev} onOpen={(lid) => navigate(`/launch2/${lid}`)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
