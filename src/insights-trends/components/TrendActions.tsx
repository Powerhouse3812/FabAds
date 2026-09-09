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
import { FLOW_ACTIONS } from "@/genie6/flows/data/flowRegistry";
import {
  Bookmark,
  FileText,
  type LucideIcon,
  Radar,
  Share2,
  Target,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TrendItem } from "@/insights-trends/types";
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

/**
 * Maps a resolved flow's `landingStep` to the `/iq/genie6/studio-alpha/:step`
 * route slug. Source of truth for the slugs themselves is StudioAlpha.tsx's
 * own `STEP_TO_SLUG` (READ ONLY, not duplicated here — only the routing
 * decision is).
 *
 * `landingStep` used to be a literal `asksNothing ? 4 : 2` — this file's old
 * `ctx?.landingStep === 4 ? "configure" : "product"` ternary baked that in.
 * It's now derived from the generation step plan and can legitimately be 1
 * (an Ad always starts at Mode & Format), so the two-value ternary silently
 * skipped that step for every non-variation flow. This function is the fix:
 * 1 -> format, 4 -> configure (§7 Rule 1, variation asks nothing — unchanged),
 * anything else (2, or an unrecognized value / ctx resolving to null) ->
 * product, the entity-pick step — a safe landing rather than guessing wrong.
 *
 * Ideal home: this is identical in SendToGenieMenu.tsx, FlowModuleDetail.tsx
 * and RecentlyFetchedCard.tsx. Its natural shared home is next to
 * `flowSearchParams` in `@/genie6/flows/flowTypes` (or beside
 * `resolveFlowContext` in `@/genie6/flows/data/resolveFlowContext`) — both
 * outside this task's four owned files, so it's duplicated here rather than
 * reached into.
 */
function landingStepToSlug(landingStep: number | undefined): "format" | "product" | "configure" {
  switch (landingStep) {
    case 1:
      return "format";
    case 4:
      return "configure";
    default:
      return "product";
  }
}

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
// Genie actions — Other Flows §7.4. FLOW_MODULES["trends"].actions in
// flowRegistry.ts (READ ONLY — owned by the flow-data agent) names FOUR ids
// for this module (it named three until 2026-09-09), with no per-source
// distinction:
//   1. generate an ad against a trending hook or angle -> "generate-against-trend"
//   2. use this trend's angle                          -> "script-from-trend"
//   3. use this trend's hook line                      -> "use-hook"
//   4. variation off the trend's winner ads            -> "generate-variation"
//
// This list must stay in step with that one: an id here that the module
// doesn't list makes `resolveFlowContext` reject the button's own URL and
// hand the user a bare, unbannered wizard; an id there that's missing here is
// an action that only exists in the Other Flows hub and never on the feed
// people actually read — which is exactly how `use-hook` shipped invisible.
//
// Labels are read straight off FLOW_ACTIONS (the same lookup the persistent
// flow banner uses via resolveFlowContext -> ctx.action.label) so a button's
// wording can never diverge from what the banner says next. This used to be
// two duplicated pairs of custom per-source copy — "Extract Winning Angle"
// and "Build Ad" both silently routed to generate-against-trend, "Remix
// Concept" (meta) and "Create Hook Variations" (tiktok) both routed to
// generate-variation — so a user who clicked "Extract Winning Angle" landed
// on a banner reading "Generate against this trend" instead. One shared list,
// three distinct actions, three buttons, for every TrendSourceType — §7.4
// draws no source distinction, so a per-source split here would just be this
// file inventing a boundary the doc doesn't ask for.
// ---------------------------------------------------------------------------

interface GenieAction {
  label: string;
  icon: LucideIcon;
  actionId: FlowActionId;
  /**
   * Per-trend availability. Omitted = always offered (the three actions every
   * row can back with its own data). `use-hook` is the first action gated on
   * what a specific row carries — see the note under GENIE_ACTIONS.
   */
  isAvailable?: (item: TrendItem) => boolean;
}

const GENIE_ACTIONS: GenieAction[] = [
  {
    label: FLOW_ACTIONS["generate-against-trend"].label,
    icon: Target,
    actionId: "generate-against-trend",
  },
  {
    label: FLOW_ACTIONS["script-from-trend"].label,
    icon: FileText,
    actionId: "script-from-trend",
  },
  {
    label: FLOW_ACTIONS["use-hook"].label,
    icon: Zap,
    actionId: "use-hook",
    isAvailable: (item) => Boolean(item.hook),
  },
  {
    label: FLOW_ACTIONS["generate-variation"].label,
    icon: Wand2,
    actionId: "generate-variation",
  },
];

/**
 * HIDDEN, NOT DISABLED, on a hookless trend — deliberate, and the two reasons
 * are different in kind:
 *
 * 1. A disabled control is a promise that something will enable it. "Needs
 *    analysis" (SendToGenieMenu, FlowModuleDetail) is honest that way — the
 *    user can go analyse the ad. Trends has NO analysis step; `blockedReason`
 *    exists precisely because the generic sentence would be a lie here. A
 *    hookless trend can never grow a hook, so a permanently dead control
 *    teaches nothing and costs a slot in a nine-button row.
 * 2. This component has no blocked affordance to reuse. Its card variant is
 *    icon-only, and a natively-`disabled` button leaves the tab order, taking
 *    the tooltip that would carry `blockedReason` with it — the reason would
 *    be unreachable by keyboard and unannounced by a screen reader, which is
 *    worse than not offering the action at all.
 *
 * Hiding is also self-explaining here: TrendCard renders the hook line as the
 * card's own quote (`getHookLine`), so "Use hook" appears exactly on the rows
 * where the user can already see the hook it would carry.
 *
 * The gate is `Boolean(item.hook)` — the same boolean `trendRef()` turns into
 * `analysed`, which is now what `resolveFlowContext` gates `requiresAnalysis`
 * actions on. So the button renders if and only if the URL it builds resolves.
 */
function availableGenieActions(item: TrendItem): GenieAction[] {
  return GENIE_ACTIONS.filter((a) => !a.isAvailable || a.isAvailable(item));
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
  const { saved, watched, toggleSave, toggleWatch, dismiss, setRelevance } = useTrendActions();
  const navigate = useNavigate();

  const isSaved = saved.has(item.id);
  const isWatched = watched.has(item.id);
  const genieActions = availableGenieActions(item);

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
    const target = landingStepToSlug(ctx?.landingStep);
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
