/**
 * AccountsPages — Step 2 §1: account picker + per-account assignment rows.
 *
 * Flow: Select accounts → per-account rows appear, each showing a pages
 *       multi-select popover and a pixel selector on the right.
 *
 * State model:
 *   `selectedAccountIds` (local) — accounts ticked in account picker.
 *   `targets` (prop, TargetPair[]) — source of truth for account+page pairs.
 *
 * Search filtering is manual (plain <div> rows, not CommandItem) so that
 * the Reconnect button inside account rows doesn't conflict with cmdk focus.
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Hash,
  Info,
  Loader2,
  Plug,
  RotateCw,
  Search,
  Shield,
  ShoppingBag,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ACCOUNTS, CATALOGS, CUSTOM_AUDIENCES, makeTargetV2, pageActiveAds, RUNNING_ADS } from "../../../data";
import { perPageDemand } from "../../../deriveV2";
import type { PlanV2, TargetPair } from "../../../types";
import { MAX_ADS_PER_PAGE } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import RunningPickerModal from "../shared/RunningPickerModal";

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
        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-all",
        checked
          ? "border-primary bg-primary"
          : "border-border",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="shrink-0">
          <path
            d="M1 3L2.8 5L7 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/* ─── Account health (mock, cached at module load = session start) ───────────
 * Per strategy lock #17: parallel fetch at session start, instant on chip click.
 * Mocked here as a stable map; in real impl this would be a useEffect at flow init.
 */
type AccountHealth = {
  spentTodayUsd: number;
  capUsd: number;
  pagesConnected: number;
  pixelStatus: "active" | "stale" | "none";
  pagesNearCap: number;
};

const ACCOUNT_HEALTH: Record<string, AccountHealth> = {
  act_acme_us: { spentTodayUsd: 412, capUsd: 800, pagesConnected: 2, pixelStatus: "active", pagesNearCap: 0 },
  act_mamaearth: { spentTodayUsd: 1834, capUsd: 2500, pagesConnected: 2, pixelStatus: "active", pagesNearCap: 1 },
  act_boat: { spentTodayUsd: 0, capUsd: 0, pagesConnected: 2, pixelStatus: "stale", pagesNearCap: 2 },
  act_noise: { spentTodayUsd: 96, capUsd: 500, pagesConnected: 1, pixelStatus: "stale", pagesNearCap: 0 },
  act_sleepy: { spentTodayUsd: 220, capUsd: 600, pagesConnected: 1, pixelStatus: "none", pagesNearCap: 0 },
};

function AccountHealthCard({ accountId }: { accountId: string }) {
  const h = ACCOUNT_HEALTH[accountId] ?? { spentTodayUsd: 0, capUsd: 500, pagesConnected: 0, pixelStatus: "none" as const, pagesNearCap: 0 };
  const pct = h.capUsd > 0 ? Math.min(100, (h.spentTodayUsd / h.capUsd) * 100) : 0;
  const pixelLabel =
    h.pixelStatus === "active" ? "✓ Active" :
    h.pixelStatus === "stale" ? "⚠ Stale" :
    "✗ None";
  const pixelColor =
    h.pixelStatus === "active" ? "text-foreground" :
    h.pixelStatus === "stale" ? "text-amber-600 dark:text-amber-400" :
    "text-destructive";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-[11px]">
      {/* Spent today */}
      <div className="space-y-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">Spent today</div>
        <div className="text-foreground font-mono tabular-nums">
          ${h.spentTodayUsd.toLocaleString("en-US")} / ${h.capUsd.toLocaleString("en-US")}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-[width]",
              pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-foreground/60",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Pages */}
      <div className="space-y-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">Pages</div>
        <div className="text-foreground tabular-nums">{h.pagesConnected} connected</div>
      </div>
      {/* Pixel */}
      <div className="space-y-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">Pixel</div>
        <div className={cn("font-medium", pixelColor)}>{pixelLabel}</div>
      </div>
      {/* Cap risk — only if >0 */}
      <div className="space-y-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">Cap risk</div>
        {h.pagesNearCap > 0 ? (
          <div className="text-amber-600 dark:text-amber-400">⚠ {h.pagesNearCap} Page{h.pagesNearCap !== 1 ? "s" : ""} near cap</div>
        ) : (
          <div className="text-muted-foreground/60">—</div>
        )}
      </div>
    </div>
  );
}

