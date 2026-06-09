/**
 * AccountsPages — Step 2 §1: dual dropdown pickers for ad accounts + pages.
 *
 * Account picker:  full-width trigger → popover with cmdk search, status-aware rows,
 *                  recently-used chips below.
 * Page picker:     same pattern, grouped by account, enabled only when ≥1 account open.
 * Pixel section:   compact row per selected account with pixel select dropdown.
 *
 * State model: `openAccountIds` tracks accounts visible in the page picker.
 * `targets` (TargetPair[]) is the canonical source of truth for account+page selections.
 */

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, RotateCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNTS, makeTargetV2, pageActiveAds } from "../../../data";
import { perPageDemand } from "../../../deriveV2";
import type { PlanV2, TargetPair, MAX_ADS_PER_PAGE as _MaxType } from "../../../types";
import { MAX_ADS_PER_PAGE } from "../../../types";

/* ─── BM display names (mock, keyed by accountId) ─────────────────────────── */
const BM_NAMES: Record<string, string> = {
  act_acme_us: "Idea Clan — BM Global",
  act_mamaearth: "Idea Clan — BM IN",
  act_boat: "",       // disconnected — BM row won't render
  act_noise: "",      // active, no BM assigned
  act_sleepy: "Idea Clan — BM IN",
};

/* ─── Custom checkbox ──────────────────────────────────────────────────────── */
function Checkbox({
  checked,
  disabled,
}: {
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-all",
        checked
          ? "border-primary bg-primary"
          : "border-border",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" className="shrink-0">
          <path
            d="M1 3.5L3.2 6L8 1"
            stroke="#121212"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/* ─── Account row (plain div — no CommandItem to avoid focus conflicts) ───── */
function AccountRow({
  account,
  selected,
  onToggle,
}: {
  account: (typeof ACCOUNTS)[number];
  selected: boolean;
  onToggle: () => void;
}) {
  const isRestricted = account.status === "restricted";
  const isDisabled = account.status === "disabled";
  const inactive = isRestricted || isDisabled;
  const bmName = BM_NAMES[account.id];

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        if (!inactive) onToggle();
      }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors",
        inactive ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <Checkbox checked={selected} disabled={inactive} />

      {/* Name */}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          inactive ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {account.name}
      </span>

      {/* Currency badge */}
      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {account.currency}
      </span>

      {/* Right side — status / BM */}
      {isRestricted ? (
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Disconnected
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              /* mock reconnect — no-op */
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors"
          >
            <RotateCw className="h-3 w-3" />
            Reconnect
          </button>
        </div>
      ) : isDisabled ? (
        <span className="shrink-0 text-[11px] italic text-muted-foreground/60">
          Disabled
        </span>
      ) : bmName ? (
        <span className="shrink-0 text-xs text-muted-foreground">{bmName}</span>
      ) : (
        <span className="shrink-0 text-[11px] text-muted-foreground/60">
          No BM assigned
        </span>
      )}
    </div>
  );
}

/* ─── Page row ─────────────────────────────────────────────────────────────── */
function PageRow({
  page,
  accountName,
  selected,
  onToggle,
}: {
  page: { id: string; fbPageId: string; name: string; activeAds: number };
  accountName: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const activeAds = pageActiveAds(page.fbPageId);
  const atCap = activeAds >= MAX_ADS_PER_PAGE;
  const nearCap = !atCap && activeAds >= 200;

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        if (!atCap) onToggle();
      }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors",
        atCap
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-muted/40",
      )}
    >
      <Checkbox checked={selected} disabled={atCap} />

      {/* Names */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {page.name}
        </span>
        <span className="block truncate font-mono text-[10px] text-muted-foreground/60">
          {accountName}
        </span>
      </div>

      {/* Cap info */}
      {atCap ? (
        <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
          At cap
        </span>
      ) : (
        <span
          className={cn(
            "shrink-0 font-mono text-[10px] tabular-nums",
            nearCap
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground/60",
          )}
        >
          {activeAds}/{MAX_ADS_PER_PAGE}
        </span>
      )}
    </div>
  );
}

