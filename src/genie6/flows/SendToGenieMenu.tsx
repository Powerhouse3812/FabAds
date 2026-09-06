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
import type { FlowAction, FlowModuleKey } from "./flowTypes";
import { flowSearchParams } from "./flowTypes";
import { actionsForModule, getFlowModule } from "./data/flowRegistry";
import { getFlowSource } from "./data/flowSources";
import { resolveFlowContext } from "./data/resolveFlowContext";
import { resolveIcon } from "./icons";

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
    const target = ctx?.landingStep === 4 ? "configure" : "product";
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
      <DropdownMenuContent align={align} className="min-w-60">
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
            // catalogue doesn't carry (~794 of 800 Insights ads).
            const blocked = Boolean(action.requiresAnalysis) && !ref?.analysed;
            return (
              <DropdownMenuItem
                key={action.id}
                disabled={blocked}
                onSelect={() => !blocked && go(action)}
                className="flex items-center gap-2"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{action.label}</span>
                {blocked && (
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                    needs analysis
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
