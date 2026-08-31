/**
 * Industry Insights → Trends: per-item action bar + in-memory action store.
 *
 * Pattern: module-level mutable state + useSyncExternalStore, same discipline
 * as src/creative-report-v2/automations/rulesStore.ts (stable cached snapshot
 * reference — a new state object is only produced on an actual mutation, so
 * components that don't care about a given trend never re-render for it).
 * In-memory only, no persistence — this is a mock-first prototype surface,
 * state resets on reload by design.
 *
 * Token vocabulary copied from src/components/insights-v2/IndustryInsightsAdsCard.tsx
 * and src/components/insights/InsightAdCard.tsx: bg-muted / text-muted-foreground /
 * border-border / bg-secondary / text-secondary-foreground / bg-primary /
 * text-primary(-foreground). No new colour tokens. Every toggle pairs an icon
 * change with a text (aria-label/tooltip/visible-label) change — never colour
 * alone.
 */
import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Bookmark,
  CheckCircle2,
  FileText,
  Hammer,
  Loader2,
  type LucideIcon,
  Radar,
  Repeat2,
  Share2,
  Target,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TrendItem, TrendSourceType } from "@/insights-trends/types";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type GenieStatusValue = "analysing" | "generating" | "ready";
type RelevanceValue = "relevant" | "not_relevant";

interface TrendActionsState {
  saved: Set<string>;
  watched: Set<string>;
  dismissed: Set<string>;
  genieStatus: Record<string, GenieStatusValue>;
}

const EMPTY_STATE: TrendActionsState = {
  saved: new Set(),
  watched: new Set(),
  dismissed: new Set(),
  genieStatus: {},
};

let state: TrendActionsState = {
  saved: new Set(),
  watched: new Set(),
  dismissed: new Set(),
  genieStatus: {},
};

// Feedback-only signal from Relevant / Not Relevant — not surfaced through
// the hook's return type (no consumer needs it today), kept module-local so
// re-clicking the same choice doesn't re-toast identical feedback.
const relevanceById = new Map<string, RelevanceValue>();

// Timers from an in-flight startGenie() progression, keyed by item id, so a
// second click on the same item (or an unmount) can't leave a stale timeout
// clobbering a later run.
const genieTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): TrendActionsState {
  return state;
}

function getServerSnapshot(): TrendActionsState {
  return EMPTY_STATE;
}

function toggleInSet(key: "saved" | "watched", itemId: string) {
  const next = new Set(state[key]);
  const wasOn = next.has(itemId);
  if (wasOn) next.delete(itemId);
  else next.add(itemId);
  state = { ...state, [key]: next };
  emit();
  return !wasOn;
}

function toggleSave(itemId: string) {
  const isSaved = toggleInSet("saved", itemId);
  toast.success(isSaved ? "Saved" : "Removed from saved", {
    description: isSaved ? "Find it later under Saved trends." : undefined,
  });
}

function toggleWatch(itemId: string) {
  const isWatched = toggleInSet("watched", itemId);
  toast.success(isWatched ? "Watching this trend" : "Stopped watching", {
    description: isWatched ? "We'll flag meaningful movement here." : undefined,
  });
}

function undoDismiss(itemId: string) {
  if (!state.dismissed.has(itemId)) return;
  const next = new Set(state.dismissed);
  next.delete(itemId);
  state = { ...state, dismissed: next };
  emit();
}

function dismiss(itemId: string) {
  const next = new Set(state.dismissed);
  next.add(itemId);
  state = { ...state, dismissed: next };
  emit();
  toast("Trend dismissed", {
    description: "It won't show up in this feed again.",
    action: {
      label: "Undo",
      onClick: () => undoDismiss(itemId),
    },
  });
}

function setRelevance(itemId: string, relevance: RelevanceValue) {
  if (relevanceById.get(itemId) === relevance) return;
  relevanceById.set(itemId, relevance);
  toast.success(
    relevance === "relevant" ? "Thanks — more like this" : "Got it — less like this",
    { description: "This tunes what surfaces here for you." },
  );
}

function setGenieStatus(itemId: string, status: GenieStatusValue) {
  state = { ...state, genieStatus: { ...state.genieStatus, [itemId]: status } };
  emit();
}

