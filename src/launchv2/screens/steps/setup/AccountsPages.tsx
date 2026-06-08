import { useMemo, useState } from "react";
import { CircleSlash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCOUNTS, makeTargetV2 } from "../../../data";
import { perPageDemand } from "../../../deriveV2";
import type { PlanV2, TargetPair } from "../../../types";
import { AccountDestinationCard } from "./AccountDestinationCard";

export function AccountsPages({
  plan,
  targets,
  onChange,
}: {
  plan: PlanV2;
  targets: TargetPair[];
  onChange: (t: TargetPair[]) => void;
}) {
  // Accounts whose cards are currently visible (open in the UI).
  // Initialized from any accounts already in targets (returning users see their cards).
  const [openAccounts, setOpenAccounts] = useState<Set<string>>(
    () => new Set(targets.map((t) => t.accountId)),
  );

  // Set of page.id values selected per accountId
  const selectedPagesByAccount = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const t of targets) {
      if (!map.has(t.accountId)) map.set(t.accountId, new Set());
      map.get(t.accountId)!.add(t.pageId);
    }
    return map;
  }, [targets]);

  // fbPageId → planned demand (how many new ads this plan adds to that page)
  const demandByPage = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of perPageDemand(plan)) map.set(d.fbPageId, d.demand);
    return map;
  }, [plan]);

  // Get the current pixel selection for a given accountId
  const accountPixelId = (accountId: string): string | undefined =>
    targets.find((t) => t.accountId === accountId)?.pixelId;

  const handleTogglePage = (accountId: string, pageId: string) => {
    const alreadySelected = targets.some(
      (t) => t.accountId === accountId && t.pageId === pageId,
    );
    if (alreadySelected) {
      onChange(
        targets.filter(
          (t) => !(t.accountId === accountId && t.pageId === pageId),
        ),
      );
    } else {
      const newTarget = makeTargetV2(accountId, pageId);
      if (newTarget) {
        // Inherit the current pixel selection for this account (if user changed it)
        const existingPixelId = targets.find(
          (t) => t.accountId === accountId,
        )?.pixelId;
        onChange([
          ...targets,
          { ...newTarget, pixelId: existingPixelId ?? newTarget.pixelId },
        ]);
      }
    }
  };

  const handleSetPixel = (accountId: string, pixelId: string | undefined) => {
    onChange(
      targets.map((t) => (t.accountId === accountId ? { ...t, pixelId } : t)),
    );
  };

  const handleRemove = (accountId: string) => {
    onChange(targets.filter((t) => t.accountId !== accountId));
    setOpenAccounts((prev) => {
      const next = new Set(prev);
      next.delete(accountId);
      return next;
    });
  };

  const handleAddAccount = (accountId: string) => {
    setOpenAccounts((prev) => new Set([...prev, accountId]));
  };

  return (
    <div className="space-y-3">
      {/* Active account cards */}
      {openAccounts.size > 0 && (
        <div className="space-y-2">
          {ACCOUNTS.filter((acc) => openAccounts.has(acc.id)).map((acc) => (
            <AccountDestinationCard
              key={acc.id}
              account={acc}
              selectedPageIds={selectedPagesByAccount.get(acc.id) ?? new Set()}
              pixelId={accountPixelId(acc.id)}
              demandByPage={demandByPage}
              onTogglePage={(pgId) => handleTogglePage(acc.id, pgId)}
              onSetPixel={(pxId) => handleSetPixel(acc.id, pxId)}
              onRemove={() => handleRemove(acc.id)}
            />
          ))}
        </div>
      )}

      {/* Add destination — accounts not yet open */}
      {ACCOUNTS.some((acc) => !openAccounts.has(acc.id)) && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            {openAccounts.size > 0
              ? "Add another destination"
              : "Select a destination"}
          </span>
          <div className="flex flex-wrap gap-2">
            {ACCOUNTS.filter((acc) => !openAccounts.has(acc.id)).map((acc) => {
              const restricted = acc.status !== "active";
              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={restricted}
                  onClick={() => handleAddAccount(acc.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2 text-left text-sm font-medium transition-colors",
                    restricted
                      ? "cursor-not-allowed border-border/40 text-muted-foreground/50"
                      : "border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-foreground",
                  )}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{acc.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {acc.currency}
                  </span>
                  {restricted && (
                    <CircleSlash className="h-3.5 w-3.5 shrink-0 text-destructive/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint when cards open but no pages selected */}
      {openAccounts.size > 0 && targets.length === 0 && (
        <p className="text-[11px] text-amber-600">
          Select at least one Page inside an account card to continue.
        </p>
      )}

      {/* Fallback empty state (no accounts at all in mock data) */}
      {ACCOUNTS.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No ad accounts connected. Add an account in Integrations.
        </p>
      )}
    </div>
  );
}
