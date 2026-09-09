import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FlowAction, FlowModuleKey, FlowSourceRef } from "./flowTypes";
import { flowSearchParams } from "./flowTypes";
import { actionsForModule, getFlowModule } from "./data/flowRegistry";
import { getFlowSource } from "./data/flowSources";
import { missingCarriedScriptReason, resolveFlowContext } from "./data/resolveFlowContext";
import { resolveIcon } from "./icons";

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
 * Ideal home: this is identical in FlowModuleDetail.tsx, TrendActions.tsx and
 * RecentlyFetchedCard.tsx. Its natural shared home is next to
 * `flowSearchParams` in `./flowTypes` (or beside `resolveFlowContext` in
 * `./data/resolveFlowContext`) — both outside this task's four owned files,
 * so it's duplicated here rather than reached into.
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

/**
 * Why a blocked row shows a TAG and not its sentence (2026-09-09).
 *
 * The reason strings are real sentences — "No script on this one — only an
 * analysed Video Sage video carries one" is 69 characters. Rendered inline in
 * a `shrink-0` span next to a `truncate`d action label, the sentence took
 * every pixel it wanted and the label gave way: the action NAME clipped while
 * the error caption ran full width, and the menu itself (no max-width) grew
 * past 500px at all 8 mount sites. Backwards — the label is what the user is
 * reading the menu to find; the reason is secondary and only matters on the
 * rows they can't pick.
 *
 * So: a two-word tag in the row, the full sentence on `title` (and the menu
 * gets a max-width, so a long ACTION label truncates instead of stretching).
 *
 * @returns the short tag and the full sentence, in FlowModuleDetail's
 *          `isUnpickable` precedence — analysis FIRST, script second. The two
 *          surfaces disagreed: Video Sage's failed row is both unanalysed and
 *          script-less, and script-first made it report "no script" when the
 *          truth the user can act on is that the analysis failed.
 */
function blockedNote(
  action: FlowAction,
  ref: FlowSourceRef | undefined,
  moduleLabel: string | undefined,
): { tag: string; reason: string } | null {
  if (action.requiresAnalysis && !ref?.analysed) {
    return {
      // A ref that words its own reason is NOT telling the generic analysis
      // story — Trends has no analysis step at all, and a hookless trend is
      // blocked because the feed never carried a hook. Tag it off what the
      // action needed ("No hook") rather than sending the user to look for
      // an Analyse control that does not exist.
      tag: ref?.blockedReason ? (action.source !== "none" ? `No ${action.source}` : "Unavailable") : "Needs analysis",
      reason: ref?.blockedReason ?? `Needs analysis in ${moduleLabel ?? "the source module"} before this action`,
    };
  }
  const noScript = missingCarriedScriptReason(action, ref);
  if (noScript) return { tag: "No script", reason: noScript };
  return null;
}

/**
 * SendToGenieMenu — Rule 6, the module-side entry point.
 *
 * "Send to Other Apps" is not only a Library action — the same option
 * appears in Reports, Industry Insights and Video Sage (§6). Rather than
 * each of those hosts re-implementing the redirect rules, they mount THIS
 * dropdown with their own module key + the id of the row/card the user is
 * on. It performs the exact same navigation FlowModuleDetail does — this is
 * the compact, one-click version of that page, for when the user has
 * already picked their reference by being on that row.
 *
 * Radix DropdownMenu is exempt from the app's no-outside-click-dismiss rule,
 * so no onPointerDownOutside/onInteractOutside guards are needed here.
 */
export function SendToGenieMenu({
  module,
  refId,
  align = "end",
  trigger,
  className,
}: {
  module: FlowModuleKey;
  refId: string;
  align?: "start" | "end";
  trigger?: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  const mod = getFlowModule(module);
  const actions = mod ? actionsForModule(module) : [];
  const ref = getFlowSource(refId);

  function go(action: FlowAction) {
    if (module === "campaign-urls") {
      // Campaign Urls always needs its extraction reviewed before Studio
      // (§7.5) — route through the detail page instead of jumping straight
      // in, so that card still gets a chance to run.
      navigate(`/iq/genie6/flows/campaign-urls?action=${action.id}&ref=${encodeURIComponent(refId)}`);
      return;
    }
    const sp = flowSearchParams(module, refId, action.id);
    if (action.toOtherApps) {
      navigate(`/iq/genie6/apps?${sp.toString()}`);
      return;
    }
    const ctx = resolveFlowContext(sp);
    const target = landingStepToSlug(ctx?.landingStep);
    navigate(`/iq/genie6/studio-alpha/${target}?${sp.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label="Send to Genie"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              className,
            )}
          >
            <Wand2 className="h-4 w-4" />
            <span className="sr-only">Send to Genie</span>
          </button>
        )}
      </DropdownMenuTrigger>
      {/* max-w caps the menu so a long ACTION label truncates inside it
          rather than widening it — without one, `min-w-60` has no upper
          bound and the widest row dictates the whole menu. Viewport-relative
          so it can't overflow a narrow window. */}
      <DropdownMenuContent align={align} className="min-w-60 max-w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuLabel className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Send to Genie{mod ? ` · ${mod.label}` : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.length === 0 ? (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">No actions available yet</div>
        ) : (
          actions.map((action) => {
            const Icon = resolveIcon(action.icon);
            // Fail CLOSED on an unknown ref: `ref !== undefined && …` left
            // every analysis-gated action enabled for any row the source
            // catalogue doesn't carry (~794 of 800 Insights ads). Both
            // reasons, in FlowModuleDetail's order — see `blockedNote`.
            const note = blockedNote(action, ref, mod?.label);
            const blocked = !!note;
            return (
              <DropdownMenuItem
                key={action.id}
                disabled={blocked}
                onSelect={() => !blocked && go(action)}
                title={note?.reason}
                className="flex items-center gap-2"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{action.label}</span>
                {note && (
                  <span
                    title={note.reason}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                  >
                    {note.tag}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