function clearGenieTimers(itemId: string) {
  const timers = genieTimers.get(itemId);
  if (!timers) return;
  timers.forEach((t) => clearTimeout(t));
  genieTimers.delete(itemId);
}

/** Dummy analysing -> generating -> ready progression. `action` is the Genie
 *  action label (e.g. "Extract Winning Angle") — carried through only for the
 *  completion toast copy, nothing here calls a real model. */
function startGenie(itemId: string, action: string) {
  clearGenieTimers(itemId);
  setGenieStatus(itemId, "analysing");
  const t1 = setTimeout(() => setGenieStatus(itemId, "generating"), 900);
  const t2 = setTimeout(() => {
    setGenieStatus(itemId, "ready");
    toast.success(`${action} — ready`, {
      description: "Open Genie to review the draft.",
    });
  }, 2200);
  genieTimers.set(itemId, [t1, t2]);
}

export function useTrendActions(): {
  saved: Set<string>;
  watched: Set<string>;
  dismissed: Set<string>;
  genieStatus: Record<string, GenieStatusValue>;
  toggleSave: (itemId: string) => void;
  toggleWatch: (itemId: string) => void;
  dismiss: (itemId: string) => void;
  undoDismiss: (itemId: string) => void;
  setRelevance: (itemId: string, relevance: RelevanceValue) => void;
  startGenie: (itemId: string, action: string) => void;
} {
  const current = useSyncExternalStore(subscribe, snapshot, getServerSnapshot);

  return {
    saved: current.saved,
    watched: current.watched,
    dismissed: current.dismissed,
    genieStatus: current.genieStatus,
    toggleSave,
    toggleWatch,
    dismiss,
    undoDismiss,
    setRelevance,
    startGenie,
  };
}

// ---------------------------------------------------------------------------
// Genie actions — source-specific only. Per doc: meta and tiktok ONLY. Do not
// invent Genie actions for any other TrendSourceType.
// ---------------------------------------------------------------------------

interface GenieAction {
  label: string;
  icon: LucideIcon;
}

const GENIE_ACTIONS_BY_SOURCE: Partial<Record<TrendSourceType, GenieAction[]>> = {
  meta: [
    { label: "Extract Winning Angle", icon: Target },
    { label: "Remix Concept", icon: Repeat2 },
    { label: "Build Ad", icon: Hammer },
  ],
  tiktok: [
    { label: "Write Script", icon: FileText },
    { label: "Create Hook Variations", icon: Wand2 },
    { label: "Build Ad", icon: Hammer },
  ],
};

const GENIE_STATUS_COPY: Record<GenieStatusValue, { label: string; icon: LucideIcon; spin?: boolean }> = {
  analysing: { label: "Genie is analysing…", icon: Loader2, spin: true },
  generating: { label: "Genie is generating…", icon: Loader2, spin: true },
  ready: { label: "Genie output ready", icon: CheckCircle2 },
};

/** Renders nothing until startGenie() has been called for this item — the
 *  status persists at "ready" rather than reverting to the action buttons,
 *  since the point is "Genie already produced something for this trend." */
export function GenieStatusChip(props: { itemId: string }): JSX.Element | null {
  const { genieStatus } = useTrendActions();
  const status = genieStatus[props.itemId];
  if (!status) return null;

  const { label, icon: Icon, spin } = GENIE_STATUS_COPY[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          spin && "animate-spin",
          status === "ready" && "text-primary",
        )}
      />
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action bar
// ---------------------------------------------------------------------------

interface StandardAction {
  key: string;
  label: string;
  activeLabel?: string;
  icon: LucideIcon;
  isActive?: boolean;
  onClick: () => void;
}

function shareItem(item: TrendItem) {
  const shareText = `${item.title} — via FabAds Industry Insights`;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
  } catch {
    // Clipboard can reject (permissions, insecure context) — the toast below
    // still confirms intent even if the copy silently failed.
  }
  toast.success("Share text copied", {
    description: "Paste it wherever you want to share this trend.",
  });
}

