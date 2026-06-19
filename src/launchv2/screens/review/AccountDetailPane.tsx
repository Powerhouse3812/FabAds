/**
 * AccountDetailPane — the detail pane rendered when an "account" node is
 * selected in the Step-4 Review master-detail editor.
 *
 * The ad account and Facebook page are NOT editable here (chosen in Setup).
 * This pane shows rich read-only account facts + a list of the account's pages
 * + one collapsed-by-default editable "Distribution" section.
 */
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Hash,
  Lock,
  RotateCcw,
  ShoppingBag,
  Users,
  XCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/launch2/utils/time";
import {
  MOCK_AD_ACCOUNTS,
  MOCK_DATASETS,
  MOCK_PAGES,
} from "../../services/mockMetaData";
import { CATALOGS, CUSTOM_AUDIENCES } from "../../data";
import type { PageDistribution } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { TreeNode } from "./reviewModel";

/* ── Types ───────────────────────────────────────────────────────────── */

interface DistOption {
  id: PageDistribution;
  label: string;
  blurb: string;
}

/* ── Constants ───────────────────────────────────────────────────────── */

const DIST_OPTIONS: DistOption[] = [
  {
    id: "one_page",
    label: "One page",
    blurb: "All ads to a single page",
  },
  {
    id: "fill_first",
    label: "Fill first",
    blurb: "Pack one page to the 250-ad cap, then spill",
  },
  {
    id: "equal",
    label: "Equal",
    blurb: "Spread ads evenly across pages",
  },
  {
    id: "duplicate",
    label: "Duplicate",
    blurb: "Every page runs the full set — budget multiplies × pages",
  },
];

/* ── Status pill helpers ─────────────────────────────────────────────── */

interface StatusPillProps {
  status: 1 | 2 | 3 | 7;
}

function AccountStatusPill({ status }: StatusPillProps) {
  const map: Record<
    number,
    { label: string; className: string }
  > = {
    1: {
      label: "Active",
      className:
        "text-[#237804] bg-[#52c41a]/10 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase",
    },
    3: {
      label: "Unsettled",
      className:
        "text-[#874d00] bg-[#faad14]/10 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase",
    },
    2: {
      label: "Disabled",
      className:
        "text-[#cf1322] bg-[#ff4d4f]/10 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase",
    },
    7: {
      label: "Pending review",
      className:
        "text-[#874d00] bg-[#faad14]/10 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase",
    },
  };
  const { label, className } = map[status] ?? map[1];
  return <span className={className}>{label}</span>;
}

/* ── Small key/value row ─────────────────────────────────────────────── */

