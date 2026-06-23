/**
 * CatalogueCampaignEditor — editable campaign-based catalogue configuration.
 *
 * Renders one section per account that has catalogue enabled
 * (plan.catalogueByAccount[accountId] === true).
 *
 * Each section shows a list of CatalogueCampaignConfig cards. Users can:
 *  - pick a catalogue per campaign
 *  - pick product sets as checkbox chips
 *  - set ad set duplicates via a number stepper
 *  - toggle "Show as Collection"
 *  - fill collection fields when collection=true
 *  - copy or remove campaigns
 *  - add new campaigns
 *
 * FabFunnel design system v1.2: lime #8FB821, rounded-2xl, Geist Mono,
 * off-white bgBase, primary-text for lime labels.
 */

import { useEffect } from "react";
import { Copy, Trash2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATALOGS } from "../../../data";
import type { PlanV2, CatalogueCampaignConfig } from "../../../types";

interface Props {
  plan: PlanV2;
  onPatch: (partial: Partial<PlanV2>) => void;
}

// ── Default campaign factory ──────────────────────────────────────────────────
function createDefaultCampaign(): CatalogueCampaignConfig {
  return {
    id: Math.random().toString(36).slice(2),
    catalogId: null,
    productSetIds: [],
    adSetDuplicates: 1,
    collection: false,
    promotedProductPreference: null,
    productSetSuggestion: null,
    primaryText: "",
    headline: "",
    description: "",
  };
}

// ── Helper: update campaigns for one account ─────────────────────────────────
function makeUpdater(
  plan: PlanV2,
  onPatch: (partial: Partial<PlanV2>) => void,
  accountId: string,
) {
  return (updater: (prev: CatalogueCampaignConfig[]) => CatalogueCampaignConfig[]) => {
    const current = plan.catalogueAccountConfigs?.[accountId] ?? [createDefaultCampaign()];
    onPatch({
      catalogueAccountConfigs: {
        ...plan.catalogueAccountConfigs,
        [accountId]: updater(current),
      },
    });
  };
}

// ── Promoted product preference options ──────────────────────────────────────
const PPP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "None" },
  { value: "promote_selected", label: "Promote selected" },
  { value: "promote_product_set", label: "Promote product set" },
  { value: "all_products", label: "All products" },
];

// ── NumberStepper ─────────────────────────────────────────────────────────────
function NumberStepper({
  value,
  min = 1,
  onChange,
}: {
  value: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7e5dc] bg-[#FAFAF7] text-[13px] text-foreground transition-colors hover:border-[#8FB821] hover:bg-[#F5FBE2] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2a2a2a] dark:bg-[#18181B] dark:hover:border-[#C3E165] dark:hover:bg-[#1D2A09]"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-7 text-center font-mono text-[13px] font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e7e5dc] bg-[#FAFAF7] text-[13px] text-foreground transition-colors hover:border-[#8FB821] hover:bg-[#F5FBE2] dark:border-[#2a2a2a] dark:bg-[#18181B] dark:hover:border-[#C3E165] dark:hover:bg-[#1D2A09]"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Switch ────────────────────────────────────────────────────────────────────
function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821]/60",
        checked
          ? "border-[#8FB821] bg-[#8FB821]"
          : "border-[#e7e5dc] bg-[#F0F0EC] dark:border-[#2a2a2a] dark:bg-[#2a2a2a]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full shadow transition-transform",
          checked ? "translate-x-4 bg-white" : "translate-x-0.5 bg-white/70",
        )}
      />
    </button>
  );
}

