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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resolveFlowContext } from "@/genie6/flows/data/resolveFlowContext";
import {
  Bookmark,
  FileText,
  Hammer,
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
import { flowSearchParams, type FlowActionId } from "@/genie6/flows/flowTypes";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type RelevanceValue = "relevant" | "not_relevant";

interface TrendActionsState {
  saved: Set<string>;
  watched: Set<string>;
  dismissed: Set<string>;
}

const EMPTY_STATE: TrendActionsState = {
  saved: new Set(),
  watched: new Set(),
  dismissed: new Set(),
};

let state: TrendActionsState = {
  saved: new Set(),
  watched: new Set(),
  dismissed: new Set(),
};

// Feedback-only signal from Relevant / Not Relevant — not surfaced through
// the hook's return type (no consumer needs it today), kept module-local so
// re-clicking the same choice doesn't re-toast identical feedback.
const relevanceById = new Map<string, RelevanceValue>();

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

export function useTrendActions(): {
  saved: Set<string>;
  watched: Set<string>;
  dismissed: Set<string>;
  toggleSave: (itemId: string) => void;
  toggleWatch: (itemId: string) => void;
  dismiss: (itemId: string) => void;
  undoDismiss: (itemId: string) => void;
  setRelevance: (itemId: string, relevance: RelevanceValue) => void;
} {
  const current = useSyncExternalStore(subscribe, snapshot, getServerSnapshot);

  return {
    saved: current.saved,
    watched: current.watched,
    dismissed: current.dismissed,
    toggleSave,
    toggleWatch,
    dismiss,
    undoDismiss,
    setRelevance,
  };
}

// ---------------------------------------------------------------------------
// Genie actions — Other Flows §7.4. The doc names three canonical actions
// with no per-source distinction ("§7.4 makes no such distinction"):
//   1. generate an ad against a trending hook or angle -> "generate-against-trend"
//   2. generate a script from a trend                 -> "script-from-trend"
//   3. variation off the trend's winner ads            -> "generate-variation"
//
// meta/tiktok already had richer, source-flavoured copy from before Other
// Flows existed — kept verbatim and mapped onto the same three ids rather
// than duplicated:
//   "Extract Winning Angle" (meta)   -> generate-against-trend (fills the
//     angle from the trend, same as §7.4's action 1)
//   "Remix Concept" (meta)           -> generate-variation (a remix of an
//     existing concept IS a variation, §7.4's action 3)
//   "Build Ad" (meta + tiktok)       -> generate-against-trend (the direct
//     1:1 match for action 1)
//   "Write Script" (tiktok)          -> script-from-trend (exact match,
//     action 2)
//   "Create Hook Variations" (tiktok)-> generate-variation (action 3)
//
// Every other TrendSourceType (news/report/podcast/google_trend/instagram/
// youtube/linkedin/x) gets the same three actions under generic labels —
// §7.4 draws no source distinction, so withholding them here would be this
// file inventing a boundary the doc doesn't ask for.
// ---------------------------------------------------------------------------

interface GenieAction {
  label: string;
  icon: LucideIcon;
  actionId: FlowActionId;
}

const GENERIC_GENIE_ACTIONS: GenieAction[] = [
  { label: "Build Ad", icon: Hammer, actionId: "generate-against-trend" },
  { label: "Write Script", icon: FileText, actionId: "script-from-trend" },
  { label: "Variation", icon: Wand2, actionId: "generate-variation" },
];

const GENIE_ACTIONS_BY_SOURCE: Record<TrendSourceType, GenieAction[]> = {
  meta: [
    { label: "Extract Winning Angle", icon: Target, actionId: "generate-against-trend" },
    { label: "Remix Concept", icon: Repeat2, actionId: "generate-variation" },
    { label: "Build Ad", icon: Hammer, actionId: "generate-against-trend" },
  ],
  tiktok: [
    { label: "Write Script", icon: FileText, actionId: "script-from-trend" },
    { label: "Create Hook Variations", icon: Wand2, actionId: "generate-variation" },
    { label: "Build Ad", icon: Hammer, actionId: "generate-against-trend" },
  ],
  news: GENERIC_GENIE_ACTIONS,
  report: GENERIC_GENIE_ACTIONS,
  podcast: GENERIC_GENIE_ACTIONS,
  google_trend: GENERIC_GENIE_ACTIONS,
  instagram: GENERIC_GENIE_ACTIONS,
  youtube: GENERIC_GENIE_ACTIONS,
  linkedin: GENERIC_GENIE_ACTIONS,
  x: GENERIC_GENIE_ACTIONS,
};

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
  const { saved, watched, toggleSave, toggleWatch, dismiss, setRelevance } = useTrendActions();
  const navigate = useNavigate();

  const isSaved = saved.has(item.id);
  const isWatched = watched.has(item.id);
  const genieActions = GENIE_ACTIONS_BY_SOURCE[item.type];

  /**
   * §7.4 — "Both" travel to Genie: the trend fills the angle, and its
   * supporting creatives arrive as references. That resolution (and the
   * universal redirect rules — asks-nothing for variation, entity-pick for
   * the rest) lives in resolveFlowContext()/Studio, not here. This bar's only
   * job is the handoff: module "trends", the trend's own id as refId, and
   * which action was chosen.
   */
  const goToGenie = (actionId: FlowActionId) => {
    const sp = flowSearchParams("trends", item.id, actionId);
    // Explicit step slug, same as SendToGenieMenu. The bare /studio-alpha
    // path landed on Studio HOME (mode picker) whenever the ref couldn't be
    // resolved — the user saw ?src=trends in the address bar and nothing else.
    const ctx = resolveFlowContext(sp);
    const target = ctx?.landingStep === 4 ? "configure" : "product";
    navigate(`/iq/genie6/studio-alpha/${target}?${sp.toString()}`);
  };

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

          {genieActions.map((genieAction) => {
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
                    onClick={() => goToGenie(genieAction.actionId)}
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{genieAction.label}</TooltipContent>
              </Tooltip>
            );
          })}
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

      {genieActions.map((genieAction) => {
        const Icon = genieAction.icon;
        return (
          <Button
            key={genieAction.label}
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/40 text-primary hover:text-primary"
            onClick={() => goToGenie(genieAction.actionId)}
          >
            <Icon className="h-3.5 w-3.5" />
            {genieAction.label}
          </Button>
        );
      })}
    </div>
  );
}
