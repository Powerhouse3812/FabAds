import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlowContext } from "./flowTypes";
import { resolveIcon } from "./icons";

/**
 * FlowBanner — Rule 5, the thread the user never loses.
 *
 * "A persistent banner runs through the whole flow, stating the source
 * module, the reference, the action chosen, and what will be produced. It
 * carries an exit." One horizontal band, all four facts, compact enough to
 * sit above a wizard without eating the canvas — it is a strip, not a card.
 *
 * Mounted by the Studio agent on every step once `resolveFlowContext(sp)`
 * returns non-null. This component also reads the URL itself (not just the
 * `ctx` prop) for the one case where the source truth was edited AFTER the
 * registry resolved it: Campaign Urls' extraction card (FlowModuleDetail +
 * CampaignExtractionCard, §7.5) writes the user's edited product name into
 * `xp` before navigating, specifically so an edit "visibly persists into the
 * banner copy" instead of the banner quoting the stale, possibly-wrong,
 * auto-extracted title.
 */
export function FlowBanner({ ctx, className }: { ctx: FlowContext; className?: string }) {
  const [searchParams] = useSearchParams();
  const ModuleIcon = resolveIcon(ctx.module.icon);

  const isCampaignUrls = ctx.module.key === "campaign-urls";
  const editedProduct = isCampaignUrls ? searchParams.get("xp") : null;
  const referenceLabel = editedProduct?.trim() ? editedProduct : ctx.ref.title;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <Fact label="From" icon={<ModuleIcon className="h-3 w-3" />}>
          {ctx.module.label}
        </Fact>

        <Divider />

        <Fact label="Reference">
          <span className="flex items-center gap-1.5">
            <span className="truncate">{referenceLabel}</span>
            {ctx.competitorOwned && (
              <span className="shrink-0 rounded-full border border-warning-text/30 bg-warning-text/10 px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wide text-warning-text">
                Competitor ad
              </span>
            )}
          </span>
        </Fact>

        <Divider />

        <Fact label="Action">{ctx.action.label}</Fact>

        <Divider />

        <Fact label="Produces">{ctx.produces}</Fact>

        <Link
          to={ctx.module.modulePath}
          aria-label={`Exit back to ${ctx.module.label}`}
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" />
          <span className="hidden sm:inline">Exit to {ctx.module.label}</span>
        </Link>
      </div>

      {ctx.caveat && (
        <p className="flex items-center gap-1.5 border-t border-border/60 pt-1.5 text-[11px] font-medium text-warning-text">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {ctx.caveat}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />;
}

function Fact({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
        {label}
      </span>
      <span className="flex min-w-0 max-w-[220px] items-center gap-1 truncate text-[12px] font-semibold text-foreground">
        {icon}
        {children}
      </span>
    </div>
  );
}