/* Regulated categories — mock list. If any selected Page has a matching category,
 * show suggestion banner. Toggle stays OFF by default (lock #18).
 */
const REGULATED_PAGE_CATEGORIES = new Set(["Finance", "Health", "Real Estate", "Employment", "Insurance"]);

/* ─── AccountPickerRow (plain div — no CommandItem to avoid focus conflicts) ─ */
function AccountPickerRow({
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
  const { toast } = useToast();
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reconnecting) return;
    setReconnecting(true);
    setTimeout(() => {
      setReconnecting(false);
      toast({
        title: "Reconnect not available yet",
        description: "Reconnection requires OAuth — coming soon.",
      });
    }, 1500);
  };

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
            onClick={handleReconnect}
            disabled={reconnecting}
            aria-busy={reconnecting}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors disabled:opacity-70 disabled:cursor-wait"
          >
            {reconnecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            {reconnecting ? "Reconnecting…" : "Reconnect"}
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

/* ─── AccountRow (per-account assignment row with pages popover + pixel) ───── */
function AccountRow({
  accountId,
  targets,
  onTogglePage,
  onSetPixel,
  postIds,
  onSetPostIds,
  catalogueEnabled,
  selectedCatalogId,
  selectedProductSetIds,
  onSetCatalogue,
  onSetCatalogId,
  onSetProductSetIds,
}: {
  accountId: string;
  targets: TargetPair[];
  onTogglePage: (accountId: string, pageId: string) => void;
  onSetPixel: (accountId: string, pixelId: string | undefined) => void;
  postIds: string[];
  onSetPostIds: (ids: string[]) => void;
  catalogueEnabled: boolean;
  selectedCatalogId: string | null;
  selectedProductSetIds: string[];
  onSetCatalogue: (enabled: boolean) => void;
  onSetCatalogId: (id: string | null) => void;
  onSetProductSetIds: (ids: string[]) => void;
}) {
  const [pagePopoverOpen, setPagePopoverOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState("");
  const [postPickerOpen, setPostPickerOpen] = useState(false);
  const [postHoverOpen, setPostHoverOpen] = useState(false);
  const [postEnabled, setPostEnabled] = useState(postIds.length > 0);
  const [productSetPopoverOpen, setProductSetPopoverOpen] = useState(false);

  const account = ACCOUNTS.find((a) => a.id === accountId);
  if (!account) return null;

  const selectedPageIds = new Set(
    targets.filter((t) => t.accountId === accountId).map((t) => t.pageId),
  );

  /* Sort pages by active ads desc (most active = most familiar = top) */
  const sortedPages = [...account.pages].sort(
    (a, b) => pageActiveAds(b.fbPageId) - pageActiveAds(a.fbPageId),
  );

  /* Filter by search */
  const filteredPages = pageSearch
    ? sortedPages.filter((p) =>
        p.name.toLowerCase().includes(pageSearch.toLowerCase()),
      )
    : sortedPages;

  const selectedCount = selectedPageIds.size;
  const currentPixelId = targets.find((t) => t.accountId === accountId)?.pixelId;

  return (
    <div className="space-y-1.5">
      {/* ── Inline account health (cached at session start, see lock #17) ── */}
      <AccountHealthCard accountId={accountId} />

      {/* ── Main card with divide-y structure ── */}
      <div className="rounded-xl border border-border bg-muted/5 divide-y divide-border/50">

        {/* ── Main row (account info + pages + pixel) ── */}
        <div className="px-3 py-2.5 flex items-center gap-3">
          {/* ── Left: status dot + account name + currency chip ── */}
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
            {account.name}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/60 bg-muted/40 border border-border/60 rounded-full px-1.5 py-0.5 shrink-0">
            {account.currency}
          </span>

          {/* ── Right: pages popover + pixel select ── */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Pages multi-select popover */}
            <Popover
              open={pagePopoverOpen}
              onOpenChange={(v) => {
                setPagePopoverOpen(v);
                if (!v) setPageSearch("");
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-8 min-w-[110px] flex items-center justify-between gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:border-foreground/20 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="flex-1 text-left">
                    {selectedCount > 0 ? `${selectedCount} page${selectedCount !== 1 ? "s" : ""}` : "Pages…"}
                  </span>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-[280px] p-0 rounded-xl border border-border bg-card shadow-md"
                align="end"
                sideOffset={6}
              >
                {/* Search input */}
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <input
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Search pages…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    autoFocus
                  />
                </div>

                {/* Pages list */}
                <div className="max-h-[240px] overflow-y-auto py-1">
                  {filteredPages.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No pages found.
                    </p>
                  ) : (
                    filteredPages.map((page) => {
                      const activeAds = pageActiveAds(page.fbPageId);
                      const atCap = activeAds >= MAX_ADS_PER_PAGE;
                      const nearCap = !atCap && activeAds >= 200;
                      const isChecked = selectedPageIds.has(page.id);

                      return (
                        <div
                          key={page.id}
                          role="option"
                          aria-selected={isChecked}
                          onClick={() => {
                            if (!atCap) onTogglePage(accountId, page.id);
                          }}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 transition-colors",
                            atCap
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer hover:bg-muted/30",
                          )}
                        >
                          <Checkbox checked={isChecked} disabled={atCap} />
                          <span className="flex-1 min-w-0 truncate text-xs font-medium text-foreground">
                            {page.name}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 font-mono text-[10px] tabular-nums",
                              atCap
                                ? "text-destructive"
                                : nearCap
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground/40",
                            )}
                          >
                            {activeAds}/{MAX_ADS_PER_PAGE}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Pixel select */}
            {account.pixels.length === 0 ? (
              <button
                type="button"
                disabled
                className="h-8 w-[160px] flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-mono text-muted-foreground opacity-50 cursor-default"
              >
                <Zap className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <span>No pixel</span>
              </button>
            ) : (
              <Select
                value={currentPixelId ?? "__none__"}
                onValueChange={(v) =>
                  onSetPixel(accountId, v === "__none__" ? undefined : v)
                }
              >
                <SelectTrigger className="h-8 w-[160px] text-xs font-mono">
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
        </div>

        {/* ── Post ID sub-row ── */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="flex-1 text-xs font-medium text-muted-foreground">Use existing posts</span>

          {/* Selected count chip (shown when postIds.length > 0 AND postEnabled) */}
          {postEnabled && postIds.length > 0 && (
            <Popover open={postHoverOpen} onOpenChange={setPostHoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-primary/10 transition-colors"
                >
                  <Hash className="h-3 w-3 text-primary" />
                  {postIds.length} post{postIds.length !== 1 ? "s" : ""}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-xl p-2" align="end">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Selected posts</p>
                <div className="space-y-1.5">
                  {postIds.map((id) => {
                    const ad = RUNNING_ADS.find((a) => a.id === id);
                    if (!ad) return null;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <img src={ad.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{ad.name}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => { setPostPickerOpen(true); setPostHoverOpen(false); }}
                  className="mt-2 w-full rounded-lg border border-border py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Change selection
                </button>
              </PopoverContent>
            </Popover>
          )}

          <Switch
            checked={postEnabled}
            onCheckedChange={(v) => {
              setPostEnabled(v);
              if (!v) {
                onSetPostIds([]);
              } else if (postIds.length === 0) {
                setPostPickerOpen(true);
              }
            }}
            className="scale-90"
          />
        </div>

        {/* ── Post ID distribution info box ── */}
        {postEnabled && postIds.length > 0 && (
          <div className="px-3 py-2.5 flex items-start gap-2 bg-muted/20">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-foreground">Post ID distribution</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Each selected post ({postIds.length}) runs as 1 ad per ad set across your selected pages.
                Distribution is 1:1 — one post maps to one ad, repeated in every ad set.
              </p>
            </div>
          </div>
        )}

        {/* ── Catalogue sub-row ── */}
        <div className="flex items-center gap-3 px-3 py-2">
          <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="flex-1 text-xs font-medium text-muted-foreground">Advantage+ Catalogue</span>
          <Switch
            checked={catalogueEnabled}
            onCheckedChange={onSetCatalogue}
            className="scale-90 shrink-0"
          />
        </div>

        {/* Catalogue selectors — shown inline when enabled */}
        {catalogueEnabled && (
          <div className="px-3 pb-2 space-y-2">
            {/* Catalog select */}
            <Select
              value={selectedCatalogId ?? "__none__"}
              onValueChange={(v) => {
                const newCatId = v === "__none__" ? null : v;
                onSetCatalogId(newCatId);
                onSetProductSetIds([]); // reset product sets when catalog changes
              }}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Select catalog…" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="__none__">Select catalog…</SelectItem>
                {CATALOGS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                      ({c.productCount} products)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product set multi-select Popover (shown after catalog selected) */}
            {selectedCatalogId && (() => {
              const catalog = CATALOGS.find((c) => c.id === selectedCatalogId);
              const sets = catalog?.productSets ?? [];
              const selectedSetIds = new Set(selectedProductSetIds);
              const count = selectedProductSetIds.length;

              return (
                <Popover open={productSetPopoverOpen} onOpenChange={setProductSetPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-8 w-full flex items-center justify-between gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:border-foreground/20 transition-colors"
                    >
                      <span className="flex-1 text-left text-muted-foreground">
                        {count > 0
                          ? `${count} product set${count !== 1 ? "s" : ""} selected`
                          : "Select product sets…"}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 rounded-xl border border-border bg-card shadow-md" align="start" sideOffset={4}>
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {sets.map((ps) => {
                        const checked = selectedSetIds.has(ps.id);
                        return (
                          <div
                            key={ps.id}
                            role="option"
                            aria-selected={checked}
                            onClick={() => {
                              const next = new Set(selectedProductSetIds);
                              checked ? next.delete(ps.id) : next.add(ps.id);
                              onSetProductSetIds([...next]);
                            }}
                            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-colors"
                          >
                            <Checkbox checked={checked} />
                            <span className="flex-1 min-w-0 truncate text-xs font-medium text-foreground">
                              {ps.name}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
                              {ps.productCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })()}
          </div>
        )}

        {/* ── Catalogue distribution info box with calculation ── */}
        {catalogueEnabled && selectedCatalogId && selectedProductSetIds.length > 0 && (
          <div className="px-3 py-2.5 flex items-start gap-2 bg-primary/5 border-t border-primary/10">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-foreground">
                {selectedProductSetIds.length} product set{selectedProductSetIds.length !== 1 ? "s" : ""} →{" "}
                <span className="text-primary">{selectedProductSetIds.length} ad set{selectedProductSetIds.length !== 1 ? "s" : ""}</span> in this account
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                1 ad set per product set. Meta assembles ads dynamically from each set's inventory.
              </p>
              {/* Per-set calculation row */}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {selectedProductSetIds.map((id) => {
                  const catalog = CATALOGS.find((c) => c.id === selectedCatalogId);
                  const ps = catalog?.productSets.find((s) => s.id === id);
                  if (!ps) return null;
                  return (
                    <span key={id} className="font-mono text-[10px] text-muted-foreground/80">
                      {ps.name} ({ps.productCount} items) → 1 ad set
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Post picker modal ── */}
      <RunningPickerModal
        open={postPickerOpen}
        onOpenChange={setPostPickerOpen}
        type="ad"
        multiSelect
        onPick={() => {}}
        onPickMultiple={(ids) => {
          onSetPostIds(ids);
          setPostEnabled(true);
        }}
      />
    </div>
  );
}

/* ─── Custom audience CSV upload ──────────────────────────────────────────── */
function CustomAudienceUpload() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-4 text-center hover:border-primary/40 transition-colors">
      <Upload className="h-5 w-5 text-muted-foreground/50" />
      {file ? (
        <span className="text-xs font-medium text-foreground">{file.name}</span>
      ) : (
        <>
          <span className="text-xs font-medium text-foreground">Drop CSV here or click to browse</span>
          <span className="text-[11px] text-muted-foreground">Columns: email, phone or MADID</span>
        </>
      )}
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
export function AccountsPages({
  plan,
  targets,
  onChange,
  flow: _flow,
  onPatch,
}: {
  plan: PlanV2;
  targets: TargetPair[];
  onChange: (t: TargetPair[]) => void;
  flow: UseFlowV2;
  onPatch: (partial: Partial<PlanV2>) => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  /**
   * selectedAccountIds — LOCAL state (independent of targets).
   * An account is "selected" when the user ticks it in the account picker.
   * Selecting an account doesn't create targets yet — pages must be ticked too.
   * Deselecting an account removes ALL targets for that account.
   */
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    () => new Set(targets.map((t) => t.accountId)),
  );

  /* ── Derived ── */
  const demandByPage = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of perPageDemand(plan)) map.set(d.fbPageId, d.demand);
    return map;
  }, [plan]);

  /* ── Recently used ── */
  const recentAccounts = useMemo(
    () =>
      [...ACCOUNTS]
        .filter((a) => a.status === "active")
        .sort(
          (a, b) =>
            b.pages.reduce((s, p) => s + p.activeAds, 0) -
            a.pages.reduce((s, p) => s + p.activeAds, 0),
        )
        .slice(0, 3),
    [],
  );

  /* ── Account toggle ── */
  const toggleAccount = (accountId: string) => {
    const alreadySelected = selectedAccountIds.has(accountId);
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      alreadySelected ? next.delete(accountId) : next.add(accountId);
      return next;
    });
    if (alreadySelected) {
      // Deselecting: clear all targets for this account
      onChange(targets.filter((t) => t.accountId !== accountId));
    }
    // Selecting: no auto-targets — user picks pages in the row below
  };

  /* ── Page toggle ── */
  const togglePage = (accountId: string, pageId: string) => {
    const already = targets.some(
      (t) => t.accountId === accountId && t.pageId === pageId,
    );
    if (already) {
      onChange(targets.filter((t) => !(t.accountId === accountId && t.pageId === pageId)));
    } else {
      const newTarget = makeTargetV2(accountId, pageId);
      if (newTarget) {
        const existingPixel = targets.find((t) => t.accountId === accountId)?.pixelId;
        onChange([...targets, { ...newTarget, pixelId: existingPixel ?? newTarget.pixelId }]);
      }
    }
  };

  /* ── Pixel ── */
  const setPixel = (accountId: string, pixelId: string | undefined) => {
    onChange(targets.map((t) => (t.accountId === accountId ? { ...t, pixelId } : t)));
  };

  /* ── Filtered list (manual search — not cmdk) ── */
  const q = accountSearch.toLowerCase();
  const filteredAccounts = q
    ? ACCOUNTS.filter((a) => a.name.toLowerCase().includes(q))
    : ACCOUNTS;

  /* ── Counts ── */
  const accountCount = selectedAccountIds.size;
  const hasAccounts = accountCount > 0;

  /* ── Suppress unused-variable warning for demandByPage (kept for parity) ── */
  void demandByPage;

  /* ── Regulated suggestion: any selected page in a regulated category? ── */
  const suggestRegulated = useMemo(() => {
    if (plan.specialAdDeclared) return false; // already on, suppress
    for (const t of targets) {
      const acc = ACCOUNTS.find((a) => a.id === t.accountId);
      const pg = acc?.pages.find((p) => p.id === t.pageId);
      // @ts-expect-error optional category on mock page
      if (pg?.category && REGULATED_PAGE_CATEGORIES.has(pg.category)) return true;
    }
    return false;
  }, [targets, plan.specialAdDeclared]);

  return (
    <div className="space-y-4">
      {/* ─── 0. Regulated category — top of section per lock #18 ────────── */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Regulated category?
            </span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Credit, employment, housing, or social/political. Off by default — turn on only if it applies.
            </p>
          </div>
          <Switch
            checked={plan.specialAdDeclared}
            onCheckedChange={(v) => onPatch({ specialAdDeclared: v, specialAdCategories: v ? plan.specialAdCategories : [] })}
            className="shrink-0"
          />
        </div>

        {/* Suggestion banner (lock #18) */}
        {suggestRegulated && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <Info className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
            <p className="text-[11px] text-foreground">
              One or more selected Pages is in a regulated category. Turn this on if your ads relate to credit, employment, housing or social issues.
            </p>
          </div>
        )}

        {/* Category picker — surfaces when on */}
        {plan.specialAdDeclared && (
          <div className="flex flex-wrap gap-2 pl-1 pt-1">
            {[
              { id: "HOUSING", label: "Housing" },
              { id: "EMPLOYMENT", label: "Employment" },
              { id: "FINANCIAL_PRODUCTS_SERVICES", label: "Financial" },
              { id: "ISSUES_ELECTIONS_POLITICS", label: "Social issues" },
            ].map((c) => {
              const on = plan.specialAdCategories.includes(c.id as any);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const next = on
                      ? plan.specialAdCategories.filter((x) => x !== c.id)
                      : [...plan.specialAdCategories, c.id as any];
                    onPatch({ specialAdCategories: next });
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-foreground border-2 bg-foreground/[0.03] text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 1. Account picker ───────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Ad accounts</span>

        <Popover
          open={accountOpen}
          onOpenChange={(v) => {
            setAccountOpen(v);
            if (!v) setAccountSearch("");
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              <span className={accountCount > 0 ? "text-foreground font-medium" : ""}>
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
            {/* Manual search input */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <input
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search accounts…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                autoFocus
              />
            </div>

            <div className="max-h-[280px] overflow-y-auto py-1">
              {filteredAccounts.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No accounts found.
                </p>
              ) : (
                filteredAccounts.map((account) => (
                  <AccountPickerRow
                    key={account.id}
                    account={account}
                    selected={selectedAccountIds.has(account.id)}
                    onToggle={() => toggleAccount(account.id)}
                  />
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <RecentChips
          items={recentAccounts}
          selectedIds={selectedAccountIds}
          onToggle={(id) => {
            const acc = ACCOUNTS.find((a) => a.id === id);
            if (acc && acc.status === "active") toggleAccount(id);
          }}
        />
      </div>

      {/* ─── 2. Per-account assignment rows ──────────────────────────────── */}
      {selectedAccountIds.size > 0 && (
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium text-foreground">
            Per-account assignment
          </span>
          <div className="space-y-1.5">
            {[...selectedAccountIds].map((accountId) => (
              <AccountRow
                key={accountId}
                accountId={accountId}
                targets={targets}
                onTogglePage={togglePage}
                onSetPixel={setPixel}
                postIds={plan.postIdsByAccount?.[accountId] ?? []}
                onSetPostIds={(ids) =>
                  onPatch({
                    postIdsByAccount: {
                      ...(plan.postIdsByAccount ?? {}),
                      [accountId]: ids,
                    },
                  })
                }
                catalogueEnabled={plan.catalogueByAccount?.[accountId] ?? false}
                selectedCatalogId={plan.productSetByAccount?.[accountId]?.catalogId ?? null}
                selectedProductSetIds={plan.productSetByAccount?.[accountId]?.productSetIds ?? []}
                onSetCatalogue={(enabled) => {
                  onPatch({
                    catalogueByAccount: {
                      ...(plan.catalogueByAccount ?? {}),
                      [accountId]: enabled,
                    },
                    // Keep plan.catalogueToggle synced for backward compat with Step 3
                    catalogueToggle: enabled
                      ? true
                      : Object.entries({
                          ...(plan.catalogueByAccount ?? {}),
                          [accountId]: enabled,
                        }).some(([, v]) => v),
                  });
                }}
                onSetCatalogId={(id) => {
                  onPatch({
                    productSetByAccount: {
                      ...(plan.productSetByAccount ?? {}),
                      [accountId]: {
                        catalogId: id,
                        productSetIds: [], // reset on catalog change
                      },
                    },
                  });
                }}
                onSetProductSetIds={(ids) => {
                  onPatch({
                    productSetByAccount: {
                      ...(plan.productSetByAccount ?? {}),
                      [accountId]: {
                        catalogId: plan.productSetByAccount?.[accountId]?.catalogId ?? null,
                        productSetIds: ids,
                      },
                    },
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. Custom Audience ──────────────────────────────────────────── */}
      {selectedAccountIds.size > 0 && (
        <div className="rounded-2xl border border-border divide-y divide-border">
          {/* Toggle row */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">Custom Audience</p>
              <p className="text-[11px] text-muted-foreground">Target a specific custom audience or upload a CSV list.</p>
            </div>
            <Switch
              checked={plan.useCustomAudience}
              onCheckedChange={(v) => onPatch({ useCustomAudience: v })}
              className="scale-90 shrink-0"
            />
          </div>

          {plan.useCustomAudience && (
            <div className="px-3 py-3 space-y-3">
              {/* Mode chips + BM link */}
              <div className="flex items-center gap-2">
                {(["select", "upload"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onPatch({ customAudienceMode: mode })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      plan.customAudienceMode === mode
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                    )}
                  >
                    {mode === "select" ? "Select existing" : "Upload CSV"}
                  </button>
                ))}
                <a
                  href="https://business.facebook.com/audiences"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                  title="Create in Business Manager"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Select mode */}
              {plan.customAudienceMode === "select" && (
                <Select
                  value={plan.customAudienceId ?? "__none__"}
                  onValueChange={(v) => onPatch({ customAudienceId: v === "__none__" ? null : v })}
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue placeholder="Search or select a custom audience…" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="__none__">None selected</SelectItem>
                    {CUSTOM_AUDIENCES.map((ca) => (
                      <SelectItem key={ca.id} value={ca.id}>
                        <span className="flex items-center gap-2">
                          <span>{ca.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {ca.estimatedSize >= 1000000
                              ? `${(ca.estimatedSize / 1000000).toFixed(1)}M`
                              : `${(ca.estimatedSize / 1000).toFixed(0)}K`}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Upload mode */}
              {plan.customAudienceMode === "upload" && <CustomAudienceUpload />}
            </div>
          )}
        </div>
      )}

      {/* ─── Validation hint ─────────────────────────────────────────────── */}
      {hasAccounts && targets.length === 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Select at least one page above to continue.
        </p>
      )}

      {ACCOUNTS.length === 0 && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plug className="h-6 w-6 text-primary" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No ad accounts connected</p>
            <p className="text-xs text-muted-foreground">
              Connect a Meta ad account to start launching.
            </p>
          </div>
          <Link
            to="/integrations"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plug className="h-3.5 w-3.5" />
            Connect Meta account
          </Link>
        </div>
      )}
    </div>
  );
}