export function TrendActionBar(props: { item: TrendItem; variant: "card" | "story" }): JSX.Element {
  const { item, variant } = props;
  const { saved, watched, genieStatus, toggleSave, toggleWatch, dismiss, setRelevance, startGenie } =
    useTrendActions();

  const isSaved = saved.has(item.id);
  const isWatched = watched.has(item.id);
  const hasGenieStatus = Boolean(genieStatus[item.id]);
  const genieActions = GENIE_ACTIONS_BY_SOURCE[item.type];

  const standardActions: StandardAction[] = [
    {
      key: "save",
      label: "Save",
      activeLabel: "Saved",
      icon: Bookmark,
      isActive: isSaved,
      onClick: () => toggleSave(item.id),
    },
    {
      key: "watch",
      label: "Watch",
      activeLabel: "Watching",
      icon: Radar,
      isActive: isWatched,
      onClick: () => toggleWatch(item.id),
    },
    {
      key: "share",
      label: "Share",
      icon: Share2,
      onClick: () => shareItem(item),
    },
    {
      key: "relevant",
      label: "Relevant",
      icon: ThumbsUp,
      onClick: () => setRelevance(item.id, "relevant"),
    },
    {
      key: "not-relevant",
      label: "Not Relevant",
      icon: ThumbsDown,
      onClick: () => setRelevance(item.id, "not_relevant"),
    },
    {
      key: "dismiss",
      label: "Dismiss",
      icon: X,
      onClick: () => dismiss(item.id),
    },
  ];

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  if (variant === "card") {
    return (
      <TooltipProvider delayDuration={250}>
        {/* Plain div, not nested in an <a>/role="link" element — the reference
            prototype nests its action row inside a link wrapper, which breaks
            keyboard/screen-reader reachability for the buttons inside it. This
            bar owns its own click boundary via stopPropagation instead. */}
        <div
          className="flex items-center justify-around gap-1"
          onClick={stop}
          onKeyDown={stop}
        >
          {standardActions.map((action) => {
            const Icon = action.icon;
            const activeLabel = action.activeLabel ?? action.label;
            const displayLabel = action.isActive ? activeLabel : action.label;
            return (
              <Tooltip key={action.key}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={displayLabel}
                    aria-pressed={action.isActive}
                    className="h-8 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    onClick={action.onClick}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        action.isActive && "fill-current text-primary",
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{displayLabel}</TooltipContent>
              </Tooltip>
            );
          })}

          {genieActions &&
            (hasGenieStatus ? (
              <GenieStatusChip itemId={item.id} />
            ) : (
              genieActions.map((genieAction) => {
                const Icon = genieAction.icon;
                return (
                  <Tooltip key={genieAction.label}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={genieAction.label}
                        className="h-8 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                        onClick={() => startGenie(item.id, genieAction.label)}
                      >
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{genieAction.label}</TooltipContent>
                  </Tooltip>
                );
              })
            ))}
        </div>
      </TooltipProvider>
    );
  }

  // "story" variant — full reading view. Visible text labels, no reliance on
  // tooltip-only affordance.
  return (
    <div className="flex flex-wrap items-center gap-2" onClick={stop} onKeyDown={stop}>
      {standardActions.map((action) => {
        const Icon = action.icon;
        const activeLabel = action.activeLabel ?? action.label;
        const displayLabel = action.isActive ? activeLabel : action.label;
        return (
          <Button
            key={action.key}
            type="button"
            variant={action.isActive ? "secondary" : "outline"}
            size="sm"
            aria-pressed={action.isActive}
            className="gap-1.5"
            onClick={action.onClick}
          >
            <Icon className={cn("h-3.5 w-3.5", action.isActive && "fill-current")} />
            {displayLabel}
          </Button>
        );
      })}

      {genieActions &&
        (hasGenieStatus ? (
          <GenieStatusChip itemId={item.id} />
        ) : (
          genieActions.map((genieAction) => {
            const Icon = genieAction.icon;
            return (
              <Button
                key={genieAction.label}
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/40 text-primary hover:text-primary"
                onClick={() => startGenie(item.id, genieAction.label)}
              >
                <Icon className="h-3.5 w-3.5" />
                {genieAction.label}
              </Button>
            );
          })
        ))}
    </div>
  );
}
