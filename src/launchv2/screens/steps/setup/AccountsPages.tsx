/**
 * AccountsPages — Section 1 of Step 2. Two-step destination picker:
 *   1. pick ad account(s) from ACCOUNTS (multi-select). An account tile click
 *      only *opens/closes* its page drawer — it never silently mutates
 *      plan.targets. This decouples expand-state from selection-state so
 *      re-clicking an account doesn't nuke its selected pages.
 *   2. pick their pages (chips). The page chip click is the ONLY thing that
 *      mutates plan.targets via makeTargetV2 → onChange([...]).
 *
 * Each page chip carries a live 250-cap meter showing `current + planned`
 * (planned = perPageDemand(plan) from deriveV2) + pixel note. Restricted
 * accounts / capped pages are flagged.
 */
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Building2, CircleSlash, AlertTriangle, Check, Zap, ChevronDown, ChevronRight } from "lucide-react";
import { ACCOUNTS, makeTargetV2, pageActiveAds } from "../../../data";
import { MAX_ADS_PER_PAGE, type PlanV2, type TargetPair } from "../../../types";
import { perPageDemand } from "../../../deriveV2";
import { CapMeter } from "./CapMeter";

export function AccountsPages({
  plan,
  targets,
  onChange,
}: {
  plan: PlanV2;
  targets: TargetPair[];
  onChange: (t: TargetPair[]) => void;
}) {
  // Which account tiles are currently expanded (drawer open). Drives ONLY
  // the page-drawer visibility — never plan.targets. Selection state lives
  // entirely in `targets`.
  const [openAccounts, setOpenAccounts] = useState<Set<string>>(() => {
    // Initialize open for any account that already has a selected page, so
    // returning users see their previously chosen pages without an extra click.
    return new Set(targets.map((t) => t.accountId));
  });

  const selectedAccountIds = useMemo(
    () => new Set(targets.map((t) => t.accountId)),
    [targets],
  );
  const selectedPageKey = useMemo(
    () => new Set(targets.map((t) => `${t.accountId}:${t.pageId}`)),
    [targets],
  );

  // Planned-ads-per-page from current plan (creatives × spread × dest count),
  // keyed by fbPageId so we can show `current + planned` on every selected
  // chip's CapMeter — not just the live count.
  const demandByPage = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of perPageDemand(plan)) map.set(d.fbPageId, d.demand);
    return map;
  }, [plan]);

  // Account tile click — toggles drawer open/closed. No flow.patch, no
  // onChange. Selection is unaffected.
  const toggleAccountOpen = (accountId: string) => {
    setOpenAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  // Page chip click — the ONLY place plan.targets is mutated.
  const togglePage = (accountId: string, pageId: string) => {
    const key = `${accountId}:${pageId}`;
    if (selectedPageKey.has(key)) {
      onChange(targets.filter((t) => `${t.accountId}:${t.pageId}` !== key));
    } else {
      const t = makeTargetV2(accountId, pageId);
      if (t) onChange([...targets, t]);
      // Keep the drawer open so the user can see what they just picked.
      setOpenAccounts((prev) => {
        if (prev.has(accountId)) return prev;
        const next = new Set(prev);
        next.add(accountId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1 — accounts (multi-select drawer toggles) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACCOUNTS.map((acc) => {
          const isOpen = openAccounts.has(acc.id);
          const hasSelection = selectedAccountIds.has(acc.id);
          const selectedCount = targets.filter((t) => t.accountId === acc.id).length;
          const restricted = acc.status !== "active";
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => toggleAccountOpen(acc.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                hasSelection
                  ? "border-primary bg-primary/5"
                  : isOpen
                    ? "border-border bg-accent"
                    : "border-border bg-card hover:bg-accent",
                restricted && "opacity-90",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                  hasSelection ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {hasSelection ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{acc.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-mono">{acc.currency}</span>
                  <span>·</span>
                  <span>{acc.pages.length} pages</span>
                  {hasSelection && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-primary">
                        {selectedCount} selected
                      </span>
                    </>
                  )}
                  {restricted && (
                    <span className="flex items-center gap-0.5 font-medium text-destructive">
                      <CircleSlash className="h-3 w-3" /> {acc.status}
                    </span>
                  )}
                </span>
                {/* "select pages" affordance — visible when collapsed AND no
                    pages picked yet, so the user knows the next move. */}
                {!isOpen && !hasSelection && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary">
                    <ChevronRight className="h-3 w-3" /> select pages
                  </span>
                )}
              </span>
              <span className="flex-shrink-0 text-muted-foreground">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step 2 — pages for each expanded account (drawer driven by
          openAccounts, NOT by selection state). */}
      {openAccounts.size > 0 && (
        <div className="space-y-3">
          {ACCOUNTS.filter((a) => openAccounts.has(a.id)).map((acc) => {
            const restricted = acc.status !== "active";
            return (
              <div key={acc.id} className="rounded-2xl border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{acc.name}</span>
                  {restricted && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Account in review — delivery limited
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {acc.pages.map((pg) => {
                    const key = `${acc.id}:${pg.id}`;
                    const on = selectedPageKey.has(key);
                    const current = pageActiveAds(pg.fbPageId);
                    // Planned demand only counts when this page is part of
                    // the current plan — perPageDemand keys off plan.targets,
                    // so an unselected page has no planned ads against it.
                    const planned = on ? demandByPage.get(pg.fbPageId) ?? 0 : 0;
                    const full = current >= MAX_ADS_PER_PAGE;
                    const pixel = acc.pixels[0];
                    return (
                      <button
                        key={pg.id}
                        type="button"
                        onClick={() => togglePage(acc.id, pg.id)}
                        disabled={full && !on}
                        className={cn(
                          "flex flex-col gap-1.5 rounded-2xl border px-3 py-2 text-left transition-colors",
                          on ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
                          full && !on && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full border",
                              on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                            )}
                          >
                            {on && <Check className="h-3 w-3" />}
                          </span>
                          <span className="text-sm font-medium text-foreground">{pg.name}</span>
                          {full && (
                            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                              At cap
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2 pl-[1.375rem]">
                          <CapMeter current={current} demand={planned} />
                          {pixel && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Zap className="h-3 w-3" /> {pixel.name}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {targets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Pick at least one ad account, then choose its destination Page(s).
        </p>
      )}
    </div>
  );
}