function KVRow({
  label,
  children,
  locked,
}: {
  label: string;
  children: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="flex w-[110px] shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
        {locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
        {label}
      </span>
      <span className="flex-1 text-right text-[13px] text-foreground">
        {children}
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export function AccountDetailPane({
  flow,
  node,
}: {
  flow: UseFlowV2;
  node: TreeNode;
}) {
  const [distOpen, setDistOpen] = useState(false);
  const [featOpen, setFeatOpen] = useState(true);
  const [catalogueConflictWarn, setCatalogueConflictWarn] = useState(false);
  const [postConflictWarn, setPostConflictWarn] = useState(false);

  /* Resolve the target pair this account node represents */
  const ti = node.targetIndex ?? 0;
  const target = flow.plan.targets[ti];

  if (!target) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        No account selected.
      </div>
    );
  }

  const account = MOCK_AD_ACCOUNTS[target.accountId];

  /* Pages that belong to this ad account */
  const accountPages = flow.plan.targets.filter(
    (t) => t.accountId === target.accountId,
  );

  /* Distribution override for this account */
  const accountDistOverride =
    flow.plan.pageDistributionByAccount[target.accountId];
  const hasOverride = accountDistOverride !== undefined;
  const effectiveDist: PageDistribution =
    accountDistOverride ?? flow.plan.pageDistribution;

  /* Pixel / dataset name */
  const pixelName =
    MOCK_DATASETS[target.pixelId ?? ""]?.name ??
    target.pixelId ??
    "Not set";

  /* Payment method text + color */
  const paymentLabel = account
    ? account.has_payment_method
      ? "On file"
      : "Missing"
    : "—";
  const paymentClass = account
    ? account.has_payment_method
      ? "text-[#237804]"
      : "text-[#cf1322]"
    : "";

  /* Min daily budget (minor units → display) */
  const minBudgetDisplay = account
    ? formatMoney(account.min_daily_budget / 100, target.currency)
    : "—";

  /* Ad-feature values for this account */
  const catalogueEnabled = flow.plan.catalogueByAccount?.[target.accountId] ?? false;
  const selectedCatalogId = flow.plan.productSetByAccount?.[target.accountId]?.catalogId ?? null;
  const postEnabled = flow.plan.useExistingPostByAccount?.[target.accountId] ?? false;
  const customAudienceEnabled = flow.plan.useCustomAudience;
  const customAudienceMode = flow.plan.customAudienceMode;
  const customAudienceId = flow.plan.customAudienceId;

  function setCatalogue(enabled: boolean) {
    if (enabled && postEnabled) {
      setCatalogueConflictWarn(true);
      setTimeout(() => setCatalogueConflictWarn(false), 3000);
      return;
    }
    setCatalogueConflictWarn(false);
    flow.patch({
      catalogueByAccount: { ...flow.plan.catalogueByAccount, [target.accountId]: enabled },
      catalogueToggle: enabled || Object.values({ ...flow.plan.catalogueByAccount, [target.accountId]: enabled }).some(Boolean),
    });
  }

  function setPost(enabled: boolean) {
    if (enabled && catalogueEnabled) {
      setPostConflictWarn(true);
      setTimeout(() => setPostConflictWarn(false), 3000);
      return;
    }
    setPostConflictWarn(false);
    flow.patch({ useExistingPostByAccount: { ...flow.plan.useExistingPostByAccount, [target.accountId]: enabled } });
  }

  /* Patch helper for distribution override */
  function setDistOverride(value: PageDistribution) {
    flow.patch({
      pageDistributionByAccount: {
        ...flow.plan.pageDistributionByAccount,
        [target.accountId]: value,
      },
    });
  }

  function resetDistOverride() {
    const next = { ...flow.plan.pageDistributionByAccount };
    delete next[target.accountId];
    flow.patch({ pageDistributionByAccount: next });
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        {/* ── Pane header ──────────────────────────────────────────── */}
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
            Account
          </span>
          <h3 className="truncate text-base font-semibold text-foreground">
            {account?.name ?? target.accountName}
          </h3>
        </div>

        {/* ── Section 1: Account & page (read-only, always open) ───── */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="px-4 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
              Account &amp; page
            </span>
          </div>

          <div className="space-y-0 border-t border-border px-4 py-3">
            {/* Account name + status pill */}
            <div className="flex items-start gap-2 pb-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {account?.name ?? target.accountName}
                  </span>
                  {account && (
                    <AccountStatusPill status={account.account_status} />
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {target.accountId}
                </span>
              </div>
            </div>

            {/* Key / value grid */}
            <div className="divide-y divide-border/50">
              <KVRow label="Currency" locked>
                <span className="font-mono">{target.currency}</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">
                  follows the account
                </span>
              </KVRow>

              <KVRow label="Time zone" locked>
                <span className="font-mono text-[12px]">
                  {account?.timezone_name ?? "—"}
                </span>
              </KVRow>

              <KVRow label="Payment">
                <span className={cn("text-[13px]", paymentClass)}>
                  {paymentLabel}
                </span>
              </KVRow>

              <KVRow label="Min daily budget">
                <span className="font-mono text-[12px]">
                  {minBudgetDisplay}
                </span>
              </KVRow>

              <KVRow label="Pixel / dataset">
                <span className="text-[12px] text-muted-foreground">
                  {pixelName}
                </span>
              </KVRow>
            </div>
          </div>
        </div>

        {/* ── Section 2: Pages (read-only, always open) ─────────────── */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="px-4 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
              Pages
            </span>
          </div>

          <div className="space-y-2 border-t border-border px-4 py-3">
            {accountPages.map((t) => {
              const page = MOCK_PAGES[t.fbPageId];
              const isPublished = page?.is_published ?? true;
              const leadgenOk = page?.leadgen_tos_accepted ?? false;
              const pageName = page?.name ?? t.pageName;

              return (
                <div
                  key={t.fbPageId}
                  className="flex items-start gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <span className="flex-1 text-[13px] font-medium text-foreground">
                    {pageName}
                  </span>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {/* Published chip */}
                    <span
                      className={cn(
                        "flex items-center gap-1 font-mono text-[10px]",
                        isPublished
                          ? "text-[#237804]"
                          : "text-[#cf1322]",
                      )}
                    >
                      {isPublished ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {isPublished ? "Published" : "Unpublished"}
                    </span>

                    {/* Leadgen ToS chip */}
                    <span
                      className={cn(
                        "flex items-center gap-1 font-mono text-[10px]",
                        leadgenOk
                          ? "text-muted-foreground"
                          : "text-[#874d00]",
                      )}
                    >
                      {leadgenOk ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {leadgenOk ? "Leadgen ✓" : "Leadgen ToS pending"}
                    </span>
                  </div>
                </div>
              );
            })}

            {accountPages.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                No pages linked to this account.
              </p>
            )}
          </div>
        </div>

        {/* ── Section 3: Ad features (collapsible, open by default) ─────── */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setFeatOpen((p) => !p)}
            className="flex w-full items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
            aria-expanded={featOpen}
          >
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
              Ad features
            </span>
            {featOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          {featOpen && (
            <div className="divide-y divide-border/50 border-t border-border">
              {/* Advantage+ Catalogue */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <span className="flex-1 text-[13px] font-medium text-foreground">Advantage+ Catalogue</span>
                {catalogueConflictWarn && (
                  <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                    Turn off &lsquo;Use existing posts&rsquo; first
                  </span>
                )}
                <Switch
                  checked={catalogueEnabled}
                  onCheckedChange={setCatalogue}
                  className="scale-90 shrink-0"
                />
              </div>

              {catalogueEnabled && (
                <div className="px-4 pb-3 pt-2">
                  <select
                    value={selectedCatalogId ?? ""}
                    onChange={(e) => flow.patch({
                      productSetByAccount: {
                        ...flow.plan.productSetByAccount,
                        [target.accountId]: { catalogId: e.target.value || null, productSetIds: [] },
                      },
                    })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select catalogue…</option>
                    {CATALOGS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.productCount} products)
                      </option>
                    ))}
                  </select>
                  {selectedCatalogId && (
                    <p className="mt-1 font-mono text-[10px] text-[#5B7611] dark:text-[#C3E165]">
                      Product sets configurable in Setup
                    </p>
                  )}
                </div>
              )}

              {/* Use existing posts */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">Use existing posts</p>
                  <p className="text-[11px] font-mono text-muted-foreground/60">Select a post from published ads</p>
                </div>
                {postConflictWarn && (
                  <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                    Turn off Catalogue first
                  </span>
                )}
                <Switch
                  checked={postEnabled}
                  onCheckedChange={setPost}
                  className="scale-90 shrink-0"
                />
              </div>

              {/* Custom Audience */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">Custom Audience</p>
                  <p className="text-[11px] font-mono text-muted-foreground/60">Target a specific custom audience</p>
                </div>
                <Switch
                  checked={customAudienceEnabled}
                  onCheckedChange={(v) => flow.patch({ useCustomAudience: v })}
                  className="scale-90 shrink-0"
                />
              </div>

              {customAudienceEnabled && (
                <div className="space-y-3 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {(["select", "upload"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => flow.patch({ customAudienceMode: mode })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                          customAudienceMode === mode
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
                  {customAudienceMode === "select" && (
                    <Select
                      value={customAudienceId ?? "__none__"}
                      onValueChange={(v) => flow.patch({ customAudienceId: v === "__none__" ? null : v })}
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
                  {customAudienceMode === "upload" && (
                    <p className="font-mono text-[11px] text-muted-foreground">Upload CSV available in Setup → Ad features.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Section 4: Distribution (collapsible, collapsed by default) ── */}
        <div className="overflow-hidden rounded-2xl border border-border">
          {/* Accordion trigger */}
          <button
            type="button"
            onClick={() => setDistOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
            aria-expanded={distOpen}
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
                Distribution
              </span>
              {hasOverride && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  overridden
                </span>
              )}
            </span>
            {distOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          {/* Accordion body */}
          {distOpen && (
            <div className="space-y-3 border-t border-border px-4 py-3">
              {/* Per-account page-split picker */}
              <div className="space-y-2">
                {DIST_OPTIONS.map((opt) => {
                  const selected = effectiveDist === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDistOverride(opt.id)}
                      aria-pressed={selected}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left cursor-pointer transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/30",
                      )}
                    >
                      <span className="block text-[13px] font-medium text-foreground">
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {opt.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Reset to plan default */}
              {hasOverride && (
                <button
                  type="button"
                  onClick={resetDistOverride}
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset to plan default ({flow.plan.pageDistribution})
                </button>
              )}

              {/* Muted note */}
              <p className="text-[11px] text-muted-foreground/70">
                Overrides the plan&apos;s page split for this account only.
              </p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
