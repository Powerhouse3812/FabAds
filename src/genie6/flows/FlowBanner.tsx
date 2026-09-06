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
            <span className="truncate" title={referenceLabel}>{referenceLabel}</span>
            {ctx.competitorOwned && (
              <span className="shrink-0 rounded-full border border-warning-text/30 bg-warning-text/10 px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wide text-warning-text">
                Competitor ad
              </span>
            )}
          </span>
        </Fact>

        <Divider />

        <Fact label="Action">{ctx.action.label}</Fact>

        <Link
          to={ctx.module.modulePath}
          aria-label={`Exit back to ${ctx.module.label}`}
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" />
          <span className="hidden sm:inline">Exit to {ctx.module.label}</span>
        </Link>
      </div>

      {/* Row 2 — Produces, on its own line so the sentence can be read.
          Row 1 is the scannable provenance (where from / what / which
          action); this is the payload: what the user is about to make. §6
          Rule 5 lists it as one of the four facts the banner must state, and
          a clipped promise is worse than no promise. */}
      <p className="flex items-start gap-1.5 border-t border-border/60 pt-1.5 text-[12px] text-foreground">
        <span className="mt-px shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
          Produces
        </span>
        <span className="font-medium">{ctx.produces}</span>
      </p>

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
  wrap = false,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  /**
   * Opt out of the shared 220px truncation.
   *
   * All four facts used to share it, which clipped "Produces" — a full
   * sentence, and the single fact §6 Rule 5 exists to deliver ("what will be
   * produced"). "A new ad, using this winner as your refe…" tells the user
   * nothing they didn't already fear. From/Action are short by construction
   * and Reference is a title that legitimately truncates; only this one needs
   * to wrap.
   */
  wrap?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", wrap ? "min-w-0 flex-1" : "min-w-0")}>
      <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-1 text-[12px] font-semibold text-foreground",
          wrap ? "min-w-0 flex-1" : "min-w-0 max-w-[220px] truncate",
        )}
      >
        {icon}
        {children}
      </span>
    </div>
  );
}
