/**
 * Step3V2Panel — Decision 18 + 19.
 * V2 variant of Step 3 distribution layout:
 *  LEFT  (280px): scrollable account list with checkboxes + status chips.
 *  RIGHT: per-account creative selection (top) + distribution/structure (bottom).
 *         Bulk mode when 2+ accounts selected: no creative section, just structure.
 *
 * Creative arrival prompt (Decision 19): when creatives > 0 and
 * creativeDistributionMode is not set, shows an inline inline prompt to spread
 * creatives equally or configure per account.
 *
 * Forced to v2 when plan.catalogueToggle or post-id flows are active.
 */
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanV2 } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import CreativeTray from "../spread/CreativeTray";
import AdContent from "../spread/AdContent";
import AccountDistributionPanel from "./AccountDistributionPanel";

// ── Creative distribution mode (Decision 19) ─────────────────────────────────
type CreativeDistMode = "auto" | "manual" | null;

// ── Source chips ──────────────────────────────────────────────────────────────
type SourceChip = "genie" | "library" | "upload" | "post_id";
const SOURCE_CHIPS: { id: SourceChip; label: string }[] = [
  { id: "genie",   label: "Genie" },
  { id: "library", label: "Library" },
  { id: "upload",  label: "Upload" },
  { id: "post_id", label: "Post ID" },
];

// ── Account status chip ───────────────────────────────────────────────────────
function AccountStatusChip({ accountId, plan }: { accountId: string; plan: PlanV2 }) {
  const adCount =
    plan.structureByAccount[accountId]
      ? plan.structureByAccount[accountId].campaigns *
        plan.structureByAccount[accountId].adSetsPerCampaign *
        plan.structureByAccount[accountId].adsPerAdSet
      : plan.structure.campaigns *
        plan.structure.adSetsPerCampaign *
        plan.structure.adsPerAdSet;

  const isConfigured = accountId in plan.structureByAccount;

  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
        {adCount} ads
      </span>
      {isConfigured && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#5B7611] dark:text-[#C3E165]">
          Custom
        </span>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Step3V2Panel({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;

  const uniqueAcctIds = Array.from(new Set(plan.targets.map((t) => t.accountId)));
  const [selectedAcctIds, setSelectedAcctIds] = useState<Set<string>>(
    new Set(uniqueAcctIds.slice(0, 1)),
  );
  const [activeSource, setActiveSource] = useState<SourceChip>("genie");

  // Creative arrival prompt state (Decision 19)
  const [creativeDistMode, setCreativeDistMode] = useState<CreativeDistMode>(null);
  const showArrivalPrompt =
    plan.creatives.length > 0 &&
    creativeDistMode === null &&
    uniqueAcctIds.length > 1;

  const toggleAcct = (id: string, multiSelect = false) => {
    setSelectedAcctIds((prev) => {
      if (multiSelect) {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          if (next.size === 0) next.add(uniqueAcctIds[0]); // always keep 1
        } else {
          next.add(id);
        }
        return next;
      }
      // single click → select only this account
      return new Set([id]);
    });
  };

  const selectAll = () => setSelectedAcctIds(new Set(uniqueAcctIds));

  const isBulkMode = selectedAcctIds.size > 1;
  const singleSelectedId = !isBulkMode
    ? Array.from(selectedAcctIds)[0] ?? uniqueAcctIds[0]
    : null;

  const handleAcceptAutoSpread = () => {
    setCreativeDistMode("auto");
    // Equal split: creatives stay global — no per-account override needed
  };

  const handleManualPerAccount = () => {
    setCreativeDistMode("manual");
  };

  if (uniqueAcctIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
        Add ad accounts in Step 2 to use the V2 layout.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── LEFT: Account list panel ── */}
      <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-border bg-card">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Accounts
            </span>
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Select all
            </button>
          </div>
        </div>

        <div className="space-y-1 p-2">
          {uniqueAcctIds.map((id) => {
            const name = plan.targets.find((t) => t.accountId === id)?.accountName ?? id;
            const isActive = selectedAcctIds.has(id);

            return (
              <div
                key={id}
                className={cn(
                  "flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 transition-colors",
                  isActive
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                )}
                onClick={() => toggleAcct(id)}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleAcct(id, true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 shrink-0 rounded border border-border accent-primary"
                  aria-label={`Select ${name}`}
                />
                <span className="flex-1 truncate text-[13px] font-medium">{name}</span>
                <AccountStatusChip accountId={id} plan={plan} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Detail pane ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* Creative arrival prompt (Decision 19) */}
        {showArrivalPrompt && (
          <Card className="mb-5 rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-[13px] font-medium text-foreground">
                Distribute {plan.creatives.length} creative{plan.creatives.length !== 1 ? "s" : ""} across accounts automatically?
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Equal split assigns the same creatives to every account. Manual lets you configure per account.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAutoSpread}
                  className="rounded-full bg-foreground px-4 py-1.5 text-[12px] font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  Yes, spread equally
                </button>
                <button
                  type="button"
                  onClick={handleManualPerAccount}
                  className="rounded-full border border-border px-4 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  No, I&apos;ll set per account
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Zero-creatives prompt — how to add creatives across accounts */}
        {plan.creatives.length === 0 && creativeDistMode === null && uniqueAcctIds.length > 1 && (
          <Card className="mb-5 rounded-2xl border-border bg-card">
            <CardContent className="p-4">
              <p className="text-[13px] font-medium text-foreground">How do you want to add creatives?</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Add once and apply to all accounts, or configure each account separately.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreativeDistMode("auto")}
                  className="rounded-full bg-foreground px-4 py-1.5 text-[12px] font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  All at once
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeDistMode("manual")}
                  className="rounded-full border border-border px-4 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Per account
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {isBulkMode ? (
          /* Bulk edit mode */
          <div className="space-y-5">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm">
              <p className="font-mono text-[12px] text-[color:var(--color-info,#1677ff)]">
                Editing {selectedAcctIds.size} accounts in bulk. Changes apply to all selected accounts.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Structure
              </span>
              <AccountDistributionPanel
                plan={plan}
                onPatch={patch}
              />
            </div>
          </div>
        ) : (
          /* Single account detail */
          <div className="space-y-6">
            {singleSelectedId && (
              <>
                {/* Account header */}
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                    {plan.targets.find((t) => t.accountId === singleSelectedId)?.accountName ??
                      singleSelectedId}
                  </h3>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    Per-account configuration
                  </p>
                </div>

                {/* Top half: Creative selection */}
                <div className="space-y-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Creative selection
                  </span>

                  {/* Source toggle chips */}
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_CHIPS.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => {
                          setActiveSource(chip.id);
                          const t = chip.id === "post_id" ? "post_id" : chip.id;
                          patch({ source: { type: t as typeof plan.source.type, ref: null } });
                        }}
                        aria-pressed={activeSource === chip.id}
                        className={cn(
                          "fab-focus rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          activeSource === chip.id
                            ? "border-foreground/50 bg-foreground/[0.05] text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                        )}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Creative tray */}
                  <CreativeTray flow={flow} />
                </div>

                {/* Divider */}
                <div className="border-t border-border/40" />

                {/* Bottom half: Distribution */}
                <div className="space-y-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Distribution and structure
                  </span>
                  <AccountDistributionPanel
                    plan={plan}
                    onPatch={patch}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
