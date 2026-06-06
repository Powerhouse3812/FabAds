/**
 * AccountsPages — Section 1 of Step 2. Two-step destination picker:
 *   1. pick ad account(s) from ACCOUNTS (multi-select)
 *   2. pick their pages (chips); each chosen page becomes a TargetPair via
 *      makeTargetV2 → flow.setTargets([...])
 *
 * Each page chip carries a live 250-cap meter (pageActiveAds) + pixel note.
 * Restricted accounts / capped pages are flagged.
 */
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Building2, CircleSlash, AlertTriangle, Check, Zap } from "lucide-react";
import { ACCOUNTS, makeTargetV2, pageActiveAds } from "../../../data";
import { MAX_ADS_PER_PAGE, type TargetPair } from "../../../types";
import { CapMeter } from "./CapMeter";

export function AccountsPages({
  targets,
  onChange,
}: {
  targets: TargetPair[];
  onChange: (t: TargetPair[]) => void;
}) {
  // Accounts surfaced = any account with a selected page, plus accounts the
  // user has expanded. We derive "selected accounts" from chosen targets and
  // let any account be toggled open to reveal its pages.
  const selectedAccountIds = useMemo(
    () => Array.from(new Set(targets.map((t) => t.accountId))),
    [targets],
  );
  const selectedPageKey = useMemo(
    () => new Set(targets.map((t) => `${t.accountId}:${t.pageId}`)),
    [targets],
  );

  const toggleAccount = (accountId: string) => {
    const on = selectedAccountIds.includes(accountId);
    if (on) {
      // remove the account → drop all its targets
      onChange(targets.filter((t) => t.accountId !== accountId));
    } else {
      // open the account (no pages yet) — represented by a soft selection.
      // We auto-select the first non-capped page for a light default.
      const acc = ACCOUNTS.find((a) => a.id === accountId);
      const firstOk = acc?.pages.find((p) => pageActiveAds(p.fbPageId) < MAX_ADS_PER_PAGE);
      if (acc && firstOk) {
        const t = makeTargetV2(accountId, firstOk.id);
        if (t) onChange([...targets, t]);
      } else {
        // capped/restricted: still open it (no auto page) by adding a sentinel-free no-op
        onChange([...targets]);
      }
    }
  };

  const togglePage = (accountId: string, pageId: string) => {
    const key = `${accountId}:${pageId}`;
    if (selectedPageKey.has(key)) {
      onChange(targets.filter((t) => `${t.accountId}:${t.pageId}` !== key));
    } else {
      const t = makeTargetV2(accountId, pageId);
      if (t) onChange([...targets, t]);
    }
  };

  // Which accounts to show pages for: those with a selected page OR explicitly opened.
  const openAccountIds = new Set(selectedAccountIds);

  return (
    <div className="space-y-4">
      {/* Step 1 — accounts (multi-select) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACCOUNTS.map((acc) => {
          const on = selectedAccountIds.includes(acc.id);
          const restricted = acc.status !== "active";
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => toggleAccount(acc.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                on ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
                restricted && "opacity-90",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                  on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {on ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{acc.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-mono">{acc.currency}</span>
                  <span>·</span>
                  <span>{acc.pages.length} pages</span>
                  {restricted && (
                    <span className="flex items-center gap-0.5 font-medium text-destructive">
                      <CircleSlash className="h-3 w-3" /> {acc.status}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Step 2 — pages for each chosen account */}
      {openAccountIds.size > 0 && (
        <div className="space-y-3">
          {ACCOUNTS.filter((a) => openAccountIds.has(a.id)).map((acc) => {
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
                          <CapMeter current={current} />
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