/* ─── Recently-used chips ──────────────────────────────────────────────────── */
function RecentChips<T extends { id: string; name: string }>({
  items,
  selectedIds,
  onToggle,
}: {
  items: T[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="self-center font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        Recently used
      </span>
      {items.map((item) => {
        const on = selectedIds.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              on
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {on && <Check className="h-3 w-3 text-primary" />}
            {item.name.split(" — ")[0]}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
export function AccountsPages({
  plan,
  targets,
  onChange,
}: {
  plan: PlanV2;
  targets: TargetPair[];
  onChange: (t: TargetPair[]) => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);

  // Accounts "open" in the page picker — starts with accounts already in targets
  const [openAccountIds, setOpenAccountIds] = useState<Set<string>>(
    () => new Set(targets.map((t) => t.accountId)),
  );

  /* ── Derived ── */
  const selectedAccountIds = useMemo(
    () => new Set(targets.map((t) => t.accountId)),
    [targets],
  );

  const selectedPagesByAccount = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const t of targets) {
      if (!map.has(t.accountId)) map.set(t.accountId, new Set());
      map.get(t.accountId)!.add(t.pageId);
    }
    return map;
  }, [targets]);

  const demandByPage = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of perPageDemand(plan)) map.set(d.fbPageId, d.demand);
    return map;
  }, [plan]);

  /* ── Recently used ── */
  // Top 3 accounts by total activeAds across their pages (desc)
  const recentAccounts = useMemo(() => {
    return [...ACCOUNTS]
      .filter((a) => a.status === "active")
      .sort(
        (a, b) =>
          b.pages.reduce((s, p) => s + p.activeAds, 0) -
          a.pages.reduce((s, p) => s + p.activeAds, 0),
      )
      .slice(0, 3);
  }, []);

  // Top 3 pages from open accounts, sorted by activeAds desc
  const recentPages = useMemo(() => {
    const pages: Array<{ id: string; name: string; accountId: string; fbPageId: string; activeAds: number }> = [];
    for (const accountId of openAccountIds) {
      const acc = ACCOUNTS.find((a) => a.id === accountId);
      if (!acc) continue;
      for (const pg of acc.pages) {
        const ads = pageActiveAds(pg.fbPageId);
        if (ads < MAX_ADS_PER_PAGE) {
          pages.push({ id: pg.id, name: pg.name, accountId, fbPageId: pg.fbPageId, activeAds: ads });
        }
      }
    }
    return pages.sort((a, b) => b.activeAds - a.activeAds).slice(0, 3);
  }, [openAccountIds]);

  /* ── Account selection ── */
  // Combined set: all ids that are either in targets or in openAccountIds
  const allSelectedIds: Set<string> = useMemo(
    () => new Set([...selectedAccountIds, ...openAccountIds]),
    [selectedAccountIds, openAccountIds],
  );

  const toggleAccount = (accountId: string) => {
    const alreadyOpen = openAccountIds.has(accountId);
    if (alreadyOpen) {
      // Deselect: remove from open, remove all targets for this account
      setOpenAccountIds((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
      onChange(targets.filter((t) => t.accountId !== accountId));
    } else {
      setOpenAccountIds((prev) => new Set([...prev, accountId]));
      // Don't auto-add pages — user picks pages explicitly
    }
  };

  /* ── Page selection ── */
  const togglePage = (accountId: string, pageId: string) => {
    const already = targets.some(
      (t) => t.accountId === accountId && t.pageId === pageId,
    );
    if (already) {
      onChange(
        targets.filter(
          (t) => !(t.accountId === accountId && t.pageId === pageId),
        ),
      );
    } else {
      const newTarget = makeTargetV2(accountId, pageId);
      if (newTarget) {
        const existingPixel = targets.find(
          (t) => t.accountId === accountId,
        )?.pixelId;
        onChange([
          ...targets,
          { ...newTarget, pixelId: existingPixel ?? newTarget.pixelId },
        ]);
      }
    }
  };

  /* ── Pixel assignment ── */
  const accountPixelId = (accountId: string): string | undefined =>
    targets.find((t) => t.accountId === accountId)?.pixelId;

  const setPixel = (accountId: string, pixelId: string | undefined) => {
    onChange(
      targets.map((t) =>
        t.accountId === accountId ? { ...t, pixelId } : t,
      ),
    );
  };

  /* ── Counts ── */
  const accountCount = openAccountIds.size;
  const pageCount = targets.length;
  const hasAccounts = accountCount > 0;

  /* ── Page picker: only pages from open accounts ── */
  const openAccountList = ACCOUNTS.filter((a) => openAccountIds.has(a.id));

  /* ── All selected page ids as a flat set ── */
  const allSelectedPageIds = useMemo(
    () => new Set(targets.map((t) => t.pageId)),
    [targets],
  );

  return (
    <div className="space-y-4">
      {/* ─── Account picker ──────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Ad accounts
        </span>

        <Popover open={accountOpen} onOpenChange={setAccountOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              <span>
                {accountCount > 0
                  ? `${accountCount} account${accountCount !== 1 ? "s" : ""} selected`
                  : "Select ad accounts…"}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[480px] rounded-2xl border border-border bg-card p-0 shadow-md"
            align="start"
            sideOffset={6}
          >
            <Command>
              <CommandInput placeholder="Search accounts…" className="h-9" />
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No accounts found.</CommandEmpty>
                <CommandGroup>
                  {ACCOUNTS.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      selected={allSelectedIds.has(account.id)}
                      onToggle={() => toggleAccount(account.id)}
                    />
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Recently used accounts */}
        <RecentChips
          items={recentAccounts}
          selectedIds={allSelectedIds}
          onToggle={(id) => {
            const acc = ACCOUNTS.find((a) => a.id === id);
            if (acc && acc.status === "active") toggleAccount(id);
          }}
        />
      </div>

      {/* ─── Page picker ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <span
          className={cn(
            "text-xs font-medium",
            hasAccounts ? "text-muted-foreground" : "text-muted-foreground/50",
          )}
        >
          Pages
        </span>

        <Popover
          open={pageOpen}
          onOpenChange={(v) => {
            if (hasAccounts) setPageOpen(v);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!hasAccounts}
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm transition-colors",
                hasAccounts
                  ? "text-muted-foreground hover:border-foreground/30"
                  : "cursor-not-allowed opacity-50 text-muted-foreground",
              )}
            >
              <span>
                {pageCount > 0
                  ? `${pageCount} page${pageCount !== 1 ? "s" : ""} selected`
                  : "Select pages…"}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[480px] rounded-2xl border border-border bg-card p-0 shadow-md"
            align="start"
            sideOffset={6}
          >
            <Command>
              <CommandInput placeholder="Search pages…" className="h-9" />
              <CommandList className="max-h-[280px]">
                <CommandEmpty>No pages found.</CommandEmpty>
                {openAccountList.map((account) => (
                  <CommandGroup key={account.id} heading={account.name}>
                    {account.pages.map((pg) => (
                      <PageRow
                        key={pg.id}
                        page={pg}
                        accountName={account.name}
                        selected={
                          selectedPagesByAccount.get(account.id)?.has(pg.id) ??
                          false
                        }
                        onToggle={() => togglePage(account.id, pg.id)}
                      />
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Recently used pages (only pages not at cap) */}
        {hasAccounts && (
          <RecentChips
            items={recentPages}
            selectedIds={allSelectedPageIds}
            onToggle={(id) => {
              // Find which account this page belongs to
              for (const accountId of openAccountIds) {
                const acc = ACCOUNTS.find((a) => a.id === accountId);
                const pg = acc?.pages.find((p) => p.id === id);
                if (pg) {
                  togglePage(accountId, id);
                  break;
                }
              }
            }}
          />
        )}
      </div>

      {/* ─── Validation hint ─────────────────────────────────────────────── */}
      {hasAccounts && targets.length === 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Select at least one page to continue.
        </p>
      )}

      {/* ─── Pixel per account ───────────────────────────────────────────── */}
      {targets.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Pixel assignment
          </span>

          {[...openAccountIds].map((accountId) => {
            const account = ACCOUNTS.find((a) => a.id === accountId);
            if (!account) return null;
            // Only show row if this account has targets
            const hasTargets = targets.some((t) => t.accountId === accountId);
            if (!hasTargets) return null;

            const currentPixelId = accountPixelId(accountId);

            return (
              <div
                key={accountId}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                  {account.name}
                </span>

                {account.pixels.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground/60">
                    No pixels connected
                  </span>
                ) : (
                  <Select
                    value={currentPixelId ?? "__none__"}
                    onValueChange={(v) =>
                      setPixel(accountId, v === "__none__" ? undefined : v)
                    }
                  >
                    <SelectTrigger className="h-7 w-[180px] text-xs">
                      <SelectValue placeholder="Select pixel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No pixel</SelectItem>
                      {account.pixels.map((px) => (
                        <SelectItem key={px.id} value={px.id}>
                          {px.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Empty state (no accounts in data) ───────────────────────────── */}
      {ACCOUNTS.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No ad accounts connected. Add an account in Integrations.
        </p>
      )}
    </div>
  );
}