// ── CampaignCard ──────────────────────────────────────────────────────────────
function CampaignCard({
  campaign,
  index,
  total,
  onUpdate,
  onCopy,
  onRemove,
}: {
  campaign: CatalogueCampaignConfig;
  index: number;
  total: number;
  onUpdate: (updated: CatalogueCampaignConfig) => void;
  onCopy: () => void;
  onRemove: () => void;
}) {
  const catalogue = CATALOGS.find((c) => c.id === campaign.catalogId) ?? null;
  const productSets = catalogue?.productSets ?? [];

  const toggleProductSet = (psId: string) => {
    const current = new Set(campaign.productSetIds);
    if (current.has(psId)) current.delete(psId);
    else current.add(psId);
    onUpdate({ ...campaign, productSetIds: [...current] });
  };

  const n = campaign.productSetIds.length;
  const d = campaign.adSetDuplicates;

  return (
    <div className="rounded-2xl border border-[#e7e5dc] bg-[#FAFAF7] p-4 space-y-4 dark:border-[#2a2a2a] dark:bg-[#18181B]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          Campaign {index + 1}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Copy campaign"
            onClick={onCopy}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e7e5dc] text-[rgba(15,15,12,0.55)] transition-colors hover:border-[#8FB821] hover:bg-[#F5FBE2] hover:text-[#5B7611] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)] dark:hover:border-[#C3E165] dark:hover:bg-[#1D2A09] dark:hover:text-[#C3E165]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Remove campaign"
            disabled={total <= 1}
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e7e5dc] text-[rgba(15,15,12,0.55)] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35 dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)] dark:hover:border-red-700 dark:hover:bg-red-950/20 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Catalogue dropdown */}
      <div className="space-y-1.5">
        <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          Catalogue
        </label>
        <select
          value={campaign.catalogId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate({
              ...campaign,
              catalogId: val || null,
              productSetIds: [],
            });
          }}
          className="h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-[#FAFAF7] px-3.5 text-[13px] text-foreground outline-none transition-colors focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/30 dark:border-[#2a2a2a] dark:bg-[#18181B]"
        >
          <option value="">Select a catalogue…</option>
          {CATALOGS.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product sets */}
      {catalogue && (
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            Product sets
          </label>
          <div className="flex flex-wrap gap-2">
            {productSets.map((ps) => {
              const selected = campaign.productSetIds.includes(ps.id);
              return (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => toggleProductSet(ps.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    selected
                      ? "border-[#8FB821] bg-[#8FB821] text-[#121212]"
                      : "border-[#e7e5dc] bg-transparent text-[rgba(15,15,12,0.62)] hover:border-[#8FB821] hover:bg-[#F5FBE2] hover:text-[#5B7611] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.62)] dark:hover:border-[#C3E165] dark:hover:bg-[#1D2A09] dark:hover:text-[#C3E165]",
                  )}
                >
                  {ps.name}
                </button>
              );
            })}
          </div>
          {n > 0 && (
            <p className="font-mono text-[10px] text-[#5B7611] dark:text-[#C3E165]">
              {n} product set{n !== 1 ? "s" : ""} → {n * d} ad set{n * d !== 1 ? "s" : ""}, 1 ad each
            </p>
          )}
        </div>
      )}

      {/* Ad set duplicates */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">Ad set copies per product set</p>
          <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            Min 1 — multiplies ad sets per set
          </p>
        </div>
        <NumberStepper
          value={campaign.adSetDuplicates}
          min={1}
          onChange={(v) => onUpdate({ ...campaign, adSetDuplicates: v })}
        />
      </div>

      {/* Collection toggle */}
      <div className="space-y-3">
        <div className="border-t border-[#e7e5dc] pt-3 dark:border-[#2a2a2a]" />
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-foreground">Show as Collection</span>
          <Switch
            checked={campaign.collection}
            onChange={(v) => onUpdate({ ...campaign, collection: v })}
          />
        </div>

        {/* Collection fields */}
        {campaign.collection && (
          <div className="space-y-3 rounded-xl border border-[#e7e5dc] bg-[#F5FBE2] p-3 dark:border-[#2a2a2a] dark:bg-[#1D2A09]">
            {/* Promoted product preference */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Promoted product preference
              </label>
              <select
                value={campaign.promotedProductPreference ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...campaign,
                    promotedProductPreference: e.target.value || null,
                  })
                }
                className="h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-[#FAFAF7] px-3.5 text-[13px] text-foreground outline-none transition-colors focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/30 dark:border-[#2a2a2a] dark:bg-[#18181B]"
              >
                {PPP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product set suggestion */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Product set suggestion{" "}
                <span className="normal-case tracking-normal opacity-60">(optional)</span>
              </label>
              <select
                value={campaign.productSetSuggestion ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...campaign,
                    productSetSuggestion: e.target.value || null,
                  })
                }
                className="h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-[#FAFAF7] px-3.5 text-[13px] text-foreground outline-none transition-colors focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/30 dark:border-[#2a2a2a] dark:bg-[#18181B]"
              >
                {PPP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary text */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Primary text
              </label>
              <textarea
                value={campaign.primaryText}
                onChange={(e) => onUpdate({ ...campaign, primaryText: e.target.value })}
                rows={2}
                placeholder="Enter primary text…"
                className="w-full resize-none rounded-[28px] border border-[#e7e5dc] bg-[#FAFAF7] px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-[rgba(15,15,12,0.35)] focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/30 dark:border-[#2a2a2a] dark:bg-[#18181B] dark:placeholder:text-[rgba(255,255,255,0.35)]"
              />
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Headline
              </label>
              <input
                type="text"
                value={campaign.headline}
                onChange={(e) => onUpdate({ ...campaign, headline: e.target.value })}
                placeholder="Enter headline…"
                className="h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-[#FAFAF7] px-3.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-[rgba(15,15,12,0.35)] focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/30 dark:border-[#2a2a2a] dark:bg-[#18181B] dark:placeholder:text-[rgba(255,255,255,0.35)]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Description{" "}
                <span className="normal-case tracking-normal opacity-60">(optional)</span>
              </label>
              <input
                type="text"
                value={campaign.description}
                onChange={(e) => onUpdate({ ...campaign, description: e.target.value })}
                placeholder="Enter description…"
                className="h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-[#FAFAF7] px-3.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-[rgba(15,15,12,0.35)] focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/30 dark:border-[#2a2a2a] dark:bg-[#18181B] dark:placeholder:text-[rgba(255,255,255,0.35)]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AccountSection ─────────────────────────────────────────────────────────────
function AccountSection({
  accountId,
  accountName,
  plan,
  onPatch,
}: {
  accountId: string;
  accountName: string;
  plan: PlanV2;
  onPatch: (partial: Partial<PlanV2>) => void;
}) {
  const updateCampaigns = makeUpdater(plan, onPatch, accountId);
  const campaigns = plan.catalogueAccountConfigs?.[accountId] ?? [];

  // Auto-init with 1 default campaign on first mount if none exists
  useEffect(() => {
    if (!plan.catalogueAccountConfigs?.[accountId]?.length) {
      onPatch({
        catalogueAccountConfigs: {
          ...plan.catalogueAccountConfigs,
          [accountId]: [createDefaultCampaign()],
        },
      });
    }
    // Only fires when accountId changes — intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const displayCampaigns =
    campaigns.length > 0 ? campaigns : [createDefaultCampaign()];

  const handleUpdate = (idx: number, updated: CatalogueCampaignConfig) => {
    updateCampaigns((prev) => prev.map((c, i) => (i === idx ? updated : c)));
  };

  const handleCopy = (idx: number) => {
    updateCampaigns((prev) => {
      const copy = { ...prev[idx], id: Math.random().toString(36).slice(2) };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleRemove = (idx: number) => {
    updateCampaigns((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    updateCampaigns((prev) => [...prev, createDefaultCampaign()]);
  };

  return (
    <div className="space-y-3">
      {/* Account header */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          {accountName}
        </span>
        <div className="flex-1 border-t border-[#e7e5dc] dark:border-[#2a2a2a]" />
      </div>

      {/* Campaign cards */}
      <div className="space-y-3">
        {displayCampaigns.map((campaign, idx) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            index={idx}
            total={displayCampaigns.length}
            onUpdate={(updated) => handleUpdate(idx, updated)}
            onCopy={() => handleCopy(idx)}
            onRemove={() => handleRemove(idx)}
          />
        ))}
      </div>

      {/* Add campaign button */}
      <button
        type="button"
        onClick={handleAdd}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#e7e5dc] py-2.5 font-mono text-[11px] text-[rgba(15,15,12,0.55)] transition-colors hover:border-[#8FB821] hover:bg-[#F5FBE2] hover:text-[#5B7611] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)] dark:hover:border-[#C3E165] dark:hover:bg-[#1D2A09] dark:hover:text-[#C3E165]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Campaign
      </button>
    </div>
  );
}

// ── CatalogueCampaignEditor (root export) ─────────────────────────────────────
export function CatalogueCampaignEditor({ plan, onPatch }: Props) {
  // Collect accountIds where catalogue is enabled, preserving target order
  const catalogueAccountIds = plan.targets
    .filter((t) => plan.catalogueByAccount?.[t.accountId] === true)
    .map((t) => t.accountId);

  if (catalogueAccountIds.length === 0) {
    return (
      <p className="py-6 text-center font-mono text-[11px] text-muted-foreground">
        No accounts have catalogue enabled. Enable it per account in Setup.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {catalogueAccountIds.map((accountId) => {
        const target = plan.targets.find((t) => t.accountId === accountId);
        const accountName = target?.accountName ?? accountId;
        return (
          <AccountSection
            key={accountId}
            accountId={accountId}
            accountName={accountName}
            plan={plan}
            onPatch={onPatch}
          />
        );
      })}
    </div>
  );
}
