import { useEffect, useMemo } from "react";
import { AlertTriangle, Building2, FileWarning, Layers, Lock, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLaunchFlow } from "@/launch2/store/launchFlowStore";
import { accounts, businessManagers, pages, pixels } from "@/launch2/mocks";
import { autoDistribute, buildPairs } from "@/launch2/lib/distribution";
import { checkCaps } from "@/launch2/lib/capCheck";
import type { DistributionEntry } from "@/launch2/types";
import {
  AdvancedDrawer,
  CapMeter,
  EmptyState,
  HealthDot,
  SectionHeader,
} from "@/launch2/components";

/* ───────────────────────── Helpers ───────────────────────── */

const bmName = (bmId: string) => businessManagers.find((b) => b.id === bmId)?.name ?? "—";

/** Ads this launch adds to a given page, from the live distribution. */
function addedAdsForPage(
  pageId: string,
  distribution: DistributionEntry[],
  creativesPerAdset: number
): number {
  return distribution
    .filter((d) => d.pageId === pageId)
    .reduce((sum, d) => sum + d.adsets * Math.max(1, creativesPerAdset), 0);
}

/* ───────────────────────── Step 2 ───────────────────────── */

export function Step2Distribution() {
  const { state, dispatch } = useLaunchFlow();

  // Accounts in the "primary" BM are surfaced in the guided list; everything
  // else (other BMs) lives in the Advanced drawer.
  const primaryBmId = businessManagers[0]?.id;
  const guidedAccounts = accounts.filter((a) => a.bmId === primaryBmId);
  const otherAccounts = accounts.filter((a) => a.bmId !== primaryBmId);

  const selectedPages = useMemo(
    () => pages.filter((p) => state.accountIds.includes(p.accountId)),
    [state.accountIds]
  );

  const availablePixels = useMemo(
    () => pixels.filter((px) => state.accountIds.includes(px.accountId)),
    [state.accountIds]
  );

  const selectedPixel = pixels.find((px) => px.id === state.pixelId) ?? null;

  // Recompute auto-spread whenever inputs change (accounts/pages/autospread/adsetCount).
  useEffect(() => {
    if (!state.autoSpread) return;
    const pairs = buildPairs(state.accountIds, state.pageIds, pages, state.pixelId);
    const next = autoDistribute(state.adsetCount, pairs);
    dispatch({ type: "SET_DISTRIBUTION", distribution: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.autoSpread,
    state.accountIds,
    state.pageIds,
    state.pixelId,
    state.adsetCount,
  ]);

  const caps = useMemo(
    () => checkCaps(state.distribution, state.creativesPerAdset, pages),
    [state.distribution, state.creativesPerAdset]
  );

  const handleRedistribute = () => {
    const pairs = buildPairs(state.accountIds, state.pageIds, pages, state.pixelId);
    dispatch({ type: "SET_AUTOSPREAD", autoSpread: true });
    dispatch({ type: "SET_DISTRIBUTION", distribution: autoDistribute(state.adsetCount, pairs) });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-g6-sans text-xl font-semibold text-foreground">Account + Distribution</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Where this launches and how the {state.adsetCount} ad sets spread across pages.
        </p>
      </header>

      {/* ── Ad accounts ── */}
      <section>
        <SectionHeader
          title="Ad accounts"
          sub="Pick the accounts to launch into. Restricted accounts can't run ads."
        />
        <div className="space-y-2">
          {guidedAccounts.map((acc) => {
            const restricted = acc.health === "restricted";
            const checked = state.accountIds.includes(acc.id);
            return (
              <label
                key={acc.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  restricted
                    ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
                    : checked
                    ? "cursor-pointer border-primary bg-primary/5"
                    : "cursor-pointer border-border bg-card hover:bg-muted/40"
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={restricted}
                  onChange={() => !restricted && dispatch({ type: "TOGGLE_ACCOUNT", accountId: acc.id })}
                />
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                    restricted && "opacity-50"
                  )}
                  aria-hidden
                >
                  {checked && <span className="h-2 w-2 rounded-[1px] bg-current" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{acc.name}</span>
                    <HealthDot status={acc.health} />
                    {restricted && <Lock className="h-3 w-3 text-[hsl(var(--error-text))]" />}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-g6-mono">{acc.currency}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{bmName(acc.bmId)}</span>
                  </span>
                  {acc.note && (
                    <span
                      className={cn(
                        "mt-1 block text-xs",
                        restricted ? "text-[hsl(var(--error-text))]" : "text-[hsl(var(--warning-text))]"
                      )}
                    >
                      {acc.note}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
        {state.accountIds.length === 0 && (
          <div className="mt-3">
            <EmptyState
              compact
              icon={<Building2 className="h-5 w-5" />}
              title="Pick at least one ad account"
              description="Select an account above to choose its pages and spread your ad sets."
            />
          </div>
        )}
      </section>

      {/* ── Pages ── */}
      {state.accountIds.length > 0 && (
        <section>
          <SectionHeader
            title="Pages"
            sub="The pages your ads run from. Each page has a 250-ad cap."
          />
          {selectedPages.length === 0 ? (
            <EmptyState
              compact
              icon={<Layers className="h-5 w-5" />}
              title="No pages on the selected accounts"
              description="Pick a different account, or add a page in Settings."
            />
          ) : (
            <div className="space-y-2">
              {selectedPages.map((pg) => {
                const checked = state.pageIds.includes(pg.id);
                const added = checked
                  ? addedAdsForPage(pg.id, state.distribution, state.creativesPerAdset)
                  : 0;
                return (
                  <label
                    key={pg.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      checked ? "cursor-pointer border-primary bg-primary/5" : "cursor-pointer border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => dispatch({ type: "TOGGLE_PAGE", pageId: pg.id })}
                    />
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                      )}
                      aria-hidden
                    >
                      {checked && <span className="h-2 w-2 rounded-[1px] bg-current" />}
                    </span>
                    <span className="min-w-0 flex-[2]">
                      <span className="flex items-center gap-2">
                        <HealthDot status={pg.health} />
                        <span className="truncate text-sm font-medium text-foreground">{pg.name}</span>
                      </span>
                      <span className="mt-0.5 block font-g6-mono text-xs text-muted-foreground">
                        {pg.adCount} live ads
                      </span>
                    </span>
                    <span className="hidden w-40 shrink-0 sm:block">
                      <CapMeter current={pg.adCount} added={added} limit={pg.capLimit} />
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Pixel ── */}
      {state.accountIds.length > 0 && availablePixels.length > 0 && (
        <section>
          <SectionHeader
            title="Pixel / dataset"
            sub="Tracks conversions and powers optimization. One pixel applies to all pairs."
          />
          <Select
            value={state.pixelId ?? undefined}
            onValueChange={(v) => dispatch({ type: "SET_PIXEL", pixelId: v })}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a pixel" />
            </SelectTrigger>
            <SelectContent>
              {availablePixels.map((px) => (
                <SelectItem key={px.id} value={px.id}>
                  <span className="flex items-center gap-2">
                    <span>{px.name}</span>
                    <span className="font-g6-mono text-xs text-muted-foreground">
                      {px.eventsLast7d} ev/7d
                    </span>
                    {px.status === "inactive" && (
                      <span className="text-xs text-[hsl(var(--warning-text))]">· inactive</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPixel?.status === "inactive" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--warning-text))]">
              <AlertTriangle className="h-3.5 w-3.5" />
              This pixel is inactive — no events in the last 7 days. Conversion optimization may underdeliver.
            </p>
          )}
        </section>
      )}

      {/* ── Smart auto-spread ── */}
      {state.accountIds.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Shuffle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Smart auto-spread</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Distribute {state.adsetCount} ad sets evenly across selected account × page pairs.
                  Turn off to set ad sets per pair manually in Advanced.
                </p>
              </div>
            </div>
            <Switch
              checked={state.autoSpread}
              onCheckedChange={(v) => dispatch({ type: "SET_AUTOSPREAD", autoSpread: v })}
              aria-label="Smart auto-spread"
            />
          </div>

          {state.pageIds.length > 0 && state.distribution.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
              {state.distribution.map((d) => {
                const pg = pages.find((p) => p.id === d.pageId);
                return (
                  <span
                    key={`${d.accountId}-${d.pageId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs"
                  >
                    <span className="truncate text-foreground">{pg?.name ?? d.pageId}</span>
                    <span className="font-g6-mono text-muted-foreground">{d.adsets} ad sets</span>
                  </span>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Inline cap pre-check ── */}
      {caps.anyBreach && (
        <div className="rounded-lg border border-[#faad14]/40 bg-[#faad14]/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--warning-text))]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--warning-text))]">
                250-ad cap breach
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                This launch would push these pages over Meta's 250-ad-per-page cap:
              </p>
              <ul className="mt-2 space-y-1">
                {caps.pages
                  .filter((p) => p.breach)
                  .map((p) => (
                    <li key={p.pageId} className="font-g6-mono text-xs text-[hsl(var(--error-text))]">
                      {p.pageName}: {p.current} + {p.added} = {p.current + p.added} / {p.limit}
                      {" "}(over by {p.current + p.added - p.limit})
                    </li>
                  ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={handleRedistribute}
              className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:bg-primary/90"
            >
              Redistribute
            </button>
          </div>
        </div>
      )}

      {/* ── Advanced ── */}
      <AdvancedDrawer label="Advanced distribution" hint="All BMs · manual matrix">
        {otherAccounts.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Other business managers
            </p>
            <div className="space-y-2">
              {Object.entries(
                otherAccounts.reduce<Record<string, typeof otherAccounts>>((acc, a) => {
                  (acc[a.bmId] ||= []).push(a);
                  return acc;
                }, {})
              ).map(([bmId, accs]) => (
                <div key={bmId} className="rounded-md border border-border bg-background p-2.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {bmName(bmId)}
                  </p>
                  <div className="space-y-1.5">
                    {accs.map((acc) => {
                      const restricted = acc.health === "restricted";
                      const checked = state.accountIds.includes(acc.id);
                      return (
                        <label
                          key={acc.id}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                            restricted ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={restricted}
                            onChange={() => !restricted && dispatch({ type: "TOGGLE_ACCOUNT", accountId: acc.id })}
                            className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                          />
                          <span className="truncate text-foreground">{acc.name}</span>
                          <HealthDot status={acc.health} />
                          {acc.note && (
                            <span className="ml-auto truncate text-xs text-[hsl(var(--warning-text))]" title={acc.note}>
                              {acc.note}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual account × page matrix */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Manual ad-set matrix
            </p>
            {state.autoSpread && (
              <span className="text-xs text-muted-foreground">Turn off auto-spread to edit</span>
            )}
          </div>
          {state.pageIds.length === 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileWarning className="h-3.5 w-3.5" />
              Select accounts + pages above to build the matrix.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Account</th>
                    <th className="px-3 py-2 text-left font-medium">Page</th>
                    <th className="px-3 py-2 text-right font-medium">Ad sets</th>
                  </tr>
                </thead>
                <tbody>
                  {buildPairs(state.accountIds, state.pageIds, pages, state.pixelId).map((pair) => {
                    const acc = accounts.find((a) => a.id === pair.accountId);
                    const pg = pages.find((p) => p.id === pair.pageId);
                    const entry = state.distribution.find(
                      (d) => d.accountId === pair.accountId && d.pageId === pair.pageId
                    );
                    return (
                      <tr key={`${pair.accountId}-${pair.pageId}`} className="border-t border-border">
                        <td className="truncate px-3 py-2 text-foreground">{acc?.name}</td>
                        <td className="truncate px-3 py-2 text-muted-foreground">{pg?.name}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            disabled={state.autoSpread}
                            value={entry?.adsets ?? 0}
                            onChange={(e) => {
                              const adsets = Math.max(0, parseInt(e.target.value, 10) || 0);
                              const others = state.distribution.filter(
                                (d) => !(d.accountId === pair.accountId && d.pageId === pair.pageId)
                              );
                              dispatch({
                                type: "SET_DISTRIBUTION",
                                distribution: [
                                  ...others,
                                  { accountId: pair.accountId, pageId: pair.pageId, pixelId: pair.pixelId, adsets },
                                ],
                              });
                            }}
                            className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right font-g6-mono text-sm disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdvancedDrawer>
    </div>
  );
}
